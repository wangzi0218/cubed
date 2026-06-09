import { useState, useCallback } from "react";
import { RotateCcw, Check } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
import { createSolvedState } from "@/lib/cube-state";
import type { FaceColor } from "@/types/cube";

export function ManualInput() {
  const { cubeSize, currentState, setCurrentState, setAppStep } = useCubeStore();
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const { error, solve } = useSolve(currentState, cubeSize);

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
        <p className="text-sm font-medium mb-3">选择颜色</p>
        <ColorPalette
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
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
