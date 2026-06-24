// Face colors - standard Rubik's cube notation
export type FaceColor = "U" | "D" | "L" | "R" | "F" | "B";

// Face display info
export const FACE_COLORS: Record<FaceColor, { label: string; hex: string }> = {
  U: { label: "白色", hex: "#ffffff" },
  D: { label: "黄色", hex: "#ffd500" },
  L: { label: "橙色", hex: "#ff5800" },
  R: { label: "红色", hex: "#b71234" },
  F: { label: "蓝色", hex: "#0046ad" },
  B: { label: "绿色", hex: "#009b48" },
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

// Sticker orientation for pattern cubes — parallel to CubeState
// Each value is 0/1/2/3 representing 0°/90°/180°/270° CW rotation
export type StickerOrientations = number[];

// Solution step
export interface SolutionStep {
  index: number;
  move: Move;
  stateAfter: CubeState;
  orientationsAfter?: StickerOrientations;
}

// App flow state
export type InputMethod = "color" | "pattern" | "topology" | "manual";
export type AppStep =
  | "home"
  | "cube-type"
  | "input-method"
  | "input"
  | "solution";
