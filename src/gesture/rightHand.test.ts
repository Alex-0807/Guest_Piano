import { describe, expect, it } from "vitest";
import { buildHandFixture } from "./handFixture";
import { classifyRightHand } from "./rightHand";
import type { ExtendedFingers } from "./landmarks";

const NONE: ExtendedFingers = { thumb: false, index: false, middle: false, ring: false, pinky: false };

describe("classifyRightHand: non-thumb finger count -> pattern", () => {
  it.each([
    [{ ...NONE, index: true }, "block"],
    [{ ...NONE, index: true, middle: true }, "arpeggio"],
    [{ ...NONE, index: true, middle: true, ring: true }, "ballad"],
    [{ ...NONE, index: true, middle: true, ring: true, pinky: true }, "pop"],
  ] as const)("recognizes pattern %#", (shape, expectedPattern) => {
    const gesture = classifyRightHand(buildHandFixture({ extended: shape }));
    expect(gesture.pattern).toBe(expectedPattern);
    expect(gesture.muted).toBe(false);
  });

  it("mutes when no non-thumb fingers are extended (fist), regardless of thumb", () => {
    const fistThumbIn = classifyRightHand(buildHandFixture({ extended: NONE }));
    const fistThumbOut = classifyRightHand(buildHandFixture({ extended: { ...NONE, thumb: true } }));
    expect(fistThumbIn.muted).toBe(true);
    expect(fistThumbIn.pattern).toBeNull();
    expect(fistThumbOut.muted).toBe(true);
    expect(fistThumbOut.pattern).toBeNull();
  });
});

describe("classifyRightHand: thumb -> seventh modifier, independent of pattern", () => {
  it("toggles the seventh modifier without changing the selected pattern", () => {
    const baseShape: ExtendedFingers = { ...NONE, index: true, middle: true };

    const withoutThumb = classifyRightHand(buildHandFixture({ extended: baseShape }));
    const withThumb = classifyRightHand(
      buildHandFixture({ extended: { ...baseShape, thumb: true } }),
    );

    expect(withoutThumb.pattern).toBe("arpeggio");
    expect(withoutThumb.seventh).toBe(false);
    expect(withThumb.pattern).toBe("arpeggio");
    expect(withThumb.seventh).toBe(true);
  });
});

describe("classifyRightHand: vertical position", () => {
  it("reports 1 at the top of frame and 0 at the bottom", () => {
    const atTop = classifyRightHand(buildHandFixture({ extended: NONE, wristY: 0 }));
    const atBottom = classifyRightHand(buildHandFixture({ extended: NONE, wristY: 1 }));
    expect(atTop.verticalPosition).toBeCloseTo(1);
    expect(atBottom.verticalPosition).toBeCloseTo(0);
  });
});
