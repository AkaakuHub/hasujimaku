import { readFileSync } from "node:fs";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { beforeAll, describe, expect, it } from "vitest";

import {
  createLegacyWatermarkTemplate,
  detectLegacyWatermark,
  getLegacyWatermarkMatch,
  legacyWatermarkDetectionThreshold,
  legacyWatermarkSpecifications,
  type LegacyWatermarkSpecification,
  type LegacyWatermarkTemplate,
} from "./legacyWatermark";

const canvasWidth = 1920;
const canvasHeight = 1080;
const fontBuffer = new Uint8Array(readFileSync("src/assets/fonts/KleeOne-Regular.dat"));
let templates: LegacyWatermarkTemplate[];

const renderSvg = (svg: string): Uint8ClampedArray => {
  const renderer = new Resvg(svg, { font: { fontBuffers: [fontBuffer] } });
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

const renderTemplate = (specification: LegacyWatermarkSpecification): LegacyWatermarkTemplate => {
  const { height, left, top, width } = specification.region;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${left} ${top} ${width} ${height}"><rect x="${left}" y="${top}" width="${width}" height="${height}" fill="#808080"/><text x="${specification.x}" y="${specification.y}" opacity="${specification.opacity}" fill="#e6e6e6" stroke="#121311" stroke-width="3" paint-order="stroke fill" font-family="Klee One" font-size="${specification.fontSize}">${specification.text}</text></svg>`;
  return createLegacyWatermarkTemplate(renderSvg(svg), specification);
};

const renderImage = (
  specification: LegacyWatermarkSpecification,
  text = specification.text,
  offsetX = 0,
  offsetY = 0,
): Uint8ClampedArray => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}"><defs><linearGradient id="background"><stop stop-color="#31506d"/><stop offset="1" stop-color="#7b694e"/></linearGradient></defs><rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#background)"/><text x="${specification.x + offsetX}" y="${specification.y + offsetY}" opacity="${specification.opacity}" fill="#e6e6e6" stroke="#121311" stroke-width="3" paint-order="stroke fill" font-family="Klee One" font-size="${specification.fontSize}">${text}</text></svg>`;
  return renderSvg(svg);
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

const addBlockNoise = (
  pixels: Uint8ClampedArray,
  width: number,
  quantizationStep: number,
): Uint8ClampedArray => {
  const noisyPixels = new Uint8ClampedArray(pixels);
  for (let index = 0; index < noisyPixels.length; index += 4) {
    const x = (index / 4) % width;
    const y = Math.floor(index / 4 / width);
    const blockOffset = (((Math.floor(x / 8) + Math.floor(y / 8)) % 3) - 1) * 3;
    for (let channel = 0; channel < 3; channel += 1) {
      noisyPixels[index + channel] =
        Math.round(noisyPixels[index + channel] / quantizationStep) * quantizationStep +
        blockOffset;
    }
  }
  return noisyPixels;
};

beforeAll(async () => {
  await initWasm(readFileSync("node_modules/@resvg/resvg-wasm/index_bg.wasm"));
  templates = legacyWatermarkSpecifications.map(renderTemplate);
});

describe("detectLegacyWatermark", () => {
  it.each(legacyWatermarkSpecifications.map((specification, index) => ({ index, specification })))(
    "履歴上の旧透かし$indexを検出する",
    ({ specification }) => {
      const pixels = renderImage(specification);

      expect(
        getLegacyWatermarkMatch(pixels, canvasWidth, canvasHeight, templates),
      ).toBeGreaterThanOrEqual(legacyWatermarkDetectionThreshold);
    },
  );

  it("半透明な旧透かしを50%へ縮小し、ブロックノイズを加えても検出する", () => {
    const specification = legacyWatermarkSpecifications[2];
    const resizedPixels = shrinkImage(renderImage(specification), canvasWidth, canvasHeight, 2);
    const noisyPixels = addBlockNoise(resizedPixels, 960, 12);

    expect(getLegacyWatermarkMatch(noisyPixels, 960, 540, templates)).toBeGreaterThanOrEqual(
      legacyWatermarkDetectionThreshold,
    );
  });

  it("同じ位置と書式の異なる文字列を検出しない", () => {
    const specification = legacyWatermarkSpecifications[2];
    const pixels = renderImage(specification, "あいうえおかきくけこさしすせそ");

    expect(detectLegacyWatermark(pixels, canvasWidth, canvasHeight, templates)).toBe(false);
  });

  it("同じ文字列でも位置が異なる場合は検出しない", () => {
    const specification = legacyWatermarkSpecifications[2];
    const pixels = renderImage(specification, specification.text, 12, -12);

    expect(detectLegacyWatermark(pixels, canvasWidth, canvasHeight, templates)).toBe(false);
  });

  it("左下に細かな矩形が並ぶ画像を検出しない", () => {
    const rectangles = Array.from(
      { length: 18 },
      (_, index) =>
        `<rect x="${5 + index * 13}" y="1060" width="9" height="17" fill="${index % 2 === 0 ? "#e6e6e6" : "#121311"}"/>`,
    ).join("");
    const pixels = renderSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}"><rect width="${canvasWidth}" height="${canvasHeight}" fill="#586a72"/>${rectangles}</svg>`,
    );

    expect(detectLegacyWatermark(pixels, canvasWidth, canvasHeight, templates)).toBe(false);
  });

  it("透かしがない画像を検出しない", () => {
    const pixels = renderSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}"><rect width="${canvasWidth}" height="${canvasHeight}" fill="#586a72"/></svg>`,
    );

    expect(detectLegacyWatermark(pixels, canvasWidth, canvasHeight, templates)).toBe(false);
  });

  it("透かしがない公開画像を検出しない", () => {
    const imageBase64 = readFileSync("public/ogp_default.png").toString("base64");
    const pixels = renderSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}"><image href="data:image/png;base64,${imageBase64}" width="${canvasWidth}" height="${canvasHeight}"/></svg>`,
    );

    expect(detectLegacyWatermark(pixels, canvasWidth, canvasHeight, templates)).toBe(false);
  });

  it("画素数が画像サイズと一致しない場合は検出しない", () => {
    expect(detectLegacyWatermark(new Uint8ClampedArray(3), 1, 1, templates)).toBe(false);
  });
});
