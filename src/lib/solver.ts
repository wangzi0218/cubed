import { Cube, initSolver as initRubikSolver, solve } from "rubik-solver";
import type { CubeSize, CubeState, Move, SolutionStep } from "@/types/cube";
import { validate2x2, validate3x3 } from "@/lib/cube-validation";

let solverReady = false;

export function initSolver(): void {
  if (solverReady) return;
  initRubikSolver();
  solverReady = true;
}

export function parseMoves(notation: string): Move[] {
  if (!notation.trim()) return [];
  return notation.trim().split(/\s+/).map((token) => {
    const face = token[0] as Move["face"];
    const dir = token.slice(1) as Move["direction"];
    return { face, direction: dir || "", notation: token };
  });
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const cube = Cube.fromString(state.join(""));
  cube.move(move.notation);
  return cube.asString().split("") as CubeState;
}

export function applyMoves(
  initialState: CubeState,
  moves: Move[]
): SolutionStep[] {
  const steps: SolutionStep[] = [];
  let currentState = initialState;

  for (let i = 0; i < moves.length; i++) {
    currentState = applyMove(currentState, moves[i]);
    steps.push({
      index: i,
      move: moves[i],
      stateAfter: [...currentState],
    });
  }
  return steps;
}

function solve3x3(state: CubeState): string {
  const cube = Cube.fromString(state.join(""));
  if (cube.isSolved()) return "";
  const result = solve(cube);
  if (!result) throw new Error("求解失败，无法找到还原方案");
  return result;
}

function solve2x2(state: CubeState): string {
  const fullState = map2x2To3x3(state);
  const cube = Cube.fromString(fullState);
  if (cube.isSolved()) return "";
  const result = solve(cube);
  if (!result) throw new Error("求解失败，无法找到还原方案");
  return result
    .split(/\s+/)
    .filter((m: string) => /^[UDLRFB]['2]?$/.test(m))
    .join(" ");
}

function map2x2To3x3(state2: CubeState): string {
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

export function solveCube(
  state: CubeState,
  size: CubeSize
): { solution: string; steps: SolutionStep[] } {
  initSolver();

  if (size === 2) {
    const err = validate2x2(state);
    if (err) throw new Error(err);
  } else {
    const err = validate3x3(state);
    if (err) throw new Error(err);
  }

  const solutionStr = size === 2 ? solve2x2(state) : solve3x3(state);
  const moves = parseMoves(solutionStr);
  const steps = applyMoves(state, moves);

  return { solution: solutionStr, steps };
}
