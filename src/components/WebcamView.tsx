"use client";

import { useEffect, useRef, useState } from "react";
import { DrawingUtils, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { detectHands, HandLandmarker, loadHandLandmarker } from "@/gesture/handLandmarker";

type Status = "loading" | "ready" | "error";

const LANDMARK_COLOR = "#facc15";
const CONNECTION_COLOR = "#22d3ee";

interface WebcamViewProps {
  /** Called once per detected frame with the raw MediaPipe result. This
   * component only draws — it has no idea what a "gesture" or "chord" is —
   * so turning detections into music lives entirely in whatever's passed
   * here (see engine/useGestureController.ts). */
  onFrame?: (result: HandLandmarkerResult, timestampMs: number) => void;
}

/**
 * Webcam feed with a live hand-landmark overlay. No gesture logic here —
 * this layer only owns the camera + MediaPipe pipeline and its mirrored
 * visual overlay. Gesture classification (turning landmarks into
 * degrees/patterns) lives in gesture/leftHand.ts, gesture/rightHand.ts etc.,
 * consuming the same `HandLandmarkerResult` via the `onFrame` callback.
 *
 * Mirroring note: the <video> is CSS-mirrored (scaleX(-1)) for a natural
 * selfie view, but MediaPipe always sees the raw, unmirrored frame — its
 * landmark coordinates are relative to that raw frame. The canvas overlay
 * mirrors its own drawing to match the mirrored video. This does NOT by
 * itself make MediaPipe's left/right handedness labels correct for a
 * mirrored preview — that correction happens explicitly in
 * gesture/gestureEngine.ts, not here.
 */
export default function WebcamView({ onFrame }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  // onFrame is read through a ref so the detection-loop effect below (which
  // sets up the camera/model exactly once) always calls the LATEST callback
  // without needing to re-run camera/model setup whenever the parent
  // re-renders and hands in a new function reference.
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId = 0;
    let cancelled = false;

    async function setup() {
      try {
        const [, mediaStream] = await Promise.all([
          loadHandLandmarker(),
          navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }),
        ]);
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        video.srcObject = mediaStream;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const drawingUtils = new DrawingUtils(ctx);

        setStatus("ready");

        const renderFrame = () => {
          if (cancelled) return;

          const timestampMs = performance.now();
          const result = detectHands(video, timestampMs);
          onFrameRef.current?.(result, timestampMs);

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Mirror all drawing to match the mirrored <video> preview.
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
              color: CONNECTION_COLOR,
              lineWidth: 2,
            });
            drawingUtils.drawLandmarks(landmarks, { color: LANDMARK_COLOR, radius: 3 });
          }

          ctx.restore();
          animationFrameId = requestAnimationFrame(renderFrame);
        };

        animationFrameId = requestAnimationFrame(renderFrame);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to access camera");
          setStatus("error");
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="relative aspect-video w-[640px] max-w-full overflow-hidden rounded-lg bg-zinc-900">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-zinc-400">
          {status === "loading" && "Loading camera + hand model..."}
          {status === "error" && (error ?? "Something went wrong")}
        </div>
      )}
    </div>
  );
}
