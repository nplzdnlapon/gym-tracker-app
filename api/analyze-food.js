/**
 * Vercel Serverless Function: /api/analyze-food
 * Menghitung estimasi kalori & makronutrisi makanan (teks dan/atau foto)
 * menggunakan Google Gemini API terbaru (gemini-3.8-flash & gemini-3.8-flash-lite)
 * dengan mekanisme Auto-Retry (1.5s) & Fallback Model.
 */

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

const RETRY_DELAY_MS = 1500;
const BUSY_ERROR_MESSAGE =
  "Server AI sedang sangat sibuk, silakan coba klik analisis lagi dalam beberapa detik.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHighDemandStatus(status, errText = "") {
  if (status === 503 || status === 429 || status === 502 || status === 504) {
    return true;
  }
  const lower = String(errText || "").toLowerCase();
  return (
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("unavailable")
  );
}

async function callGeminiModel(modelName, apiKey, requestPayload) {
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
  return { response, data };
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY belum dikonfigurasi di Environment Variables server Vercel."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const textPrompt = typeof body.textPrompt === "string" ? body.textPrompt.trim() : "";
    const rawBase64 = typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const mimeType = typeof body.mimeType === "string" && body.mimeType.startsWith("image/")
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
      "Anda WAJIB mengembalikan response murni dalam format JSON tanpa markdown atau teks tambahan dengan struktur persis berikut:",
      '{ "foodName": "Nama ringkas menu", "calories": angka_bulat, "protein": angka_bulat, "carbs": angka_bulat, "fat": angka_bulat, "notes": "Penjelasan singkat estimasi porsi" }'
    ].join(" ");

    const userParts = [];

    if (cleanBase64) {
      userParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    const promptInstruction = textPrompt
      ? `Analisis kandungan gizi makanan berikut: "${textPrompt}". ${cleanBase64 ? "Cocokkan juga dengan foto makanan yang dilampirkan." : ""}`
      : "Analisis foto makanan ini, kenali jenis menu dan perkiraan porsinya, lalu hitung estimasi kalori, protein, karbohidrat, dan lemaknya.";

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

    let geminiResponse = null;
    let geminiData = null;
    let usedModel = GEMINI_MODELS[0];
    let encounteredBusyError = false;
    let lastErrorStatus = 503;
    let lastErrorMessage = "";

    for (let i = 0; i < GEMINI_MODELS.length; i += 1) {
      const modelName = GEMINI_MODELS[i];
      usedModel = modelName;

      // Percobaan pertama pada model saat ini
      let attempt = await callGeminiModel(modelName, apiKey, requestPayload);
      geminiResponse = attempt.response;
      geminiData = attempt.data;

      if (geminiResponse.ok) {
        break;
      }

      const errMsg = geminiData?.error?.message || "";
      const isBusy = isHighDemandStatus(geminiResponse.status, errMsg);

      if (isBusy) {
        encounteredBusyError = true;
        lastErrorStatus = geminiResponse.status;
        lastErrorMessage = errMsg;

        // Auto-retry 1 kali setelah jeda 1.5 detik pada model yang sama
        await sleep(RETRY_DELAY_MS);
        attempt = await callGeminiModel(modelName, apiKey, requestPayload);
        geminiResponse = attempt.response;
        geminiData = attempt.data;

        if (geminiResponse.ok) {
          break;
        }

        lastErrorStatus = geminiResponse.status;
        lastErrorMessage = geminiData?.error?.message || errMsg;
        continue;
      }

      // Jika model belum tersedia di tier project (404), lanjut fallback ke model terbaru berikutnya
      if (geminiResponse.status === 404 && i < GEMINI_MODELS.length - 1) {
        lastErrorStatus = geminiResponse.status;
        lastErrorMessage = errMsg;
        continue;
      }

      // Error lain (mis. API Key tidak valid): hentikan loop
      lastErrorStatus = geminiResponse.status;
      lastErrorMessage = errMsg;
      break;
    }

    if (!geminiResponse || !geminiResponse.ok) {
      if (encounteredBusyError || isHighDemandStatus(lastErrorStatus, lastErrorMessage)) {
        return res.status(503).json({
          error: BUSY_ERROR_MESSAGE
        });
      }

      const apiErrMsg = lastErrorMessage || `Gemini API mengembalikan status ${lastErrorStatus}`;
      return res.status(lastErrorStatus || 500).json({
        error: `Gagal menganalisis makanan: ${apiErrMsg}`
      });
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!rawText) {
      return res.status(502).json({
        error: "Gemini AI tidak mengembalikan hasil analisis. Coba deskripsi atau foto yang lebih jelas."
      });
    }

    const cleanedJsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedJsonText);

    const result = {
      foodName: String(parsed.foodName || textPrompt || "Makanan Hasil Analisis AI").trim().slice(0, 80),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      notes: String(parsed.notes || "Estimasi porsi standar ahli gizi olahraga.").trim(),
      modelUsed: usedModel
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error di /api/analyze-food:", error);
    return res.status(500).json({
      error: error?.message || "Terjadi kesalahan saat menganalisis nutrisi makanan."
    });
  }
};
