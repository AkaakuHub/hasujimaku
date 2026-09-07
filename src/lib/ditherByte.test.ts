import { describe, expect, it } from "vitest";

import { ditherByte } from "./ditherByte";

describe("ditherByte", () => {
  it("整数と画素値の範囲を維持する", () => {
    expect(ditherByte(128, 1, 2, 0)).toBe(128);
    expect(ditherByte(-1, 1, 2, 0)).toBe(0);
    expect(ditherByte(256, 1, 2, 0)).toBe(255);
  });

  it("小数部分を画素全体の平均として維持する", () => {
    let total = 0;
    const size = 256;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        total += ditherByte(128.25, x, y, 0) - 128;
      }
    }

    expect(total / (size * size)).toBeCloseTo(0.25, 2);
  });
});
