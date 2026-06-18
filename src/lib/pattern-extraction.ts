import type { CubeSize } from "@/types/cube";

export interface FacePhoto {
  dataUrl: string;
  originalIndex: number;
}

export interface FaceAssignment {
  photoIndex: number;
  rotation: 0 | 90 | 180 | 270;
}

/**
 * Rotate a grid array clockwise by 90/180/270 degrees.
 * Grid is row-major, size×size.
 */
export function applyRotation<T>(grid: T[], size: number, degrees: number): T[] {
  if (degrees === 0) return [...grid];
  const result: T[] = new Array(grid.length);
  const steps = (degrees / 90) % 4;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const srcIdx = r * size + c;
      let dstIdx: number;

      if (steps === 1) {
        // 90° CW: (r,c) → (c, size-1-r)
        dstIdx = c * size + (size - 1 - r);
      } else if (steps === 2) {
        // 180°: (r,c) → (size-1-r, size-1-c)
        dstIdx = (size - 1 - r) * size + (size - 1 - c);
      } else {
        // 270° CW: (r,c) → (size-1-c, r)
        dstIdx = (size - 1 - c) * size + r;
      }

      result[dstIdx] = grid[srcIdx];
    }
  }
  return result;
}

/**
 * Extract sticker thumbnails from a captured face image.
 * Divides the image into a size×size grid and returns the center region of each cell as a data URL.
 * When cropToGuide is true, crops to match the camera guide overlay position.
 *
 * The guide overlay is a centered square at 55% of min(vw, vh). The camera uses
 * object-cover to fill the container. We calculate the crop region by:
 * 1. The guide covers ~55% of the container in the smaller dimension
 * 2. object-cover may scale/crop the camera image differently
 * 3. We use the container-to-image ratio to map guide coordinates to image coordinates
 */
export function extractFaceStickers(
  imageData: ImageData,
  size: CubeSize,
  cropToGuide = false,
  viewportWidth?: number,
  viewportHeight?: number
): string[] {
  const { width, height } = imageData;

  // Draw full image to a source canvas
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.putImageData(imageData, 0, 0);

  // Calculate crop region matching the guide overlay
  let drawW = width;
  let drawH = height;
  let offsetX = 0;
  let offsetY = 0;

  if (cropToGuide) {
    // Guide is centered, 55% of min(vw, vh)
    const vpW = viewportWidth ?? width;
    const vpH = viewportHeight ?? height;
    const guideSize = Math.floor(Math.min(vpW, vpH) * 0.55);

    // object-cover: the camera image fills the container.
    // The image is scaled to cover the container, then centered.
    const scaleX = width / vpW;
    const scaleY = height / vpH;
    const scale = Math.max(scaleX, scaleY); // cover = max scale

    // The guide region in image coordinates:
    // Guide center is at (vpW/2, vpH/2) in viewport
    // In image coords: (vpW/2 * scale, vpH/2 * scale)
    // But object-cover crops from center, so offset = (imgW - vpW*scale) / 2
    const imgOffsetX = (width - vpW * scale) / 2;
    const imgOffsetY = (height - vpH * scale) / 2;

    // Guide region in image coords
    const guideImgX = imgOffsetX + (vpW - guideSize) / 2 * scale;
    const guideImgY = imgOffsetY + (vpH - guideSize) / 2 * scale;
    const guideImgSize = guideSize * scale;

    offsetX = Math.max(0, Math.floor(guideImgX));
    offsetY = Math.max(0, Math.floor(guideImgY));
    drawW = Math.min(Math.floor(guideImgSize), width - offsetX);
    drawH = Math.min(Math.floor(guideImgSize), height - offsetY);
  }

  const cellW = Math.floor(drawW / size);
  const cellH = Math.floor(drawH / size);
  const stickers: string[] = [];

  const sampleSize = 128; // output thumbnail size
  const outCanvas = document.createElement("canvas");
  outCanvas.width = sampleSize;
  outCanvas.height = sampleSize;
  const outCtx = outCanvas.getContext("2d")!;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Sample center 85% of each cell (small margin to avoid grid lines)
      const margin = 0.08;
      const sx = offsetX + Math.floor(c * cellW + cellW * margin);
      const sy = offsetY + Math.floor(r * cellH + cellH * margin);
      const sw = Math.floor(cellW * (1 - 2 * margin));
      const sh = Math.floor(cellH * (1 - 2 * margin));

      outCtx.clearRect(0, 0, sampleSize, sampleSize);
      outCtx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, sampleSize, sampleSize);
      stickers.push(outCanvas.toDataURL("image/png"));
    }
  }

  return stickers;
}


/**
 * Extract sticker thumbnails from a data URL photo.
 * Loads the image, draws it to canvas, then extracts grid cells.
 */
export function extractFaceStickersFromDataUrl(
  dataUrl: string,
  size: CubeSize,
  cropToGuide = false,
  viewportWidth?: number,
  viewportHeight?: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(extractFaceStickers(imageData, size, cropToGuide, viewportWidth, viewportHeight));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

/**
 * Check if all 6 faces have been assigned.
 */
export function allFacesAssigned(
  assignments: (FaceAssignment | null)[]
): boolean {
  return assignments.every((a) => a !== null);
}
