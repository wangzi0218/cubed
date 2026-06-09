import type { FaceColor } from "@/types/cube";

/**
 * Convert RGB (0-255 each) to HSV.
 * H in degrees [0, 360), S in [0, 1], V in [0, 1].
 */
export function rgbToHsv(
  r: number,
  g: number,
  b: number
): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  const v = max;

  if (max === 0) {
    return { h: 0, s: 0, v };
  }

  const s = delta / max;

  if (delta === 0) {
    return { h: 0, s, v };
  }

  let h: number;
  if (max === rNorm) {
    h = ((gNorm - bNorm) / delta) % 6;
  } else if (max === gNorm) {
    h = (bNorm - rNorm) / delta + 2;
  } else {
    h = (rNorm - gNorm) / delta + 4;
  }

  h *= 60;
  if (h < 0) h += 360;

  return { h, s, v };
}

/** Classify a single pixel (HSV) to the nearest Rubik's cube face color. */
export function classifyPixel(h: number, s: number, v: number): FaceColor {
  // White: very low saturation, high brightness
  if (s < 0.15 && v > 0.85) return "U";

  // Yellow: hue 20-40
  if (h >= 20 && h <= 40 && s > 0.5 && v > 0.7) return "D";

  // Red: hue 345-360 or 0-15
  if (((h >= 345 && h <= 360) || (h >= 0 && h <= 15)) && s > 0.4 && v > 0.3 && v < 0.9)
    return "R";

  // Orange: hue 15-30
  if (h > 15 && h < 20 && s > 0.5 && v > 0.5) return "L";
  if (h >= 20 && h <= 30 && s > 0.5 && v > 0.5 && v <= 0.7) return "L";

  // Blue: hue 195-260
  if (h >= 195 && h <= 260 && s > 0.3 && v > 0.2 && v < 0.8) return "F";

  // Green: hue 80-170
  if (h >= 80 && h <= 170 && s > 0.3 && v > 0.2 && v < 0.8) return "B";

  // Fallback: pick the closest by hue distance
  const hueTargets: { hue: number; color: FaceColor }[] = [
    { hue: 0, color: "U" },
    { hue: 30, color: "D" },
    { hue: 0, color: "R" },
    { hue: 25, color: "L" },
    { hue: 220, color: "F" },
    { hue: 130, color: "B" },
  ];

  // For low-saturation pixels, treat as white
  if (s < 0.25) return "U";

  let bestDist = Infinity;
  let bestColor: FaceColor = "U";

  for (const target of hueTargets) {
    let dist = Math.abs(h - target.hue);
    if (dist > 180) dist = 360 - dist;
    if (dist < bestDist) {
      bestDist = dist;
      bestColor = target.color;
    }
  }

  return bestColor;
}

/**
 * Detect Rubik's cube face colors from camera image data.
 * Divides the image into a gridSize x gridSize grid, samples the center
 * of each cell, and returns the detected FaceColor in row-major order.
 */
export function detectFaceColors(
  imageData: ImageData,
  gridSize: 2 | 3
): FaceColor[] {
  const { width, height, data } = imageData;
  const results: FaceColor[] = [];

  const cellW = width / gridSize;
  const cellH = height / gridSize;

  // Sample center 40% of each cell to avoid borders
  const sampleMargin = 0.3; // 30% margin each side = 40% center

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellLeft = col * cellW;
      const cellTop = row * cellH;

      const xStart = Math.floor(cellLeft + cellW * sampleMargin);
      const xEnd = Math.floor(cellLeft + cellW * (1 - sampleMargin));
      const yStart = Math.floor(cellTop + cellH * sampleMargin);
      const yEnd = Math.floor(cellTop + cellH * (1 - sampleMargin));

      // Count votes for each color
      const votes: Record<FaceColor, number> = {
        U: 0,
        D: 0,
        L: 0,
        R: 0,
        F: 0,
        B: 0,
      };

      // Sample every 2nd pixel for performance
      const step = 2;
      for (let y = yStart; y < yEnd; y += step) {
        for (let x = xStart; x < xEnd; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const hsv = rgbToHsv(r, g, b);
          const color = classifyPixel(hsv.h, hsv.s, hsv.v);
          votes[color]++;
        }
      }

      // Majority vote
      let bestColor: FaceColor = "U";
      let bestCount = 0;
      for (const [color, count] of Object.entries(votes) as [
        FaceColor,
        number,
      ][]) {
        if (count > bestCount) {
          bestCount = count;
          bestColor = color;
        }
      }

      results.push(bestColor);
    }
  }

  return results;
}
