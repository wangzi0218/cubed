import type { CubeSize } from "@/types/cube";
import type { FaceColor } from "@/types/cube";

const FACES: FaceColor[] = ["U", "D", "R", "L", "F", "B"];
const DIRECTIONS = ["", "'", "2"] as const;

// Opposite face pairs: U↔D, R↔L, F↔B
const OPPOSITE: Record<FaceColor, FaceColor> = {
  U: "D",
  D: "U",
  R: "L",
  L: "R",
  F: "B",
  B: "F",
};

/**
 * Generate a random scramble notation string.
 * - 3x3: 20 moves (standard WCA scramble length)
 * - 2x2: 11 moves
 * No consecutive moves on the same face.
 * No redundant sequences like U D U (face, opposite, same face).
 */
export function generateScramble(size: CubeSize): string {
  const length = size === 2 ? 11 : 20;
  const moves: string[] = [];

  for (let i = 0; i < length; i++) {
    let face: FaceColor;
    let attempts = 0;

    do {
      face = FACES[Math.floor(Math.random() * FACES.length)];
      attempts++;
    } while (
      attempts < 50 &&
      (face === lastFace(moves) ||
        (face === secondToLastFace(moves) &&
          OPPOSITE[face] === lastFace(moves)))
    );

    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    moves.push(face + dir);
  }

  return moves.join(" ");
}

function lastFace(moves: string[]): FaceColor | null {
  if (moves.length === 0) return null;
  return moves[moves.length - 1][0] as FaceColor;
}

function secondToLastFace(moves: string[]): FaceColor | null {
  if (moves.length < 2) return null;
  return moves[moves.length - 2][0] as FaceColor;
}
