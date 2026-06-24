import { useState, useCallback, useRef } from "react";
import { useCubeStore } from "@/stores/cube-store";
import { validateState } from "@/lib/cube-state";
import { solveCube } from "@/lib/solver";
import { FACE_ORDER } from "@/types/cube";
import type { CubeState, CubeSize, StickerOrientations } from "@/types/cube";
import { createInitialOrientations } from "@/lib/sticker-orientation";

const FACE_CHINESE: Record<string, string> = {
  U: "上白", R: "右红", F: "前蓝", D: "下黄", L: "左橙", B: "后绿",
};

function describeColorIssue(state: CubeState, size: CubeSize): string {
  const expected = size * size;
  const counts: Record<string, number> = {};
  for (const c of state) counts[c] = (counts[c] || 0) + 1;
  const issues: string[] = [];
  for (const face of FACE_ORDER) {
    const count = counts[face] ?? 0;
    if (count !== expected) {
      const label = FACE_CHINESE[face] ?? face;
      issues.push(`${label} ${count}格（需${expected}格）`);
    }
  }
  return issues.length > 0
    ? `颜色数量不对：${issues.join("、")}`
    : "魔方状态有误，请检查每面颜色";
}

export function useSolve(
  state: CubeState,
  size: CubeSize,
  stickerImages?: string[],
  stickerOrientations?: StickerOrientations
) {
  const {
    setCurrentState,
    setStickerImages,
    setStickerOrientations: storeSetOrientations,
    setSolution,
    setAppStep,
  } = useCubeStore();
  const [error, setError] = useState<string | null>(null);

  // Use refs to keep the solve callback stable across renders
  const stateRef = useRef(state);
  const sizeRef = useRef(size);
  const imagesRef = useRef(stickerImages);
  const orientationsRef = useRef(stickerOrientations);
  stateRef.current = state;
  sizeRef.current = size;
  imagesRef.current = stickerImages;
  orientationsRef.current = stickerOrientations;

  const solve = useCallback(() => {
    const s = stateRef.current;
    const sz = sizeRef.current;
    const imgs = imagesRef.current;
    const oris = orientationsRef.current;
    if (!validateState(s, sz)) {
      setError(describeColorIssue(s, sz));
      return;
    }
    setError(null);
    try {
      setCurrentState(s);
      setStickerImages(imgs);
      storeSetOrientations(oris ?? createInitialOrientations(sz));
      const result = solveCube(s, sz, oris);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "求解失败，请检查魔方状态是否正确";
      setError(msg);
    }
  }, [setCurrentState, setStickerImages, storeSetOrientations, setSolution, setAppStep]);

  const clearError = useCallback(() => setError(null), []);

  return { error, solve, clearError };
}
