import { useState, useCallback, useMemo } from "react";
import { RotateCcw, Check } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
import { createSolvedState } from "@/lib/cube-state";
import { FACE_ORDER, FACE_COLORS } from "@/types/cube";
import type { FaceColor } from "@/types/cube";

export function ManualInput() {
  const { cubeSize, currentState, setCurrentState, setAppStep } = useCubeStore();
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const { error, solve } = useSolve(currentState, cubeSize);

  const stickersPerFace = cubeSize * cubeSize;
  const expectedCount = stickersPerFace;

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of currentState) counts[c] = (counts[c] || 0) + 1;
    return counts;
  }, [currentState]);

  const handleReset = useCallback(() => {
    setCurrentState(createSolvedState(cubeSize));
  }, [cubeSize, setCurrentState]);

  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 手动输入`}
      onBack={() => setAppStep("input-method")}
      state={currentState}
      size={cubeSize}
    >
      <div>
        <p className="text-sm font-medium mb-1">选择颜色</p>
        <p className="text-xs text-muted-foreground mb-3">
          对照你的魔方，先选颜色，再点击下方格子填入
        </p>
        <ColorPalette
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
      </div>

      {/* Color count summary */}
      <div className="flex flex-wrap gap-2">
        {FACE_ORDER.map((face) => {
          const count = colorCounts[face] ?? 0;
          const ok = count === expectedCount;
          return (
            <span
              key={face}
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${ok ? "bg-muted" : "bg-destructive/10 text-destructive"}`}
            >
              <span
                className="w-3 h-3 rounded-full border border-border/50"
                style={{ backgroundColor: FACE_COLORS[face].hex }}
              />
              {count}/{expectedCount}
            </span>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-medium mb-3">点击格子填入颜色</p>
        <div className="overflow-x-auto">
          <CubeNet
            state={currentState}
            size={cubeSize}
            onStateChange={setCurrentState}
            selectedColor={selectedColor}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "重置", icon: RotateCcw, onClick: handleReset, variant: "outline" },
          { label: "开始求解", icon: Check, onClick: solve, flex: true },
        ]}
      />
    </CubePreviewLayout>
  );
}
