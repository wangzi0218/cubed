import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Check, Zap } from "lucide-react";
import { CubeNet } from "@/components/cube/CubeNet";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { TopologyGuide } from "@/components/cube/TopologyGuide";
import { TopologyCapture } from "@/components/cube/TopologyCapture";
import { useCubeStore } from "@/stores/cube-store";
import { validateState } from "@/lib/cube-state";
import { solveCube } from "@/lib/solver";
import {
  inferCubeState,
  EDGE_POSITION_FACES,
  CORNER_POSITION_FACES,
} from "@/lib/topology-inference";
import type { EdgePhoto, CornerPhoto, CubeTopology } from "@/lib/topology-inference";
import type { FaceColor } from "@/types/cube";

type Phase = "intro" | "edges" | "corners" | "review";

const EDGE_POSITIONS = EDGE_POSITION_FACES.map((faces) => ({
  faces: faces as [FaceColor, FaceColor],
}));

const CORNER_POSITIONS = CORNER_POSITION_FACES.map((faces) => ({
  faces: faces as [FaceColor, FaceColor, FaceColor],
}));

export function TopologyInput() {
  const {
    cubeSize,
    currentState,
    setCurrentState,
    setSolution,
    setAppStep,
  } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [edgeIdx, setEdgeIdx] = useState(0);
  const [cornerIdx, setCornerIdx] = useState(0);
  const [edgePhotos, setEdgePhotos] = useState<EdgePhoto[]>([]);
  const [cornerPhotos, setCornerPhotos] = useState<CornerPhoto[]>([]);
  const [captured, setCaptured] = useState(false);
  const [capturedColors, setCapturedColors] = useState<FaceColor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const is2x2 = cubeSize === 2;
  const showEdges = !is2x2;

  // Current position info
  const currentEdge = showEdges ? EDGE_POSITIONS[edgeIdx] : null;
  const currentCorner = CORNER_POSITIONS[cornerIdx];

  // Completed step indices
  const completedEdges = useMemo(
    () => edgePhotos.map((_, i) => i),
    [edgePhotos]
  );
  const completedCorners = useMemo(
    () => cornerPhotos.map((_, i) => i),
    [cornerPhotos]
  );

  // ── Phase transitions ────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setPhase(showEdges ? "edges" : "corners");
    setEdgeIdx(0);
    setCornerIdx(0);
    setEdgePhotos([]);
    setCornerPhotos([]);
    setCaptured(false);
    setCapturedColors([]);
    setError(null);
  }, [showEdges]);

  // ── Edge capture handlers ────────────────────────────────────────────────

  const handleEdgeCapture = useCallback(
    (colors: FaceColor[]) => {
      setCapturedColors(colors);
      setCaptured(true);
    },
    []
  );

  const handleEdgeRetake = useCallback(() => {
    setCaptured(false);
    setCapturedColors([]);
  }, []);

  const handleEdgeConfirm = useCallback(() => {
    if (!currentEdge) return;
    const photo: EdgePhoto = {
      colors: [capturedColors[0], capturedColors[1]],
      face1: currentEdge.faces[0],
      face2: currentEdge.faces[1],
    };
    const next = [...edgePhotos, photo];
    setEdgePhotos(next);
    setCaptured(false);
    setCapturedColors([]);

    if (edgeIdx + 1 >= EDGE_POSITIONS.length) {
      setPhase("corners");
      setCornerIdx(0);
    } else {
      setEdgeIdx(edgeIdx + 1);
    }
  }, [capturedColors, currentEdge, edgePhotos, edgeIdx]);

  // ── Corner capture handlers ──────────────────────────────────────────────

  const handleCornerCapture = useCallback(
    (colors: FaceColor[]) => {
      setCapturedColors(colors);
      setCaptured(true);
    },
    []
  );

  const handleCornerRetake = useCallback(() => {
    setCaptured(false);
    setCapturedColors([]);
  }, []);

  const handleCornerConfirm = useCallback(() => {
    if (!currentCorner) return;
    const photo: CornerPhoto = {
      colors: [capturedColors[0], capturedColors[1], capturedColors[2]],
      face1: currentCorner.faces[0],
      face2: currentCorner.faces[1],
      face3: currentCorner.faces[2],
    };
    const next = [...cornerPhotos, photo];
    setCornerPhotos(next);
    setCaptured(false);
    setCapturedColors([]);

    if (cornerIdx + 1 >= CORNER_POSITIONS.length) {
      // All corners done — infer state and move to review
      const topology: CubeTopology = {
        edges: edgePhotos,
        corners: next,
      };
      const inferred = inferCubeState(topology, cubeSize);
      setCurrentState(inferred);
      setPhase("review");
    } else {
      setCornerIdx(cornerIdx + 1);
    }
  }, [capturedColors, currentCorner, cornerPhotos, cornerIdx, edgePhotos, cubeSize, setCurrentState]);

  // ── Solve ────────────────────────────────────────────────────────────────

  const handleSolve = useCallback(() => {
    if (!validateState(currentState, cubeSize)) {
      setError(
        "每个颜色应该恰好出现 " + cubeSize * cubeSize + " 次，请检查输入"
      );
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

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setEdgeIdx(0);
    setCornerIdx(0);
    setEdgePhotos([]);
    setCornerPhotos([]);
    setCaptured(false);
    setCapturedColors([]);
    setError(null);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        {/* Header */}
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
            {cubeSize}×{cubeSize} 拓扑拼合
          </h2>
        </div>

        {/* ── Phase: intro ──────────────────────────────────────────────── */}
        {phase === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">拓扑拼合法</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                通过拍摄魔方{showEdges ? "棱和角" : "角"}的交界处，利用颜色的空间关系推断完整状态。
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {showEdges
                  ? "需要拍摄 12 条棱和 8 个角的交界位置。"
                  : "需要拍摄 8 个角的交界位置。"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                此方法适用于任意颜色的魔方
              </p>
            </div>

            <Button size="lg" className="gap-2" onClick={handleStart}>
              开始拍摄
            </Button>
          </div>
        )}

        {/* ── Phase: edges ──────────────────────────────────────────────── */}
        {phase === "edges" && currentEdge && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* Left: guide */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <TopologyGuide
                type="edge"
                totalSteps={EDGE_POSITIONS.length}
                currentStep={edgeIdx}
                currentFaces={currentEdge.faces}
                completedSteps={completedEdges}
              />
            </div>

            {/* Right: capture */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <TopologyCapture
                type="edge"
                faces={currentEdge.faces}
                onCapture={handleEdgeCapture}
                onRetake={handleEdgeRetake}
                captured={captured}
                capturedColors={capturedColors}
                onConfirm={handleEdgeConfirm}
              />
            </div>
          </div>
        )}

        {/* ── Phase: corners ────────────────────────────────────────────── */}
        {phase === "corners" && currentCorner && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* Left: guide */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <TopologyGuide
                type="corner"
                totalSteps={CORNER_POSITIONS.length}
                currentStep={cornerIdx}
                currentFaces={currentCorner.faces}
                completedSteps={completedCorners}
              />
            </div>

            {/* Right: capture */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <TopologyCapture
                type="corner"
                faces={currentCorner.faces}
                onCapture={handleCornerCapture}
                onRetake={handleCornerRetake}
                captured={captured}
                capturedColors={capturedColors}
                onConfirm={handleCornerConfirm}
              />
            </div>
          </div>
        )}

        {/* ── Phase: review ─────────────────────────────────────────────── */}
        {phase === "review" && (
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

            {/* Right: net + actions */}
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <p className="text-sm font-medium mb-3">推断结果</p>
                <div className="overflow-x-auto">
                  <CubeNet
                    state={currentState}
                    size={cubeSize}
                    onStateChange={setCurrentState}
                    selectedColor={"U" as FaceColor}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  推断完成后可在展开图上微调颜色
                </p>
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
                  onClick={handleRestart}
                >
                  <RotateCcw className="w-4 h-4" />
                  重新拍摄
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSolve}>
                  <Check className="w-4 h-4" />
                  开始求解
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
