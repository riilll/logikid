'use client';

import React, { useRef, useEffect, useState } from 'react';

export default function HandwritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // --- FUNGSI MOUSE (PC) ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true); 
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return; 
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke(); 
  };

  const stopDrawing = () => setIsDrawing(false); 

  // --- FUNGSI TOUCH (HP/TABLET) ---
  const startTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault(); // Mencegah layar HP ikut tergulung (scroll) saat menggambar
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
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
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  // --- FUNGSI HAPUS (CLEAR) ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Menghapus seluruh area kanvas dari kordinat 0,0 sampai ujung
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 rounded-2xl shadow-xl w-fit">
      
      <canvas
        ref={canvasRef}
        width={280}  
        height={280} 
        className="border-2 border-dashed border-gray-500 bg-black rounded-xl cursor-crosshair touch-none"
        
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        
        // Sensor untuk layar sentuh HP
        onTouchStart={startTouch}
        onTouchMove={drawTouch}
        onTouchEnd={stopDrawing}
      />

      {/* Tombol Hapus */}
      <button
        onClick={clearCanvas}
        className="w-full py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-lg transition-all"
      >
        Hapus Coretan
      </button>
      
    </div>
  );
}