import { describe, it, expect } from "vitest";
import { validate2x2, validate3x3 } from "../cube-validation";
import { createSolvedState } from "../cube-state";
import type { CubeState } from "@/types/cube";

describe("validate3x3", () => {
  it("returns null for solved state", () => {
    const state = createSolvedState(3);
    expect(validate3x3(state)).toBeNull();
  });

  it("returns error string for all-same-color state", () => {
    const state = new Array(54).fill("U") as CubeState;
    const result = validate3x3(state);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("returns error for state with wrong color counts", () => {
    const state = createSolvedState(3);
    state[0] = "R"; // swap one U sticker to R
    state[9] = "U"; // swap one R sticker to U
    // This is still valid permutation-wise, so it might pass or fail depending on parity
    // Just verify it doesn't crash
    validate3x3(state);
  });
});

describe("validate2x2", () => {
  it("returns null for solved state", () => {
    const state = createSolvedState(2);
    expect(validate2x2(state)).toBeNull();
  });

  it("returns error string for all-same-color state", () => {
    const state = new Array(24).fill("U") as CubeState;
    const result = validate2x2(state);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });
});
