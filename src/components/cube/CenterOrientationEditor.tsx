import { RotateCw } from "lucide-react";
import { FACE_ORDER, FACE_COLORS } from "@/types/cube";

interface CenterOrientationEditorProps {
  centerStickers: string[]; // 6 data URLs, one per face in U R F D L B order
  orientations: number[];   // 6 values (0/1/2/3), one per face
  onOrientationChange: (faceIdx: number, value: number) => void;
}

const ROTATION_LABELS = ["0°", "90°", "180°", "270°"];

export function CenterOrientationEditor({
  centerStickers,
  orientations,
  onOrientationChange,
}: CenterOrientationEditorProps) {
  const handleClick = (faceIdx: number) => {
    const next = ((orientations[faceIdx] ?? 0) + 1) % 4;
    onOrientationChange(faceIdx, next);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium">中心朝向设置</p>
      <p className="text-xs text-muted-foreground text-center">
        点击中心贴纸设置图案方向。箭头指示当前旋转角度。
      </p>

      {/* Net layout: U on top, R F D L in middle row, B below F */}
      <div className="flex flex-col items-center gap-1">
        {/* Row 1: U */}
        <CenterTile
          sticker={centerStickers[0]}
          orientation={orientations[0] ?? 0}
          face={FACE_ORDER[0]}
          onClick={() => handleClick(0)}
        />

        {/* Row 2: R F D L */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((idx) => (
            <CenterTile
              key={idx}
              sticker={centerStickers[idx]}
              orientation={orientations[idx] ?? 0}
              face={FACE_ORDER[idx]}
              onClick={() => handleClick(idx)}
            />
          ))}
        </div>

        {/* Row 3: B (below F, index 2) */}
        <div className="flex gap-1">
          <div className="w-16 h-16" /> {/* spacer for R */}
          <CenterTile
            sticker={centerStickers[5]}
            orientation={orientations[5] ?? 0}
            face={FACE_ORDER[5]}
            onClick={() => handleClick(5)}
          />
        </div>
      </div>
    </div>
  );
}

function CenterTile({
  sticker,
  orientation,
  face,
  onClick,
}: {
  sticker: string;
  orientation: number;
  face: string;
  onClick: () => void;
}) {
  const color = FACE_COLORS[face as keyof typeof FACE_COLORS];

  return (
    <button
      className="relative w-16 h-16 min-w-[44px] min-h-[44px] rounded-lg border-2 border-border overflow-hidden cursor-pointer hover:border-primary/60 transition-colors group"
      onClick={onClick}
      title={`${face} 中心 · 当前 ${ROTATION_LABELS[orientation]} · 点击旋转`}
    >
      {/* Sticker image with rotation */}
      {sticker ? (
        <img
          src={sticker}
          alt={`${face} center`}
          className="w-full h-full object-cover"
          style={{ transform: `rotate(${orientation * 90}deg)` }}
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full"
          style={{ backgroundColor: color?.hex ?? "#888" }}
        />
      )}

      {/* Rotation indicator badge */}
      {orientation > 0 && (
        <div className="absolute top-0.5 left-0.5 bg-black/70 text-white rounded px-1 py-0.5 flex items-center gap-0.5">
          <RotateCw className="w-2.5 h-2.5" style={{ transform: `rotate(${orientation * 90}deg)` }} />
          <span className="text-[9px] font-mono leading-none">{ROTATION_LABELS[orientation]}</span>
        </div>
      )}

      {/* Face label */}
      <span className="absolute bottom-0 right-0.5 text-[9px] font-bold leading-none text-muted-foreground/60">
        {face}
      </span>
    </button>
  );
}
