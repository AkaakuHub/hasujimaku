import { createCachedAsyncLoader } from "./createCachedAsyncLoader";

const loadTrustMarkRuntime = createCachedAsyncLoader(() => import("./trustMarkRuntime"));

export const loadTrustMarkDetector = createCachedAsyncLoader(async () => {
  const { detectTrustMark, initializeTrustMarkDecoder } = await loadTrustMarkRuntime();
  await initializeTrustMarkDecoder();
  return detectTrustMark;
});

export const preloadTrustMarkDetectorModel = async (): Promise<void> => {
  const { preloadTrustMarkDecoderModel } = await loadTrustMarkRuntime();
  const modelLoad = preloadTrustMarkDecoderModel();
  void loadTrustMarkDetector().catch(() => undefined);
  await modelLoad;
};
