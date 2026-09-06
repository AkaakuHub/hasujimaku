import { describe, expect, it, vi } from "vitest";

import { createCachedAsyncLoader } from "./createCachedAsyncLoader";

describe("createCachedAsyncLoader", () => {
  it("同時に呼ばれても読み込みを一度だけ実行する", async () => {
    const load = vi.fn(async () => "loaded");
    const loadCached = createCachedAsyncLoader(load);

    const firstLoad = loadCached();
    const secondLoad = loadCached();

    expect(firstLoad).toBe(secondLoad);
    await expect(firstLoad).resolves.toBe("loaded");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("読み込みに失敗した場合は次の呼出しで再試行する", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("読み込み失敗"))
      .mockResolvedValue("loaded");
    const loadCached = createCachedAsyncLoader(load);

    await expect(loadCached()).rejects.toThrow("読み込み失敗");
    await expect(loadCached()).resolves.toBe("loaded");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("キャッシュを解放した場合は次の呼出しで読み直す", async () => {
    const load = vi.fn(async () => "loaded");
    const loadCached = createCachedAsyncLoader(load);

    await loadCached();
    loadCached.clear();
    await loadCached();

    expect(load).toHaveBeenCalledTimes(2);
  });
});
