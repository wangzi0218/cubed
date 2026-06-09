import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { StepList } from "@/components/cube/StepList";
import { SolutionControls } from "@/components/cube/SolutionControls";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCubeStore } from "@/stores/cube-store";
import type { Move } from "@/types/cube";

export function Solution() {
  const {
    cubeSize,
    solution,
    solutionSteps,
    currentStepIndex,
    isPlaying,
    flowOrigin,
    currentState: storeState,
    stickerImages,
    setCurrentStepIndex,
    setIsPlaying,
    setAppStep,
    reset,
  } = useCubeStore();

  const [animatingMove, setAnimatingMove] = useState<Move | null>(null);
  const [moveProgress, setMoveProgress] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const animFrameRef = useRef<number>(0);

  const currentState =
    currentStepIndex >= 0 && currentStepIndex < solutionSteps.length
      ? solutionSteps[currentStepIndex].stateAfter
      : storeState;

  useEffect(() => {
    if (!animatingMove) {
      setMoveProgress(0);
      return;
    }

    const startTime = performance.now();
    const duration = 500;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setMoveProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatingMove(null);
        setMoveProgress(0);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animatingMove]);

  const handleMoveStart = useCallback((move: Move) => {
    setAnimatingMove(move);
    setMoveProgress(0);
  }, []);

  const handleMoveEnd = useCallback(() => {
    setAnimatingMove(null);
    setMoveProgress(0);
  }, []);

  const handleBack = useCallback(
    () => setAppStep(flowOrigin === "scramble" ? "scramble" : "input"),
    [setAppStep, flowOrigin]
  );

  if (solution === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">还没有求解结果</p>
        <Button onClick={() => setAppStep("input")}>去输入魔方状态</Button>
      </div>
    );
  }

  if (solutionSteps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div className="w-64 h-64">
          <CubeViewer state={currentState} size={cubeSize} stickerImages={stickerImages} />
        </div>
        <p className="text-lg font-medium text-success">魔方已经是还原状态</p>
        <Button variant="outline" onClick={handleBack}>
          重新输入
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <PageHeader
          title="还原步骤"
          onBack={handleBack}
          subtitle={
            <span className="text-sm text-muted-foreground">
              共 {solutionSteps.length} 步
            </span>
          }
        />

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: 3D viewer */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-lg aspect-square rounded-xl border bg-card/50 overflow-hidden">
              <CubeViewer
                state={currentState}
                size={cubeSize}
                stickerImages={stickerImages}
                currentMove={animatingMove}
                moveProgress={moveProgress}
              />
            </div>

            <div className="mt-4 w-full max-w-sm">
              <SolutionControls
                steps={solutionSteps}
                currentStepIndex={currentStepIndex}
                isPlaying={isPlaying}
                onStepChange={setCurrentStepIndex}
                onPlayToggle={() => setIsPlaying(!isPlaying)}
                onReset={() => setCurrentStepIndex(-1)}
                onMoveStart={handleMoveStart}
                onMoveEnd={handleMoveEnd}
              />
            </div>

            {currentStepIndex >= 0 && currentStepIndex < solutionSteps.length && (
              <div className="mt-3 text-center">
                <span className="text-2xl font-mono font-bold tracking-widest">
                  {solutionSteps[currentStepIndex].move.notation}
                </span>
              </div>
            )}
          </div>

          {/* Right: Step list */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="sticky top-20">
              <button
                className="flex items-center gap-2 text-sm font-medium mb-3 cursor-pointer lg:cursor-default"
                onClick={() => setShowSteps(!showSteps)}
              >
                步骤列表
                <span className="lg:hidden">
                  {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <div className={showSteps ? "block" : "hidden lg:block"}>
                <StepList
                  steps={solutionSteps}
                  currentStepIndex={currentStepIndex}
                  onStepClick={setCurrentStepIndex}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button variant="outline" className="gap-2" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
            重新开始
          </Button>
        </div>
      </div>
    </div>
  );
}
