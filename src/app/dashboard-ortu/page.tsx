"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { db, ChildProfile, QuizAttempt } from "@/lib/db";

export default function DashboardOrtu() {
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

  const loadAnalytics = useCallback((childId: string) => {
    const list = db.getAttempts(childId);
    // Sort attempts by date descending
    const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAttempts(sorted);

    // Calculate overall stats
    const total = sorted.length;
    const correct = sorted.filter((a) => a.is_correct).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    setStats({ total, correct, wrong, accuracy });

    // Group attempts by date for the past 7 days
    const days: Record<string, { correct: number; wrong: number }> = {};
    
    // Initialize past 5 days
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      days[dateStr] = { correct: 0, wrong: 0 };
    }

    list.forEach((att) => {
      const dateStr = new Date(att.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      // Only record if it matches our window
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

  useEffect(() => {
    const user = db.getActiveUser();
    if (!user) {
      // Direct back to login if no active user session
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
    }, 0);
    
    return () => clearTimeout(timer);
  }, [loadAnalytics]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    loadAnalytics(childId);
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const wrongAttempts = attempts.filter((a) => !a.is_correct);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl font-black tracking-tight text-white">Dashboard Analisis Orang Tua</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Pantau performa, grafik belajar, dan bantu anak mengevaluasi soal salah.</p>
          </div>
          
          <Link
            href="/pilih-profil"
            className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 border border-white/10 rounded-xl transition-all cursor-pointer"
          >
            ← Kembali Pilih Profil
          </Link>
        </header>

        {/* CHILD FILTER TABS */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-2xl border border-white/5 w-fit">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedChildId === child.id
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-base">{child.avatar}</span>
              <span>{child.nama_anak}</span>
            </button>
          ))}
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akurasi Jawaban</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{stats.accuracy}%</p>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Rata-rata benar</span>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Soal Dikerjakan</p>
            <p className="text-3xl font-black text-indigo-400 mt-1">{stats.total}</p>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Soal matematika & logika</span>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jawaban Benar</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{stats.correct}</p>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Poin berhasil dikumpulkan</span>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jawaban Salah</p>
            <p className="text-3xl font-black text-rose-400 mt-1">{stats.wrong}</p>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Butuh evaluasi remedial</span>
          </div>
        </div>

        {/* CHARTS CONTAINER */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Circular Chart: Total Benar vs Salah */}
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex flex-col justify-between items-center text-center">
            <div className="w-full text-left">
              <h3 className="text-sm font-black text-white">Total Benar & Salah</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Persentase keberhasilan pengerjaan</p>
            </div>

            {/* Circular Gauge Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center my-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#ef4444" // Wrong color path (Red)
                  strokeWidth="12"
                  className="opacity-20"
                />
                {/* Colored Accuracy Path (Green) */}
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

            {/* Legend indicators */}
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
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Soal Salah & Benar per Tanggal</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Grafik progres harian dalam 5 hari terakhir</p>
            </div>

            {/* Custom SVG/CSS Bar Chart */}
            <div className="flex items-end justify-between gap-4 h-44 border-b border-white/10 pb-2 mt-6 relative z-10">
              {dailyData.map((data, idx) => {
                const maxVal = Math.max(...dailyData.map((d) => d.correct + d.wrong), 4);
                const correctHeight = `${(data.correct / maxVal) * 100}%`;
                const wrongHeight = `${(data.wrong / maxVal) * 100}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Columns Stack */}
                    <div className="w-full max-w-[28px] flex flex-col justify-end gap-1 h-full relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 text-[9px] font-bold whitespace-nowrap">
                        🟢 {data.correct} Benar • 🔴 {data.wrong} Salah
                      </div>

                      {/* Correct bar (Green) */}
                      {data.correct > 0 && (
                        <div
                          style={{ height: correctHeight }}
                          className="bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md w-full shadow-inner"
                        />
                      )}

                      {/* Wrong bar (Red) */}
                      {data.wrong > 0 && (
                        <div
                          style={{ height: wrongHeight }}
                          className="bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md w-full shadow-inner"
                        />
                      )}

                      {/* Empty state filler if 0 */}
                      {data.correct === 0 && data.wrong === 0 && (
                        <div className="h-1 bg-white/5 w-full rounded" />
                      )}
                    </div>

                    {/* Date label */}
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{data.date}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Guide Info */}
            <div className="text-[9px] text-slate-500 mt-2 text-right">
              *Arahkan kursor ke grafik kolom untuk melihat jumlah detail pengerjaan.
            </div>
          </div>
        </div>

        {/* EVALUASI SOAL SALAH SECTION */}
        <section className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-left">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                <span>🛡️</span> Evaluasi Soal Salah
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar soal yang salah dijawab. Ajak anak mencoba ulang (remedial) untuk memperbaiki skor!</p>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-black">
              {wrongAttempts.length} Soal Perlu Perbaikan
            </span>
          </div>

          {wrongAttempts.length === 0 ? (
            <div className="py-8 text-center bg-black/20 rounded-2xl border border-white/5">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-bold text-slate-300 mt-2">Hebat! Belum ada soal yang salah dijawab oleh {selectedChild?.nama_anak || "anak"}.</p>
              <p className="text-xs text-slate-500 mt-1">Pertahankan terus prestasi belajarnya!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2">
              {wrongAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Kategori: Matematika / Logika</span>
                    <p className="text-base font-black text-white">{attempt.soal}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span>Coretan Anak: <strong className="text-rose-400 font-bold">{attempt.jawaban_anak}</strong></span>
                      <span>•</span>
                      <span>Kunci Jawaban: <strong className="text-emerald-400 font-bold">{attempt.jawaban_benar}</strong></span>
                      <span>•</span>
                      <span>Tanggal: {new Date(attempt.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Remedial Quick Redirect Button */}
                  <button
                    onClick={() => {
                      // Set active child so the context loads correctly
                      db.setActiveChild(selectedChildId);
                      // Redirect to quiz in remedial mode with direct question params!
                      window.location.href = `/quiz?remedial_question=${encodeURIComponent(attempt.soal)}&remedial_answer=${attempt.jawaban_benar}&attempt_id=${attempt.id}`;
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow shadow-amber-500/20 whitespace-nowrap"
                  >
                    ✏️ Coba Lagi! (Remedial)
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
