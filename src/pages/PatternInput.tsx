import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, Palette, RotateCcw, Zap } from "lucide-react";
import { CameraCapture } from "@/components/cube/CameraCapture";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionBar } from "@/components/layout/ActionBar";
import { useCubeStore } from "@/stores/cube-store";
import { FACE_ORDER } from "@/types/cube";
import type { FacePhoto } from "@/lib/pattern-extraction";
import { imageDataToDataUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

const FACE_CHINESE: Record<string, string> = {
  U: "上", R: "右", F: "前", D: "下", L: "左", B: "后",
};

const FACE_HINTS: Record<string, string> = {
  U: "白色面（或顶部面）朝上，正对摄像头",
  R: "红色面（或右侧面）朝右，正对摄像头",
  F: "蓝色面（或前面）朝前，正对摄像头",
  D: "黄色面（或底面）朝下，正对摄像头",
  L: "橙色面（或左侧面）朝左，正对摄像头",
  B: "绿色面（或后面）朝后，正对摄像头",
};

export function PatternInput() {
  const { cubeSize } = useCubeStore();
  const [phase, setPhase] = useState<"intro" | "capture" | "confirm">("intro");
  const [cubeVariant, setCubeVariant] = useState<"standard" | "pattern">("standard");
  const [captureIdx, setCaptureIdx] = useState(0);
  const [photos, setPhotos] = useState<(FacePhoto | null)[]>(() => Array(6).fill(null));
  const [photoRotations, setPhotoRotations] = useState<(0 | 90 | 180 | 270)[]>(() => Array(6).fill(0));

  const isPattern = cubeVariant === "pattern";
  const capturedCount = photos.filter((p) => p !== null).length;

  const handleCapture = useCallback(
    (imageData: ImageData) => {
      const dataUrl = imageDataToDataUrl(imageData);
      setPhotos((prev) => {
        const next = [...prev];
        next[captureIdx] = { dataUrl, originalIndex: captureIdx };
        return next;
      });
      if (captureIdx < 5) setCaptureIdx((i) => i + 1);
      else setPhase("confirm");
    },
    [captureIdx]
  );

  const handleRetakePhoto = useCallback((idx: number) => {
    setCaptureIdx(idx);
    setPhase("capture");
  }, []);

  const handleRotatePhoto = useCallback((idx: number) => {
    setPhotoRotations((prev) => {
      const next = [...prev];
      next[idx] = ((next[idx] + 90) % 360) as 0 | 90 | 180 | 270;
      return next;
    });
  }, []);

  const handleBackToCapture = useCallback(() => {
    setPhase("capture");
    setCaptureIdx(0);
  }, []);

  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Image className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">图案识别</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              拍摄魔方 6 个面，系统提取贴纸图案后求解。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <button
              className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]", cubeVariant === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
              onClick={() => setCubeVariant("standard")}
            >
              <Palette className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">标准配色</p>
              <p className="text-xs text-muted-foreground mt-1">白、黄、红、橙、蓝、绿六色纯色贴纸</p>
            </button>
            <button
              className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]", cubeVariant === "pattern" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
              onClick={() => setCubeVariant("pattern")}
            >
              <Image className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">图案魔方</p>
              <p className="text-xs text-muted-foreground mt-1">图片魔方、纹理魔方等非纯色贴纸</p>
            </button>
          </div>
          <div className="text-left space-y-2">
            <p className="text-sm font-medium">操作步骤</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>按照提示依次拍摄魔方的 6 个面（上→右→前→下→左→后）</li>
              <li>系统自动提取每个面的贴纸图案</li>
              <li>确认后求解</li>
            </ol>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setPhase("capture")}>
            <Camera className="w-4 h-4" />开始拍摄
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "capture") {
    const currentFace = FACE_ORDER[captureIdx];
    return (
      <div className="flex-1 flex flex-col">
        <CameraCapture
          faceLabel={FACE_CHINESE[currentFace] ?? currentFace}
          faceIndex={captureIdx}
          totalFaces={6}
          onCapture={handleCapture}
          faceLetter={currentFace}
          faceHint={FACE_HINTS[currentFace]}
        />
        {capturedCount > 0 && (
          <div className="bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted-foreground mr-2">已拍摄：</span>
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <button
                    className={cn("w-12 h-12 rounded border-2 overflow-hidden transition-all", i === captureIdx ? "border-primary ring-2 ring-primary/30" : photo ? "border-border hover:border-primary/50" : "border-border/50 opacity-40")}
                    onClick={() => photo && handleRetakePhoto(i)}
                  >
                    {photo ? (
                      <img src={photo.dataUrl} alt={FACE_CHINESE[FACE_ORDER[i]]} className="w-full h-full object-cover" style={{ transform: `rotate(${photoRotations[i]}deg)` }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{FACE_CHINESE[FACE_ORDER[i]]}</div>
                    )}
                  </button>
                  {photo && (
                    <button className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRotatePhoto(i); }} title="旋转 90°">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // confirm
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <PageHeader title={`${cubeSize}×${cubeSize} 确认状态`} onBack={handleBackToCapture} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-medium">已拍摄 {capturedCount} 张照片</p>
          <p className="text-sm text-muted-foreground">确认页面（极简版）</p>
          <Button onClick={handleBackToCapture} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />重新拍摄
          </Button>
        </div>
      </div>
    </div>
  );
}
