import { describe, it, expect } from "vitest";
import { rgbToHsv, classifyPixel, detectFaceColors } from "../color-detection";

describe("rgbToHsv", () => {
  it("converts pure red", () => {
    const { h, s, v } = rgbToHsv(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it("converts pure green", () => {
    const { h, s, v } = rgbToHsv(0, 255, 0);
    expect(h).toBeCloseTo(120, 0);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it("converts pure blue", () => {
    const { h, s, v } = rgbToHsv(0, 0, 255);
    expect(h).toBeCloseTo(240, 0);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });

  it("converts black", () => {
    const { h, s, v } = rgbToHsv(0, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(v).toBe(0);
  });

  it("converts white", () => {
    const { h, s, v } = rgbToHsv(255, 255, 255);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(v).toBeCloseTo(1, 2);
  });

  it("converts yellow", () => {
    const { h, s, v } = rgbToHsv(255, 255, 0);
    expect(h).toBeCloseTo(60, 0);
    expect(s).toBeCloseTo(1, 2);
    expect(v).toBeCloseTo(1, 2);
  });
});

describe("classifyPixel", () => {
  it("classifies white (low saturation, high value) as U", () => {
    expect(classifyPixel(0, 0.05, 0.95)).toBe("U");
  });

  it("classifies yellow as D", () => {
    // Yellow: hue ~30, high saturation, high value
    expect(classifyPixel(30, 0.8, 0.9)).toBe("D");
  });

  it("classifies red as R", () => {
    // Red: hue ~0, high saturation, medium value
    expect(classifyPixel(5, 0.8, 0.5)).toBe("R");
  });

  it("classifies blue as F", () => {
    // Blue: hue ~220, medium saturation, medium value
    expect(classifyPixel(220, 0.6, 0.5)).toBe("F");
  });

  it("classifies green as B", () => {
    // Green: hue ~130, medium saturation, medium value
    expect(classifyPixel(130, 0.6, 0.5)).toBe("B");
  });

  it("classifies orange as L", () => {
    // Orange: hue ~25, high saturation, medium value
    expect(classifyPixel(25, 0.8, 0.6)).toBe("L");
  });

  // ── Boundary conditions ──────────────────────────────────────────────────

  it("classifies hue exactly 15 as R (red upper boundary)", () => {
    expect(classifyPixel(15, 0.8, 0.5)).toBe("R");
  });

  it("classifies hue exactly 20 as D (yellow lower boundary)", () => {
    expect(classifyPixel(20, 0.8, 0.9)).toBe("D");
  });

  it("classifies hue exactly 195 as F (blue lower boundary)", () => {
    expect(classifyPixel(195, 0.6, 0.5)).toBe("F");
  });

  it("classifies hue exactly 80 as B (green lower boundary)", () => {
    expect(classifyPixel(80, 0.6, 0.5)).toBe("B");
  });

  it("classifies hue exactly 345 as R (red wrap-around lower)", () => {
    expect(classifyPixel(345, 0.8, 0.5)).toBe("R");
  });

  // ── Fallback path (hue-distance) ────────────────────────────────────────

  it("fallback: low saturation returns U", () => {
    // s < 0.25, not caught by the s < 0.15 && v > 0.85 early return
    expect(classifyPixel(100, 0.2, 0.5)).toBe("U");
  });

  it("fallback: ambiguous hue near yellow target", () => {
    // hue 45, high saturation, doesn't match any early return
    // Closest target: hue 30 (D) with dist 15
    expect(classifyPixel(45, 0.6, 0.6)).toBe("D");
  });

  it("fallback: ambiguous hue near blue target", () => {
    // hue 270, doesn't match blue early return (260 is the boundary)
    // Closest target: hue 220 (F) with dist 50
    expect(classifyPixel(270, 0.6, 0.6)).toBe("F");
  });

  it("fallback: hue near 360 maps to first hue=0 target (U)", () => {
    // hue 350, high saturation but v > 0.9 (outside red range)
    // Fallback hueTargets: hue 0 → U (first match), hue 0 → R (second)
    // Both have dist 10, first match wins → U
    expect(classifyPixel(350, 0.6, 0.95)).toBe("U");
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("fallback: magenta-ish hue maps to closest target", () => {
    // hue 300, not caught by any early return
    // Closest: hue 220 (F) dist 80, hue 0 (U) dist 60 → U
    expect(classifyPixel(300, 0.5, 0.5)).toBe("U");
  });

  it("fallback: high value red with v > 0.9 maps to U", () => {
    // Red hue but v too high for early return (v < 0.9 required)
    // Falls to fallback, closest hue target 0 → U (first match)
    expect(classifyPixel(5, 0.8, 0.95)).toBe("U");
  });
});

// ── detectFaceColors ─────────────────────────────────────────────────────

function makeSolidColorImageData(
  r: number,
  g: number,
  b: number,
  gridSize: number
): ImageData {
  const cellSize = 30;
  const size = gridSize * cellSize;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return { data, width: size, height: size } as ImageData;
}

describe("detectFaceColors", () => {
  it("detects all-red image as R for 3x3", () => {
    const img = makeSolidColorImageData(200, 30, 30, 3);
    const result = detectFaceColors(img, 3);
    expect(result).toHaveLength(9);
    expect(result.every((c) => c === "R")).toBe(true);
  });

  it("detects all-white image as U for 2x2", () => {
    const img = makeSolidColorImageData(240, 240, 240, 2);
    const result = detectFaceColors(img, 2);
    expect(result).toHaveLength(4);
    expect(result.every((c) => c === "U")).toBe(true);
  });

  it("detects all-blue image as F for 3x3", () => {
    const img = makeSolidColorImageData(30, 60, 180, 3);
    const result = detectFaceColors(img, 3);
    expect(result.every((c) => c === "F")).toBe(true);
  });

  it("detects all-yellow image as D for 2x2", () => {
    const img = makeSolidColorImageData(220, 200, 30, 2);
    const result = detectFaceColors(img, 2);
    expect(result.every((c) => c === "D")).toBe(true);
  });

  it("detects all-green image as B for 3x3", () => {
    const img = makeSolidColorImageData(30, 140, 50, 3);
    const result = detectFaceColors(img, 3);
    expect(result.every((c) => c === "B")).toBe(true);
  });

  it("detects mixed colors in different cells", () => {
    // 2x2 grid: top-left red, top-right blue, bottom-left green, bottom-right white
    const cellSize = 30;
    const size = 2 * cellSize;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const idx = (row * size + col) * 4;
        const isTop = row < cellSize;
        const isLeft = col < cellSize;
        if (isTop && isLeft) {
          data[idx] = 200; data[idx+1] = 30; data[idx+2] = 30; // red
        } else if (isTop && !isLeft) {
          data[idx] = 30; data[idx+1] = 60; data[idx+2] = 180; // blue
        } else if (!isTop && isLeft) {
          data[idx] = 30; data[idx+1] = 140; data[idx+2] = 50; // green
        } else {
          data[idx] = 240; data[idx+1] = 240; data[idx+2] = 240; // white
        }
        data[idx + 3] = 255;
      }
    }
    const img = { data, width: size, height: size } as ImageData;
    const result = detectFaceColors(img, 2);
    expect(result[0]).toBe("R"); // top-left
    expect(result[1]).toBe("F"); // top-right
    expect(result[2]).toBe("B"); // bottom-left
    expect(result[3]).toBe("U"); // bottom-right
  });
});
