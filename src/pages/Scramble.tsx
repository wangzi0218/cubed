import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Play } from "lucide-react";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { useCubeStore } from "@/stores/cube-store";
import { generateScramble } from "@/lib/scramble";
import { applyMoves, initSolver, parseMoves, solveCube } from "@/lib/solver";
import { createSolvedState } from "@/lib/cube-state";

export function Scramble() {
  const { cubeSize, setAppStep, setSolution, setCurrentState } = useCubeStore();
  const [scramble, setScramble] = useState(() => {
    initSolver();
    return generateScramble(cubeSize);
  });

  const handleRegenerate = useCallback(() => {
    setScramble(generateScramble(cubeSize));
  }, [cubeSize]);

  const handleStart = useCallback(() => {
    // Apply scramble to solved state to get the scrambled cube
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    const scrambledState = steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;

    // Set the scrambled state as current and solve it
    setCurrentState(scrambledState);
    try {
      const result = solveCube(scrambledState, cubeSize);
      setSolution(result.solution, result.steps);
    } catch (e: any) {
      console.error("Scramble solve error:", e);
      // Still navigate to solution page — it handles empty steps gracefully
      setSolution(null, []);
    }
    setAppStep("solution");
  }, [cubeSize, scramble, setAppStep, setSolution, setCurrentState]);

  const handleBack = useCallback(() => {
    setAppStep("cube-type");
  }, [setAppStep]);

  // Build a scrambled state for preview
  const previewState = (() => {
    const solvedState = createSolvedState(cubeSize);
    const moves = parseMoves(scramble);
    const steps = applyMoves(solvedState, moves);
    return steps.length > 0 ? steps[steps.length - 1].stateAfter : solvedState;
  })();

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h2 className="text-xl font-bold tracking-tight">
            {cubeSize}×{cubeSize} 打乱公式
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D preview */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square rounded-xl border bg-card/50 overflow-hidden">
              <CubeViewer state={previewState} size={cubeSize} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              拖拽旋转查看打乱后的魔方
            </p>
          </div>

          {/* Right: Scramble formula and controls */}
          <div className="flex-1 flex flex-col gap-6">
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

            <div className="flex flex-col gap-3 mt-auto">
              <Button variant="outline" className="gap-2" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4" />
                重新生成
              </Button>
              <Button className="gap-2" onClick={handleStart}>
                <Play className="w-4 h-4" />
                开始还原
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
