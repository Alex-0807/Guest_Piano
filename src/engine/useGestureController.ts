"use client";

import { useRef, useState } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { GestureEngine } from "@/gesture/gestureEngine";
import { buildChord } from "@/music/chordEngine";
import type { MusicalKey, PatternId, ScaleDegree } from "@/music/types";
import { useEngineStore } from "./engineStore";

interface AppliedGesture {
  degree: ScaleDegree | null;
  minorOverride: boolean;
  flat: boolean;
  seventh: boolean;
  pattern: PatternId | null;
  muted: boolean;
}

const INITIAL_APPLIED: AppliedGesture = {
  degree: null,
  minorOverride: false,
  flat: false,
  seventh: false,
  pattern: null,
  muted: false,
};

/**
 * Bridges the gesture-recognition layer to the engine store. Owns one
 * GestureEngine instance — its stabilizers need continuity across frames —
 * and only writes to the store when a debounced value actually *changes*.
 * Calling setPendingChord/setPattern on every single frame regardless would
 * still be logically correct (they're idempotent) but would trigger a
 * store notification 60 times a second, needlessly re-rendering anything
 * subscribed to that slice.
 *
 * Returns a `processFrame` callback to hand to WebcamView's detection loop.
 * WebcamView itself never sees this logic — it only reports raw detection
 * results upward, keeping the camera/rendering layer free of music
 * knowledge (see its own doc comment).
 *
 * Note: the seventh modifier comes from the RIGHT hand but affects chord
 * *quality*, so building a chord requires combining state from both hands —
 * this hook is where that combination happens, not in either classifier.
 */
export function useGestureController(key: MusicalKey) {
  const [engine] = useState(() => new GestureEngine());
  const appliedRef = useRef<AppliedGesture>(INITIAL_APPLIED);

  const setPendingChord = useEngineStore((s) => s.setPendingChord);
  const setPattern = useEngineStore((s) => s.setPattern);
  const setMuted = useEngineStore((s) => s.setMuted);
  const setDynamics = useEngineStore((s) => s.setDynamics);

  return function processFrame(result: HandLandmarkerResult, nowMs: number) {
    const { leftHand, rightHand } = engine.processFrame(result, nowMs);
    const applied = appliedRef.current;

    const chordInputsChanged =
      leftHand.degree !== applied.degree ||
      leftHand.minorOverride !== applied.minorOverride ||
      leftHand.flat !== applied.flat ||
      rightHand.seventh !== applied.seventh;

    if (chordInputsChanged && leftHand.degree !== null) {
      setPendingChord(
        buildChord(key, leftHand.degree, {
          minorOverride: leftHand.minorOverride,
          flat: leftHand.flat,
          seventh: rightHand.seventh,
        }),
      );
    }

    if (rightHand.pattern !== applied.pattern && rightHand.pattern !== null) {
      setPattern(rightHand.pattern);
    }

    if (rightHand.muted !== applied.muted) {
      setMuted(rightHand.muted);
    }

    setDynamics(rightHand.verticalPosition);

    appliedRef.current = {
      degree: leftHand.degree,
      minorOverride: leftHand.minorOverride,
      flat: leftHand.flat,
      seventh: rightHand.seventh,
      pattern: rightHand.pattern,
      muted: rightHand.muted,
    };
  };
}
