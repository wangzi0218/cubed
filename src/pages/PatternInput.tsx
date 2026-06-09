import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Check,
  Image,
  RotateCcw,
  Zap,
} from "lucide-react";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { PatternFaceSlot, PhotoThumb } from "@/components/cube/PatternFaceSlot";
import { CubePreviewLayout } from "@/components/layout/CubePreviewLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorMessage } from "@/components/ui/error-message";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { FACE_ORDER, FACE_COLORS } from "@/types/cube";
import type { FaceColor, CubeState } from "@/types/cube";
import { useSolve } from "@/hooks/useSolve";
import { imageDataToDataUrl } from "@/lib/image-utils";
import { createSolvedState } from "@/lib/cube-state";
import { ColorPalette } from "@/components/cube/CubeNet";
import {
  extractFaceStickersFromDataUrl,
  applyRotation,
  allFacesAssigned,
} from "@/lib/pattern-extraction";
import type { FacePhoto, FaceAssignment } from "@/lib/pattern-extraction";
import { cn } from "@/lib/utils";

type Phase = "intro" | "capture" | "assign" | "review";

export function PatternInput() {
  const { cubeSize, currentState, setAppStep } = useCubeStore();

  const [phase, setPhase] = useState<Phase>("intro");
  const [photos, setPhotos] = useState<FacePhoto[]>([]);
  const [captureIdx, setCaptureIdx] = useState(0);
  const [assignments, setAssignments] = useState<(FaceAssignment | null)[]>(
    () => Array(6).fill(null)
  );
  const [stickers, setStickers] = useState<(string[] | null)[]>(
    () => Array(6).fill(null)
  );
  const [extracting, setExtracting] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");
  const [stickerColors, setStickerColors] = useState<CubeState>(
    () => createSolvedState(cubeSize)
  );

  const { error, solve, clearError } = useSolve(stickerColors, cubeSize);

  const stickerImages = stickers.flat().every((s) => s !== null)
    ? (stickers.flat() as string[])
    : undefined;

  useEffect(() => {
    if (phase !== "review") return;

    let cancelled = false;
    setExtracting(true);

    async function extractAll() {
      const results: (string[] | null)[] = Array(6).fill(null);
      for (let i = 0; i < 6; i++) {
        const assignment = assignments[i];
        if (assignment === null) continue;
        const photo = photos[assignment.photoIndex];
        if (!photo) continue;
        try {
          const raw = await extractFaceStickersFromDataUrl(photo.dataUrl, cubeSize);
          results[i] = applyRotation(raw, cubeSize, assignment.rotation);
        } catch {
          results[i] = null;
        }
      }
      if (!cancelled) {
        setStickers(results);
        setExtracting(false);
      }
    }
    extractAll();
    return () => { cancelled = true; };
  }, [phase, assignments, photos, cubeSize]);

  // ── Capture handlers ────────────────────────────────────────────────────

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
        setPhase("assign");
      }
    },
    [captureIdx]
  );

  const handleRetakePhoto = useCallback((idx: number) => {
    setCaptureIdx(idx);
    setPhase("capture");
  }, []);

  // ── Assignment handlers ─────────────────────────────────────────────────

  const handleDrop = useCallback((faceIdx: number, photoIdx: number) => {
    setAssignments((prev) => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) {
        if (i !== faceIdx && next[i]?.photoIndex === photoIdx) {
          next[i] = null;
        }
      }
      next[faceIdx] = { photoIndex: photoIdx, rotation: 0 };
      return next;
    });
  }, []);

  const handleRotate = useCallback((faceIdx: number) => {
    setAssignments((prev) => {
      const next = [...prev];
      const current = next[faceIdx];
      if (!current) return next;
      const newRotation = ((current.rotation + 90) % 360) as 0 | 90 | 180 | 270;
      next[faceIdx] = { ...current, rotation: newRotation };
      return next;
    });
  }, []);

  const handleRemove = useCallback((faceIdx: number) => {
    setAssignments((prev) => {
      const next = [...prev];
      next[faceIdx] = null;
      return next;
    });
  }, []);

  // ── Sticker click: set color ──────────────────────────────────────────

  const handleStickerClick = useCallback(
    (faceIdx: number, pos: number) => {
      const stickersPerFace = cubeSize * cubeSize;
      const idx = faceIdx * stickersPerFace + pos;
      setStickerColors((prev) => {
        const next = [...prev];
        next[idx] = selectedColor;
        return next;
      });
    },
    [cubeSize, selectedColor]
  );

  // ── Navigation ──────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setPhotos([]);
    setCaptureIdx(0);
    setAssignments(Array(6).fill(null));
    setStickers(Array(6).fill(null));
    setExtracting(false);
    setStickerColors(createSolvedState(cubeSize));
    clearError();
  }, [clearError, cubeSize]);

  const handleBackToAssign = useCallback(() => {
    setPhase("assign");
    setStickers(Array(6).fill(null));
    setExtracting(false);
    clearError();
  }, [clearError]);

  const backToInputMethod = useCallback(() => setAppStep("input-method"), [setAppStep]);

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
              适用于面图案不同的魔方（图片魔方、纹理魔方等）。
            </p>

            <div className="text-left space-y-2 mt-4">
              <p className="text-sm font-medium">操作步骤</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>依次拍摄魔方的 6 个面</li>
                <li>点击照片选中，再点击展开图中对应的面位置</li>
                <li>旋转照片，让相邻面的边缘图案对齐</li>
                <li>确认后系统提取状态并求解</li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground/70 mt-3">
              提示：拍摄时尽量正对魔方面，让网格线与贴纸边缘对齐
            </p>
          </div>

          <Button size="lg" className="gap-2" onClick={() => setPhase("capture")}>
            <Camera className="w-4 h-4" />
            开始拍摄
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "capture") {
    return (
      <div className="flex-1 flex flex-col">
        <CameraCapture
          faceLabel={`第 ${captureIdx + 1} 面`}
          faceIndex={captureIdx}
          totalFaces={6}
          onCapture={handleCapture}
        />

        {photos.length > 0 && (
          <div className="bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted-foreground mr-2">已拍摄：</span>
              {photos.map((photo, i) => (
                <button
                  key={i}
                  className={cn(
                    "w-12 h-12 rounded border-2 overflow-hidden transition-all",
                    i === captureIdx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleRetakePhoto(i)}
                  title={`重拍第 ${i + 1} 面`}
                >
                  <img src={photo.dataUrl} alt={`Face ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "assign") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
          <PageHeader
            title={`${cubeSize}×${cubeSize} 分配面位`}
            onBack={backToInputMethod}
          />

          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* Left: photo list */}
            <div className="lg:w-48 flex flex-col gap-4">
              <p className="text-sm font-medium">拍摄的照片</p>
              <div className="flex lg:flex-col gap-2 flex-wrap">
                {photos.map((photo, i) => (
                  <PhotoThumb
                    key={i}
                    index={i}
                    dataUrl={photo.dataUrl}
                    assigned={assignments.some((a) => a?.photoIndex === i)}
                    selected={selectedPhotoIdx === i}
                    onSelect={() => setSelectedPhotoIdx(selectedPhotoIdx === i ? null : i)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-auto">
                {selectedPhotoIdx !== null ? "点击右侧面位分配" : "点击照片选中，再点击面位分配"}
              </p>
            </div>

            {/* Right: cube net face slots */}
            <div className="flex-1 flex flex-col items-center gap-6">
              <p className="text-sm font-medium">将照片分配到展开图的面位置</p>

              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center" style={{ marginLeft: "5rem" }}>
                  <PatternFaceSlot
                    face="U"
                    photoUrl={assignments[0] ? photos[assignments[0].photoIndex]?.dataUrl ?? null : null}
                    rotation={assignments[0]?.rotation ?? 0}
                    selected={selectedPhotoIdx !== null}
                    onSlotTap={() => { if (selectedPhotoIdx !== null) { handleDrop(0, selectedPhotoIdx); setSelectedPhotoIdx(null); } }}
                    onRotate={() => handleRotate(0)}
                    onRemove={() => handleRemove(0)}
                  />
                </div>

                <div className="flex gap-2">
                  {[4, 2, 1, 5].map((faceIdx) => (
                    <PatternFaceSlot
                      key={faceIdx}
                      face={FACE_ORDER[faceIdx]}
                      photoUrl={assignments[faceIdx] ? photos[assignments[faceIdx].photoIndex]?.dataUrl ?? null : null}
                      rotation={assignments[faceIdx]?.rotation ?? 0}
                      selected={selectedPhotoIdx !== null}
                      onSlotTap={() => { if (selectedPhotoIdx !== null) { handleDrop(faceIdx, selectedPhotoIdx); setSelectedPhotoIdx(null); } }}
                      onRotate={() => handleRotate(faceIdx)}
                      onRemove={() => handleRemove(faceIdx)}
                    />
                  ))}
                </div>

                <div className="flex justify-center" style={{ marginLeft: "5rem" }}>
                  <PatternFaceSlot
                    face="D"
                    photoUrl={assignments[3] ? photos[assignments[3].photoIndex]?.dataUrl ?? null : null}
                    rotation={assignments[3]?.rotation ?? 0}
                    selected={selectedPhotoIdx !== null}
                    onSlotTap={() => { if (selectedPhotoIdx !== null) { handleDrop(3, selectedPhotoIdx); setSelectedPhotoIdx(null); } }}
                    onRotate={() => handleRotate(3)}
                    onRemove={() => handleRemove(3)}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  已分配 {assignments.filter((a) => a !== null).length} / 6 面
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={handleRestart}>
                    <RotateCcw className="w-4 h-4" />
                    重来
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={!allFacesAssigned(assignments)}
                    onClick={() => setPhase("review")}
                  >
                    <Check className="w-4 h-4" />
                    继续
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // phase === "review"
  return (
    <CubePreviewLayout
      title={`${cubeSize}×${cubeSize} 提取结果`}
      onBack={backToInputMethod}
      state={currentState}
      size={cubeSize}
      stickerImages={stickerImages}
    >
      <div>
        <p className="text-sm font-medium mb-2">修正颜色</p>
        <p className="text-xs text-muted-foreground mb-3">
          先选颜色，再点击格子修正。参考左侧图片贴纸确认颜色。
        </p>
        <ColorPalette
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
      </div>

      <div>
        {extracting ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">正在提取贴纸图案...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <PatternStickerGrid
              stickers={stickers}
              stickerColors={stickerColors}
              size={cubeSize}
              onStickerClick={handleStickerClick}
            />
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <ActionBar
        actions={[
          { label: "修改分配", icon: RotateCcw, onClick: handleBackToAssign, variant: "outline" },
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
  size,
  onStickerClick,
}: {
  stickers: (string[] | null)[];
  stickerColors: CubeState;
  size: number;
  onStickerClick: (faceIdx: number, pos: number) => void;
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
            return (
              <button
                key={i}
                className="border border-border/30 rounded-sm overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:scale-105 relative"
                style={cellStyle}
                onClick={() => onStickerClick(faceIdx, i)}
              >
                {stickerUrl ? (
                  <img
                    src={stickerUrl}
                    alt={`Sticker ${i}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                  />
                )}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white/80"
                  style={{ backgroundColor: FACE_COLORS[color]?.hex ?? "#888" }}
                />
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
