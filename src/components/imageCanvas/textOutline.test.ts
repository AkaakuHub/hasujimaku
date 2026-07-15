import assert from "node:assert/strict";
import test from "node:test";

import { drawTextWithOutline, TextDrawingContext } from "./textOutline";

test("文字を黒の6px輪郭で描いた後に塗りつぶす", () => {
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

  assert.equal(context.strokeStyle, "#121311");
  assert.equal(context.lineWidth, 6);
  assert.deepEqual(calls, ["stroke:字幕:960:924", "fill:字幕:960:924"]);
});
