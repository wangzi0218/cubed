import { describe, it, expect } from "vitest";
import {
  createSolvedState,
  validateState,
  stateToString,
  stringToState,
  getSticker,
  setSticker,
  map2x2To3x3,
} from "../cube-state";

describe("createSolvedState", () => {
  it("returns 24 stickers for 2x2", () => {
    const state = createSolvedState(2);
    expect(state).toHaveLength(24);
  });

  it("returns 54 stickers for 3x3", () => {
    const state = createSolvedState(3);
    expect(state).toHaveLength(54);
  });

  it("has 4 of each face color for 2x2", () => {
    const state = createSolvedState(2);
    const counts: Record<string, number> = {};
    for (const c of state) counts[c] = (counts[c] || 0) + 1;
    expect(counts).toEqual({ U: 4, R: 4, F: 4, D: 4, L: 4, B: 4 });
  });

  it("has 9 of each face color for 3x3", () => {
    const state = createSolvedState(3);
    const counts: Record<string, number> = {};
    for (const c of state) counts[c] = (counts[c] || 0) + 1;
    expect(counts).toEqual({ U: 9, R: 9, F: 9, D: 9, L: 9, B: 9 });
  });

  it("places faces in U R F D L B order for 3x3", () => {
    const state = createSolvedState(3);
    expect(state.slice(0, 9).every((c) => c === "U")).toBe(true);
    expect(state.slice(9, 18).every((c) => c === "R")).toBe(true);
    expect(state.slice(18, 27).every((c) => c === "F")).toBe(true);
    expect(state.slice(27, 36).every((c) => c === "D")).toBe(true);
    expect(state.slice(36, 45).every((c) => c === "L")).toBe(true);
    expect(state.slice(45, 54).every((c) => c === "B")).toBe(true);
  });
});

describe("validateState", () => {
  it("returns true for solved 3x3", () => {
    expect(validateState(createSolvedState(3), 3)).toBe(true);
  });

  it("returns true for solved 2x2", () => {
    expect(validateState(createSolvedState(2), 2)).toBe(true);
  });

  it("returns false for all-same-color state", () => {
    const state = new Array(54).fill("U");
    expect(validateState(state, 3)).toBe(false);
  });

  it("returns false for wrong-length state", () => {
    expect(validateState(new Array(10).fill("U"), 3)).toBe(false);
  });
});

describe("stateToString / stringToState", () => {
  it("round-trips correctly", () => {
    const state = createSolvedState(3);
    const str = stateToString(state);
    expect(str).toHaveLength(54);
    const back = stringToState(str);
    expect(back).toEqual(state);
  });

  it("joins without separator", () => {
    const state = createSolvedState(2);
    const str = stateToString(state);
    expect(str).toBe("UUUURRRRFFFFDDDDLLLLBBBB");
  });
});

describe("getSticker / setSticker", () => {
  it("gets sticker at correct position", () => {
    const state = createSolvedState(3);
    expect(getSticker(state, "U", 0, 3)).toBe("U");
    expect(getSticker(state, "R", 0, 3)).toBe("R");
    expect(getSticker(state, "F", 4, 3)).toBe("F");
  });

  it("setSticker returns new state without mutating", () => {
    const state = createSolvedState(3);
    const newState = setSticker(state, "U", 0, "R", 3);
    expect(newState[0]).toBe("R");
    expect(state[0]).toBe("U");
  });

  it("round-trips get/set", () => {
    const state = createSolvedState(3);
    const modified = setSticker(state, "D", 5, "L", 3);
    expect(getSticker(modified, "D", 5, 3)).toBe("L");
  });
});

describe("map2x2To3x3", () => {
  it("returns 54-char string", () => {
    const state2 = createSolvedState(2);
    const result = map2x2To3x3(state2);
    expect(result).toHaveLength(54);
  });

  it("maps solved 2x2 to solved 3x3", () => {
    const state2 = createSolvedState(2);
    const result = map2x2To3x3(state2);
    // Each face should have its own color at center
    expect(result[4]).toBe("U");  // U center
    expect(result[13]).toBe("R"); // R center
    expect(result[22]).toBe("F"); // F center
    expect(result[31]).toBe("D"); // D center
    expect(result[40]).toBe("L"); // L center
    expect(result[49]).toBe("B"); // B center
  });

  it("places corners at correct 3x3 positions", () => {
    const state2 = createSolvedState(2);
    const result = map2x2To3x3(state2);
    // U face corners: positions 0, 2, 6, 8
    expect(result[0]).toBe("U");
    expect(result[2]).toBe("U");
    expect(result[6]).toBe("U");
    expect(result[8]).toBe("U");
  });

  it("fills edges with face color", () => {
    const state2 = createSolvedState(2);
    const result = map2x2To3x3(state2);
    // U face edges: positions 1, 3, 5, 7
    expect(result[1]).toBe("U");
    expect(result[3]).toBe("U");
    expect(result[5]).toBe("U");
    expect(result[7]).toBe("U");
  });
});
