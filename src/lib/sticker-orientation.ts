import type { CubeSize, Move } from "@/types/cube";

export type StickerOrientations = number[];

const DIR_DELTA: Record<string, number> = {
  "": 1,
  "'": 3,
  "2": 2,
};

// ── Cycle position helpers ──────────────────────────────────────────────────

function colIdx(col: number, row: number, size: number): number {
  return row * size + col;
}

function rightCol(faceIdx: number, size: number, reverse = false): number[] {
  const rows = Array.from({ length: size }, (_, r) => r);
  if (reverse) rows.reverse();
  return rows.map((r) => faceIdx * size * size + colIdx(size - 1, r, size));
}

function leftCol(faceIdx: number, size: number, reverse = false): number[] {
  const rows = Array.from({ length: size }, (_, r) => r);
  if (reverse) rows.reverse();
  return rows.map((r) => faceIdx * size * size + colIdx(0, r, size));
}

function topRow(faceIdx: number, size: number, reverse = false): number[] {
  const cols = Array.from({ length: size }, (_, c) => c);
  if (reverse) cols.reverse();
  return cols.map((c) => faceIdx * size * size + colIdx(c, 0, size));
}

function bottomRow(faceIdx: number, size: number, reverse = false): number[] {
  const cols = Array.from({ length: size }, (_, c) => c);
  if (reverse) cols.reverse();
  return cols.map((c) => faceIdx * size * size + colIdx(c, size - 1, size));
}

// ── Move cycle definitions ──────────────────────────────────────────────────
// Each cycle ONLY includes stickers from ADJACENT faces that move between faces.
// The turning face's own column/row is excluded (those stickers stay on the face
// and are handled by the face rotation delta).
//
// Cycle order: A→B→C→D→A. deltas[k] is the geometric rotation for group k→(k+1).
// The sum of deltas must be 0 mod 4 for the cycle to be self-consistent.

interface MoveCycle {
  faceIdx: number;
  crossCycles: { positions: number[]; deltas: number[] }[];
}

function buildMoveCycles(size: number): Record<string, MoveCycle> {
  return {
    R: {
      faceIdx: 1,
      crossCycles: [
        // F right col → U right col → B left col (rev) → D right col → F
        { positions: [...rightCol(2, size), ...rightCol(0, size), ...leftCol(5, size, true), ...rightCol(3, size)], deltas: [3, 1, 0, 0] },
      ],
    },
    L: {
      faceIdx: 4,
      crossCycles: [
        // F left col → D left col → B right col (rev) → U left col → F
        { positions: [...leftCol(2, size), ...leftCol(3, size), ...rightCol(5, size, true), ...leftCol(0, size)], deltas: [0, 2, 1, 1] },
      ],
    },
    U: {
      faceIdx: 0,
      crossCycles: [
        // F top row → R top row → B top row → L top row → F
        { positions: [...topRow(2, size), ...topRow(1, size), ...topRow(5, size), ...topRow(4, size)], deltas: [0, 2, 0, 2] },
      ],
    },
    D: {
      faceIdx: 3,
      crossCycles: [
        // F bottom row → L bottom row → B bottom row → R bottom row → F
        { positions: [...bottomRow(2, size), ...bottomRow(4, size), ...bottomRow(5, size), ...bottomRow(1, size)], deltas: [0, 2, 3, 3] },
      ],
    },
    F: {
      faceIdx: 2,
      crossCycles: [
        // U right col → R top row → D right col (rev) → L bottom row (rev) → U
        { positions: [...rightCol(0, size), ...topRow(1, size), ...rightCol(3, size, true), ...bottomRow(4, size, true)], deltas: [3, 1, 0, 0] },
      ],
    },
    B: {
      faceIdx: 5,
      crossCycles: [
        // U left col → L top row → D left col (rev) → R bottom row (rev) → U
        { positions: [...leftCol(0, size), ...topRow(4, size), ...leftCol(3, size, true), ...bottomRow(1, size, true)], deltas: [3, 1, 3, 1] },
      ],
    },
  };
}

const cycleCache = new Map<number, Record<string, MoveCycle>>();

function getMoveCycles(size: number): Record<string, MoveCycle> {
  if (!cycleCache.has(size)) {
    cycleCache.set(size, buildMoveCycles(size));
  }
  return cycleCache.get(size)!;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function createInitialOrientations(size: CubeSize): StickerOrientations {
  return new Array(6 * size * size).fill(0);
}

/**
 * Apply a single 90° rotation step to the orientation array.
 * This is the primitive operation — compound moves (R2, R') are built by
 * calling this multiple times, ensuring R2 = R×R and R' = R×R×R.
 */
function applySingleStep(
  orientations: StickerOrientations,
  cycle: MoveCycle,
  size: number
): StickerOrientations {
  const result = [...orientations];
  const crossPositions = new Set<number>();

  // 1. Cross-face cycle: each group moves one step forward with its geometric delta
  for (const { positions, deltas } of cycle.crossCycles) {
    const groupSize = positions.length / 4;
    for (let k = 0; k < 4; k++) {
      const fromBase = k * groupSize;
      const toBase = ((k + 1) % 4) * groupSize;
      for (let i = 0; i < groupSize; i++) {
        result[positions[toBase + i]] = (orientations[positions[fromBase + i]] + deltas[k]) % 4;
        crossPositions.add(positions[toBase + i]);
      }
    }
  }

  // 2. Face rotation: +1 to stickers that stay on the turned face
  const stickersPerFace = size * size;
  const start = cycle.faceIdx * stickersPerFace;
  for (let i = 0; i < stickersPerFace; i++) {
    const idx = start + i;
    if (!crossPositions.has(idx)) {
      result[idx] = (orientations[idx] + 1) % 4;
    }
  }

  return result;
}

export function applyOrientationMove(
  orientations: StickerOrientations,
  moveNotation: string,
  size: CubeSize = 3
): StickerOrientations {
  const face = moveNotation[0];
  const dir = moveNotation.slice(1);
  const steps = DIR_DELTA[dir] ?? 1; // CW=1 step, CCW=3 steps, Half=2 steps

  const moveCycles = getMoveCycles(size);
  const cycle = moveCycles[face];
  if (!cycle) return [...orientations];

  // Apply the single-step rotation `steps` times.
  // This ensures R2 = R×R (not a single step with doubled delta),
  // and R' = R×R×R (the inverse of R).
  let current = orientations;
  for (let s = 0; s < steps; s++) {
    current = applySingleStep(current, cycle, size);
  }
  return current;
}

export function applyOrientationMoves(
  initialOrientations: StickerOrientations,
  moves: Move[],
  size: CubeSize = 3
): StickerOrientations[] {
  const results: StickerOrientations[] = [];
  let current = initialOrientations;

  for (const move of moves) {
    current = applyOrientationMove(current, move.notation, size);
    results.push([...current]);
  }

  return results;
}

export function getCenterOrientations(
  orientations: StickerOrientations,
  size: CubeSize = 3
): number[] {
  const stickersPerFace = size * size;
  const centerPos = Math.floor(stickersPerFace / 2);
  return [
    orientations[0 * stickersPerFace + centerPos],
    orientations[1 * stickersPerFace + centerPos],
    orientations[2 * stickersPerFace + centerPos],
    orientations[3 * stickersPerFace + centerPos],
    orientations[4 * stickersPerFace + centerPos],
    orientations[5 * stickersPerFace + centerPos],
  ];
}

export function setCenterOrientation(
  orientations: StickerOrientations,
  faceIdx: number,
  value: number,
  size: CubeSize = 3
): StickerOrientations {
  const stickersPerFace = size * size;
  const centerPos = Math.floor(stickersPerFace / 2);
  const result = [...orientations];
  result[faceIdx * stickersPerFace + centerPos] = value % 4;
  return result;
}
