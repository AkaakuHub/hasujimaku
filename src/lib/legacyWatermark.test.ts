import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

import { detectLegacyWatermark } from "./legacyWatermark";

beforeAll(async () => {
  await initWasm(readFileSync("node_modules/@resvg/resvg-wasm/index_bg.wasm"));
});

const renderHistoricalWatermark = (
  text: string,
  fontSize: number,
  x: number,
  y: number,
  opacity: number,
): Uint8ClampedArray => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="background"><stop stop-color="#31506d"/><stop offset="1" stop-color="#7b694e"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#background)"/><text x="${x}" y="${y}" opacity="${opacity}" fill="#e6e6e6" stroke="#121311" stroke-width="3" paint-order="stroke fill" font-family="Klee One" font-size="${fontSize}">${text}</text></svg>`;
  const renderer = new Resvg(svg, {
    font: { fontBuffers: [new Uint8Array(readFileSync("src/assets/fonts/KleeOne-Regular.dat"))] },
  });

  try {
    const image = renderer.render();
    try {
      return new Uint8ClampedArray(image.pixels);
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
};

const shrinkImage = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  divisor: number,
): Uint8ClampedArray => {
  const targetWidth = width / divisor;
  const targetHeight = height / divisor;
  const resizedPixels = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let total = 0;
        for (let sourceY = y * divisor; sourceY < (y + 1) * divisor; sourceY += 1) {
          for (let sourceX = x * divisor; sourceX < (x + 1) * divisor; sourceX += 1) {
            total += pixels[(sourceY * width + sourceX) * 4 + channel];
          }
        }
        resizedPixels[(y * targetWidth + x) * 4 + channel] = total / divisor ** 2;
      }
    }
  }

  return resizedPixels;
};

const createImage = (width: number, height: number): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      const luminance = 80 + Math.round((x / width) * 40 + (y / height) * 20);
      pixels.set([luminance, luminance, luminance, 255], pixelIndex);
    }
  }
  return pixels;
};

const drawRectangle = (
  pixels: Uint8ClampedArray,
  width: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  luminance: number,
): void => {
  for (let y = Math.max(0, top); y < bottom; y += 1) {
    for (let x = Math.max(0, left); x < right; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      pixels.set([luminance, luminance, luminance, 255], pixelIndex);
    }
  }
};

const drawLegacyTextGeometry = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  scale: number,
): void => {
  const fontSize = 16 * scale;
  const characterWidth = fontSize;
  const baseline = height - 5 * scale;
  for (let characterIndex = 0; characterIndex < 14; characterIndex += 1) {
    const left = Math.round(5 * scale + characterIndex * characterWidth);
    const right = Math.round(left + characterWidth * 0.8);
    const top = Math.round(baseline - fontSize);
    const bottom = Math.min(height, Math.round(baseline + fontSize * 0.15));
    const strokeWidth = Math.max(1, Math.round(2 * scale));
    drawRectangle(pixels, width, left, top, right, bottom, 35);
    drawRectangle(
      pixels,
      width,
      left + strokeWidth,
      top + strokeWidth,
      right - strokeWidth,
      bottom - strokeWidth,
      215,
    );
  }
};

describe("detectLegacyWatermark", () => {
  it.each([
    {
      fontSize: 20,
      opacity: 1,
      text: "この画像は#活動記録字幕ジェネレーターによって作成されました。",
      x: 36,
      y: 1050,
    },
    {
      fontSize: 16,
      opacity: 0.55,
      text: "#活動記録字幕ジェネレーター",
      x: 5,
      y: 1075,
    },
  ])("履歴上の$textを描画した画像を検出する", ({ text, fontSize, x, y, opacity }) => {
    const pixels = renderHistoricalWatermark(text, fontSize, x, y, opacity);

    expect(detectLegacyWatermark(pixels, 1920, 1080)).toBe(true);
  });

  it("履歴上の半透明な旧透かしを50%へ縮小しても検出する", () => {
    const pixels = renderHistoricalWatermark("#活動記録字幕ジェネレーター", 16, 5, 1075, 0.55);
    const resizedPixels = shrinkImage(pixels, 1920, 1080, 2);

    expect(detectLegacyWatermark(resizedPixels, 960, 540)).toBe(true);
  });

  it.each([
    { height: 1080, scale: 1, width: 1920 },
    { height: 540, scale: 0.5, width: 960 },
    { height: 360, scale: 1 / 3, width: 640 },
  ])("縮小率が$scaleでも左下の旧透かし形状を検出する", ({ width, height, scale }) => {
    const pixels = createImage(width, height);
    drawLegacyTextGeometry(pixels, width, height, scale);

    expect(detectLegacyWatermark(pixels, width, height)).toBe(true);
  });

  it("左下に文字形状がない画像は検出しない", () => {
    const width = 960;
    const height = 540;

    expect(detectLegacyWatermark(createImage(width, height), width, height)).toBe(false);
  });

  it("同じ文字形状でも旧透かしの位置と異なる場合は検出しない", () => {
    const width = 960;
    const height = 540;
    const pixels = createImage(width, height);
    drawLegacyTextGeometry(pixels, width, height - 100, 0.5);

    expect(detectLegacyWatermark(pixels, width, height)).toBe(false);
  });

  it("画素数が画像サイズと一致しない場合は検出しない", () => {
    expect(detectLegacyWatermark(new Uint8ClampedArray(3), 1, 1)).toBe(false);
  });
});
