import type { ImagePixels } from "./imagePixels";
import type { TrustMarkDetection } from "./trustMark";

export type DetectTrustMark = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) => Promise<TrustMarkDetection>;

export type LoadTrustMarkDetector = () => Promise<DetectTrustMark>;

export type ReadImagePixels = (image: Blob) => Promise<ImagePixels>;

export interface WatermarkVerificationResult extends TrustMarkDetection {
  fileName: string;
}

export const verifyWatermark = async (
  image: Blob & { name: string },
  readImagePixels: ReadImagePixels,
  loadTrustMarkDetector: LoadTrustMarkDetector,
): Promise<WatermarkVerificationResult> => {
  const { height, pixels, width } = await readImagePixels(image);
  const detectTrustMark = await loadTrustMarkDetector();

  return { ...(await detectTrustMark(pixels, width, height)), fileName: image.name };
};
