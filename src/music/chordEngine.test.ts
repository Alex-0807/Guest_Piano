import { describe, expect, it } from "vitest";
import { buildChord, chordName } from "./chordEngine";
import type { MusicalKey } from "./types";

const C_MAJOR: MusicalKey = { tonic: 0, mode: "major" };

describe("buildChord in C major (diatonic defaults)", () => {
  it.each([
    [1, "C"],
    [2, "Dm"],
    [3, "Em"],
    [4, "F"],
    [5, "G"],
    [6, "Am"],
    [7, "Bdim"],
  ] as const)("degree %i -> %s", (degree, expected) => {
    expect(chordName(buildChord(C_MAJOR, degree))).toBe(expected);
  });
});

describe("minor override", () => {
  it("IV + minor override -> Fm (borrowed chord)", () => {
    const chord = buildChord(C_MAJOR, 4, { minorOverride: true });
    expect(chordName(chord)).toBe("Fm");
  });
});

describe("flat modifier", () => {
  it.each([
    [7, "Bb"],
    [6, "Ab"],
    [3, "Eb"],
  ] as const)("degree %i + flat -> %s", (degree, expected) => {
    expect(chordName(buildChord(C_MAJOR, degree, { flat: true }))).toBe(expected);
  });
});

describe("seventh modifier", () => {
  it.each([
    [1, "Cmaj7"],
    [2, "Dm7"],
    [4, "Fmaj7"],
    [5, "G7"],
    [6, "Am7"],
  ] as const)("degree %i + 7th -> %s", (degree, expected) => {
    expect(chordName(buildChord(C_MAJOR, degree, { seventh: true }))).toBe(expected);
  });
});

describe("in a flat-key signature (F major)", () => {
  const F_MAJOR: MusicalKey = { tonic: 5, mode: "major" };

  it("spells the diatonic IV as Bb, not A#", () => {
    expect(chordName(buildChord(F_MAJOR, 4))).toBe("Bb");
  });
});
