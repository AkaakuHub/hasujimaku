import { describe, expect, it } from "vitest";

import { getCanvasSize, getSubtitleLayout } from "./renderLayout";

describe("getCanvasSize", () => {
  it("短辺が1000未満の場合、比率を維持して短辺を1000にする", () => {
    expect(getCanvasSize(800, 1200)).toEqual({ width: 1000, height: 1500 });
  });

  it("短辺が1000以上の場合、元の寸法を維持する", () => {
    expect(getCanvasSize(1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });
});

describe("getSubtitleLayout", () => {
  it("1920x1080で1行の旧レイアウトを維持する", () => {
    expect(getSubtitleLayout(1920, 1080, 1)).toEqual({
      nameFontSize: 38,
      nameY: 1014,
      quoteFontSize: 52,
      quoteLetterSpacing: 2,
      quoteYPositions: [925],
      strokeWidth: 6,
    });
  });

  it("1920x1080で2行の旧レイアウトを維持する", () => {
    expect(getSubtitleLayout(1920, 1080, 2).quoteYPositions).toEqual([864, 925]);
  });

  it("3行以上を同じ行間で下端から積み上げる", () => {
    expect(getSubtitleLayout(1920, 1080, 3).quoteYPositions).toEqual([803, 864, 925]);
  });

  it("任意比率では狭い辺に合わせて文字と位置を同じ倍率で縮小する", () => {
    const layout = getSubtitleLayout(1000, 1000, 2);
    const scale = 1000 / 1920;

    expect(layout.quoteFontSize).toBeCloseTo(52 * scale);
    expect(layout.quoteLetterSpacing).toBeCloseTo(2 * scale);
    expect(layout.strokeWidth).toBeCloseTo(6 * scale);
    expect(layout.quoteYPositions).toEqual([1000 - 216 * scale, 1000 - 155 * scale]);
    expect(layout.nameY).toBeCloseTo(1000 - 66 * scale);
  });
});
