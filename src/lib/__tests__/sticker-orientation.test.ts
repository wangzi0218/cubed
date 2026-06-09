import { describe, it, expect } from "vitest";
import {
  createInitialOrientations,
  applyOrientationMove,
  applyOrientationMoves,
  getCenterOrientations,
  setCenterOrientation,
} from "../sticker-orientation";
import type { Move } from "@/types/cube";

describe("createInitialOrientations", () => {
  it("returns 24 zeros for 2x2", () => {
    const o = createInitialOrientations(2);
    expect(o).toHaveLength(24);
    expect(o.every((v) => v === 0)).toBe(true);
  });

  it("returns 54 zeros for 3x3", () => {
    const o = createInitialOrientations(3);
    expect(o).toHaveLength(54);
    expect(o.every((v) => v === 0)).toBe(true);
  });
});

describe("applyOrientationMove", () => {
  it("rotates U face stickers CW by +1", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "R", 3);
    // R face is index 1, stickers 9-17
    for (let i = 9; i < 18; i++) {
      expect(result[i]).toBe(1);
    }
    // Other faces untouched
    for (let i = 0; i < 9; i++) {
      expect(result[i]).toBe(0);
    }
    for (let i = 18; i < 54; i++) {
      expect(result[i]).toBe(0);
    }
  });

  it("rotates CCW by +3", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "U'", 3);
    // U face is index 0, stickers 0-8
    for (let i = 0; i < 9; i++) {
      expect(result[i]).toBe(3);
    }
  });

  it("rotates half turn by +2", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "F2", 3);
    // F face is index 2, stickers 18-26
    for (let i = 18; i < 27; i++) {
      expect(result[i]).toBe(2);
    }
  });

  it("wraps around mod 4", () => {
    let o = createInitialOrientations(3);
    // Apply 4 CW rotations to R face — should return to 0
    for (let i = 0; i < 4; i++) {
      o = applyOrientationMove(o, "R", 3);
    }
    for (let i = 9; i < 18; i++) {
      expect(o[i]).toBe(0);
    }
  });

  it("accumulates correctly", () => {
    let o = createInitialOrientations(3);
    o = applyOrientationMove(o, "D", 3);    // +1
    o = applyOrientationMove(o, "D", 3);    // +1 = 2
    o = applyOrientationMove(o, "D'", 3);   // +3 = 5 % 4 = 1
    // D face is index 3, stickers 27-35
    for (let i = 27; i < 36; i++) {
      expect(o[i]).toBe(1);
    }
  });

  it("returns a copy, does not mutate input", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "R", 3);
    expect(o[9]).toBe(0);
    expect(result[9]).toBe(1);
  });

  it("handles all 6 faces", () => {
    const faces = [
      { move: "U", start: 0 },
      { move: "R", start: 9 },
      { move: "F", start: 18 },
      { move: "D", start: 27 },
      { move: "L", start: 36 },
      { move: "B", start: 45 },
    ];
    for (const { move, start } of faces) {
      const o = createInitialOrientations(3);
      const result = applyOrientationMove(o, move, 3);
      for (let i = start; i < start + 9; i++) {
        expect(result[i]).toBe(1);
      }
    }
  });

  it("handles 2x2 size", () => {
    const o = createInitialOrientations(2);
    const result = applyOrientationMove(o, "R", 2);
    // R face is index 1, stickers 4-7
    for (let i = 4; i < 8; i++) {
      expect(result[i]).toBe(1);
    }
  });

  it("returns copy for unknown move", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "X", 3);
    expect(result).toEqual(o);
    expect(result).not.toBe(o);
  });
});

describe("applyOrientationMoves", () => {
  it("returns orientation after each move", () => {
    const o = createInitialOrientations(3);
    const moves: Move[] = [
      { notation: "R", face: "R", direction: "", layer: 0 },
      { notation: "U", face: "U", direction: "", layer: 0 },
    ];
    const results = applyOrientationMoves(o, moves, 3);
    expect(results).toHaveLength(2);
    // After R: R face = 1
    expect(results[0][9]).toBe(1);
    expect(results[0][0]).toBe(0);
    // After U: U face = 1, R face still = 1
    expect(results[1][0]).toBe(1);
    expect(results[1][9]).toBe(1);
  });

  it("returns empty array for no moves", () => {
    const o = createInitialOrientations(3);
    expect(applyOrientationMoves(o, [], 3)).toEqual([]);
  });
});

describe("getCenterOrientations", () => {
  it("extracts 6 center values for 3x3", () => {
    const o = createInitialOrientations(3);
    // Set each face's center to a distinct value
    o[4] = 1;  // U center (pos 4 of 0-8)
    o[13] = 2; // R center
    o[22] = 3; // F center
    o[31] = 0; // D center
    o[40] = 1; // L center
    o[49] = 2; // B center
    const centers = getCenterOrientations(o, 3);
    expect(centers).toEqual([1, 2, 3, 0, 1, 2]);
  });

  it("returns all zeros for initial state", () => {
    const o = createInitialOrientations(3);
    expect(getCenterOrientations(o, 3)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("setCenterOrientation", () => {
  it("sets a specific center value", () => {
    const o = createInitialOrientations(3);
    const result = setCenterOrientation(o, 0, 2, 3);
    expect(result[4]).toBe(2); // U center
    expect(result[0]).toBe(0); // U non-center unchanged
  });

  it("wraps value mod 4", () => {
    const o = createInitialOrientations(3);
    const result = setCenterOrientation(o, 1, 5, 3);
    expect(result[13]).toBe(1); // 5 % 4 = 1
  });

  it("does not mutate input", () => {
    const o = createInitialOrientations(3);
    const result = setCenterOrientation(o, 0, 3, 3);
    expect(o[4]).toBe(0);
    expect(result[4]).toBe(3);
  });
});
