import { useState, useEffect, useCallback, useRef } from "react";
import { Camera, RefreshCw, AlertCircle, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { useCubeStore } from "@/stores/cube-store";

interface CameraCaptureProps {
  onCapture: (imageData: ImageData) => void;
  faceLabel: string;
  faceIndex: number;
  totalFaces: number;
  onSwitchCamera?: () => void;
  faceLetter?: string;
  faceHint?: string;
}

export function CameraCapture({
  onCapture,
  faceLabel,
  faceIndex,
  totalFaces,
  onSwitchCamera,
  faceLetter,
  faceHint,
}: CameraCaptureProps) {
  const { videoRef, stream, error, isReady, captureFrame, switchCamera, retry } =
    useCamera();
  const cubeSize = useCubeStore((s) => s.cubeSize);
  const [flashing, setFlashing] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<ImageData | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream, videoRef]);

  // Render captured frame to preview canvas
  useEffect(() => {
    if (capturedFrame && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      canvas.width = capturedFrame.width;
      canvas.height = capturedFrame.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(capturedFrame, 0, 0);
      }
    }
  }, [capturedFrame]);

  const handleCapture = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return;

    setFlashing(true);
    setCapturedFrame(frame);
    setTimeout(() => setFlashing(false), 300);
  }, [captureFrame]);

  const handleConfirm = useCallback(() => {
    if (capturedFrame) {
      onCapture(capturedFrame);
      setCapturedFrame(null);
    }
  }, [capturedFrame, onCapture]);

  const handleRetake = useCallback(() => {
    setCapturedFrame(null);
  }, []);

  const handleSwitch = useCallback(() => {
    switchCamera();
    onSwitchCamera?.();
  }, [switchCamera, onSwitchCamera]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground max-w-sm">{error}</p>
        <Button variant="outline" onClick={retry}>
          重新尝试
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative bg-black">
      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${capturedFrame ? "hidden" : ""}`}
          autoPlay
          playsInline
          muted
        />

        {/* Captured preview */}
        {capturedFrame && (
          <canvas
            ref={previewCanvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Loading state */}
        {!capturedFrame && !isReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-white/70 text-sm">正在启动摄像头...</p>
          </div>
        )}

        {/* Face label and mini cube net — hidden during preview */}
        {!capturedFrame && (
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 z-10">
            {faceLetter && (
              <MiniCubeNet currentFace={faceLetter} />
            )}
            <span className="bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
              {faceLetter
                ? `第 ${faceIndex + 1}/6 · 请拍摄${faceLabel}`
                : `拍摄第 ${faceIndex + 1} 面：${faceLabel}`}
            </span>
            {faceHint && (
              <span className="block bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full">
                {faceHint}
              </span>
            )}
          </div>
        )}

        {/* Progress dots — hidden during preview */}
        {!capturedFrame && (
          <div className="absolute top-[140px] left-0 right-0 flex justify-center gap-2 z-10">
            {Array.from({ length: totalFaces }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === faceIndex
                    ? "bg-white"
                    : i < faceIndex
                      ? "bg-white/60"
                      : "bg-white/25"
                }`}
              />
            ))}
          </div>
        )}

        {/* Grid overlay — hidden during preview */}
        {!capturedFrame && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <GridOverlay gridSize={cubeSize} />
          </div>
        )}

        {/* Preview label */}
        {capturedFrame && (
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <span className="bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
              拍摄预览
            </span>
          </div>
        )}

        {/* Flash effect */}
        {flashing && (
          <div
            className="absolute inset-0 bg-white z-20 pointer-events-none"
            style={{
              animation: "flash 300ms ease-out forwards",
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/80 px-6 py-5 flex items-center justify-center gap-6">
        {!capturedFrame ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white/80 hover:bg-white/10"
              onClick={handleSwitch}
              title="切换摄像头"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>

            <button
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-white/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleCapture}
              disabled={!isReady}
              title="拍摄"
            >
              <Camera className="w-7 h-7 text-black" />
            </button>

            <div className="w-10" />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="text-white hover:text-white/80 hover:bg-white/10 gap-2"
              onClick={handleRetake}
            >
              <RotateCcw className="w-4 h-4" />
              重新拍摄
            </Button>

            <Button
              className="gap-2"
              onClick={handleConfirm}
            >
              <Check className="w-4 h-4" />
              确认使用
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function GridOverlay({ gridSize }: { gridSize: 2 | 3 }) {
  // Grid occupies roughly 60% of the viewport's smaller dimension
  const gridPercent = 55;
  const borderOpacity = 0.5;

  return (
    <div
      className="relative"
      style={{
        width: `${gridPercent}vmin`,
        height: `${gridPercent}vmin`,
      }}
    >
      {/* Outer border */}
      <div
        className="absolute inset-0 border-2 rounded-lg"
        style={{ borderColor: `rgba(255,255,255,${borderOpacity})` }}
      />

      {/* Inner grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 100 100`}
        preserveAspectRatio="none"
      >
        {Array.from({ length: gridSize - 1 }).map((_, i) => {
          const pos = ((i + 1) / gridSize) * 100;
          return (
            <g key={i}>
              <line
                x1={pos}
                y1={0}
                x2={pos}
                y2={100}
                stroke="white"
                strokeOpacity={borderOpacity}
                strokeWidth="0.5"
              />
              <line
                x1={0}
                y1={pos}
                x2={100}
                y2={pos}
                stroke="white"
                strokeOpacity={borderOpacity}
                strokeWidth="0.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Corner markers for alignment guidance */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-4 h-4"
          style={{
            ...pos,
            borderColor: "white",
            borderWidth: "2px",
            ...(i === 0
              ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 }
              : {}),
            ...(i === 1
              ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 }
              : {}),
            ...(i === 2
              ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 }
              : {}),
            ...(i === 3
              ? {
                  borderBottomWidth: 3,
                  borderRightWidth: 3,
                  borderBottomRightRadius: 4,
                }
              : {}),
          }}
        />
      ))}
    </div>
  );
}

const FACE_CHINESE: Record<string, string> = {
  U: "上", R: "右", F: "前", D: "下", L: "左", B: "后",
};

const FACE_COLOR_MAP: Record<string, string> = {
  U: "#ffffff", R: "#b71234", F: "#0046ad",
  D: "#ffd500", L: "#ff5800", B: "#009b48",
};

/**
 * Mini cube net diagram showing which face to photograph.
 * Layout:
 *        [U]
 *   [L]  [F]  [R]  [B]
 *        [D]
 */
function MiniCubeNet({ currentFace }: { currentFace: string }) {
  const blockSize = 24;
  const gap = 2;

  const faces = [
    { face: "U", col: 1, row: 0 },
    { face: "L", col: 0, row: 1 },
    { face: "F", col: 1, row: 1 },
    { face: "R", col: 2, row: 1 },
    { face: "B", col: 3, row: 1 },
    { face: "D", col: 1, row: 2 },
  ];

  return (
    <div className="bg-black/50 rounded-lg p-2 inline-flex">
      <div
        className="relative"
        style={{
          width: 4 * blockSize + 3 * gap,
          height: 3 * blockSize + 2 * gap,
        }}
      >
        {faces.map(({ face, col, row }) => {
          const isCurrent = face === currentFace;
          return (
            <div
              key={face}
              className="absolute flex items-center justify-center text-[9px] font-bold rounded"
              style={{
                left: col * (blockSize + gap),
                top: row * (blockSize + gap),
                width: blockSize,
                height: blockSize,
                backgroundColor: isCurrent
                  ? FACE_COLOR_MAP[face]
                  : "rgba(255,255,255,0.15)",
                color: isCurrent
                  ? (face === "U" ? "#000" : "#fff")
                  : "rgba(255,255,255,0.5)",
                border: isCurrent ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                transform: isCurrent ? "scale(1.1)" : "scale(1)",
                transition: "all 0.2s",
              }}
            >
              {FACE_CHINESE[face]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
