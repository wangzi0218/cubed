import type { CubeState } from "@/types/cube";
import { map2x2To3x3 } from "@/lib/cube-state";

// Corner facelet indices — same layout as rubik-solver's cornerFacelet
const V_CORNER_IDX: [number, number, number][] = [
  [8, 9, 20],    // URF
  [6, 18, 38],   // UFL
  [0, 36, 47],   // ULB
  [2, 45, 11],   // UBR
  [29, 26, 15],  // DFR
  [27, 44, 24],  // DLF
  [33, 53, 42],  // DBL
  [35, 17, 51],  // DRB
];

// Edge facelet indices
const V_EDGE_IDX: [number, number][] = [
  [5, 10], [7, 19], [3, 37], [1, 46],
  [32, 16], [28, 25], [30, 43], [34, 52],
  [23, 12], [21, 41], [50, 39], [48, 14],
];

// Canonical corner color sets (sorted for matching)
const V_CORNER_SETS = [
  ["F", "R", "U"], ["F", "L", "U"], ["B", "L", "U"], ["B", "R", "U"],
  ["D", "F", "R"], ["D", "F", "L"], ["D", "B", "L"], ["D", "B", "R"],
];

// Canonical edge color sets (sorted for matching)
const V_EDGE_SETS = [
  ["R", "U"], ["F", "U"], ["L", "U"], ["B", "U"],
  ["D", "R"], ["D", "F"], ["D", "L"], ["D", "B"],
  ["F", "R"], ["F", "L"], ["B", "L"], ["B", "R"],
];

// Canonical edge color order — must match rubik-solver's edgeColor exactly
export const V_EDGE_COLORS: [string, string][] = [
  ["U", "R"], ["U", "F"], ["U", "L"], ["U", "B"],
  ["D", "R"], ["D", "F"], ["D", "L"], ["D", "B"],
  ["F", "R"], ["F", "L"], ["B", "L"], ["B", "R"],
];

// Canonical corner color order — first color is the "primary" face
export const V_CORNER_COLORS: [string, string, string][] = [
  ["U", "R", "F"], ["U", "F", "L"], ["U", "L", "B"], ["U", "B", "R"],
  ["D", "F", "R"], ["D", "L", "F"], ["D", "B", "L"], ["D", "R", "B"],
];

function vFindCorner(stickers: string[]): number {
  const s = [...stickers].sort().join("");
  for (let j = 0; j < 8; j++) {
    if ([...V_CORNER_SETS[j]].sort().join("") === s) return j;
  }
  return -1;
}

function vFindEdge(stickers: string[]): number {
  const s = [...stickers].sort().join("");
  for (let j = 0; j < 12; j++) {
    if ([...V_EDGE_SETS[j]].sort().join("") === s) return j;
  }
  return -1;
}

export function validate2x2(state: CubeState): string | null {
  const mapped = map2x2To3x3(state).split("");
  let cornerOri = 0;

  for (let i = 0; i < 8; i++) {
    const stickers = V_CORNER_IDX[i].map((idx) => mapped[idx]);
    const piece = vFindCorner(stickers);
    if (piece < 0) return `角块 ${i + 1} 的颜色组合无效`;
    for (let k = 0; k < 3; k++) {
      if (stickers[k] === "U" || stickers[k] === "D") { cornerOri += k; break; }
    }
  }
  if (cornerOri % 3 !== 0) return "角块朝向总和无效";
  return null;
}

export function validate3x3(state: CubeState): string | null {
  const s = state as string[];
  let cornerOri = 0;
  let edgeOri = 0;
  const cp: number[] = [];
  const ep: number[] = [];

  for (let i = 0; i < 8; i++) {
    const stickers = V_CORNER_IDX[i].map((idx) => s[idx]);
    const piece = vFindCorner(stickers);
    if (piece < 0) return `角块 ${i + 1} 的颜色组合无效`;
    cp.push(piece);
    for (let k = 0; k < 3; k++) {
      if (stickers[k] === "U" || stickers[k] === "D") { cornerOri += k; break; }
    }
  }
  if (cornerOri % 3 !== 0) return "角块朝向总和无效";

  for (let i = 0; i < 12; i++) {
    const stickers = V_EDGE_IDX[i].map((idx) => s[idx]);
    const piece = vFindEdge(stickers);
    if (piece < 0) return `棱块 ${i + 1} 的颜色组合无效`;
    ep.push(piece);
    if (stickers[0] !== V_EDGE_COLORS[piece][0]) edgeOri++;
  }
  if (edgeOri % 2 !== 0) return "棱块朝向总和无效";

  // Permutation parity
  let ci = 0;
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (cp[i] > cp[j]) ci++;
  let ei = 0;
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) if (ep[i] > ep[j]) ei++;
  if (ci % 2 !== ei % 2) return "魔方排列奇偶性无效";

  return null;
}
