import { describe, it, expect } from "vitest";
import { parseMoves } from "../solver";

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
