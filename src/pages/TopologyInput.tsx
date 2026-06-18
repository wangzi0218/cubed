import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Zap } from "lucide-react";
import { CubeNet, ColorPalette } from "@/components/cube/CubeNet";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { TopologyGuide } from "@/components/cube/TopologyGuide";
import { TopologyCapture } from "@/components/cube/TopologyCapture";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
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
    setAppStep,
  } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [edgeIdx, setEdgeIdx] = useState(0);
  const [cornerIdx, setCornerIdx] = useState(0);
  const [edgePhotos, setEdgePhotos] = useState<EdgePhoto[]>([]);
  const [cornerPhotos, setCornerPhotos] = useState<CornerPhoto[]>([]);
  const [captured, setCaptured] = useState(false);
  const [capturedColors, setCapturedColors] = useState<FaceColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");

  const is2x2 = cubeSize === 2;
  const showEdges = !is2x2;

  const currentEdge = showEdges ? EDGE_POSITIONS[edgeIdx] : null;
  const currentCorner = CORNER_POSITIONS[cornerIdx];

  const completedEdges = useMemo(
    () => edgePhotos.map((_, i) => i),
    [edgePhotos]
  );
  const completedCorners = useMemo(
    () => cornerPhotos.map((_, i) => i),
    [cornerPhotos]
  );

  const { error, solve, clearError } = useSolve(currentState, cubeSize);

  // ── Phase transitions ────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setPhase(showEdges ? "edges" : "corners");
    setEdgeIdx(0);
    setCornerIdx(0);
    setEdgePhotos([]);
    setCornerPhotos([]);
    setCaptured(false);
    setCapturedColors([]);
    clearError();
  }, [showEdges, clearError]);

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

  // ── Restart ──────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setEdgeIdx(0);
    setCornerIdx(0);
    setEdgePhotos([]);
    setCornerPhotos([]);
    setCaptured(false);
    setCapturedColors([]);
    clearError();
  }, [clearError]);

  // ── Render ───────────────────────────────────────────────────────────────

  const backToInputMethod = useCallback(() => setAppStep("input-method"), [setAppStep]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        {/* Header */}
        <PageHeader
          title={`${cubeSize}×${cubeSize} 魔方识别`}
          onBack={backToInputMethod}
        />

        {/* ── Phase: intro ──────────────────────────────────────────────── */}
        {phase === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">拍照识别魔方</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                拍摄魔方{showEdges ? "边块（两个面之间的块）和角块（三个面交汇处的块）" : "角块（三个面交汇处的块）"}，
                系统会根据颜色的空间关系自动识别完整状态。
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {showEdges
                  ? "需要拍摄 12 个边块和 8 个角块，共 20 张照片。"
                  : "需要拍摄 8 个角块，共 8 张照片。"}
              </p>
              <div className="text-xs text-muted-foreground/70 mt-2 space-y-1">
                <p>拍摄时将魔方{showEdges ? "边块或角块" : "角块"}的相邻面对准框内即可。</p>
                <p>此方法适用于任意颜色的魔方，包括图案魔方。</p>
              </div>
            </div>

            <Button size="lg" className="gap-2" onClick={handleStart}>
              开始拍摄
            </Button>
          </div>
        )}

        {/* ── Phase: edges ──────────────────────────────────────────────── */}
        {phase === "edges" && currentEdge && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <TopologyGuide
                type="edge"
                totalSteps={EDGE_POSITIONS.length}
                currentStep={edgeIdx}
                currentFaces={currentEdge.faces}
                completedSteps={completedEdges}
              />
            </div>

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
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <TopologyGuide
                type="corner"
                totalSteps={CORNER_POSITIONS.length}
                currentStep={cornerIdx}
                currentFaces={currentCorner.faces}
                completedSteps={completedCorners}
              />
            </div>

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
                <p className="text-sm font-medium mb-2">修正颜色</p>
                <p className="text-xs text-muted-foreground mb-3">
                  先选颜色，再点击格子修正
                </p>
                <ColorPalette
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-3">识别结果</p>
                <div className="overflow-x-auto">
                  <CubeNet
                    state={currentState}
                    size={cubeSize}
                    onStateChange={setCurrentState}
                    selectedColor={selectedColor}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  识别完成后可在展开图上微调颜色
                </p>
              </div>

              {error && <ErrorMessage message={error} />}

              <ActionBar
                actions={[
                  { label: "重新拍摄", icon: RotateCcw, onClick: handleRestart, variant: "outline" },
                  { label: "开始求解", icon: Check, onClick: solve, flex: true },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
