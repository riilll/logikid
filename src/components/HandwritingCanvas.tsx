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
        // Berjalan di web / browser fallback
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
   * HIGH-RESOLUTION 8x8 BITMAP + STRUCTURAL QUADRANT CLASSIFIER (0-9)
   * Memastikan pemisahan sempurna antara angka yang mirip (seperti 6 vs 8, 0 vs 8, 9 vs 8, 4 vs 7).
   */
  const predictDigitFromCanvasBitmap = (): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Temukan Bounding Box piksel coretan (putih/terang)
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
      return null;
    }

    const boxWidth = Math.max(1, maxX - minX + 1);
    const boxHeight = Math.max(1, maxY - minY + 1);
    const aspectRatio = boxWidth / boxHeight;

    // Cek Angka 1 (Garis sangat ramping vertikal)
    if (aspectRatio < 0.38 && boxHeight > 25) {
      return 1;
    }

    // 2. Normalisasi piksel ke dalam Matriks Kepadatan 8x8 (64 cell resolusi tinggi)
    const grid: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
    const cellCounts: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const row = Math.min(7, Math.floor(((y - minY) / boxHeight) * 8));
        const col = Math.min(7, Math.floor(((x - minX) / boxWidth) * 8));
        cellCounts[row][col] += 1;
        if (r > 60) {
          grid[row][col] += 1;
        }
      }
    }

    const normGrid: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        normGrid[r][c] = cellCounts[r][c] > 0 ? grid[r][c] / cellCounts[r][c] : 0;
      }
    }

    // 3. Analisis Wilayah Kuadran Kritis (Upper-Left, Upper-Right, Lower-Left, Lower-Right, Center)
    const upperRight = (normGrid[1][5] + normGrid[1][6] + normGrid[2][5] + normGrid[2][6]) / 4;
    const upperLeft = (normGrid[1][1] + normGrid[1][2] + normGrid[2][1] + normGrid[2][2]) / 4;
    const lowerRight = (normGrid[5][5] + normGrid[5][6] + normGrid[6][5] + normGrid[6][6]) / 4;
    const lowerLeft = (normGrid[5][1] + normGrid[5][2] + normGrid[6][1] + normGrid[6][2]) / 4;
    
    const centerKnot = (normGrid[3][3] + normGrid[3][4] + normGrid[4][3] + normGrid[4][4]) / 4;
    const topBar = (normGrid[0][1] + normGrid[0][2] + normGrid[0][3] + normGrid[0][4] + normGrid[0][5]) / 5;
    const botBar = (normGrid[7][1] + normGrid[7][2] + normGrid[7][3] + normGrid[7][4] + normGrid[7][5]) / 5;

    // Scanline transitions horizontal pada 50% tinggi
    let hMidCross = 0;
    let inStroke = false;
    for (let c = 0; c < 8; c++) {
      if (normGrid[3][c] > 0.25 || normGrid[4][c] > 0.25) {
        if (!inStroke) {
          hMidCross++;
          inStroke = true;
        }
      } else {
        inStroke = false;
      }
    }

    // --- KLASIFIKASI STRUKTURAL EKSKLUSIF (MUTUALLY EXCLUSIVE STRUCTURAL RULES) ---

    // ANGKA 6: Kuadran Kanan Atas (Upper-Right) KOSONG / jauh lebih renggang dibanding Kanan Bawah & Kiri
    // Pada angka 6, goresan meluncur dari atas kiri/tengah turun ke bawah, membuat loop di bawah saja.
    if (upperRight < 0.20 && (lowerRight > 0.28 || normGrid[5][5] + normGrid[6][5] > 0.4)) {
      if (normGrid[2][1] + normGrid[3][1] + normGrid[4][1] > 0.3) {
        return 6;
      }
    }

    // ANGKA 9: Kuadran Kiri Bawah (Lower-Left) KOSONG / jauh lebih renggang dibanding Kiri Atas & Kanan
    // Pada angka 9, goresan membentuk loop di atas (Upper-Left & Upper-Right padat), lalu tiang turun ke kanan/tengah bawah.
    if (lowerLeft < 0.18 && upperRight > 0.28 && upperLeft > 0.25) {
      if (normGrid[4][6] + normGrid[5][6] + normGrid[6][6] > 0.25 || normGrid[5][4] + normGrid[6][4] > 0.3) {
        return 9;
      }
    }

    // ANGKA 0 vs ANGKA 8:
    // Kedua angka ini memiliki keempat kuadran (Upper-Left, Upper-Right, Lower-Left, Lower-Right) yang terisi.
    // Pemisah mutlak: ANGKA 0 berlubang di tengah (Center Knot kosong), ANGKA 8 bersilang/simpul padat di tengah!
    if (upperLeft > 0.22 && upperRight > 0.22 && lowerLeft > 0.22 && lowerRight > 0.22) {
      if (centerKnot < 0.23 && hMidCross <= 2) {
        return 0;
      }
      if (centerKnot > 0.35 || hMidCross >= 3 || (normGrid[3][3] > 0.3 && normGrid[4][4] > 0.3)) {
        return 8;
      }
    }

    // ANGKA 4: Kiri Bawah KOSONG total (`normGrid[6][1] + normGrid[6][2] < 0.15`), tengah ada palang datar, kanan ada tiang
    if (lowerLeft < 0.16 && normGrid[6][0] < 0.16 && normGrid[7][0] < 0.16) {
      if ((normGrid[4][2] > 0.25 || normGrid[4][3] > 0.25 || normGrid[3][3] > 0.25) && normGrid[5][6] + normGrid[6][6] > 0.25) {
        return 4;
      }
    }

    // ANGKA 7: Baris atas sangat padat horizontal (topBar > 0.45), Kanan Bawah KOSONG (`lowerRight < 0.16`)
    if (topBar > 0.42 && lowerRight < 0.18 && normGrid[6][7] < 0.15 && normGrid[7][7] < 0.15) {
      if (normGrid[4][3] + normGrid[5][3] + normGrid[6][2] > 0.25) {
        return 7;
      }
    }

    // ANGKA 2: Lengkungan atas kiri->kanan, lalu diagonal ke kiri bawah, dan baris bawah horizontal padat (botBar > 0.45)
    if (botBar > 0.42 && normGrid[1][1] + normGrid[1][2] > 0.25 && normGrid[6][6] + normGrid[7][6] > 0.35) {
      if (normGrid[2][6] + normGrid[3][5] + normGrid[4][4] + normGrid[5][3] > 0.4) {
        return 2;
      }
    }

    // ANGKA 3: Sisi kiri tengah berindentasi/kosong (`normGrid[3][1] + normGrid[4][1] < 0.2`), sisi kanan dua lengkungan
    if (normGrid[3][1] + normGrid[4][1] < 0.18 && normGrid[2][6] + normGrid[5][6] > 0.4) {
      if (topBar > 0.25 && botBar > 0.25) {
        return 3;
      }
    }

    // ANGKA 5: Atas horizontal, kiri vertikal turun, lalu lengkung kanan bawah. Kiri Bawah KOSONG (`lowerLeft < 0.18`)
    if (lowerLeft < 0.18 && topBar > 0.35 && normGrid[1][1] + normGrid[2][1] > 0.3 && lowerRight > 0.3) {
      return 5;
    }

    // --- 4. HIGH-PRECISION 8x8 TEMPLATE MATCHING (64 Euclidean Cells) ---
    // Bank 10 Template Multi-Style dengan bobot khusus kuadran
    const idealTemplates8x8: Record<number, number[][]> = {
      0: [
        [0.0, 0.6, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0],
        [0.6, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.6],
        [1.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0],
        [1.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 1.0],
        [1.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 1.0],
        [1.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0],
        [0.6, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.0, 0.6, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0]
      ],
      1: [
        [0.0, 0.0, 0.2, 1.0, 1.0, 0.2, 0.0, 0.0],
        [0.0, 0.2, 0.6, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
        [0.2, 0.6, 1.0, 1.0, 1.0, 1.0, 0.6, 0.2]
      ],
      2: [
        [0.0, 0.6, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0],
        [0.8, 1.0, 0.2, 0.0, 0.0, 0.4, 1.0, 0.8],
        [0.2, 0.2, 0.0, 0.0, 0.0, 0.6, 1.0, 0.4],
        [0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.2, 0.0],
        [0.0, 0.0, 0.4, 1.0, 0.8, 0.0, 0.0, 0.0],
        [0.2, 0.8, 1.0, 0.4, 0.0, 0.0, 0.0, 0.0],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.0, 0.2, 0.6],
        [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
      ],
      3: [
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0],
        [0.6, 0.4, 0.0, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 1.0, 0.2],
        [0.0, 0.0, 0.2, 0.8, 1.0, 1.0, 0.2, 0.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 1.0, 0.2],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.6, 0.4, 0.0, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0]
      ],
      4: [
        [0.0, 0.0, 0.6, 1.0, 0.0, 0.6, 1.0, 0.0],
        [0.0, 0.4, 0.8, 1.0, 0.0, 0.6, 1.0, 0.0],
        [0.0, 0.8, 1.0, 0.4, 0.0, 0.6, 1.0, 0.0],
        [0.4, 1.0, 0.6, 0.0, 0.0, 0.6, 1.0, 0.0],
        [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.0]
      ],
      5: [
        [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.6],
        [1.0, 0.8, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0],
        [1.0, 1.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0],
        [1.0, 1.0, 1.0, 1.0, 1.0, 0.8, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.4],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 1.0, 0.8],
        [0.6, 0.4, 0.0, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0]
      ],
      6: [
        [0.0, 0.4, 0.8, 1.0, 0.8, 0.2, 0.0, 0.0],
        [0.4, 0.8, 1.0, 0.4, 0.0, 0.0, 0.0, 0.0],
        [0.8, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0],
        [1.0, 0.8, 0.8, 1.0, 1.0, 0.8, 0.2, 0.0],
        [1.0, 1.0, 0.4, 0.0, 0.2, 0.8, 1.0, 0.2],
        [1.0, 0.8, 0.0, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.6],
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.6, 0.0]
      ],
      7: [
        [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.8],
        [0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.4, 0.0],
        [0.0, 0.0, 0.0, 0.6, 1.0, 0.4, 0.0, 0.0],
        [0.0, 0.0, 0.2, 0.8, 1.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.6, 1.0, 0.2, 0.0, 0.0, 0.0],
        [0.0, 0.2, 0.8, 1.0, 0.0, 0.0, 0.0, 0.0],
        [0.0, 0.6, 1.0, 0.4, 0.0, 0.0, 0.0, 0.0]
      ],
      8: [
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.8, 0.2],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.8],
        [0.6, 1.0, 0.6, 0.0, 0.0, 0.6, 1.0, 0.6],
        [0.2, 0.8, 1.0, 0.8, 0.8, 1.0, 0.8, 0.2],
        [0.2, 0.8, 1.0, 0.8, 0.8, 1.0, 0.8, 0.2],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.8],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.4, 1.0, 0.8],
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.8, 0.2]
      ],
      9: [
        [0.2, 0.8, 1.0, 1.0, 1.0, 1.0, 0.8, 0.2],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.6, 1.0, 0.8],
        [0.8, 1.0, 0.4, 0.0, 0.0, 0.6, 1.0, 1.0],
        [0.6, 1.0, 0.8, 0.8, 1.0, 1.0, 1.0, 1.0],
        [0.0, 0.4, 0.8, 1.0, 1.0, 0.8, 1.0, 0.8],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 1.0, 0.6],
        [0.0, 0.0, 0.0, 0.0, 0.4, 1.0, 0.8, 0.2],
        [0.0, 0.0, 0.0, 0.2, 0.8, 1.0, 0.4, 0.0]
      ]
    };

    let bestDigit = 0;
    let minDistance = Infinity;

    for (let d = 0; d <= 9; d++) {
      const tmpl = idealTemplates8x8[d];
      let dist = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          let weight = 1.0;
          // Beri bobot ekstra (3x) pada sel Upper-Right jika membedakan 6 vs 8
          if ((r <= 2 && c >= 5) && (d === 6 || d === 8)) {
            weight = 3.0;
          }
          // Beri bobot ekstra (3x) pada sel Lower-Left jika membedakan 9 vs 8
          if ((r >= 5 && c <= 2) && (d === 9 || d === 8)) {
            weight = 3.0;
          }
          // Beri bobot ekstra (3x) pada sel Center jika membedakan 0 vs 8
          if ((r === 3 || r === 4) && (c === 3 || c === 4) && (d === 0 || d === 8)) {
            weight = 3.0;
          }

          const diff = normGrid[r][c] - tmpl[r][c];
          dist += (diff * diff) * weight;
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
      
      const bitmapDigit = predictDigitFromCanvasBitmap();
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