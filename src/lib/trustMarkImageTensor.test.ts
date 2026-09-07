import { describe, expect, it } from "vitest";

import { createTrustMarkImageTensor } from "./trustMarkImageTensor";

describe("createTrustMarkImageTensor", () => {
  it("縮小範囲の全画素を使い、細かな縞を平均化する", () => {
    const pixels = new Uint8ClampedArray(12 * 4);
    for (let x = 0; x < 12; x += 1) {
      pixels.fill(x % 3 === 1 ? 255 : 0, x * 4, x * 4 + 3);
      pixels[x * 4 + 3] = 255;
    }

    const tensor = createTrustMarkImageTensor(pixels, 12, 1, 4);

    for (let index = 0; index < tensor.length; index += 1) {
      expect(tensor[index]).toBeCloseTo(index % 4 === 0 || index % 4 === 3 ? -0.25 : -1 / 3, 5);
    }
  });

  it("縦方向の縮小でも周辺画素を平均化する", () => {
    const pixels = new Uint8ClampedArray(12 * 4);
    for (let y = 0; y < 12; y += 1) {
      pixels.fill(y % 3 === 1 ? 255 : 0, y * 4, y * 4 + 3);
    }

    const tensor = createTrustMarkImageTensor(pixels, 1, 12, 4);

    for (let index = 0; index < tensor.length; index += 1) {
      const row = Math.floor(index / 4) % 4;
      expect(tensor[index]).toBeCloseTo(row === 0 || row === 3 ? -0.25 : -1 / 3, 5);
    }
  });

  it("長方形全体を重み付き平均で縮小する", () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

    expect(createTrustMarkImageTensor(pixels, 3, 1, 2)).toEqual(
      new Float32Array([0.25, -1, 0.25, -1, -0.25, -0.25, -0.25, -0.25, -1, 0.25, -1, 0.25]),
    );
  });

  it("拡大時に端の色を隣の画素と混ぜない", () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
    const tensor = createTrustMarkImageTensor(pixels, 2, 1, 4);

    expect(tensor.slice(0, 4)).toEqual(new Float32Array([1, 0.5, -0.5, -1]));
    expect(tensor.slice(32, 36)).toEqual(new Float32Array([-1, -0.5, 0.5, 1]));
  });

  it("同じ解像度ではRGBの順序と画素値を保つ", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 12, 0, 255, 0, 34, 0, 0, 255, 56, 255, 255, 255, 78,
    ]);

    expect(createTrustMarkImageTensor(pixels, 2, 2, 2)).toEqual(
      new Float32Array([1, -1, -1, 1, -1, 1, -1, 1, -1, -1, 1, 1]),
    );
  });

  it("非整数倍率でも単色画像の色を保つ", () => {
    const pixels = new Uint8ClampedArray(7 * 11 * 4).fill(64);
    const tensor = createTrustMarkImageTensor(pixels, 7, 11, 3);

    for (const value of tensor) {
      expect(value).toBeCloseTo(64 / 127.5 - 1, 6);
    }
  });
});
