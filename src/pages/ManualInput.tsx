import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { useCubeStore } from "@/stores/cube-store";
import { createSolvedState, validateState } from "@/lib/cube-state";
import { solveCube } from "@/lib/solver";
import type { FaceColor } from "@/types/cube";

export function ManualInput() {
  const {
    cubeSize,
    currentState,
    setCurrentState,
    setSolution,
    setAppStep,
  } = useCubeStore();
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setCurrentState(createSolvedState(cubeSize));
    setError(null);
  }, [cubeSize, setCurrentState]);

  const handleSolve = useCallback(() => {
    if (!validateState(currentState, cubeSize)) {
      setError("每个颜色应该恰好出现 " + cubeSize * cubeSize + " 次，请检查输入");
      return;
    }
    setError(null);
    try {
      const result = solveCube(currentState, cubeSize);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "求解失败，请检查魔方状态是否正确";
      setError(msg);
    }
  }, [currentState, cubeSize, setSolution, setAppStep]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setAppStep("input-method")}
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h2 className="text-xl font-bold tracking-tight">
            {cubeSize}×{cubeSize} 手动输入
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D preview */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square rounded-xl border bg-card/50 overflow-hidden">
              <CubeViewer state={currentState} size={cubeSize} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              拖拽旋转查看 3D 预览
            </p>
          </div>

          {/* Right: Input controls */}
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium mb-3">选择颜色</p>
              <ColorPalette
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-3">
                点击格子填入颜色
              </p>
              <div className="overflow-x-auto">
                <CubeNet
                  state={currentState}
                  size={cubeSize}
                  onStateChange={setCurrentState}
                  selectedColor={selectedColor}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-auto">
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSolve}>
                <Check className="w-4 h-4" />
                开始求解
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
