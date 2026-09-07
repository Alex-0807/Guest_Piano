import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { classifyLeftHand, type LeftHandGesture } from "./leftHand";
import { classifyRightHand, type RightHandGesture } from "./rightHand";
import { ExponentialSmoother, GestureStabilizer } from "./stabilizer";
import type { PatternId, ScaleDegree } from "@/music/types";

const DEGREE_HOLD_MS = 150; // spec: chord gesture stable for ~100-200ms
const PATTERN_HOLD_MS = 300; // spec: pattern selection stable for ~300ms
const MODIFIER_HOLD_MS = 150;
const TRACKING_LOSS_GRACE_MS = 500;
const DYNAMICS_SMOOTHING_ALPHA = 0.25;
const DEFAULT_DYNAMICS = 0.8;

type HandSide = "left" | "right";

/**
 * Maps MediaPipe's handedness label directly to the user's actual hand.
 *
 * An earlier version of this function flipped the label, reasoning from
 * MediaPipe's documented "assumes mirrored input" convention (this pipeline
 * feeds it the RAW, unmirrored camera frame — see WebcamView, where only the
 * on-screen <video> is CSS-mirrored for display). That reasoning turned out
 * to be backwards in practice: verified live with a real camera, MediaPipe's
 * raw label already matches the user's actual hand, no flip needed.
 */
function resolveHandSide(categoryName: string): HandSide {
  return categoryName === "Left" ? "left" : "right";
}

function pickHandLandmarks(
  result: HandLandmarkerResult,
  side: HandSide,
): NormalizedLandmark[] | null {
  for (let i = 0; i < result.handedness.length; i++) {
    const label = result.handedness[i]?.[0]?.categoryName;
    if (label && resolveHandSide(label) === side) {
      return result.landmarks[i];
    }
  }
  return null;
}

/**
 * Owns all per-frame gesture stabilization state and produces the final,
 * debounced left/right hand gestures the rest of the app consumes. One
 * instance persists for the whole session (stabilizers need continuity
 * across frames to measure how long a gesture has been held) — create it
 * once, call `processFrame` on every detection.
 */
export class GestureEngine {
  private readonly degreeStabilizer = new GestureStabilizer<ScaleDegree>({
    holdMs: DEGREE_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });
  private readonly minorOverrideStabilizer = new GestureStabilizer<boolean>({
    holdMs: MODIFIER_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });
  private readonly flatStabilizer = new GestureStabilizer<boolean>({
    holdMs: MODIFIER_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });

  private readonly patternStabilizer = new GestureStabilizer<PatternId>({
    holdMs: PATTERN_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });
  private readonly mutedStabilizer = new GestureStabilizer<boolean>({
    holdMs: MODIFIER_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });
  private readonly seventhStabilizer = new GestureStabilizer<boolean>({
    holdMs: MODIFIER_HOLD_MS,
    graceMs: TRACKING_LOSS_GRACE_MS,
  });
  private readonly dynamicsSmoother = new ExponentialSmoother(DYNAMICS_SMOOTHING_ALPHA);

  processFrame(
    result: HandLandmarkerResult,
    nowMs: number,
  ): { leftHand: LeftHandGesture; rightHand: RightHandGesture } {
    const leftLandmarks = pickHandLandmarks(result, "left");
    const rawLeft = leftLandmarks ? classifyLeftHand(leftLandmarks) : null;

    const rightLandmarks = pickHandLandmarks(result, "right");
    const rawRight = rightLandmarks ? classifyRightHand(rightLandmarks) : null;

    const leftHand: LeftHandGesture = {
      degree: this.degreeStabilizer.update(rawLeft?.degree ?? null, nowMs),
      minorOverride: this.minorOverrideStabilizer.update(rawLeft?.minorOverride ?? null, nowMs) ?? false,
      flat: this.flatStabilizer.update(rawLeft?.flat ?? null, nowMs) ?? false,
    };

    const rightHand: RightHandGesture = {
      pattern: this.patternStabilizer.update(rawRight?.pattern ?? null, nowMs),
      muted: this.mutedStabilizer.update(rawRight?.muted ?? null, nowMs) ?? false,
      seventh: this.seventhStabilizer.update(rawRight?.seventh ?? null, nowMs) ?? false,
      // Dynamics is continuous, so it's smoothed rather than debounced; when
      // the right hand isn't visible, hold the last smoothed value instead
      // of snapping to 0.
      verticalPosition:
        rawRight !== null
          ? this.dynamicsSmoother.update(rawRight.verticalPosition)
          : (this.dynamicsSmoother.current ?? DEFAULT_DYNAMICS),
    };

    return { leftHand, rightHand };
  }
}
