import { NextRequest, NextResponse } from "next/server";
import { Quiz } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = body.category || "penjumlahan";
    const level = body.level || "mudah";
    const count = Math.min(Math.max(Number(body.count) || 3, 1), 10);

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Coba gunakan Gemini API jika GEMINI_API_KEY tersedia
    if (apiKey) {
      try {
        const prompt = `Buatkan ${count} soal matematika atau logika anak usia SD (6-11 tahun) dalam bahasa Indonesia dengan format JSON array.
Kategori: "${category}" (penjumlahan, perkalian, visual, atau soal_cerita)
Tingkat Kesulitan: "${level}" (mudah, sedang, atau sukar)

Ketentuan Khusus:
1. "pertanyaan": teks pertanyaan yang menarik dan mudah dipahami anak SD. Jika kategori "soal_cerita", buat cerita pendek tentang tokoh anak-anak (misal Dodi, Siti, Raka) dengan benda nyata.
2. "jawaban": hasil akhir berupa angka tunggal dalam string (misal "8", "15", "42"). Jawaban WAJIB berupa angka karena anak menjawab di kanvas angka!
3. "kategori": "${category}"
4. "level": "${level}"
5. "visual_helper": jika kategori "visual", wajib berikan rentetan emoji (misal "🍎🍎🍎" atau "⭐️⭐️⭐️⭐️") sesuai jumlah jawaban. Jika kategori lain, boleh kosong atau null.

Keluarkan HANYA JSON array murni tanpa markdown, tanpa teks pembuka/penutup. Format JSON:
[
  {
    "pertanyaan": "...",
    "jawaban": "...",
    "kategori": "${category}",
    "level": "${level}",
    "visual_helper": "..."
  }
]`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
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
            if (Array.isArray(parsed) && parsed.length > 0) {
              const formattedQuizzes: Partial<Quiz>[] = parsed.map((item: any, idx: number) => ({
                id: `ai-gemini-${Date.now()}-${idx}`,
                pertanyaan: String(item.pertanyaan || "Soal AI"),
                jawaban: String(item.jawaban || "1").replace(/[^0-9]/g, ""),
                kategori: category,
                level: level,
                visual_helper: item.visual_helper || undefined,
                is_active: true,
                status: "approved",
                created_by: "ai"
              }));
              return NextResponse.json({ success: true, quizzes: formattedQuizzes, source: "gemini" });
            }
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed or timed out, falling back to Algorithmic AI Generator:", geminiError);
      }
    }

    // 2. Fallback Algorithmic AI Generator (Sangat Cerdas, Bervariasi, Nyata, dan Anti-Gagal)
    const algorithmicQuizzes = generateAlgorithmicQuizzes(category, level, count);
    return NextResponse.json({ success: true, quizzes: algorithmicQuizzes, source: "algorithmic_ai" });

  } catch (error: any) {
    console.error("Error in generate-quiz API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghasilkan soal acak" },
      { status: 500 }
    );
  }
}

// Algorithmic AI Generator helper
function generateAlgorithmicQuizzes(
  category: string,
  level: string,
  count: number
): Partial<Quiz>[] {
  const quizzes: Partial<Quiz>[] = [];
  const emojis = [
    { char: "🍎", name: "apel segar" },
    { char: "⭐️", name: "bintang bersinar" },
    { char: "🥕", name: "wortel kelinci" },
    { char: "🐠", name: "ikan badut" },
    { char: "🍓", name: "stroberi manis" },
    { char: "🎈", name: "balon warna-warni" },
    { char: "⚽️", name: "bola sepak" },
    { char: "🐱", name: "kucing lucu" },
    { char: "🍕", name: "potongan pizza" }
  ];

  const kidsNames = ["Dodi", "Siti", "Raka", "Tania", "Amir", "Budi", "Aria", "Lani", "Edo", "Meli"];
  const itemsStory = ["permen cokelat", "kelereng kaca", "buku cerita", "pensil warna", "kue mangkok", "balon pesta", "buah jeruk", "roti manis"];

  for (let i = 0; i < count; i++) {
    const id = `ai-gen-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
    
    if (category === "penjumlahan") {
      if (level === "mudah") {
        const isPlus = Math.random() > 0.3;
        if (isPlus) {
          const a = Math.floor(Math.random() * 8) + 1; // 1-8
          const b = Math.floor(Math.random() * (10 - a)) + 1; // 1 to 10-a
          quizzes.push({
            id,
            pertanyaan: `${a} + ${b}`,
            jawaban: `${a + b}`,
            kategori: "penjumlahan",
            level: "mudah",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        } else {
          const a = Math.floor(Math.random() * 8) + 3; // 3-10
          const b = Math.floor(Math.random() * (a - 1)) + 1; // 1 to a-1
          quizzes.push({
            id,
            pertanyaan: `${a} - ${b}`,
            jawaban: `${a - b}`,
            kategori: "penjumlahan",
            level: "mudah",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        }
      } else if (level === "sedang") {
        const isPlus = Math.random() > 0.4;
        if (isPlus) {
          const a = Math.floor(Math.random() * 30) + 11;
          const b = Math.floor(Math.random() * 25) + 11;
          quizzes.push({
            id,
            pertanyaan: `${a} + ${b}`,
            jawaban: `${a + b}`,
            kategori: "penjumlahan",
            level: "sedang",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        } else {
          const a = Math.floor(Math.random() * 35) + 20;
          const b = Math.floor(Math.random() * (a - 10)) + 5;
          quizzes.push({
            id,
            pertanyaan: `${a} - ${b}`,
            jawaban: `${a - b}`,
            kategori: "penjumlahan",
            level: "sedang",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        }
      } else {
        // Sukar
        const isPlus = Math.random() > 0.4;
        if (isPlus) {
          const a = Math.floor(Math.random() * 45) + 35;
          const b = Math.floor(Math.random() * 40) + 25;
          quizzes.push({
            id,
            pertanyaan: `${a} + ${b}`,
            jawaban: `${a + b}`,
            kategori: "penjumlahan",
            level: "sukar",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        } else {
          const a = Math.floor(Math.random() * 50) + 50;
          const b = Math.floor(Math.random() * 40) + 15;
          quizzes.push({
            id,
            pertanyaan: `${a} - ${b}`,
            jawaban: `${a - b}`,
            kategori: "penjumlahan",
            level: "sukar",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        }
      }
    } else if (category === "perkalian") {
      if (level === "mudah") {
        const a = Math.floor(Math.random() * 4) + 2; // 2-5
        const b = Math.floor(Math.random() * 4) + 2; // 2-5
        quizzes.push({
          id,
          pertanyaan: `${a} x ${b}`,
          jawaban: `${a * b}`,
          kategori: "perkalian",
          level: "mudah",
          is_active: true,
          status: "approved",
          created_by: "ai"
        });
      } else if (level === "sedang") {
        const a = Math.floor(Math.random() * 5) + 5; // 5-9
        const b = Math.floor(Math.random() * 5) + 4; // 4-8
        quizzes.push({
          id,
          pertanyaan: `${a} x ${b}`,
          jawaban: `${a * b}`,
          kategori: "perkalian",
          level: "sedang",
          is_active: true,
          status: "approved",
          created_by: "ai"
        });
      } else {
        // Sukar
        const a = Math.floor(Math.random() * 6) + 8; // 8-13
        const b = Math.floor(Math.random() * 5) + 6; // 6-10
        quizzes.push({
          id,
          pertanyaan: `${a} x ${b}`,
          jawaban: `${a * b}`,
          kategori: "perkalian",
          level: "sukar",
          is_active: true,
          status: "approved",
          created_by: "ai"
        });
      }
    } else if (category === "visual") {
      const emojiObj = emojis[Math.floor(Math.random() * emojis.length)];
      let countAns = 3;
      if (level === "mudah") {
        countAns = Math.floor(Math.random() * 5) + 2; // 2-6
      } else if (level === "sedang") {
        countAns = Math.floor(Math.random() * 4) + 6; // 6-9
      } else {
        countAns = Math.floor(Math.random() * 3) + 8; // 8-10
      }
      const helper = emojiObj.char.repeat(countAns);
      const questionPatterns = [
        `Berapakah jumlah ${emojiObj.name} di bawah ini?`,
        `Ayo hitung total ${emojiObj.name} berikut:`,
        `Ada berapa banyak ${emojiObj.name} yang tertera di layar?`,
        `Hitung dengan teliti jumlah ${emojiObj.name} ini:`
      ];
      quizzes.push({
        id,
        pertanyaan: questionPatterns[Math.floor(Math.random() * questionPatterns.length)],
        jawaban: `${countAns}`,
        kategori: "visual",
        level: level as any,
        visual_helper: helper,
        is_active: true,
        status: "approved",
        created_by: "ai"
      });
    } else {
      // Soal Cerita
      const name = kidsNames[Math.floor(Math.random() * kidsNames.length)];
      const item = itemsStory[Math.floor(Math.random() * itemsStory.length)];
      
      if (level === "mudah") {
        const a = Math.floor(Math.random() * 5) + 3;
        const b = Math.floor(Math.random() * 4) + 2;
        if (Math.random() > 0.5) {
          quizzes.push({
            id,
            pertanyaan: `${name} memiliki ${a} buah ${item}. Ibu memberikan ${name} ${b} buah ${item} lagi. Berapa total ${item} ${name} sekarang?`,
            jawaban: `${a + b}`,
            kategori: "soal_cerita",
            level: "mudah",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        } else {
          quizzes.push({
            id,
            pertanyaan: `Di atas meja ada ${a + b} buah ${item}. ${name} memakan ${b} buah di antaranya. Berapakah sisa ${item} di atas meja sekarang?`,
            jawaban: `${a}`,
            kategori: "soal_cerita",
            level: "mudah",
            is_active: true,
            status: "approved",
            created_by: "ai"
          });
        }
      } else if (level === "sedang") {
        const a = Math.floor(Math.random() * 15) + 12;
        const b = Math.floor(Math.random() * 12) + 8;
        quizzes.push({
          id,
          pertanyaan: `${name} mengumpulkan ${a} buah ${item} di pagi hari, lalu mengumpulkan ${b} buah lagi di sore hari. Berapa jumlah seluruh ${item} yang terkumpul?`,
          jawaban: `${a + b}`,
          kategori: "soal_cerita",
          level: "sedang",
          is_active: true,
          status: "approved",
          created_by: "ai"
        });
      } else {
        // Sukar: perkalian cerita
        const kotak = Math.floor(Math.random() * 5) + 4; // 4-8
        const perKotak = Math.floor(Math.random() * 5) + 6; // 6-10
        quizzes.push({
          id,
          pertanyaan: `Ayah membeli ${kotak} kotak kemasan ${item} untuk ulang tahun ${name}. Setiap kotak berisi tepat ${perKotak} buah ${item}. Berapa total seluruh ${item} yang dibeli Ayah?`,
          jawaban: `${kotak * perKotak}`,
          kategori: "soal_cerita",
          level: "sukar",
          is_active: true,
          status: "approved",
          created_by: "ai"
        });
      }
    }
  }

  return quizzes;
}
