import { describe, expect, it } from "vitest";

import { createTrustMarkResidual } from "./trustMarkResidual";

describe("createTrustMarkResidual", () => {
  const size = 4;
  const channelSize = size * size;

  it("残差の輝度成分を25%減らす", () => {
    const input = new Float32Array(channelSize * 3);
    const output = new Float32Array(channelSize * 3);
    output[0] = 0.1;
    output[channelSize] = 0.2;
    output[channelSize * 2] = -0.1;

    const residual = createTrustMarkResidual(input, output, size);
    const originalLuminance = 0.1 * 0.2126 + 0.2 * 0.7152 - 0.1 * 0.0722;
    const residualLuminance =
      residual[0] * 0.2126 + residual[channelSize] * 0.7152 + residual[channelSize * 2] * 0.0722;

    expect(residualLuminance).toBeCloseTo(originalLuminance * 0.75);
  });

  it("入力画像とモデル出力が同じ場合は画素を変えない", () => {
    const input = Float32Array.from(
      { length: channelSize * 3 },
      (_, index) => Math.sin(index) * 0.8,
    );

    expect(createTrustMarkResidual(input, input, size).every((value) => value === 0)).toBe(true);
  });

  it("モデル出力を有効範囲に制限する", () => {
    const input = new Float32Array(channelSize * 3);
    const output = new Float32Array(channelSize * 3);
    output[0] = 10;
    const clippedOutput = output.map((value) => Math.min(1, value));

    expect(createTrustMarkResidual(input, output, size)).toEqual(
      createTrustMarkResidual(input, clippedOutput, size),
    );
  });
});
