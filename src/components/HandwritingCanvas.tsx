'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DigitalInk } from 'capacitor-mlkit-digitalink-plugin';

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
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Buffer untuk menyimpan seluruh titik goresan di sesi kanvas saat ini
  const allStrokesRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });
  // Buffer untuk satu goresan (stroke) tunggal yang sedang ditarik
  const currentStrokeRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });

  // Inisialisasi model ML Kit di background secara non-blocking
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        await DigitalInk.initializePlugin();
        await DigitalInk.downloadSingularModel({ model: 'en-US' }, () => {});
      } catch (e) {
        console.warn("ML Kit native plugin tidak tersedia atau berjalan di web browser. Algoritma Neural Canvas Cepat diaktifkan sebagai utama.", e);
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
    ctx.lineWidth = 14; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
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
    
    // Kirim goresan ke ML Kit secara asinkron tanpa memblokir UI / drawing thread
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
    allStrokesRef.current = { x: [], y: [] };
    currentStrokeRef.current = { x: [], y: [] };
    
    try {
      await DigitalInk.erase();
    } catch {
      // Abaikan error jika berjalan di browser web
    }
  }, []);

  // Algoritma Pengenalan Cepat 0-9 dari Goresan Kanvas (Instant Geometric & Grid Recognition)
  const fastPredictDigitFromCanvas = (): number | null => {
    const { x, y } = allStrokesRef.current;
    if (x.length === 0 || y.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < x.length; i++) {
      if (x[i] < minX) minX = x[i];
      if (x[i] > maxX) maxX = x[i];
      if (y[i] < minY) minY = y[i];
      if (y[i] > maxY) maxY = y[i];
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const aspectRatio = width / height;

    // 1. Jika sangat ramping vertikal (garis lurus ke bawah), hampir pasti angka 1
    if (aspectRatio < 0.38 && height > 35) {
      return 1;
    }

    // 2. Hitung matriks kepadatan 3x3 untuk menganalisis bentuk angka (0 sampai 9)
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < x.length; i++) {
      const col = Math.min(2, Math.floor(((x[i] - minX) / width) * 3));
      const row = Math.min(2, Math.floor(((y[i] - minY) / height) * 3));
      grid[row][col] += 1;
    }

    const totalPts = x.length;
    const startX = (x[0] - minX) / width;
    const startY = (y[0] - minY) / height;
    const endX = (x[x.length - 1] - minX) / width;
    const endY = (y[y.length - 1] - minY) / height;
    const startEndDist = Math.hypot(startX - endX, startY - endY);

    // Cek apakah tertutup (Loop / Angka 0)
    if (startEndDist < 0.32 && aspectRatio > 0.55 && grid[1][1] / totalPts < 0.25) {
      return 0;
    }

    // Cek Angka 7 (Garis atas padat + diagonal turun ke kiri bawah)
    const topRowRatio = (grid[0][0] + grid[0][1] + grid[0][2]) / totalPts;
    const botRowRatio = (grid[2][0] + grid[2][1] + grid[2][2]) / totalPts;
    if (topRowRatio > 0.35 && startY < 0.35 && endY > 0.65 && startX < endX + 0.3) {
      if (grid[2][0] > grid[2][2]) return 7;
    }

    // Cek Angka 4 (Kepadatan di tengah dan kanan, atau persilangan vertikal/horizontal)
    if (grid[1][1] / totalPts > 0.18 && endY > 0.7 && endX > 0.5 && startY < 0.45 && startX < 0.5) {
      return 4;
    }

    // Cek Angka 2 (Lengkung atas kiri ke kanan, lalu garis datar di bawah ke kanan)
    if (startY < 0.4 && endY > 0.7 && endX > 0.6 && grid[2][2] > 0 && grid[0][2] > 0) {
      if (endX > startX + 0.2) return 2;
    }

    // Cek Angka 3 (Dua lengkungan kanan, akhir di kiri/tengah bawah)
    if (grid[0][2] + grid[1][2] + grid[2][2] > grid[0][0] + grid[1][0] + grid[2][0]) {
      if (startY < 0.4 && endY > 0.65 && endX < 0.75) return 3;
    }

    // Cek Angka 6 (Mulai dari atas kanan/tengah, melengkung membuat loop di bawah)
    if (startY < 0.35 && startX > 0.4 && botRowRatio > 0.35) {
      return 6;
    }

    // Cek Angka 9 (Loop di atas, garis turun ke bawah)
    if (topRowRatio > 0.35 && endY > 0.7 && endX < 0.65) {
      return 9;
    }

    // Cek Angka 8 (Padat di atas, tengah, dan bawah)
    if (grid[1][1] / totalPts > 0.15 && topRowRatio > 0.25 && botRowRatio > 0.25) {
      return 8;
    }

    // Cek Angka 5 (Atas datar/kiri, lengkung tengah ke kanan bawah)
    if (startY < 0.35 && grid[0][0] > 0 && grid[1][0] > 0 && grid[2][1] + grid[2][2] > 0) {
      return 5;
    }

    // Default ke angka berdasar rasio aspek jika tidak terklasifikasi khusus
    return aspectRatio < 0.45 ? 1 : 0;
  };

  const handlePredict = useCallback(async () => {
    if (allStrokesRef.current.x.length === 0) {
      alert("Kamu belum melukis angka di kanvas! Yuk lukis jawabanmu dahulu.");
      return;
    }

    setIsModelLoading(true);

    try {
      // Kita jalankan prediksi ML Kit secara paralel dengan batas waktu maksimal (timeout 120ms)
      // agar di web browser prediksi berlangsung kilat dan tidak pernah lambat/stuck!
      const mlKitPromise = new Promise<number | null>(async (resolve) => {
        try {
          const canvas = canvasRef.current;
          const writingArea = canvas ? { w: canvas.width, h: canvas.height } : { w: 400, h: 400 };
          
          const response = await DigitalInk.doRecognition({
            model: 'en-US',
            writingArea
          });

          if (response.ok && response.results && response.results.candidates && response.results.candidates.length > 0) {
            const bestResult = response.results.candidates[0];
            const match = bestResult.match(/\d/);
            const predictedDigit = match ? parseInt(match[0], 10) : parseInt(bestResult, 10);
            if (!isNaN(predictedDigit)) {
              resolve(predictedDigit);
              return;
            }
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      });

      // Timeout 120ms: jika ML Kit lambat, langsung gunakan prediksi Geometric Canvas Instant (< 5ms)
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 120));

      const mlKitDigit = await Promise.race([mlKitPromise, timeoutPromise]);
      
      // Jika ML Kit memberikan digit dalam waktu < 120ms, gunakan. Jika lambat/null, pakai fastPredictDigitFromCanvas!
      const finalDigit = (mlKitDigit !== null && mlKitDigit >= 0 && mlKitDigit <= 9)
        ? mlKitDigit
        : fastPredictDigitFromCanvas();

      if (finalDigit !== null) {
        setPrediction(finalDigit);
        if (onPredict) {
          onPredict(finalDigit);
        }
      } else {
        alert("Coretan belum jelas. Coba lukis angkanya sekali lagi ya!");
      }
    } catch (error) {
      console.error(error);
      const fallbackDigit = fastPredictDigitFromCanvas() ?? 0;
      setPrediction(fallbackDigit);
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
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 border-4 border-yellow-300 border-b-[8px] rounded-3xl shadow-2xl w-full max-w-[480px]">
      <div className="flex items-center justify-between w-full pb-2 border-b-2 border-white/20">
        <span className="text-xs font-black bg-yellow-400 text-slate-950 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
          <span>⚡</span> KANVAS PINTAR KILAT
        </span>
        <span className="text-xs font-bold text-yellow-200">
          Lukis angka jawabanmu di sini!
        </span>
      </div>

      <div className="relative border-4 border-yellow-400 rounded-3xl overflow-hidden shadow-inner bg-black cursor-crosshair">
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
          className="block touch-none"
        />

        {isModelLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center font-black text-yellow-400 text-sm gap-2">
            <span className="animate-spin text-xl">⏳</span> Membaca Angka...
          </div>
        )}
      </div>

      {showButtons && (
        <div className="flex items-center justify-between w-full gap-3 pt-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-lg border-2 border-white"
          >
            🗑️ Hapus Ulang
          </button>
          
          <button
            type="button"
            onClick={handlePredict}
            disabled={isModelLoading}
            className="flex-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-lg border-2 border-white flex items-center justify-center gap-1.5"
          >
            <span>🚀</span> {isModelLoading ? "Membaca..." : "Kirim & Cek Jawaban!"}
          </button>
        </div>
      )}

      {prediction !== null && (
        <div className="w-full mt-2 p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl text-center animate-bounce">
          <span className="text-xs font-bold text-emerald-300">Hasil Pembacaan AI:</span>
          <span className="ml-2 text-xl font-black text-yellow-300">{prediction}</span>
        </div>
      )}
    </div>
  );
}