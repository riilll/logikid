"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { db, ChildProfile, QuizAttempt, Quiz } from "@/lib/db";
import { generateRandomQuizAI } from "@/services/quiz";

export default function DashboardOrtu() {
  const [activeTab, setActiveTab] = useState<'laporan' | 'kesulitan' | 'validasi' | 'remedial'>('laporan');
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
  });
  
  // Daily grouped data for chart
  const [dailyData, setDailyData] = useState<{ date: string; correct: number; wrong: number }[]>([]);

  // Bank Soal & Validasi state
  const [quizzesList, setQuizzesList] = useState<Quiz[]>([]);
  const [kategoriFilter, setKategoriFilter] = useState<string>("semua");
  const [levelFilter, setLevelFilter] = useState<string>("semua");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI Generator state
  const [aiCategory, setAiCategory] = useState<Quiz['kategori']>("penjumlahan");
  const [aiLevel, setAiLevel] = useState<Quiz['level']>("mudah");
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiAutoApprove, setAiAutoApprove] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualPertanyaan, setManualPertanyaan] = useState("");
  const [manualJawaban, setManualJawaban] = useState("");
  const [manualKategori, setManualKategori] = useState<Quiz['kategori']>("penjumlahan");
  const [manualLevel, setManualLevel] = useState<Quiz['level']>("mudah");
  const [manualVisualHelper, setManualVisualHelper] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAnalytics = useCallback((childId: string) => {
    const list = db.getAttempts(childId);
    const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAttempts(sorted);

    const total = sorted.length;
    const correct = sorted.filter((a) => a.is_correct).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    setStats({ total, correct, wrong, accuracy });

    const days: Record<string, { correct: number; wrong: number }> = {};
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      days[dateStr] = { correct: 0, wrong: 0 };
    }

    list.forEach((att) => {
      const dateStr = new Date(att.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      if (days[dateStr] !== undefined) {
        if (att.is_correct) {
          days[dateStr].correct += 1;
        } else {
          days[dateStr].wrong += 1;
        }
      }
    });

    const chartData = Object.entries(days).map(([date, val]) => ({
      date,
      correct: val.correct,
      wrong: val.wrong,
    }));

    setDailyData(chartData);
  }, []);

  const refreshQuizzes = useCallback(() => {
    setQuizzesList(db.getQuizzes());
  }, []);

  useEffect(() => {
    const user = db.getActiveUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const kids = db.getChildren(user.id);
    
    const timer = setTimeout(() => {
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id);
        loadAnalytics(kids[0].id);
      }
      refreshQuizzes();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [loadAnalytics, refreshQuizzes]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    loadAnalytics(childId);
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const wrongAttempts = attempts.filter((a) => !a.is_correct);

  // Difficulty Update
  const handleUpdateDifficulty = (level: 'mudah' | 'sedang' | 'sukar' | 'semua') => {
    if (!selectedChild) return;
    db.updateChildDifficulty(selectedChild.id, level);
    // update local children state
    setChildren((prev) =>
      prev.map((c) => (c.id === selectedChild.id ? { ...c, preferred_level: level } : c))
    );
    showToast(`✅ Tingkat kesulitan untuk ${selectedChild.nama_anak} berhasil diatur ke level: ${level.toUpperCase()}`);
  };

  // AI Generator Trigger
  const handleTriggerAIGenerator = async () => {
    setIsGenerating(true);
    try {
      const newQuizzes = await generateRandomQuizAI({
        category: aiCategory,
        level: aiLevel,
        count: aiCount,
        autoApprove: aiAutoApprove,
      });
      refreshQuizzes();
      showToast(`🎉 Berhasil membuat ${newQuizzes.length} soal acak AI baru (${aiAutoApprove ? "Langsung Aktif" : "Menunggu Validasi"})!`);
    } catch (err: any) {
      showToast(`❌ Gagal membuat soal acak: ${err.message || "Error tidak diketahui"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual Add Quiz
  const handleAddManualQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPertanyaan.trim() || !manualJawaban.trim()) {
      showToast("❌ Pertanyaan dan jawaban wajib diisi");
      return;
    }
    db.addQuiz(
      manualPertanyaan.trim(),
      manualJawaban.trim(),
      manualKategori,
      manualLevel,
      manualVisualHelper.trim() || undefined,
      "approved",
      "parent"
    );
    setManualPertanyaan("");
    setManualJawaban("");
    setManualVisualHelper("");
    setShowAddModal(false);
    refreshQuizzes();
    showToast("✅ Soal manual berhasil ditambahkan dan disetujui!");
  };

  // Bank Soal Actions
  const handleToggleStatus = (quizId: string, status: 'approved' | 'pending' | 'rejected') => {
    db.toggleQuizStatus(quizId, status);
    refreshQuizzes();
    showToast(`🛡️ Status soal diperbarui menjadi ${status.toUpperCase()}`);
  };

  const handleToggleActive = (quizId: string, currentActive: boolean) => {
    db.toggleQuizActive(quizId, !currentActive);
    refreshQuizzes();
    showToast(`⚡ Soal ${!currentActive ? "diaktifkan" : "dinonaktifkan"}`);
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus soal ini dari bank soal?")) {
      db.deleteQuiz(quizId);
      refreshQuizzes();
      showToast("🗑️ Soal berhasil dihapus");
    }
  };

  // Filter Quizzes
  const filteredQuizzes = quizzesList.filter((q) => {
    if (kategoriFilter !== "semua" && q.kategori !== kategoriFilter) return false;
    if (levelFilter !== "semua" && q.level !== levelFilter) return false;
    if (statusFilter !== "semua" && (q.status || "approved") !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        q.pertanyaan.toLowerCase().includes(query) ||
        q.jawaban.toLowerCase().includes(query) ||
        q.kategori.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Counts for validation badges
  const totalBankCount = quizzesList.length;
  const pendingCount = quizzesList.filter((q) => q.status === "pending").length;
  const approvedCount = quizzesList.filter((q) => (q.status || "approved") === "approved").length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans pb-24 selection:bg-violet-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-2xl border border-white/20 animate-bounce flex items-center gap-3">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Dashboard Orang Tua & Manajemen AI</h1>
                <p className="text-xs text-slate-400 mt-0.5">Pantau laporan belajar, atur tingkat kesulitan, dan validasi bank soal anak.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/pilih-profil"
              className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 border border-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <span>←</span> Kembali Pilih Profil
            </Link>
          </div>
        </header>

        {/* CHILD SELECTOR & NAVIGATION TABS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-3xl border border-white/10 backdrop-blur-md">
          {/* Child Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            <span className="text-xs font-bold text-slate-400 pl-2 pr-1 whitespace-nowrap">Profil Anak:</span>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedChildId === child.id
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 scale-102"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-base">{child.avatar}</span>
                <span>{child.nama_anak}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/30 font-bold uppercase tracking-wider">
                  {child.preferred_level || "mudah"}
                </span>
              </button>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('laporan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'laporan'
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📈 Laporan Belajar
            </button>

            <button
              onClick={() => setActiveTab('kesulitan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kesulitan'
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚙️ Tingkat Kesulitan Soal
            </button>

            <button
              onClick={() => setActiveTab('validasi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'validasi'
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🛡️ Bank Soal & Validasi AI
              {pendingCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('remedial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'remedial'
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ✏️ Evaluasi Remedial ({wrongAttempts.length})
            </button>
          </div>
        </div>

        {/* TAB 1: LAPORAN BELAJAR */}
        {activeTab === 'laporan' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl text-left shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akurasi Jawaban</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{stats.accuracy}%</p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Rata-rata keberhasilan</span>
              </div>

              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl text-left shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Soal Dikerjakan</p>
                <p className="text-3xl font-black text-indigo-400 mt-1">{stats.total}</p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Semua sesi belajar</span>
              </div>

              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl text-left shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jawaban Benar</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{stats.correct}</p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Poin berhasil dikumpulkan</span>
              </div>

              <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl text-left shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jawaban Salah</p>
                <p className="text-3xl font-black text-rose-400 mt-1">{stats.wrong}</p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Perlu latihan remedial</span>
              </div>
            </div>

            {/* CHARTS CONTAINER */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Circular Chart: Total Benar vs Salah */}
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between items-center text-center shadow-lg">
                <div className="w-full text-left">
                  <h3 className="text-sm font-black text-white">Total Benar & Salah</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Persentase keberhasilan pengerjaan kuis</p>
                </div>

                <div className="relative w-40 h-40 flex items-center justify-center my-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="12"
                      className="opacity-20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.accuracy / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{stats.accuracy}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Akurasi</span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-bold w-full justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-slate-300">Benar ({stats.correct})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span className="text-slate-300">Salah ({stats.wrong})</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart: Soal Salah & Benar per Tanggal */}
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl md:col-span-2 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-sm font-black text-white">Progres Belajar per Tanggal</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Grafik perbandingan harian dalam 5 hari terakhir</p>
                </div>

                <div className="flex items-end justify-between gap-4 h-44 border-b border-white/10 pb-2 mt-6 relative z-10">
                  {dailyData.map((data, idx) => {
                    const maxVal = Math.max(...dailyData.map((d) => d.correct + d.wrong), 4);
                    const correctHeight = `${(data.correct / maxVal) * 100}%`;
                    const wrongHeight = `${(data.wrong / maxVal) * 100}%`;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full max-w-[28px] flex flex-col justify-end gap-1 h-full relative">
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 text-[9px] font-bold whitespace-nowrap">
                            🟢 {data.correct} Benar • 🔴 {data.wrong} Salah
                          </div>

                          {data.correct > 0 && (
                            <div
                              style={{ height: correctHeight }}
                              className="bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md w-full shadow-inner transition-all duration-500"
                            />
                          )}

                          {data.wrong > 0 && (
                            <div
                              style={{ height: wrongHeight }}
                              className="bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md w-full shadow-inner transition-all duration-500"
                            />
                          )}

                          {data.correct === 0 && data.wrong === 0 && (
                            <div className="h-1 bg-white/5 w-full rounded" />
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{data.date}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[9px] text-slate-500 mt-2 text-right font-semibold">
                  *Arahkan kursor ke grafik kolom untuk melihat rincian jumlah pengerjaan.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENGATURAN TINGKAT KESULITAN SOAL */}
        {activeTab === 'kesulitan' && selectedChild && (
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl flex flex-col gap-8 shadow-xl animate-fadeIn text-left">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedChild.avatar}</span>
                <h2 className="text-2xl font-black text-white">Atur Tingkat Kesulitan untuk {selectedChild.nama_anak}</h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Tentukan tingkat kesulitan soal yang akan diberikan saat <strong className="text-violet-300">{selectedChild.nama_anak}</strong> bermain di Dashboard Anak. Anda juga bisa mengatur ke &quot;Semua Level&quot; agar anak mendapatkan variasi soal campuran.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {/* MUDAH */}
              <button
                onClick={() => handleUpdateDifficulty('mudah')}
                className={`p-6 rounded-3xl border flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden ${
                  (selectedChild.preferred_level || 'mudah') === 'mudah'
                    ? "bg-emerald-950/50 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-102 ring-2 ring-emerald-500/50"
                    : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">🌱</span>
                    {(selectedChild.preferred_level || 'mudah') === 'mudah' && (
                      <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Aktif Dipilih
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">Level Mudah</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Penjumlahan & pengurangan angka 1-10. Soal bergambar visual 1-6 item. Cocok untuk anak kelas 1 SD.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-bold text-emerald-400">
                  {(selectedChild.preferred_level || 'mudah') === 'mudah' ? "✓ Sedang Digunakan" : "Pilih Level Mudah →"}
                </div>
              </button>

              {/* SEDANG */}
              <button
                onClick={() => handleUpdateDifficulty('sedang')}
                className={`p-6 rounded-3xl border flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedChild.preferred_level === 'sedang'
                    ? "bg-amber-950/50 border-amber-500 shadow-xl shadow-amber-500/10 scale-102 ring-2 ring-amber-500/50"
                    : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">🔥</span>
                    {selectedChild.preferred_level === 'sedang' && (
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Aktif Dipilih
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">Level Sedang</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Penjumlahan & pengurangan angka 10-40, pengenalan perkalian dasar, dan soal cerita 2 langkah sederhana.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-bold text-amber-400">
                  {selectedChild.preferred_level === 'sedang' ? "✓ Sedang Digunakan" : "Pilih Level Sedang →"}
                </div>
              </button>

              {/* SUKAR */}
              <button
                onClick={() => handleUpdateDifficulty('sukar')}
                className={`p-6 rounded-3xl border flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedChild.preferred_level === 'sukar'
                    ? "bg-rose-950/50 border-rose-500 shadow-xl shadow-rose-500/10 scale-102 ring-2 ring-rose-500/50"
                    : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">🚀</span>
                    {selectedChild.preferred_level === 'sukar' && (
                      <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Aktif Dipilih
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">Level Sukar</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Penjumlahan & pengurangan angka besar (50-100), perkalian di atas 6, dan soal cerita logika tingkat tinggi.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-bold text-rose-400">
                  {selectedChild.preferred_level === 'sukar' ? "✓ Sedang Digunakan" : "Pilih Level Sukar →"}
                </div>
              </button>

              {/* SEMUA LEVEL */}
              <button
                onClick={() => handleUpdateDifficulty('semua')}
                className={`p-6 rounded-3xl border flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedChild.preferred_level === 'semua'
                    ? "bg-indigo-950/50 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-102 ring-2 ring-indigo-500/50"
                    : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">🎲</span>
                    {selectedChild.preferred_level === 'semua' && (
                      <span className="bg-indigo-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">
                        Aktif Dipilih
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">Semua Level (Campuran)</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Anak akan mendapatkan campuran soal mudah, sedang, dan sukar secara acak untuk melatih adaptasi penuh.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-bold text-indigo-400">
                  {selectedChild.preferred_level === 'semua' ? "✓ Sedang Digunakan" : "Pilih Campuran →"}
                </div>
              </button>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="text-lg">💡</span>
              <span><strong>Catatan Orang Tua:</strong> Perubahan tingkat kesulitan berlaku instan pada sesi kuis berikutnya di Dashboard Anak. Anda tidak perlu memuat ulang halaman.</span>
            </div>
          </div>
        )}

        {/* TAB 3: BANK SOAL & VALIDASI ORANG TUA */}
        {activeTab === 'validasi' && (
          <div className="flex flex-col gap-8 animate-fadeIn text-left">
            
            {/* AI RANDOM QUESTION GENERATOR CARD */}
            <div className="bg-gradient-to-br from-violet-950/80 via-slate-900 to-indigo-950/80 border-2 border-violet-500/30 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider mb-2 inline-block">
                    🤖 Google AI / Algorithmic Generator
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    ✨ Generator Soal Acak Cerdas (AI)
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Buat soal baru secara otomatis menggunakan kecerdasan buatan. Anda bisa memilih apakah soal langsung disetujui atau masuk daftar tunggu validasi orang tua.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/15 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
                >
                  <span>➕</span> Tambah Soal Manual
                </button>
              </div>

              {/* AI GENERATOR CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Kategori Soal</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="penjumlahan">🧮 Penjumlahan & Pengurangan</option>
                    <option value="perkalian">✖️ Perkalian</option>
                    <option value="visual">🍎 Soal Interaktif (Visual)</option>
                    <option value="soal_cerita">🎙️ Soal Cerita / Podcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Tingkat Kesulitan</label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="mudah">🌱 Level Mudah</option>
                    <option value="sedang">🔥 Level Sedang</option>
                    <option value="sukar">🚀 Level Sukar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Jumlah Soal</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value={1}>1 Soal Baru</option>
                    <option value={3}>3 Soal Baru (Rekomendasi)</option>
                    <option value={5}>5 Soal Baru</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Validasi Oleh Orang Tua</label>
                  <select
                    value={aiAutoApprove ? "auto" : "pending"}
                    onChange={(e) => setAiAutoApprove(e.target.value === "auto")}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="pending">⏳ Masuk Daftar Tunggu (Pending)</option>
                    <option value="auto">✅ Langsung Setujui & Aktifkan</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleTriggerAIGenerator}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 active:scale-95 text-white font-black rounded-xl shadow-lg shadow-violet-600/30 text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin text-sm">⌛</span>
                        <span>Berpikir AI...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate Soal Acak</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BANK SOAL & VALIDASI LIST SECTION */}
            <div className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
              {/* Summary Stats & Search/Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-slate-800 border border-white/10 px-3 py-1.5 rounded-xl font-black text-slate-300">
                    📚 Total Bank Soal: <strong className="text-white">{totalBankCount}</strong>
                  </span>
                  <span className="text-xs bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl font-black text-amber-300">
                    ⏳ Perlu Validasi: <strong className="text-amber-400">{pendingCount}</strong>
                  </span>
                  <span className="text-xs bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-black text-emerald-300">
                    ✅ Disetujui & Aktif: <strong className="text-emerald-400">{approvedCount}</strong>
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="🔍 Cari pertanyaan atau angka..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/40 border border-white/15 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-full sm:w-48"
                  />

                  <select
                    value={kategoriFilter}
                    onChange={(e) => setKategoriFilter(e.target.value)}
                    className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="semua">Semua Kategori</option>
                    <option value="penjumlahan">Penjumlahan & Pengurangan</option>
                    <option value="perkalian">Perkalian</option>
                    <option value="visual">Visual</option>
                    <option value="soal_cerita">Soal Cerita</option>
                  </select>

                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="semua">Semua Level</option>
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sukar">Sukar</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="semua">Semua Status Validasi</option>
                    <option value="pending">⏳ Menunggu Validasi (Pending)</option>
                    <option value="approved">✅ Disetujui (Approved)</option>
                    <option value="rejected">❌ Ditolak (Rejected)</option>
                  </select>
                </div>
              </div>

              {/* QUESTIONS TABLE / CARDS */}
              {filteredQuizzes.length === 0 ? (
                <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/5">
                  <span className="text-4xl block mb-3">📭</span>
                  <p className="text-sm font-bold text-slate-300">Tidak ada soal yang cocok dengan filter pencarian Anda.</p>
                  <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter atau generate soal acak baru menggunakan tombol AI di atas!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-[580px] overflow-y-auto pr-2">
                  {filteredQuizzes.map((q) => {
                    const status = q.status || "approved";
                    const isActive = q.is_active !== false && status === "approved";

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          status === "pending"
                            ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60"
                            : status === "rejected"
                            ? "bg-rose-950/20 border-rose-500/30 opacity-70"
                            : isActive
                            ? "bg-black/40 border-white/10 hover:border-white/20"
                            : "bg-black/20 border-white/5 opacity-60"
                        }`}
                      >
                        {/* Left: Question Content & Badges */}
                        <div className="flex flex-col gap-2 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Status Badge */}
                            {status === "pending" ? (
                              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                ⏳ Perlu Validasi Orang Tua
                              </span>
                            ) : status === "rejected" ? (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                ❌ Ditolak
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                ✅ Disetujui
                              </span>
                            )}

                            {/* Active Switch status */}
                            {status === "approved" && (
                              <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
                              }`}>
                                {isActive ? "⚡ Aktif untuk Anak" : "🔒 Nonaktif"}
                              </span>
                            )}

                            {/* Category & Level Badges */}
                            <span className="bg-white/5 border border-white/10 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                              {q.kategori.replace("_", " ")}
                            </span>
                            <span className="bg-white/5 border border-white/10 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                              Level {q.level}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold italic">
                              • Sumber: {q.created_by === "ai" ? "🤖 AI Generator" : q.created_by === "parent" ? "🧑‍🧑‍🧒 Orang Tua" : "⭐ Sistem"}
                            </span>
                          </div>

                          <p className="text-base font-black text-white leading-relaxed mt-1">
                            {q.pertanyaan}
                          </p>

                          {q.visual_helper && (
                            <div className="flex items-center gap-1 my-1 bg-black/40 p-2 rounded-xl w-fit border border-white/5">
                              <span className="text-xs text-slate-400 font-bold mr-1">Helper Gambar:</span>
                              <span className="text-xl tracking-wider">{q.visual_helper}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                            <span>Kunci Jawaban Angka: <strong className="text-amber-300 font-black text-sm px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">{q.jawaban}</strong></span>
                          </div>
                        </div>

                        {/* Right Actions Panel */}
                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
                          {/* If Pending, prominent Approve/Reject Buttons */}
                          {status === "pending" && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(q.id, "approved")}
                                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                              >
                                ✅ Setujui Soal
                              </button>
                              <button
                                onClick={() => handleToggleStatus(q.id, "rejected")}
                                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                              >
                                ❌ Tolak
                              </button>
                            </>
                          )}

                          {/* If Approved, can toggle Active/Inactive */}
                          {status === "approved" && (
                            <button
                              onClick={() => handleToggleActive(q.id, isActive)}
                              className={`px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                isActive
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10"
                                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
                              }`}
                            >
                              {isActive ? "🔒 Nonaktifkan" : "⚡ Aktifkan"}
                            </button>
                          )}

                          {/* If Rejected, can re-approve */}
                          {status === "rejected" && (
                            <button
                              onClick={() => handleToggleStatus(q.id, "approved")}
                              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                            >
                              🔄 Pulihkan & Setujui
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteQuiz(q.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 rounded-xl transition-all cursor-pointer text-sm"
                            title="Hapus Soal"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EVALUASI SOAL SALAH SECTION */}
        {activeTab === 'remedial' && (
          <section className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl text-left shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>🛡️</span> Evaluasi & Remedial Soal Salah
                </h3>
                <p className="text-xs text-slate-400 mt-1">Daftar soal yang salah dijawab oleh {selectedChild?.nama_anak || "anak"}. Ajak anak mencoba ulang untuk memperbaiki skor!</p>
              </div>
              <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-full font-black">
                {wrongAttempts.length} Soal Perlu Perbaikan
              </span>
            </div>

            {wrongAttempts.length === 0 ? (
              <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/5">
                <span className="text-4xl block mb-3">🎉</span>
                <p className="text-sm font-bold text-slate-300">Hebat! Belum ada soal yang salah dijawab oleh {selectedChild?.nama_anak || "anak"}.</p>
                <p className="text-xs text-slate-500 mt-1">Pertahankan terus motivasi dan prestasi belajarnya!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-2">
                {wrongAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/15 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">Latihan Remedial</span>
                      <p className="text-base font-black text-white">{attempt.soal}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium flex-wrap">
                        <span>Coretan Anak Sebelumnya: <strong className="text-rose-400 font-bold">{attempt.jawaban_anak}</strong></span>
                        <span>•</span>
                        <span>Kunci Jawaban Benar: <strong className="text-emerald-400 font-bold">{attempt.jawaban_benar}</strong></span>
                        <span>•</span>
                        <span>Tanggal: {new Date(attempt.created_at).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        db.setActiveChild(selectedChildId);
                        window.location.href = `/quiz?remedial_question=${encodeURIComponent(attempt.soal)}&remedial_answer=${attempt.jawaban_benar}&attempt_id=${attempt.id}`;
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow shadow-amber-500/20 whitespace-nowrap"
                    >
                      ✏️ Coba Lagi! (Remedial)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MANUAL ADD QUIZ MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-left relative">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>➕</span> Tambah Soal Manual Ke Bank Soal
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualQuiz} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pertanyaan / Soal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Berapa hasil 8 + 7?"
                  value={manualPertanyaan}
                  onChange={(e) => setManualPertanyaan(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kunci Jawaban Angka</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 15"
                    value={manualJawaban}
                    onChange={(e) => setManualJawaban(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-black placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={manualKategori}
                    onChange={(e) => setManualKategori(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="penjumlahan">Penjumlahan & Pengurangan</option>
                    <option value="perkalian">Perkalian</option>
                    <option value="visual">Visual</option>
                    <option value="soal_cerita">Soal Cerita</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={manualLevel}
                    onChange={(e) => setManualLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sukar">Sukar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Helper Emoji (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 🍎🍎🍎"
                    value={manualVisualHelper}
                    onChange={(e) => setManualVisualHelper(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-violet-600/20"
                >
                  ✅ Simpan & Setujui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
