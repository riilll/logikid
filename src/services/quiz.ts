import { db, Quiz } from "@/lib/db";

export interface GenerateQuizParams {
  category: Quiz['kategori'];
  level: Quiz['level'];
  count: number;
  autoApprove?: boolean;
}

export async function generateRandomQuizAI(params: GenerateQuizParams): Promise<Quiz[]> {
  try {
    const res = await fetch("/api/ai/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error("Gagal mengambil soal dari API AI");
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.quizzes)) {
      // Add generated quizzes to local DB
      const addedQuizzes = db.addMultipleQuizzes(
        data.quizzes.map((q: Partial<Quiz>) => ({
          ...q,
          status: params.autoApprove ? "approved" : "pending",
          is_active: params.autoApprove ? true : false,
          created_by: "ai"
        }))
      );
      return addedQuizzes;
    } else {
      throw new Error(data.error || "Format respons AI tidak valid");
    }
  } catch (error) {
    console.error("Error in generateRandomQuizAI service:", error);
    throw error;
  }
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
