import * as Tone from "tone";
import { useEngineStore } from "@/engine/engineStore";
import { notesForTick, PATTERNS } from "@/music/patterns";
import { TICKS_PER_BEAT } from "@/music/timing";
import { voiceChord } from "@/music/voiceLeading";
import { triggerNote } from "./sampler";

/**
 * Global 16th-note counter, one "tick" per music/timing.ts's TICKS_PER_BEAT
 * unit. This is the scheduler's own clock — separate from Tone.Transport's
 * internal tick count — so the pattern engine's tick math (see patterns.ts)
 * has a single, simple counter to work with.
 */
let globalTick = 0;
let repeatEventId: number | null = null;

/**
 * Runs once per 16th note, on Tone.js's audio-thread clock. `time` is the
 * precise audio-context time this tick lands on — passed straight through to
 * triggerNote so playback stays sample-accurate instead of drifting the way
 * setTimeout/Date.now()-based timing would.
 */
function onTick(time: number): void {
  const isBeatBoundary = globalTick % TICKS_PER_BEAT === 0;

  if (isBeatBoundary) {
    const { pendingChord, currentVoicing, promotePendingChord } = useEngineStore.getState();
    if (pendingChord) {
      const voiced = voiceChord(pendingChord, currentVoicing);
      promotePendingChord(voiced.notes);
    }
  }

  // Re-read state: the block above may just have updated currentVoicing.
  const { muted, currentVoicing, pattern, dynamics } = useEngineStore.getState();
  if (!muted && currentVoicing) {
    const notes = notesForTick(currentVoicing, PATTERNS[pattern], globalTick);
    for (const note of notes) {
      triggerNote(note, time, dynamics);
    }
  }

  globalTick += 1;
}

/** Starts the transport. Chord changes take effect on the very next beat. */
export function startScheduler(): void {
  Tone.Transport.bpm.value = useEngineStore.getState().bpm;
  globalTick = 0;
  repeatEventId = Tone.Transport.scheduleRepeat(onTick, "16n");
  Tone.Transport.start();
  useEngineStore.getState().setPlaying(true);
}

/**
 * Stops scheduling new notes. Does NOT cut off notes already ringing — they
 * decay naturally, same as a chord change never calls releaseAll().
 */
export function stopScheduler(): void {
  if (repeatEventId !== null) {
    Tone.Transport.clear(repeatEventId);
    repeatEventId = null;
  }
  Tone.Transport.stop();
  useEngineStore.getState().setPlaying(false);
}

/** Updates tempo immediately, whether or not the transport is running. */
export function setSchedulerBpm(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
  useEngineStore.getState().setBpm(bpm);
}
