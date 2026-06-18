import { useRef, useState, useEffect, useCallback } from "react";

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  captureFrame: () => ImageData | null;
  switchCamera: () => void;
  retry: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      setIsReady(false);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);

        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          const onReady = () => setIsReady(true);
          video.addEventListener("loadedmetadata", onReady, { once: true });
          video.addEventListener("playing", onReady, { once: true });
          try {
            await video.play();
          } catch {
            // Autoplay may be blocked; user interaction will start playback
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "摄像头权限被拒绝，请在浏览器设置中允许访问摄像头"
            : "无法访问摄像头，请确认设备有可用的摄像头";
        setError(msg);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
      setStream(null);
      setIsReady(false);
    };
  }, [facingMode, retryCount]);

  const captureFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_CURRENT_DATA) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return { videoRef, stream, error, isReady, captureFrame, switchCamera, retry };
}
