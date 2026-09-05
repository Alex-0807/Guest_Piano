import { mod12, pitchClassToName } from "./theory";
import type { Chord, VoicedChord } from "./types";

const DEFAULT_OCTAVE = 4;

function absoluteSemitone(octave: number, pitchClass: number): number {
  return octave * 12 + pitchClass;
}

function noteNameFromAbsolute(absolute: number, spelling: "sharp" | "flat"): string {
  const octave = Math.floor(absolute / 12);
  const pitchClass = absolute - octave * 12;
  return `${pitchClassToName(pitchClass, spelling)}${octave}`;
}

const NOTE_NAME_PATTERN = /^([A-G])(#|b)?(-?\d+)$/;
const LETTER_PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseNoteToAbsolute(note: string): number {
  const match = NOTE_NAME_PATTERN.exec(note);
  if (!match) throw new Error(`Invalid note name: ${note}`);
  const [, letter, accidental, octaveStr] = match;
  let pitchClass = LETTER_PITCH_CLASS[letter];
  if (accidental === "#") pitchClass += 1;
  if (accidental === "b") pitchClass -= 1;
  return absoluteSemitone(Number(octaveStr), mod12(pitchClass));
}

/** The absolute pitch, among all octaves, of `pitchClass` closest to `reference`.
 * Checking the reference's own octave plus its neighbors is always enough: any
 * octave further away can only be a worse (or equal) match. */
function nearestAbsoluteForPitchClass(pitchClass: number, reference: number): number {
  const referenceOctave = Math.floor(reference / 12);
  let best = absoluteSemitone(referenceOctave, pitchClass);
  for (const octave of [referenceOctave - 1, referenceOctave + 1]) {
    const candidate = absoluteSemitone(octave, pitchClass);
    if (Math.abs(candidate - reference) < Math.abs(best - reference)) best = candidate;
  }
  return best;
}

/** Root-position voicing stacked ascending from a fixed octave — used when
 * there's no comparable previous voicing to lead from. */
function defaultVoicing(chord: Chord): string[] {
  const rootAbsolute = absoluteSemitone(DEFAULT_OCTAVE, chord.root);
  return chord.intervals.map((interval) =>
    noteNameFromAbsolute(rootAbsolute + interval, chord.spelling),
  );
}

/**
 * Assigns real, octave-numbered notes to a chord's abstract pitch-class
 * intervals, moving each voice as little as possible from the previous chord.
 *
 * Note on approach: `patterns.ts` addresses chord tones by harmonic role
 * (index 0 = root, 1 = third, 2 = fifth, 3 = seventh) so patterns like
 * "root -> third -> fifth -> third" keep meaning for any chord. That rules
 * out classical inversion (where a non-root tone becomes the lowest note,
 * changing what index 0 even means). Instead, each role is treated as its
 * own persistent "voice": the new chord's root goes wherever the octave
 * nearest the previous root is, and likewise for third/fifth/seventh. This
 * keeps common tones static and moves everything else by the smallest
 * possible interval — the same goal real voice leading has — without
 * disturbing the role-based indexing the rest of the engine depends on.
 * Voice crossing (e.g. the "third" ending up below the "root") isn't
 * explicitly prevented; in practice the movements involved are small enough
 * that it's rare and still sounds reasonable when it happens.
 */
export function voiceChord(chord: Chord, previousVoicing: string[] | null = null): VoicedChord {
  const pitchClasses = chord.intervals.map((interval) => mod12(chord.root + interval));

  // No previous voicing to lead from, or the chord gained/lost a voice (e.g.
  // a triad becoming a seventh chord) — fall back to a fresh root-position
  // voicing rather than trying to match up voices that don't correspond.
  if (!previousVoicing || previousVoicing.length !== pitchClasses.length) {
    return { ...chord, notes: defaultVoicing(chord) };
  }

  const notes = pitchClasses.map((pitchClass, voiceIndex) => {
    const previousAbsolute = parseNoteToAbsolute(previousVoicing[voiceIndex]);
    const nearest = nearestAbsoluteForPitchClass(pitchClass, previousAbsolute);
    return noteNameFromAbsolute(nearest, chord.spelling);
  });

  return { ...chord, notes };
}
