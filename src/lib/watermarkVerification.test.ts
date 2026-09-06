import { describe, expect, it } from "vitest";

import { verifyWatermark } from "./watermarkVerification";

describe("verifyWatermark", () => {
  it("Workerの検証結果へファイル名を加える", async () => {
    const file = Object.assign(new Blob(["image"]), { name: "generated.png" });
    const result = await verifyWatermark(file, async (image) => {
      expect(image).toBe(file);
      return { detected: true, matchRate: 1 };
    });

    expect(result).toEqual({ detected: true, fileName: "generated.png", matchRate: 1 });
  });
});
