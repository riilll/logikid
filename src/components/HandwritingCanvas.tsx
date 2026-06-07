'use client';

import React, { useRef, useEffect } from 'react';

export default function HandwritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round'; 
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-xl w-fit">
      <span className="text-sm font-medium text-gray-400">Area Uji Coba Kanvas:</span>
      
      <canvas
        ref={canvasRef}
        width={280}  
        height={280} 
        className="border-2 border-dashed border-gray-600 bg-black rounded-lg cursor-crosshair touch-none"
      />
    </div>
  );
}