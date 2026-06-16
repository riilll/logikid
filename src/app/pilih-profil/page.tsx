"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db, ChildProfile, Reward } from "@/lib/db";

export default function PilihProfil() {
  const router = useRouter();
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [rewardsMap, setRewardsMap] = useState<Record<string, Reward>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState(7);
  const [newGrade, setNewGrade] = useState("Kelas 1");
  const [newAvatar, setNewAvatar] = useState("🐻");
  const [newTheme, setNewTheme] = useState<'space' | 'jungle' | 'ocean'>("space");

  // Parent PIN state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const avatars = ["🐻", "🦊", "🐼", "🦁", "🐱", "🐶", "🐰", "🤖", "🦄", "🦖"];

  const refreshData = useCallback((userId: string) => {
    const kids = db.getChildren(userId);
    setChildrenList(kids);

    // Fetch rewards
    const map: Record<string, Reward> = {};
    kids.forEach((k) => {
      const r = db.getRewardByChildId(k.id);
      if (r) {
        map[k.id] = r;
      }
    });
    setRewardsMap(map);
  }, []);

  useEffect(() => {
    // Auto login demo user if none active for testing convenience
    let user = db.getActiveUser();
    if (!user) {
      const demoUser = db.getUserByEmail("fahril@email.com");
      if (demoUser) {
        db.setActiveUser(demoUser);
        user = demoUser;
      }
    }

    if (user) {
      const timer = setTimeout(() => {
        refreshData(user.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [refreshData]);

  const handleSelectProfile = (childId: string) => {
    db.setActiveChild(childId);
    router.push("/dashboard-anak");
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.getActiveUser();
    if (!user) return;

    if (!newName.trim()) return;

    db.addChild(user.id, newName.trim(), newAge, newGrade, newAvatar, newTheme);
    refreshData(user.id);
    
    // Reset form
    setNewName("");
    setNewAge(7);
    setNewGrade("Kelas 1");
    setNewAvatar("🐻");
    setNewTheme("space");
    setShowAddModal(false);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setPinInput("");
      setPinError("");
      setShowPinModal(false);
      router.push("/dashboard-ortu");
    } else {
      setPinError("PIN salah! (Gunakan PIN demo: 1234)");
    }
  };

  const handleLogout = () => {
    db.logout();
    router.push("/");
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex flex-col items-center justify-center p-6">
      {/* Background blobs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
        >
          🚪 Keluar Akun
        </button>

        <button
          onClick={() => setShowPinModal(true)}
          className="text-xs font-bold text-violet-300 hover:text-white px-3 py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-lg hover:bg-violet-500/35 transition-all cursor-pointer flex items-center gap-1.5"
        >
          🛡️ Portal Orang Tua (PIN)
        </button>
      </div>

      <div className="max-w-4xl w-full text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Siapa yang mau belajar hari ini?</h2>
        <p className="text-sm text-slate-300 mb-12">Pilih profilmu dan mari kita mulai kuis matematika yang seru!</p>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center items-stretch max-w-3xl mx-auto">
          {childrenList.map((child) => {
            const reward = rewardsMap[child.id];
            const level = reward ? reward.level : 1;
            const points = reward ? reward.total_poin : 0;
            const themeLabel = child.theme === 'space' ? '🚀 Space' : child.theme === 'jungle' ? '🌴 Jungle' : '🌊 Ocean';

            return (
              <div
                key={child.id}
                onClick={() => handleSelectProfile(child.id)}
                className="group relative cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 rounded-3xl flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl"
              >
                {/* Floating Level Badge */}
                <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                  LV {level}
                </span>

                {/* Animated Bouncing Avatar */}
                <div className="w-20 h-20 bg-slate-900/60 rounded-2xl flex items-center justify-center text-5xl border border-white/5 group-hover:scale-110 group-hover:animate-bounce transition-all">
                  {child.avatar}
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-white tracking-wide">{child.nama_anak}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{child.kelas} • {child.umur} Tahun</p>
                  
                  {/* Theme Info */}
                  <span className="inline-block mt-2 text-[10px] font-semibold bg-white/5 px-2 py-0.5 rounded text-indigo-300">
                    Tema: {themeLabel}
                  </span>
                </div>

                {/* Score Summary */}
                <div className="mt-2 w-full border-t border-white/5 pt-3 flex items-center justify-center gap-1.5">
                  <span className="text-xs">⭐</span>
                  <span className="text-xs font-bold text-amber-300">{points} Poin</span>
                </div>
              </div>
            );
          })}

          {/* Add Profile Card */}
          <button
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed border-white/10 hover:border-indigo-400/50 bg-transparent hover:bg-white/5 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer min-h-[220px]"
          >
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl text-slate-400 hover:text-white">
              ➕
            </div>
            <span className="text-sm font-bold text-slate-300 hover:text-indigo-300 transition-colors">Tambah Anak</span>
          </button>
        </div>
      </div>

      {/* --- MODAL 1: TAMBAH PROFIL ANAK --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 p-6 rounded-3xl shadow-2xl relative animate-scaleIn">
            <h3 className="text-xl font-black text-white mb-4">Tambah Profil Baru</h3>

            <form onSubmit={handleAddChildSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-300 uppercase pl-1">Nama Anak</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama panggilan anak"
                  maxLength={15}
                  className="w-full bg-slate-800 border border-white/10 px-4 py-2.5 rounded-xl text-white text-sm placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Age & Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 uppercase pl-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(parseInt(e.target.value) || 7)}
                    className="w-full bg-slate-800 border border-white/10 px-4 py-2.5 rounded-xl text-white text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 uppercase pl-1">Kelas</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 px-3 py-2.5 rounded-xl text-white text-sm focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="TK A/B">TK A/B</option>
                  </select>
                </div>
              </div>

              {/* Theme Preference */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-300 uppercase pl-1">Pilihan Tema Game</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['space', 'jungle', 'ocean'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTheme(t)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newTheme === t
                          ? "bg-indigo-500 border-indigo-400 text-white"
                          : "bg-slate-800 border-white/5 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      {t === 'space' ? "🚀 Antariksa" : t === 'jungle' ? "🌴 Hutan" : "🌊 Laut"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-300 uppercase pl-1">Pilih Avatar Karakter</label>
                <div className="flex flex-wrap gap-2 justify-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`text-2xl p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer ${
                        newAvatar === av ? "bg-white/20 border border-indigo-400 scale-110" : ""
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PARENT VERIFICATION (PIN GATE) --- */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/15 p-6 rounded-3xl shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-violet-500/20 text-violet-300 rounded-full flex items-center justify-center text-xl mx-auto mb-4 border border-violet-500/30">
              🔒
            </div>
            <h3 className="text-lg font-black text-white mb-2">Keamanan Orang Tua</h3>
            <p className="text-xs text-slate-300 mb-4">Masukkan PIN Orang Tua untuk memantau analisis progres belajar anak.</p>

            {pinError && (
              <div className="mb-3 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 p-2 rounded-lg font-semibold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-3">
              <input
                type="password"
                required
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN 4 Digit (Demo: 1234)"
                className="w-full text-center bg-slate-800 border border-white/10 px-4 py-3 rounded-xl text-white text-lg font-black tracking-widest focus:border-violet-400 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError("");
                  }}
                  className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 bg-violet-500 hover:bg-violet-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Verifikasi PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
