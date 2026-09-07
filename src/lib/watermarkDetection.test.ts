import { describe, expect, it, vi } from "vitest";

import { detectWatermarkWithLegacyFallback } from "./watermarkDetection";

describe("detectWatermarkWithLegacyFallback", () => {
  it("Adobe透かしで検出した場合は旧透かしを検査しない", async () => {
    const detectLegacyWatermark = vi.fn(async () => true);

    await expect(
      detectWatermarkWithLegacyFallback(
        async () => ({ detected: true, matchRate: 0.8 }),
        detectLegacyWatermark,
      ),
    ).resolves.toEqual({ detected: true, matchRate: 0.8 });
    expect(detectLegacyWatermark).not.toHaveBeenCalled();
  });

  it("Adobe透かしで検出しなかった場合だけ旧透かしを検査する", async () => {
    const callOrder: string[] = [];

    await expect(
      detectWatermarkWithLegacyFallback(
        async () => {
          callOrder.push("Adobe");
          return { detected: false, matchRate: 0.4 };
        },
        async () => {
          callOrder.push("旧テキスト");
          return true;
        },
      ),
    ).resolves.toEqual({ detected: true, matchRate: 0.4 });
    expect(callOrder).toEqual(["Adobe", "旧テキスト"]);
  });
});
