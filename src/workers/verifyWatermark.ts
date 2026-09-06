import { createCachedAsyncLoader } from "../lib/createCachedAsyncLoader";
import { detectLegacyWatermark } from "../lib/legacyWatermark";
import {
  detectTrustMark,
  initializeTrustMarkDecoder,
  preloadTrustMarkDecoderModel,
} from "../lib/trustMarkRuntime";
import { initializeLegacyWatermarkDetector } from "./legacyWatermarkRuntime";

const maxAnalysisEdge = 2048;

export const initializeWatermarkVerifier = createCachedAsyncLoader(async () => {
  const modelLoad = preloadTrustMarkDecoderModel();
  void initializeTrustMarkDecoder().catch(() => undefined);
  await Promise.all([modelLoad, initializeLegacyWatermarkDetector()]);
});

export const verifyWatermark = async (image: Blob) => {
  const imageBitmap = await createImageBitmap(image);
  try {
    const scale = Math.min(1, maxAnalysisEdge / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.max(1, Math.round(imageBitmap.width * scale));
    const height = Math.max(1, Math.round(imageBitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("画像を読み込めませんでした。");
    }

    context.drawImage(imageBitmap, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const legacyWatermarkTemplates = await initializeLegacyWatermarkDetector();
    if (detectLegacyWatermark(pixels, width, height, legacyWatermarkTemplates)) {
      return { detected: true, matchRate: 0 };
    }
    return detectTrustMark(pixels, width, height);
  } finally {
    imageBitmap.close();
  }
};
