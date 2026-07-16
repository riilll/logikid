import { db, QuizAttempt } from "@/lib/db";

export interface AnalyticsSummary {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  dailyProgress: { date: string; correct: number; wrong: number }[];
  categoryBreakdown: Record<string, { total: number; correct: number; accuracy: number }>;
}

export function getChildAnalytics(childId: string): AnalyticsSummary {
  const attempts = db.getAttempts(childId);
  const totalAttempts = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const wrongCount = totalAttempts - correctCount;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  // 5 days window
  const days: Record<string, { correct: number; wrong: number }> = {};
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    days[dateStr] = { correct: 0, wrong: 0 };
  }

  attempts.forEach((att) => {
    const dateStr = new Date(att.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (days[dateStr] !== undefined) {
      if (att.is_correct) {
        days[dateStr].correct += 1;
      } else {
        days[dateStr].wrong += 1;
      }
    }
  });

  const dailyProgress = Object.entries(days).map(([date, val]) => ({
    date,
    correct: val.correct,
    wrong: val.wrong,
  }));

  // Category breakdown estimation
  const categories = ["penjumlahan", "perkalian", "visual", "soal_cerita"];
  const categoryBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {};
  
  categories.forEach((cat) => {
    // Simple heuristic or attribute mapping
    const catAttempts = attempts.filter((a) => {
      if (cat === "visual") return a.soal.toLowerCase().includes("bintang") || a.soal.toLowerCase().includes("apel") || a.soal.toLowerCase().includes("wortel") || a.soal.toLowerCase().includes("ikan") || a.soal.toLowerCase().includes("stroberi") || a.soal.toLowerCase().includes("bola");
      if (cat === "soal_cerita") return a.soal.length > 20 && !a.soal.includes("bintang") && !a.soal.includes("apel");
      if (cat === "perkalian") return a.soal.includes("x");
      return a.soal.includes("+") || a.soal.includes("-");
    });
    const total = catAttempts.length;
    const correct = catAttempts.filter((a) => a.is_correct).length;
    categoryBreakdown[cat] = {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  return {
    totalAttempts,
    correctCount,
    wrongCount,
    accuracy,
    dailyProgress,
    categoryBreakdown,
  };
}
