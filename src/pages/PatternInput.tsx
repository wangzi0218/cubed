import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Palette, RotateCcw, Zap } from "lucide-react";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionBar } from "@/components/layout/ActionBar";
import { ErrorMessage } from "@/components/ui/error-message";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
import { createSolvedState } from "@/lib/cube-state";
import { createInitialOrientations } from "@/lib/sticker-orientation";
import type { FaceColor, CubeState, StickerOrientations } from "@/types/cube";
import { FACE_ORDER } from "@/types/cube";
import type { FacePhoto } from "@/lib/pattern-extraction";
import { imageDataToDataUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

const FACE_CHINESE: Record<string, string> = {
  U: "上", R: "右", F: "前", D: "下", L: "左", B: "后",
};

const FACE_HINTS: Record<string, string> = {
  U: "白色面（或顶部面）朝上，正对摄像头",
  R: "红色面（或右侧面）朝右，正对摄像头",
  F: "蓝色面（或前面）朝前，正对摄像头",
  D: "黄色面（或底面）朝下，正对摄像头",
  L: "橙色面（或左侧面）朝左，正对摄像头",
  B: "绿色面（或后面）朝后，正对摄像头",
};

export function PatternInput() {
  const { cubeSize } = useCubeStore();
  const [phase, setPhase] = useState<"intro" | "capture" | "confirm">("intro");
  const [cubeVariant, setCubeVariant] = useState<"standard" | "pattern">("standard");
  const [captureIdx, setCaptureIdx] = useState(0);
  const [photos, setPhotos] = useState<(FacePhoto | null)[]>(() => Array(6).fill(null));
  const [photoRotations, setPhotoRotations] = useState<(0 | 90 | 180 | 270)[]>(() => Array(6).fill(0));
  const [stickers, setStickers] = useState<(string[] | null)[]>(() => Array(6).fill(null));
  const [extracting, setExtracting] = useState(false);
  const extractedRef = useRef(false);
  const [stickerColors, setStickerColors] = useState<CubeState>(() => createSolvedState(cubeSize));
  const [stickerOrientations, setStickerOrientations] = useState<StickerOrientations>(() => createInitialOrientations(cubeSize));
  const [selectedFace, setSelectedFace] = useState<FaceColor | null>(null);
  const [stickerActionFace, setStickerActionFace] = useState<number | null>(null);
  const [stickerActionPos, setStickerActionPos] = useState<number | null>(null);

  const isPattern = cubeVariant === "pattern";
  const stickerImages = useMemo(() => {
    const flat = stickers.flat();
    return flat.every((s) => s !== null) ? (flat as string[]) : undefined;
  }, [stickers]);
  const { error, solve } = useSolve(stickerColors, cubeSize, stickerImages, isPattern ? stickerOrientations : undefined);

  // Extraction effect
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "confirm" && phase === "confirm" && !extractedRef.current) {
      prevPhaseRef.current = phase;
      extractedRef.current = true;
      let cancelled = false;
      setExtracting(true);

      async function extractAll() {
        const { extractFaceStickersFromDataUrl, applyRotation } = await import("@/lib/pattern-extraction");
        const { classifyStickerColor } = await import("@/lib/image-utils");
        const stickersPerFace = cubeSize * cubeSize;
        const results: (string[] | null)[] = Array(6).fill(null);
        const colors: FaceColor[] = createSolvedState(cubeSize);

        for (let i = 0; i < 6; i++) {
          const photo = photos[i];
          if (!photo) continue;
          try {
            const raw = await extractFaceStickersFromDataUrl(photo.dataUrl, cubeSize, true, window.innerWidth, window.innerHeight);
            results[i] = applyRotation(raw, cubeSize, photoRotations[i]);
            if (cubeVariant === "standard") {
              for (let j = 0; j < stickersPerFace; j++) {
                try { colors[i * stickersPerFace + j] = await classifyStickerColor(raw[j]); } catch {}
              }
            }
          } catch { results[i] = null; }
        }
        if (!cancelled) {
          setStickers(results);
          setStickerColors(colors);
          setExtracting(false);
        }
      }
      extractAll();
      return () => { cancelled = true; };
    }
  }, [phase, photos, photoRotations, cubeSize, cubeVariant]);

  const capturedCount = photos.filter((p) => p !== null).length;

  const handleCapture = useCallback(
    (imageData: ImageData) => {
      const dataUrl = imageDataToDataUrl(imageData);
      setPhotos((prev) => {
        const next = [...prev];
        next[captureIdx] = { dataUrl, originalIndex: captureIdx };
        return next;
      });
      if (captureIdx < 5) setCaptureIdx((i) => i + 1);
      else setPhase("confirm");
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

  const handleBackToCapture = useCallback(() => {
    setPhase("capture");
    setCaptureIdx(0);
  }, []);

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
              className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]", cubeVariant === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
              onClick={() => setCubeVariant("standard")}
            >
              <Palette className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">标准配色</p>
              <p className="text-xs text-muted-foreground mt-1">白、黄、红、橙、蓝、绿六色纯色贴纸</p>
            </button>
            <button
              className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]", cubeVariant === "pattern" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
              onClick={() => setCubeVariant("pattern")}
            >
              <Image className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">图案魔方</p>
              <p className="text-xs text-muted-foreground mt-1">图片魔方、纹理魔方等非纯色贴纸</p>
            </button>
          </div>
          <div className="text-left space-y-2">
            <p className="text-sm font-medium">操作步骤</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>按照提示依次拍摄魔方的 6 个面（上→右→前→下→左→后）</li>
              <li>系统自动提取每个面的贴纸图案</li>
              <li>确认后求解</li>
            </ol>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setPhase("capture")}>
            <Camera className="w-4 h-4" />开始拍摄
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
                    className={cn("w-12 h-12 rounded border-2 overflow-hidden transition-all", i === captureIdx ? "border-primary ring-2 ring-primary/30" : photo ? "border-border hover:border-primary/50" : "border-border/50 opacity-40")}
                    onClick={() => photo && handleRetakePhoto(i)}
                  >
                    {photo ? (
                      <img src={photo.dataUrl} alt={FACE_CHINESE[FACE_ORDER[i]]} className="w-full h-full object-cover" style={{ transform: `rotate(${photoRotations[i]}deg)` }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{FACE_CHINESE[FACE_ORDER[i]]}</div>
                    )}
                  </button>
                  {photo && (
                    <button className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRotatePhoto(i); }} title="旋转 90°">
                      <RotateCcw className="w-3 h-3" />
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

  // ── Sticker editing handlers ──────────────────────────────────────────
  const handleStickerClick = useCallback(
    (faceIdx: number, pos: number) => {
      if (isPattern) {
        const idx = faceIdx * cubeSize * cubeSize + pos;
        setStickerOrientations((prev) => {
          const next = [...prev];
          next[idx] = ((prev[idx] ?? 0) + 1) % 4;
          return next;
        });
      }
    },
    [cubeSize, isPattern]
  );

  const handleStickerAction = useCallback((faceIdx: number, pos: number) => {
    setStickerActionFace(faceIdx);
    setStickerActionPos(pos);
  }, []);

  const handleMoveSticker = useCallback(
    (targetFaceIdx: number) => {
      if (stickerActionFace === null || stickerActionPos === null) return;
      if (stickerActionFace === targetFaceIdx) {
        setStickerActionFace(null);
        setStickerActionPos(null);
        return;
      }
      const spf = cubeSize * cubeSize;
      const srcIdx = stickerActionFace * spf + stickerActionPos;
      const tgtIdx = targetFaceIdx * spf + stickerActionPos;

      setStickers((prev) => {
        const next = [...prev];
        const src = [...(next[stickerActionFace!] ?? [])];
        const tgt = [...(next[targetFaceIdx] ?? [])];
        const tmp = src[stickerActionPos!];
        src[stickerActionPos!] = tgt[stickerActionPos!];
        tgt[stickerActionPos!] = tmp;
        next[stickerActionFace!] = src;
        next[targetFaceIdx] = tgt;
        return next;
      });
      setStickerColors((prev) => {
        const next = [...prev];
        const tmp = next[srcIdx]; next[srcIdx] = next[tgtIdx]; next[tgtIdx] = tmp;
        return next;
      });
      setStickerOrientations((prev) => {
        const next = [...prev];
        const tmp = next[srcIdx]; next[srcIdx] = next[tgtIdx]; next[tgtIdx] = tmp;
        return next;
      });
      setStickerActionFace(null);
      setStickerActionPos(null);
    },
    [stickerActionFace, stickerActionPos, cubeSize]
  );

  const handleRotateSticker = useCallback(() => {
    if (stickerActionFace === null || stickerActionPos === null) return;
    handleStickerClick(stickerActionFace, stickerActionPos);
    setStickerActionFace(null);
    setStickerActionPos(null);
  }, [stickerActionFace, stickerActionPos, handleStickerClick]);

  // confirm
  const selectedFaceIdx = selectedFace !== null ? FACE_ORDER.indexOf(selectedFace) : -1;

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <PageHeader title={`${cubeSize}×${cubeSize} 确认状态`} onBack={handleBackToCapture} />
        <div className="flex-1 flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            {extracting
              ? "正在提取贴纸图案..."
              : isPattern
                ? "对照实物，点击贴纸旋转方向或移动到其他面。"
                : "先选颜色，再点击格子修正。"}
          </p>

          {/* Grid */}
          {!extracting && (
            <div className="overflow-x-auto">
              {selectedFaceIdx >= 0 ? (
                <SingleFaceGrid
                  stickers={stickers[selectedFaceIdx]}
                  faceIdx={selectedFaceIdx}
                  faceColor={selectedFace!}
                  stickerColors={stickerColors}
                  stickerOrientations={isPattern ? stickerOrientations : undefined}
                  size={cubeSize}
                  onStickerClick={isPattern ? handleStickerAction : handleStickerClick}
                  showColorIndicator={!isPattern}
                  showFaceLetter={isPattern}
                />
              ) : (
                <PatternStickerGrid
                  stickers={stickers}
                  stickerColors={stickerColors}
                  stickerOrientations={isPattern ? stickerOrientations : undefined}
                  size={cubeSize}
                  onStickerClick={isPattern ? handleStickerAction : handleStickerClick}
                  showColorIndicator={!isPattern}
                  showFaceLetter={isPattern}
                />
              )}
            </div>
          )}

          {/* Face selection buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
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

          {/* Sticker action popup */}
          {stickerActionFace !== null && isPattern && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setStickerActionFace(null); setStickerActionPos(null); }}>
              <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-medium text-center">贴纸操作</p>
                <p className="text-xs text-muted-foreground text-center">
                  {FACE_CHINESE[FACE_ORDER[stickerActionFace]]}面 第 {(stickerActionPos ?? 0) + 1} 格
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={handleRotateSticker}>旋转方向（90°）</Button>
                  <p className="text-xs text-muted-foreground text-center">移动到：</p>
                  <div className="grid grid-cols-3 gap-2">
                    {FACE_ORDER.map((face, idx) => (
                      <Button key={face} variant="outline" size="sm" disabled={idx === stickerActionFace} onClick={() => handleMoveSticker(idx)}>
                        {FACE_CHINESE[face]}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => { setStickerActionFace(null); setStickerActionPos(null); }}>取消</Button>
              </div>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <ActionBar
            actions={[
              { label: "重新拍摄", icon: RotateCcw, onClick: handleBackToCapture, variant: "outline" },
              { label: "开始求解", icon: Zap, onClick: solve, flex: true, disabled: extracting },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

const FACE_COLORS_HEX: Record<string, string> = {
  U: "#ffffff", R: "#b71234", F: "#0046ad",
  D: "#ffd500", L: "#ff5800", B: "#009b48",
};

function PatternStickerGrid({
  stickers,
  stickerColors,
  stickerOrientations,
  size,
  onStickerClick,
  showColorIndicator = true,
  showFaceLetter = false,
}: {
  stickers: (string[] | null)[];
  stickerColors: CubeState;
  stickerOrientations?: StickerOrientations;
  size: number;
  onStickerClick: (faceIdx: number, pos: number) => void;
  showColorIndicator?: boolean;
  showFaceLetter?: boolean;
}) {
  const cellStyle = size === 2
    ? { width: "min(12vw, 3rem)", height: "min(12vw, 3rem)" }
    : { width: "min(10vw, 2.5rem)", height: "min(10vw, 2.5rem)" };
  const stickersPerFace = size * size;

  const ORIENT_LABELS = ["0°", "90°", "180°", "270°"];

  function renderFace(faceIdx: number, label: string) {
    const faceStickers = stickers[faceIdx];
    return (
      <div className="flex flex-col items-center">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: stickersPerFace }).map((_, i) => {
            const colorIdx = faceIdx * stickersPerFace + i;
            const color = stickerColors[colorIdx];
            const stickerUrl = faceStickers?.[i];
            const orientation = stickerOrientations?.[colorIdx] ?? 0;
            return (
              <button
                key={i}
                className="border border-border/30 rounded-sm overflow-hidden cursor-pointer transition-all hover:scale-105 relative"
                style={cellStyle}
                onClick={() => onStickerClick(faceIdx, i)}
              >
                {stickerUrl ? (
                  <img src={stickerUrl} alt={`贴纸 ${i}`} className="w-full h-full object-cover" style={{ transform: `rotate(${orientation * 90}deg)` }} draggable={false} />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />
                )}
                {showColorIndicator && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white/80" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />
                )}
                {showFaceLetter && (
                  <span className="absolute top-0 right-0 text-[8px] font-bold leading-none px-0.5 rounded-sm" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888", color: color === "U" ? "#000" : "#fff" }}>
                    {FACE_CHINESE[color] ?? color}
                  </span>
                )}
                {orientation > 0 && (
                  <span className="absolute bottom-0 left-0 text-[7px] font-mono leading-none px-0.5 bg-black/70 text-white rounded-sm">
                    {ORIENT_LABELS[orientation]}
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
  const ORIENT_LABELS = ["0°", "90°", "180°", "270°"];

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
                <img src={stickerUrl} alt={`贴纸 ${i}`} className="w-full h-full object-cover" style={{ transform: `rotate(${orientation * 90}deg)` }} draggable={false} />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />
              )}
              {showColorIndicator && (
                <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />
              )}
              {showFaceLetter && (
                <span className="absolute top-1 right-1 text-[10px] font-bold leading-none px-1 py-0.5 rounded" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888", color: color === "U" ? "#000" : "#fff" }}>
                  {FACE_CHINESE[color] ?? color}
                </span>
              )}
              {orientation > 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-mono leading-none px-1 py-0.5 bg-black/70 text-white rounded">
                  {ORIENT_LABELS[orientation]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
