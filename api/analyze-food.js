/**
 * Vercel Serverless Function: /api/analyze-food
 * Menghitung estimasi kalori & makronutrisi makanan (teks dan/atau foto):
 * - Input HANYA Teks: Groq API (openai/gpt-oss-120b) sebagai utama, fallback ke array model Gemini.
 * - Input FOTO (imageBase64): Langsung memanggil array model Gemini secara berurutan
 *   (['gemini-3.5-flash-lite', 'gemini-4-hydrogen', 'gemini-3.8-flash']).
 *   Jika salah satu model terkena 429 (Quota/Rate Limit) atau 503 (High Demand),
 *   langsung pindah (fallback) ke model berikutnya tanpa retry di model yang sama.
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_TEXT_MODELS = [
  "openai/gpt-oss-120b"
];

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-4-hydrogen",
  "gemini-3.8-flash"
];

const RATE_LIMIT_FRIENDLY_MESSAGE =
  "Batas analisis foto per menit tercapai, silakan tunggu sekitar 30 detik lalu coba lagi.";

function isQuotaOrHighDemandError(status, errMsg = "") {
  if (status === 429 || status === 503) {
    return true;
  }
  const lower = String(errMsg || "").toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable")
  );
}

function safeParseJsonFromText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Response AI kosong.");
  }

  // 1. Bersihkan blok kode markdown (```json dan ```)
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // 2. Ekstrak substring dari kurung kurawal pertama '{' sampai kurung kurawal terakhir '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("Tidak ditemukan objek JSON ({...}) pada hasil analisis AI.");
  }

  const jsonSubstring = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSubstring);
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

async function callGroqTextApi({ apiKey, systemPrompt, promptInstruction }) {
  const modelErrors = [];

  for (const rawModel of GROQ_TEXT_MODELS) {
    const model = String(rawModel).replace(/^\[|\]$/g, "").trim();

    try {
      const payload = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: promptInstruction
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 2048
      };

      if (model.includes("gpt-oss")) {
        payload.reasoning_effort = "low";
      }

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
        continue;
      }

      const msg = data?.choices?.[0]?.message;
      const contentText = typeof msg?.content === "string" ? msg.content.trim() : "";
      const reasoningText = typeof msg?.reasoning === "string" ? msg.reasoning.trim() : "";
      const rawText = contentText || reasoningText;

      const parsed = safeParseJsonFromText(rawText);
      return { parsed, modelUsed: model };
    } catch (err) {
      modelErrors.push(`[${model}] ${err?.message || String(err)}`);
      continue;
    }
  }

  throw new Error(modelErrors.join(" ; ") || "Groq API gagal memproses permintaan.");
}

async function callGeminiApi({ apiKey, systemPrompt, promptInstruction, cleanBase64, mimeType }) {
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
  let encounteredRateLimit = false;
  const geminiErrors = [];

  for (const modelName of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      // Panggil sekali per model; jika 429 atau 503 langsung lanjut ke model berikutnya di GEMINI_MODELS
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

        const parsed = safeParseJsonFromText(rawText);
        return { parsed, modelUsed: modelName };
      }

      lastStatus = response.status;
      const errMsg = data?.error?.message || `Gemini HTTP ${response.status}`;

      if (isQuotaOrHighDemandError(response.status, errMsg)) {
        encounteredRateLimit = true;
      }

      geminiErrors.push(`[${modelName}] ${errMsg}`);
      continue;
    } catch (err) {
      geminiErrors.push(`[${modelName}] ${err?.message || String(err)}`);
      continue;
    }
  }

  const error = new Error(
    encounteredRateLimit
      ? RATE_LIMIT_FRIENDLY_MESSAGE
      : geminiErrors.join(" ; ") || "Model Gemini gagal memproses permintaan."
  );
  error.status = encounteredRateLimit ? 429 : lastStatus;
  error.isRateLimit = encounteredRateLimit;
  error.details = geminiErrors.join(" ; ");
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
    const hasImage = Boolean(cleanBase64);

    if (!textPrompt && !hasImage) {
      return res.status(400).json({
        error: "Masukkan deskripsi teks makanan atau unggah foto makanan terlebih dahulu."
      });
    }

    const systemPrompt = [
      "Anda adalah ahli gizi olahraga (sports nutritionist) Indonesia yang berpengalaman menghitung kalori dan makronutrisi untuk atlet gym, powerbuilding, fat loss, dan bulking.",
      "Analisis deskripsi makanan dan/atau foto makanan yang diberikan oleh pengguna.",
      "Gunakan acuan porsi umum kuliner Indonesia maupun makanan sehari-hari jika berat gram tidak disebutkan secara spesifik.",
      "WAJIB kembalikan HANYA raw JSON object yang valid tanpa teks tambahan atau markdown.",
      'Gunakan struktur JSON persis berikut: { "foodName": "Nama ringkas menu", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "notes": "Penjelasan singkat estimasi porsi" }',
      "Pastikan nilai calories, protein, carbs, dan fat berupa angka bulat (integer)."
    ].join(" ");

    const promptInstruction = textPrompt
      ? `Analisis kandungan gizi makanan berikut dan WAJIB kembalikan HANYA raw JSON object yang valid tanpa teks tambahan atau markdown: "${textPrompt}". ${
          hasImage ? "Cocokkan juga dengan foto makanan yang dilampirkan." : ""
        }`
      : "Analisis foto makanan ini, kenali jenis menu dan perkiraan porsinya, lalu hitung estimasi kalori (calories), protein, karbohidrat (carbs), dan lemaknya (fat). WAJIB kembalikan HANYA raw JSON object yang valid tanpa teks tambahan atau markdown.";

    // JALUR 1: Input berisi FOTO (imageBase64 ada) -> Langsung gunakan urutan model Gemini
    if (hasImage) {
      if (!geminiApiKey) {
        return res.status(500).json({
          error: "Analisis foto makanan membutuhkan GEMINI_API_KEY di Environment Variables Vercel."
        });
      }

      try {
        const { parsed, modelUsed } = await callGeminiApi({
          apiKey: geminiApiKey,
          systemPrompt,
          promptInstruction,
          cleanBase64,
          mimeType
        });

        const result = normalizeFoodResult(parsed, textPrompt, modelUsed);
        return res.status(200).json(result);
      } catch (geminiErr) {
        console.error("Semua model Gemini gagal untuk analisis foto:", geminiErr?.details || geminiErr);
        const status = geminiErr?.status || 503;
        return res.status(status).json({
          error: geminiErr?.isRateLimit
            ? RATE_LIMIT_FRIENDLY_MESSAGE
            : geminiErr?.message || RATE_LIMIT_FRIENDLY_MESSAGE
        });
      }
    }

    // JALUR 2: Input HANYA Teks (tanpa imageBase64) -> Groq (openai/gpt-oss-120b) utama, fallback ke urutan model Gemini
    let groqErrorReason = "";

    if (groqApiKey) {
      try {
        const { parsed, modelUsed } = await callGroqTextApi({
          apiKey: groqApiKey,
          systemPrompt,
          promptInstruction
        });

        const result = normalizeFoodResult(parsed, textPrompt, modelUsed);
        return res.status(200).json(result);
      } catch (err) {
        groqErrorReason = err?.message || String(err);
        console.warn("Groq API teks gagal, mencoba fallback ke Gemini API:", groqErrorReason);
      }
    } else {
      groqErrorReason = "GROQ_API_KEY tidak ditemukan / belum diset di Environment Variables Vercel";
      console.warn(groqErrorReason);
    }

    if (geminiApiKey) {
      try {
        const { parsed, modelUsed } = await callGeminiApi({
          apiKey: geminiApiKey,
          systemPrompt,
          promptInstruction,
          cleanBase64: "",
          mimeType
        });

        const result = normalizeFoodResult(parsed, textPrompt, modelUsed);
        return res.status(200).json(result);
      } catch (geminiErr) {
        console.error("Fallback Gemini API juga gagal:", geminiErr?.details || geminiErr);
        const status = geminiErr?.status || 503;
        if (geminiErr?.isRateLimit) {
          return res.status(429).json({
            error: RATE_LIMIT_FRIENDLY_MESSAGE
          });
        }
        return res.status(status).json({
          error: `Groq gagal (${groqErrorReason}) | Fallback Gemini gagal (${geminiErr?.details || geminiErr?.message})`
        });
      }
    }

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
