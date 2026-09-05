import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { extendedFingers, verticalPosition } from "./landmarks";
import type { PatternId } from "@/music/types";

const PATTERN_BY_FINGER_COUNT: Record<number, PatternId> = {
  1: "block",
  2: "arpeggio",
  3: "ballad",
  4: "pop",
};

export interface RightHandGesture {
  pattern: PatternId | null;
  muted: boolean;
  seventh: boolean;
  /** 0 (bottom of frame) to 1 (top of frame), raw and unsmoothed — smoothing
   * belongs to the stabilizer, not the classifier (see stabilizer.ts). */
  verticalPosition: number;
}

/**
 * Classifies the right hand into a performance pattern plus modifiers.
 *
 * Pattern comes from how many of the four NON-thumb fingers are extended
 * (0 = fist/mute, 1-4 = block/arpeggio/ballad/pop) — the thumb is
 * deliberately left out of that count, which frees it up as an independent,
 * always-available binary signal for the seventh modifier.
 *
 * This is a deviation from the original plan of mirroring the left hand's
 * tilt-based modifiers here too (a forward/backward tilt using MediaPipe's
 * z/depth axis). Depth estimates from a single camera are noticeably noisier
 * than x/y in practice, and the seventh modifier needs to be a clean binary
 * signal — so the thumb toggle was chosen instead once it became clear the
 * pattern-count scheme didn't need the thumb anyway.
 */
export function classifyRightHand(landmarks: NormalizedLandmark[]): RightHandGesture {
  const fingers = extendedFingers(landmarks);
  const count = [fingers.index, fingers.middle, fingers.ring, fingers.pinky].filter(
    Boolean,
  ).length;

  return {
    pattern: PATTERN_BY_FINGER_COUNT[count] ?? null,
    muted: count === 0,
    seventh: fingers.thumb,
    verticalPosition: verticalPosition(landmarks),
  };
}
