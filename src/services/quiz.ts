import { db, Quiz } from "@/lib/db";

export interface GenerateQuizParams {
  category: Quiz['kategori'];
  level: Quiz['level'];
  count: number;
  autoApprove?: boolean;
}

export async function generateRandomQuizAI(params: GenerateQuizParams): Promise<Quiz[]> {
  try {
    // 1. Coba panggil API server (jika online & tersambung ke Node.js server)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch("/api/ai/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success && Array.isArray(data.quizzes) && data.quizzes.length > 0) {
        const addedQuizzes = db.addMultipleQuizzes(
          data.quizzes.map((q: Partial<Quiz>) => ({
            ...q,
            status: params.autoApprove ? "approved" : "pending",
            is_active: params.autoApprove ? true : false,
            created_by: "ai",
          }))
        );
        return addedQuizzes;
      }
    }
  } catch (err) {
    console.warn("API AI server tidak dapat diakses, beralih ke generator AI lokal:", err);
  }

  // 2. Fallback cerdas lokal (Sangat penting saat aplikasi berjalan di APK Android / Offline / Static Build)
  console.info("Menggunakan Algorithmic AI Generator lokal untuk kategori:", params.category);
  const rawQuizzes = generateClientSideAIQuizzes(params.category, params.level || "mudah", params.count || 5);
  const addedQuizzes = db.addMultipleQuizzes(
    rawQuizzes.map((q) => ({
      ...q,
      status: params.autoApprove ? "approved" : "pending",
      is_active: params.autoApprove ? true : false,
      created_by: "ai",
    }))
  );
  return addedQuizzes;
}

// Algorithmic AI Generator Lokal (Anti-Gagal, Cerdas & Bervariasi)
function generateClientSideAIQuizzes(
  category: Quiz['kategori'],
  level: Quiz['level'],
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
    { char: "🍕", name: "potongan pizza" },
  ];

  const kidsNames = ["Dodi", "Siti", "Raka", "Tania", "Amir", "Budi", "Aria", "Lani", "Edo", "Meli"];
  const itemsStory = ["permen cokelat", "kelereng kaca", "buku cerita", "pensil warna", "kue mangkok", "balon pesta", "buah jeruk", "roti manis"];

  for (let i = 0; i < count; i++) {
    const id = `ai-gen-client-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;

    if (category === "penjumlahan") {
      if (level === "mudah") {
        const isPlus = Math.random() > 0.3;
        if (isPlus) {
          const a = Math.floor(Math.random() * 8) + 1;
          const b = Math.floor(Math.random() * (10 - a)) + 1;
          quizzes.push({ id, pertanyaan: `${a} + ${b}`, jawaban: `${a + b}`, kategori: "penjumlahan", level: "mudah" });
        } else {
          const a = Math.floor(Math.random() * 8) + 3;
          const b = Math.floor(Math.random() * (a - 1)) + 1;
          quizzes.push({ id, pertanyaan: `${a} - ${b}`, jawaban: `${a - b}`, kategori: "penjumlahan", level: "mudah" });
        }
      } else if (level === "sedang") {
        const isPlus = Math.random() > 0.4;
        if (isPlus) {
          const a = Math.floor(Math.random() * 30) + 11;
          const b = Math.floor(Math.random() * 30) + 11;
          quizzes.push({ id, pertanyaan: `${a} + ${b}`, jawaban: `${a + b}`, kategori: "penjumlahan", level: "sedang" });
        } else {
          const a = Math.floor(Math.random() * 40) + 30;
          const b = Math.floor(Math.random() * 25) + 10;
          quizzes.push({ id, pertanyaan: `${a} - ${b}`, jawaban: `${a - b}`, kategori: "penjumlahan", level: "sedang" });
        }
      } else {
        const isPlus = Math.random() > 0.5;
        if (isPlus) {
          const a = Math.floor(Math.random() * 45) + 35;
          const b = Math.floor(Math.random() * 40) + 25;
          quizzes.push({ id, pertanyaan: `${a} + ${b}`, jawaban: `${a + b}`, kategori: "penjumlahan", level: "sukar" });
        } else {
          const a = Math.floor(Math.random() * 50) + 50;
          const b = Math.floor(Math.random() * 40) + 15;
          quizzes.push({ id, pertanyaan: `${a} - ${b}`, jawaban: `${a - b}`, kategori: "penjumlahan", level: "sukar" });
        }
      }
    } else if (category === "perkalian") {
      if (level === "mudah") {
        const a = Math.floor(Math.random() * 4) + 2;
        const b = Math.floor(Math.random() * 4) + 2;
        quizzes.push({ id, pertanyaan: `${a} x ${b}`, jawaban: `${a * b}`, kategori: "perkalian", level: "mudah" });
      } else if (level === "sedang") {
        const a = Math.floor(Math.random() * 5) + 5;
        const b = Math.floor(Math.random() * 5) + 4;
        quizzes.push({ id, pertanyaan: `${a} x ${b}`, jawaban: `${a * b}`, kategori: "perkalian", level: "sedang" });
      } else {
        const a = Math.floor(Math.random() * 6) + 8;
        const b = Math.floor(Math.random() * 5) + 6;
        quizzes.push({ id, pertanyaan: `${a} x ${b}`, jawaban: `${a * b}`, kategori: "perkalian", level: "sukar" });
      }
    } else if (category === "visual") {
      const emojiObj = emojis[Math.floor(Math.random() * emojis.length)];
      let countAns = Math.floor(Math.random() * 5) + 2;
      if (level === "sedang") countAns = Math.floor(Math.random() * 4) + 6;
      if (level === "sukar") countAns = Math.floor(Math.random() * 3) + 8;
      const helper = emojiObj.char.repeat(countAns);
      const patterns = [
        `Berapakah jumlah ${emojiObj.name} di bawah ini?`,
        `Ayo hitung total ${emojiObj.name} berikut:`,
        `Ada berapa banyak ${emojiObj.name} yang tertera di layar?`,
      ];
      quizzes.push({
        id,
        pertanyaan: patterns[Math.floor(Math.random() * patterns.length)],
        jawaban: `${countAns}`,
        kategori: "visual",
        level: level,
        visual_helper: helper,
      });
    } else if (category === "soal_cerita") {
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
          });
        } else {
          quizzes.push({
            id,
            pertanyaan: `Di atas meja ada ${a + b} buah ${item}. ${name} memakan ${b} buah di antaranya. Berapakah sisa ${item} di atas meja sekarang?`,
            jawaban: `${a}`,
            kategori: "soal_cerita",
            level: "mudah",
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
        });
      } else {
        const kotak = Math.floor(Math.random() * 5) + 4;
        const perKotak = Math.floor(Math.random() * 5) + 6;
        quizzes.push({
          id,
          pertanyaan: `Ayah membeli ${kotak} kotak kemasan ${item} untuk ulang tahun ${name}. Setiap kotak berisi tepat ${perKotak} buah ${item}. Berapa total seluruh ${item} yang dibeli Ayah?`,
          jawaban: `${kotak * perKotak}`,
          kategori: "soal_cerita",
          level: "sukar",
        });
      }
    } else {
      // Logika & Membandingkan
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      quizzes.push({
        id,
        pertanyaan: `Angka berapa yang merupakan hasil dari ${a} ditambah ${b}?`,
        jawaban: `${a + b}`,
        kategori: category,
        level: level,
      });
    }
  }

  return quizzes;
}

export function getFilteredBankSoal(
  kategoriFilter: string,
  levelFilter: string,
  statusFilter: string
): Quiz[] {
  const allQuizzes = db.getQuizzes();
  return allQuizzes.filter((q) => {
    if (kategoriFilter !== "semua" && q.kategori !== kategoriFilter) return false;
    if (levelFilter !== "semua" && q.level !== levelFilter) return false;
    if (statusFilter !== "semua") {
      const currentStatus = q.status || "approved";
      if (currentStatus !== statusFilter) return false;
    }
    return true;
  });
}
