"use client";

import { useState } from "react";
import { loadPianoSampler, startAudioContext } from "@/audio/sampler";
import { setSchedulerBpm, startScheduler, stopScheduler } from "@/audio/scheduler";
import { useEngineStore } from "@/engine/engineStore";
import { chordName } from "@/music/chordEngine";

type AudioStatus = "idle" | "loading" | "ready";

/**
 * The real performance HUD: BPM and Play/Stop stay manual controls (per the
 * product spec — tempo isn't gesture-driven), but chord/pattern/dynamics are
 * now live readouts driven by hand gestures via useGestureController, not
 * buttons. This replaces the earlier SchedulerDebugPanel now that there's a
 * real gesture pipeline to show instead of clickable stand-ins for one.
 */
export default function PerformanceHud() {
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");

  const bpm = useEngineStore((s) => s.bpm);
  const isPlaying = useEngineStore((s) => s.isPlaying);
  const pattern = useEngineStore((s) => s.pattern);
  const dynamics = useEngineStore((s) => s.dynamics);
  const muted = useEngineStore((s) => s.muted);
  const currentChord = useEngineStore((s) => s.currentChord);
  const pendingChord = useEngineStore((s) => s.pendingChord);

  async function handleStartAudio() {
    setAudioStatus("loading");
    await startAudioContext();
    await loadPianoSampler();
    setAudioStatus("ready");
  }

  if (audioStatus !== "ready") {
    return (
      <button
        onClick={handleStartAudio}
        disabled={audioStatus === "loading"}
        className="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 disabled:opacity-50"
      >
        {audioStatus === "loading" ? "Loading piano samples..." : "Start Audio"}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          BPM
          <input
            type="number"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setSchedulerBpm(Number(e.target.value))}
            className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-50"
          />
        </label>
        <button
          onClick={() => (isPlaying ? stopScheduler() : startScheduler())}
          className="rounded-full bg-white px-4 py-2 font-medium text-zinc-950"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>

      <div className="flex items-center gap-10 text-center">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Current</div>
          <div className="text-4xl font-semibold">{currentChord ? chordName(currentChord) : "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Pending</div>
          <div className="text-2xl font-semibold text-zinc-400">
            {pendingChord ? chordName(pendingChord) : "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-zinc-400">
        <span>
          Pattern: <span className="capitalize text-zinc-50">{pattern}</span>
        </span>
        <span>
          Dynamics: <span className="text-zinc-50">{Math.round(dynamics * 100)}%</span>
        </span>
        {muted && <span className="font-medium text-amber-400">Muted</span>}
      </div>
    </div>
  );
}
