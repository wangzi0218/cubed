import { useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { useCubeStore } from "@/stores/cube-store";

interface CameraCaptureProps {
  onCapture: (imageData: ImageData) => void;
  faceLabel: string;
  faceIndex: number;
  totalFaces: number;
  onSwitchCamera?: () => void;
}

export function CameraCapture({
  onCapture,
  faceLabel,
  faceIndex,
  totalFaces,
  onSwitchCamera,
}: CameraCaptureProps) {
  const { videoRef, stream, error, isReady, captureFrame, switchCamera } =
    useCamera();
  const cubeSize = useCubeStore((s) => s.cubeSize);
  const [flashing, setFlashing] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream, videoRef]);

  const handleCapture = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return;

    setFlashing(true);
    onCapture(frame);
    setTimeout(() => setFlashing(false), 300);
  }, [captureFrame, onCapture]);

  const handleSwitch = useCallback(() => {
    switchCamera();
    onSwitchCamera?.();
  }, [switchCamera, onSwitchCamera]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground max-w-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
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
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Face label */}
        <div className="absolute top-4 left-0 right-0 text-center z-10">
          <span className="bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
            拍摄第 {faceIndex + 1} 面：{faceLabel}
          </span>
        </div>

        {/* Progress dots */}
        <div className="absolute top-14 left-0 right-0 flex justify-center gap-2 z-10">
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

        {/* Grid overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <GridOverlay gridSize={cubeSize} />
        </div>

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

        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
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
