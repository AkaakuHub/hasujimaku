import { describe, expect, it } from "vitest";

import { getCropDrawOffset, getMinimumZoom, getRotatedSize } from "./cropGeometry";

describe("getRotatedSize", () => {
  it("90度回転時に幅と高さを入れ替える", () => {
    const size = getRotatedSize(100, 50, 90);

    expect(size.width).toBeCloseTo(50);
    expect(size.height).toBeCloseTo(100);
  });
});

describe("getCropDrawOffset", () => {
  it("回転後の外接矩形を基準にクロップ開始位置を求める", () => {
    const offset = getCropDrawOffset({ width: 100, height: 50 }, { x: 10, y: 20 }, 90);

    expect(offset.x).toBeCloseTo(15);
    expect(offset.y).toBeCloseTo(30);
  });
});

describe("getMinimumZoom", () => {
  it("表示サイズを取得する前は既定の倍率を返す", () => {
    expect(getMinimumZoom(null, null, 0)).toBe(1);
  });

  it("90度回転時にクロップ枠を覆う最小倍率を返す", () => {
    expect(
      getMinimumZoom({ width: 400, height: 225 }, { width: 400, height: 225 }, 90),
    ).toBeCloseTo(400 / 225);
  });
});
