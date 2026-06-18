import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Palette, RotateCcw, RotateCw, Zap } from "lucide-react";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { FACE_ORDER, FACE_COLORS } from "@/types/cube";
import type { FaceColor, CubeState, StickerOrientations } from "@/types/cube";
import { useSolve } from "@/hooks/useSolve";
import { imageDataToDataUrl, classifyStickerColor } from "@/lib/image-utils";
import { createSolvedState } from "@/lib/cube-state";
import { ColorPalette } from "@/components/cube/CubeNet";
import { extractFaceStickersFromDataUrl, applyRotation } from "@/lib/pattern-extraction";
import type { FacePhoto } from "@/lib/pattern-extraction";
import { cn } from "@/lib/utils";
import {
  createInitialOrientations,
} from "@/lib/sticker-orientation";

type Phase = "intro" | "capture" | "confirm";
type CubeVariant = "standard" | "pattern";

const FACE_CHINESE: Record<string, string> = {
  U: "上", R: "右", F: "前", D: "下", L: "左", B: "后",
};

const FACE_HINTS: Record<string, string> = {
  U: "将上面正对摄像头",
  R: "将右面正对摄像头",
  F: "将前面正对摄像头",
  D: "将下面正对摄像头",
  L: "将左面正对摄像头",
  B: "将后面正对摄像头",
};

const ORIENTATION_LABELS = ["0°", "90°", "180°", "270°"];

export function PatternInput() {
  const { cubeSize } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [cubeVariant, setCubeVariant] = useState<CubeVariant>("standard");
  const [photos, setPhotos] = useState<(FacePhoto | null)[]>(() => Array(6).fill(null));
  const [photoRotations, setPhotoRotations] = useState<(0 | 90 | 180 | 270)[]>(() => Array(6).fill(0));
  const [captureIdx, setCaptureIdx] = useState(0);
  const [stickers, setStickers] = useState<(string[] | null)[]>(
    () => Array(6).fill(null)
  );
  const [extracting, setExtracting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const [selectedFace, setSelectedFace] = useState<FaceColor | null>(null);
  const [stickerColors, setStickerColors] = useState<CubeState>(
    () => createSolvedState(cubeSize)
  );
  const [stickerOrientations, setStickerOrientations] = useState<StickerOrientations>(
    () => createInitialOrientations(cubeSize)
  );

  const isPattern = cubeVariant === "pattern";

  const stickerImages = stickers.flat().every((s) => s !== null)
    ? (stickers.flat() as string[])
    : undefined;

  const { error, solve, clearError } = useSolve(
    stickerColors,
    cubeSize,
    stickerImages,
    isPattern ? stickerOrientations : undefined
  );

  // ── Auto-extract stickers when entering confirm phase ──────────────────
  useEffect(() => {
    if (phase !== "confirm") return;

    let cancelled = false;
    setExtracting(true);

    async function extractAll() {
      const stickersPerFace = cubeSize * cubeSize;
      const results: (string[] | null)[] = Array(6).fill(null);
      const colors: FaceColor[] = createSolvedState(cubeSize);

      for (let i = 0; i < 6; i++) {
        const photo = photos[i];
        if (!photo) continue;
        try {
          const raw = await extractFaceStickersFromDataUrl(photo.dataUrl, cubeSize, true);
          results[i] = applyRotation(raw, cubeSize, photoRotations[i]);

          if (cubeVariant === "standard") {
            for (let j = 0; j < stickersPerFace; j++) {
              try {
                colors[i * stickersPerFace + j] = await classifyStickerColor(raw[j]);
              } catch {
                // keep default color on failure
              }
            }
          }
        } catch {
          results[i] = null;
        }
      }
      if (!cancelled) {
        setStickers(results);
        setStickerColors(colors);
        setExtracting(false);
      }
    }
    extractAll();
    return () => { cancelled = true; };
  }, [phase, photos, photoRotations, cubeSize, cubeVariant]);

  // ── Capture handler ────────────────────────────────────────────────────
  const handleCapture = useCallback(
    (imageData: ImageData) => {
      const dataUrl = imageDataToDataUrl(imageData);
      setPhotos((prev) => {
        const next = [...prev];
        next[captureIdx] = { dataUrl, originalIndex: captureIdx };
        return next;
      });

      if (captureIdx < 5) {
        setCaptureIdx((i) => i + 1);
      } else {
        setPhase("confirm");
      }
    },
    [captureIdx]
  );

  const handleRetakePhoto = useCallback((idx: number) => {
    setCaptureIdx(idx);
    setPhase("capture");
  }, []);

  const handleRotatePhoto = useCallback((idx: number) => {
    setPhotoRotations((prev) => {
      const next = [...prev];
      next[idx] = ((next[idx] + 90) % 360) as 0 | 90 | 180 | 270;
      return next;
    });
  }, []);

  // ── Sticker click: set color (standard) or orientation (pattern) ──────
  const handleStickerClick = useCallback(
    (faceIdx: number, pos: number) => {
      const stickersPerFace = cubeSize * cubeSize;
      const idx = faceIdx * stickersPerFace + pos;
      if (isPattern) {
        setStickerOrientations((prev) => {
          const next = [...prev];
          next[idx] = ((prev[idx] ?? 0) + 1) % 4;
          return next;
        });
      } else {
        setStickerColors((prev) => {
          const next = [...prev];
          next[idx] = selectedColor;
          return next;
        });
      }
    },
    [cubeSize, selectedColor, isPattern]
  );

  // ── 3D sticker click handler ───────────────────────────────────────────
  const handle3DStickerClick = useCallback(
    (stickerIndex: number) => {
      const size2 = cubeSize * cubeSize;
      const faceIdx = Math.floor(stickerIndex / size2);
      const pos = stickerIndex % size2;
      setSelectedFace(FACE_ORDER[faceIdx]);
      handleStickerClick(faceIdx, pos);
    },
    [cubeSize, handleStickerClick]
  );

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleBackToCapture = useCallback(() => {
    setPhase("capture");
    setCaptureIdx(0);
    setStickers(Array(6).fill(null));
    setExtracting(false);
    clearError();
  }, [clearError]);

  // ── Capture phase progress ─────────────────────────────────────────────
  const capturedCount = photos.filter((p) => p !== null).length;

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Image className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">图案识别</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              拍摄魔方 6 个面，系统提取贴纸图案后求解。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <button
              className={cn(
                "p-4 rounded-xl border-2 transition-all cursor-pointer",
                "hover:scale-[1.02] active:scale-[0.98]",
                cubeVariant === "standard"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setCubeVariant("standard")}
            >
              <Palette className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">标准配色</p>
              <p className="text-xs text-muted-foreground mt-1">
                白、黄、红、橙、蓝、绿六色纯色贴纸
              </p>
            </button>

            <button
              className={cn(
                "p-4 rounded-xl border-2 transition-all cursor-pointer",
                "hover:scale-[1.02] active:scale-[0.98]",
                cubeVariant === "pattern"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setCubeVariant("pattern")}
            >
              <Image className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">图案魔方</p>
              <p className="text-xs text-muted-foreground mt-1">
                图片魔方、纹理魔方等非纯色贴纸
              </p>
            </button>
          </div>

          <div className="text-left space-y-2">
            <p className="text-sm font-medium">操作步骤</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>按照提示依次拍摄魔方的 6 个面（上→右→前→下→左→后）</li>
              <li>系统自动提取每个面的贴纸图案</li>
              <li>在 3D 预览中确认是否与实物一致</li>
              <li>
                {cubeVariant === "standard"
                  ? "修正颜色后求解"
                  : "调整图案方向后求解"}
              </li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground/70">
            提示：拍摄时尽量正对魔方面，让网格线与贴纸边缘对齐
          </p>

          <Button size="lg" className="gap-2" onClick={() => setPhase("capture")}>
            <Camera className="w-4 h-4" />
            开始拍摄
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "capture") {
    const currentFace = FACE_ORDER[captureIdx];
    return (
      <div className="flex-1 flex flex-col">
        <CameraCapture
          faceLabel={FACE_CHINESE[currentFace] ?? currentFace}
          faceIndex={captureIdx}
          totalFaces={6}
          onCapture={handleCapture}
          faceLetter={currentFace}
          faceHint={FACE_HINTS[currentFace]}
        />

        {capturedCount > 0 && (
          <div className="bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted-foreground mr-2">已拍摄：</span>
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <button
                    className={cn(
                      "w-12 h-12 rounded border-2 overflow-hidden transition-all",
                      i === captureIdx
                        ? "border-primary ring-2 ring-primary/30"
                        : photo
                          ? "border-border hover:border-primary/50"
                          : "border-border/50 opacity-40"
                    )}
                    onClick={() => photo && handleRetakePhoto(i)}
                    title={photo ? `重拍${FACE_CHINESE[FACE_ORDER[i]]}面` : `${FACE_CHINESE[FACE_ORDER[i]]}面未拍摄`}
                  >
                    {photo ? (
                      <img
                        src={photo.dataUrl}
                        alt={FACE_CHINESE[FACE_ORDER[i]]}
                        className="w-full h-full object-cover"
                        style={{ transform: `rotate(${photoRotations[i]}deg)` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {FACE_CHINESE[FACE_ORDER[i]]}
                      </div>
                    )}
                  </button>
                  {photo && (
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleRotatePhoto(i); }}
                      title="旋转 90°"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // phase === "confirm"
  const selectedFaceIdx = selectedFace ? FACE_ORDER.indexOf(selectedFace) : -1;

  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 确认状态`}
      onBack={handleBackToCapture}
      state={stickerColors}
      size={cubeSize}
      stickerImages={stickerImages}
      stickerOrientations={isPattern ? stickerOrientations : undefined}
      onStickerClick={handle3DStickerClick}
      previewHint={isPattern ? "点击 3D 魔方上的面查看贴纸" : "对照实物，点击贴纸修正颜色"}
    >
      {isPattern ? (
        <div>
          <p className="text-sm font-medium mb-2">确认图案方向</p>
          <p className="text-xs text-muted-foreground mb-3">
            点击下方按钮或 3D 魔方上的贴纸，逐面确认图案方向。
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium mb-2">修正颜色</p>
          <p className="text-xs text-muted-foreground mb-3">
            先选颜色，再点击格子修正。
          </p>
          <ColorPalette
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />
        </div>
      )}

      {/* Face selection buttons */}
      <div className="flex gap-2 flex-wrap">
        {FACE_ORDER.map((face) => (
          <Button
            key={face}
            size="sm"
            variant={selectedFace === face ? "default" : "outline"}
            onClick={() => setSelectedFace(selectedFace === face ? null : face)}
          >
            {FACE_CHINESE[face]}
          </Button>
        ))}
      </div>

      <div>
        {extracting ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">正在提取贴纸图案...</p>
          </div>
        ) : selectedFaceIdx >= 0 ? (
          <div className="overflow-x-auto">
            <SingleFaceGrid
              stickers={stickers[selectedFaceIdx]}
              faceIdx={selectedFaceIdx}
              faceColor={selectedFace!}
              stickerColors={stickerColors}
              stickerOrientations={isPattern ? stickerOrientations : undefined}
              size={cubeSize}
              onStickerClick={handleStickerClick}
              showColorIndicator={!isPattern}
              showFaceLetter={isPattern}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <PatternStickerGrid
              stickers={stickers}
              stickerColors={stickerColors}
              stickerOrientations={isPattern ? stickerOrientations : undefined}
              size={cubeSize}
              onStickerClick={handleStickerClick}
              showColorIndicator={!isPattern}
              showFaceLetter={isPattern}
            />
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "重新拍摄", icon: RotateCcw, onClick: handleBackToCapture, variant: "outline" },
          { label: "开始求解", icon: Zap, onClick: solve, flex: true, disabled: extracting },
        ]}
      />
    </CubePreviewLayout>
  );
}

/**
 * Display the sticker thumbnails with color indicators in a cube net layout.
 */
function PatternStickerGrid({
  stickers,
  stickerColors,
  stickerOrientations,
  size,
  onStickerClick,
  editMode = "face",
  showColorIndicator = true,
  showFaceLetter = false,
}: {
  stickers: (string[] | null)[];
  stickerColors: CubeState;
  stickerOrientations?: StickerOrientations;
  size: number;
  onStickerClick: (faceIdx: number, pos: number) => void;
  editMode?: "face" | "orientation";
  showColorIndicator?: boolean;
  showFaceLetter?: boolean;
}) {
  const cellStyle = size === 2
    ? { width: "min(12vw, 3rem)", height: "min(12vw, 3rem)" }
    : { width: "min(10vw, 2.5rem)", height: "min(10vw, 2.5rem)" };
  const stickersPerFace = size * size;

  function renderFace(faceIdx: number, label: string) {
    const faceStickers = stickers[faceIdx];

    return (
      <div className="flex flex-col items-center">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {Array.from({ length: stickersPerFace }).map((_, i) => {
            const colorIdx = faceIdx * stickersPerFace + i;
            const color = stickerColors[colorIdx];
            const stickerUrl = faceStickers?.[i];
            const orientation = stickerOrientations?.[colorIdx] ?? 0;
            const isOrientationMode = editMode === "orientation";
            return (
              <button
                key={i}
                className={cn(
                  "border rounded-sm overflow-hidden cursor-pointer transition-all hover:scale-105 relative",
                  isOrientationMode
                    ? "border-primary/40 hover:border-primary"
                    : "border-border/30 hover:border-primary/50"
                )}
                style={cellStyle}
                onClick={() => onStickerClick(faceIdx, i)}
              >
                {stickerUrl ? (
                  <img
                    src={stickerUrl}
                    alt={`贴纸 ${i}`}
                    className="w-full h-full object-cover"
                    style={{ transform: `rotate(${orientation * 90}deg)` }}
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                  />
                )}
                {showColorIndicator && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white/80"
                    style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                  />
                )}
                {showFaceLetter && (
                  <span
                    className="absolute top-0 right-0 text-[8px] font-bold leading-none px-0.5 rounded-sm"
                    style={{
                      backgroundColor: FACE_COLORS[color]?.hex ?? "#888",
                      color: color === "U" ? "#000" : "#fff",
                    }}
                  >
                    {FACE_CHINESE[color] ?? color}
                  </span>
                )}
                {orientation > 0 && (
                  <span className="absolute bottom-0 left-0 text-[7px] font-mono leading-none px-0.5 bg-black/70 text-white rounded-sm">
                    {ORIENTATION_LABELS[orientation]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 overflow-x-auto">
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>
        {renderFace(0, "上")}
      </div>
      <div className="flex gap-px sm:gap-1">
        {renderFace(4, "左")}
        {renderFace(2, "前")}
        {renderFace(1, "右")}
        {renderFace(5, "后")}
      </div>
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>
        {renderFace(3, "下")}
      </div>
    </div>
  );
}

/**
 * Display a single face's stickers in a larger grid for detailed inspection.
 */
function SingleFaceGrid({
  stickers,
  faceIdx,
  faceColor,
  stickerColors,
  stickerOrientations,
  size,
  onStickerClick,
  showColorIndicator = true,
  showFaceLetter = false,
}: {
  stickers: string[] | null;
  faceIdx: number;
  faceColor: FaceColor;
  stickerColors: CubeState;
  stickerOrientations?: StickerOrientations;
  size: number;
  onStickerClick: (faceIdx: number, pos: number) => void;
  showColorIndicator?: boolean;
  showFaceLetter?: boolean;
}) {
  const stickersPerFace = size * size;
  const cellSize = size === 2 ? "min(20vw, 5rem)" : "min(16vw, 4rem)";

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium">{FACE_CHINESE[faceColor]}面贴纸</p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${size}, ${cellSize})`, gridTemplateRows: `repeat(${size}, ${cellSize})` }}
      >
        {Array.from({ length: stickersPerFace }).map((_, i) => {
          const colorIdx = faceIdx * stickersPerFace + i;
          const color = stickerColors[colorIdx];
          const stickerUrl = stickers?.[i];
          const orientation = stickerOrientations?.[colorIdx] ?? 0;
          return (
            <button
              key={i}
              className="border border-border/30 rounded-md overflow-hidden cursor-pointer transition-all hover:scale-105 hover:border-primary/50 relative"
              onClick={() => onStickerClick(faceIdx, i)}
            >
              {stickerUrl ? (
                <img
                  src={stickerUrl}
                  alt={`贴纸 ${i}`}
                  className="w-full h-full object-cover"
                  style={{ transform: `rotate(${orientation * 90}deg)` }}
                  draggable={false}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                />
              )}
              {showColorIndicator && (
                <span
                  className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                />
              )}
              {showFaceLetter && (
                <span
                  className="absolute top-1 right-1 text-[10px] font-bold leading-none px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: FACE_COLORS[color]?.hex ?? "#888",
                    color: color === "U" ? "#000" : "#fff",
                  }}
                >
                  {FACE_CHINESE[color] ?? color}
                </span>
              )}
              {orientation > 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-mono leading-none px-1 py-0.5 bg-black/70 text-white rounded">
                  {ORIENTATION_LABELS[orientation]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
