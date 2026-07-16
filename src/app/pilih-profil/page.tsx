"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db, ChildProfile, Reward, User } from "@/lib/db";

export default function PilihProfil() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [rewardsMap, setRewardsMap] = useState<Record<string, Reward>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Form State untuk tambah anak baru (anak bisa lebih dari 1)
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
    let user = db.getActiveUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUser(user);
    const timer = setTimeout(() => {
      refreshData(user.id);
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshData, router]);

  const handleSelectChild = (childId: string) => {
    db.setActiveChild(childId);
    router.push("/dashboard-anak");
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newName.trim()) return;

    db.addChild(currentUser.id, newName.trim(), newAge, newGrade, newAvatar, newTheme);
    refreshData(currentUser.id);

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
      // Langsung masuk ke laporan / dashboard orang tua jika PIN 1234 benar!
      router.push("/dashboard-ortu");
    } else {
      setPinError("PIN Salah! Khusus Role Orang Tua gunakan PIN: 1234");
    }
  };

  const handleLogout = () => {
    db.logout();
    router.push("/");
  };

  const getCardGradient = (idx: number) => {
    const gradients = [
      "from-sky-400 via-indigo-500 to-purple-600 border-indigo-800",
      "from-amber-400 via-orange-500 to-rose-500 border-orange-800",
      "from-emerald-400 via-teal-500 to-cyan-600 border-teal-800",
      "from-pink-400 via-rose-500 to-purple-600 border-rose-800"
    ];
    return gradients[idx % gradients.length];
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black text-xl animate-bounce">
        Memuat Gerbang Role... 🔑
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-500 via-indigo-900 to-purple-950 flex flex-col items-center justify-start p-6 select-none font-sans overflow-x-hidden">
      {/* Background Decorative Clouds & Stars */}
      <div className="absolute top-10 left-10 text-6xl opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '6s' }}>☁️</div>
      <div className="absolute top-20 right-12 text-7xl opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '8s' }}>⭐️</div>
      <div className="absolute bottom-12 left-16 text-6xl opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '7s' }}>🎈</div>
      <div className="absolute bottom-16 right-16 text-7xl opacity-25 animate-bounce pointer-events-none" style={{ animationDuration: '9s' }}>☁️</div>

      {/* Top action bar: Account Info & Logout */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 z-20 bg-black/40 border-2 border-white/20 p-4 rounded-3xl backdrop-blur-md shadow-xl mb-8 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 border-2 border-white rounded-2xl flex items-center justify-center text-2xl shadow">
            🏠
          </div>
          <div className="text-left">
            <span className="block text-[10px] text-yellow-300 font-black uppercase tracking-wider">Akun Keluarga Aktif</span>
            <span className="text-base sm:text-lg font-black text-white">{currentUser.nama} ({currentUser.email})</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-black bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-2xl border-2 border-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <span>🚪</span> Keluar / Ganti Akun
        </button>
      </div>

      <div className="max-w-5xl w-full text-center relative z-10 my-4 flex-grow flex flex-col justify-center">
        {/* Playful Banner */}
        <div className="inline-flex items-center gap-2 bg-yellow-400 border-4 border-yellow-100 text-slate-950 px-6 py-2 rounded-full shadow-[0_6px_0_0_#b45309] font-black text-sm uppercase tracking-wider mb-6 animate-bounce mx-auto" style={{ animationDuration: '3.5s' }}>
          <span>🎒</span>
          <span>GERBANG PEMILIHAN ROLE KELUARGA</span>
          <span>🎒</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-[0_6px_0_rgba(0,0,0,0.4)]">
          Siapa yang Ingin Masuk Hari Ini?
        </h2>
        <p className="text-xs sm:text-sm font-extrabold text-sky-100 mb-10 drop-shadow-md max-w-2xl mx-auto">
          Pilih portal di bawah ini! Anak dapat memiliki banyak karakter untuk bermain kuis, sedangkan Orang Tua masuk ke ruang khusus laporan dengan PIN 1234.
        </p>

        {/* --- SECTION 1: ROLE ORANG TUA PORTAL --- */}
        <div className="mb-12 w-full max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 border-4 border-yellow-300 border-b-[8px] p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-yellow-400 text-slate-950 rounded-2xl flex items-center justify-center text-5xl border-4 border-white shadow-inner shrink-0">
                🦉
              </div>
              <div>
                <span className="text-[10px] font-black bg-pink-500 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                  🛡️ Khusus Ayah & Bunda
                </span>
                <h3 className="text-2xl font-black text-white mt-1.5 drop-shadow">Role Orang Tua</h3>
                <p className="text-xs font-bold text-sky-200 mt-1">
                  Pantau Laporan Belajar, Atur Tingkat Kesulitan, Validasi Bank Soal AI, & Evaluasi Remedial (Tanpa campur aduk dengan game anak).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPinModal(true)}
              className="w-full sm:w-auto px-6 py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-sm rounded-2xl border-4 border-white border-b-[6px] shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <span>🔒 Masuk Role Orang Tua (PIN: 1234)</span>
            </button>
          </div>
        </div>

        {/* --- SECTION 2: ROLE ANAK-ANAK PORTALS --- */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-white/20">
            <h3 className="text-xl sm:text-2xl font-black text-yellow-300 flex items-center gap-2">
              <span>🌟</span> ROLE ANAK (Pilih Karakter Untuk Bermain Game):
            </h3>
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full text-white">
              {childrenList.length} Karakter Anak
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-center items-stretch px-2">
            {childrenList.map((child, idx) => {
              const reward = rewardsMap[child.id];
              const level = reward ? reward.level : 1;
              const points = reward ? reward.total_poin : 0;
              const themeEmoji = child.theme === 'space' ? '🚀' : child.theme === 'jungle' ? '🌴' : '🌊';
              const themeLabel = child.theme === 'space' ? 'Antariksa' : child.theme === 'jungle' ? 'Hutan Seru' : 'Dunia Laut';

              return (
                <div
                  key={child.id}
                  onClick={() => handleSelectChild(child.id)}
                  className={`group relative cursor-pointer bg-gradient-to-t ${getCardGradient(idx)} p-6 rounded-3xl border-4 border-white border-b-[10px] flex flex-col items-center justify-between gap-4 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl text-white`}
                >
                  {/* Floating Level Badge */}
                  <div className="absolute -top-4 right-4 bg-yellow-400 border-2 border-white text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <span>⭐️</span> LV {level}
                  </div>

                  {/* Big Bouncing Avatar inside White Circle */}
                  <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center text-6xl border-4 border-yellow-300 shadow-inner mt-2 group-hover:scale-110 group-hover:animate-bounce transition-all">
                    {child.avatar}
                  </div>

                  <div className="text-center w-full">
                    <h4 className="text-2xl font-black tracking-tight drop-shadow-sm">{child.nama_anak}</h4>
                    <p className="text-xs font-bold text-white/90 mt-0.5">{child.kelas} • {child.umur} Tahun</p>
                    <p className="text-xs font-black text-yellow-300 mt-1">⭐️ {points} Poin</p>
                    
                    {/* Theme Info Chip */}
                    <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-black bg-black/30 px-3 py-1 rounded-full text-yellow-300 border border-white/20">
                      <span>{themeEmoji}</span>
                      <span>Tema: {themeLabel}</span>
                    </span>
                  </div>

                  {/* Play Button Chip */}
                  <div className="w-full py-3 rounded-2xl bg-white text-slate-950 font-black text-xs text-center shadow group-hover:bg-yellow-300 transition-colors flex items-center justify-center gap-1.5">
                    <span>MAIN ROLE ANAK ▶️</span>
                  </div>
                </div>
              );
            })}

            {/* Add Profile Card - Anak bisa lebih dari 1 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="border-4 border-dashed border-yellow-300 hover:border-white bg-black/30 hover:bg-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-h-[280px]"
            >
              <div className="w-20 h-20 bg-yellow-400 border-4 border-white rounded-full flex items-center justify-center text-4xl text-slate-950 shadow-lg animate-pulse">
                ➕
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-white block">Tambah Karakter Anak</span>
                <span className="text-xs font-bold text-yellow-200 mt-1 block">Anak bisa lebih dari 1! Buat profil baru di sini.</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: TAMBAH PROFIL ANAK BARU --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-indigo-900 to-purple-950 border-4 border-yellow-400 p-6 md:p-8 rounded-3xl shadow-2xl relative text-left">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/15">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>🎒</span> Buat Karakter Anak Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChildSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-yellow-300 uppercase pl-1">Nama Panggilan Anak</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Dodi atau Lani"
                  maxLength={15}
                  className="w-full bg-slate-950 border-2 border-white/20 px-4 py-2.5 rounded-xl text-white text-sm font-bold placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-yellow-300 uppercase pl-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(parseInt(e.target.value) || 7)}
                    className="w-full bg-slate-950 border-2 border-white/20 px-4 py-2.5 rounded-xl text-white text-sm font-bold focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-yellow-300 uppercase pl-1">Kelas</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-white/20 px-3 py-2.5 rounded-xl text-white text-sm font-bold focus:border-yellow-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="TK A/B">TK A/B</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-yellow-300 uppercase pl-1">Pilih Dunia Tema</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['space', 'jungle', 'ocean'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTheme(t)}
                      className={`py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        newTheme === t
                          ? "bg-yellow-400 border-white text-slate-950 scale-105 shadow"
                          : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {t === 'space' ? "🚀 Antariksa" : t === 'jungle' ? "🌴 Hutan" : "🌊 Laut"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-yellow-300 uppercase pl-1">Pilih Hewan/Avatar Favorit</label>
                <div className="flex flex-wrap gap-2 justify-center bg-slate-950/60 p-3 rounded-2xl border-2 border-white/10">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`text-3xl p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer ${
                        newAvatar === av ? "bg-white/20 border-2 border-yellow-400 scale-115 shadow-md" : ""
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg"
                >
                  🎉 Simpan Karakter Anak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PARENT PIN GATE (KHUSUS PIN 1234) --- */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-gradient-to-b from-purple-900 to-indigo-950 border-4 border-yellow-400 p-6 rounded-3xl shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-pink-500/20 text-pink-300 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-pink-400 shadow-inner">
              🔒
            </div>
            <h3 className="text-xl font-black text-white mb-2">Verifikasi Role Orang Tua</h3>
            <p className="text-xs font-bold text-sky-100 mb-6">
              Masukkan PIN Keamanan Orang Tua untuk masuk ke Laporan & Pengaturan AI.
            </p>

            {pinError && (
              <div className="mb-4 text-xs bg-rose-500 text-white border border-white/30 p-2.5 rounded-xl font-black animate-shake">
                {pinError}
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-4">
              <input
                type="password"
                required
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="PIN: 1234"
                className="w-full text-center bg-slate-950 border-2 border-white/30 px-4 py-3 rounded-2xl text-white text-xl font-black tracking-widest focus:border-yellow-400 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError("");
                  }}
                  className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg border-2 border-white"
                >
                  Masuk Laporan →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
