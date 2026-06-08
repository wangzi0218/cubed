import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Check } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { useCubeStore } from "@/stores/cube-store";
import { createSolvedState, validateState } from "@/lib/cube-state";
import { detectFaceColors } from "@/lib/color-detection";
import { solveCube } from "@/lib/solver";
import { FACE_ORDER } from "@/types/cube";
import type { FaceColor, CubeState } from "@/types/cube";

type Phase = "capture" | "review";

/** Human-readable labels for each face in capture order. */
const FACE_LABELS: Record<FaceColor, string> = {
  U: "上面 (U)",
  R: "右面 (R)",
  F: "前面 (F)",
  D: "下面 (D)",
  L: "左面 (L)",
  B: "后面 (B)",
};

export function PhotoInput() {
  const {
    cubeSize,
    currentState,
    setCurrentState,
    setSolution,
    setAppStep,
  } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("capture");
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const [error, setError] = useState<string | null>(null);

  // Accumulate detected colors for all faces
  const stickersPerFace = cubeSize * cubeSize;
  const [detectedState, setDetectedState] = useState<CubeState>(
    createSolvedState(cubeSize)
  );

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
        // All 6 faces captured; move to review
        setPhase("review");
      }
    },
    [cubeSize, currentFaceIdx, stickersPerFace]
  );

  const handleBackToCapture = useCallback(() => {
    setPhase("capture");
    setCurrentFaceIdx(0);
    setDetectedState(createSolvedState(cubeSize));
    setError(null);
  }, [cubeSize]);

  const handleSolve = useCallback(() => {
    const stateToSolve = detectedState;
    if (!validateState(stateToSolve, cubeSize)) {
      setError(
        "每个颜色应该恰好出现 " +
          stickersPerFace +
          " 次，请检查并修正识别结果"
      );
      return;
    }
    setError(null);
    try {
      setCurrentState(stateToSolve);
      const result = solveCube(stateToSolve, cubeSize);
      setSolution(result.solution, result.steps);
      setAppStep("solution");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "求解失败，请检查魔方状态是否正确";
      setError(msg);
    }
  }, [
    detectedState,
    cubeSize,
    stickersPerFace,
    setCurrentState,
    setSolution,
    setAppStep,
  ]);

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
            {cubeSize}x{cubeSize} 拍照识别结果
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D preview */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square rounded-xl border bg-card/50 overflow-hidden">
              <CubeViewer state={detectedState} size={cubeSize} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              拖拽旋转查看 3D 预览
            </p>
          </div>

          {/* Right: Edit controls */}
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
                点击格子修正识别结果
              </p>
              <div className="overflow-x-auto">
                <CubeNet
                  state={detectedState}
                  size={cubeSize}
                  onStateChange={setDetectedState}
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
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleBackToCapture}
              >
                <RotateCcw className="w-4 h-4" />
                重拍
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
