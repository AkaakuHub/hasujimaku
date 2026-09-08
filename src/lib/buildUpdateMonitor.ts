const checkIntervalMilliseconds = 60_000;

interface BuildVersion {
  buildId: string;
}

const fetchCurrentBuildId = async (): Promise<string> => {
  const response = await fetch(`/version.json?checkedAt=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("配信バージョンを確認できませんでした。");
  }
  const version: BuildVersion = await response.json();
  return version.buildId;
};

const reloadWhenBuildChanges = async (): Promise<void> => {
  if ((await fetchCurrentBuildId()) !== __BUILD_ID__) {
    window.location.reload();
  }
};

export const startBuildUpdateMonitor = (): void => {
  const checkForUpdate = (): void => {
    void reloadWhenBuildChanges().catch(() => undefined);
  };

  window.setInterval(checkForUpdate, checkIntervalMilliseconds);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForUpdate();
    }
  });
};
