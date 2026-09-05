import { TICKS_PER_BEAT } from "./timing";
import type { PatternId } from "./types";

/** A single hit within a pattern's cycle: which chord-tone indexes to sound
 * (0 = root, 1 = third, 2 = fifth, 3 = seventh) at a given tick offset. Firing
 * more than one index at once (e.g. [0, 1, 2]) is a block-chord hit. */
export interface PatternStep {
  tick: number;
  toneIndexes: number[];
}

export interface PatternDefinition {
  id: PatternId;
  /** Length of one repetition of the pattern, in 16th-note ticks. The
   * scheduler runs a single global tick counter; patterns just wrap it with
   * `tick % cycleLength` to find their position. */
  cycleLength: number;
  steps: PatternStep[];
}

const BEAT = TICKS_PER_BEAT;

export const PATTERNS: Record<PatternId, PatternDefinition> = {
  block: {
    id: "block",
    // Re-strike the full chord on every beat.
    cycleLength: BEAT,
    steps: [{ tick: 0, toneIndexes: [0, 1, 2] }],
  },
  ballad: {
    id: "ballad",
    // The product spec's own example: root -> third -> fifth -> third, one
    // note per beat (e.g. C major: C -> E -> G -> E).
    cycleLength: BEAT * 4,
    steps: [
      { tick: 0 * BEAT, toneIndexes: [0] },
      { tick: 1 * BEAT, toneIndexes: [1] },
      { tick: 2 * BEAT, toneIndexes: [2] },
      { tick: 3 * BEAT, toneIndexes: [1] },
    ],
  },
  arpeggio: {
    id: "arpeggio",
    // Same broken-chord shape as ballad, twice as fast (8th notes instead of
    // quarter notes) — a more active, flowing feel from the same voicing.
    cycleLength: BEAT * 2,
    steps: [
      { tick: 0, toneIndexes: [0] },
      { tick: BEAT / 2, toneIndexes: [1] },
      { tick: BEAT, toneIndexes: [2] },
      { tick: (3 * BEAT) / 2, toneIndexes: [1] },
    ],
  },
  pop: {
    id: "pop",
    // A simple syncopated comp over one bar: chord on beat 1, then pushed
    // eighth-notes ahead of beats 2 and 3 — a common pop-piano rhythmic feel.
    cycleLength: BEAT * 4,
    steps: [
      { tick: 0, toneIndexes: [0, 1, 2] },
      { tick: 1 * BEAT + BEAT / 2, toneIndexes: [0, 1, 2] },
      { tick: 2 * BEAT + BEAT / 2, toneIndexes: [0, 1, 2] },
    ],
  },
};

/** Which chord-tone indexes (if any) should sound at this global tick. */
export function toneIndexesForTick(pattern: PatternDefinition, globalTick: number): number[] {
  const tickInCycle = globalTick % pattern.cycleLength;
  const step = pattern.steps.find((s) => s.tick === tickInCycle);
  return step ? step.toneIndexes : [];
}

/**
 * Resolves a pattern hit into actual notes to trigger, given a chord's
 * voiced note array (e.g. ["C4", "E4", "G4"]). Indexes beyond the chord's
 * note count are silently dropped, so a pattern referencing a seventh (index
 * 3) degrades gracefully on a plain triad instead of throwing.
 */
export function notesForTick(
  voicedNotes: string[],
  pattern: PatternDefinition,
  globalTick: number,
): string[] {
  return toneIndexesForTick(pattern, globalTick)
    .filter((index) => index < voicedNotes.length)
    .map((index) => voicedNotes[index]);
}
