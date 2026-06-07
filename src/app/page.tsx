'use client';

import React, { useRef, useEffect, useState } from 'react';

export default function HandwritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // TAMBAHAN 1: State untuk mengingat apakah mouse sedang ditekan atau tidak
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#FFFFFF'; // Warna tinta putih
    ctx.lineWidth = 8;           // Ketebalan tinta
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';      // Biar belokan garis tidak patah-patah
  }, []);

  // --- TAMBAHAN 2: LOGIKA MOUSE ---
  
  // Fungsi 1: Saat klik kiri mouse mulai ditekan
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Menghitung koordinat presisi ujung kursor
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true); // Ganti status jadi "sedang menggambar"
  };

  // Fungsi 2: Saat mouse digeser (ditahan)
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return; // Kalau mouse cuma lewat (tidak ditekan), jangan coret
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke(); // Munculkan tintanya
  };

  // Fungsi 3: Saat klik kiri mouse dilepas
  const stopDrawing = () => {
    setIsDrawing(false); // Berhenti menggambar
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-xl w-fit">
      <span className="text-sm font-medium text-gray-400">Area Uji Coba Kanvas:</span>
      
      <canvas
        ref={canvasRef}
        width={280}  
        height={280} 
        className="border-2 border-dashed border-gray-600 bg-black rounded-lg cursor-crosshair touch-none"
        
        // TAMBAHAN 3: Memasang sensor mouse ke kanvas HTML
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing} // Otomatis berhenti kalau kursor keluar dari kotak
      />
    </div>
  );
}