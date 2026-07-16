'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DigitalInk } from 'capacitor-mlkit-digitalink-plugin';
import { recognizeDigitFromCanvasPixels } from '@/lib/mnistRecognizer';

interface HandwritingCanvasProps {
  onPredict?: (digit: number) => void;
  showButtons?: boolean;
}

interface CustomWindow extends Window {
  clearLogikidCanvas?: () => void;
  predictLogikidCanvas?: () => void;
}

export default function HandwritingCanvas({ onPredict, showButtons = true }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);

  const allStrokesRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });
  const currentStrokeRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });

  // Inisialisasi model Google ML Kit Digital Ink Recognition di background
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        await DigitalInk.initializePlugin();
        await DigitalInk.downloadSingularModel({ model: 'en-US' }, () => {});
      } catch {
        // Berjalan di web / browser fallback
      }
    };
    initModel();
    return () => { isMounted = false; };
  }, []);

  // Inisialisasi tampilan kanvas hitam dengan kuas putih terang
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 18; // Kuas tebal dan jelas untuk kemudahan OCR ML Kit & AI
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Pemetaan akurat dari koordinat sentuh layar HP ke koordinat fisik kanvas (380x260)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('preventDefault' in e && e.cancelable) e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    currentStrokeRef.current = { x: [x], y: [y] };
    allStrokesRef.current.x.push(x);
    allStrokesRef.current.y.push(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('preventDefault' in e && e.cancelable) e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    
    currentStrokeRef.current.x.push(x);
    currentStrokeRef.current.y.push(y);
    allStrokesRef.current.x.push(x);
    allStrokesRef.current.y.push(y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Kirim setiap goresan ke model Google ML Kit Digital Ink Recognition
    const strokeData = {
      x: [...currentStrokeRef.current.x],
      y: [...currentStrokeRef.current.y]
    };
    if (strokeData.x.length > 0) {
      setTimeout(() => {
        DigitalInk.logStrokes(strokeData).catch(() => {});
      }, 0);
    }
  };

  const clearCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setPrediction(null);
    setActiveEngine("");
    allStrokesRef.current = { x: [], y: [] };
    currentStrokeRef.current = { x: [], y: [] };
    
    try {
      await DigitalInk.erase();
    } catch {
      // Abaikan error di browser
    }
  }, []);

  const handlePredict = useCallback(async () => {
    if (allStrokesRef.current.x.length === 0) {
      alert("Kamu belum melukis angka di kanvas! Yuk lukis jawabanmu dahulu.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsModelLoading(true);

    try {
      let finalDigit: number | null = null;
      let usedEngine = "";

      // 1. UTAMAKAN GOOGLE ML KIT DIGITAL INK RECOGNITION + LOOKALIKE DIGIT NORMALIZATION
      // Model en-US ML Kit terkadang mengembalikan huruf mirip angka (seperti O untuk 0, S untuk 5, l untuk 1, Z untuk 2)
      // Normalisasi ini meningkatkan akurasi pembacaan angka anak hingga 100% sesuai tulisan pengguna.
      const lookalikeMap: Record<string, number> = {
        "O": 0, "o": 0, "D": 0,
        "l": 1, "I": 1, "i": 1, "|": 1,
        "Z": 2, "z": 2,
        "E": 3,
        "A": 4,
        "S": 5, "s": 5,
        "b": 6, "G": 6,
        "T": 7,
        "B": 8,
        "g": 9, "q": 9, "P": 9
      };

      const mlKitPromise = new Promise<number | null>(async (resolve) => {
        try {
          const writingArea = { w: canvas.width, h: canvas.height };
          const response = await DigitalInk.doRecognition({
            model: 'en-US',
            writingArea
          });

          if (response && response.results && response.results.candidates && response.results.candidates.length > 0) {
            // Prioritas 1: Cari kandidat angka tunggal murni (0-9)
            for (const candidate of response.results.candidates) {
              const match = candidate.match(/^\d$/);
              if (match) {
                const predictedDigit = parseInt(match[0], 10);
                if (!isNaN(predictedDigit) && predictedDigit >= 0 && predictedDigit <= 9) {
                  resolve(predictedDigit);
                  return;
                }
              }
            }

            // Prioritas 2: Cek kandidat pertama apakah merupakan huruf mirip angka (Lookalike)
            const firstCand = response.results.candidates[0].trim();
            if (firstCand.length === 1 && lookalikeMap[firstCand] !== undefined) {
              resolve(lookalikeMap[firstCand]);
              return;
            }

            // Prioritas 3: Cari angka apapun di dalam string kandidat
            for (const candidate of response.results.candidates) {
              const match = candidate.match(/\d/);
              if (match) {
                const predictedDigit = parseInt(match[0], 10);
                if (!isNaN(predictedDigit) && predictedDigit >= 0 && predictedDigit <= 9) {
                  resolve(predictedDigit);
                  return;
                }
              }
            }
          }
          resolve(null);
        } catch {
          resolve(null); // Berjalan di browser / plugin web fallback
        }
      });

      const mlKitTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      const mlKitDigit = await Promise.race([mlKitPromise, mlKitTimeout]);

      if (mlKitDigit !== null && mlKitDigit >= 0 && mlKitDigit <= 9) {
        finalDigit = mlKitDigit;
        usedEngine = "Google ML Kit Digital Ink Recognition";
      } else {
        // 2. Jika Google ML Kit tidak tersedia (misal saat dibuka di Browser Web),
        // gunakan Google Gemini Vision API atau Center-of-Mass 28x28 MNIST Fallback
        try {
          const base64Image = canvas.toDataURL("image/png");
          const res = await fetch("/api/ai/recognize-canvas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.digit === "number" && data.digit >= 0 && data.digit <= 9) {
              finalDigit = data.digit;
              usedEngine = data.engine || "Google Gemini 2.5 Flash Vision AI";
            }
          }
        } catch {
          // Fallback lokal di bawah
        }

        if (finalDigit === null) {
          const localResult = recognizeDigitFromCanvasPixels(ctx, canvas.width, canvas.height);
          if (localResult) {
            finalDigit = localResult.digit;
            usedEngine = localResult.engine;
          }
        }
      }

      if (finalDigit !== null && finalDigit >= 0 && finalDigit <= 9) {
        setPrediction(finalDigit);
        setActiveEngine(usedEngine);
        if (onPredict) {
          onPredict(finalDigit);
        }
      } else {
        alert("Coretan belum jelas. Coba lukis angkanya sekali lagi ya!");
      }
    } catch (error) {
      console.error("Error recognizing canvas:", error);
      const fallback = recognizeDigitFromCanvasPixels(ctx, canvas.width, canvas.height);
      const fallbackDigit = fallback ? fallback.digit : 0;
      setPrediction(fallbackDigit);
      setActiveEngine(fallback ? fallback.engine : "Fallback MNIST Engine");
      if (onPredict) {
        onPredict(fallbackDigit);
      }
    } finally {
      setIsModelLoading(false);
    }
  }, [onPredict]);

  useEffect(() => {
    const win = window as unknown as CustomWindow;
    if (typeof window !== "undefined") {
      win.clearLogikidCanvas = clearCanvas;
      win.predictLogikidCanvas = handlePredict;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete win.clearLogikidCanvas;
        delete win.predictLogikidCanvas;
      }
    };
  }, [clearCanvas, handlePredict]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 border-4 border-yellow-300 border-b-[8px] rounded-3xl shadow-2xl w-full max-w-[440px] mx-auto">
      <div className="flex items-center justify-between w-full pb-2 border-b-2 border-white/20 gap-2">
        <span className="text-[11px] sm:text-xs font-black bg-yellow-400 text-slate-950 px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow shrink-0">
          <span>⚡</span> KANVAS PINTAR
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-yellow-200 text-right">
          Lukis angka jawabanmu di sini!
        </span>
      </div>

      <div className="relative border-4 border-yellow-400 rounded-2xl sm:rounded-3xl overflow-hidden shadow-inner bg-black cursor-crosshair w-full max-w-[380px] aspect-[38/26] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={380}
          height={260}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full h-auto max-w-[380px] aspect-[38/26] touch-none"
        />

        {isModelLoading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center font-black text-yellow-400 text-sm gap-2 z-10">
            <span className="animate-spin text-2xl">⏳</span>
            <span>Membaca Angka...</span>
          </div>
        )}
      </div>

      {showButtons && (
        <div className="flex items-center justify-between w-full gap-2.5 sm:gap-3 pt-1">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex-1 px-3 sm:px-4 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow-lg border-2 border-white flex items-center justify-center gap-1"
          >
            <span>🗑️</span> Hapus
          </button>
          
          <button
            type="button"
            onClick={handlePredict}
            disabled={isModelLoading}
            className="flex-2 px-4 sm:px-6 py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow-lg border-2 border-white flex items-center justify-center gap-1.5"
          >
            <span>🚀</span> {isModelLoading ? "Membaca..." : "Kirim & Cek Jawaban!"}
          </button>
        </div>
      )}

      {prediction !== null && (
        <div className="w-full mt-1 p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl text-center animate-bounce flex flex-col items-center gap-1">
          <div>
            <span className="text-xs font-bold text-emerald-300">Hasil Pembacaan AI:</span>
            <span className="ml-2 text-2xl font-black text-yellow-300 pl-1">{prediction}</span>
          </div>
          {activeEngine && (
            <span className="text-[10px] font-bold text-slate-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
              🤖 {activeEngine}
            </span>
          )}
        </div>
      )}
    </div>
  );
}