import { describe, expect, it } from "vitest";

import { createWatermarkTestImage } from "../../test/fixtures/watermarkImage";
import { detectImageWatermark, embedImageWatermark } from "./imageWatermark";

describe("画像透かし", () => {
  it.each([
    [512, 320],
    [321, 513],
    [511, 511],
  ])("%i×%iの画像へ埋め込み、元画像なしで検出する", (width, height) => {
    const pixels = createWatermarkTestImage(width, height);
    expect(detectImageWatermark(pixels, width, height).detected).toBe(false);
    embedImageWatermark(pixels, width, height);
    expect(detectImageWatermark(pixels, width, height).detected).toBe(true);
  });

  it("画素変化を最大3階調に抑え、平坦部と透明度を変更しない", () => {
    const width = 512;
    const height = 320;
    const pixels = createWatermarkTestImage(width, height);
    for (let index = 0; index < width * 8 * 4; index += 4) {
      pixels[index + 3] = index % 255;
    }
    const original = pixels.slice();
    embedImageWatermark(pixels, width, height);

    let changedPixels = 0;
    let maximumChange = 0;
    let protectedPixelChanges = 0;
    for (let index = 0; index < pixels.length; index += 1) {
      maximumChange = Math.max(maximumChange, Math.abs(pixels[index] - original[index]));
      const x = Math.floor(index / 4) % width;
      if (x < width / 4 || index % 4 === 3 || index < width * 8 * 4) {
        protectedPixelChanges += Number(pixels[index] !== original[index]);
      }
      changedPixels += Number(pixels[index] !== original[index]);
    }
    expect(changedPixels).toBeGreaterThan(0);
    expect(maximumChange).toBeLessThanOrEqual(3);
    expect(protectedPixelChanges).toBe(0);
  });

  it("模様が不足する画像では画素を変更せず、埋め込み失敗を返す", () => {
    const pixels = new Uint8ClampedArray(256 * 256 * 4).fill(255);
    const original = pixels.slice();
    expect(() => embedImageWatermark(pixels, 256, 256)).toThrow("輪郭や模様が少ない");
    expect(pixels).toEqual(original);
    expect(detectImageWatermark(pixels, 256, 256)).toEqual({ detected: false, matchRate: 0 });
  });

  it("未埋め込みの縞・格子・ノイズ画像を誤検出しない", () => {
    const width = 256;
    const height = 256;
    for (let variant = 0; variant < 24; variant += 1) {
      let random = variant + 1;
      const pixels = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
          const patterns = [
            127 + 110 * Math.sin((x + variant) / 3),
            (Math.floor(x / 5) + Math.floor(y / 7)) % 2 === 0 ? 0 : 255,
            random >>> 24,
          ];
          const index = (y * width + x) * 4;
          pixels.fill(patterns[variant % patterns.length], index, index + 3);
          pixels[index + 3] = 255;
        }
      }
      expect(detectImageWatermark(pixels, width, height).detected).toBe(false);
    }
  });

  it.each([
    [0, 8],
    [8, -1],
    [NaN, 8],
    [8.5, 8],
    [8, 8],
  ])("不正な画像サイズ%i×%iを拒否する", (width, height) => {
    const pixels = new Uint8ClampedArray(4);
    expect(() => embedImageWatermark(pixels, width, height)).toThrow("サイズが不正");
    expect(() => detectImageWatermark(pixels, width, height)).toThrow("サイズが不正");
  });
});
