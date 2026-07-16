export interface User {
  id: string;
  nama: string;
  email: string;
  password?: string;
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
  preferred_level?: 'mudah' | 'sedang' | 'sukar' | 'semua'; // Tingkat kesulitan soal yang dipilih orang tua
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
  is_active?: boolean; // Apakah soal aktif diberikan kepada anak
  status?: 'approved' | 'pending' | 'rejected'; // Validasi oleh orang tua
  created_by?: 'system' | 'parent' | 'ai'; // Sumber pembuatan soal
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
  password: "password123",
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
    preferred_level: "mudah",
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
    preferred_level: "sedang",
    created_at: new Date().toISOString(),
  }
];

const DEFAULT_QUIZZES: Quiz[] = [
  // Game Menghitung (Penjumlahan & Pengurangan - Mudah)
  {
    id: "quiz-math-1",
    pertanyaan: "5 + 3",
    jawaban: "8",
    kategori: "penjumlahan",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-2",
    pertanyaan: "7 + 2",
    jawaban: "9",
    kategori: "penjumlahan",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-3",
    pertanyaan: "3 + 4",
    jawaban: "7",
    kategori: "penjumlahan",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-4",
    pertanyaan: "6 - 2",
    jawaban: "4",
    kategori: "penjumlahan",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-5",
    pertanyaan: "9 - 4",
    jawaban: "5",
    kategori: "penjumlahan",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  // Penjumlahan & Pengurangan (Sedang)
  {
    id: "quiz-math-6",
    pertanyaan: "14 + 15",
    jawaban: "29",
    kategori: "penjumlahan",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-7",
    pertanyaan: "28 - 12",
    jawaban: "16",
    kategori: "penjumlahan",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  // Penjumlahan & Pengurangan (Sukar)
  {
    id: "quiz-math-8",
    pertanyaan: "65 + 28",
    jawaban: "93",
    kategori: "penjumlahan",
    level: "sukar",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-math-9",
    pertanyaan: "84 - 37",
    jawaban: "47",
    kategori: "penjumlahan",
    level: "sukar",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },

  // Game Perkalian
  {
    id: "quiz-mul-1",
    pertanyaan: "2 x 3",
    jawaban: "6",
    kategori: "perkalian",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-2",
    pertanyaan: "4 x 2",
    jawaban: "8",
    kategori: "perkalian",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-3",
    pertanyaan: "3 x 3",
    jawaban: "9",
    kategori: "perkalian",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-4",
    pertanyaan: "6 x 7",
    jawaban: "42",
    kategori: "perkalian",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-5",
    pertanyaan: "8 x 5",
    jawaban: "40",
    kategori: "perkalian",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-6",
    pertanyaan: "9 x 8",
    jawaban: "72",
    kategori: "perkalian",
    level: "sukar",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-mul-7",
    pertanyaan: "12 x 6",
    jawaban: "72",
    kategori: "perkalian",
    level: "sukar",
    is_active: true,
    status: "approved",
    created_by: "system",
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
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-2",
    pertanyaan: "Hitung buah apel segar berikut:",
    jawaban: "3",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🍎🍎🍎",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-3",
    pertanyaan: "Berapa buah wortel yang dimakan kelinci?",
    jawaban: "6",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🥕🥕🥕🥕🥕🥕",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-4",
    pertanyaan: "Kira-kira ada berapa ikan badut berenang?",
    jawaban: "4",
    kategori: "visual",
    level: "mudah",
    visual_helper: "🐠🐠🐠🐠",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-5",
    pertanyaan: "Berapa jumlah stroberi manis yang tertera?",
    jawaban: "7",
    kategori: "visual",
    level: "sedang",
    visual_helper: "🍓🍓🍓🍓🍓🍓🍓",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-visual-6",
    pertanyaan: "Hitung total bola sepak berikut:",
    jawaban: "8",
    kategori: "visual",
    level: "sukar",
    visual_helper: "⚽️⚽️⚽️⚽️⚽️⚽️⚽️⚽️",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },

  // Soal Cerita / Podcast (Audio)
  {
    id: "quiz-story-1",
    pertanyaan: "Dodi memiliki 4 buah permen manis. Ibu kemudian memberikan Dodi 3 permen manis lagi. Berapa total permen manis Dodi sekarang?",
    jawaban: "7",
    kategori: "soal_cerita",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-2",
    pertanyaan: "Tania mempunyai 9 buah kue mangkok cokelat di atas piring. Dia memakan 5 buah kue. Berapakah sisa kue mangkok Tania sekarang?",
    jawaban: "4",
    kategori: "soal_cerita",
    level: "mudah",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-3",
    pertanyaan: "Raka memetik 12 buah mangga matang di pagi hari, lalu ia memetik 15 buah mangga di sore hari. Berapa total mangga yang dipetik Raka hari ini?",
    jawaban: "27",
    kategori: "soal_cerita",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-4",
    pertanyaan: "Di atas pohon ada 16 ekor monyet lucu. Tiba-tiba, 7 ekor monyet turun ke tanah untuk makan pisang. Berapakah sisa monyet di atas pohon?",
    jawaban: "9",
    kategori: "soal_cerita",
    level: "sedang",
    is_active: true,
    status: "approved",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "quiz-story-5",
    pertanyaan: "Ibu membeli 5 kotak pensil warna. Setiap kotak berisi 8 batang pensil. Berapakah total batang pensil warna yang dibeli Ibu?",
    jawaban: "40",
    kategori: "soal_cerita",
    level: "sukar",
    is_active: true,
    status: "approved",
    created_by: "system",
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
  {
    id: "attempt-1",
    child_id: "child-bear-1111-2222",
    soal: "5 + 3",
    jawaban_anak: "8",
    jawaban_benar: "8",
    is_correct: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "attempt-2",
    child_id: "child-bear-1111-2222",
    soal: "7 + 2",
    jawaban_anak: "9",
    jawaban_benar: "9",
    is_correct: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "attempt-3",
    child_id: "child-bear-1111-2222",
    soal: "Berapa jumlah bintang di bawah ini? (⭐️⭐️⭐️⭐️⭐️)",
    jawaban_anak: "4",
    jawaban_benar: "5",
    is_correct: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "attempt-4",
    child_id: "child-bear-1111-2222",
    soal: "Hitung buah apel segar berikut: (🍎🍎🍎)",
    jawaban_anak: "3",
    jawaban_benar: "3",
    is_correct: true,
    created_at: new Date().toISOString(),
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
    } else {
      // Migrate existing quizzes to ensure they have status & is_active & created_by fields
      const existingQuizzes: Quiz[] = JSON.parse(localStorage.getItem("logikid_quizzes") || "[]");
      let updated = false;
      const migrated = existingQuizzes.map(q => {
        if (q.is_active === undefined || q.status === undefined || q.created_by === undefined) {
          updated = true;
          return {
            ...q,
            is_active: q.is_active !== undefined ? q.is_active : true,
            status: q.status || "approved",
            created_by: q.created_by || "system"
          };
        }
        return q;
      });
      if (updated) {
        localStorage.setItem("logikid_quizzes", JSON.stringify(migrated));
      }
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

  registerUser(nama: string, email: string, password?: string): { user?: User; error?: string } {
    const existing = this.getUserByEmail(email);
    if (existing) {
      return { error: "Email ini sudah terdaftar. Silakan login menggunakan email & password Anda." };
    }

    const users = this.getUsers();
    const newUser: User = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      nama: nama.trim(),
      email: email.trim().toLowerCase(),
      password: password || "password123",
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    this.setData("logikid_users", users);

    // Otomatis buatkan 1 profil anak awal agar siap dipakai (bisa ditambah lagi karena anak bisa lebih dari 1)
    this.addChild(newUser.id, "Anak Pertama", 7, "Kelas 1", "🐻", "space");

    return { user: newUser };
  }

  loginUser(email: string, password?: string): { user?: User; error?: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
      return { error: "Akun dengan email tersebut tidak ditemukan. Silakan daftar terlebih dahulu." };
    }
    // Jika user punya password dan input password diberikan, periksa validitasnya
    if (user.password && password && user.password !== password) {
      return { error: "Password salah! Silakan periksa kembali kata sandi Anda." };
    }
    return { user };
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
      preferred_level: "mudah",
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
      // Update active child session if matching
      const activeChild = this.getActiveChild();
      if (activeChild && activeChild.id === childId) {
        this.setActiveChild(children[index].id);
      }
    }
  }

  updateChildDifficulty(childId: string, preferred_level: 'mudah' | 'sedang' | 'sukar' | 'semua'): void {
    const children = this.getData<ChildProfile>("logikid_children");
    const index = children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      children[index].preferred_level = preferred_level;
      this.setData("logikid_children", children);
      // Update active child session if matching
      if (typeof window !== "undefined") {
        const activeId = localStorage.getItem("logikid_active_child_id");
        if (activeId === childId) {
          localStorage.setItem("logikid_active_child_data", JSON.stringify(children[index]));
        }
      }
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

  getQuizzesByChildFilter(category: string, childId?: string): Quiz[] {
    const quizzes = this.getQuizzes();
    // Only return active and approved questions for child gameplay
    let filtered = quizzes.filter(
      (q) => q.kategori === category && q.is_active !== false && (q.status === "approved" || !q.status)
    );

    if (childId) {
      const child = this.getChildById(childId);
      if (child && child.preferred_level && child.preferred_level !== "semua") {
        filtered = filtered.filter((q) => q.level === child.preferred_level);
      }
    }

    return filtered;
  }

  addQuiz(
    pertanyaan: string,
    jawaban: string,
    kategori: Quiz['kategori'],
    level: Quiz['level'],
    visual_helper?: string,
    status: Quiz['status'] = 'approved',
    created_by: Quiz['created_by'] = 'parent'
  ): Quiz {
    const quizzes = this.getQuizzes();
    const newQuiz: Quiz = {
      id: "quiz-" + Math.random().toString(36).substr(2, 9),
      pertanyaan,
      jawaban,
      kategori,
      level,
      visual_helper,
      is_active: status === 'approved',
      status,
      created_by,
      created_at: new Date().toISOString(),
    };
    quizzes.push(newQuiz);
    this.setData("logikid_quizzes", quizzes);
    return newQuiz;
  }

  addMultipleQuizzes(quizzesToAdd: Partial<Quiz>[]): Quiz[] {
    const quizzes = this.getQuizzes();
    const created: Quiz[] = [];
    for (const item of quizzesToAdd) {
      const newQ: Quiz = {
        id: item.id || "quiz-ai-" + Math.random().toString(36).substr(2, 9),
        pertanyaan: item.pertanyaan || "",
        jawaban: item.jawaban || "1",
        kategori: item.kategori || "penjumlahan",
        level: item.level || "mudah",
        visual_helper: item.visual_helper,
        is_active: item.is_active !== undefined ? item.is_active : (item.status === "approved"),
        status: item.status || "approved",
        created_by: item.created_by || "ai",
        created_at: new Date().toISOString(),
      };
      quizzes.push(newQ);
      created.push(newQ);
    }
    this.setData("logikid_quizzes", quizzes);
    return created;
  }

  updateQuiz(quizId: string, updates: Partial<Quiz>): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quizId);
    if (index !== -1) {
      quizzes[index] = { ...quizzes[index], ...updates };
      this.setData("logikid_quizzes", quizzes);
    }
  }

  deleteQuiz(quizId: string): void {
    const quizzes = this.getQuizzes();
    const filtered = quizzes.filter((q) => q.id !== quizId);
    this.setData("logikid_quizzes", filtered);
  }

  toggleQuizStatus(quizId: string, status: 'approved' | 'pending' | 'rejected'): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quizId);
    if (index !== -1) {
      quizzes[index].status = status;
      quizzes[index].is_active = status === "approved";
      this.setData("logikid_quizzes", quizzes);
    }
  }

  toggleQuizActive(quizId: string, isActive: boolean): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quizId);
    if (index !== -1) {
      quizzes[index].is_active = isActive;
      this.setData("logikid_quizzes", quizzes);
    }
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

  deleteAttempt(attemptId: string): void {
    const attempts = this.getData<QuizAttempt>("logikid_attempts");
    const filtered = attempts.filter((a) => a.id !== attemptId);
    this.setData("logikid_attempts", filtered);
  }

  markAttemptResolved(attemptId: string): void {
    this.deleteAttempt(attemptId);
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
