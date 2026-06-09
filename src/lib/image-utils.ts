import { rgbToHsv, classifyPixel } from "./color-detection";
import type { FaceColor } from "@/types/cube";

/**
 * Convert ImageData to a JPEG data URL via an offscreen canvas.
 */
export function imageDataToDataUrl(imageData: ImageData, quality = 0.8): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Classify the dominant color of a sticker thumbnail (data URL).
 * Samples the center 50% of the image, averages RGB, then classifies.
 */
export function classifyStickerColor(dataUrl: string): Promise<FaceColor> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Sample center 50%
      const margin = 0.25;
      const sx = Math.floor(img.width * margin);
      const sy = Math.floor(img.height * margin);
      const sw = Math.floor(img.width * (1 - 2 * margin));
      const sh = Math.floor(img.height * (1 - 2 * margin));
      const data = ctx.getImageData(sx, sy, sw, sh).data;

      let rSum = 0, gSum = 0, bSum = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const r = Math.round(rSum / pixels);
      const g = Math.round(gSum / pixels);
      const b = Math.round(bSum / pixels);
      const { h, s, v } = rgbToHsv(r, g, b);
      resolve(classifyPixel(h, s, v));
    };
    img.onerror = () => reject(new Error("Failed to load sticker image"));
    img.src = dataUrl;
  });
}
