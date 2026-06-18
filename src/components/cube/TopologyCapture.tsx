import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, RefreshCw } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { rgbToHsv, classifyPixel } from "@/lib/color-detection";
import { FACE_COLORS, FACE_ORDER } from "@/types/cube";
import type { FaceColor } from "@/types/cube";

const FACE_CHINESE: Record<string, string> = {
  U: "上", R: "右", F: "前", D: "下", L: "左", B: "后",
};
import { cn } from "@/lib/utils";

interface TopologyCaptureProps {
  type: "edge" | "corner";
  faces: string[];
  onCapture: (colors: FaceColor[]) => void;
  onRetake: () => void;
  captured: boolean;
  capturedColors: FaceColor[];
  onConfirm: () => void;
}

/**
 * Detect dominant FaceColor from a rectangular region of ImageData.
 */
function detectRegionColor(
  data: Uint8ClampedArray,
  imgW: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): FaceColor {
  const votes: Record<FaceColor, number> = {
    U: 0, D: 0, L: 0, R: 0, F: 0, B: 0,
  };
  const step = 3;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const idx = (y * imgW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const hsv = rgbToHsv(r, g, b);
      votes[classifyPixel(hsv.h, hsv.s, hsv.v)]++;
    }
  }
  let best: FaceColor = "U";
  let bestN = 0;
  for (const [c, n] of Object.entries(votes) as [FaceColor, number][]) {
    if (n > bestN) {
      bestN = n;
      best = c;
    }
  }
  return best;
}

// ── Colour editing popup ───────────────────────────────────────────────────

function ColorEditPopup({
  selected,
  onSelect,
  onClose,
}: {
  selected: FaceColor;
  onSelect: (c: FaceColor) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20">
      <div className="bg-popover border rounded-lg shadow-xl p-2 flex gap-1.5">
        {FACE_ORDER.map((c) => (
          <button
            key={c}
            className={cn(
              "w-8 h-8 rounded-md border-2 cursor-pointer transition-transform hover:scale-110",
              c === selected
                ? "border-primary ring-2 ring-primary scale-110"
                : "border-border/50"
            )}
            style={{ backgroundColor: FACE_COLORS[c].hex }}
            onClick={() => {
              onSelect(c);
              onClose();
            }}
            title={FACE_COLORS[c].label}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function TopologyCapture({
  type,
  faces,
  onCapture,
  onRetake,
  captured,
  capturedColors,
  onConfirm,
}: TopologyCaptureProps) {
  const { videoRef, error: cameraError, isReady, captureFrame, switchCamera } = useCamera();
  const [localColors, setLocalColors] = useState<FaceColor[]>(capturedColors);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  // Sync local state when capturedColors prop changes
  useEffect(() => {
    setLocalColors(capturedColors);
  }, [capturedColors]);

  const handleCapture = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return;

    const { width, height, data } = frame;
    const n = type === "edge" ? 2 : 3;

    // Divide the centre strip of the frame into n sections.
    // We use the middle 40% vertically and 60% horizontally.
    const stripTop = Math.floor(height * 0.3);
    const stripBottom = Math.floor(height * 0.7);
    const stripLeft = Math.floor(width * 0.2);
    const stripRight = Math.floor(width * 0.8);
    const stripW = stripRight - stripLeft;

    const detected: FaceColor[] = [];
    for (let i = 0; i < n; i++) {
      const x0 = stripLeft + Math.floor((stripW * i) / n);
      const x1 = stripLeft + Math.floor((stripW * (i + 1)) / n);
      detected.push(detectRegionColor(data, width, x0, stripTop, x1, stripBottom));
    }

    setLocalColors(detected);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    onCapture(detected);
  }, [captureFrame, type, onCapture]);

  const handleRetake = useCallback(() => {
    setEditingIdx(null);
    onRetake();
  }, [onRetake]);

  const handleColorEdit = useCallback(
    (idx: number, color: FaceColor) => {
      const next = [...localColors];
      next[idx] = color;
      setLocalColors(next);
    },
    [localColors]
  );

  const handleConfirmColors = useCallback(() => {
    onCapture(localColors);
    onConfirm();
  }, [localColors, onCapture, onConfirm]);

  const segmentLabels =
    type === "edge"
      ? [faces[0], faces[1]].map((f) => FACE_CHINESE[f] ?? f)
      : [faces[0], faces[1], faces[2]].map((f) => FACE_CHINESE[f] ?? f);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Camera or preview */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
        {/* Camera view (always rendered, hidden when captured) */}
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            captured && "hidden"
          )}
          autoPlay
          playsInline
          muted
        />

        {/* Flash overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white/60 z-10 animate-pulse" />
        )}

        {/* Guide overlay — only when live camera */}
        {!captured && (
          <div
            ref={guideRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className={cn(
                "border-2 border-dashed border-white/60 rounded-lg",
                type === "edge" ? "w-3/4 h-16" : "w-3/4 h-24"
              )}
            >
              <div className="flex h-full">
                {segmentLabels.map((label, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 flex items-center justify-center text-white/70 text-xs font-medium",
                      i < segmentLabels.length - 1 &&
                        "border-r border-dashed border-white/40"
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Captured preview */}
        {captured && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <div className="flex gap-4 items-end">
              {localColors.map((color, i) => (
                <div key={i} className="relative flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: FACE_COLORS[color].hex }}
                      onClick={() =>
                        setEditingIdx(editingIdx === i ? null : i)
                      }
                    />
                    {editingIdx === i && (
                      <ColorEditPopup
                        selected={color}
                        onSelect={(c) => handleColorEdit(i, c)}
                        onClose={() => setEditingIdx(null)}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {segmentLabels[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-destructive text-center px-4">
              {cameraError}
            </p>
          </div>
        )}
      </div>

      {/* Hint text */}
      {!captured && (
        <p className="text-xs text-muted-foreground text-center">
          将{type === "edge" ? "两个面的相接处" : "三个面的交汇处"}对准框内，点击拍照
        </p>
      )}

      {captured && (
        <p className="text-xs text-muted-foreground text-center">
          点击色块可修改识别结果
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 w-full">
        {!captured ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={switchCamera}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              切换
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleCapture}
              disabled={!isReady || !!cameraError}
            >
              <Camera className="w-4 h-4" />
              拍照
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleRetake}
            >
              <RotateCcw className="w-4 h-4" />
              重拍
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handleConfirmColors}>
              <Check className="w-4 h-4" />
              确认
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
