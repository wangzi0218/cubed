import { useState, useCallback } from "react";
import { useCubeStore } from "@/stores/cube-store";
import { validateState } from "@/lib/cube-state";
import { solveCube } from "@/lib/solver";
import type { CubeState, CubeSize } from "@/types/cube";

export function useSolve(state: CubeState, size: CubeSize, stickerImages?: string[]) {
  const { setCurrentState, setStickerImages, setSolution, setAppStep } = useCubeStore();
  const [error, setError] = useState<string | null>(null);

  const solve = useCallback(() => {
    if (!validateState(state, size)) {
      setError("每个颜色应该恰好出现 " + size * size + " 次，请检查输入");
      return;
    }
    setError(null);
    try {
      setCurrentState(state);
      setStickerImages(stickerImages);
      const result = solveCube(state, size);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "求解失败，请检查魔方状态是否正确";
      setError(msg);
    }
  }, [state, size, stickerImages, setCurrentState, setStickerImages, setSolution, setAppStep]);

  const clearError = useCallback(() => setError(null), []);

  return { error, solve, clearError };
}
