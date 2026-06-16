"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; delay: number; size: number }[]>([]);

  // Generate twinkling stars background
  useEffect(() => {
    const starList = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 3 + 1,
    }));
    const timer = setTimeout(() => {
      setStars(starList);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex flex-col items-center justify-center overflow-hidden px-4 py-12 select-none">
      {/* Background Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white opacity-80 animate-pulse"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: "2s",
            }}
          />
        ))}
      </div>

      {/* Cosmic Floating Planet shapes */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-bounce" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-bounce" style={{ animationDuration: '12s' }} />

      {/* Main Content Card Container */}
      <div className="z-10 text-center max-w-2xl w-full flex flex-col items-center">
        {/* Playful Floating Logo */}
        <div className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md animate-bounce" style={{ animationDuration: '3s' }}>
          <span className="text-xl">🚀</span>
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Dunia Edukasi AI Masa Depan</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 drop-shadow-sm mb-4">
          LogiKid
        </h1>
        <p className="text-base md:text-lg text-slate-300 max-w-lg mb-12 font-medium leading-relaxed">
          Petualangan seru belajar matematika & logika dengan teknologi <span className="text-amber-400 font-bold">Kecerdasan Buatan (AI)</span>. Coret jawabannya langsung di kanvas pintar!
        </p>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-lg">
          {/* Kids Entrance Card */}
          <Link href="/pilih-profil" className="group relative block rounded-3xl overflow-hidden p-[2px] hover:scale-105 active:scale-98 transition-all duration-300 shadow-xl shadow-pink-500/10 hover:shadow-pink-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-500 group-hover:animate-pulse" />
            <div className="relative bg-slate-900 hover:bg-slate-900/95 p-6 rounded-[22px] flex flex-col items-center gap-4 transition-colors">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-4xl group-hover:animate-bounce">
                🐻‍🚀
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">Portal Anak-Anak</h3>
                <p className="text-xs text-slate-400 mt-1">Mulai petualangan kuis, menangkan koin & kumpulkan bintang!</p>
              </div>
              <span className="mt-2 text-xs font-bold text-pink-400 flex items-center gap-1">
                Main Sekarang <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </Link>

          {/* Parents Entrance Card */}
          <Link href="/login" className="group relative block rounded-3xl overflow-hidden p-[2px] hover:scale-105 active:scale-98 transition-all duration-300 shadow-xl shadow-violet-500/10 hover:shadow-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-indigo-600 to-emerald-500 group-hover:animate-pulse" />
            <div className="relative bg-slate-900 hover:bg-slate-900/95 p-6 rounded-[22px] flex flex-col items-center gap-4 transition-colors">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center text-4xl group-hover:animate-bounce">
                📈
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">Portal Orang Tua</h3>
                <p className="text-xs text-slate-400 mt-1">Pantau perkembangan anak, lihat soal salah, & evaluasi belajar.</p>
              </div>
              <span className="mt-2 text-xs font-bold text-violet-400 flex items-center gap-1">
                Analisis Progres <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Small footer decorator */}
        <div className="mt-16 text-[10px] text-slate-500 font-medium">
          Ditenagai oleh TensorFlow.js • LogiKid v1.0
        </div>
      </div>
    </main>
  );
}