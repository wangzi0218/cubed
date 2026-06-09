import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock rubik-solver (WASM too slow for unit tests) ───────────────────

let cubeInternalState: string;

const mockMove = vi.fn((notation: string) => {
  cubeInternalState += `:${notation}`;
});
const mockAsString = vi.fn(() => cubeInternalState);
const mockIsSolved = vi.fn(() => false);

vi.mock("rubik-solver", () => ({
  Cube: {
    fromString: vi.fn((s: string) => {
      cubeInternalState = s;
      return {
        move: mockMove,
        asString: mockAsString,
        isSolved: mockIsSolved,
      };
    }),
  },
  initSolver: vi.fn(),
  solve: vi.fn(() => "R U F"),
}));

import { parseMoves, applyMove, applyMoves } from "../solver";
import { Cube } from "rubik-solver";
import { createSolvedState } from "../cube-state";

describe("parseMoves", () => {
  it("returns empty array for empty string", () => {
    expect(parseMoves("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseMoves("   ")).toEqual([]);
  });

  it("parses single move R", () => {
    const moves = parseMoves("R");
    expect(moves).toHaveLength(1);
    expect(moves[0].face).toBe("R");
    expect(moves[0].direction).toBe("");
    expect(moves[0].notation).toBe("R");
  });

  it("parses prime move U'", () => {
    const moves = parseMoves("U'");
    expect(moves).toHaveLength(1);
    expect(moves[0].face).toBe("U");
    expect(moves[0].direction).toBe("'");
    expect(moves[0].notation).toBe("U'");
  });

  it("parses double move F2", () => {
    const moves = parseMoves("F2");
    expect(moves).toHaveLength(1);
    expect(moves[0].face).toBe("F");
    expect(moves[0].direction).toBe("2");
    expect(moves[0].notation).toBe("F2");
  });

  it("parses multiple moves", () => {
    const moves = parseMoves("R U F");
    expect(moves).toHaveLength(3);
    expect(moves[0].face).toBe("R");
    expect(moves[1].face).toBe("U");
    expect(moves[2].face).toBe("F");
  });

  it("handles extra whitespace", () => {
    const moves = parseMoves("  R   U  F  ");
    expect(moves).toHaveLength(3);
  });

  it("parses mixed notation", () => {
    const moves = parseMoves("R' U2 F D'");
    expect(moves).toHaveLength(4);
    expect(moves[0]).toEqual({ face: "R", direction: "'", notation: "R'" });
    expect(moves[1]).toEqual({ face: "U", direction: "2", notation: "U2" });
    expect(moves[2]).toEqual({ face: "F", direction: "", notation: "F" });
    expect(moves[3]).toEqual({ face: "D", direction: "'", notation: "D'" });
  });
});

// ── applyMove ──────────────────────────────────────────────────────────

describe("applyMove", () => {
  beforeEach(() => {
    mockMove.mockClear();
    mockAsString.mockClear();
  });

  it("creates Cube from state string and applies move", () => {
    const state = createSolvedState(3);
    applyMove(state, { face: "R", direction: "", notation: "R" });
    expect(Cube.fromString).toHaveBeenCalledWith(
      "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
    );
    expect(mockMove).toHaveBeenCalledWith("R");
  });

  it("returns the result of asString split into characters", () => {
    const state = createSolvedState(3);
    const result = applyMove(state, { face: "R", direction: "", notation: "R" });
    // Mock asString returns the tracked state string
    expect(result).toEqual(cubeInternalState.split(""));
  });
});

// ── applyMoves ─────────────────────────────────────────────────────────

describe("applyMoves", () => {
  beforeEach(() => {
    mockMove.mockClear();
    mockAsString.mockClear();
    (Cube.fromString as ReturnType<typeof vi.fn>).mockClear();
  });

  it("returns empty steps for empty moves", () => {
    const state = createSolvedState(3);
    const steps = applyMoves(state, []);
    expect(steps).toEqual([]);
  });

  it("returns one step per move with index and move info", () => {
    const state = createSolvedState(3);
    const moves = parseMoves("R U");
    const steps = applyMoves(state, moves);
    expect(steps).toHaveLength(2);
    expect(steps[0].index).toBe(0);
    expect(steps[0].move.notation).toBe("R");
    expect(steps[1].index).toBe(1);
    expect(steps[1].move.notation).toBe("U");
  });

  it("each step has stateAfter array", () => {
    const state = createSolvedState(3);
    const moves = parseMoves("R");
    const steps = applyMoves(state, moves);
    expect(steps[0].stateAfter).toBeDefined();
    expect(Array.isArray(steps[0].stateAfter)).toBe(true);
  });

  it("chains moves sequentially (Cube.fromString called per move)", () => {
    const state = createSolvedState(3);
    const moves = parseMoves("R U F");
    applyMoves(state, moves);
    expect(Cube.fromString).toHaveBeenCalledTimes(3);
    expect(mockMove).toHaveBeenCalledTimes(3);
  });
});
