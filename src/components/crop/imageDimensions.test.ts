import { describe, expect, it } from "vitest";

import { getResizedImageDimensions } from "./imageDimensions";

describe("getResizedImageDimensions", () => {
  it("長辺が2560px以下なら元の寸法を維持する", () => {
    expect(getResizedImageDimensions({ width: 1920, height: 1080 })).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("横長の高解像度画像を比率を保って縮小する", () => {
    expect(getResizedImageDimensions({ width: 6000, height: 4000 })).toEqual({
      width: 2560,
      height: 1707,
    });
  });

  it("縦長の高解像度画像を比率を保って縮小する", () => {
    expect(getResizedImageDimensions({ width: 4000, height: 6000 })).toEqual({
      width: 1707,
      height: 2560,
    });
  });
});
