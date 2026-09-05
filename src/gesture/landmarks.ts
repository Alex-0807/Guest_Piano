import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** The only MediaPipe hand-landmark indices this app reads. PIP/DIP joints
 * aren't needed — see isFingerExtended below for why tip-vs-MCP is enough. */
export const LANDMARK = {
  WRIST: 0,
  THUMB_MCP: 2,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_TIP: 20,
} as const;

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * A non-thumb finger is "extended" if its tip is farther from the wrist than
 * its own MCP (knuckle) joint is — i.e. straightened out away from the palm.
 * Using distances rather than raw y-coordinates keeps this correct no matter
 * how the hand is rotated in frame, which matters because hand tilt is
 * itself a separate, deliberate gesture signal (see tiltAngleDegrees) — a
 * y-coordinate-based test would break as soon as the hand tilted.
 */
function isFingerExtended(
  landmarks: NormalizedLandmark[],
  tipIndex: number,
  mcpIndex: number,
): boolean {
  const wrist = landmarks[LANDMARK.WRIST];
  return distance(landmarks[tipIndex], wrist) > distance(landmarks[mcpIndex], wrist);
}

/**
 * The thumb doesn't curl toward the wrist the way other fingers do — it
 * swings sideways, away from the palm. So "extended" is measured against the
 * pinky knuckle instead: a splayed-out thumb ends up farther from the far
 * side of the palm than its own knuckle is.
 */
function isThumbExtended(landmarks: NormalizedLandmark[]): boolean {
  const pinkyMcp = landmarks[LANDMARK.PINKY_MCP];
  return (
    distance(landmarks[LANDMARK.THUMB_TIP], pinkyMcp) >
    distance(landmarks[LANDMARK.THUMB_MCP], pinkyMcp)
  );
}

export interface ExtendedFingers {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export function extendedFingers(landmarks: NormalizedLandmark[]): ExtendedFingers {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_MCP),
    middle: isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_MCP),
    ring: isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_MCP),
    pinky: isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_MCP),
  };
}

/**
 * Degrees of rotation of the hand's own "up" axis (wrist -> middle knuckle)
 * away from vertical. 0 = hand pointing straight up, positive = rotated
 * clockwise ("tilted right"), negative = counter-clockwise ("tilted left").
 * This depends only on the wrist and middle-knuckle position, so it's
 * entirely independent of which fingers are extended — a modifier signal
 * that can never be confused with a shape-based gesture.
 */
export function tiltAngleDegrees(landmarks: NormalizedLandmark[]): number {
  const wrist = landmarks[LANDMARK.WRIST];
  const middleMcp = landmarks[LANDMARK.MIDDLE_MCP];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/**
 * Vertical hand position: 0 at the bottom of frame, 1 at the top. Image y
 * increases downward, so this flips it to increase upward, matching
 * "higher hand -> louder" directly instead of inverting it at every call site.
 */
export function verticalPosition(landmarks: NormalizedLandmark[]): number {
  return 1 - landmarks[LANDMARK.WRIST].y;
}
