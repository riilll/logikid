'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from "@tensorflow/tfjs";
import { loadModel } from "@/lib/digitClassifier";

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
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Initialize canvas with solid black background and white strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with black background initially
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Brush styling (thick white lines)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 28; // Increased from 8 to 28 for correct MNIST scale
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Set up mouse coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate relative coordinates based on scale
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Set up touch coordinates relative to canvas
  const getTouchCoordinates = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  // ===== Mouse Drawing =====
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Auto-update developer preview on draw
    updatePreview();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // ===== Touch Drawing =====
  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    const { x, y } = getTouchCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    const { x, y } = getTouchCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Auto-update developer preview on draw
    updatePreview();
  };

  // ===== AI Preview (Resizing to 28x28) =====
  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const pCtx = previewCanvas.getContext('2d');
    if (!pCtx) return;

    // Clear preview
    pCtx.fillStyle = '#000000';
    pCtx.fillRect(0, 0, 28, 28);

    // Draw the main canvas onto the small 28x28 canvas
    pCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28);
  }, []);

  // ===== Clear Canvas =====
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with black instead of clearRect (keeps background black for AI inputs)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setPrediction(null);
    updatePreview();
  }, [updatePreview]);

  // ===== Predict =====
  const handlePredict = useCallback(async () => {
    setIsModelLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const model = await loadModel();

      // Extract and process image tensor
      const tensor = tf.tidy(() => {
        return tf.browser
          .fromPixels(canvas, 1) // 1 channel (grayscale)
          .resizeNearestNeighbor([28, 28])
          .toFloat()
          .div(255.0)
          .reshape([1, 28, 28, 1]); // 4D shape for Convolutional model input
      });

      const rawPrediction = model.predict(tensor) as tf.Tensor;
      const scores = rawPrediction.dataSync();
      console.log("Probabilitas AI:", Array.from(scores).map((s, i) => `${i}: ${s.toFixed(4)}`).join(', '));

      const predictedDigit = rawPrediction.argMax(1).dataSync()[0];

      setPrediction(predictedDigit);

      if (onPredict) {
        onPredict(predictedDigit);
      }

      tensor.dispose();
      rawPrediction.dispose();
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan prediksi angka");
    } finally {
      setIsModelLoading(false);
    }
  }, [onPredict]);

  // Expose clear and predict to parent via window if needed for global buttons
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
          onTouchStart={startTouch}
          onTouchMove={drawTouch}
          onTouchEnd={stopDrawing}
        />
        
        {/* Kid Friendly Drawing Hint overlay (only when blank) */}
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
            disabled={isModelLoading}
            type="button"
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
          >
            {isModelLoading ? "🤖 Berpikir..." : "🔍 Kirim Jawaban"}
          </button>
        </div>
      )}

      {/* Playful developer preview & result card */}
      <div className="flex items-center justify-between w-full bg-black/40 rounded-2xl p-3 border border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 bg-black border border-white/10 rounded-lg overflow-hidden flex-shrink-0">
            <canvas
              ref={previewCanvasRef}
              width={28}
              height={28}
              className="w-full h-full image-render-pixelated"
            />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Mata Robot AI</p>
            <p className="text-xs text-white/80 font-medium">Downsampled (28x28)</p>
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