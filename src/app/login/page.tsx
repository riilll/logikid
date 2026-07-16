"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check query mode and if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("mode");
      if (m === "register") setMode("register");
      else if (m === "login") setMode("login");
    }
    const activeUser = db.getActiveUser();
    if (activeUser) {
      router.push("/pilih-profil");
    }
  }, [router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    setTimeout(() => {
      const res = db.loginUser(email, password);
      if (res.user) {
        db.setActiveUser(res.user);
        router.push("/pilih-profil");
      } else {
        setError(res.error || "Gagal masuk. Periksa kembali email & password Anda.");
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 4) {
      setError("Password minimal 4 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = db.registerUser(nama, email, password);
      if (res.user) {
        db.setActiveUser(res.user);
        setSuccess("🎉 Akun berhasil dibuat! Mengalihkan ke Gerbang Pilihan Role...");
        setTimeout(() => {
          router.push("/pilih-profil");
        }, 1000);
      } else {
        setError(res.error || "Gagal membuat akun.");
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleQuickDemo = () => {
    setEmail("fahril@email.com");
    setPassword("password123");
    setError("");
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-4 select-none font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border-2 border-white/20 p-8 rounded-3xl shadow-2xl relative z-10 text-center">
        {/* Playful Key / Lock Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 mx-auto mb-5 border-2 border-white">
          🔐
        </div>

        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">
          {mode === "login" ? "Masuk Akun Keluarga" : "Daftar Akun Baru"}
        </h2>
        <p className="text-xs text-slate-300 mb-6 font-medium">
          {mode === "login"
            ? "1 Akun dapat mengelola banyak profil Anak & Ruang Orang Tua."
            : "Buat akun dengan password agar setiap keluarga bisa dibedakan dan aman."}
        </p>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === "login"
                ? "bg-yellow-400 text-slate-950 shadow-md scale-102"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔑 Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === "register"
                ? "bg-yellow-400 text-slate-950 shadow-md scale-102"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✨ Daftar Akun
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs font-extrabold bg-rose-500/20 text-rose-300 p-3 rounded-2xl border border-rose-500/30 text-left animate-shake">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-xs font-extrabold bg-emerald-500/20 text-emerald-300 p-3 rounded-2xl border border-emerald-500/30 text-left animate-bounce">
            {success}
          </div>
        )}

        {mode === "login" ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                Alamat Email Akun
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: fahril@email.com"
                required
                className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-4 py-3 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pass" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                Password / Kata Sandi
              </label>
              <input
                type="password"
                id="pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password akun Anda"
                required
                className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-4 py-3 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 active:scale-95 text-slate-950 font-black rounded-2xl shadow-xl transition-all cursor-pointer text-sm border-2 border-white"
            >
              {isSubmitting ? "⏳ Memverifikasi..." : "🚀 Masuk & Pilih Role →"}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5 text-left">
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-nama" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                Nama Orang Tua / Keluarga
              </label>
              <input
                type="text"
                id="reg-nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Ayah Fahril / Bunda Siti"
                required
                className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-4 py-2.5 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="reg-email" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                Alamat Email
              </label>
              <input
                type="email"
                id="reg-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: keluarga@email.com"
                required
                className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-4 py-2.5 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-pass" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                  Password
                </label>
                <input
                  type="password"
                  id="reg-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat sandi"
                  required
                  className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-3.5 py-2.5 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-confirm" className="text-xs font-black text-yellow-300 uppercase tracking-wider pl-1">
                  Ulangi Password
                </label>
                <input
                  type="password"
                  id="reg-confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Sandi sama"
                  required
                  className="w-full bg-slate-950 border-2 border-white/20 focus:border-yellow-400 focus:outline-none px-3.5 py-2.5 rounded-2xl text-white text-sm placeholder-slate-500 transition-all font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 active:scale-95 text-slate-950 font-black rounded-2xl shadow-xl transition-all cursor-pointer text-sm border-2 border-white"
            >
              {isSubmitting ? "⏳ Membuat Akun..." : "🎉 Buat Akun & Mulai!"}
            </button>
          </form>
        )}

        {/* Demo Helper Box */}
        {mode === "login" && (
          <div className="mt-6 p-4 bg-slate-950/80 border-2 border-white/10 rounded-2xl text-left">
            <p className="text-xs text-yellow-300 font-black mb-1.5 flex items-center gap-1.5">
              <span>💡</span> <span>Belum punya akun? Gunakan Akun Demo:</span>
            </p>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-300">
              <div>
                <p>Email: <code className="text-white">fahril@email.com</code></p>
                <p>Pass: <code className="text-white">password123</code></p>
              </div>
              <button
                onClick={handleQuickDemo}
                type="button"
                className="text-xs bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-2 px-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow"
              >
                Isi Otomatis
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <Link href="/" className="text-xs font-black text-slate-400 hover:text-white transition-colors">
            ← Kembali ke Beranda Utama
          </Link>
        </div>
      </div>
    </main>
  );
}
