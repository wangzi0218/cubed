import { RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaceColor } from "@/types/cube";
import { FACE_COLORS } from "@/types/cube";

interface PatternFaceSlotProps {
  face: FaceColor;
  photoUrl: string | null;
  rotation: number;
  selected: boolean;
  onSlotTap: () => void;
  onRotate: () => void;
  onRemove: () => void;
}

export function PatternFaceSlot({
  face,
  photoUrl,
  rotation,
  selected,
  onSlotTap,
  onRotate,
  onRemove,
}: PatternFaceSlotProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative w-20 h-20 rounded-lg border-2 transition-all overflow-hidden cursor-pointer",
          photoUrl
            ? "border-border"
            : "border-dashed border-muted-foreground/40",
          selected && !photoUrl && "border-primary bg-primary/10 scale-105"
        )}
        onClick={onSlotTap}
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
            <div className="absolute top-0.5 right-0.5 flex gap-0.5">
              <button
                className="min-w-[44px] min-h-[44px] p-2 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRotate();
                }}
                title="旋转"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                className="min-w-[44px] min-h-[44px] p-2 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
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
            {selected ? "点击分配" : "点击选择照片"}
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
 * Tappable photo thumbnail for the photo list.
 */
interface PhotoThumbProps {
  index: number;
  dataUrl: string;
  assigned: boolean;
  selected: boolean;
  onSelect: () => void;
}

export function PhotoThumb({ index, dataUrl, assigned, selected, onSelect }: PhotoThumbProps) {
  return (
    <div
      className={cn(
        "relative w-16 h-16 min-w-[44px] min-h-[44px] rounded-lg border-2 overflow-hidden transition-all cursor-pointer",
        assigned
          ? "border-green-400/60 opacity-50"
          : selected
          ? "border-primary ring-2 ring-primary"
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onSelect}
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
          <span className="text-success text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}
