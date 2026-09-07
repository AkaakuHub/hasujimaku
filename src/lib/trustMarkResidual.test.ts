import { describe, expect, it } from "vitest";

import { createTrustMarkResidual } from "./trustMarkResidual";

describe("createTrustMarkResidual", () => {
  const size = 32;
  const channelSize = size * size;

  it("画像全体の色ずれと水平な帯を取り除く", () => {
    const input = new Float32Array(channelSize * 3);
    const output = Float32Array.from(input, (_, index) =>
      Math.floor((index % channelSize) / size) % 2 === 0 ? 0.02 : -0.01,
    );

    const residual = createTrustMarkResidual(input, output, size);

    expect(residual.every((value) => Math.abs(value) < 1e-7)).toBe(true);
  });

  it("垂直な帯を取り除く", () => {
    const input = new Float32Array(channelSize * 3);
    const output = Float32Array.from(input, (_, index) => (index % size < size / 2 ? 0.1 : -0.1));

    const residual = createTrustMarkResidual(input, output, size);

    expect(residual.every((value) => Math.abs(value) < 1e-7)).toBe(true);
  });

  it("細かな縞を抑え、2次元の緩やかな信号を残す", () => {
    const input = new Float32Array(channelSize * 3);
    const stripes = Float32Array.from(input, (_, index) => (index % 2 === 0 ? 0.1 : -0.1));
    const smooth = Float32Array.from(input, (_, index) => {
      const pixelIndex = index % channelSize;
      const x = pixelIndex % size;
      const y = Math.floor(pixelIndex / size);
      return 0.1 * Math.sin((x * 2 * Math.PI) / size) * Math.sin((y * 2 * Math.PI) / size);
    });

    const stripeResidual = createTrustMarkResidual(input, stripes, size);
    const smoothResidual = createTrustMarkResidual(input, smooth, size);

    expect(Math.abs(stripeResidual[size * 16 + 16])).toBeLessThan(0.02);
    expect(smoothResidual[size * 8 + 8]).toBeGreaterThan(0.08);
  });

  it("入力画像とモデル出力が同じ場合は画素を変えない", () => {
    const input = Float32Array.from(
      { length: channelSize * 3 },
      (_, index) => Math.sin(index) * 0.8,
    );

    expect(createTrustMarkResidual(input, input, size).every((value) => value === 0)).toBe(true);
  });

  it("チャンネル間で残差を混ぜず、モデルの出力範囲を制限する", () => {
    const input = new Float32Array(channelSize * 3);
    const output = new Float32Array(channelSize * 3);
    output[channelSize / 2 + size / 2] = 10;
    const clippedOutput = output.map((value) => Math.min(1, value));

    const residual = createTrustMarkResidual(input, output, size);

    expect(residual).toEqual(createTrustMarkResidual(input, clippedOutput, size));
    expect(residual.slice(channelSize).every((value) => value === 0)).toBe(true);
  });
});
