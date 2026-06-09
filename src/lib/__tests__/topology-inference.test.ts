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
    // Centers: U=4, R=13, F=22, D=31, L=40, B=49
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
    // Non-center stickers should default to U
    expect(state[0]).toBe("U");
    expect(state[1]).toBe("U");
  });

  it("places a solved cube corners correctly", () => {
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
    // URF corner: U at pos 8, R at pos 9, F at pos 20
    expect(state[8]).toBe("U");
    expect(state[9]).toBe("R");
    expect(state[20]).toBe("F");
  });
});
