import { useState, useCallback } from "react";
import { RefreshCw, Play } from "lucide-react";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ActionBar } from "@/components/layout/ActionBar";
import { ErrorMessage } from "@/components/ui/error-message";
import { useCubeStore } from "@/stores/cube-store";
import { generateScramble } from "@/lib/scramble";
import { applyMoves, initSolver, parseMoves, solveCube } from "@/lib/solver";
import { createSolvedState } from "@/lib/cube-state";

export function Scramble() {
  const { cubeSize, setAppStep, setSolution, setCurrentState, setStickerImages } = useCubeStore();
  const [scramble, setScramble] = useState(() => {
    initSolver();
    return generateScramble(cubeSize);
  });
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = useCallback(() => {
    setScramble(generateScramble(cubeSize));
    setError(null);
  }, [cubeSize]);

  const handleStart = useCallback(() => {
    setError(null);
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    const scrambledState = steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;

    setCurrentState(scrambledState);
    setStickerImages(undefined);
    try {
      const result = solveCube(scrambledState, cubeSize);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "求解失败，请重试";
      setError(msg);
    }
  }, [cubeSize, scramble, setAppStep, setSolution, setCurrentState, setStickerImages]);

  const handleBack = useCallback(() => {
    setAppStep("cube-type");
  }, [setAppStep]);

  const previewState = (() => {
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    return steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;
  })();

  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 打乱公式`}
      onBack={handleBack}
      state={previewState}
      size={cubeSize}
    >
      <div>
        <p className="text-sm font-medium mb-3">打乱公式</p>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-lg font-mono font-semibold tracking-wider leading-relaxed break-all">
            {scramble}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          按照此公式在已还原的魔方上执行打乱操作
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "重新生成", icon: RefreshCw, onClick: handleRegenerate, variant: "outline" },
          { label: "开始还原", icon: Play, onClick: handleStart },
        ]}
      />
    </CubePreviewLayout>
  );
}
