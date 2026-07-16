import { describe, expect, it } from "vitest";

import { isKleeOneSupportedCharacter } from "./kleeOneCharacterCoverage";
import { getUnsupportedKleeOneCharacters } from "./kleeOneUnsupportedCharacters";

describe("isKleeOneSupportedCharacter", () => {
  it("Klee Oneにある文字を認識する", () => {
    expect(isKleeOneSupportedCharacter("字")).toBe(true);
  });

  it("Klee Oneにない絵文字を認識する", () => {
    expect(isKleeOneSupportedCharacter("🙂")).toBe(false);
  });

  it("入力中の非対応文字を重複なく返す", () => {
    expect(getUnsupportedKleeOneCharacters("字幕🙂🙂", "A")).toEqual(["🙂"]);
  });

  it("異体字セレクタを含む文字をひとまとまりで返す", () => {
    expect(getUnsupportedKleeOneCharacters("‼️", "")).toEqual(["‼️"]);
  });
});
