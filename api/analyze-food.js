/**
 * Vercel Serverless Function: /api/analyze-food
 * Menghitung estimasi kalori & makronutrisi makanan (teks dan/atau foto)
 * menggunakan Groq API sebagai mesin utama dan Google Gemini API
 * (gemini-3.8-flash -> gemini-3.8-flash-lite) sebagai fallback cadangan.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_TEXT_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.1-8b-instant",
  "meta-llama/llama-4-scout-17b-16e-instruct"
];

const GROQ_VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct"
];

const GEMINI_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite"
];

function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Response AI kosong.");
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Format JSON hasil analisis AI tidak valid.");
  }
}

function normalizeFoodResult(parsed, fallbackName, modelUsed) {
  return {
    foodName: String(parsed?.foodName || fallbackName || "Makanan Hasil Analisis AI")
      .trim()
      .slice(0, 80),
    calories: Math.max(0, Math.round(Number(parsed?.calories) || 0)),
    protein: Math.max(0, Math.round(Number(parsed?.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(parsed?.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(parsed?.fat) || 0)),
    notes: String(parsed?.notes || "Estimasi porsi standar ahli gizi olahraga.").trim(),
    modelUsed
  };
}

async function callGroqApi({ apiKey, systemPrompt, promptInstruction, cleanBase64, mimeType }) {
  const isVision = Boolean(cleanBase64);
  const candidateModels = isVision ? GROQ_VISION_MODELS : GROQ_TEXT_MODELS;

  const modelErrors = [];

  for (const rawModel of candidateModels) {
    const model = String(rawModel).replace(/^\[|\]$/g, "").trim();

    try {
      const userContent = isVision
        ? [
            { type: "text", text: promptInstruction },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${cleanBase64}`
              }
            }
          ]
        : promptInstruction;

      const payload = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 512,
        response_format: { type: "json_object" }
      };

      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = data?.error?.message || `Groq HTTP ${response.status}`;
        modelErrors.push(`[${model}] ${errMsg}`);

        // Jika model mengembalikan "does not exist" atau error lainnya, langsung lanjut ke model berikutnya tanpa menunggu
        if (errMsg.toLowerCase().includes("does not exist")) {
          continue;
        }
        continue;
      }

      const rawText = data?.choices?.[0]?.message?.content?.trim();
      const parsed = cleanAndParseJson(rawText);
      return { parsed, modelUsed: model };
    } catch (err) {
      modelErrors.push(`[${model}] ${err?.message || String(err)}`);
      continue;
    }
  }

  throw new Error(modelErrors.join(" ; ") || "Groq API gagal memproses permintaan.");
}

async function callGeminiFallback({ apiKey, systemPrompt, promptInstruction, cleanBase64, mimeType }) {
  const userParts = [];

  if (cleanBase64) {
    userParts.push({
      inlineData: {
        mimeType,
        data: cleanBase64
      }
    });
  }

  userParts.push({ text: promptInstruction });

  const requestPayload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: userParts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          foodName: { type: "STRING" },
          calories: { type: "INTEGER" },
          protein: { type: "INTEGER" },
          carbs: { type: "INTEGER" },
          fat: { type: "INTEGER" },
          notes: { type: "STRING" }
        },
        required: ["foodName", "calories", "protein", "carbs", "fat", "notes"]
      }
    }
  };

  let lastStatus = 503;
  const geminiErrors = [];

  for (const modelName of GEMINI_FALLBACK_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        const rawText = data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        const parsed = cleanAndParseJson(rawText);
        return { parsed, modelUsed: modelName };
      }

      lastStatus = response.status;
      const errMsg = data?.error?.message || `Gemini HTTP ${response.status}`;
      geminiErrors.push(`[${modelName}] ${errMsg}`);
    } catch (err) {
      geminiErrors.push(`[${modelName}] ${err?.message || String(err)}`);
    }
  }

  const error = new Error(geminiErrors.join(" ; ") || "Semua model Gemini fallback gagal.");
  error.status = lastStatus;
  throw error;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan. Gunakan POST."
    });
  }

  const groqApiKey = (process.env.GROQ_API_KEY || "").trim();
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!groqApiKey && !geminiApiKey) {
    return res.status(500).json({
      error:
        "GROQ_API_KEY maupun GEMINI_API_KEY belum dikonfigurasi di Environment Variables server Vercel."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const textPrompt = typeof body.textPrompt === "string" ? body.textPrompt.trim() : "";
    const rawBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.startsWith("image/")
        ? body.mimeType
        : "image/jpeg";

    // Bersihkan prefix data URL jika dikirim sebagai data:image/...;base64,...
    const cleanBase64 = rawBase64.includes(",") ? rawBase64.split(",")[1].trim() : rawBase64;

    if (!textPrompt && !cleanBase64) {
      return res.status(400).json({
        error: "Masukkan deskripsi teks makanan atau unggah foto makanan terlebih dahulu."
      });
    }

    const systemPrompt = [
      "Anda adalah ahli gizi olahraga (sports nutritionist) Indonesia yang berpengalaman menghitung kalori dan makronutrisi untuk atlet gym, powerbuilding, fat loss, dan bulking.",
      "Analisis deskripsi makanan dan/atau foto makanan yang diberikan oleh pengguna.",
      "Gunakan acuan porsi umum kuliner Indonesia maupun makanan sehari-hari jika berat gram tidak disebutkan secara spesifik.",
      "Anda WAJIB mengembalikan response murni dalam format JSON object valid tanpa markdown atau teks tambahan dengan struktur persis berikut:",
      '{ "foodName": "Nama ringkas menu", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "notes": "Penjelasan singkat estimasi porsi" }',
      "Pastikan nilai calories, protein, carbs, dan fat berupa angka bulat (integer)."
    ].join(" ");

    const promptInstruction = textPrompt
      ? `Analisis kandungan gizi makanan berikut dalam format JSON: "${textPrompt}". ${
          cleanBase64 ? "Cocokkan juga dengan foto makanan yang dilampirkan." : ""
        }`
      : "Analisis foto makanan ini dalam format JSON, kenali jenis menu dan perkiraan porsinya, lalu hitung estimasi kalori (calories), protein, karbohidrat (carbs), dan lemaknya (fat).";

    let groqErrorReason = "";

    // 1. PRIORITAS UTAMA: Groq API (process.env.GROQ_API_KEY)
    if (groqApiKey) {
      try {
        const { parsed, modelUsed } = await callGroqApi({
          apiKey: groqApiKey,
          systemPrompt,
          promptInstruction,
          cleanBase64,
          mimeType
        });

        const result = normalizeFoodResult(parsed, textPrompt, modelUsed);
        return res.status(200).json(result);
      } catch (err) {
        groqErrorReason = err?.message || String(err);
        console.warn("Groq API gagal, mencoba fallback ke Gemini API:", groqErrorReason);
      }
    } else {
      groqErrorReason = "GROQ_API_KEY tidak ditemukan / belum diset di Environment Variables Vercel";
      console.warn(groqErrorReason);
    }

    // 2. FALLBACK CADANGAN: Gemini API (gemini-3.8-flash -> gemini-3.8-flash-lite)
    if (geminiApiKey) {
      try {
        const { parsed, modelUsed } = await callGeminiFallback({
          apiKey: geminiApiKey,
          systemPrompt,
          promptInstruction,
          cleanBase64,
          mimeType
        });

        const result = normalizeFoodResult(parsed, textPrompt, modelUsed);
        return res.status(200).json(result);
      } catch (geminiErr) {
        const geminiErrorReason = geminiErr?.message || String(geminiErr);
        console.error("Fallback Gemini API juga gagal:", geminiErrorReason);
        const status = geminiErr?.status || 503;
        return res.status(status).json({
          error: `Groq gagal (${groqErrorReason}) | Fallback Gemini gagal (${geminiErrorReason})`
        });
      }
    }

    // Jika Groq gagal dan GEMINI_API_KEY tidak tersedia
    return res.status(503).json({
      error: `Groq gagal (${groqErrorReason}) | Fallback Gemini dilewati (GEMINI_API_KEY belum diset di Vercel)`
    });
  } catch (error) {
    console.error("Error di /api/analyze-food:", error);
    return res.status(500).json({
      error: error?.message || "Terjadi kesalahan saat menganalisis nutrisi makanan."
    });
  }
};
