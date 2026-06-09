import { describe, it, expect } from "vitest";
import { rgbToHsv, classifyPixel } from "../color-detection";

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
