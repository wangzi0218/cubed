import { describe, it, expect } from "vitest";
import { inferCubeState } from "../topology-inference";
import type { CubeTopology } from "../topology-inference";

describe("inferCubeState", () => {
  it("returns 54 stickers for 3x3 with empty topology", () => {
    const topology: CubeTopology = { edges: [], corners: [] };
    const state = inferCubeState(topology, 3);
    expect(state).toHaveLength(54);
  });

  it("returns 24 stickers for 2x2 with empty topology", () => {
    const topology: CubeTopology = { edges: [], corners: [] };
    const state = inferCubeState(topology, 2);
    expect(state).toHaveLength(24);
  });

  it("sets center stickers correctly for 3x3", () => {
    const topology: CubeTopology = { edges: [], corners: [] };
    const state = inferCubeState(topology, 3);
    expect(state[4]).toBe("U");
    expect(state[13]).toBe("R");
    expect(state[22]).toBe("F");
    expect(state[31]).toBe("D");
    expect(state[40]).toBe("L");
    expect(state[49]).toBe("B");
  });

  it("defaults unfilled stickers to U", () => {
    const topology: CubeTopology = { edges: [], corners: [] };
    const state = inferCubeState(topology, 3);
    expect(state[0]).toBe("U");
    expect(state[1]).toBe("U");
  });

  it("places solved cube corners correctly", () => {
    const topology: CubeTopology = {
      edges: [],
      corners: [
        { colors: ["U", "R", "F"], face1: "U", face2: "R", face3: "F" },
        { colors: ["U", "F", "L"], face1: "U", face2: "F", face3: "L" },
        { colors: ["U", "L", "B"], face1: "U", face2: "L", face3: "B" },
        { colors: ["U", "B", "R"], face1: "U", face2: "B", face3: "R" },
        { colors: ["D", "F", "R"], face1: "D", face2: "F", face3: "R" },
        { colors: ["D", "L", "F"], face1: "D", face2: "L", face3: "F" },
        { colors: ["D", "B", "L"], face1: "D", face2: "B", face3: "L" },
        { colors: ["D", "R", "B"], face1: "D", face2: "R", face3: "B" },
      ],
    };
    const state = inferCubeState(topology, 3);
    expect(state[8]).toBe("U");
    expect(state[9]).toBe("R");
    expect(state[20]).toBe("F");
  });

  it("places solved cube edges correctly", () => {
    const topology: CubeTopology = {
      edges: [
        { colors: ["U", "R"], face1: "U", face2: "R" },
        { colors: ["U", "F"], face1: "U", face2: "F" },
        { colors: ["U", "L"], face1: "U", face2: "L" },
        { colors: ["U", "B"], face1: "U", face2: "B" },
        { colors: ["D", "R"], face1: "D", face2: "R" },
        { colors: ["D", "F"], face1: "D", face2: "F" },
        { colors: ["D", "L"], face1: "D", face2: "L" },
        { colors: ["D", "B"], face1: "D", face2: "B" },
        { colors: ["F", "R"], face1: "F", face2: "R" },
        { colors: ["F", "L"], face1: "F", face2: "L" },
        { colors: ["B", "L"], face1: "B", face2: "L" },
        { colors: ["B", "R"], face1: "B", face2: "R" },
      ],
      corners: [],
    };
    const state = inferCubeState(topology, 3);
    // UR edge: U at 5, R at 10
    expect(state[5]).toBe("U");
    expect(state[10]).toBe("R");
    // UF edge: U at 7, F at 19
    expect(state[7]).toBe("U");
    expect(state[19]).toBe("F");
    // FR edge: F at 23, R at 12
    expect(state[23]).toBe("F");
    expect(state[12]).toBe("R");
  });

  it("handles flipped edge (colors swapped relative to canonical)", () => {
    const topology: CubeTopology = {
      edges: [
        // UR edge with colors swapped relative to canonical order
        { colors: ["R", "U"], face1: "U", face2: "R" },
      ],
      corners: [],
    };
    const state = inferCubeState(topology, 3);
    // placeEdge normalizes: U goes to U-side index, R goes to R-side index
    expect(state[5]).toBe("U");
    expect(state[10]).toBe("R");
  });

  it("places 2x2 corners correctly", () => {
    const topology: CubeTopology = {
      edges: [],
      corners: [
        { colors: ["U", "R", "F"], face1: "U", face2: "R", face3: "F" },
        { colors: ["U", "F", "L"], face1: "U", face2: "F", face3: "L" },
        { colors: ["U", "L", "B"], face1: "U", face2: "L", face3: "B" },
        { colors: ["U", "B", "R"], face1: "U", face2: "B", face3: "R" },
        { colors: ["D", "F", "R"], face1: "D", face2: "F", face3: "R" },
        { colors: ["D", "L", "F"], face1: "D", face2: "L", face3: "F" },
        { colors: ["D", "B", "L"], face1: "D", face2: "B", face3: "L" },
        { colors: ["D", "R", "B"], face1: "D", face2: "R", face3: "B" },
      ],
    };
    const state = inferCubeState(topology, 2);
    expect(state).toHaveLength(24);
    // URF corner: U at index 3, R at 4, F at 9 (from CORNER_FACE_INDICES_2X2)
    expect(state[3]).toBe("U");
    expect(state[4]).toBe("R");
    expect(state[9]).toBe("F");
  });

  it("skips unrecognized edge color pairs", () => {
    const topology: CubeTopology = {
      edges: [
        { colors: ["U", "U"], face1: "U", face2: "R" }, // invalid pair
      ],
      corners: [],
    };
    const state = inferCubeState(topology, 3);
    // Should not crash, edge just gets skipped
    expect(state).toHaveLength(54);
  });

  it("skips unrecognized corner color triples", () => {
    const topology: CubeTopology = {
      edges: [],
      corners: [
        { colors: ["U", "U", "U"], face1: "U", face2: "R", face3: "F" }, // invalid
      ],
    };
    const state = inferCubeState(topology, 3);
    expect(state).toHaveLength(54);
  });
});
