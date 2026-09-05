import { create } from "zustand";
import type { Chord, PatternId } from "@/music/types";

/**
 * The single source of truth for "live" playback state. React components
 * subscribe to this via the `useEngineStore` hook; the scheduler (a plain
 * Tone.js module, no React) reads and writes it via `useEngineStore.getState()`
 * / `.setState()`. Neither side depends on the other directly — this store is
 * the seam between them.
 *
 * `currentChord` only ever changes inside the scheduler's beat callback
 * (see audio/scheduler.ts) — never as a direct reaction to `setPendingChord`.
 * That's what makes chord changes beat-quantized instead of instant.
 */
interface EngineState {
  bpm: number;
  pattern: PatternId;
  /** 0-1, scales note velocity. */
  dynamics: number;
  muted: boolean;
  isPlaying: boolean;

  currentChord: Chord | null;
  pendingChord: Chord | null;
  /** The actual notes (e.g. ["C4", "E4", "G4"]) for currentChord, already voiced. */
  currentVoicing: string[] | null;

  setBpm: (bpm: number) => void;
  setPattern: (pattern: PatternId) => void;
  setDynamics: (dynamics: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaying: (isPlaying: boolean) => void;
  /** Called by gesture input / debug UI. Never touches currentChord directly. */
  setPendingChord: (chord: Chord) => void;
  /** Called only by the scheduler's beat callback. */
  promotePendingChord: (voicing: string[]) => void;
}

export const useEngineStore = create<EngineState>((set) => ({
  bpm: 90,
  pattern: "block",
  dynamics: 0.8,
  muted: false,
  isPlaying: false,

  currentChord: null,
  pendingChord: null,
  currentVoicing: null,

  setBpm: (bpm) => set({ bpm }),
  setPattern: (pattern) => set({ pattern }),
  setDynamics: (dynamics) => set({ dynamics }),
  setMuted: (muted) => set({ muted }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPendingChord: (chord) => set({ pendingChord: chord }),
  promotePendingChord: (voicing) =>
    set((state) => ({
      currentChord: state.pendingChord,
      pendingChord: null,
      currentVoicing: voicing,
    })),
}));
