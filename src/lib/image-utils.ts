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
