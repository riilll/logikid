"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already logged in, redirect to profile selector
  useEffect(() => {
    const activeUser = db.getActiveUser();
    if (activeUser) {
      router.push("/pilih-profil");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      const user = db.getUserByEmail(email);
      if (user) {
        db.setActiveUser(user);
        router.push("/pilih-profil");
      } else {
        setError("Email tidak terdaftar! Gunakan email demo: fahril@email.com");
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleQuickLogin = () => {
    setEmail("fahril@email.com");
    setError("");
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
        {/* Playful Key Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20 mx-auto mb-6 animate-pulse">
          🔑
        </div>

        <h2 className="text-3xl font-black text-white mb-2">Portal Orang Tua</h2>
        <p className="text-sm text-slate-300 mb-6 font-medium">
          Masuk ke akun Orang Tua untuk memantau performa anak dan mengelola profil.
        </p>

        {error && (
          <div className="mb-4 text-xs font-semibold bg-rose-500/20 text-rose-300 p-3 rounded-xl border border-rose-500/30 text-left">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider pl-1">
              Alamat Email Orang Tua
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh: orangtua@email.com"
              required
              className="w-full bg-slate-900/50 border border-white/15 focus:border-indigo-400 focus:outline-none px-4 py-3 rounded-xl text-white text-sm placeholder-slate-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer text-sm"
          >
            {isSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {/* Demo Helper Tooltip */}
        <div className="mt-6 p-4 bg-slate-900/60 border border-white/5 rounded-2xl text-left">
          <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1">
            💡 <span>Gunakan data demo untuk mencoba:</span>
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-amber-400 font-mono">fahril@email.com</code>
            <button
              onClick={handleQuickLogin}
              className="text-[10px] bg-white/10 hover:bg-white/15 text-white font-bold py-1 px-2.5 rounded-lg border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              Gunakan Email Ini
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
