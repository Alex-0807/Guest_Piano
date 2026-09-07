"use client";

import dynamic from "next/dynamic";
import { useGestureController } from "@/engine/useGestureController";
import type { MusicalKey } from "@/music/types";

// Tone.js and MediaPipe both touch browser-only APIs at module load, which
// don't exist during server-side rendering — load these client-only.
const PerformanceHud = dynamic(() => import("@/components/PerformanceHud"), {
  ssr: false,
});
const WebcamView = dynamic(() => import("@/components/WebcamView"), {
  ssr: false,
});

// Key selection is a later UI concern (see KeySelector, not built yet) —
// hardcoded to C major for now, matching every debug step so far.
const KEY: MusicalKey = { tonic: 0, mode: "major" };

export default function Home() {
  const handleFrame = useGestureController(KEY);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 py-8 text-zinc-50">
      <h1 className="text-2xl font-semibold">Gesture Piano Accompanist</h1>
      <p className="text-zinc-400">.</p>
      <WebcamView onFrame={handleFrame} />
      <PerformanceHud />
    </main>
  );
}
