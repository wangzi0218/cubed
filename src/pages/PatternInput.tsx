import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Palette, RotateCcw, Zap, RotateCw } from "lucide-react";
import { CubeViewer } from "@/components/cube/CubeViewer";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionBar } from "@/components/layout/ActionBar";
import { ErrorMessage } from "@/components/ui/error-message";
import { useCubeStore } from "@/stores/cube-store";
import { useSolve } from "@/hooks/useSolve";
import { createSolvedState } from "@/lib/cube-state";
import { createInitialOrientations } from "@/lib/sticker-orientation";
import { getRelatedStickers } from "@/lib/sticker-adjacency";
import { FACE_ORDER } from "@/types/cube";
import type { FaceColor, CubeState, StickerOrientations } from "@/types/cube";
import { ColorPalette } from "@/components/cube/CubeNet";
import type { FacePhoto } from "@/lib/pattern-extraction";
import { imageDataToDataUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

const FACE_CHINESE: Record<string, string> = { U: "上", R: "右", F: "前", D: "下", L: "左", B: "后" };
const FACE_HINTS: Record<string, string> = {
  U: "白色面朝上，正对摄像头", R: "红色面朝右，正对摄像头",
  F: "蓝色面朝前，正对摄像头", D: "黄色面朝下，正对摄像头",
  L: "橙色面朝左，正对摄像头", B: "绿色面朝后，正对摄像头",
};
const FACE_COLORS_HEX: Record<string, string> = { U: "#ffffff", R: "#b71234", F: "#0046ad", D: "#ffd500", L: "#ff5800", B: "#009b48" };
const ORIENT_LABELS = ["0°", "90°", "180°", "270°"];

// ── Memoized grid components (prevent re-render cascade) ──────────────────

const PatternStickerGrid = memo(function PatternStickerGrid({
  stickers, stickerColors, stickerOrientations, size, onStickerClick,
  showColorIndicator = true, showFaceLetter = false, highlighted = [],
}: {
  stickers: (string[] | null)[]; stickerColors: CubeState; stickerOrientations?: StickerOrientations;
  size: number; onStickerClick: (faceIdx: number, pos: number) => void;
  showColorIndicator?: boolean; showFaceLetter?: boolean; highlighted?: number[];
}) {
  const cellStyle = size === 2 ? { width: "min(12vw, 3rem)", height: "min(12vw, 3rem)" } : { width: "min(10vw, 2.5rem)", height: "min(10vw, 2.5rem)" };
  const spf = size * size;
  function renderFace(fi: number, label: string) {
    const fs = stickers[fi];
    return (
      <div className="flex flex-col items-center">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: spf }).map((_, i) => {
            const ci = fi * spf + i, color = stickerColors[ci], url = fs?.[i], orient = stickerOrientations?.[ci] ?? 0;
            return (
              <button key={i} className={cn("border rounded-sm overflow-hidden cursor-pointer transition-all hover:scale-105 relative", highlighted.includes(ci) ? "border-primary ring-2 ring-primary/50" : "border-border/30")} style={cellStyle} onClick={() => onStickerClick(fi, i)}>
                {url ? <img src={url} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${orient * 90}deg)` }} draggable={false} /> : <div className="w-full h-full" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />}
                {showColorIndicator && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white/80" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />}
                {showFaceLetter && <span className="absolute top-0 right-0 text-[8px] font-bold leading-none px-0.5 rounded-sm" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888", color: color === "U" ? "#000" : "#fff" }}>{FACE_CHINESE[color] ?? color}</span>}
                {orient > 0 && <span className="absolute bottom-0 left-0 text-[7px] font-mono leading-none px-0.5 bg-black/70 text-white rounded-sm">{ORIENT_LABELS[orient]}</span>}
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
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>{renderFace(0, "上")}</div>
      <div className="flex gap-px sm:gap-1">{renderFace(4, "左")}{renderFace(2, "前")}{renderFace(1, "右")}{renderFace(5, "后")}</div>
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>{renderFace(3, "下")}</div>
    </div>
  );
});

const SingleFaceGrid = memo(function SingleFaceGrid({
  stickers, faceIdx, faceColor, stickerColors, stickerOrientations, size, onStickerClick,
}: {
  stickers: string[] | null; faceIdx: number; faceColor: FaceColor; stickerColors: CubeState;
  stickerOrientations?: StickerOrientations; size: number;
  onStickerClick: (faceIdx: number, pos: number) => void;
}) {
  const spf = size * size, cellSize = size === 2 ? "min(20vw, 5rem)" : "min(16vw, 4rem)";
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium">{FACE_CHINESE[faceColor]}面贴纸</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, ${cellSize})`, gridTemplateRows: `repeat(${size}, ${cellSize})` }}>
        {Array.from({ length: spf }).map((_, i) => {
          const ci = faceIdx * spf + i, color = stickerColors[ci], url = stickers?.[i], orient = stickerOrientations?.[ci] ?? 0;
          return (
            <button key={i} className="border border-border/30 rounded-md overflow-hidden cursor-pointer transition-all hover:scale-105 hover:border-primary/50 relative" onClick={() => onStickerClick(faceIdx, i)}>
              {url ? <img src={url} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${orient * 90}deg)` }} draggable={false} /> : <div className="w-full h-full" style={{ backgroundColor: FACE_COLORS_HEX[color] ?? "#888" }} />}
              {orient > 0 && <span className="absolute bottom-1 left-1 text-[9px] font-mono leading-none px-1 py-0.5 bg-black/70 text-white rounded">{ORIENT_LABELS[orient]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const PatternInput = memo(function PatternInput() {
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
  const [highlightedStickers, setHighlightedStickers] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<FaceColor>("U");

  const isPattern = cubeVariant === "pattern";
  const stickerImages = useMemo(() => { const f = stickers.flat(); return f.every((s) => s !== null) ? (f as string[]) : undefined; }, [stickers]);
  const { error, solve } = useSolve(stickerColors, cubeSize, stickerImages, isPattern ? stickerOrientations : undefined);

  // Use refs to avoid re-triggering the extraction effect
  const photosRef = useRef(photos);
  const photoRotationsRef = useRef(photoRotations);
  const cubeSizeRef = useRef(cubeSize);
  const cubeVariantRef = useRef(cubeVariant);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => { photoRotationsRef.current = photoRotations; }, [photoRotations]);
  useEffect(() => { cubeSizeRef.current = cubeSize; }, [cubeSize]);
  useEffect(() => { cubeVariantRef.current = cubeVariant; }, [cubeVariant]);

  // Extraction — only depends on phase, reads other values from refs
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "confirm" && phase === "confirm" && !extractedRef.current) {
      prevPhaseRef.current = phase; extractedRef.current = true;
      let cancelled = false; setExtracting(true);
      const p = photosRef.current, pr = photoRotationsRef.current, cs = cubeSizeRef.current, cv = cubeVariantRef.current;
      (async () => {
        const { extractFaceStickersFromDataUrl, applyRotation } = await import("@/lib/pattern-extraction");
        const { classifyStickerColor } = await import("@/lib/image-utils");
        const spf = cs * cs;
        const results: (string[] | null)[] = Array(6).fill(null);
        const colors: FaceColor[] = createSolvedState(cs);
        for (let i = 0; i < 6; i++) {
          const photo = p[i]; if (!photo) continue;
          try {
            const raw = await extractFaceStickersFromDataUrl(photo.dataUrl, cs, true, window.innerWidth, window.innerHeight);
            results[i] = applyRotation(raw, cs, pr[i]);
            if (cv === "standard") { for (let j = 0; j < spf; j++) { try { colors[i * spf + j] = await classifyStickerColor(raw[j]); } catch {} } }
          } catch { results[i] = null; }
        }
        if (!cancelled) { setStickers(results); setStickerColors(colors); setExtracting(false); }
      })();
      return () => { cancelled = true; };
    }
  }, [phase]);

  // Callbacks (all with stable deps)
  const handleCapture = useCallback((imageData: ImageData) => {
    const dataUrl = imageDataToDataUrl(imageData);
    setPhotos((prev) => { const n = [...prev]; n[captureIdx] = { dataUrl, originalIndex: captureIdx }; return n; });
    if (captureIdx < 5) setCaptureIdx((i) => i + 1); else setPhase("confirm");
  }, [captureIdx]);

  const handleRetakePhoto = useCallback((idx: number) => { setCaptureIdx(idx); setPhase("capture"); }, []);
  const handleRotatePhoto = useCallback((idx: number) => { setPhotoRotations((p) => { const n = [...p]; n[idx] = ((n[idx] + 90) % 360) as 0 | 90 | 180 | 270; return n; }); }, []);
  const handleBackToCapture = useCallback(() => { setPhase("capture"); setCaptureIdx(0); }, []);

  const handleStickerClick = useCallback((faceIdx: number, pos: number) => {
    if (isPattern) { const idx = faceIdx * cubeSize * cubeSize + pos; setStickerOrientations((p) => { const n = [...p]; n[idx] = ((p[idx] ?? 0) + 1) % 4; return n; }); }
  }, [cubeSize, isPattern]);

  const handleStickerAction = useCallback((faceIdx: number, pos: number) => {
    const idx = faceIdx * cubeSize * cubeSize + pos;
    setStickerActionFace(faceIdx);
    setStickerActionPos(pos);
    setHighlightedStickers(getRelatedStickers(idx, cubeSize));
  }, [cubeSize]);

  const handleRotateSticker = useCallback(() => {
    if (stickerActionFace === null || stickerActionPos === null) return;
    // Batch rotate: update all related stickers on the same piece
    const idx = stickerActionFace * cubeSize * cubeSize + stickerActionPos;
    const related = getRelatedStickers(idx, cubeSize);
    setStickerOrientations((prev) => {
      const next = [...prev];
      for (const ri of related) {
        next[ri] = ((prev[ri] ?? 0) + 1) % 4;
      }
      return next;
    });
    setStickerActionFace(null);
    setStickerActionPos(null);
    setHighlightedStickers([]);
  }, [stickerActionFace, stickerActionPos, cubeSize]);

  // Stable callback references for memoized children
  const gridClick = isPattern ? handleStickerAction : handleStickerClick;

  const capturedCount = photos.filter((p) => p !== null).length;
  const selectedFaceIdx = selectedFace !== null ? FACE_ORDER.indexOf(selectedFace) : -1;

  // ── Render ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Image className="w-8 h-8 text-primary" /></div>
          <div className="space-y-3"><h3 className="text-lg font-semibold">图案识别</h3><p className="text-muted-foreground text-sm">拍摄魔方 6 个面，系统自动提取贴纸并分配到对应面，确认后求解。</p></div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <button className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02]", cubeVariant === "standard" ? "border-primary bg-primary/5" : "border-border")} onClick={() => setCubeVariant("standard")}><Palette className="w-6 h-6 text-primary mb-2" /><p className="text-sm font-semibold">标准配色</p></button>
            <button className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02]", cubeVariant === "pattern" ? "border-primary bg-primary/5" : "border-border")} onClick={() => setCubeVariant("pattern")}><Image className="w-6 h-6 text-primary mb-2" /><p className="text-sm font-semibold">图案魔方</p></button>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setPhase("capture")}><Camera className="w-4 h-4" />开始拍摄</Button>
        </div>
      </div>
    );
  }

  if (phase === "capture") {
    const cf = FACE_ORDER[captureIdx];
    return (
      <div className="flex-1 flex flex-col">
        <CameraCapture faceLabel={FACE_CHINESE[cf]} faceIndex={captureIdx} totalFaces={6} onCapture={handleCapture} faceLetter={cf} faceHint={FACE_HINTS[cf]} />
        {capturedCount > 0 && (
          <div className="bg-muted/50 px-4 py-3"><div className="flex items-center gap-2 justify-center">
            <span className="text-xs text-muted-foreground mr-2">已拍摄：</span>
            {photos.map((photo, i) => (
              <div key={i} className="relative group">
                <button className={cn("w-12 h-12 rounded border-2 overflow-hidden transition-all", i === captureIdx ? "border-primary ring-2 ring-primary/30" : photo ? "border-border" : "border-border/50 opacity-40")} onClick={() => photo && handleRetakePhoto(i)}>
                  {photo ? <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${photoRotations[i]}deg)` }} /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{FACE_CHINESE[FACE_ORDER[i]]}</div>}
                </button>
                {photo && <button className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRotatePhoto(i); }}><RotateCcw className="w-3 h-3" /></button>}
              </div>
            ))}
          </div></div>
        )}
      </div>
    );
  }

  // ── 3D sticker click handler ───────────────────────────────────────────
  const handle3DStickerClick = useCallback((stickerIndex: number) => {
    const spf = cubeSize * cubeSize;
    const faceIdx = Math.floor(stickerIndex / spf);
    const pos = stickerIndex % spf;
    setStickerActionFace(faceIdx);
    setStickerActionPos(pos);
    setHighlightedStickers(getRelatedStickers(stickerIndex, cubeSize));
  }, [cubeSize]);

  // ── Confirm phase ──────────────────────────────────────────────────────
  const incompleteFaces = stickers.filter((s) => s === null || s.some((st) => st === null)).length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <PageHeader title="确认魔方状态" onBack={handleBackToCapture} />
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          {/* Left: 3D cube (main view) */}
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square rounded-xl border bg-card/50 overflow-hidden">
              {extracting ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">正在提取贴纸图案...</p>
                </div>
              ) : (
                <CubeViewer
                  state={stickerColors}
                  size={cubeSize}
                  stickerImages={stickerImages}
                  stickerOrientations={isPattern ? stickerOrientations : undefined}
                  onStickerClick={isPattern ? handle3DStickerClick : undefined}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">拖拽旋转查看，点击贴纸调整</p>
          </div>

          {/* Right: detail panel */}
          <div className="lg:w-72 shrink-0 flex flex-col gap-4">
            {/* Instructions */}
            {isPattern ? (
              <div>
                <p className="text-sm font-medium">确认图案</p>
                <p className="text-xs text-muted-foreground">
                  对照实物魔方，检查贴纸是否正确。点击 3D 魔方或展开图上的贴纸进行调整。
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">修正颜色</p>
                <p className="text-xs text-muted-foreground">先选颜色，再点击格子修正。</p>
                <ColorPalette selectedColor={selectedColor} onSelect={setSelectedColor} />
              </div>
            )}

            {/* Grid */}
            {!extracting && (selectedFaceIdx >= 0
              ? <SingleFaceGrid stickers={stickers[selectedFaceIdx]} faceIdx={selectedFaceIdx} faceColor={selectedFace!} stickerColors={stickerColors} stickerOrientations={isPattern ? stickerOrientations : undefined} size={cubeSize} onStickerClick={gridClick} />
              : <PatternStickerGrid stickers={stickers} stickerColors={stickerColors} stickerOrientations={isPattern ? stickerOrientations : undefined} size={cubeSize} onStickerClick={gridClick} showColorIndicator={!isPattern} showFaceLetter={isPattern} highlighted={highlightedStickers} />
            )}

            {/* Face selection buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
              {FACE_ORDER.map((f) => <Button key={f} size="sm" variant={selectedFace === f ? "default" : "outline"} onClick={() => setSelectedFace(selectedFace === f ? null : f)}>{FACE_CHINESE[f]}</Button>)}
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {incompleteFaces > 0 && <p className="text-xs text-muted-foreground text-center">有 {incompleteFaces} 个面的贴纸尚未提取完成</p>}

        <ActionBar actions={[
          { label: "重新拍摄", icon: RotateCcw, onClick: handleBackToCapture, variant: "outline" },
          { label: "开始求解", icon: Zap, onClick: solve, flex: true, disabled: extracting || incompleteFaces > 0 },
        ]} />
      </div>

      {/* Simplified sticker action popup */}
      {stickerActionFace !== null && isPattern && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setStickerActionFace(null); setStickerActionPos(null); setHighlightedStickers([]); }}>
          <div className="bg-card rounded-xl p-6 max-w-xs w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-center">调整贴纸</p>
            <p className="text-xs text-muted-foreground text-center">
              {FACE_CHINESE[FACE_ORDER[stickerActionFace]]}面 · 第 {(stickerActionPos ?? 0) + 1} 格
            </p>
            <Button variant="outline" className="w-full gap-2" onClick={handleRotateSticker}>
              <RotateCw className="w-4 h-4" /> 旋转 90°
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setStickerActionFace(null); setStickerActionPos(null); setHighlightedStickers([]); }}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
