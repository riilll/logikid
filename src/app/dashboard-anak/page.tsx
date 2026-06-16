"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, ChildProfile, Reward } from "@/lib/db";

export default function DashboardAnak() {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [theme, setTheme] = useState<'space' | 'jungle' | 'ocean'>("space");

  // Floating decoration emojis depending on the theme
  const [decorations, setDecorations] = useState<{ id: number; char: string; top: number; left: number; delay: number; scale: number }[]>([]);

  const generateDecorations = useCallback((currentTheme: 'space' | 'jungle' | 'ocean') => {
    let pool = ["⭐", "🚀", "🪐", "👽", "☄️"];
    if (currentTheme === "jungle") {
      pool = ["🌴", "🐒", "🦁", "🦜", "🍌", "🌿"];
    } else if (currentTheme === "ocean") {
      pool = ["🌊", "🐠", "🐙", "🐳", "🦀", "🐬"];
    }

    const items = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      char: pool[Math.floor(Math.random() * pool.length)],
      top: Math.random() * 80 + 10,
      left: Math.random() * 90 + 5,
      delay: Math.random() * 4,
      scale: Math.random() * 0.7 + 0.6,
    }));
    setDecorations(items);
  }, []);

  useEffect(() => {
    const activeChild = db.getActiveChild();
    if (!activeChild) {
      // If no active child profile, go back to profile selection
      router.push("/pilih-profil");
      return;
    }

    const timer = setTimeout(() => {
      setChild(activeChild);
      setTheme(activeChild.theme);

      const r = db.getRewardByChildId(activeChild.id);
      setReward(r);

      generateDecorations(activeChild.theme);
    }, 0);

    return () => clearTimeout(timer);
  }, [router, generateDecorations]);

  const handleToggleTheme = (newTheme: 'space' | 'jungle' | 'ocean') => {
    if (!child) return;
    db.updateChildTheme(child.id, newTheme);
    
    // update local state
    const updatedChild = { ...child, theme: newTheme };
    setChild(updatedChild);
    setTheme(newTheme);
    generateDecorations(newTheme);
  };

  if (!child) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">
        Memuat petualangan...
      </div>
    );
  }

  // Define theme-based styling classes
  const getThemeBg = () => {
    switch (theme) {
      case "jungle":
        return "from-emerald-950 via-teal-900 to-green-950";
      case "ocean":
        return "from-cyan-950 via-blue-900 to-slate-950";
      case "space":
      default:
        return "from-indigo-950 via-slate-900 to-violet-950";
    }
  };


  return (
    <main className={`relative min-h-screen bg-gradient-to-br ${getThemeBg()} flex flex-col p-6 overflow-hidden transition-all duration-500 select-none`}>
      {/* Floating Theme Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {decorations.map((dec) => (
          <div
            key={dec.id}
            className="absolute opacity-20 text-3xl animate-bounce"
            style={{
              top: `${dec.top}%`,
              left: `${dec.left}%`,
              animationDelay: `${dec.delay}s`,
              animationDuration: "6s",
              transform: `scale(${dec.scale})`,
            }}
          >
            {dec.char}
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl mb-8">
        {/* Child Profile Details */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-black/30 border border-white/10 rounded-2xl flex items-center justify-center text-4xl animate-pulse">
            {child.avatar}
          </div>
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              Halo, {child.nama_anak}! 
              <span className="text-sm px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold uppercase tracking-wide">
                Level {reward?.level || 1}
              </span>
            </h1>
            <p className="text-xs text-slate-300 font-semibold">{child.kelas} • Belajar & Bermain</p>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="flex items-center gap-4 bg-black/20 px-4 py-2.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1">
            <span className="text-lg">⭐</span>
            <div className="text-left">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Total Bintang</span>
              <span className="text-sm font-black text-amber-300">{reward?.total_poin || 0} Poin</span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-1">
            <span className="text-lg">🔥</span>
            <div className="text-left">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Hari Streak</span>
              <span className="text-sm font-black text-rose-400">{reward?.streak || 0} Soal</span>
            </div>
          </div>
        </div>

        {/* Theme Toggles */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Ganti Tema:</span>
          {(['space', 'jungle', 'ocean'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleToggleTheme(t)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer hover:scale-110 active:scale-90 ${
                theme === t
                  ? "bg-white/20 border border-white/30 scale-105 shadow"
                  : "bg-transparent opacity-50 hover:opacity-100"
              }`}
              title={`Tema ${t}`}
            >
              {t === 'space' ? "🚀" : t === 'jungle' ? "🌴" : "🌊"}
            </button>
          ))}
        </div>
      </header>

      {/* GAME MODES LIST */}
      <section className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-6 flex-grow justify-center">
        <h2 className="text-2xl font-black text-white tracking-wide text-center md:text-left">
          Pilih Petualangan Belajarmu!
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Game Menghitung (Math) */}
          <Link
            href="/quiz?cat=penjumlahan"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-103 active:scale-98 transition-all duration-300 shadow-2xl"
          >
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-300 text-3xl mb-4 group-hover:scale-110 group-hover:animate-bounce transition-transform">
                🧮
              </div>
              <h3 className="text-lg font-black text-white mb-2">Game Menghitung</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Pecahkan tantangan kuis matematika penjumlahan dan pengurangan dengan cepat. Tulis jawaban angkamu langsung pada kanvas!
              </p>
            </div>
            <div className={`w-full py-2.5 rounded-xl bg-amber-500 text-slate-900 font-extrabold text-xs text-center shadow shadow-amber-500/20 transition-all group-hover:shadow-lg`}>
              Mulai Menghitung →
            </div>
          </Link>

          {/* Soal Interaktif (Visual) */}
          <Link
            href="/quiz?cat=visual"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-103 active:scale-98 transition-all duration-300 shadow-2xl"
          >
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 text-3xl mb-4 group-hover:scale-110 group-hover:animate-bounce transition-transform">
                🍎
              </div>
              <h3 className="text-lg font-black text-white mb-2">Soal Interaktif</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Hitung jumlah apel, bintang, wortel, dan ikan badut lucu yang muncul di layar, lalu tunjukkan kemampuan menulismu!
              </p>
            </div>
            <div className={`w-full py-2.5 rounded-xl bg-indigo-500 text-white font-extrabold text-xs text-center shadow shadow-indigo-500/20 transition-all group-hover:shadow-lg`}>
              Mulai Hitung Gambar →
            </div>
          </Link>

          {/* Soal Cerita / Podcast (Audio Story) */}
          <Link
            href="/quiz?cat=soal_cerita"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-103 active:scale-98 transition-all duration-300 shadow-2xl"
          >
            <div>
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-500/20 text-rose-300 text-3xl mb-4 group-hover:scale-110 group-hover:animate-bounce transition-transform">
                🎙️
              </div>
              <h3 className="text-lg font-black text-white mb-2">Soal Cerita / Podcast</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Dengarkan dongeng cerita matematika yang dibacakan oleh suara AI yang ramah, lalu pecahkan teka-teki ceritanya!
              </p>
            </div>
            <div className={`w-full py-2.5 rounded-xl bg-rose-500 text-white font-extrabold text-xs text-center shadow shadow-rose-500/20 transition-all group-hover:shadow-lg`}>
              Dengarkan Cerita →
            </div>
          </Link>
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto flex justify-between items-center mt-12">
        <Link
          href="/pilih-profil"
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
        >
          ← Ganti Profil Anak
        </Link>

        <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
          Belajar itu Menyenangkan! 🌟
        </span>
      </footer>
    </main>
  );
}
