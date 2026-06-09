import type { CubeSize, CubeState, FaceColor } from "@/types/cube";

const FACES: FaceColor[] = ["U", "R", "F", "D", "L", "B"];

/**
 * Create a solved cube state string for the given size.
 * For 3x3: 54 characters (9 per face), faces in order U R F D L B
 * For 2x2: 24 characters (4 per face)
 */
export function createSolvedState(size: CubeSize): CubeState {
  const stickersPerFace = size * size;
  const state: FaceColor[] = [];
  for (const face of FACES) {
    for (let i = 0; i < stickersPerFace; i++) {
      state.push(face);
    }
  }
  return state;
}

/**
 * Convert a state array to a string for the solver.
 */
export function stateToString(state: CubeState): string {
  return state.join("");
}

/**
 * Parse a state string to an array.
 */
export function stringToState(str: string): CubeState {
  return str.split("") as FaceColor[];
}

/**
 * Validate that a state has the right number of each color.
 */
export function validateState(state: CubeState, size: CubeSize): boolean {
  const expected = size * size;
  const counts: Record<string, number> = {};
  for (const c of state) {
    counts[c] = (counts[c] || 0) + 1;
  }
  return FACES.every((f) => (counts[f] || 0) === expected);
}

/**
 * Get sticker index for a given face and position.
 * Face order: U(0) R(1) F(2) D(3) L(4) B(5)
 * Position: row-major within each face
 */
export function getStickerIndex(
  face: FaceColor,
  pos: number,
  size: CubeSize
): number {
  const faceIdx = FACES.indexOf(face);
  return faceIdx * size * size + pos;
}

/**
 * Get the color at a specific face and position.
 */
export function getSticker(
  state: CubeState,
  face: FaceColor,
  pos: number,
  size: CubeSize
): FaceColor {
  return state[getStickerIndex(face, pos, size)];
}

/**
 * Set the color at a specific face and position (returns new state).
 */
export function setSticker(
  state: CubeState,
  face: FaceColor,
  pos: number,
  color: FaceColor,
  size: CubeSize
): CubeState {
  const newState = [...state];
  newState[getStickerIndex(face, pos, size)] = color;
  return newState;
}

/**
 * Map a 2x2 state (24 stickers) to a 3x3 state string (54 characters).
 * Corner stickers are placed at 3x3 corner positions; edge and center
 * positions are filled with the face's own color.
 */
export function map2x2To3x3(state2: CubeState): string {
  const faces = ["U", "R", "F", "D", "L", "B"] as const;
  const result: string[] = new Array(54).fill("");

  for (let f = 0; f < 6; f++) {
    const offset3x3 = f * 9;
    const offset2x2 = f * 4;

    result[offset3x3 + 0] = state2[offset2x2 + 0];
    result[offset3x3 + 2] = state2[offset2x2 + 1];
    result[offset3x3 + 6] = state2[offset2x2 + 2];
    result[offset3x3 + 8] = state2[offset2x2 + 3];
    result[offset3x3 + 4] = faces[f];

    result[offset3x3 + 1] = faces[f];
    result[offset3x3 + 3] = faces[f];
    result[offset3x3 + 5] = faces[f];
    result[offset3x3 + 7] = faces[f];
  }

  return result.join("");
}
