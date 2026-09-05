/** Semitone 0-11, 0 = C. Using numbers (not note-name strings) as the
 * source of truth avoids sharp/flat ambiguity in all the arithmetic below;
 * note names are only derived for display, in `theory.ts`. */
export type PitchClass = number;

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** MVP supports major keys only. Minor keys need a second interval table
 * and default-quality table (see theory.ts) but no change to this shape. */
export type Mode = "major";

export interface MusicalKey {
  tonic: PitchClass;
  mode: Mode;
}

export type ChordQuality = "maj" | "min" | "dim" | "maj7" | "m7" | "dom7" | "m7b5";

export type PatternId = "block" | "arpeggio" | "ballad" | "pop";

export interface ChordModifiers {
  /** Forces the triad/seventh to a minor quality, for borrowed chords like IV -> Fm. */
  minorOverride?: boolean;
  /** Lowers the root a semitone, for borrowed chords like VII -> Bb. */
  flat?: boolean;
  /** Extends the triad to the diatonically-correct seventh chord. */
  seventh?: boolean;
}

export interface Chord {
  degree: ScaleDegree;
  root: PitchClass;
  quality: ChordQuality;
  /** Pitch-class intervals stacked from the root, e.g. [0, 4, 7] for a major triad. */
  intervals: number[];
  /** Which accidental spelling to use when this chord's root is displayed or
   * turned into a note name. Set once at construction so display stays
   * consistent regardless of how the root's pitch class happens to be spelled
   * elsewhere. */
  spelling: "sharp" | "flat";
}

/** A Chord with real, octave-assigned notes ready to hand to the sampler,
 * e.g. ["C4", "E4", "G4"]. Produced by voiceLeading.ts, not chordEngine.ts. */
export interface VoicedChord extends Chord {
  notes: string[];
}
