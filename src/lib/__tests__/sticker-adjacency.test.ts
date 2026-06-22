import { describe, it, expect } from "vitest";
import {
  getRelatedStickers,
  getPieceType,
  getNeighbors,
} from "../sticker-adjacency";

describe("getPieceType", () => {
  it("3×3: identifies center stickers", () => {
    // U center = index 4
    expect(getPieceType(4, 3)).toBe("center");
    // R center = index 13
    expect(getPieceType(13, 3)).toBe("center");
  });

  it("3×3: identifies edge stickers", () => {
    // UR edge: U:pos5 = index 5
    expect(getPieceType(5, 3)).toBe("edge");
    // UF edge: U:pos7 = index 7
    expect(getPieceType(7, 3)).toBe("edge");
    // FR edge: F:pos5 = index 23
    expect(getPieceType(23, 3)).toBe("edge");
  });

  it("3×3: identifies corner stickers", () => {
    // URF corner: U:pos8 = index 8
    expect(getPieceType(8, 3)).toBe("corner");
    // URF corner: R:pos0 = index 9
    expect(getPieceType(9, 3)).toBe("corner");
    // URF corner: F:pos2 = index 20
    expect(getPieceType(20, 3)).toBe("corner");
  });

  it("2×2: all stickers are corners", () => {
    for (let i = 0; i < 24; i++) {
      expect(getPieceType(i, 2)).toBe("corner");
    }
  });
});

describe("getRelatedStickers", () => {
  it("3×3: corner piece returns 3 related stickers", () => {
    const related = getRelatedStickers(8, 3); // URF corner
    expect(related).toHaveLength(3);
    expect(related).toContain(8);  // U:pos8
    expect(related).toContain(9);  // R:pos0
    expect(related).toContain(20); // F:pos2
  });

  it("3×3: edge piece returns 2 related stickers", () => {
    const related = getRelatedStickers(5, 3); // UR edge
    expect(related).toHaveLength(2);
    expect(related).toContain(5);  // U:pos5
    expect(related).toContain(10); // R:pos1
  });

  it("3×3: center piece returns 1 (only itself)", () => {
    const related = getRelatedStickers(4, 3); // U center
    expect(related).toHaveLength(1);
    expect(related).toContain(4);
  });

  it("2×2: corner piece returns 3 related stickers", () => {
    const related = getRelatedStickers(3, 2); // URF corner
    expect(related).toHaveLength(3);
    expect(related).toContain(3);  // U:pos3
    expect(related).toContain(4);  // R:pos0
    expect(related).toContain(9);  // F:pos1
  });

  it("all neighbors are bidirectional", () => {
    // If A is related to B, then B should be related to A
    for (let i = 0; i < 54; i++) {
      const related = getRelatedStickers(i, 3);
      for (const j of related) {
        if (j !== i) {
          expect(getRelatedStickers(j, 3)).toContain(i);
        }
      }
    }
  });
});

describe("getNeighbors", () => {
  it("3×3: corner returns 2 neighbors", () => {
    const neighbors = getNeighbors(8, 3); // URF corner
    expect(neighbors).toHaveLength(2);
    expect(neighbors).not.toContain(8);
    expect(neighbors).toContain(9);
    expect(neighbors).toContain(20);
  });

  it("3×3: edge returns 1 neighbor", () => {
    const neighbors = getNeighbors(5, 3); // UR edge
    expect(neighbors).toHaveLength(1);
    expect(neighbors).not.toContain(5);
    expect(neighbors).toContain(10);
  });

  it("3×3: center returns empty array", () => {
    const neighbors = getNeighbors(4, 3); // U center
    expect(neighbors).toHaveLength(0);
  });
});

describe("adjacency consistency", () => {
  it("every sticker belongs to exactly one piece", () => {
    // Each sticker should be in exactly one piece (no overlaps)
    const seen = new Set<number>();
    // Check 3×3 edges
    for (const edge of [
      [5, 10], [7, 19], [3, 37], [1, 46],
      [32, 16], [28, 25], [30, 43], [34, 52],
      [23, 12], [21, 41], [50, 39], [48, 14],
    ]) {
      for (const idx of edge) {
        expect(seen.has(idx)).toBe(false);
        seen.add(idx);
      }
    }
    // Check 3×3 corners
    for (const corner of [
      [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
      [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
    ]) {
      for (const idx of corner) {
        expect(seen.has(idx)).toBe(false);
        seen.add(idx);
      }
    }
    // Remaining are centers (6 per face × 6 faces = 36 centers)
    // 54 total - 24 edge stickers - 24 corner stickers = 6 centers ✓
    expect(seen.size).toBe(48); // 24 edge + 24 corner stickers
  });

  it("center stickers are not in any edge or corner", () => {
    const centers = [4, 13, 22, 31, 40, 49]; // 6 centers for 3×3
    for (const c of centers) {
      expect(getPieceType(c, 3)).toBe("center");
      expect(getNeighbors(c, 3)).toHaveLength(0);
    }
  });
});
