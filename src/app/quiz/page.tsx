"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, ChildProfile, Quiz } from "@/lib/db";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import { generateRandomQuizAI } from "@/services/quiz";

interface CustomWindow extends Window {
  clearLogikidCanvas?: () => void;
  predictLogikidCanvas?: () => void;
}

type GameStatus = "playing" | "success" | "retry" | "gameover" | "finished" | "empty_bank";

function QuizContent() {
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadQuestionsForChild = useCallback((activeChild: ChildProfile) => {
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
      setStatus("playing");
    } else {
      const list = db.getQuizzesByChildFilter(category, activeChild.id);
      if (list.length === 0) {
        setQuestions([]);
        setStatus("empty_bank");
      } else {
        const shuffled = [...list].sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
        setStatus("playing");
      }
    }
  }, [category, remedialQuestion, remedialAnswer]);

  // Setup game context
  useEffect(() => {
    const activeChild = db.getActiveChild();
    if (!activeChild) {
      router.push("/pilih-profil");
      return;
    }

    const timer = setTimeout(() => {
      setChild(activeChild);
      loadQuestionsForChild(activeChild);
    }, 0);

    return () => clearTimeout(timer);
  }, [loadQuestionsForChild, router]);

  // Speech Synthesizer for Story / Podcast mode (Suara Narrator Bahasa Indonesia)
  const speakStory = useCallback((text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Cari dan pilih suara narrator khusus Bahasa Indonesia agar intonasi jelas dan tidak berlogat Inggris
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("id-id") ||
          v.lang.toLowerCase().includes("in-id") ||
          v.lang.toLowerCase() === "id" ||
          v.name.toLowerCase().includes("indonesia") ||
          v.name.toLowerCase().includes("gadis") ||
          v.name.toLowerCase().includes("ardian") ||
          v.name.toLowerCase().includes("damayanti")
      );

      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
        utterance.lang = indonesianVoice.lang;
      } else {
        utterance.lang = "id-ID";
      }

      utterance.rate = 0.85; // Intonasi jelas dan mudah dipahami anak
      
      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Pastikan daftar suara TTS dimuat di Chrome/Edge/Android
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (questions.length > 0 && category === "soal_cerita" && status === "playing") {
      const q = questions[currentIdx];
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

    db.addAttempt(child.id, q.pertanyaan, predictedDigit.toString(), q.jawaban, isCorrect);

    if (isCorrect) {
      setPointsEarned((prev) => prev + 10);
      setStatus("success");
      
      if (remedialAttemptId) {
        db.deleteAttempt(remedialAttemptId);
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
    const win = window as unknown as CustomWindow;
    if (typeof window !== "undefined" && win.clearLogikidCanvas) {
      win.clearLogikidCanvas();
    }
  };

  const handleQuit = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (remedialQuestion) {
      router.push("/dashboard-ortu");
    } else {
      router.push("/dashboard-anak");
    }
  };

  const handleGenerateOnEmpty = async () => {
    if (!child) return;
    setIsGeneratingAI(true);
    try {
      const targetLevel = (child.preferred_level && child.preferred_level !== "semua")
        ? child.preferred_level
        : "mudah";
        
      await generateRandomQuizAI({
        category: category as any,
        level: targetLevel as any,
        count: 5,
        autoApprove: true,
      });
      loadQuestionsForChild(child);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat soal AI otomatis.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!child) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black text-xl animate-bounce">
        Membuka Papan Permainan... 🚀
      </div>
    );
  }

  const getThemeBg = () => {
    switch (child.theme) {
      case "jungle":
        return "from-emerald-900 via-teal-900 to-green-950";
      case "ocean":
        return "from-sky-700 via-blue-900 to-indigo-950";
      case "space":
      default:
        return "from-indigo-900 via-purple-900 to-slate-950";
    }
  };

  const activeQuestion = questions[currentIdx];

  return (
    <main className={`relative min-h-screen bg-gradient-to-b ${getThemeBg()} flex flex-col p-4 sm:p-6 overflow-hidden select-none font-sans`}>
      {/* KHAN ACADEMY KIDS STYLE HUD HEADER */}
      <header className="z-10 w-full max-w-5xl mx-auto flex items-center justify-between gap-4 bg-white/10 border-4 border-white/20 rounded-3xl px-5 py-3.5 backdrop-blur-md shadow-2xl mb-6">
        <button
          onClick={handleQuit}
          className="text-xs sm:text-sm font-black bg-slate-950 hover:bg-slate-900 text-yellow-300 px-4 py-2 rounded-2xl border-2 border-yellow-400/60 hover:border-yellow-400 transition-all cursor-pointer flex items-center gap-1.5 shadow"
        >
          <span>🚪</span> {remedialQuestion ? "Kembali" : "Keluar Game"}
        </button>

        {/* Lives Counter (Animated Hearts inside Pill) */}
        <div className="flex items-center gap-1.5 bg-black/50 px-4 py-2 rounded-2xl border-2 border-white/20 shadow-inner">
          <span className="text-[10px] sm:text-xs font-black text-yellow-300 uppercase tracking-wider pr-1">Nyawa:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-xl transition-all duration-300 ${
                i < lives ? "scale-110 opacity-100 text-rose-500 animate-bounce" : "scale-75 opacity-30 text-slate-500"
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Level & Points Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex text-[11px] sm:text-xs font-black uppercase px-2.5 sm:px-3 py-1 rounded-xl bg-indigo-950/90 text-yellow-300 border-2 border-yellow-400 shadow-sm">
            Level: {(activeQuestion?.level || child.preferred_level || "mudah").toUpperCase()}
          </span>
          <span className="text-xs sm:text-base font-black text-slate-950 bg-yellow-400 border-2 border-white px-3 sm:px-4 py-1.5 rounded-2xl shadow-md flex items-center gap-1 animate-pulse">
            <span>⭐️</span>
            <span>{pointsEarned} Poin</span>
          </span>
        </div>
      </header>

      {/* CORE GAMEPLAY AREA */}
      <div className="z-10 w-full max-w-5xl mx-auto flex-grow flex flex-col items-center justify-center">
        
        {/* EMPTY BANK STATE */}
        {status === "empty_bank" && (
          <div className="w-full max-w-lg bg-gradient-to-t from-purple-900 to-indigo-900 border-4 border-yellow-400 border-b-[10px] p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn">
            <div className="w-24 h-24 bg-yellow-400 border-4 border-white text-slate-950 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce">
              📭
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Belum Ada Soal Aktif!</h2>
            <p className="text-yellow-100 text-xs sm:text-sm font-bold mb-8 leading-relaxed">
              Saat ini belum ada soal di kategori <strong className="text-yellow-300">{category.replace("_", " ").toUpperCase()}</strong> untuk tingkat kesulitan <strong className="text-white">{(child.preferred_level || "mudah").toUpperCase()}</strong> yang diatur Orang Tua.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleQuit}
                className="flex-1 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl text-xs active:scale-95 transition-all cursor-pointer border-2 border-white/20"
              >
                ← Pilih Kategori Lain
              </button>
              
              <button
                onClick={handleGenerateOnEmpty}
                disabled={isGeneratingAI}
                className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg border-2 border-white flex items-center justify-center gap-2"
              >
                {isGeneratingAI ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    <span>AI Membuat Soal...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Buat Soal AI Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {status === "playing" && activeQuestion && (
          <div className="w-full grid md:grid-cols-2 gap-8 items-stretch animate-fadeIn">
            {/* LEFT COLUMN: QUESTION PANEL */}
            <div className="flex flex-col justify-between p-6 md:p-8 rounded-3xl border-4 border-yellow-300 border-b-[10px] bg-gradient-to-t from-indigo-900 via-purple-900 to-slate-900 shadow-2xl text-white">
              <div>
                {/* Progress Indicators */}
                <div className="flex justify-between items-center text-xs font-black mb-6">
                  <span className="bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <span>💬</span>
                    <span>{remedialQuestion ? "Mode Remedial ⚙️" : `${category.replace("_", " ").toUpperCase()}`}</span>
                  </span>
                  <span className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/20 text-yellow-300">
                    Soal {currentIdx + 1} dari {questions.length}
                  </span>
                </div>

                {/* VISUAL COMPONENT: SOAL INTERAKTIF (CLOUD BUBBLE) */}
                {category === "visual" && activeQuestion.visual_helper && (
                  <div className="flex flex-wrap justify-center gap-3 mb-6 bg-white/90 p-6 rounded-3xl border-4 border-yellow-400 shadow-lg animate-bounce" style={{ animationDuration: '4s' }}>
                    {Array.from(activeQuestion.visual_helper).map((emoji, index) => (
                      <span key={index} className="text-4xl sm:text-5xl hover:scale-125 transition-transform duration-200 cursor-pointer drop-shadow-md">
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}

                {/* AUDIO COMPONENT: SOAL CERITA / PODCAST */}
                {category === "soal_cerita" && (
                  <div className="flex flex-col items-center gap-3 mb-6 bg-rose-950/80 p-4 rounded-3xl border-2 border-rose-400 shadow">
                    <div className="flex items-center gap-3 w-full justify-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        isAudioPlaying ? "bg-rose-500 animate-ping text-white" : "bg-rose-500 text-white"
                      }`}>
                        🎙️
                      </div>
                      <button
                        onClick={() => speakStory(activeQuestion.pertanyaan)}
                        className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 text-xs font-black rounded-2xl cursor-pointer transition-all shadow-md border-2 border-white"
                      >
                        {isAudioPlaying ? "🔊 Sedang Membacakan..." : "▶️ Putar Suara Narator"}
                      </button>
                    </div>
                    <span className="text-[10px] text-rose-200 font-black uppercase tracking-wider">🎧 Dongeng Matematika AI</span>
                  </div>
                )}

                {/* Question Text */}
                <div className="bg-black/30 p-5 rounded-3xl border-2 border-white/10 mb-4">
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-relaxed tracking-wide text-left">
                    {activeQuestion.pertanyaan}
                  </h2>
                </div>
              </div>

              {/* Kid Friendly Petunjuk */}
              <div className="bg-yellow-400/15 p-4 rounded-2xl border-2 border-yellow-300/40 text-left text-xs text-yellow-100 leading-relaxed font-bold flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span><strong className="text-yellow-300">Tips Kodi:</strong> Tulis jawaban angkamu di kotak hitam sebelah kanan dengan tebal, lalu tekan tombol hijau <strong className="text-emerald-400">✨ Kirim Jawaban!</strong></span>
              </div>
            </div>

            {/* RIGHT COLUMN: TOY CANVAS INPUT */}
            <div className="flex justify-center items-center">
              <HandwritingCanvas onPredict={handlePredictAnswer} showButtons={true} />
            </div>
          </div>
        )}

        {/* STATUS SCREEN: SUCCESS OVERLAY */}
        {status === "success" && (
          <div className="w-full max-w-lg bg-gradient-to-t from-emerald-700 via-green-600 to-emerald-500 border-4 border-white border-b-[10px] p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn text-white">
            <div className="w-24 h-24 bg-white border-4 border-yellow-300 text-slate-950 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 animate-bounce shadow-lg">
              🌟
            </div>
            <h2 className="text-4xl font-black text-yellow-300 mb-2 drop-shadow-md tracking-tight">HORE! JAWABAN BENAR!</h2>
            <p className="text-white text-sm font-black mb-6 drop-shadow">
              AI membaca jawabanmu dengan sempurna! Kamu mendapatkan +10 Poin Bintang!
            </p>

            {lastPrediction !== null && (
              <div className="bg-slate-950/80 py-4 px-6 rounded-3xl inline-flex items-center gap-3 border-2 border-yellow-300 mb-8 shadow-inner">
                <span className="text-xs text-yellow-200 font-bold">Angka Pilihanmu:</span>
                <span className="text-3xl font-black text-yellow-400">{lastPrediction}</span>
                <span className="text-xs text-emerald-300 font-black">✓ Kunci: {activeQuestion?.jawaban}</span>
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-2xl border-4 border-white border-b-[6px] shadow-xl text-base transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{currentIdx + 1 < questions.length ? "Lanjut Soal Berikutnya →" : "Selesaikan Petualangan 🏁"}</span>
            </button>
          </div>
        )}

        {/* STATUS SCREEN: RETRY OVERLAY */}
        {status === "retry" && (
          <div className="w-full max-w-lg bg-gradient-to-t from-rose-700 via-pink-600 to-rose-500 border-4 border-white border-b-[10px] p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn text-white">
            <div className="w-24 h-24 bg-white border-4 border-yellow-300 text-slate-950 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce shadow-lg">
              💪
            </div>
            <h2 className="text-3xl font-black text-yellow-300 mb-2 drop-shadow-md tracking-tight">Kurang Tepat, Ayo Coba Lagi!</h2>
            <p className="text-white text-sm font-black mb-6 drop-shadow">
              Jangan menyerah! Hapus coretan lamamu dan lukis kembali angka jawabanmu dengan lebih jelas & tebal di tengah kanvas.
            </p>

            {lastPrediction !== null && (
              <div className="bg-slate-950/80 py-4 px-6 rounded-3xl inline-flex items-center gap-2 border-2 border-rose-300 mb-8 shadow-inner">
                <span className="text-xs text-rose-200 font-bold">AI Membaca coretanmu sebagai: </span>
                <strong className="text-yellow-300 font-black text-2xl pl-1">{lastPrediction}</strong>
              </div>
            )}

            <button
              onClick={handleRetryQuestion}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-2xl border-4 border-white border-b-[6px] shadow-xl text-base transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🧹 Hapus Coretan & Gambar Ulang!</span>
            </button>
          </div>
        )}

        {/* STATUS SCREEN: GAMEOVER */}
        {status === "gameover" && (
          <div className="w-full max-w-lg bg-gradient-to-t from-slate-900 via-purple-950 to-indigo-950 border-4 border-rose-400 border-b-[10px] p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn text-white">
            <div className="w-24 h-24 bg-rose-500 border-4 border-white rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">
              💔
            </div>
            <h2 className="text-3xl font-black text-rose-400 mb-2 tracking-tight">Nyawa Habis!</h2>
            <p className="text-slate-200 text-sm font-bold mb-8 leading-relaxed">
              Kamu telah mencoba dengan sangat baik hari ini! Ayo istirahat sejenak, lalu mulai kuis baru untuk memecahkan rekor lamamu!
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleQuit}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs active:scale-95 transition-all cursor-pointer border-2 border-white/20"
              >
                Kembali ke Peta
              </button>
              <button
                onClick={() => {
                  setLives(3);
                  setCurrentIdx(0);
                  setStatus("playing");
                }}
                className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg border-2 border-white"
              >
                Ulangi Kuis 🔄
              </button>
            </div>
          </div>
        )}

        {/* STATUS SCREEN: FINISHED CELEBRATION */}
        {status === "finished" && (
          <div className="w-full max-w-lg bg-gradient-to-t from-amber-600 via-yellow-500 to-purple-800 border-4 border-white border-b-[10px] p-8 rounded-3xl shadow-2xl text-center relative animate-scaleIn text-white">
            <div className="w-28 h-28 bg-white border-4 border-yellow-300 rounded-full flex items-center justify-center text-7xl shadow-2xl mx-auto mb-6 animate-bounce">
              🏆
            </div>
            <h2 className="text-4xl font-black text-yellow-300 mb-2 drop-shadow-lg tracking-tight">PETUALANGAN SELESAI!</h2>
            <p className="text-white text-sm font-black mb-6 drop-shadow">
              Hebat sekali! Kamu menyelesaikan semua tantangan matematika dengan luar biasa!
            </p>

            <div className="bg-slate-950/80 p-6 rounded-3xl border-2 border-yellow-300 mb-8 flex flex-col gap-3 text-left font-bold shadow-inner">
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-200 font-black">Total Bintang Didapat:</span>
                <span className="font-black text-yellow-400 text-lg">⭐️ +{pointsEarned} Poin</span>
              </div>
              <div className="h-[2px] bg-white/20" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-rose-200 font-black">Nyawa Tersisa:</span>
                <span className="font-black text-rose-400 text-lg">{lives} / 3 ❤️</span>
              </div>
            </div>

            <button
              onClick={handleQuit}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-2xl border-4 border-white border-b-[6px] shadow-2xl text-base transition-all cursor-pointer"
            >
              Kembali ke Peta Petualangan 🗺️
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-300 font-black text-xl animate-bounce">Membuka Kuis Seru... 🎨</div>}>
      <QuizContent />
    </Suspense>
  );
}
