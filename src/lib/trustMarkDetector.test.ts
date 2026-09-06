import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({
  detectTrustMark: vi.fn(async () => ({ detected: true, matchRate: 1 })),
  initializeTrustMarkDecoder: vi.fn(async () => undefined),
  preloadTrustMarkDecoderModel: vi.fn(async () => undefined),
}));

vi.mock("./trustMarkRuntime", () => runtime);

describe("loadTrustMarkDetector", () => {
  beforeEach(() => {
    vi.resetModules();
    runtime.detectTrustMark.mockReset();
    runtime.detectTrustMark.mockResolvedValue({ detected: true, matchRate: 1 });
    runtime.initializeTrustMarkDecoder.mockReset();
    runtime.initializeTrustMarkDecoder.mockResolvedValue(undefined);
    runtime.preloadTrustMarkDecoderModel.mockReset();
    runtime.preloadTrustMarkDecoderModel.mockResolvedValue(undefined);
  });

  it("同時に呼ばれても検証モデルの初期化を一度だけ実行する", async () => {
    const { loadTrustMarkDetector } = await import("./trustMarkDetector");
    const firstLoad = loadTrustMarkDetector();
    const secondLoad = loadTrustMarkDetector();

    expect(firstLoad).toBe(secondLoad);
    await expect(firstLoad).resolves.toBe(runtime.detectTrustMark);
    expect(runtime.initializeTrustMarkDecoder).toHaveBeenCalledTimes(1);
  });

  it("初期化に失敗した場合は次の呼出しで再試行する", async () => {
    runtime.initializeTrustMarkDecoder.mockRejectedValueOnce(new Error("読み込み失敗"));
    const { loadTrustMarkDetector } = await import("./trustMarkDetector");

    await expect(loadTrustMarkDetector()).rejects.toThrow("読み込み失敗");
    await expect(loadTrustMarkDetector()).resolves.toBe(runtime.detectTrustMark);
    expect(runtime.initializeTrustMarkDecoder).toHaveBeenCalledTimes(2);
  });

  it("モデル本体の取得完了を待ち、セッション初期化を裏で開始する", async () => {
    let finishInitialization = () => undefined;
    runtime.initializeTrustMarkDecoder.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInitialization = resolve;
        }),
    );
    const { preloadTrustMarkDetectorModel } = await import("./trustMarkDetector");

    await expect(preloadTrustMarkDetectorModel()).resolves.toBeUndefined();
    expect(runtime.preloadTrustMarkDecoderModel).toHaveBeenCalledTimes(1);
    expect(runtime.initializeTrustMarkDecoder).toHaveBeenCalledTimes(1);

    finishInitialization();
  });
});
