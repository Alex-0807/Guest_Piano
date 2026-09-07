export interface StabilizerOptions {
  /** How long a new candidate value must be observed continuously before it
   * replaces the current stable output. Filters out flickery misreads. */
  holdMs: number;
  /** How long a `null` reading (no gesture detected this frame) is tolerated
   * before the stable output is cleared. A brief tracking loss shouldn't
   * instantly drop the current chord. */
  graceMs: number;
}

/**
 * Debounces a discrete, possibly-noisy reading into a stable value.
 *
 * MediaPipe's per-frame classification can flicker — a hand mid-transition
 * between shapes, a momentary misread — so nothing here reacts to a single
 * frame's reading directly. A new value only becomes "current" once it's
 * been observed continuously for `holdMs`; a `null` reading only clears the
 * current value once it's persisted for `graceMs`.
 */
export class GestureStabilizer<T> {
  private stableValue: T | null = null;
  private candidateValue: T | null = null;
  private candidateSinceMs = 0;
  private lastSeenMs = 0;

  constructor(
    private readonly options: StabilizerOptions,
    private readonly isEqual: (a: T, b: T) => boolean = Object.is,
  ) {}

  /** Feed one frame's raw reading; returns the current stable value. */
  update(raw: T | null, nowMs: number): T | null {
    if (raw !== null) {
      this.lastSeenMs = nowMs;
      if (this.candidateValue === null || !this.isEqual(this.candidateValue, raw)) {
        this.candidateValue = raw;
        this.candidateSinceMs = nowMs;
      }
      if (nowMs - this.candidateSinceMs >= this.options.holdMs) {
        this.stableValue = this.candidateValue;
      }
    } else {
      // No reading this frame — the switch-candidate resets (a gesture must
      // be freshly held once tracking resumes), but the stable output
      // survives until the grace period actually elapses.
      this.candidateValue = null;
      if (nowMs - this.lastSeenMs >= this.options.graceMs) {
        this.stableValue = null;
      }
    }
    return this.stableValue;
  }
}

/**
 * Exponentially smooths a continuous value (e.g. hand height -> dynamics) so
 * it doesn't jitter frame-to-frame with sensor noise. Higher `alpha` tracks
 * the raw input more closely; lower `alpha` is smoother but laggier.
 */
export class ExponentialSmoother {
  private value: number | null = null;

  constructor(private readonly alpha: number) {}

  update(raw: number): number {
    this.value = this.value === null ? raw : this.value + this.alpha * (raw - this.value);
    return this.value;
  }

  /** The current smoothed value without feeding in a new reading — for when
   * the input is temporarily unavailable and the last output should hold. */
  get current(): number | null {
    return this.value;
  }
}
