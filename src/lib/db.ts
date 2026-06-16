
export interface User {
  id: string;
  nama: string;
  email: string;
  created_at: string;
}

export interface ChildProfile {
  id: string;
  user_id: string;
  nama_anak: string;
  umur: number;
  kelas: string;
  theme: 'space' | 'jungle' | 'ocean';
  avatar: string; // e.g. "🐱", "🐶", "🦊", "🦁", "🐼", "🤖"
  created_at: string;
}

export interface Quiz {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: 'penjumlahan' | 'perkalian' | 'visual' | 'soal_cerita';
  level: 'mudah' | 'sedang' | 'sukar';
  created_at: string;
  visual_helper?: string; // Used to store emojis like "🍎🍎🍎" for visual counting
}

export interface QuizAttempt {
  id: string;
  child_id: string;
  soal: string;
  jawaban_anak: string;
  jawaban_benar: string;
  is_correct: boolean;
  created_at: string;
}

export interface Reward {
  id: string;
  child_id: string;
  total_poin: number;
  level: number;
  streak: number;
  updated_at: string;
}

// Initial Seeds
const DEFAULT_USER: User = {
  id: "user-1111-2222-3333-444444444444",
  nama: "Fahril",
  email: "fahril@email.com",
  created_at: new Date().toISOString(),
};

const DEFAULT_CHILDREN: ChildProfile[] = [
  {
    id: "child-bear-1111-2222",
    user_id: "user-1111-2222-3333-444444444444",
    nama_anak: "Aria",
    umur: 7,
    kelas: "Kelas 1",
    theme: "space",
    avatar: "🐻",
    created_at: new Date().toISOString(),
  },
  {
    id: "child-fox-3333-4444",
    user_id: "user-1111-2222-3333-444444444444",
    nama_anak: "Fahmi",
    umur: 9,
    kelas: "Kelas 3",
    theme: "jungle",
    avatar: "🦊",
    created_at: new Date().toISOString(),
  }
];

const DEFAULT_QUIZZES: Quiz[] = [
  // Game Menghitung (Penjumlahan)
  {
    id: "quiz-math-1",
    pertanyaan: "5 + 3",
    jawaban: "8",
    kategori: "penjumlahan",
    level: "mudah",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-2",
    pertanyaan: "7 + 2",
    jawaban: "9",
    kategori: "penjumlahan",
    level: "mudah",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-3",
    pertanyaan: "3 + 4",
    jawaban: "7",
    kategori: "penjumlahan",
    level: "mudah",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-4",
    pertanyaan: "6 - 2",
    jawaban: "4",
    kategori: "penjumlahan",
    level: "mudah",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-5",
    pertanyaan: "9 - 4",
    jawaban: "5",
    kategori: "penjumlahan",
    level: "mudah",
    created_at: new Date().toISOString(),
  },

  // Soal Interaktif (Visual)
  {
    id: "quiz-visual-1",
    pertanyaan: "Berapa jumlah bintang di bawah ini?",
    jawaban: "5",
    kategori: "visual",
    level: "mudah",
    visual_helper: "⭐️⭐️⭐️⭐️⭐️",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-2",
    pertanyaan: "Hitung buah apel segar berikut:",
    jawaban: "3",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🍎🍎🍎",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-3",
    pertanyaan: "Berapa buah wortel yang dimakan kelinci?",
    jawaban: "6",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🥕🥕🥕🥕🥕🥕",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-4",
    pertanyaan: "Kira-kira ada berapa ikan badut berenang?",
    jawaban: "4",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🐠🐠🐠🐠",
    created_at: new Date().toISOString(),
  },

  // Soal Cerita / Podcast (Audio)
  {
    id: "quiz-story-1",
    pertanyaan: "Dodi memiliki 4 buah permen manis. Ibu kemudian memberikan Dodi 3 permen manis lagi. Berapa total permen manis Dodi sekarang?",
    jawaban: "7",
    kategori: "soal_cerita",
    level: "sedang",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-2",
    pertanyaan: "Tania mempunyai 9 buah kue mangkok cokelat di atas piring. Dia memakan 5 buah kue. Berapakah sisa kue mangkok Tania sekarang?",
    jawaban: "4",
    kategori: "soal_cerita",
    level: "sedang",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-3",
    pertanyaan: "Raka memetik 2 buah mangga matang di pagi hari, lalu ia memetik 6 buah mangga matang di sore hari. Berapa total buah mangga yang dipetik Raka hari ini?",
    jawaban: "8",
    kategori: "soal_cerita",
    level: "sedang",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-4",
    pertanyaan: "Di atas pohon kelapa ada 6 ekor monyet lucu. Tiba-tiba, 4 ekor monyet turun ke tanah untuk makan buah pisang. Berapakah sisa monyet yang berada di atas pohon?",
    jawaban: "2",
    kategori: "soal_cerita",
    level: "sedang",
    created_at: new Date().toISOString(),
  }
];

const DEFAULT_REWARDS: Reward[] = [
  {
    id: "reward-1",
    child_id: "child-bear-1111-2222",
    total_poin: 120,
    level: 2,
    streak: 3,
    updated_at: new Date().toISOString(),
  },
  {
    id: "reward-2",
    child_id: "child-fox-3333-4444",
    total_poin: 40,
    level: 1,
    streak: 1,
    updated_at: new Date().toISOString(),
  }
];

const DEFAULT_ATTEMPTS: QuizAttempt[] = [
  // Sample attempts for Aria (Bear) over last 3 days
  {
    id: "attempt-1",
    child_id: "child-bear-1111-2222",
    soal: "5 + 3",
    jawaban_anak: "8",
    jawaban_benar: "8",
    is_correct: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "attempt-2",
    child_id: "child-bear-1111-2222",
    soal: "7 + 2",
    jawaban_anak: "9",
    jawaban_benar: "9",
    is_correct: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: "attempt-3",
    child_id: "child-bear-1111-2222",
    soal: "Berapa jumlah bintang di bawah ini? (⭐️⭐️⭐️⭐️⭐️)",
    jawaban_anak: "4",
    jawaban_benar: "5",
    is_correct: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: "attempt-4",
    child_id: "child-bear-1111-2222",
    soal: "Hitung buah apel segar berikut: (🍎🍎🍎)",
    jawaban_anak: "3",
    jawaban_benar: "3",
    is_correct: true,
    created_at: new Date().toISOString(), // today
  }
];

// Database Class Mock
class MockDatabase {
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    if (!localStorage.getItem("logikid_users")) {
      localStorage.setItem("logikid_users", JSON.stringify([DEFAULT_USER]));
    }
    if (!localStorage.getItem("logikid_children")) {
      localStorage.setItem("logikid_children", JSON.stringify(DEFAULT_CHILDREN));
    }
    if (!localStorage.getItem("logikid_quizzes")) {
      localStorage.setItem("logikid_quizzes", JSON.stringify(DEFAULT_QUIZZES));
    }
    if (!localStorage.getItem("logikid_attempts")) {
      localStorage.setItem("logikid_attempts", JSON.stringify(DEFAULT_ATTEMPTS));
    }
    if (!localStorage.getItem("logikid_rewards")) {
      localStorage.setItem("logikid_rewards", JSON.stringify(DEFAULT_REWARDS));
    }

    this.isInitialized = true;
  }

  // Generic Getters
  private getData<T>(key: string): T[] {
    this.init();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Users
  getUsers(): User[] {
    return this.getData<User>("logikid_users");
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Children Profiles
  getChildren(userId: string): ChildProfile[] {
    const children = this.getData<ChildProfile>("logikid_children");
    return children.filter((c) => c.user_id === userId);
  }

  getChildById(id: string): ChildProfile | null {
    const children = this.getData<ChildProfile>("logikid_children");
    return children.find((c) => c.id === id) || null;
  }

  addChild(userId: string, namaAnak: string, umur: number, kelas: string, avatar: string, theme: 'space' | 'jungle' | 'ocean'): ChildProfile {
    const children = this.getData<ChildProfile>("logikid_children");
    const newChild: ChildProfile = {
      id: "child-" + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      nama_anak: namaAnak,
      umur,
      kelas,
      avatar,
      theme,
      created_at: new Date().toISOString(),
    };
    children.push(newChild);
    this.setData("logikid_children", children);

    // Initialize Rewards
    const rewards = this.getData<Reward>("logikid_rewards");
    const newReward: Reward = {
      id: "reward-" + Math.random().toString(36).substr(2, 9),
      child_id: newChild.id,
      total_poin: 0,
      level: 1,
      streak: 0,
      updated_at: new Date().toISOString(),
    };
    rewards.push(newReward);
    this.setData("logikid_rewards", rewards);

    return newChild;
  }

  updateChildTheme(childId: string, theme: 'space' | 'jungle' | 'ocean'): void {
    const children = this.getData<ChildProfile>("logikid_children");
    const index = children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      children[index].theme = theme;
      this.setData("logikid_children", children);
    }
  }

  // Quizzes
  getQuizzes(): Quiz[] {
    return this.getData<Quiz>("logikid_quizzes");
  }

  getQuizzesByCategory(category: string): Quiz[] {
    const quizzes = this.getQuizzes();
    return quizzes.filter((q) => q.kategori === category);
  }

  // Quiz Attempts
  getAttempts(childId: string): QuizAttempt[] {
    const attempts = this.getData<QuizAttempt>("logikid_attempts");
    return attempts.filter((a) => a.child_id === childId);
  }

  addAttempt(childId: string, soal: string, jawabanAnak: string, jawabanBenar: string, isCorrect: boolean): QuizAttempt {
    const attempts = this.getData<QuizAttempt>("logikid_attempts");
    const newAttempt: QuizAttempt = {
      id: "attempt-" + Math.random().toString(36).substr(2, 9),
      child_id: childId,
      soal,
      jawaban_anak: jawabanAnak,
      jawaban_benar: jawabanBenar,
      is_correct: isCorrect,
      created_at: new Date().toISOString(),
    };
    attempts.push(newAttempt);
    this.setData("logikid_attempts", attempts);

    // Update Reward / Points
    if (isCorrect) {
      this.addPoints(childId, 10);
    } else {
      this.resetStreak(childId);
    }

    return newAttempt;
  }

  // Rewards
  getRewardByChildId(childId: string): Reward | null {
    const rewards = this.getData<Reward>("logikid_rewards");
    return rewards.find((r) => r.child_id === childId) || null;
  }

  private addPoints(childId: string, points: number): void {
    const rewards = this.getData<Reward>("logikid_rewards");
    const index = rewards.findIndex((r) => r.child_id === childId);
    if (index !== -1) {
      const reward = rewards[index];
      reward.total_poin += points;
      reward.streak += 1;
      
      // Calculate level based on points (e.g. 50 points per level)
      const calculatedLevel = Math.max(1, Math.floor(reward.total_poin / 50) + 1);
      reward.level = calculatedLevel;
      reward.updated_at = new Date().toISOString();

      rewards[index] = reward;
      this.setData("logikid_rewards", rewards);
    }
  }

  private resetStreak(childId: string): void {
    const rewards = this.getData<Reward>("logikid_rewards");
    const index = rewards.findIndex((r) => r.child_id === childId);
    if (index !== -1) {
      rewards[index].streak = 0;
      rewards[index].updated_at = new Date().toISOString();
      this.setData("logikid_rewards", rewards);
    }
  }

  // Active Session helper
  getActiveChild(): ChildProfile | null {
    if (typeof window === "undefined") return null;
    const activeId = localStorage.getItem("logikid_active_child_id");
    if (!activeId) return null;
    return this.getChildById(activeId);
  }

  setActiveChild(childId: string | null): void {
    if (typeof window === "undefined") return;
    if (childId) {
      localStorage.setItem("logikid_active_child_id", childId);
    } else {
      localStorage.removeItem("logikid_active_child_id");
    }
  }

  getActiveUser(): User | null {
    if (typeof window === "undefined") return null;
    const activeUser = localStorage.getItem("logikid_active_user");
    return activeUser ? JSON.parse(activeUser) : null;
  }

  setActiveUser(user: User | null): void {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("logikid_active_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("logikid_active_user");
    }
  }

  logout(): void {
    this.setActiveUser(null);
    this.setActiveChild(null);
  }
}

export const db = new MockDatabase();
