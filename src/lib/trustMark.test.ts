import { describe, expect, it } from "vitest";

import {
  applyTrustMarkOutput,
  createTrustMarkImageTensor,
  getTrustMarkDetection,
  trustMarkEncoderSize,
  trustMarkSignature,
} from "./trustMark";

const createDecoderOutput = (matchingBits: number): Float32Array =>
  Float32Array.from(trustMarkSignature, (bit, index) => {
    const decodedBit = index < matchingBits ? bit : 1 - bit;
    return decodedBit === 1 ? 1 : -1;
  });

describe("trustMark", () => {
  it("長方形画像全体をモデル入力に変換する", () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    expect(createTrustMarkImageTensor(pixels, 3, 1, 1)).toEqual(new Float32Array([-1, 1, -1]));
  });

  it("長方形画像の横幅全体をモデル入力へ標本化する", () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    expect(createTrustMarkImageTensor(pixels, 3, 1, 2)).toEqual(
      new Float32Array([0.5, -1, 0.5, -1, -0.5, -0.5, -0.5, -0.5, -1, 0.5, -1, 0.5]),
    );
  });

  it("モデル出力を画像全体のRGBだけに反映する", () => {
    const width = trustMarkEncoderSize + 2;
    const height = trustMarkEncoderSize;
    const pixels = new Uint8ClampedArray(width * height * 4).fill(128);
    pixels.forEach((_, index) => {
      if (index % 4 === 3) {
        pixels[index] = 255;
      }
    });
    const tensorLength = trustMarkEncoderSize * trustMarkEncoderSize * 3;
    const input = new Float32Array(tensorLength);
    const output = new Float32Array(tensorLength);
    const centerModelIndex =
      Math.floor(trustMarkEncoderSize / 2) * trustMarkEncoderSize +
      Math.floor(trustMarkEncoderSize / 2);
    output[centerModelIndex] = 1;

    applyTrustMarkOutput(pixels, width, height, input, output);

    const centerPixelIndex = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
    expect(pixels[centerPixelIndex]).toBe(242);
    expect(pixels.slice(0, 4)).toEqual(new Uint8ClampedArray([128, 128, 128, 255]));
    expect(pixels.every((value, index) => index % 4 !== 3 || value === 255)).toBe(true);
  });

  it("モデル出力の行方向の偏りを抑えて反映する", () => {
    const width = trustMarkEncoderSize;
    const height = trustMarkEncoderSize;
    const pixels = new Uint8ClampedArray(width * height * 4).fill(128);
    const tensorLength = trustMarkEncoderSize * trustMarkEncoderSize * 3;
    const input = new Float32Array(tensorLength);
    const output = new Float32Array(tensorLength);
    const centerRow = Math.floor(trustMarkEncoderSize / 2);

    for (let x = 0; x < trustMarkEncoderSize; x += 1) {
      output[centerRow * trustMarkEncoderSize + x] = 1;
    }

    applyTrustMarkOutput(pixels, width, height, input, output);

    const centerPixelIndex = (centerRow * width + Math.floor(width / 2)) * 4;
    expect(pixels[centerPixelIndex]).toBe(128);
  });

  it("100ビットの均等な固定署名を使用する", () => {
    expect(trustMarkSignature).toHaveLength(100);
    expect(trustMarkSignature.reduce((total, bit) => total + bit, 0)).toBe(50);
  });

  it("署名の75%以上が一致した場合だけ検出する", () => {
    expect(getTrustMarkDetection(createDecoderOutput(74)).detected).toBe(false);
    expect(getTrustMarkDetection(createDecoderOutput(75))).toEqual({
      detected: true,
      matchRate: 0.75,
    });
  });

  it("検証結果のビット数が異なる場合は失敗する", () => {
    expect(() => getTrustMarkDetection(new Float32Array(99))).toThrow(
      "透かしの検証結果が不正です。",
    );
  });
});
