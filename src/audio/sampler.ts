import * as Tone from "tone";

const SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/";

/**
 * Minor-third-spaced recordings (A, C, D#, F# repeating) from A0 to C8.
 * Tone.Sampler pitch-shifts between these to cover the full keyboard, so we
 * don't need a recorded sample for every one of the 88 keys — a standard
 * technique for keeping sample-based instruments lightweight to load.
 */
const SAMPLE_URLS: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
};

let sampler: Tone.Sampler | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Unlocks the browser's audio context. Must be called from inside a user
 * gesture handler (e.g. a button click) — browsers block audio until then.
 */
export async function startAudioContext(): Promise<void> {
  await Tone.start();
}

/** Loads the piano sampler. Safe to call multiple times; only loads once. */
export function loadPianoSampler(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: SAMPLE_BASE_URL,
      onload: () => resolve(),
    }).toDestination();
  });

  return loadPromise;
}

/**
 * Triggers a single note. `time` should be a Tone.js transport-relative time
 * when called from a scheduled callback (see scheduler.ts) so playback stays
 * sample-accurate instead of drifting with `setTimeout`/`Date.now()` jitter.
 *
 * `velocity` (0-1) scales this note's gain. Note: this sample set has only
 * one recorded velocity layer per pitch, so "softer/louder" here means gain
 * scaling, not switching to a different, more percussively-recorded sample —
 * a real limitation of using a free sample set, not a bug.
 */
export function triggerNote(note: string, time?: Tone.Unit.Time, velocity = 0.8): void {
  if (!sampler) {
    throw new Error("Piano sampler not loaded yet — call loadPianoSampler() first");
  }
  sampler.triggerAttack(note, time, velocity);
}
