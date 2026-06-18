import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { useCubeStore } from "@/stores/cube-store";

export function PatternInput() {
  const { cubeSize } = useCubeStore();
  const [phase, setPhase] = useState<"intro" | "capture" | "confirm">("intro");
  const [captureIdx, setCaptureIdx] = useState(0);
  const [photos, setPhotos] = useState<(string | null)[]>(() => Array(6).fill(null));

  const handleCapture = useCallback((imageData: ImageData) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext("2d")!.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setPhotos((prev) => { const next = [...prev]; next[captureIdx] = dataUrl; return next; });
    if (captureIdx < 5) setCaptureIdx((i) => i + 1);
    else setPhase("confirm");
  }, [captureIdx]);

  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h2 className="text-xl font-bold mb-4">图案识别（测试版）</h2>
        <Button onClick={() => setPhase("capture")}><Camera className="w-4 h-4 mr-2" />开始拍摄</Button>
      </div>
    );
  }

  if (phase === "capture") {
    return (
      <div className="flex-1 flex flex-col">
        <CameraCapture
          faceLabel={`第 ${captureIdx + 1} 面`}
          faceIndex={captureIdx}
          totalFaces={6}
          onCapture={handleCapture}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <h2 className="text-xl font-bold mb-4">确认状态（{cubeSize}×{cubeSize}）</h2>
      <p className="text-muted-foreground mb-4">已拍摄 {photos.filter(Boolean).length} 张照片</p>
      <Button onClick={() => { setPhase("capture"); setCaptureIdx(0); }}>重新拍摄</Button>
    </div>
  );
}
