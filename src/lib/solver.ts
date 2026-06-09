import { Cube, initSolver as initRubikSolver, solve } from "rubik-solver";
import type { CubeSize, CubeState, Move, SolutionStep, StickerOrientations } from "@/types/cube";
import { validate2x2, validate3x3 } from "@/lib/cube-validation";
import { map2x2To3x3 } from "@/lib/cube-state";
import { applyOrientationMove } from "@/lib/sticker-orientation";

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
  moves: Move[],
  initialOrientations?: StickerOrientations,
  size: CubeSize = 3
): SolutionStep[] {
  const steps: SolutionStep[] = [];
  let currentState = initialState;
  let currentOrientations = initialOrientations;

  for (let i = 0; i < moves.length; i++) {
    currentState = applyMove(currentState, moves[i]);
    if (currentOrientations) {
      currentOrientations = applyOrientationMove(currentOrientations, moves[i].notation, size);
    }
    steps.push({
      index: i,
      move: moves[i],
      stateAfter: [...currentState],
      orientationsAfter: currentOrientations ? [...currentOrientations] : undefined,
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

export function solveCube(
  state: CubeState,
  size: CubeSize,
  initialOrientations?: StickerOrientations
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
  const steps = applyMoves(state, moves, initialOrientations, size);

  return { solution: solutionStr, steps };
}
