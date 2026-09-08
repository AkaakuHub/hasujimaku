import { createBuildUpdateMonitor } from "./buildUpdateMonitor";

const fetchCurrentBuildId = async (): Promise<string> => {
  const response = await fetch("/version.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("配信バージョンを確認できませんでした。");
  }
  const version: unknown = await response.json();
  if (
    typeof version !== "object" ||
    version === null ||
    !("buildId" in version) ||
    typeof version.buildId !== "string"
  ) {
    throw new Error("配信バージョンが不正です。");
  }
  return version.buildId;
};

export const startBuildUpdateMonitor = (): (() => void) => {
  const monitor = createBuildUpdateMonitor({
    currentBuildId: __BUILD_ID__,
    fetchBuildId: fetchCurrentBuildId,
    isVisible: () => document.visibilityState === "visible",
    reload: () => window.location.reload(),
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: (timer) => window.clearTimeout(timer),
  });
  const handlePageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      void monitor.checkNow();
    }
  };

  document.addEventListener("visibilitychange", monitor.handleVisibilityChange);
  window.addEventListener("online", monitor.handleOnline);
  window.addEventListener("pageshow", handlePageShow);
  monitor.start();

  return () => {
    monitor.stop();
    document.removeEventListener("visibilitychange", monitor.handleVisibilityChange);
    window.removeEventListener("online", monitor.handleOnline);
    window.removeEventListener("pageshow", handlePageShow);
  };
};
