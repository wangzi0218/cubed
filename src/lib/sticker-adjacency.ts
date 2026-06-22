import type { CubeSize } from "@/types/cube";

// ── 3×3 edge piece index table ──────────────────────────────────────────────
// Each entry: [stickerIdx1, stickerIdx2] for one edge piece
const EDGE_INDICES_3X3: [number, number][] = [
  [5, 10],  [7, 19],  [3, 37],  [1, 46],   // UR  UF  UL  UB
  [32, 16], [28, 25], [30, 43], [34, 52],   // DR  DF  DL  DB
  [23, 12], [21, 41], [50, 39], [48, 14],   // FR  FL  BL  BR
];

// ── 3×3 corner piece index table ────────────────────────────────────────────
const CORNER_INDICES_3X3: [number, number, number][] = [
  [8, 9, 20],    // URF
  [6, 18, 38],   // UFL
  [0, 36, 47],   // ULB
  [2, 45, 11],   // UBR
  [29, 26, 15],  // DFR
  [27, 44, 24],  // DLF
  [33, 53, 42],  // DBL
  [35, 17, 51],  // DRB
];

// ── 2×2 corner piece index table ────────────────────────────────────────────
const CORNER_INDICES_2X2: [number, number, number][] = [
  [3, 4, 9],    // URF
  [2, 8, 17],   // UFL
  [0, 16, 21],  // ULB
  [1, 20, 5],   // UBR
  [13, 11, 6],  // DFR
  [12, 19, 10], // DLF
  [14, 23, 18], // DBL
  [15, 7, 22],  // DRB
];

// ── Build lookup maps ───────────────────────────────────────────────────────

function buildLookup(size: CubeSize) {
  const relatedMap = new Map<number, number[]>();
  const typeMap = new Map<number, "center" | "edge" | "corner">();

  const totalStickers = 6 * size * size;

  // Initialize all stickers as centers (no neighbors)
  for (let i = 0; i < totalStickers; i++) {
    relatedMap.set(i, [i]);
    typeMap.set(i, "center");
  }

  if (size === 3) {
    // Mark edge pieces
    for (const edge of EDGE_INDICES_3X3) {
      const related = [...edge];
      for (const idx of edge) {
        relatedMap.set(idx, related);
        typeMap.set(idx, "edge");
      }
    }
    // Mark corner pieces
    for (const corner of CORNER_INDICES_3X3) {
      const related = [...corner];
      for (const idx of corner) {
        relatedMap.set(idx, related);
        typeMap.set(idx, "corner");
      }
    }
  } else if (size === 2) {
    // 2×2 has only corners
    for (const corner of CORNER_INDICES_2X2) {
      const related = [...corner];
      for (const idx of corner) {
        relatedMap.set(idx, related);
        typeMap.set(idx, "corner");
      }
    }
  }

  return { relatedMap, typeMap };
}

const lookupCache = new Map<CubeSize, ReturnType<typeof buildLookup>>();

function getLookup(size: CubeSize) {
  if (!lookupCache.has(size)) {
    lookupCache.set(size, buildLookup(size));
  }
  return lookupCache.get(size)!;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get all stickers on the same physical piece as the given sticker (including itself).
 * For a corner piece: returns 3 stickers.
 * For an edge piece: returns 2 stickers.
 * For a center piece: returns 1 sticker (only itself).
 */
export function getRelatedStickers(stickerIndex: number, size: CubeSize): number[] {
  const { relatedMap } = getLookup(size);
  return relatedMap.get(stickerIndex) ?? [stickerIndex];
}

/**
 * Get the piece type of a sticker.
 */
export function getPieceType(
  stickerIndex: number,
  size: CubeSize
): "center" | "edge" | "corner" {
  const { typeMap } = getLookup(size);
  return typeMap.get(stickerIndex) ?? "center";
}

/**
 * Get neighbors of a sticker (excluding itself).
 * For a corner: returns 2 neighbors.
 * For an edge: returns 1 neighbor.
 * For a center: returns empty array.
 */
export function getNeighbors(
  stickerIndex: number,
  size: CubeSize
): number[] {
  return getRelatedStickers(stickerIndex, size).filter(
    (idx) => idx !== stickerIndex
  );
}
