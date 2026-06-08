// Face colors - standard Rubik's cube notation
export type FaceColor = "U" | "D" | "L" | "R" | "F" | "B";

// Face display info
export const FACE_COLORS: Record<FaceColor, { label: string; hex: string }> = {
  U: { label: "White", hex: "#ffffff" },
  D: { label: "Yellow", hex: "#ffd500" },
  L: { label: "Orange", hex: "#ff5800" },
  R: { label: "Red", hex: "#b71234" },
  F: { label: "Blue", hex: "#0046ad" },
  B: { label: "Green", hex: "#009b48" },
};

export const FACE_ORDER: FaceColor[] = ["U", "R", "F", "D", "L", "B"];

// Cube size
export type CubeSize = 2 | 3;

// Move direction
export type MoveDirection = "" | "'" | "2";

// A single move like R, U', F2
export interface Move {
  face: FaceColor;
  direction: MoveDirection;
  notation: string;
}

// Cube state as a flat array of 54 (3x3) or 24 (2x2) face colors
// Index mapping follows standard cubejs convention:
// 3x3: 54 stickers, 9 per face, faces in order U R F D L B
// 2x2: 24 stickers, 4 per face
export type CubeState = FaceColor[];

// Solution step
export interface SolutionStep {
  index: number;
  move: Move;
  stateAfter: CubeState;
}

// App flow state
export type InputMethod = "color" | "pattern" | "topology" | "manual";
export type AppStep =
  | "home"
  | "cube-type"
  | "input-method"
  | "input"
  | "scramble"
  | "solution"
  | "learn";
