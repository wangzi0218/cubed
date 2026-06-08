import { cn } from "@/lib/utils";
import type { FaceColor } from "@/types/cube";
import { FACE_COLORS } from "@/types/cube";

interface TopologyGuideProps {
  type: "edge" | "corner";
  totalSteps: number;
  currentStep: number;
  currentFaces: FaceColor[];
  completedSteps: number[];
}

/**
 * Face-label → short English for the cube-net layout.
 * The net is drawn as a 3×3 CSS grid of face blocks:
 *
 *            [U]
 *     [L]    [F]    [R]    [B]
 *            [D]
 *
 * Each face block is 80×80 px.  Marker dots are positioned absolutely
 * inside the wrapper (240×240 content area, plus the U / D rows).
 */

const FACE_BLOCK = 80; // px per face
const GAP = 4; // px gap between faces

// Grid position (col, row) of each face in the net layout
const FACE_GRID: Record<string, { col: number; row: number }> = {
  U: { col: 1, row: 0 },
  L: { col: 0, row: 1 },
  F: { col: 1, row: 1 },
  R: { col: 2, row: 1 },
  B: { col: 3, row: 1 },
  D: { col: 1, row: 2 },
};

// Face-label colours for the mini faces
const FACE_HEX: Record<string, string> = {
  U: FACE_COLORS.U.hex,
  R: FACE_COLORS.R.hex,
  F: FACE_COLORS.F.hex,
  D: FACE_COLORS.D.hex,
  L: FACE_COLORS.L.hex,
  B: FACE_COLORS.B.hex,
};

/**
 * Return the pixel position (x, y) of an edge intersection on the net.
 * An edge sits at the boundary between two faces.
 */
function edgeMarkerPos(face1: string, face2: string): { x: number; y: number } {
  const g1 = FACE_GRID[face1];
  const g2 = FACE_GRID[face2];
  if (!g1 || !g2) return { x: 0, y: 0 };

  // Midpoint between the two face centres
  const cx1 = g1.col * (FACE_BLOCK + GAP) + FACE_BLOCK / 2;
  const cy1 = g1.row * (FACE_BLOCK + GAP) + FACE_BLOCK / 2;
  const cx2 = g2.col * (FACE_BLOCK + GAP) + FACE_BLOCK / 2;
  const cy2 = g2.row * (FACE_BLOCK + GAP) + FACE_BLOCK / 2;

  return { x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2 };
}

/**
 * Return the pixel position of a corner intersection on the net.
 * A corner sits where three faces meet — we average the centres.
 */
function cornerMarkerPos(
  face1: string,
  face2: string,
  face3: string
): { x: number; y: number } {
  const g1 = FACE_GRID[face1];
  const g2 = FACE_GRID[face2];
  const g3 = FACE_GRID[face3];
  if (!g1 || !g2 || !g3) return { x: 0, y: 0 };

  const cx =
    (g1.col * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2 +
      g2.col * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2 +
      g3.col * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2) /
    3;
  const cy =
    (g1.row * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2 +
      g2.row * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2 +
      g3.row * (FACE_BLOCK + GAP) +
      FACE_BLOCK / 2) /
    3;

  return { x: cx, y: cy };
}

// ── Edge / corner position definitions (same order as inference) ───────────

const EDGE_POSITIONS: { faces: [string, string] }[] = [
  { faces: ["U", "R"] },
  { faces: ["U", "F"] },
  { faces: ["U", "L"] },
  { faces: ["U", "B"] },
  { faces: ["D", "R"] },
  { faces: ["D", "F"] },
  { faces: ["D", "L"] },
  { faces: ["D", "B"] },
  { faces: ["F", "R"] },
  { faces: ["F", "L"] },
  { faces: ["B", "L"] },
  { faces: ["B", "R"] },
];

const CORNER_POSITIONS: { faces: [string, string, string] }[] = [
  { faces: ["U", "R", "F"] },
  { faces: ["U", "F", "L"] },
  { faces: ["U", "L", "B"] },
  { faces: ["U", "B", "R"] },
  { faces: ["D", "F", "R"] },
  { faces: ["D", "L", "F"] },
  { faces: ["D", "B", "L"] },
  { faces: ["D", "R", "B"] },
];

// ── Face-label badge ───────────────────────────────────────────────────────

function FaceBadge({ face }: { face: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white shadow-sm"
      style={{ backgroundColor: FACE_HEX[face] ?? "#888" }}
    >
      {face}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function TopologyGuide({
  type,
  totalSteps,
  currentStep,
  currentFaces,
  completedSteps,
}: TopologyGuideProps) {
  const positions = type === "edge" ? EDGE_POSITIONS : CORNER_POSITIONS;
  const completedSet = new Set(completedSteps);

  // Net wrapper size: 4 columns × 3 rows
  const netW = 4 * FACE_BLOCK + 3 * GAP;
  const netH = 3 * FACE_BLOCK + 2 * GAP;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cube net with markers */}
      <div
        className="relative"
        style={{ width: netW, height: netH }}
      >
        {/* Face blocks */}
        {Object.entries(FACE_GRID).map(([face, { col, row }]) => (
          <div
            key={face}
            className="absolute rounded border border-border/40 flex items-center justify-center text-xs font-semibold text-white/80"
            style={{
              left: col * (FACE_BLOCK + GAP),
              top: row * (FACE_BLOCK + GAP),
              width: FACE_BLOCK,
              height: FACE_BLOCK,
              backgroundColor: FACE_HEX[face],
              opacity: 0.25,
            }}
          >
            {face}
          </div>
        ))}

        {/* Markers for all positions */}
        {positions.map((pos, idx) => {
          const isCompleted = completedSet.has(idx);
          const isCurrent = idx === currentStep;
          const faces = pos.faces as string[];
          const marker =
            type === "edge"
              ? edgeMarkerPos(faces[0], faces[1])
              : cornerMarkerPos(faces[0], faces[1], faces[2]);

          return (
            <div
              key={idx}
              className={cn(
                "absolute rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                isCurrent
                  ? "w-6 h-6 bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/50 animate-pulse z-10"
                  : isCompleted
                    ? "w-5 h-5 bg-green-500 text-white z-10"
                    : "w-3 h-3 bg-muted-foreground/30 z-0"
              )}
              style={{
                left: marker.x - (isCurrent ? 12 : isCompleted ? 10 : 6),
                top: marker.y - (isCurrent ? 12 : isCompleted ? 10 : 6),
              }}
              title={
                type === "edge"
                  ? `${faces[0]}-${faces[1]}`
                  : `${faces.join("-")}`
              }
            >
              {isCompleted && (
                <svg
                  viewBox="0 0 12 12"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {type === "edge" ? "棱块" : "角块"}{" "}
          <span className="font-medium text-foreground">
            {completedSteps.length}
          </span>{" "}
          / {totalSteps}
        </p>

        {/* Current step prompt */}
        <div className="flex items-center justify-center gap-1.5 text-sm font-medium">
          <span>请拍摄</span>
          {currentFaces.map((f) => (
            <FaceBadge key={f} face={f} />
          ))}
          <span>{type === "edge" ? "棱" : "角"}</span>
        </div>
      </div>
    </div>
  );
}
