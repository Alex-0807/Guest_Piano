import { describe, expect, it } from "vitest";
import { ExponentialSmoother, GestureStabilizer } from "./stabilizer";

describe("GestureStabilizer", () => {
  const options = { holdMs: 150, graceMs: 500 };

  it("starts with no stable value", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    expect(stabilizer.update(null, 0)).toBeNull();
  });

  it("does not adopt a new value until it has been held for holdMs", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    expect(stabilizer.update("A", 0)).toBeNull();
    expect(stabilizer.update("A", 100)).toBeNull(); // only 100ms held so far
    expect(stabilizer.update("A", 149)).toBeNull();
  });

  it("adopts a new value once held for at least holdMs", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    stabilizer.update("A", 0);
    expect(stabilizer.update("A", 150)).toBe("A");
  });

  it("resets the hold timer when the candidate flickers to a different value", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    stabilizer.update("A", 0);
    stabilizer.update("B", 100); // flicker before A stabilized
    // Only 60ms of continuous "B" by t=160 — not enough yet.
    expect(stabilizer.update("B", 160)).toBeNull();
    expect(stabilizer.update("B", 250)).toBe("B"); // 150ms of continuous B
  });

  it("keeps the stable value through a brief tracking loss (within graceMs)", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    stabilizer.update("A", 0);
    stabilizer.update("A", 150); // now stable at "A"
    expect(stabilizer.update(null, 300)).toBe("A");
    expect(stabilizer.update(null, 600)).toBe("A"); // 450ms of loss, still under 500ms grace
  });

  it("clears the stable value once tracking loss exceeds graceMs", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    stabilizer.update("A", 0);
    stabilizer.update("A", 150);
    expect(stabilizer.update(null, 700)).toBeNull(); // 550ms of loss, past 500ms grace
  });

  it("requires a fresh hold after tracking resumes post-clear", () => {
    const stabilizer = new GestureStabilizer<string>(options);
    stabilizer.update("A", 0);
    stabilizer.update("A", 150);
    stabilizer.update(null, 700); // cleared
    expect(stabilizer.update("A", 750)).toBeNull(); // just resumed, not held yet
    expect(stabilizer.update("A", 900)).toBe("A"); // held 150ms again
  });
});

describe("ExponentialSmoother", () => {
  it("initializes to the first raw value with no smoothing lag", () => {
    const smoother = new ExponentialSmoother(0.25);
    expect(smoother.update(0.8)).toBe(0.8);
  });

  it("moves partway toward each new reading, not instantly", () => {
    const smoother = new ExponentialSmoother(0.5);
    smoother.update(0);
    const result = smoother.update(1);
    expect(result).toBeCloseTo(0.5); // halfway, given alpha = 0.5
  });

  it("converges toward a steady input over repeated updates", () => {
    const smoother = new ExponentialSmoother(0.3);
    let result = smoother.update(0);
    for (let i = 0; i < 20; i++) {
      result = smoother.update(1);
    }
    expect(result).toBeCloseTo(1, 2);
  });
});
