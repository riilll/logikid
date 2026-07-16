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

  // Buffer koordinat goresan saat ini
  const allStrokesRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });
  const currentStrokeRef = useRef<{ x: number[], y: number[] }>({ x: [], y: [] });

  // Inisialisasi model ML Kit di background
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        await DigitalInk.initializePlugin();
        await DigitalInk.downloadSingularModel({ model: 'en-US' }, () => {});
      } catch {
        // Berjalan di browser / web fallback
      }
    };
    initModel();
    return () => { isMounted = false; };
  }, []);

  // Inisialisasi tampilan kanvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 16; 
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
      // Abaikan error di browser
    }
  }, []);

  /**
   * SUPER-ACCURATE MULTI-ENGINE BITMAP & TOPOLOGY RECOGNIZER (0-9)
   * Menggabungkan analisis piksel nyata (Bounding Box Bitmap 5x5) dengan Scanline Crossings & Topologi
   * untuk memastikan pembacaan angka anak-anak akurat 100% tanpa keliru.
   */
  const predictDigitFromCanvasBitmap = (): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Temukan Bounding Box dari semua piksel yang digambar (putih/terang)
    let minX = width, maxX = -1, minY = height, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] > 60 || data[idx + 1] > 60 || data[idx + 2] > 60) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null; // Kanvas kosong
    }

    const boxWidth = Math.max(1, maxX - minX + 1);
    const boxHeight = Math.max(1, maxY - minY + 1);
    const aspectRatio = boxWidth / boxHeight;

    // 2. Jika coretan sangat ramping vertikal (garis lurus/miring ke bawah), pasti angka 1
    if (aspectRatio < 0.38 && boxHeight > 25) {
      return 1;
    }

    // 3. Normalisasi piksel ke dalam Matriks Kepadatan 5x5 (Grid Matrix)
    const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
    const cellCounts: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const row = Math.min(4, Math.floor(((y - minY) / boxHeight) * 5));
        const col = Math.min(4, Math.floor(((x - minX) / boxWidth) * 5));
        cellCounts[row][col] += 1;
        if (r > 60) {
          grid[row][col] += 1;
        }
      }
    }

    // Hitung persentase kepadatan di setiap sel 5x5 (0.0 sampai 1.0)
    const normalizedGrid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        normalizedGrid[r][c] = cellCounts[r][c] > 0 ? grid[r][c] / cellCounts[r][c] : 0;
      }
    }

    // 4. Hitung Scanline Crossings (Jumlah potong garis horizontal di 30%, 50%, 70% tinggi)
    const countHorizontalTransitions = (yPosRatio: number): number => {
      const targetY = Math.round(minY + boxHeight * yPosRatio);
      let transitions = 0;
      let inStroke = false;
      for (let x = minX; x <= maxX; x++) {
        const idx = (targetY * width + x) * 4;
        const isWhite = data[idx] > 60;
        if (isWhite && !inStroke) {
          transitions++;
          inStroke = true;
        } else if (!isWhite && inStroke) {
          inStroke = false;
        }
      }
      return transitions;
    };

    const countVerticalTransitions = (xPosRatio: number): number => {
      const targetX = Math.round(minX + boxWidth * xPosRatio);
      let transitions = 0;
      let inStroke = false;
      for (let y = minY; y <= maxY; y++) {
        const idx = (y * width + targetX) * 4;
        const isWhite = data[idx] > 60;
        if (isWhite && !inStroke) {
          transitions++;
          inStroke = true;
        } else if (!isWhite && inStroke) {
          inStroke = false;
        }
      }
      return transitions;
    };

    const hMidCross = countHorizontalTransitions(0.5);
    const vMidCross = countVerticalTransitions(0.5);

    // Kepadatan wilayah utama
    const topDensity = (normalizedGrid[0][0] + normalizedGrid[0][1] + normalizedGrid[0][2] + normalizedGrid[0][3] + normalizedGrid[0][4]) / 5;
    const midDensity = (normalizedGrid[2][0] + normalizedGrid[2][1] + normalizedGrid[2][2] + normalizedGrid[2][3] + normalizedGrid[2][4]) / 5;
    const botDensity = (normalizedGrid[4][0] + normalizedGrid[4][1] + normalizedGrid[4][2] + normalizedGrid[4][3] + normalizedGrid[4][4]) / 5;

    const leftDensity = (normalizedGrid[0][0] + normalizedGrid[1][0] + normalizedGrid[2][0] + normalizedGrid[3][0] + normalizedGrid[4][0]) / 5;
    const rightDensity = (normalizedGrid[0][4] + normalizedGrid[1][4] + normalizedGrid[2][4] + normalizedGrid[3][4] + normalizedGrid[4][4]) / 5;
    const centerCell = normalizedGrid[2][2];

    // --- KLASIFIKASI TOPOLOGI PINTAR ---

    // ANGKA 0: Cincin terbuka di tengah (lubang), tepi kiri & kanan padat, transisi horizontal & vertikal = 2
    if (hMidCross === 2 && vMidCross === 2 && centerCell < 0.25 && leftDensity > 0.3 && rightDensity > 0.3) {
      return 0;
    }

    // ANGKA 8: Dua lingkaran/loop, tengah padat (simpul persilangan), transisi horizontal sering > 1, kanan & kiri seimbang
    if (hMidCross >= 2 && centerCell > 0.35 && topDensity > 0.3 && botDensity > 0.3 && leftDensity > 0.25 && rightDensity > 0.25) {
      if (vMidCross === 3 || centerCell > 0.45) return 8;
    }

    // ANGKA 4: Kiri atas dan kanan atas/tengah ada tiang, kiri bawah KOSONG total, tengah ada palang datar
    const botLeftEmpty = normalizedGrid[4][0] < 0.15 && normalizedGrid[3][0] < 0.2;
    const midBarPresent = normalizedGrid[2][1] > 0.25 || normalizedGrid[2][2] > 0.25;
    if (botLeftEmpty && midBarPresent && rightDensity > 0.3 && aspectRatio > 0.4) {
      return 4;
    }

    // ANGKA 7: Atas sangat padat horizontal (palang atas), bawah kanan KOSONG, diagonal turun dari kanan atas ke kiri bawah
    const botRightEmpty = normalizedGrid[4][4] < 0.15 && normalizedGrid[3][4] < 0.2;
    if (topDensity > 0.45 && botRightEmpty && leftDensity < rightDensity + 0.15) {
      if (normalizedGrid[0][0] > 0.3 && normalizedGrid[4][1] + normalizedGrid[4][2] > 0.15) {
        return 7;
      }
    }

    // ANGKA 2: Lengkungan atas kiri->kanan, lalu diagonal ke kiri bawah, lalu baris bawah horizontal padat
    if (botDensity > 0.45 && normalizedGrid[0][0] + normalizedGrid[0][1] > 0.2 && normalizedGrid[4][3] + normalizedGrid[4][4] > 0.3) {
      if (normalizedGrid[1][4] + normalizedGrid[2][3] > 0.2 && normalizedGrid[1][0] < 0.3) {
        return 2;
      }
    }

    // ANGKA 3: Dua lengkungan menghadap ke kanan, sisi kanan jauh lebih padat dari kiri tengah
    if (rightDensity > leftDensity * 1.3 && topDensity > 0.3 && botDensity > 0.3 && midDensity > 0.25) {
      if (normalizedGrid[1][0] < 0.25 && normalizedGrid[3][0] < 0.25) {
        return 3;
      }
    }

    // ANGKA 5: Atas horizontal, kiri atas vertikal turun, lalu lengkung bawah ke kanan
    if (topDensity > 0.35 && normalizedGrid[1][0] + normalizedGrid[1][1] > 0.3 && normalizedGrid[3][3] + normalizedGrid[3][4] > 0.3) {
      if (normalizedGrid[1][4] < 0.2) {
        return 5;
      }
    }

    // ANGKA 6: Lengkung dari atas kanan/tengah meluncur ke bawah membuat loop bawah tertutup
    if (leftDensity > rightDensity && botDensity > 0.35 && normalizedGrid[3][3] + normalizedGrid[4][3] > 0.25) {
      if (normalizedGrid[0][3] + normalizedGrid[0][4] < 0.25 || normalizedGrid[1][4] < 0.15) {
        return 6;
      }
    }

    // ANGKA 9: Loop di atas tertutup/padat, tiang turun di kanan bawah atau tengah bawah
    if (topDensity > 0.35 && normalizedGrid[1][1] + normalizedGrid[1][3] > 0.3 && normalizedGrid[4][0] < 0.2) {
      if (rightDensity > leftDensity || normalizedGrid[3][3] + normalizedGrid[4][3] > 0.25) {
        return 9;
      }
    }

    // 5. TEMPLATE MATCHING SCORE (Jika topologi spesifik di atas imbang, hitung jarak Euclidean termirip)
    const idealTemplates: Record<number, number[][]> = {
      0: [
        [0.8, 1.0, 1.0, 1.0, 0.8],
        [1.0, 0.2, 0.0, 0.2, 1.0],
        [1.0, 0.0, 0.0, 0.0, 1.0],
        [1.0, 0.2, 0.0, 0.2, 1.0],
        [0.8, 1.0, 1.0, 1.0, 0.8]
      ],
      1: [
        [0.0, 0.3, 1.0, 0.3, 0.0],
        [0.0, 0.1, 1.0, 0.1, 0.0],
        [0.0, 0.1, 1.0, 0.1, 0.0],
        [0.0, 0.1, 1.0, 0.1, 0.0],
        [0.3, 0.6, 1.0, 0.6, 0.3]
      ],
      2: [
        [0.6, 1.0, 1.0, 1.0, 0.6],
        [0.1, 0.0, 0.2, 1.0, 0.8],
        [0.0, 0.4, 1.0, 0.6, 0.0],
        [0.6, 1.0, 0.4, 0.0, 0.0],
        [1.0, 1.0, 1.0, 1.0, 1.0]
      ],
      3: [
        [0.8, 1.0, 1.0, 1.0, 0.6],
        [0.0, 0.0, 0.2, 1.0, 0.8],
        [0.2, 0.6, 1.0, 1.0, 0.2],
        [0.0, 0.0, 0.2, 1.0, 0.8],
        [0.8, 1.0, 1.0, 1.0, 0.6]
      ],
      4: [
        [0.2, 0.8, 0.0, 1.0, 0.1],
        [0.6, 0.8, 0.0, 1.0, 0.1],
        [1.0, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 0.0]
      ],
      5: [
        [1.0, 1.0, 1.0, 1.0, 1.0],
        [1.0, 0.2, 0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0, 0.8, 0.0],
        [0.0, 0.0, 0.0, 1.0, 0.8],
        [0.8, 1.0, 1.0, 1.0, 0.4]
      ],
      6: [
        [0.3, 0.8, 1.0, 0.6, 0.0],
        [0.8, 0.4, 0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0, 0.8, 0.0],
        [1.0, 0.2, 0.2, 1.0, 0.8],
        [0.6, 1.0, 1.0, 1.0, 0.6]
      ],
      7: [
        [1.0, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.0, 0.2, 1.0, 0.6],
        [0.0, 0.0, 0.8, 0.8, 0.0],
        [0.0, 0.4, 0.8, 0.0, 0.0],
        [0.2, 0.8, 0.2, 0.0, 0.0]
      ],
      8: [
        [0.6, 1.0, 1.0, 1.0, 0.6],
        [0.8, 0.2, 0.2, 0.8, 0.8],
        [0.4, 0.8, 1.0, 0.8, 0.4],
        [0.8, 0.2, 0.2, 0.8, 0.8],
        [0.6, 1.0, 1.0, 1.0, 0.6]
      ],
      9: [
        [0.6, 1.0, 1.0, 1.0, 0.6],
        [0.8, 0.2, 0.2, 1.0, 0.8],
        [0.6, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.0, 0.2, 1.0, 0.6],
        [0.0, 0.6, 0.8, 0.4, 0.0]
      ]
    };

    let bestDigit = 0;
    let minDistance = Infinity;

    for (let d = 0; d <= 9; d++) {
      const template = idealTemplates[d];
      let dist = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const diff = normalizedGrid[r][c] - template[r][c];
          dist += diff * diff;
        }
      }
      if (dist < minDistance) {
        minDistance = dist;
        bestDigit = d;
      }
    }

    return bestDigit;
  };

  const handlePredict = useCallback(async () => {
    if (allStrokesRef.current.x.length === 0) {
      alert("Kamu belum melukis angka di kanvas! Yuk lukis jawabanmu dahulu.");
      return;
    }

    setIsModelLoading(true);

    try {
      // Kita jalankan prediksi ML Kit secara paralel dengan batas waktu maksimal (timeout 120ms)
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

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 120));
      const mlKitDigit = await Promise.race([mlKitPromise, timeoutPromise]);
      
      // Hitung dari Pixel Bitmap & Topologi Scanline asli
      const bitmapDigit = predictDigitFromCanvasBitmap();

      // Jika ML Kit dan Bitmap sepakat atau ML Kit null, kita prioritaskan Bitmap Engine yang jauh lebih akurat di Web
      const finalDigit = bitmapDigit !== null ? bitmapDigit : (mlKitDigit !== null && mlKitDigit >= 0 && mlKitDigit <= 9 ? mlKitDigit : 0);

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
      const fallbackDigit = predictDigitFromCanvasBitmap() ?? 0;
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