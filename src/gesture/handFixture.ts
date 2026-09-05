import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { LANDMARK, type ExtendedFingers } from "./landmarks";

/**
 * Test-only helper: builds a synthetic 21-point hand landmark array from a
 * simple description (which fingers are extended, how much the hand is
 * tilted), instead of hand-calculating raw coordinates in every test.
 *
 * Landmarks are built in a "neutral" pose (hand pointing straight up, tilt
 * 0) and then rotated rigidly around the wrist by `tiltDegrees`. Because the
 * classifiers only compare *distances* between landmarks (see landmarks.ts),
 * a rigid rotation preserves every finger's extended/curled classification
 * exactly — which is the property under test: shape and tilt must never
 * interfere with each other.
 */
export function buildHandFixture(options: {
  extended: ExtendedFingers;
  tiltDegrees?: number;
  wristY?: number;
}): NormalizedLandmark[] {
  const { extended, tiltDegrees = 0, wristY = 0.9 } = options;
  const NEAR = 0.05;
  const MCP_DIST = 0.15;
  const FAR = 0.35;

  const neutral = new Array<{ x: number; y: number }>(21).fill({ x: 0, y: 0 });
  const set = (index: number, point: { x: number; y: number }) => {
    neutral[index] = point;
  };

  set(LANDMARK.WRIST, { x: 0, y: 0 });
  set(LANDMARK.THUMB_MCP, { x: -0.12, y: -0.1 });
  set(LANDMARK.INDEX_MCP, { x: -0.08, y: -MCP_DIST });
  set(LANDMARK.MIDDLE_MCP, { x: 0, y: -MCP_DIST });
  set(LANDMARK.RING_MCP, { x: 0.08, y: -MCP_DIST });
  set(LANDMARK.PINKY_MCP, { x: 0.14, y: -MCP_DIST * 0.9 });

  // Place each fingertip along the same direction as its MCP from the
  // wrist, just nearer (curled) or farther (extended) — this directly
  // controls the tip-to-wrist distance the classifier compares against.
  const tipAlongMcpDirection = (mcp: { x: number; y: number }, isExtended: boolean) => {
    const angle = Math.atan2(mcp.y, mcp.x);
    const dist = isExtended ? FAR : NEAR;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  set(LANDMARK.INDEX_TIP, tipAlongMcpDirection(neutral[LANDMARK.INDEX_MCP], extended.index));
  set(LANDMARK.MIDDLE_TIP, tipAlongMcpDirection(neutral[LANDMARK.MIDDLE_MCP], extended.middle));
  set(LANDMARK.RING_TIP, tipAlongMcpDirection(neutral[LANDMARK.RING_MCP], extended.ring));
  set(LANDMARK.PINKY_TIP, tipAlongMcpDirection(neutral[LANDMARK.PINKY_MCP], extended.pinky));

  // Thumb extended/curled is measured against the pinky MCP, not the wrist
  // (see isThumbExtended) — so place the thumb tip along that direction instead.
  const pinkyMcp = neutral[LANDMARK.PINKY_MCP];
  const thumbMcp = neutral[LANDMARK.THUMB_MCP];
  const towardThumb = { x: thumbMcp.x - pinkyMcp.x, y: thumbMcp.y - pinkyMcp.y };
  const towardThumbLength = Math.hypot(towardThumb.x, towardThumb.y);
  const thumbDirection = { x: towardThumb.x / towardThumbLength, y: towardThumb.y / towardThumbLength };
  const thumbTipDistance = extended.thumb ? towardThumbLength + FAR : towardThumbLength * 0.3;
  set(LANDMARK.THUMB_TIP, {
    x: pinkyMcp.x + thumbDirection.x * thumbTipDistance,
    y: pinkyMcp.y + thumbDirection.y * thumbTipDistance,
  });

  const theta = (tiltDegrees * Math.PI) / 180;
  return neutral.map(
    (point): NormalizedLandmark => ({
      x: 0.5 + (point.x * Math.cos(theta) - point.y * Math.sin(theta)),
      y: wristY + (point.x * Math.sin(theta) + point.y * Math.cos(theta)),
      z: 0,
      visibility: 1,
    }),
  );
}
