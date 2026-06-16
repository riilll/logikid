"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, ChildProfile, Quiz, QuizAttempt } from "@/lib/db";
import HandwritingCanvas from "@/components/HandwritingCanvas";

interface CustomWindow extends Window {
  clearLogikidCanvas?: () => void;
  predictLogikidCanvas?: () => void;
}

type GameStatus = "playing" | "success" | "retry" | "gameover" | "finished";

export default function QuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Route Params
  const category = searchParams.get("cat") || "penjumlahan";
  const remedialQuestion = searchParams.get("remedial_question");
  const remedialAnswer = searchParams.get("remedial_answer");
  const remedialAttemptId = searchParams.get("attempt_id");

  // Game States
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<number | null>(null);

  // Setup game context
  useEffect(() => {
    const activeChild = db.getActiveChild();
    if (!activeChild) {
      router.push("/pilih-profil");
      return;
    }

    const timer = setTimeout(() => {
      setChild(activeChild);

      // If remedial mode, construct custom single question list
      if (remedialQuestion && remedialAnswer) {
        const remedialQuiz: Quiz = {
          id: "remedial-1",
          pertanyaan: remedialQuestion,
          jawaban: remedialAnswer,
          kategori: "penjumlahan",
          level: "mudah",
          created_at: new Date().toISOString(),
        };
        setQuestions([remedialQuiz]);
      } else {
        // Load standard quizzes for category
        const list = db.getQuizzesByCategory(category);
        // Shuffle question order for fun
        const shuffled = [...list].sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [category, remedialQuestion, remedialAnswer, router]);

  // Speech Synthesizer for Story / Podcast mode
  const speakStory = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 0.8; // slightly slower for kid comprehension
      
      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger audio automatically on Story question change
  useEffect(() => {
    if (questions.length > 0 && category === "soal_cerita" && status === "playing") {
      const q = questions[currentIdx];
      // Slight delay so child interface renders first
      const timer = setTimeout(() => {
        speakStory(q.pertanyaan);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [questions, currentIdx, category, status]);

  const handlePredictAnswer = (predictedDigit: number) => {
    if (questions.length === 0 || !child) return;

    setLastPrediction(predictedDigit);
    const q = questions[currentIdx];
    const isCorrect = predictedDigit.toString() === q.jawaban;

    // Save attempt to simulated PostgreSQL database
    db.addAttempt(child.id, q.pertanyaan, predictedDigit.toString(), q.jawaban, isCorrect);

    if (isCorrect) {
      setPointsEarned((prev) => prev + 10);
      setStatus("success");
      
      // If remedial mode, delete the old wrong attempt since child successfully corrected it!
      if (remedialAttemptId) {
        const rawAttempts = localStorage.getItem("logikid_attempts");
        if (rawAttempts) {
          const list = JSON.parse(rawAttempts);
          const filtered = list.filter((item: QuizAttempt) => item.id !== remedialAttemptId);
          localStorage.setItem("logikid_attempts", JSON.stringify(filtered));
        }
      }
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setStatus("gameover");
      } else {
        setStatus("retry");
      }
    }
  };

  const handleNextQuestion = () => {
    setLastPrediction(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setStatus("playing");
    } else {
      setStatus("finished");
    }
  };

  const handleRetryQuestion = () => {
    setLastPrediction(null);
    setStatus("playing");
    // Clear canvas trigger via global event
    const win = window as unknown as CustomWindow;
    if (typeof window !== "undefined" && win.clearLogikidCanvas) {
      win.clearLogikidCanvas();
    }
  };

  const handleQuit = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // If it was remedial, go back to Parent Dashboard, else back to Kid Dashboard
    if (remedialQuestion) {
      router.push("/dashboard-ortu");
    } else {
      router.push("/dashboard-anak");
    }
  };

  if (!child || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">
        Mempersiapkan petualangan kuis... 🚀
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  // Theme styling overrides
  const getThemeBg = () => {
    switch (child.theme) {
      case "jungle":
        return "from-emerald-950 via-teal-900 to-green-950";
      case "ocean":
        return "from-cyan-950 via-blue-900 to-slate-950";
      case "space":
      default:
        return "from-indigo-950 via-slate-900 to-violet-950";
    }
  };

  const getThemeCard = () => {
    switch (child.theme) {
      case "jungle":
        return "border-emerald-500/20 bg-emerald-900/10";
      case "ocean":
        return "border-cyan-500/20 bg-cyan-900/10";
      case "space":
      default:
        return "border-pink-500/20 bg-pink-900/10";
    }
  };

  return (
    <main className={`relative min-h-screen bg-gradient-to-br ${getThemeBg()} flex flex-col p-6 overflow-hidden select-none`}>
      {/* HUD HEADER BAR */}
      <header className="z-10 w-full max-w-5xl mx-auto flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-xl mb-6">
        <button
          onClick={handleQuit}
          className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 bg-black/20 hover:bg-black/30 border border-white/5 rounded-xl transition-all cursor-pointer"
        >
          🚪 {remedialQuestion ? "Kembali Analisis" : "Keluar Game"}
        </button>

        {/* Lives Counter (Hearts) */}
        <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider pr-1">Nyawa:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-lg transition-transform duration-300 ${
                i < lives ? "scale-100 opacity-100 text-rose-500" : "scale-75 opacity-30 text-slate-500"
              }`}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Level & Points HUD */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Skor Kuis:</span>
          <span className="text-sm font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
            ⭐ {pointsEarned} Poin
          </span>
        </div>
      </header>

      {/* CORE GAMEPLAY INTERFACE */}
      <div className="z-10 w-full max-w-5xl mx-auto flex-grow flex flex-col items-center justify-center">
        {status === "playing" && (
          <div className="w-full grid md:grid-cols-2 gap-6 items-stretch">
            {/* LEFT COLUMN: QUESTION PANEL */}
            <div className={`flex flex-col justify-between p-6 md:p-8 rounded-3xl border backdrop-blur-md shadow-2xl ${getThemeCard()}`}>
              <div>
                {/* Progress Indicators */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-6">
                  <span className="bg-white/5 px-2.5 py-1 rounded-lg">
                    {remedialQuestion ? "Mode Remedial ⚙️" : `Kategori: ${category.toUpperCase()}`}
                  </span>
                  <span>
                    Soal {currentIdx + 1} dari {questions.length}
                  </span>
                </div>

                {/* VISUAL COMPONENT: SOAL INTERAKTIF (Apple, Stars...) */}
                {category === "visual" && activeQuestion.visual_helper && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6 bg-black/30 p-5 rounded-2xl border border-white/5 animate-pulse">
                    {Array.from(activeQuestion.visual_helper).map((emoji, index) => (
                      <span key={index} className="text-4xl hover:scale-125 transition-transform duration-200 cursor-pointer">
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* AUDIO COMPONENT: SOAL CERITA / PODCAST */}
                {category === "soal_cerita" && (
                  <div className="flex flex-col items-center gap-3 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 w-full justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isAudioPlaying ? "bg-rose-500 animate-ping text-white" : "bg-rose-500/20 text-rose-300"
                      }`}>
                        🎙️
                      </div>
                      <button
                        onClick={() => speakStory(activeQuestion.pertanyaan)}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md shadow-rose-500/10"
                      >
                        {isAudioPlaying ? "🔊 Sedang Membaca..." : "▶️ Putar Suara Soal"}
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Metode Podcast Narator AI</span>
                  </div>
                )}

                {/* Question Text */}
                <h2 className="text-2xl md:text-3xl font-black text-white leading-relaxed tracking-wide text-left mb-6">
                  {activeQuestion.pertanyaan}
                </h2>
              </div>

              {/* Tips for kids */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left text-xs text-slate-300 leading-relaxed font-semibold">
                💡 <span className="text-amber-300 font-black">Petunjuk:</span> Coret jawabanmu di kotak hitam sebelah kanan dengan ukuran yang cukup besar, lalu tekan tombol hijau <strong className="text-emerald-300">Kirim Jawaban</strong>.
              </div>
            </div>

            {/* RIGHT COLUMN: AI CANVAS INPUT */}
            <div className="flex justify-center items-center">
              <HandwritingCanvas onPredict={handlePredictAnswer} showButtons={true} />
            </div>
          </div>
        )}

        {/* STATUS SCREEN: SUCCESS OVERLAY */}
        {status === "success" && (
          <div className="w-full max-w-lg bg-emerald-950/80 border-2 border-emerald-400/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce">
              🌟
            </div>
            <h2 className="text-3xl font-black text-emerald-300 mb-2">Luar Biasa! Benar!</h2>
            <p className="text-slate-200 text-sm font-semibold mb-6">
              AI membaca jawabanmu dengan tepat. Kamu mendapatkan +10 bintang!
            </p>

            {lastPrediction !== null && (
              <div className="bg-black/30 py-3 px-5 rounded-2xl inline-flex items-center gap-3 border border-white/5 mb-8">
                <span className="text-xs text-slate-400">Jawaban AI:</span>
                <span className="text-2xl font-black text-amber-400">{lastPrediction}</span>
                <span className="text-xs text-slate-400">• Kunci: {activeQuestion.jawaban}</span>
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-emerald-400 hover:bg-emerald-500 active:scale-98 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-400/20 text-sm transition-all cursor-pointer"
            >
              {currentIdx + 1 < questions.length ? "Lanjut Soal Berikutnya →" : "Selesaikan Kuis 🏁"}
            </button>
          </div>
        )}

        {/* STATUS SCREEN: RETRY OVERLAY (WRONG PREDICTION) */}
        {status === "retry" && (
          <div className="w-full max-w-lg bg-rose-950/80 border-2 border-rose-400/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn">
            <div className="w-20 h-20 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              💪
            </div>
            <h2 className="text-2xl font-black text-rose-300 mb-2">Kurang Tepat, Coba Lagi!</h2>
            <p className="text-slate-200 text-sm font-semibold mb-6">
              Jangan menyerah! Hapus coretan lamamu dan lukis kembali angka jawabanmu dengan tebal dan rapi di tengah kanvas.
            </p>

            {lastPrediction !== null && (
              <div className="bg-black/30 py-3 px-5 rounded-2xl inline-flex items-center gap-2 border border-white/5 mb-8 text-xs text-slate-400">
                <span>AI Membaca coretanmu sebagai angka: </span>
                <strong className="text-rose-400 font-bold text-sm">{lastPrediction}</strong>
              </div>
            )}

            <button
              onClick={handleRetryQuestion}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 text-sm transition-all cursor-pointer"
            >
              🧹 Hapus Coretan & Gambar Ulang
            </button>
          </div>
        )}

        {/* STATUS SCREEN: GAMEOVER */}
        {status === "gameover" && (
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn">
            <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              💔
            </div>
            <h2 className="text-3xl font-black text-red-400 mb-2">Nyawa Habis!</h2>
            <p className="text-slate-300 text-sm font-medium mb-8 leading-relaxed">
              Kamu telah mencoba dengan baik! Ayo istirahat sejenak, lalu mulai lagi kuis baru untuk memecahkan rekor lamamu!
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleQuit}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
              <button
                onClick={() => {
                  setLives(3);
                  setCurrentIdx(0);
                  setStatus("playing");
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Ulangi Kuis 🔄
              </button>
            </div>
          </div>
        )}

        {/* STATUS SCREEN: FINISHED CARD */}
        {status === "finished" && (
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn">
            <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-pink-500 rounded-3xl flex items-center justify-center text-6xl shadow-xl shadow-pink-500/25 mx-auto mb-6 animate-pulse">
              🏆
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Petualangan Selesai!</h2>
            <p className="text-slate-300 text-sm font-medium mb-6">
              Selamat! Kamu menyelesaikan semua tantangan kuis dengan luar biasa!
            </p>

            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 mb-8 flex flex-col gap-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Bintang Didapat:</span>
                <span className="font-extrabold text-amber-300">⭐ +{pointsEarned} Poin</span>
              </div>
              <div className="h-[1px] bg-white/5 my-1" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Kesehatan Nyawa Tersisa:</span>
                <span className="font-extrabold text-rose-400">{lives} / 3 Nyawa</span>
              </div>
            </div>

            <button
              onClick={handleQuit}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-98 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 text-sm transition-all cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
