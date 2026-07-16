"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Home() {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; delay: number; size: number }[]>([]);

  // Generate twinkling stars background
  useEffect(() => {
    const starList = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 4 + 2,
    }));
    const timer = setTimeout(() => {
      setStars(starList);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-600 via-indigo-900 to-purple-950 flex flex-col items-center justify-center overflow-hidden px-4 py-12 select-none font-sans">
      {/* Background Twinkling Stars & Clouds */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-yellow-200 opacity-90 animate-pulse shadow-sm shadow-yellow-100"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: "2.5s",
            }}
          />
        ))}
      </div>

      {/* Decorative Floating Clouds */}
      <div className="absolute top-10 left-6 text-6xl opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '7s' }}>☁️</div>
      <div className="absolute top-24 right-10 text-7xl opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '9s' }}>☁️</div>
      <div className="absolute bottom-16 left-16 text-6xl opacity-25 animate-bounce pointer-events-none" style={{ animationDuration: '6s' }}>☁️</div>
      <div className="absolute bottom-10 right-20 text-8xl opacity-20 animate-bounce pointer-events-none" style={{ animationDuration: '10s' }}>☁️</div>

      {/* Main Toy-Like Content Card Container */}
      <div className="z-10 text-center max-w-3xl w-full flex flex-col items-center">
        
        {/* Playful Floating Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-yellow-400 border-4 border-yellow-200 text-slate-950 px-6 py-2.5 rounded-full shadow-[0_6px_0_0_#b45309] font-black text-sm uppercase tracking-wider animate-bounce" style={{ animationDuration: '3s' }}>
          <span>🌟</span>
          <span>DUNIA BELAJAR AJAIB ANAK</span>
          <span>🌟</span>
        </div>

        {/* Kodi The Bear Speech Bubble */}
        <div className="relative bg-white text-slate-900 px-6 py-4 rounded-3xl border-4 border-yellow-400 shadow-xl max-w-md mb-8 flex items-center gap-4 transform hover:scale-105 transition-transform">
          <div className="text-5xl animate-wiggle">🐻</div>
          <div className="text-left">
            <p className="font-extrabold text-sm md:text-base leading-tight text-indigo-950">
              &quot;Halo Teman-Teman! Siap bermain dan melukis angka bersama Kodi hari ini?&quot;
            </p>
          </div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-b-4 border-r-4 border-yellow-400 rotate-45" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.4)] mb-4">
          Logi<span className="text-yellow-400">Kid</span>
        </h1>
        
        <p className="text-base md:text-xl text-sky-100 max-w-xl mb-12 font-extrabold leading-relaxed drop-shadow-md">
          Belajar matematika & logika jadi super menyenangkan dengan <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-xl font-black shadow-sm">AI Pintar</span>!
        </p>

        {/* Chunky Khan Academy Kids Style Toy Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl px-2">
          {/* Kids Entrance Toy Card */}
          <Link
            href="/pilih-profil"
            className="group relative block rounded-3xl bg-gradient-to-t from-amber-500 via-yellow-400 to-yellow-300 p-6 border-4 border-yellow-100 border-b-[10px] border-b-amber-700 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-slate-950"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-white/80 border-4 border-amber-300 rounded-3xl flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                🚀🐻
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">Mulai Bermain!</h3>
                <p className="text-xs md:text-sm font-bold text-amber-950 mt-1">
                  Pilih karakter favoritmu, menangkan bintang & pecahkan kuis seru!
                </p>
              </div>
              <div className="mt-2 bg-slate-950 text-yellow-300 font-black px-6 py-3 rounded-2xl shadow-md text-sm group-hover:bg-indigo-900 transition-colors flex items-center gap-2">
                <span>MASUK KE DUNIA ANAK</span>
                <span className="text-lg animate-bounce">🎨</span>
              </div>
            </div>
          </Link>

          {/* Parents Entrance Toy Card */}
          <Link
            href="/login"
            className="group relative block rounded-3xl bg-gradient-to-t from-purple-700 via-indigo-600 to-violet-500 p-6 border-4 border-violet-200 border-b-[10px] border-b-purple-950 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-white"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-white/20 border-4 border-violet-300 rounded-3xl flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                🦉📊
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">Ruang Ayah & Bunda</h3>
                <p className="text-xs md:text-sm font-bold text-violet-100 mt-1">
                  Atur tingkat kesulitan, validasi soal AI, & pantau laporan belajar.
                </p>
              </div>
              <div className="mt-2 bg-white text-purple-950 font-black px-6 py-3 rounded-2xl shadow-md text-sm group-hover:bg-yellow-300 transition-colors flex items-center gap-2">
                <span>PORTAL ORANG TUA</span>
                <span className="text-lg animate-bounce">⚙️</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Playful footer decorator */}
        <div className="mt-14 inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 text-xs font-bold text-sky-200">
          <span>🎮 Ditenagai oleh TensorFlow.js Digital Ink</span>
          <span>•</span>
          <span>LogiKid Kids v1.0</span>
        </div>
      </div>
    </main>
  );
}