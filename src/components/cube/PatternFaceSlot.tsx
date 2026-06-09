import { useState, useCallback } from "react";
import { RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaceColor } from "@/types/cube";
import { FACE_COLORS } from "@/types/cube";

interface PatternFaceSlotProps {
  face: FaceColor;
  photoUrl: string | null;
  rotation: number;
  onDrop: (photoIdx: number) => void;
  onRotate: () => void;
  onRemove: () => void;
}

export function PatternFaceSlot({
  face,
  photoUrl,
  rotation,
  onDrop,
  onRotate,
  onRemove,
}: PatternFaceSlotProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const idx = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!isNaN(idx)) {
        onDrop(idx);
      }
    },
    [onDrop]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative w-20 h-20 rounded-lg border-2 transition-all overflow-hidden",
          photoUrl
            ? "border-border"
            : "border-dashed border-muted-foreground/40",
          dragOver && "border-primary bg-primary/10 scale-105"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt={`${FACE_COLORS[face].label} face`}
              className="w-full h-full object-cover"
              style={{ transform: `rotate(${rotation}deg)` }}
              draggable={false}
            />
            {/* Controls overlay */}
            <div className="absolute top-0.5 right-0.5 flex gap-0.5">
              <button
                className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRotate();
                }}
                title="旋转"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                title="移除"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-xs text-center p-1">
            拖入照片
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {FACE_COLORS[face].label}
      </span>
    </div>
  );
}

/**
 * Draggable photo thumbnail for the photo list.
 */
interface PhotoThumbProps {
  index: number;
  dataUrl: string;
  assigned: boolean;
}

export function PhotoThumb({ index, dataUrl, assigned }: PhotoThumbProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
    },
    [index]
  );

  return (
    <div
      className={cn(
        "relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all cursor-grab active:cursor-grabbing",
        assigned
          ? "border-green-400/60 opacity-50"
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}
      draggable={!assigned}
      onDragStart={handleDragStart}
    >
      <img
        src={dataUrl}
        alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />
      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
        {index + 1}
      </span>
      {assigned && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
          <span className="text-green-600 text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}
