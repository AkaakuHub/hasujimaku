import { describe, expect, it } from "vitest";

import { type DetectTrustMark, verifyWatermark } from "./watermarkVerification";

describe("verifyWatermark", () => {
  it("画像を読み取った後に検出モデルを読み込んで検証する", async () => {
    const steps: string[] = [];
    const file = Object.assign(new Blob(["image"]), { name: "generated.png" });
    const pixels = new Uint8ClampedArray([1, 2, 3, 255]);
    const detectTrustMark: DetectTrustMark = async (receivedPixels, width, height) => {
      steps.push(`detect:${width}x${height}`);
      expect(receivedPixels).toBe(pixels);
      return { detected: true, matchRate: 1 };
    };

    const result = await verifyWatermark(
      file,
      async () => {
        steps.push("read");
        return { height: 1, pixels, width: 1 };
      },
      async () => {
        steps.push("load");
        return detectTrustMark;
      },
    );

    expect(steps).toEqual(["read", "load", "detect:1x1"]);
    expect(result).toEqual({ detected: true, fileName: "generated.png", matchRate: 1 });
  });
});
