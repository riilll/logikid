"use client";

import { useEffect } from "react";
import HandwritingCanvas from "@/components/HandwritingCanvas";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useEffect(() => {
    const testConnection = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*");

    console.log("DATA:", data);

    if (error) {
      console.error("ERROR:", error);
    }
  };

  testConnection();
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