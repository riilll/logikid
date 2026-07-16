import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body; // Base64 string "data:image/png;base64,iVBORw..." atau murni base64

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image data tidak ditemukan." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Bersihkan prefix base64 jika ada
    const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // 1. Coba gunakan Google Gemini 2.5 Flash Multimodal Vision API jika GEMINI_API_KEY tersedia
    if (apiKey) {
      try {
        const prompt = `Perhatikan gambar coretan angka tulisan tangan anak usia SD (0 sampai 9999) pada kanvas hitam berikut dengan sangat teliti.
Tentukan angka berapa (baik 1 digit, 2 digit, atau lebih) yang terlukis di gambar tersebut.
Perhatikan dengan sangat akurat perbedaan kritis berikut:
- Angka 6 vs 8: Angka 6 memiliki loop di bawah dan garis meluncur dari atas kiri, bagian kanan atasnya terbuka/kosong. Angka 8 memiliki dua loop (atas dan bawah tertutup).
- Angka 9 vs 8: Angka 9 memiliki loop di atas dan tiang turun ke bawah, bagian kiri bawahnya terbuka/kosong.
- Angka 0 vs 8: Angka 0 adalah satu lingkaran besar dengan lubang kosong di tengah, sedangkan angka 8 bersilang padat di tengah.
- Angka multi-digit (misal 15, 24, 42, 100): periksa setiap angka dari kiri ke kanan dengan rapi.

Keluarkan HANYA format JSON murni:
{
  "digit": <number 0-9999>,
  "confidence": <number 0.0 - 1.0>,
  "reason": "..."
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOutput) {
            const parsed = JSON.parse(textOutput.replace(/```json|```/g, "").trim());
            if (typeof parsed.digit === "number" && parsed.digit >= 0 && parsed.digit <= 9999) {
              return NextResponse.json({
                success: true,
                digit: parsed.digit,
                confidence: parsed.confidence || 0.98,
                engine: "Google Gemini 2.5 Flash Multimodal Vision AI",
              });
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini Vision API error or timeout:", geminiErr);
        // Fallback ke server-side / client-side MNIST neural engine di bawah
      }
    }

    // 2. Jika API Key belum diatur atau gagal/offline, kembalikan status fallback agar Client
    // menggunakan Center-of-Mass Normalized 28x28 MNIST Neural Engine terintegrasi
    return NextResponse.json({
      success: false,
      fallbackToClientMNIST: true,
      message: "Menggunakan Center-of-Mass 28x28 MNIST Neural Engine on-device.",
    });
  } catch (error) {
    console.error("Error inside recognize-canvas API:", error);
    return NextResponse.json(
      { success: false, fallbackToClientMNIST: true, error: "Internal server error." },
      { status: 500 }
    );
  }
}
