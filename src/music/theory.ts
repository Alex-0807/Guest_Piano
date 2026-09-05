import type { ChordQuality, PitchClass, ScaleDegree } from "./types";

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/** Major keys whose conventional key signature uses flats (F, Bb, Eb, Ab, Db, Gb).
 * Everything else defaults to sharp spelling. This only affects display —
 * all chord math is done in pitch-class numbers. */
const FLAT_KEY_TONICS = new Set<PitchClass>([5, 10, 3, 8, 1, 6]);

export function keyPrefersFlats(tonic: PitchClass): boolean {
  return FLAT_KEY_TONICS.has(tonic);
}

export function pitchClassToName(pc: PitchClass, spelling: "sharp" | "flat"): string {
  const normalized = ((pc % 12) + 12) % 12;
  return spelling === "flat" ? NOTE_NAMES_FLAT[normalized] : NOTE_NAMES_SHARP[normalized];
}

/** A short list of common pop/rock major keys for the key selector UI.
 * Not exhaustive (no theoretical keys like C# major) since they're rare
 * in the pop repertoire this app targets. */
export const MAJOR_KEY_OPTIONS: { label: string; tonic: PitchClass }[] = [
  { label: "C", tonic: 0 },
  { label: "G", tonic: 7 },
  { label: "D", tonic: 2 },
  { label: "A", tonic: 9 },
  { label: "E", tonic: 4 },
  { label: "F", tonic: 5 },
  { label: "Bb", tonic: 10 },
  { label: "Eb", tonic: 3 },
  { label: "Ab", tonic: 8 },
];

/** Semitone offset of each scale degree from the tonic, major scale. */
export const MAJOR_SCALE_INTERVALS: Record<ScaleDegree, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

/** Default triad quality per scale degree in a major key (I ii iii IV V vi vii°). */
export const DEFAULT_TRIAD_QUALITY: Record<ScaleDegree, ChordQuality> = {
  1: "maj",
  2: "min",
  3: "min",
  4: "maj",
  5: "maj",
  6: "min",
  7: "dim",
};

/** Quality of the classic "modal mixture" borrowed chords: bIII, bVI, bVII
 * (degrees 3, 6, 7 with the flat modifier applied). These are borrowed from
 * the parallel natural minor scale, where they are always major triads —
 * e.g. in C major, Eb/Ab/Bb (not Ebm/Abm/Bbdim). Degrees 1, 2, 4, and 5 are
 * identical between major and natural minor, so "flat" has no standard
 * borrowed-chord meaning there; buildChord falls back to the plain diatonic
 * quality for those. */
export const FLAT_BORROWED_TRIAD_QUALITY: Partial<Record<ScaleDegree, ChordQuality>> = {
  3: "maj",
  6: "maj",
  7: "maj",
};

/** Diatonically-correct seventh chord per scale degree. vii° isn't covered by
 * the product spec's examples; m7b5 (half-diminished) is the standard
 * diatonic answer, kept here as a documented edge case. */
export const SEVENTH_QUALITY_BY_DEGREE: Record<ScaleDegree, ChordQuality> = {
  1: "maj7",
  2: "m7",
  3: "m7",
  4: "maj7",
  5: "dom7",
  6: "m7",
  7: "m7b5",
};

/** Pitch-class intervals stacked from the root for each chord quality. */
export const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
};

/** Suffix used when displaying a chord name, e.g. "F" + "m" = "Fm". */
export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  maj7: "maj7",
  m7: "m7",
  dom7: "7",
  m7b5: "m7b5",
};

export const ROMAN_NUMERAL_BY_DEGREE: Record<ScaleDegree, string> = {
  1: "I",
  2: "ii",
  3: "iii",
  4: "IV",
  5: "V",
  6: "vi",
  7: "vii°",
};
