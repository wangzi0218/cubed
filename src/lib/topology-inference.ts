import type { FaceColor, CubeSize, CubeState } from "@/types/cube";
import { V_EDGE_COLORS, V_CORNER_COLORS } from "@/lib/cube-validation";

// ── Public types ────────────────────────────────────────────────────────────

export interface EdgePhoto {
  colors: [FaceColor, FaceColor];
  face1: FaceColor;
  face2: FaceColor;
}

export interface CornerPhoto {
  colors: [FaceColor, FaceColor, FaceColor];
  face1: FaceColor;
  face2: FaceColor;
  face3: FaceColor;
}

export interface CubeTopology {
  edges: EdgePhoto[];
  corners: CornerPhoto[];
}

// ── Index tables (3x3) ─────────────────────────────────────────────────────
// Face offsets: U=0  R=9  F=18  D=27  L=36  B=45
// Each face has 9 facelets in row-major order.

const EDGE_FACE_INDICES: [number, number][] = [
  [5, 10],  [7, 19],  [3, 37],  [1, 46],   // UR  UF  UL  UB
  [32, 16], [28, 25], [30, 43], [34, 52],   // DR  DF  DL  DB
  [23, 12], [21, 41], [50, 39], [48, 14],   // FR  FL  BL  BR
];

const CORNER_FACE_INDICES: [number, number, number][] = [
  [8, 9, 20],    // URF
  [6, 18, 38],   // UFL
  [0, 36, 47],   // ULB
  [2, 45, 11],   // UBR
  [29, 26, 15],  // DFR
  [27, 44, 24],  // DLF
  [33, 53, 42],  // DBL
  [35, 17, 51],  // DRB
];

// ── 2x2 corner index table ─────────────────────────────────────────────────
// 2x2 faces: U=0  R=4  F=8  D=12  L=16  B=20
// Each face has 4 facelets.  The 3x3→2x2 corner mapping is:
//   3x3 pos 0 → 2x2 pos 0,  3x3 pos 2 → 2x2 pos 1,
//   3x3 pos 6 → 2x2 pos 2,  3x3 pos 8 → 2x2 pos 3.
const CORNER_FACE_INDICES_2X2: [number, number, number][] = [
  [3, 4, 9],     // URF
  [2, 8, 17],    // UFL
  [0, 16, 21],   // ULB
  [1, 20, 5],    // UBR
  [13, 11, 6],   // DFR
  [12, 19, 10],  // DLF
  [14, 23, 18],  // DBL
  [15, 7, 22],   // DRB
];

// ── Canonical face labels for each position ────────────────────────────────

export const EDGE_POSITION_FACES: [FaceColor, FaceColor][] = [
  ["U", "R"], ["U", "F"], ["U", "L"], ["U", "B"],
  ["D", "R"], ["D", "F"], ["D", "L"], ["D", "B"],
  ["F", "R"], ["F", "L"], ["B", "L"], ["B", "R"],
];

export const CORNER_POSITION_FACES: [FaceColor, FaceColor, FaceColor][] = [
  ["U", "R", "F"], ["U", "F", "L"], ["U", "L", "B"], ["U", "B", "R"],
  ["D", "F", "R"], ["D", "L", "F"], ["D", "B", "L"], ["D", "R", "B"],
];

// ── Helpers ────────────────────────────────────────────────────────────────

function sortColors(colors: string[]): string {
  return [...colors].sort().join("");
}

function findEdgePiece(c1: FaceColor, c2: FaceColor): number {
  const key = sortColors([c1, c2]);
  for (let i = 0; i < V_EDGE_COLORS.length; i++) {
    if (sortColors(V_EDGE_COLORS[i]) === key) return i;
  }
  return -1;
}

function findCornerPiece(
  c1: FaceColor,
  c2: FaceColor,
  c3: FaceColor
): number {
  const key = sortColors([c1, c2, c3]);
  for (let i = 0; i < V_CORNER_COLORS.length; i++) {
    if (sortColors(V_CORNER_COLORS[i]) === key) return i;
  }
  return -1;
}

/**
 * Determine the index within a given face position's facelet list
 * where the photo color should land.
 *
 * For an edge photo (color1 on face1 side, color2 on face2 side):
 *   - We know which canonical piece it is and its canonical color order.
 *   - If color1 matches the canonical color for face1, orientation is "normal"
 *     and we place color1 at the face1 index, color2 at the face2 index.
 *   - Otherwise the piece is flipped.
 *
 * For a corner photo the same logic applies with 3 colors.
 */
function placeEdge(
  state: FaceColor[],
  photo: EdgePhoto,
  posIdx: number,
  size: CubeSize
): void {
  const pieceIdx = findEdgePiece(photo.colors[0], photo.colors[1]);
  if (pieceIdx < 0) return; // unrecognised colour pair — skip

  const canonical = V_EDGE_COLORS[pieceIdx];

  if (size === 3) {
    const [idx1, idx2] = EDGE_FACE_INDICES[posIdx];
    // photo.colors[0] sits on face1 side, photo.colors[1] on face2 side.
    // We need to check which canonical colour belongs to face1.
    const canonicalFace1Color = canonical[0]; // first entry in V_EDGE_COLORS is the "face1" colour

    if (photo.face1 === EDGE_POSITION_FACES[posIdx][0]) {
      // photo.face1 matches position face1 — direct mapping
      if (photo.colors[0] === canonicalFace1Color) {
        state[idx1] = photo.colors[0];
        state[idx2] = photo.colors[1];
      } else {
        // piece is flipped relative to canonical
        state[idx1] = photo.colors[1];
        state[idx2] = photo.colors[0];
      }
    } else {
      // photo faces are swapped relative to position faces
      if (photo.colors[0] === canonicalFace1Color) {
        state[idx2] = photo.colors[0];
        state[idx1] = photo.colors[1];
      } else {
        state[idx2] = photo.colors[1];
        state[idx1] = photo.colors[0];
      }
    }
  }
  // 2x2 has no edges
}

function placeCorner(
  state: FaceColor[],
  photo: CornerPhoto,
  posIdx: number,
  size: CubeSize
): void {
  const pieceIdx = findCornerPiece(
    photo.colors[0],
    photo.colors[1],
    photo.colors[2]
  );
  if (pieceIdx < 0) return;

  const indices =
    size === 3
      ? CORNER_FACE_INDICES[posIdx]
      : CORNER_FACE_INDICES_2X2[posIdx];

  // The photo gives us (color1, color2, color3) corresponding to
  // (face1, face2, face3) of the photo.
  // The position defines (posFace1, posFace2, posFace3).
  // We need to map photo colors to position face indices.

  const posFaces = CORNER_POSITION_FACES[posIdx];

  // Build a map: position face → photo color
  const faceToColor = new Map<FaceColor, FaceColor>();
  faceToColor.set(photo.face1, photo.colors[0]);
  faceToColor.set(photo.face2, photo.colors[1]);
  faceToColor.set(photo.face3, photo.colors[2]);

  // Place each position face's color at the correct index
  state[indices[0]] = faceToColor.get(posFaces[0]) ?? state[indices[0]];
  state[indices[1]] = faceToColor.get(posFaces[1]) ?? state[indices[1]];
  state[indices[2]] = faceToColor.get(posFaces[2]) ?? state[indices[2]];
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Infer a complete CubeState from photographed edge / corner intersections.
 *
 * For 3x3: expects up to 12 edges + 8 corners.
 * For 2x2: expects 8 corners only (edges are ignored).
 *
 * Centre stickers are always set to the face's own colour.
 * Any sticker not covered by a photo defaults to 'U' — callers should
 * verify the result with validateState / validate3x3 / validate2x2.
 */
export function inferCubeState(
  topology: CubeTopology,
  size: CubeSize
): CubeState {
  const FACES: FaceColor[] = ["U", "R", "F", "D", "L", "B"];
  const stickersPerFace = size * size;
  const total = 6 * stickersPerFace;
  const state: FaceColor[] = new Array(total).fill("U") as FaceColor[];

  // Fill centre stickers (3x3 only — 2x2 has no centre)
  if (size === 3) {
    for (let f = 0; f < 6; f++) {
      state[f * 9 + 4] = FACES[f];
    }
  }

  // Place edges (3x3 only)
  if (size === 3) {
    for (const edge of topology.edges) {
      const posIdx = EDGE_POSITION_FACES.findIndex(
        ([f1, f2]) => f1 === edge.face1 && f2 === edge.face2
      );
      if (posIdx >= 0) {
        placeEdge(state, edge, posIdx, size);
      }
    }
  }

  // Place corners
  for (const corner of topology.corners) {
    const posIdx = CORNER_POSITION_FACES.findIndex(
      ([f1, f2, f3]) =>
        f1 === corner.face1 && f2 === corner.face2 && f3 === corner.face3
    );
    if (posIdx >= 0) {
      placeCorner(state, corner, posIdx, size);
    }
  }

  return state;
}
