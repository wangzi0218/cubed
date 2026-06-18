import type { Move, MoveDirection } from "@/types/cube";

const FACE_CHINESE: Record<string, string> = {
  U: "上",
  R: "右",
  F: "前",
  D: "下",
  L: "左",
  B: "后",
};

const DIRECTION_CHINESE: Record<MoveDirection, string> = {
  "": "顺时针 90°",
  "'": "逆时针 90°",
  "2": "旋转 180°",
};

export function getMoveChinese(move: Move): string {
  const face = FACE_CHINESE[move.face] ?? move.face;
  const dir = DIRECTION_CHINESE[move.direction] ?? "";
  return `${face}面${dir}`;
}

export function getMoveChineseFromNotation(notation: string): string {
  const match = notation.match(/^([URFDLB])(['2]?)$/);
  if (!match) return notation;
  const face = FACE_CHINESE[match[1]] ?? match[1];
  const dir = DIRECTION_CHINESE[(match[2] || "") as MoveDirection] ?? "";
  return `${face}面${dir}`;
}

export interface NotationGuideItem {
  notation: string;
  chinese: string;
  group: string;
}

export const MOVE_NOTATION_GUIDE: NotationGuideItem[] = [
  // R 面
  { notation: "R",  chinese: "右面顺时针 90°", group: "右面" },
  { notation: "R'", chinese: "右面逆时针 90°", group: "右面" },
  { notation: "R2", chinese: "右面旋转 180°",  group: "右面" },
  // L 面
  { notation: "L",  chinese: "左面顺时针 90°", group: "左面" },
  { notation: "L'", chinese: "左面逆时针 90°", group: "左面" },
  { notation: "L2", chinese: "左面旋转 180°",  group: "左面" },
  // U 面
  { notation: "U",  chinese: "上面顺时针 90°", group: "上面" },
  { notation: "U'", chinese: "上面逆时针 90°", group: "上面" },
  { notation: "U2", chinese: "上面旋转 180°",  group: "上面" },
  // D 面
  { notation: "D",  chinese: "下面顺时针 90°", group: "下面" },
  { notation: "D'", chinese: "下面逆时针 90°", group: "下面" },
  { notation: "D2", chinese: "下面旋转 180°",  group: "下面" },
  // F 面
  { notation: "F",  chinese: "前面顺时针 90°", group: "前面" },
  { notation: "F'", chinese: "前面逆时针 90°", group: "前面" },
  { notation: "F2", chinese: "前面旋转 180°",  group: "前面" },
  // B 面
  { notation: "B",  chinese: "后面顺时针 90°", group: "后面" },
  { notation: "B'", chinese: "后面逆时针 90°", group: "后面" },
  { notation: "B2", chinese: "后面旋转 180°",  group: "后面" },
];
