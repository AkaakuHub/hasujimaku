import { createCachedAsyncLoader } from "../lib/createCachedAsyncLoader";
import { detectLegacyWatermark } from "../lib/legacyWatermark";
import { detectWatermarkWithLegacyFallback } from "../lib/watermarkDetection";
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
  await modelLoad;
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
    return detectWatermarkWithLegacyFallback(
      () => detectTrustMark(pixels, width, height),
      async () => {
        const legacyWatermarkTemplates = await initializeLegacyWatermarkDetector();
        return detectLegacyWatermark(pixels, width, height, legacyWatermarkTemplates);
      },
    );
  } finally {
    imageBitmap.close();
  }
};
