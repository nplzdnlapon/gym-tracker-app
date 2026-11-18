/**
 * Vercel Serverless Function: /api/analyze-food
 * Menghitung estimasi kalori & makronutrisi makanan (teks dan/atau foto)
 * menggunakan Google Gemini API (gemini-2.5-flash).
 */

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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
      })
    });

    const geminiData = await geminiResponse.json().catch(() => null);

    if (!geminiResponse.ok) {
      const apiErrMsg = geminiData?.error?.message || `Gemini API mengembalikan status ${geminiResponse.status}`;
      return res.status(geminiResponse.status).json({
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
      notes: String(parsed.notes || "Estimasi porsi standar ahli gizi olahraga.").trim()
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error di /api/analyze-food:", error);
    return res.status(500).json({
      error: error?.message || "Terjadi kesalahan saat menganalisis nutrisi makanan."
    });
  }
};
