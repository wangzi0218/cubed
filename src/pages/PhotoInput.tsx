import { useState, useCallback, useEffect } from "react";
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
import { imageDataToDataUrl } from "@/lib/image-utils";
import { FACE_ORDER, FACE_COLORS } from "@/types/cube";
import type { FaceColor, CubeState } from "@/types/cube";

type Phase = "capture" | "review";

const FACE_LABELS: Record<FaceColor, string> = {
  U: "上面 (白)",
  R: "右面 (红)",
  F: "前面 (蓝)",
  D: "下面 (黄)",
  L: "左面 (橙)",
  B: "后面 (绿)",
};

export function PhotoInput() {
  const { cubeSize, setAppStep } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("capture");
  const [currentFaceIdx, setCurrentFaceIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const [capturedPhotos, setCapturedPhotos] = useState<(string | null)[]>(
    () => Array(6).fill(null)
  );

  const stickersPerFace = cubeSize * cubeSize;
  const [detectedState, setDetectedState] = useState<CubeState>(
    createSolvedState(cubeSize)
  );
  const [stickerImages, setStickerImages] = useState<string[] | undefined>();

  const { error, solve } = useSolve(detectedState, cubeSize, stickerImages);

  // Extract sticker thumbnails from captured photos for 3D preview
  useEffect(() => {
    if (phase !== "review") return;
    const allCaptured = capturedPhotos.every((p) => p !== null);
    if (!allCaptured) return;

    let cancelled = false;
    (async () => {
      const result = await extractStickerImages(
        capturedPhotos as string[],
        cubeSize
      );
      if (!cancelled) setStickerImages(result);
    })();
    return () => { cancelled = true; };
  }, [phase, capturedPhotos, cubeSize]);

  const handleCapture = useCallback(
    (imageData: ImageData) => {
      const colors = detectFaceColors(imageData, cubeSize);
      const faceOffset = currentFaceIdx * stickersPerFace;
      const dataUrl = imageDataToDataUrl(imageData);

      setCapturedPhotos((prev) => {
        const next = [...prev];
        next[currentFaceIdx] = dataUrl;
        return next;
      });

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
    setCapturedPhotos(Array(6).fill(null));
    setDetectedState(createSolvedState(cubeSize));
    setStickerImages(undefined);
  }, [cubeSize]);

  const handleRetakePhoto = useCallback((idx: number) => {
    setCurrentFaceIdx(idx);
    setPhase("capture");
  }, []);

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

        {capturedPhotos.some((p) => p !== null) && (
          <div className="bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted-foreground mr-2">已拍摄：</span>
              {capturedPhotos.map((photo, i) => (
                <button
                  key={i}
                  className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                    photo
                      ? i === currentFaceIdx
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                      : "border-dashed border-muted-foreground/30"
                  }`}
                  onClick={() => photo && handleRetakePhoto(i)}
                  title={photo ? `重拍第 ${i + 1} 面` : `第 ${i + 1} 面未拍摄`}
                >
                  {photo ? (
                    <img src={photo} alt={`Face ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      {i + 1}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
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
      stickerImages={stickerImages}
    >
      {/* Captured photos summary */}
      <div>
        <p className="text-sm font-medium mb-3">拍摄的照片</p>
        <div className="flex gap-2 flex-wrap">
          {capturedPhotos.map((photo, i) => {
            const face = FACE_ORDER[i];
            const detectedColor = detectedState[i * stickersPerFace];
            return (
              <button
                key={i}
                className="flex flex-col items-center gap-1 cursor-pointer group"
                onClick={() => handleRetakePhoto(i)}
                title={`点击重拍 ${FACE_LABELS[face]}`}
              >
                <div className="w-14 h-14 rounded-lg border-2 border-border overflow-hidden group-hover:border-primary/50 transition-colors">
                  {photo ? (
                    <img src={photo} alt={FACE_LABELS[face]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      无
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-border/50"
                    style={{ backgroundColor: FACE_COLORS[detectedColor]?.hex ?? "#000" }}
                  />
                  <span className="text-xs text-muted-foreground">{face}</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">点击照片可重拍该面</p>
      </div>

      {/* Detected color summary */}
      <div>
        <p className="text-sm font-medium mb-3">识别到的颜色分布</p>
        <div className="flex flex-wrap gap-2">
          {FACE_ORDER.map((face) => {
            const count = detectedState.filter((c) => c === face).length;
            return (
              <span
                key={face}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-muted"
              >
                <span
                  className="w-3 h-3 rounded-full border border-border/50"
                  style={{ backgroundColor: FACE_COLORS[face].hex }}
                />
                {face}: {count}格
              </span>
            );
          })}
        </div>
      </div>

      {/* Color correction */}
      <div>
        <p className="text-sm font-medium mb-2">修正识别结果</p>
        <p className="text-xs text-muted-foreground mb-3">
          如果某个格子识别不准确，先选颜色，再点击格子修正
        </p>
        <ColorPalette
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
      </div>

      <div>
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
          { label: "全部重拍", icon: RotateCcw, onClick: handleBackToCapture, variant: "outline" },
          { label: "开始求解", icon: Check, onClick: solve, flex: true },
        ]}
      />
    </CubePreviewLayout>
  );
}

function extractStickerImages(
  photos: string[],
  size: number
): Promise<string[]> {
  const perFace = size * size;
  const result: string[] = new Array(6 * perFace);
  const MARGIN = 0.1;

  return new Promise((resolve) => {
    let loaded = 0;
    const total = photos.length;

    photos.forEach((dataUrl, faceIdx) => {
      const img = new Image();
      img.onload = () => {
        const faceSize = Math.min(img.width, img.height);
        const cellSize = faceSize / size;
        const offsetX = (img.width - faceSize) / 2;
        const offsetY = (img.height - faceSize) / 2;

        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            const canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext("2d")!;

            const margin = cellSize * MARGIN;
            const sx = offsetX + col * cellSize + margin;
            const sy = offsetY + row * cellSize + margin;
            const sw = cellSize - margin * 2;
            const sh = cellSize - margin * 2;

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 128, 128);
            result[faceIdx * perFace + row * size + col] = canvas.toDataURL("image/png");
          }
        }

        loaded++;
        if (loaded === total) resolve(result);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) resolve(result);
      };
      img.src = dataUrl;
    });
  });
}
