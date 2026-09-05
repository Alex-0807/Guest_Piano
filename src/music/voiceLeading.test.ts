import { describe, expect, it } from "vitest";
import { buildChord } from "./chordEngine";
import { voiceChord } from "./voiceLeading";
import type { MusicalKey } from "./types";

const C_MAJOR: MusicalKey = { tonic: 0, mode: "major" };

describe("first chord (no previous voicing)", () => {
  it("stacks a C major triad ascending from a fixed octave", () => {
    const voiced = voiceChord(buildChord(C_MAJOR, 1));
    expect(voiced.notes).toEqual(["C4", "E4", "G4"]);
  });

  it("stacks a seventh chord ascending, including the seventh", () => {
    const voiced = voiceChord(buildChord(C_MAJOR, 5, { seventh: true }));
    expect(voiced.notes).toEqual(["G4", "B4", "D5", "F5"]);
  });
});

describe("voice leading between chords", () => {
  it("holds common tones and moves the third by a semitone for a minor override (F -> Fm)", () => {
    const fMajor = voiceChord(buildChord(C_MAJOR, 4));
    expect(fMajor.notes).toEqual(["F4", "A4", "C5"]);

    const fMinor = voiceChord(buildChord(C_MAJOR, 4, { minorOverride: true }), fMajor.notes);
    // Root and fifth are common tones and should stay put; only the third
    // moves, by a single semitone (A4 -> G#4) — exactly what a real pianist
    // would play when a chord suddenly borrows its minor third. G#4 is
    // enharmonically identical to Ab4 (same pitch, Tone.js plays it
    // identically either way); chordEngine's spelling logic is keyed off the
    // chord's root, not its quality, so it doesn't yet flat-spell a minor
    // chord's third. Worth revisiting if voicings ever get displayed
    // note-by-note, but invisible today.
    expect(fMinor.notes).toEqual(["F4", "G#4", "C5"]);
  });

  it("moves each voice less than naively re-stacking the new chord from scratch would", () => {
    const cMajor = voiceChord(buildChord(C_MAJOR, 1));
    const gMajor = voiceChord(buildChord(C_MAJOR, 5), cMajor.notes);

    const totalMovement = (a: string[], b: string[]) =>
      a.reduce((sum, note, i) => sum + Math.abs(semitoneOf(note) - semitoneOf(b[i])), 0);

    const naiveGMajor = ["G4", "B4", "D5"]; // root-position, stacked from octave 4
    expect(totalMovement(cMajor.notes, gMajor.notes)).toBeLessThan(
      totalMovement(cMajor.notes, naiveGMajor),
    );
    expect(gMajor.notes).toEqual(["G3", "B3", "D4"]);
  });

  it("falls back to a fresh root-position voicing when the voice count changes (triad -> seventh)", () => {
    const cMajor = voiceChord(buildChord(C_MAJOR, 1));
    const cMaj7 = voiceChord(buildChord(C_MAJOR, 1, { seventh: true }), cMajor.notes);
    expect(cMaj7.notes).toEqual(["C4", "E4", "G4", "B4"]);
  });
});

function semitoneOf(note: string): number {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(note);
  if (!match) throw new Error(`bad note ${note}`);
  const letterPc: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = letterPc[match[1]];
  if (match[2] === "#") pc += 1;
  if (match[2] === "b") pc -= 1;
  return Number(match[3]) * 12 + pc;
}
