import { describe, expect, it } from "vitest";
import { notesForTick, PATTERNS } from "./patterns";

const C_MAJOR_NOTES = ["C4", "E4", "G4"];
const A_MINOR_NOTES = ["A3", "C4", "E4"];

describe("ballad pattern", () => {
  it("plays root -> third -> fifth -> third over a bar, one note per beat (C major)", () => {
    const notesByBeat = [0, 4, 8, 12].map((tick) =>
      notesForTick(C_MAJOR_NOTES, PATTERNS.ballad, tick),
    );
    expect(notesByBeat).toEqual([["C4"], ["E4"], ["G4"], ["E4"]]);
  });

  it("plays root -> third -> fifth -> third for A minor too (pattern is chord-agnostic)", () => {
    const notesByBeat = [0, 4, 8, 12].map((tick) =>
      notesForTick(A_MINOR_NOTES, PATTERNS.ballad, tick),
    );
    expect(notesByBeat).toEqual([["A3"], ["C4"], ["E4"], ["C4"]]);
  });

  it("plays nothing on the off-ticks between beats", () => {
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.ballad, 1)).toEqual([]);
  });

  it("repeats every bar", () => {
    // tick 16 is one bar later than tick 0, same position in the cycle
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.ballad, 16)).toEqual(["C4"]);
  });
});

describe("block pattern", () => {
  it("re-strikes the full chord on every beat", () => {
    for (const tick of [0, 4, 8, 12]) {
      expect(notesForTick(C_MAJOR_NOTES, PATTERNS.block, tick)).toEqual(["C4", "E4", "G4"]);
    }
  });

  it("plays nothing between beats", () => {
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.block, 2)).toEqual([]);
  });
});

describe("arpeggio pattern", () => {
  it("plays the same root/third/fifth/third shape as ballad, at 8th-note speed", () => {
    const notesByEighth = [0, 2, 4, 6].map((tick) =>
      notesForTick(C_MAJOR_NOTES, PATTERNS.arpeggio, tick),
    );
    expect(notesByEighth).toEqual([["C4"], ["E4"], ["G4"], ["E4"]]);
  });
});

describe("pop pattern", () => {
  it("hits the full chord on beat 1 and the pushed eighth-notes before beats 2 and 3", () => {
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.pop, 0)).toEqual(["C4", "E4", "G4"]);
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.pop, 6)).toEqual(["C4", "E4", "G4"]);
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.pop, 10)).toEqual(["C4", "E4", "G4"]);
    expect(notesForTick(C_MAJOR_NOTES, PATTERNS.pop, 4)).toEqual([]);
  });
});

describe("graceful degradation", () => {
  it("drops chord-tone indexes beyond the given voicing instead of throwing", () => {
    const twoNoteVoicing = ["C4", "E4"];
    // block pattern asks for indexes [0, 1, 2]; index 2 doesn't exist here.
    expect(notesForTick(twoNoteVoicing, PATTERNS.block, 0)).toEqual(["C4", "E4"]);
  });
});
