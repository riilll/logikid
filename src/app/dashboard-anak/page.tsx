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

  const [decorations, setDecorations] = useState<{ id: number; char: string; top: number; left: number; delay: number; scale: number }[]>([]);

  const generateDecorations = useCallback((currentTheme: 'space' | 'jungle' | 'ocean') => {
    let pool = ["⭐", "🚀", "🪐", "👽", "☄️", "☁️"];
    if (currentTheme === "jungle") {
      pool = ["🌴", "🐒", "🦁", "🦜", "🍌", "🌿", "☁️"];
    } else if (currentTheme === "ocean") {
      pool = ["🌊", "🐠", "🐙", "🐳", "🦀", "🐬", "🫧"];
    }

    const items = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      char: pool[Math.floor(Math.random() * pool.length)],
      top: Math.random() * 85 + 5,
      left: Math.random() * 90 + 5,
      delay: Math.random() * 4,
      scale: Math.random() * 0.8 + 0.6,
    }));
    setDecorations(items);
  }, []);

  useEffect(() => {
    const activeChild = db.getActiveChild();
    if (!activeChild) {
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
    
    const updatedChild = { ...child, theme: newTheme };
    setChild(updatedChild);
    setTheme(newTheme);
    generateDecorations(newTheme);
  };

  if (!child) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black text-xl animate-pulse">
        Membuka Peta Petualangan... 🗺️
      </div>
    );
  }

  const getThemeBg = () => {
    switch (theme) {
      case "jungle":
        return "from-emerald-800 via-teal-900 to-green-950";
      case "ocean":
        return "from-sky-600 via-blue-900 to-indigo-950";
      case "space":
      default:
        return "from-indigo-900 via-purple-900 to-slate-950";
    }
  };

  return (
    <main className={`relative min-h-screen bg-gradient-to-b ${getThemeBg()} flex flex-col p-6 overflow-hidden transition-all duration-500 select-none font-sans`}>
      {/* Floating Theme Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {decorations.map((dec) => (
          <div
            key={dec.id}
            className="absolute opacity-25 text-4xl animate-bounce"
            style={{
              top: `${dec.top}%`,
              left: `${dec.left}%`,
              animationDelay: `${dec.delay}s`,
              animationDuration: "5.5s",
              transform: `scale(${dec.scale})`,
            }}
          >
            {dec.char}
          </div>
        ))}
      </div>

      {/* CHUNKY KHAN ACADEMY KIDS STYLE HEADER SECTION */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-white/10 border-4 border-white/20 rounded-3xl p-5 backdrop-blur-md shadow-2xl mb-8">
        {/* Child Profile Details */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white border-4 border-yellow-300 rounded-full flex items-center justify-center text-5xl shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
            {child.avatar}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-sm">
                Halo, {child.nama_anak}!
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-black uppercase tracking-wide border-2 border-white shadow-sm">
                LV {reward?.level || 1}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-sky-100 font-extrabold mt-1">
              <span>{child.kelas}</span>
              <span>•</span>
              <span className="px-3 py-1 rounded-full bg-indigo-950/80 border border-yellow-300 text-yellow-300 font-black">
                Level Soal: {(child.preferred_level || "mudah").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="flex items-center gap-4 bg-slate-950/70 border-2 border-white/20 px-5 py-3 rounded-2xl shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-spin" style={{ animationDuration: '10s' }}>⭐️</span>
            <div className="text-left">
              <span className="block text-[10px] text-yellow-200 font-black uppercase tracking-wider">Total Bintang</span>
              <span className="text-lg font-black text-yellow-400">{reward?.total_poin || 0} Poin</span>
            </div>
          </div>
          
          <div className="h-10 w-[2px] bg-white/20" />

          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🔥</span>
            <div className="text-left">
              <span className="block text-[10px] text-rose-200 font-black uppercase tracking-wider">Hari Streak</span>
              <span className="text-lg font-black text-rose-400">{reward?.streak || 0} Hari</span>
            </div>
          </div>
        </div>

        {/* Theme Toggles */}
        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border-2 border-white/20">
          <span className="text-[10px] font-black text-yellow-300 uppercase px-1">Dunia:</span>
          {(['space', 'jungle', 'ocean'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleToggleTheme(t)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer hover:scale-115 active:scale-90 ${
                theme === t
                  ? "bg-yellow-400 border-2 border-white scale-110 shadow-lg text-slate-950"
                  : "bg-transparent opacity-60 hover:opacity-100 text-white"
              }`}
              title={`Dunia ${t}`}
            >
              {t === 'space' ? "🚀" : t === 'jungle' ? "🌴" : "🌊"}
            </button>
          ))}
        </div>
      </header>

      {/* MASCOT SPEECH BUBBLE & TITLE */}
      <section className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-6 flex-grow justify-center">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left bg-white/10 border-2 border-white/20 p-4 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-4xl animate-wiggle">🐻</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                Pilih Petualangan Belajarmu Hari Ini!
              </h2>
              <p className="text-xs text-yellow-300 font-extrabold mt-0.5">
                ✨ Tingkat Kesulitan dari Orang Tua: <strong className="text-white uppercase underline">{(child?.preferred_level || 'mudah')}</strong> (Soal disesuaikan otomatis)
              </p>
            </div>
          </div>
          <span className="text-xs font-black bg-yellow-400 text-slate-950 px-4 py-2 rounded-2xl border border-white shadow-sm self-center">
            🎯 Level: {(child?.preferred_level || 'mudah').toUpperCase()}
          </span>
        </div>
        
        {/* TOY CARDS GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Game Menghitung (Penjumlahan & Pengurangan) */}
          <Link
            href="/quiz?cat=penjumlahan"
            className="group relative bg-gradient-to-t from-amber-500 via-yellow-400 to-yellow-300 border-4 border-yellow-100 border-b-[10px] border-b-amber-700 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl text-slate-950 cursor-pointer"
          >
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-4 border-amber-300 text-4xl mb-4 group-hover:scale-115 group-hover:rotate-6 transition-transform shadow-inner">
                🧮
              </div>
              <h3 className="text-xl font-black mb-2 drop-shadow-sm leading-tight">Penjumlahan & Pengurangan</h3>
              <p className="text-xs font-bold text-amber-950 leading-relaxed">
                Pecahkan tantangan tambah-tambahan dan kurang-kurangan. Tulis angka jawabanmu langsung di kanvas!
              </p>
            </div>
            <div className="w-full py-3 rounded-2xl bg-slate-950 text-yellow-300 font-black text-xs text-center shadow-md group-hover:bg-indigo-950 transition-colors flex items-center justify-center gap-2">
              <span>MAIN SEKARANG</span>
              <span>🚀</span>
            </div>
          </Link>

          {/* 2. Game Perkalian */}
          <Link
            href="/quiz?cat=perkalian"
            className="group relative bg-gradient-to-t from-emerald-500 via-teal-400 to-green-300 border-4 border-emerald-100 border-b-[10px] border-b-emerald-700 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl text-slate-950 cursor-pointer"
          >
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-4 border-emerald-300 text-4xl mb-4 group-hover:scale-115 group-hover:-rotate-6 transition-transform shadow-inner">
                ✖️
              </div>
              <h3 className="text-xl font-black mb-2 drop-shadow-sm leading-tight">Game Perkalian Cepat</h3>
              <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                Latih kecepatan ingatan perkalian dasar dengan seru dan interaktif. Tunjukkan angka jawabanmu yang tebal!
              </p>
            </div>
            <div className="w-full py-3 rounded-2xl bg-slate-950 text-emerald-300 font-black text-xs text-center shadow-md group-hover:bg-indigo-950 transition-colors flex items-center justify-center gap-2">
              <span>MAIN PERKALIAN</span>
              <span>⚡</span>
            </div>
          </Link>

          {/* 3. Soal Interaktif (Visual) */}
          <Link
            href="/quiz?cat=visual"
            className="group relative bg-gradient-to-t from-indigo-600 via-purple-500 to-violet-400 border-4 border-indigo-200 border-b-[10px] border-b-indigo-900 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl text-white cursor-pointer"
          >
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-4 border-purple-300 text-4xl mb-4 group-hover:scale-115 group-hover:rotate-6 transition-transform shadow-inner text-slate-950">
                🍎
              </div>
              <h3 className="text-xl font-black mb-2 drop-shadow-sm leading-tight">Hitung Gambar (Visual)</h3>
              <p className="text-xs font-bold text-indigo-100 leading-relaxed">
                Hitung apel, bintang, wortel, stroberi, dan bola sepak lucu yang muncul di layar, lalu lukis angkamu!
              </p>
            </div>
            <div className="w-full py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xs text-center shadow-md group-hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
              <span>HITUNG GAMBAR</span>
              <span>⭐️</span>
            </div>
          </Link>

          {/* 4. Soal Cerita / Podcast (Audio Story) */}
          <Link
            href="/quiz?cat=soal_cerita"
            className="group relative bg-gradient-to-t from-rose-600 via-pink-500 to-rose-400 border-4 border-rose-200 border-b-[10px] border-b-rose-900 p-6 rounded-3xl flex flex-col justify-between gap-6 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl text-white cursor-pointer"
          >
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-4 border-rose-300 text-4xl mb-4 group-hover:scale-115 group-hover:-rotate-6 transition-transform shadow-inner text-slate-950">
                🎙️
              </div>
              <h3 className="text-xl font-black mb-2 drop-shadow-sm leading-tight">Soal Cerita Podcast</h3>
              <p className="text-xs font-bold text-rose-100 leading-relaxed">
                Dengarkan dongeng cerita matematika yang dibacakan narator AI ramah, lalu pecahkan teka-tekinya!
              </p>
            </div>
            <div className="w-full py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-xs text-center shadow-md group-hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
              <span>DENGARKAN CERITA</span>
              <span>🎧</span>
            </div>
          </Link>
        </div>
      </section>

      {/* FOOTER ACTIONS */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto flex justify-between items-center mt-12 pt-4 border-t border-white/10">
        <Link
          href="/pilih-profil"
          className="text-xs font-black bg-slate-950 hover:bg-slate-900 text-yellow-300 px-5 py-2.5 rounded-2xl border-2 border-yellow-400/50 hover:border-yellow-400 transition-all shadow flex items-center gap-2"
        >
          <span>←</span> Ganti Profil Anak
        </Link>

        <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-2xl border border-white/10 text-xs font-extrabold text-sky-200">
          <span>🌟 Belajar Itu Menyenangkan!</span>
        </div>
      </footer>
    </main>
  );
}
