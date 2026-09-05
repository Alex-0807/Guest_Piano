"use client";

import { useState } from "react";
import { loadPianoSampler, startAudioContext } from "@/audio/sampler";
import { setSchedulerBpm, startScheduler, stopScheduler } from "@/audio/scheduler";
import { useEngineStore } from "@/engine/engineStore";
import { buildChord, chordName } from "@/music/chordEngine";
import { ROMAN_NUMERAL_BY_DEGREE } from "@/music/theory";
import type { MusicalKey, PatternId, ScaleDegree } from "@/music/types";

// Temporary manual controls to prove the scheduler's beat-quantized chord
// switching works end-to-end before gestures exist. The key is fixed to C
// major here since key selection is a later UI concern (see KeySelector).
const DEBUG_KEY: MusicalKey = { tonic: 0, mode: "major" };
const DEGREES: ScaleDegree[] = [1, 2, 3, 4, 5, 6, 7];
const PATTERN_IDS: PatternId[] = ["block", "arpeggio", "ballad", "pop"];

type AudioStatus = "idle" | "loading" | "ready";

export default function SchedulerDebugPanel() {
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");

  const bpm = useEngineStore((s) => s.bpm);
  const isPlaying = useEngineStore((s) => s.isPlaying);
  const pattern = useEngineStore((s) => s.pattern);
  const currentChord = useEngineStore((s) => s.currentChord);
  const pendingChord = useEngineStore((s) => s.pendingChord);
  const setPattern = useEngineStore((s) => s.setPattern);
  const setPendingChord = useEngineStore((s) => s.setPendingChord);

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

      <div className="flex gap-2">
        {DEGREES.map((degree) => (
          <button
            key={degree}
            onClick={() => setPendingChord(buildChord(DEBUG_KEY, degree))}
            className="rounded-full border border-zinc-600 px-3 py-2 hover:bg-zinc-800"
          >
            {ROMAN_NUMERAL_BY_DEGREE[degree]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {PATTERN_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setPattern(id)}
            className={`rounded-full border px-3 py-2 capitalize ${
              pattern === id ? "border-white bg-zinc-800" : "border-zinc-600"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="flex gap-10 text-center">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Current</div>
          <div className="text-2xl font-semibold">
            {currentChord ? chordName(currentChord) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Pending</div>
          <div className="text-2xl font-semibold text-zinc-400">
            {pendingChord ? chordName(pendingChord) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
