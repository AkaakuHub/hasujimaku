import { describe, expect, it } from "vitest";

import {
  applyTrustMarkOutput,
  getTrustMarkDetection,
  trustMarkEncoderSize,
  trustMarkSignature,
} from "./trustMark";

const createDecoderOutput = (matchingBits: number): Float32Array =>
  Float32Array.from(trustMarkSignature, (bit, index) => {
    const decodedBit = index < matchingBits ? bit : 1 - bit;
    return decodedBit === 1 ? 1 : -1;
  });

const createPairBiasedDecoderOutput = (matchingPairs: number): Float32Array => {
  const output = new Float32Array(trustMarkSignature.length);
  for (let pair = 0; pair < trustMarkSignature.length / 2; pair += 1) {
    const firstIndex = pair * 2;
    const firstBit = trustMarkSignature[firstIndex];
    if (pair < 20) {
      output[firstIndex] = firstBit === 1 ? 1 : -1;
      output[firstIndex + 1] = firstBit === 1 ? -1 : 1;
    } else if (pair < matchingPairs) {
      output[firstIndex] = firstBit === 1 ? 1 : -1;
      output[firstIndex + 1] = firstBit === 1 ? 0.5 : -0.5;
    } else {
      output[firstIndex] = firstBit === 1 ? -1 : 1;
      output[firstIndex + 1] = firstBit === 1 ? 1 : -1;
    }
  }
  return output;
};

describe("trustMark", () => {
  it("モデル出力を視覚影響を抑えて画像全体のRGBだけに反映する", () => {
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
    expect(pixels[centerPixelIndex]).toBe(129);
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

  it("署名の符号が66%以上一致した場合に検出する", () => {
    expect(getTrustMarkDetection(createDecoderOutput(65)).detected).toBe(false);
    expect(getTrustMarkDetection(createDecoderOutput(66))).toEqual({
      detected: true,
      matchRate: 0.66,
    });
  });

  it("減色による共通の偏りがあっても署名ペアの82%以上から検出する", () => {
    expect(getTrustMarkDetection(createPairBiasedDecoderOutput(40)).detected).toBe(false);
    expect(getTrustMarkDetection(createPairBiasedDecoderOutput(41))).toEqual({
      detected: true,
      matchRate: 0.61,
    });
  });

  it("検証結果のビット数が異なる場合は失敗する", () => {
    expect(() => getTrustMarkDetection(new Float32Array(99))).toThrow(
      "透かしの検証結果が不正です。",
    );
  });
});
