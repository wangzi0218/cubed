import { cn } from "@/lib/utils";
import type { CubeSize, CubeState, FaceColor } from "@/types/cube";
import { FACE_COLORS, FACE_ORDER } from "@/types/cube";
import { getSticker, setSticker } from "@/lib/cube-state";

interface CubeNetProps {
  state: CubeState;
  size: CubeSize;
  onStateChange: (state: CubeState) => void;
  selectedColor: FaceColor;
}

/**
 * Render the unfolded cube net layout.
 *
 * 3x3 layout:
 *         [U]
 *    [L]  [F]  [R]  [B]
 *         [D]
 *
 * 2x2 layout: same structure, 2x2 per face
 */
export function CubeNet({ state, size, onStateChange, selectedColor }: CubeNetProps) {
  const cellStyle = size === 2
    ? { width: "min(12vw, 3rem)", height: "min(12vw, 3rem)" }
    : { width: "min(10vw, 2.5rem)", height: "min(10vw, 2.5rem)" };

  function handleCellClick(face: FaceColor, pos: number) {
    const newState = setSticker(state, face, pos, selectedColor, size);
    onStateChange(newState);
  }

  function renderFace(face: FaceColor, label: string) {
    const cells = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const pos = row * size + col;
        const color = getSticker(state, face, pos, size);
        const hex = FACE_COLORS[color].hex;
        cells.push(
          <button
            key={pos}
            className={cn(
              "border border-border/30 rounded-sm cursor-pointer transition-transform hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            )}
            style={{ ...cellStyle, backgroundColor: hex }}
            onClick={() => handleCellClick(face, pos)}
            title={`${face} - ${FACE_COLORS[color].label}`}
          />
        );
      }
    }

    return (
      <div className="flex flex-col items-center">
        <div className="grid gap-px sm:gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {cells}
        </div>
        <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 overflow-x-auto">
      {/* Row 1: U face */}
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>
        {renderFace("U", "Up")}
      </div>
      {/* Row 2: L, F, R, B faces */}
      <div className="flex gap-px sm:gap-1">
        {renderFace("L", "Left")}
        {renderFace("F", "Front")}
        {renderFace("R", "Right")}
        {renderFace("B", "Back")}
      </div>
      {/* Row 3: D face */}
      <div className="flex justify-center" style={{ marginLeft: `min(${size * 1.75}rem, ${size * 12}vw)` }}>
        {renderFace("D", "Down")}
      </div>
    </div>
  );
}

interface ColorPaletteProps {
  selectedColor: FaceColor;
  onSelect: (color: FaceColor) => void;
  showFaceLabel?: boolean;
}

export function ColorPalette({ selectedColor, onSelect, showFaceLabel }: ColorPaletteProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {FACE_ORDER.map((face) => (
        <button
          key={face}
          className={cn(
            "w-10 h-10 rounded-lg border-2 transition-all cursor-pointer relative",
            "hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            selectedColor === face
              ? "border-primary ring-2 ring-primary scale-110 shadow-lg"
              : "border-border/50"
          )}
          style={{ backgroundColor: FACE_COLORS[face].hex }}
          onClick={() => onSelect(face)}
          title={FACE_COLORS[face].label}
        >
          {showFaceLabel && (
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-bold"
              style={{ color: face === "U" ? "#000" : "#fff" }}
            >
              {face}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
