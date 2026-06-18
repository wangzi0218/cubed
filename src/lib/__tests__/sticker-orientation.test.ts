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
  it("R: rotates R face +1, and applies cross-face deltas to edge stickers", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "R", 3);

    // R face (idx 1): all 9 stickers get +1
    for (let i = 9; i < 18; i++) {
      expect(result[i]).toBe(1);
    }
    // Cross-face cycle [3,1,0,0]: F→U delta 3, U→B delta 1, B→D delta 0, D→F delta 0
    // F right col (20,23,26): sticker from D, D→F delta 0 → 0
    expect(result[20]).toBe(0);
    expect(result[23]).toBe(0);
    expect(result[26]).toBe(0);
    // U right col (2,5,8): sticker from F, F→U delta 3 → 3
    expect(result[2]).toBe(3);
    expect(result[5]).toBe(3);
    expect(result[8]).toBe(3);
    // B left col (51,48,45): sticker from U, U→B delta 1 → 1
    expect(result[51]).toBe(1);
    expect(result[48]).toBe(1);
    expect(result[45]).toBe(1);
    // D right col (29,32,35): sticker from B, B→D delta 0 → 0
    expect(result[29]).toBe(0);
    expect(result[32]).toBe(0);
    expect(result[35]).toBe(0);

    // Non-edge stickers on other faces are untouched
    expect(result[0]).toBe(0);  // U top-left
    expect(result[4]).toBe(0);  // U center
    expect(result[18]).toBe(0); // F top-left
  });

  it("rotates CCW by +3", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "U'", 3);
    // U face: all +3
    for (let i = 0; i < 9; i++) {
      expect(result[i]).toBe(3);
    }
  });

  it("rotates half turn by +2", () => {
    const o = createInitialOrientations(3);
    const result = applyOrientationMove(o, "F2", 3);
    // F face: all +2
    for (let i = 18; i < 27; i++) {
      expect(result[i]).toBe(2);
    }
  });

  it("4 CW rotations on R return R face to 0", () => {
    let o = createInitialOrientations(3);
    for (let i = 0; i < 4; i++) {
      o = applyOrientationMove(o, "R", 3);
    }
    // R face center (13) is not in cross-face cycle: 4 * +1 = 0
    expect(o[13]).toBe(0);
    // R face stickers (9-17) are NOT in cross-face cycle.
    // They only get face delta +1 per move: 4 * +1 = 4 ≡ 0
    for (let i = 9; i < 18; i++) {
      expect(o[i]).toBe(0);
    }
  });

  it("accumulates correctly with cross-face cycles", () => {
    let o = createInitialOrientations(3);
    o = applyOrientationMove(o, "D", 3);    // D CW: face +1
    o = applyOrientationMove(o, "D", 3);    // D CW: face +1
    o = applyOrientationMove(o, "D'", 3);   // D CCW: face +3
    // D face center (31): 1+1+3 = 5 ≡ 1
    expect(o[31]).toBe(1);
    // D face corners not in cross cycle: same as center
    expect(o[27]).toBe(1);
    expect(o[33]).toBe(1);
    // D edge stickers (29,32,35) cycled through F→L→B→R→F:
    // after 3 moves they returned to D with accumulated delta 1
    expect(o[29]).toBe(1);
    expect(o[32]).toBe(1);
    expect(o[35]).toBe(1);
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
      // Face stickers all get +1
      for (let i = start; i < start + 9; i++) {
        expect(result[i]).toBe(1);
      }
    }
  });

  it("handles 2x2 size", () => {
    const o = createInitialOrientations(2);
    const result = applyOrientationMove(o, "R", 2);
    // R face (idx 1): all 4 stickers get +1
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
      { notation: "R", face: "R", direction: "" },
      { notation: "U", face: "U", direction: "" },
    ];
    const results = applyOrientationMoves(o, moves, 3);
    expect(results).toHaveLength(2);
    // After R: R face center = 1
    expect(results[0][13]).toBe(1);
    // After U: U face center = 1, R face center still = 1
    expect(results[1][4]).toBe(1);
    expect(results[1][13]).toBe(1);
  });

  it("returns empty array for no moves", () => {
    const o = createInitialOrientations(3);
    expect(applyOrientationMoves(o, [], 3)).toEqual([]);
  });
});

describe("getCenterOrientations", () => {
  it("extracts 6 center values for 3x3", () => {
    const o = createInitialOrientations(3);
    o[4] = 1;  // U center
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
    expect(result[4]).toBe(2);
    expect(result[0]).toBe(0);
  });

  it("wraps value mod 4", () => {
    const o = createInitialOrientations(3);
    const result = setCenterOrientation(o, 1, 5, 3);
    expect(result[13]).toBe(1);
  });

  it("does not mutate input", () => {
    const o = createInitialOrientations(3);
    const result = setCenterOrientation(o, 0, 3, 3);
    expect(o[4]).toBe(0);
    expect(result[4]).toBe(3);
  });
});
