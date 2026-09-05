import {
  DEFAULT_TRIAD_QUALITY,
  FLAT_BORROWED_TRIAD_QUALITY,
  keyPrefersFlats,
  MAJOR_SCALE_INTERVALS,
  mod12,
  pitchClassToName,
  QUALITY_INTERVALS,
  QUALITY_SUFFIX,
  SEVENTH_QUALITY_BY_DEGREE,
} from "./theory";
import type { Chord, ChordModifiers, ChordQuality, MusicalKey, ScaleDegree } from "./types";

function resolveQuality(degree: ScaleDegree, modifiers: ChordModifiers): ChordQuality {
  if (modifiers.seventh) {
    // A minor override on a seventh chord still needs to sound minor, so
    // fall back to the plain minor-seventh rather than the diatonic one
    // (e.g. IV7 is normally maj7, but IV+minor+7th should be m7, not maj7).
    // The flat+seventh combo isn't in the product spec's examples; it falls
    // back to the plain diatonic seventh for the (unflattened) degree.
    return modifiers.minorOverride ? "m7" : SEVENTH_QUALITY_BY_DEGREE[degree];
  }
  if (modifiers.minorOverride) return "min";
  if (modifiers.flat) return FLAT_BORROWED_TRIAD_QUALITY[degree] ?? DEFAULT_TRIAD_QUALITY[degree];
  return DEFAULT_TRIAD_QUALITY[degree];
}

/**
 * Builds a chord from a scale degree in the given key, applying the left-hand
 * modifiers (minor override, flat, seventh). This is pure music theory: no
 * octave/voicing decisions happen here (see voiceLeading.ts).
 */
export function buildChord(
  key: MusicalKey,
  degree: ScaleDegree,
  modifiers: ChordModifiers = {},
): Chord {
  const diatonicRoot = mod12(key.tonic + MAJOR_SCALE_INTERVALS[degree]);
  const root = modifiers.flat ? mod12(diatonicRoot - 1) : diatonicRoot;
  const quality = resolveQuality(degree, modifiers);

  // Borrowed/chromatic chords (flat modifier) are conventionally flat-spelled
  // regardless of the song key's own sharp/flat preference (e.g. VIIb in C
  // major is "Bb", not "A#"). Diatonic chords follow the key's convention.
  const spelling = modifiers.flat ? "flat" : keyPrefersFlats(key.tonic) ? "flat" : "sharp";

  return {
    degree,
    root,
    quality,
    intervals: QUALITY_INTERVALS[quality],
    spelling,
  };
}

/** Human-readable chord name for the HUD, e.g. "Fm", "Bb", "G7", "Cmaj7". */
export function chordName(chord: Chord): string {
  const rootName = pitchClassToName(chord.root, chord.spelling);
  return `${rootName}${QUALITY_SUFFIX[chord.quality]}`;
}
