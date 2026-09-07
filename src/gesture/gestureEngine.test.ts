import type { Category, HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { describe, expect, it } from "vitest";
import { buildHandFixture } from "./handFixture";
import { GestureEngine } from "./gestureEngine";
import type { ExtendedFingers } from "./landmarks";

const NONE: ExtendedFingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };
const DEGREE_ONE_SHAPE: ExtendedFingers = { ...NONE, index: true };
const PATTERN_TWO_SHAPE: ExtendedFingers = { ...NONE, index: true, middle: true };

function category(categoryName: string): Category {
  return { categoryName, score: 1, index: 0, displayName: categoryName };
}

/** `mediapipeSide` is the raw label MediaPipe reports, which GestureEngine
 * now maps directly to the user's actual hand (see resolveHandSide's doc
 * comment — an earlier flipped version of this mapping was verified wrong
 * with a real camera). */
function fakeResult(
  hands: { mediapipeSide: "Left" | "Right"; landmarks: NormalizedLandmark[] }[],
): HandLandmarkerResult {
  return {
    landmarks: hands.map((h) => h.landmarks),
    worldLandmarks: hands.map(() => []),
    handedness: hands.map((h) => [category(h.mediapipeSide)]),
    handednesses: [],
  };
}

describe("GestureEngine: handedness mapping", () => {
  it("treats a MediaPipe 'Left' label as the user's actual left hand", () => {
    const engine = new GestureEngine();
    const result = fakeResult([
      { mediapipeSide: "Left", landmarks: buildHandFixture({ extended: DEGREE_ONE_SHAPE }) },
    ]);

    // Hold for long enough for the degree stabilizer to settle.
    engine.processFrame(result, 0);
    const { leftHand, rightHand } = engine.processFrame(result, 200);

    expect(leftHand.degree).toBe(1);
    expect(rightHand.pattern).toBeNull();
  });

  it("treats a MediaPipe 'Right' label as the user's actual right hand", () => {
    const engine = new GestureEngine();
    const result = fakeResult([
      { mediapipeSide: "Right", landmarks: buildHandFixture({ extended: PATTERN_TWO_SHAPE }) },
    ]);

    engine.processFrame(result, 0);
    const { leftHand, rightHand } = engine.processFrame(result, 350);

    expect(leftHand.degree).toBeNull();
    expect(rightHand.pattern).toBe("arpeggio");
  });
});

describe("GestureEngine: stabilization end-to-end", () => {
  it("does not report a degree until the shape has been held long enough", () => {
    const engine = new GestureEngine();
    const result = fakeResult([
      { mediapipeSide: "Left", landmarks: buildHandFixture({ extended: DEGREE_ONE_SHAPE }) },
    ]);

    const early = engine.processFrame(result, 0);
    expect(early.leftHand.degree).toBeNull();

    const settled = engine.processFrame(result, 150);
    expect(settled.leftHand.degree).toBe(1);
  });

  it("keeps the last degree through a brief hand disappearance", () => {
    const engine = new GestureEngine();
    const withHand = fakeResult([
      { mediapipeSide: "Left", landmarks: buildHandFixture({ extended: DEGREE_ONE_SHAPE }) },
    ]);
    const noHands = fakeResult([]);

    engine.processFrame(withHand, 0);
    engine.processFrame(withHand, 150); // degree 1 now stable

    const brieflyGone = engine.processFrame(noHands, 300);
    expect(brieflyGone.leftHand.degree).toBe(1);
  });

  it("smooths dynamics rather than snapping frame to frame", () => {
    const engine = new GestureEngine();
    const low = fakeResult([
      { mediapipeSide: "Right", landmarks: buildHandFixture({ extended: NONE, wristY: 0.9 }) },
    ]);
    const high = fakeResult([
      { mediapipeSide: "Right", landmarks: buildHandFixture({ extended: NONE, wristY: 0.1 }) },
    ]);

    engine.processFrame(low, 0);
    const jumped = engine.processFrame(high, 16);
    // One frame after a big jump, dynamics should have moved toward the new
    // reading but not reached it instantly.
    expect(jumped.rightHand.verticalPosition).toBeGreaterThan(0.1);
    expect(jumped.rightHand.verticalPosition).toBeLessThan(0.9);
  });
});
