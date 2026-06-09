import type { CubeSize, Move } from "@/types/cube";

export type StickerOrientations = number[];

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;

// Rotation delta per direction (mod 4)
// CW (e.g. R): +1, CCW (e.g. R'): +3, Half (e.g. R2): +2
const DIR_DELTA: Record<string, number> = {
  "": 1,
  "'": 3,
  "2": 2,
};

/**
 * Create an orientation array with all stickers at 0° rotation.
 */
export function createInitialOrientations(size: CubeSize): StickerOrientations {
  return new Array(6 * size * size).fill(0);
}

/**
 * Apply a single move's orientation delta to the orientation array.
 *
 * When a face is turned, all stickers on that face rotate by the same delta
 * (the face is a rigid body). The position permutation is handled separately
 * by the solver's state tracking.
 */
export function applyOrientationMove(
  orientations: StickerOrientations,
  moveNotation: string,
  size: CubeSize = 3
): StickerOrientations {
  const face = moveNotation[0];
  const dir = moveNotation.slice(1);
  const delta = DIR_DELTA[dir] ?? 1;

  const faceIdx = FACE_ORDER.indexOf(face as (typeof FACE_ORDER)[number]);
  if (faceIdx < 0) return [...orientations]; // unknown move, return copy

  const stickersPerFace = size * size;
  const start = faceIdx * stickersPerFace;
  const result = [...orientations];

  for (let i = 0; i < stickersPerFace; i++) {
    result[start + i] = (orientations[start + i] + delta) % 4;
  }

  return result;
}

/**
 * Apply a sequence of moves, returning the orientation state after each move.
 */
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

/**
 * Extract the 6 center sticker orientations (one per face).
 * Face order: U, R, F, D, L, B
 */
export function getCenterOrientations(
  orientations: StickerOrientations,
  size: CubeSize = 3
): number[] {
  const stickersPerFace = size * size;
  const centerPos = Math.floor(stickersPerFace / 2); // position 4 for 3x3, 0 for 2x2
  return [
    orientations[0 * stickersPerFace + centerPos],
    orientations[1 * stickersPerFace + centerPos],
    orientations[2 * stickersPerFace + centerPos],
    orientations[3 * stickersPerFace + centerPos],
    orientations[4 * stickersPerFace + centerPos],
    orientations[5 * stickersPerFace + centerPos],
  ];
}

/**
 * Set a specific center orientation. Used by the CenterOrientationEditor.
 */
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
