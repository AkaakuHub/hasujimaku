import { describe, expect, it } from "vitest";

import { shareImage } from "./shareImage";

describe("shareImage", () => {
  it("AbortErrorによる共有のキャンセルを正常終了として扱う", async () => {
    const share = () => Promise.reject(new DOMException("Share canceled", "AbortError"));

    await expect(shareImage(share)).resolves.toBeUndefined();
  });

  it("AbortError以外は呼び出し元へ返す", async () => {
    const share = () => Promise.reject(new Error("Network error"));

    await expect(shareImage(share)).rejects.toThrow("Network error");
  });
});
