import { describe, expect, it } from "vitest";

import { drawTextWithOutline, TextDrawingContext } from "./textOutline";

describe("drawTextWithOutline", () => {
  it("文字を黒の6px輪郭で描いた後に塗りつぶす", () => {
    const calls: string[] = [];
    const context: TextDrawingContext = {
      strokeStyle: "",
      lineWidth: 0,
      strokeText: (text, x, y) => {
        calls.push(`stroke:${text}:${x}:${y}`);
      },
      fillText: (text, x, y) => {
        calls.push(`fill:${text}:${x}:${y}`);
      },
    };

    drawTextWithOutline(context, "字幕", 960, 924);

    expect(context.strokeStyle).toBe("#121311");
    expect(context.lineWidth).toBe(6);
    expect(calls).toEqual(["stroke:字幕:960:924", "fill:字幕:960:924"]);
  });
});
