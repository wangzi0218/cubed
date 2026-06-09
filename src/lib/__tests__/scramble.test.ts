import { describe, it, expect } from "vitest";
import { generateScramble } from "../scramble";

describe("generateScramble", () => {
  it("returns 20 moves for 3x3", () => {
    const scramble = generateScramble(3);
    const moves = scramble.split(/\s+/);
    expect(moves).toHaveLength(20);
  });

  it("returns 11 moves for 2x2", () => {
    const scramble = generateScramble(2);
    const moves = scramble.split(/\s+/);
    expect(moves).toHaveLength(11);
  });

  it("each move matches valid notation pattern", () => {
    const scramble = generateScramble(3);
    const moves = scramble.split(/\s+/);
    for (const move of moves) {
      expect(move).toMatch(/^[UDLRFB]['2]?$/);
    }
  });

  it("no two consecutive moves on the same face", () => {
    const scramble = generateScramble(3);
    const moves = scramble.split(/\s+/);
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i][0]).not.toBe(moves[i - 1][0]);
    }
  });

  it("no redundant face-opposite-face sequences", () => {
    const opposite: Record<string, string> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
    const scramble = generateScramble(3);
    const moves = scramble.split(/\s+/);
    for (let i = 2; i < moves.length; i++) {
      const current = moves[i][0];
      const prev = moves[i - 1][0];
      const prevPrev = moves[i - 2][0];
      // Should not have pattern: A, opposite(A), A
      if (opposite[prev] === current && prevPrev === current) {
        expect.fail(`Redundant sequence at position ${i}: ${prevPrev} ${prev} ${current}`);
      }
    }
  });

  it("generates different scrambles on repeated calls", () => {
    const scrambles = new Set<string>();
    for (let i = 0; i < 10; i++) {
      scrambles.add(generateScramble(3));
    }
    // With 20 random moves, collisions are extremely unlikely
    expect(scrambles.size).toBeGreaterThan(1);
  });
});
