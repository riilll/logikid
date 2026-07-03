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
  const [modelDownloaded, setModelDownloaded] = useState(false);

  // Buffer untuk satu goresan (stroke) saat ini
  const strokeRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });

  // Inisialisasi model bahasa ML Kit (en-US sangat akurat untuk angka)
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        await DigitalInk.initializePlugin();
        
        // Cek apakah model sudah ada agar tidak terjebak loading
        const downloadedRes = await DigitalInk.getDownloadedModels();
        if (downloadedRes.ok && downloadedRes.models && downloadedRes.models.includes('en-US')) {
          if (isMounted) setModelDownloaded(true);
          console.log("Model ML Kit sudah tersedia!");
          return;
        }

        await DigitalInk.downloadSingularModel({ model: 'en-US' }, (res, err) => {
          console.log("Download model status:", res, err);
          if (res && res.done && isMounted) {
            setModelDownloaded(true);
            console.log("Model ML Kit Digital Ink berhasil diunduh/siap!");
          }
        });
      } catch (e) {
        console.error("Gagal menginisialisasi ML Kit", e);
        // Sebagai fallback agar UI tidak stuck, kita asumsikan siap jika error tertentu
        if (isMounted) setModelDownloaded(true); 
      }
    };
    initModel();

    return () => { isMounted = false; };
  }, []);

  // Hapus memori ML Kit di awal agar tidak tercampur sisa coretan sebelumnya
  useEffect(() => {
    DigitalInk.erase().catch(console.error);
  }, []);

  // Inisialisasi kanvas visual
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

  const recordPoint = (x: number, y: number) => {
    strokeRef.current.x.push(x);
    strokeRef.current.y.push(y);
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

    // Reset stroke buffer untuk goresan baru
    strokeRef.current = { x: [], y: [] };
    recordPoint(x, y);
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
    
    recordPoint(x, y);
  };

  const stopDrawing = async () => {
    setIsDrawing(false);
    
    // Setelah goresan selesai, kirim data goresan ke SDK ML Kit
    if (strokeRef.current.x.length > 0) {
      try {
        await DigitalInk.logStrokes(strokeRef.current);
      } catch (err) {
        console.error("Error logging strokes to ML Kit", err);
      }
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
    strokeRef.current = { x: [], y: [] };
    
    // Hapus memori goresan dari ML Kit Native
    try {
      await DigitalInk.erase();
    } catch (err) {
      console.error("Error erasing ML Kit memory", err);
    }
  }, []);

  const handlePredict = useCallback(async () => {
    setIsModelLoading(true);
    try {
      const canvas = canvasRef.current;
      const writingArea = canvas ? { w: canvas.width, h: canvas.height } : { w: 400, h: 400 };
      
      const response = await DigitalInk.doRecognition({
        model: 'en-US',
        writingArea
      });

      if (response.ok && response.results.candidates.length > 0) {
        // Ambil hasil terbaik (kandidat pertama)
        const bestResult = response.results.candidates[0];
        console.log("Kandidat ML Kit:", response.results.candidates);
        
        // Filter hanya angka jika diperlukan
        const match = bestResult.match(/\d/);
        const predictedDigit = match ? parseInt(match[0], 10) : parseInt(bestResult, 10);
        
        if (!isNaN(predictedDigit)) {
          setPrediction(predictedDigit);
          if (onPredict) {
            onPredict(predictedDigit);
          }
        } else {
          alert("AI tidak mengenali angka dengan jelas. Coba lagi!");
        }
      } else {
        alert("Tidak ada coretan yang dikenali!");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan prediksi dengan ML Kit");
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
    <div className="flex flex-col items-center gap-4 p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl w-full max-w-[480px]">
      <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-white/10 shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Kid Friendly Drawing Hint overlay */}
        {prediction === null && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/30 text-sm font-medium select-none">
            ✏️ Tulis jawaban angka di sini
          </div>
        )}
      </div>

      {showButtons && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={clearCanvas}
            type="button"
            className="py-3 px-4 bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 font-bold rounded-xl border border-rose-500/30 transition-all cursor-pointer text-sm"
          >
            🧹 Hapus Coretan
          </button>

          <button
            onClick={handlePredict}
            disabled={isModelLoading || !modelDownloaded}
            type="button"
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {!modelDownloaded ? (
              <>⏳ Menyiapkan AI...</>
            ) : isModelLoading ? (
              <>🤖 Berpikir...</>
            ) : (
              <>🔍 Kirim Jawaban</>
            )}
          </button>
        </div>
      )}

      {/* Playful developer preview & result card */}
      <div className="flex items-center justify-between w-full bg-black/40 rounded-2xl p-3 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl">
            🧠
          </div>
          <div className="text-left">
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Engine</p>
            <p className="text-xs text-white/80 font-medium">Google ML Kit Digital Ink</p>
          </div>
        </div>

        {prediction !== null && (
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
            <span className="text-xs text-white/60">AI Membaca:</span>
            <span className="text-xl font-black text-amber-400">{prediction}</span>
          </div>
        )}
      </div>
    </div>
  );
}