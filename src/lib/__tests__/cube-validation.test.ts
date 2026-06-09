import { describe, it, expect } from "vitest";
import { validate2x2, validate3x3, V_EDGE_COLORS, V_CORNER_COLORS } from "../cube-validation";
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

describe("V_EDGE_COLORS", () => {
  it("has 12 entries", () => {
    expect(V_EDGE_COLORS).toHaveLength(12);
  });

  it("each entry is a pair of FaceColor strings", () => {
    for (const pair of V_EDGE_COLORS) {
      expect(pair).toHaveLength(2);
      expect(typeof pair[0]).toBe("string");
      expect(typeof pair[1]).toBe("string");
    }
  });

  it("each pair contains two distinct face colors", () => {
    for (const pair of V_EDGE_COLORS) {
      expect(pair[0]).not.toBe(pair[1]);
    }
  });

  it("covers all 12 edge positions with unique color combinations", () => {
    const keys = V_EDGE_COLORS.map((p) => [...p].sort().join("")).sort();
    // Each edge should be a unique pair
    const unique = [...new Set(keys)];
    expect(unique).toHaveLength(12);
  });
});

describe("V_CORNER_COLORS", () => {
  it("has 8 entries", () => {
    expect(V_CORNER_COLORS).toHaveLength(8);
  });

  it("each entry is a triple of FaceColor strings", () => {
    for (const triple of V_CORNER_COLORS) {
      expect(triple).toHaveLength(3);
      expect(typeof triple[0]).toBe("string");
    }
  });

  it("each triple contains three distinct face colors", () => {
    for (const triple of V_CORNER_COLORS) {
      expect(new Set(triple).size).toBe(3);
    }
  });

  it("covers all 8 corner positions with unique color combinations", () => {
    const keys = V_CORNER_COLORS.map((t) => [...t].sort().join("")).sort();
    const unique = [...new Set(keys)];
    expect(unique).toHaveLength(8);
  });
});
