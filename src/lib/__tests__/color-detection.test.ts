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
});
