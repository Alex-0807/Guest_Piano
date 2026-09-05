import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

// Pinned to the installed @mediapipe/tasks-vision npm version — the JS
// bindings and the wasm binary must match, or detection fails at runtime.
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

let landmarker: HandLandmarker | null = null;
let loadPromise: Promise<HandLandmarker> | null = null;

/** Loads the hand landmark model. Safe to call multiple times — only loads once. */
export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "VIDEO",
      numHands: 2,
    });
    return landmarker;
  })();

  return loadPromise;
}

export { HandLandmarker };
export type { HandLandmarkerResult };

/**
 * Runs hand detection on a single video frame. `timestampMs` must strictly
 * increase between calls — MediaPipe's VIDEO running mode uses it to track
 * hands across frames — so pass `performance.now()` from the render loop.
 */
export function detectHands(video: HTMLVideoElement, timestampMs: number): HandLandmarkerResult {
  if (!landmarker) {
    throw new Error("Hand landmarker not loaded yet — call loadHandLandmarker() first");
  }
  return landmarker.detectForVideo(video, timestampMs);
}
