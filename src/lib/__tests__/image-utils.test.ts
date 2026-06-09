import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { imageDataToDataUrl, classifyStickerColor } from "../image-utils";

// ── Canvas mock ────────────────────────────────────────────────────────

function createMockCtx() {
  return {
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray([200, 30, 30, 255]), // red pixel
      width: 1,
      height: 1,
    }),
    canvas: { width: 48, height: 48 },
  };
}

let mockCtx: ReturnType<typeof createMockCtx>;

beforeEach(() => {
  mockCtx = createMockCtx();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,mock"
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── imageDataToDataUrl ─────────────────────────────────────────────────

describe("imageDataToDataUrl", () => {
  it("creates canvas, puts image data, returns data URL", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4); // 4x4 image
    const imageData = { data, width: 4, height: 4 } as ImageData;
    const result = imageDataToDataUrl(imageData);
    expect(mockCtx.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
    expect(result).toBe("data:image/png;base64,mock");
  });

  it("passes quality parameter to toDataURL", () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64,q");
    const data = new Uint8ClampedArray(4);
    const imageData = { data, width: 1, height: 1 } as ImageData;
    imageDataToDataUrl(imageData, 0.5);
    expect(spy).toHaveBeenCalledWith("image/jpeg", 0.5);
  });
});

// ── classifyStickerColor ───────────────────────────────────────────────

// Mock Image class to synchronously trigger onload when src is set
const OrigImage = globalThis.Image;

function setupImageMock() {
  (globalThis as any).Image = class MockImage {
    width = 48;
    height = 48;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";
    get src() {
      return this._src;
    }
    set src(val: string) {
      this._src = val;
      if (this.onload) {
        queueMicrotask(() => this.onload?.());
      }
    }
  };
}

function restoreImageMock() {
  globalThis.Image = OrigImage;
}

describe("classifyStickerColor", () => {
  beforeEach(() => {
    setupImageMock();
  });

  afterEach(() => {
    restoreImageMock();
  });

  it("classifies a red sticker thumbnail as R", async () => {
    // Mock getImageData to return red pixels
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([200, 30, 30, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,red");
    expect(result).toBe("R");
  });

  it("classifies a white sticker thumbnail as U", async () => {
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([240, 240, 240, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,white");
    expect(result).toBe("U");
  });

  it("classifies a blue sticker thumbnail as F", async () => {
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([30, 60, 180, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,blue");
    expect(result).toBe("F");
  });

  it("classifies a green sticker thumbnail as B", async () => {
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([30, 140, 50, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,green");
    expect(result).toBe("B");
  });

  it("classifies a yellow sticker thumbnail as D", async () => {
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([220, 200, 30, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,yellow");
    expect(result).toBe("D");
  });

  it("classifies an orange sticker thumbnail as L", async () => {
    // Orange: h≈26, s≈0.88, v≈0.63 → L (hue 20-30, v≤0.7)
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([160, 80, 20, 255]),
      width: 1,
      height: 1,
    });
    const result = await classifyStickerColor("data:image/png;base64,orange");
    expect(result).toBe("L");
  });

  it("samples center 50% of image (margin 0.25)", async () => {
    mockCtx.getImageData.mockReturnValue({
      data: new Uint8ClampedArray([200, 30, 30, 255]),
      width: 1,
      height: 1,
    });
    await classifyStickerColor("data:image/png;base64,test");
    // Verify getImageData was called with center region
    const call = mockCtx.getImageData.mock.calls[0];
    expect(call[2]).toBe(Math.floor(48 * 0.5)); // sw = width * (1 - 2*0.25)
    expect(call[3]).toBe(Math.floor(48 * 0.5)); // sh = height * (1 - 2*0.25)
  });

  it("rejects when image fails to load", async () => {
    // Override Image mock to trigger onerror
    (globalThis as any).Image = class MockImage {
      width = 48;
      height = 48;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        queueMicrotask(() => this.onerror?.());
      }
      get src() {
        return "";
      }
    };
    await expect(
      classifyStickerColor("data:image/png;base64,bad")
    ).rejects.toThrow("Failed to load sticker image");
  });
});
