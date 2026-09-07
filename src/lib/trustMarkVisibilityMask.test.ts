import { describe, expect, it } from "vitest";

import { createTrustMarkVisibilityMask } from "./trustMarkVisibilityMask";

describe("createTrustMarkVisibilityMask", () => {
  it("平坦な領域では透かしを弱める", () => {
    const mask = createTrustMarkVisibilityMask(new Float32Array(5 * 5 * 3), 5);

    expect(mask.every((value) => Math.abs(value - 0.2) < 1e-6)).toBe(true);
  });

  it("コントラストの高い領域では透かしを強める", () => {
    const size = 5;
    const channelSize = size * size;
    const input = new Float32Array(channelSize * 3);
    for (let channel = 0; channel < 3; channel += 1) {
      input[channel * channelSize + 12] = 1;
    }

    const mask = createTrustMarkVisibilityMask(input, size);

    expect(mask[12]).toBe(1.5);
  });
});
