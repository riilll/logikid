"use client";

import { useEffect } from "react";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import { loadModel } from "@/lib/digitClassifier";

export default function Home() {
  useEffect(() => {
    loadModel();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <h1 className="text-2xl font-bold text-white mb-6">
        Uji Coba LogiKid
      </h1>

      <HandwritingCanvas />
    </main>
  );
}