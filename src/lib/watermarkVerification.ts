import type { WatermarkDetection } from "./imageWatermark";

export type VerifyWatermarkImage = (image: Blob) => Promise<WatermarkDetection>;

export interface WatermarkVerificationResult extends WatermarkDetection {
  fileName: string;
}

export const verifyWatermark = async (
  image: Blob & { name: string },
  verifyWatermarkImage: VerifyWatermarkImage,
): Promise<WatermarkVerificationResult> => {
  return { ...(await verifyWatermarkImage(image)), fileName: image.name };
};
