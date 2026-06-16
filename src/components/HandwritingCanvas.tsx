'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import { loadModel } from "@/lib/digitClassifier";

export default function HandwritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // ===== Mouse =====
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );

    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // ===== Touch =====
  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    ctx.beginPath();

    ctx.moveTo(
      touch.clientX - rect.left,
      touch.clientY - rect.top
    );

    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    ctx.lineTo(
      touch.clientX - rect.left,
      touch.clientY - rect.top
    );

    ctx.stroke();
  };

  // ===== Clear =====
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    setPrediction(null);
  };

  // ===== Predict =====
  const handlePredict = async () => {
  try {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const model = await loadModel();

    const tensor = tf.tidy(() => {
      return tf.browser
        .fromPixels(canvas, 1)
        .resizeNearestNeighbor([28, 28])
        .toFloat()
        .div(255.0)
        .reshape([1, 784]);   // ← INI BEDANYA
    });

    const prediction = model.predict(tensor) as tf.Tensor;
    console.log(prediction.dataSync());

    const predictedDigit = prediction.argMax(1).dataSync()[0];

    setPrediction(predictedDigit);

    tensor.dispose();
    prediction.dispose();
  } catch (error) {
    console.error(error);
    alert("Gagal melakukan prediksi");
  }
};

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 rounded-2xl shadow-xl w-fit">

      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border-2 border-dashed border-gray-500 bg-black rounded-xl cursor-crosshair touch-none"

        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}

        onTouchStart={startTouch}
        onTouchMove={drawTouch}
        onTouchEnd={stopDrawing}
      />

      <button
        onClick={clearCanvas}
        className="w-full py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-lg transition-all"
      >
        Hapus Coretan
      </button>

      <button
        onClick={handlePredict}
        className="w-full py-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold rounded-lg transition-all"
      >
        Prediksi
      </button>

      {prediction !== null && (
        <p className="text-white text-xl font-bold">
          Prediksi: {prediction}
        </p>
      )}
    </div>
  );
}