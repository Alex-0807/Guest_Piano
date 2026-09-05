"use client";

import dynamic from "next/dynamic";

// Tone.js and MediaPipe both touch browser-only APIs at module load, which
// don't exist during server-side rendering — load these client-only.
const SchedulerDebugPanel = dynamic(() => import("@/components/SchedulerDebugPanel"), {
  ssr: false,
});
const WebcamView = dynamic(() => import("@/components/WebcamView"), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 text-zinc-50 py-8">
      <h1 className="text-2xl font-semibold">Gesture Piano Accompanist</h1>
      <p className="text-zinc-400">Step 7: camera + hand-landmark sanity check.</p>
      <WebcamView />
      <SchedulerDebugPanel />
    </main>
  );
}
