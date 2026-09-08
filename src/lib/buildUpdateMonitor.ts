const checkIntervalMilliseconds = 5 * 60_000;

interface BuildUpdateMonitorOptions {
  currentBuildId: string;
  fetchBuildId: () => Promise<string>;
  isVisible: () => boolean;
  reload: () => void;
  setTimer: (callback: () => void, delay: number) => number;
  clearTimer: (timer: number) => void;
}

interface BuildUpdateMonitor {
  checkNow: () => Promise<void>;
  handleOnline: () => void;
  handleVisibilityChange: () => void;
  start: () => void;
  stop: () => void;
}

export const createBuildUpdateMonitor = ({
  currentBuildId,
  fetchBuildId,
  isVisible,
  reload,
  setTimer,
  clearTimer,
}: BuildUpdateMonitorOptions): BuildUpdateMonitor => {
  let scheduledCheck: number | undefined;
  let currentCheck: Promise<void> | undefined;
  let stopped = false;
  let updateDetected = false;

  const cancelScheduledCheck = (): void => {
    if (scheduledCheck !== undefined) {
      clearTimer(scheduledCheck);
      scheduledCheck = undefined;
    }
  };

  const scheduleNextCheck = (): void => {
    cancelScheduledCheck();
    if (stopped || updateDetected || !isVisible()) {
      return;
    }
    scheduledCheck = setTimer(() => {
      scheduledCheck = undefined;
      void checkNow();
    }, checkIntervalMilliseconds);
  };

  const checkNow = (): Promise<void> => {
    if (stopped || updateDetected || !isVisible()) {
      scheduleNextCheck();
      return Promise.resolve();
    }
    if (currentCheck) {
      return currentCheck;
    }

    currentCheck = fetchBuildId()
      .then((buildId) => {
        if (buildId !== currentBuildId) {
          updateDetected = true;
          cancelScheduledCheck();
          reload();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        currentCheck = undefined;
        scheduleNextCheck();
      });
    return currentCheck;
  };

  return {
    checkNow,
    handleOnline: () => {
      void checkNow();
    },
    handleVisibilityChange: () => {
      if (isVisible()) {
        void checkNow();
      } else {
        cancelScheduledCheck();
      }
    },
    start: () => {
      void checkNow();
    },
    stop: () => {
      stopped = true;
      cancelScheduledCheck();
    },
  };
};
