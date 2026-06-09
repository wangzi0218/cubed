import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
import { createSolvedState } from "@/lib/cube-state";
import { detectFaceColors } from "@/lib/color-detection";
import { FACE_ORDER } from "@/types/cube";
import type { FaceColor, CubeState } from "@/types/cube";

type Phase = "capture" | "review";

const FACE_LABELS: Record<FaceColor, string> = {
  U: "上面 (U)",
  R: "右面 (R)",
  F: "前面 (F)",
  D: "下面 (D)",
  L: "左面 (L)",
  B: "后面 (B)",
};

export function PhotoInput() {
  const { cubeSize, setAppStep } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("capture");
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");

  const stickersPerFace = cubeSize * cubeSize;
  const [detectedState, setDetectedState] = useState<CubeState>(
    createSolvedState(cubeSize)
  );

  const { error, solve } = useSolve(detectedState, cubeSize);

  const handleCapture = useCallback(
    (imageData: ImageData) => {
      const colors = detectFaceColors(imageData, cubeSize);
      const faceOffset = currentFaceIdx * stickersPerFace;

      setDetectedState((prev) => {
        const next = [...prev];
        for (let i = 0; i < stickersPerFace; i++) {
          next[faceOffset + i] = colors[i];
        }
        return next;
      });

      if (currentFaceIdx < 5) {
        setCurrentFaceIdx((i) => i + 1);
      } else {
        setPhase("review");
      }
    },
    [cubeSize, currentFaceIdx, stickersPerFace]
  );

  const handleBackToCapture = useCallback(() => {
    setPhase("capture");
    setCurrentFaceIdx(0);
    setDetectedState(createSolvedState(cubeSize));
  }, [cubeSize]);

  // ── Capture phase ──────────────────────────────────────────────────────

  if (phase === "capture") {
    const face = FACE_ORDER[currentFaceIdx];

    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <Button
            variant="ghost"
            className="gap-2 text-white hover:text-white/80"
            onClick={() => setAppStep("input-method")}
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>

        <CameraCapture
          faceLabel={FACE_LABELS[face]}
          faceIndex={currentFaceIdx}
          totalFaces={6}
          onCapture={handleCapture}
        />
      </div>
    );
  }

  // ── Review phase ───────────────────────────────────────────────────────

  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 拍照识别结果`}
      onBack={() => setAppStep("input-method")}
      state={detectedState}
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
        <p className="text-sm font-medium mb-3">点击格子修正识别结果</p>
        <div className="overflow-x-auto">
          <CubeNet
            state={detectedState}
            size={cubeSize}
            onStateChange={setDetectedState}
            selectedColor={selectedColor}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "重拍", icon: RotateCcw, onClick: handleBackToCapture, variant: "outline" },
          { label: "开始求解", icon: Check, onClick: solve, flex: true },
        ]}
      />
    </CubePreviewLayout>
  );
}
