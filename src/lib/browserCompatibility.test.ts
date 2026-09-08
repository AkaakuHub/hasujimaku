import { describe, expect, it } from "vitest";

import { getUnsupportedBrowserFeatures } from "./browserCompatibility";

describe("getUnsupportedBrowserFeatures", () => {
  it("すべての必須機能に対応している場合は空配列を返す", () => {
    expect(
      getUnsupportedBrowserFeatures({
        createImageBitmap: true,
        offscreenCanvas: true,
        webAssembly: true,
      }),
    ).toEqual([]);
  });

  it("対応していない必須機能の名称を返す", () => {
    expect(
      getUnsupportedBrowserFeatures({
        createImageBitmap: false,
        offscreenCanvas: false,
        webAssembly: false,
      }),
    ).toEqual(["WebAssembly", "OffscreenCanvas", "createImageBitmap"]);
  });
});
