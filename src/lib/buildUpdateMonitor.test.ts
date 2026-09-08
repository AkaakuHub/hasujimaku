import { describe, expect, it, vi } from "vitest";

import { createBuildUpdateMonitor } from "./buildUpdateMonitor";

const createHarness = (fetchBuildId = vi.fn(async () => "current")) => {
  let visible = true;
  let scheduledCallback: (() => void) | undefined;
  const reload = vi.fn();
  const clearTimer = vi.fn(() => {
    scheduledCallback = undefined;
  });
  const setTimer = vi.fn((callback: () => void) => {
    scheduledCallback = callback;
    return 1;
  });
  const monitor = createBuildUpdateMonitor({
    currentBuildId: "current",
    fetchBuildId,
    isVisible: () => visible,
    reload,
    setTimer,
    clearTimer,
  });

  return {
    clearTimer,
    fetchBuildId,
    monitor,
    reload,
    runScheduledCheck: async () => {
      const callback = scheduledCallback;
      scheduledCallback = undefined;
      callback?.();
      await Promise.resolve();
      await Promise.resolve();
    },
    setTimer,
    setVisible: (value: boolean) => {
      visible = value;
    },
  };
};

describe("buildUpdateMonitor", () => {
  it("表示中だけ起動直後と5分間隔で確認する", async () => {
    const harness = createHarness();
    harness.monitor.start();
    await harness.monitor.checkNow();

    expect(harness.fetchBuildId).toHaveBeenCalledTimes(1);
    expect(harness.setTimer).toHaveBeenLastCalledWith(expect.any(Function), 300_000);

    await harness.runScheduledCheck();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(2);
  });

  it("非表示中は確認を止め、再表示時に直ちに確認する", async () => {
    const harness = createHarness();
    harness.monitor.start();
    await harness.monitor.checkNow();

    harness.setVisible(false);
    harness.monitor.handleVisibilityChange();
    await harness.runScheduledCheck();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(1);
    expect(harness.clearTimer).toHaveBeenCalled();

    harness.setVisible(true);
    harness.monitor.handleVisibilityChange();
    await harness.monitor.checkNow();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(2);
  });

  it("通信失敗後も待機を続け、通信復帰時に直ちに確認する", async () => {
    const fetchBuildId = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue("current");
    const harness = createHarness(fetchBuildId);
    harness.monitor.start();
    await harness.monitor.checkNow();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(1);
    expect(harness.setTimer).toHaveBeenCalled();

    harness.monitor.handleOnline();
    await harness.monitor.checkNow();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(2);
  });

  it("複数のイベントが重なっても確認を多重実行しない", async () => {
    let resolveBuildId: ((buildId: string) => void) | undefined;
    const fetchBuildId = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveBuildId = resolve;
        }),
    );
    const harness = createHarness(fetchBuildId);

    harness.monitor.start();
    harness.monitor.handleOnline();
    harness.monitor.handleVisibilityChange();
    expect(fetchBuildId).toHaveBeenCalledTimes(1);

    resolveBuildId?.("current");
    await harness.monitor.checkNow();
  });

  it("新しい配信を検知したら再読み込みし、確認を終了する", async () => {
    const harness = createHarness(vi.fn(async () => "new"));
    harness.monitor.start();
    await harness.monitor.checkNow();

    expect(harness.reload).toHaveBeenCalledOnce();
    expect(harness.setTimer).not.toHaveBeenCalled();
    await harness.runScheduledCheck();
    expect(harness.fetchBuildId).toHaveBeenCalledTimes(1);
  });
});
