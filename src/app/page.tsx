"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { db, User } from "@/lib/db";

export default function Home() {
  const [stars, setStars] = useState<{ id: number; top: number; left: number; delay: number; size: number }[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  useEffect(() => {
    // Check user info inside client
    const user = db.getActiveUser();
    setActiveUser(user);

    // Generate twinkling stars background
    const starList = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 4 + 2,
    }));
    setStars(starList);
  }, []);

  const handleQuickDemoLogin = () => {
    const res = db.loginUser("fahril@email.com", "password123");
    if (res.user) {
      db.setActiveUser(res.user);
      window.location.href = "/pilih-profil";
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-600 via-indigo-900 to-purple-950 flex flex-col items-center justify-center overflow-hidden px-4 py-10 select-none font-sans">
      {/* Background Twinkling Stars */}
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

      {/* Main Container */}
      <div className="z-10 text-center max-w-4xl w-full flex flex-col items-center">
        
        {/* Active Account Banner if logged in */}
        {activeUser && (
          <div className="mb-4 bg-yellow-400 text-slate-950 border-4 border-white font-black px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-fadeIn text-xs sm:text-sm">
            <span>🏠 Akun Keluarga Aktif:</span>
            <span className="underline">{activeUser.nama} ({activeUser.email})</span>
            <span className="mx-1">•</span>
            <button
              onClick={() => {
                db.logout();
                setActiveUser(null);
              }}
              className="bg-rose-500 text-white px-3 py-1 rounded-xl text-xs hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        )}

        {/* Playful Floating Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-yellow-400 border-4 border-yellow-200 text-slate-950 px-6 py-2.5 rounded-full shadow-[0_6px_0_0_#b45309] font-black text-sm uppercase tracking-wider animate-bounce" style={{ animationDuration: '3s' }}>
          <span>🌟</span>
          <span>DUNIA BELAJAR AJAIB ANAK & KELUARGA</span>
          <span>🌟</span>
        </div>

        {/* Kodi The Bear Speech Bubble */}
        <div className="relative bg-white text-slate-900 px-6 py-4 rounded-3xl border-4 border-yellow-400 shadow-xl max-w-md mb-8 flex items-center gap-4 transform hover:scale-105 transition-transform">
          <div className="text-5xl animate-wiggle">🐻</div>
          <div className="text-left">
            <p className="font-extrabold text-sm md:text-base leading-tight text-indigo-950">
              {activeUser 
                ? `"Halo Keluarga ${activeUser.nama}! Siap bermain kuis atau pantau laporan belajar hari ini?"`
                : `"Selamat datang di LogiKid! Buat Akun Keluarga atau Masuk terlebih dahulu di awal ya!"`}
            </p>
          </div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-b-4 border-r-4 border-yellow-400 rotate-45" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.4)] mb-3">
          Logi<span className="text-yellow-400">Kid</span>
        </h1>
        
        <p className="text-sm md:text-lg text-sky-100 max-w-xl mb-10 font-extrabold leading-relaxed drop-shadow-md">
          Belajar matematika & logika dengan <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-xl font-black shadow-sm">AI Pintar</span>! <br />
          Sistem isolasi role: Fitur anak khusus untuk anak, Laporan & manajemen khusus untuk orang tua.
        </p>

        {/* --- PORTAL BUAT AKUN & LOGIN DI AWAL (GERBANG UTAMA) --- */}
        {!activeUser ? (
          <div className="w-full max-w-3xl bg-black/40 border-4 border-yellow-300 border-b-[8px] rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-8 animate-fadeIn text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-white/20 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                  🚀 Gerbang Awal Keluarga
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Portal Akun Keluarga</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Buat akun atau login di sini agar setiap keluarga terpisah dan dapat mengelola banyak anak.
                </p>
              </div>
              <button
                onClick={handleQuickDemoLogin}
                className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow border-2 border-white cursor-pointer shrink-0"
              >
                ⚡ Masuk Demo Cepat (1 Klik)
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Card 1: BUAT AKUN BARU DI AWAL */}
              <Link
                href="/login?mode=register"
                className="group relative block bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 p-6 rounded-3xl border-4 border-white border-b-[8px] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-slate-950"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2 border-emerald-800 group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white drop-shadow">Buat Akun Baru</h3>
                    <p className="text-xs font-bold text-emerald-950 mt-1">
                      Daftar akun keluarga baru dengan email & password agar data anak aman.
                    </p>
                  </div>
                  <div className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl text-xs shadow mt-2 flex items-center justify-center gap-1">
                    <span>DAFTAR SEKARANG</span> <span>→</span>
                  </div>
                </div>
              </Link>

              {/* Card 2: MASUK AKUN YANG SUDAH ADA */}
              <Link
                href="/login?mode=login"
                className="group relative block bg-gradient-to-t from-purple-700 via-indigo-600 to-violet-500 p-6 rounded-3xl border-4 border-white border-b-[8px] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-white"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2 border-white group-hover:scale-110 transition-transform">
                    🔑
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white drop-shadow">Masuk Akun (Login)</h3>
                    <p className="text-xs font-bold text-violet-100 mt-1">
                      Sudah punya akun? Masuk menggunakan email & password akun Anda.
                    </p>
                  </div>
                  <div className="w-full py-3 bg-white text-purple-950 hover:bg-yellow-300 font-black rounded-2xl text-xs shadow mt-2 flex items-center justify-center gap-1">
                    <span>MASUK AKUN</span> <span>→</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          /* --- JIKA SUDAH LOGIN: LANGSUNG KE GERBANG PILIHAN ROLE --- */
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl px-2 mb-8">
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
                  <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">Role Anak-Anak</h3>
                  <p className="text-xs md:text-sm font-bold text-amber-950 mt-1">
                    Pilih karakter anak untuk bermain kuis, melukis angka kilat, & dapat bintang!
                  </p>
                </div>
                <div className="mt-2 bg-slate-950 text-yellow-300 font-black px-6 py-3 rounded-2xl shadow-md text-sm group-hover:bg-indigo-900 transition-colors flex items-center gap-2">
                  <span>PILIH KARAKTER ANAK</span>
                  <span className="text-lg animate-bounce">🎨</span>
                </div>
              </div>
            </Link>

            {/* Parents Entrance Toy Card */}
            <Link
              href="/pilih-profil"
              className="group relative block rounded-3xl bg-gradient-to-t from-purple-700 via-indigo-600 to-violet-500 p-6 border-4 border-violet-200 border-b-[10px] border-b-purple-950 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-white"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-white/20 border-4 border-violet-300 rounded-3xl flex items-center justify-center text-6xl shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  🦉📊
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">Role Orang Tua</h3>
                  <p className="text-xs md:text-sm font-bold text-violet-100 mt-1">
                    Masuk dengan PIN 1234 untuk memantau laporan & atur kesulitan soal.
                  </p>
                </div>
                <div className="mt-2 bg-white text-purple-950 font-black px-6 py-3 rounded-2xl shadow-md text-sm group-hover:bg-yellow-300 transition-colors flex items-center gap-2">
                  <span>MASUK ROLE ORANG TUA</span>
                  <span className="text-lg animate-bounce">⚙️</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Playful footer decorator */}
        <div className="mt-6 inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 text-xs font-bold text-sky-200">
          <span>⚡ Ditenagai oleh Fast Neural Canvas & Digital Ink</span>
          <span>•</span>
          <span>LogiKid Family Isolation v2.0</span>
        </div>
      </div>
    </main>
  );
}