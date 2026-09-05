import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { extendedFingers, tiltAngleDegrees, type ExtendedFingers } from "./landmarks";
import type { ScaleDegree } from "@/music/types";

const TILT_THRESHOLD_DEGREES = 25;

export interface LeftHandGesture {
  degree: ScaleDegree | null;
  minorOverride: boolean;
  flat: boolean;
}

/**
 * Canonical extended-finger shape for each scale degree. I-V are simple
 * finger counting (thumb joins in at V). vi and vii° deliberately use finger
 * SETS that don't overlap any 1-5 count — e.g. vi ("shaka": thumb + pinky)
 * has exactly 2 fingers extended, same as ii, but a completely different
 * set — so a hand mid-transition between shapes can't land on a valid but
 * wrong degree; it just fails to match anything until it settles.
 */
const DEGREE_SHAPES: { degree: ScaleDegree; shape: ExtendedFingers }[] = [
  { degree: 1, shape: { thumb: false, index: true, middle: false, ring: false, pinky: false } },
  { degree: 2, shape: { thumb: false, index: true, middle: true, ring: false, pinky: false } },
  { degree: 3, shape: { thumb: false, index: true, middle: true, ring: true, pinky: false } },
  { degree: 4, shape: { thumb: false, index: true, middle: true, ring: true, pinky: true } },
  { degree: 5, shape: { thumb: true, index: true, middle: true, ring: true, pinky: true } },
  // vi: "shaka" / hang-loose sign.
  { degree: 6, shape: { thumb: true, index: false, middle: false, ring: false, pinky: true } },
  // vii°: "horns".
  { degree: 7, shape: { thumb: false, index: true, middle: false, ring: false, pinky: true } },
];

function shapesMatch(a: ExtendedFingers, b: ExtendedFingers): boolean {
  return (
    a.thumb === b.thumb &&
    a.index === b.index &&
    a.middle === b.middle &&
    a.ring === b.ring &&
    a.pinky === b.pinky
  );
}

function matchDegree(shape: ExtendedFingers): ScaleDegree | null {
  return DEGREE_SHAPES.find((entry) => shapesMatch(entry.shape, shape))?.degree ?? null;
}

/**
 * Classifies the left hand into a scale degree plus modifiers. Shape (which
 * fingers are extended) picks the degree; tilt — independent of shape, see
 * landmarks.ts — picks the minor-override/flat modifier. Tilting left and
 * right are mutually exclusive by construction (a single angle can't be both
 * less than -25 and greater than +25).
 */
export function classifyLeftHand(landmarks: NormalizedLandmark[]): LeftHandGesture {
  const degree = matchDegree(extendedFingers(landmarks));
  const tilt = tiltAngleDegrees(landmarks);

  return {
    degree,
    minorOverride: tilt < -TILT_THRESHOLD_DEGREES,
    flat: tilt > TILT_THRESHOLD_DEGREES,
  };
}
