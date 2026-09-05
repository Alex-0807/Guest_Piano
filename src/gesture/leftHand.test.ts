import { describe, expect, it } from "vitest";
import { buildHandFixture } from "./handFixture";
import { classifyLeftHand } from "./leftHand";
import type { ExtendedFingers } from "./landmarks";

const NONE: ExtendedFingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };

describe("classifyLeftHand: shape -> degree", () => {
  it.each([
    [{ ...NONE, index: true }, 1],
    [{ ...NONE, index: true, middle: true }, 2],
    [{ ...NONE, index: true, middle: true, ring: true }, 3],
    [{ ...NONE, index: true, middle: true, ring: true, pinky: true }, 4],
    [{ thumb: true, index: true, middle: true, ring: true, pinky: true }, 5],
    [{ ...NONE, thumb: true, pinky: true }, 6], // shaka
    [{ ...NONE, index: true, pinky: true }, 7], // horns
  ] as const)("recognizes degree %#", (shape, expectedDegree) => {
    const landmarks = buildHandFixture({ extended: shape });
    expect(classifyLeftHand(landmarks).degree).toBe(expectedDegree);
  });

  it("returns null for a shape that matches no degree (e.g. a closed fist)", () => {
    const landmarks = buildHandFixture({ extended: NONE });
    expect(classifyLeftHand(landmarks).degree).toBeNull();
  });
});

describe("classifyLeftHand: tilt -> modifiers", () => {
  const degreeOneShape: ExtendedFingers = { ...NONE, index: true };

  it("reports no modifier near-vertical (within the dead zone)", () => {
    const landmarks = buildHandFixture({ extended: degreeOneShape, tiltDegrees: 10 });
    const gesture = classifyLeftHand(landmarks);
    expect(gesture.minorOverride).toBe(false);
    expect(gesture.flat).toBe(false);
  });

  it("reports minorOverride when tilted left past the threshold", () => {
    const landmarks = buildHandFixture({ extended: degreeOneShape, tiltDegrees: -40 });
    const gesture = classifyLeftHand(landmarks);
    expect(gesture.minorOverride).toBe(true);
    expect(gesture.flat).toBe(false);
  });

  it("reports flat when tilted right past the threshold", () => {
    const landmarks = buildHandFixture({ extended: degreeOneShape, tiltDegrees: 40 });
    const gesture = classifyLeftHand(landmarks);
    expect(gesture.minorOverride).toBe(false);
    expect(gesture.flat).toBe(true);
  });

  it("keeps recognizing the same degree regardless of tilt (shape and tilt don't interfere)", () => {
    const upright = classifyLeftHand(buildHandFixture({ extended: degreeOneShape, tiltDegrees: 0 }));
    const tilted = classifyLeftHand(
      buildHandFixture({ extended: degreeOneShape, tiltDegrees: 40 }),
    );
    expect(upright.degree).toBe(1);
    expect(tilted.degree).toBe(1);
  });
});
