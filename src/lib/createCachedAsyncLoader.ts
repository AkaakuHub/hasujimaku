interface CachedAsyncLoader<Value> {
  (): Promise<Value>;
  clear: () => void;
}

export const createCachedAsyncLoader = <Value>(
  load: () => Promise<Value>,
): CachedAsyncLoader<Value> => {
  let cachedPromise: Promise<Value> | undefined;

  const loadCached = () => {
    if (!cachedPromise) {
      cachedPromise = load().catch((error: unknown) => {
        cachedPromise = undefined;
        throw error;
      });
    }

    return cachedPromise;
  };

  loadCached.clear = () => {
    cachedPromise = undefined;
  };

  return loadCached;
};
