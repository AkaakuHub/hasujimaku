import type { TrustMarkDetection } from "./trustMark";

export type VerifyWatermarkImage = (image: Blob) => Promise<TrustMarkDetection>;

export interface WatermarkVerificationResult extends TrustMarkDetection {
  fileName: string;
}

export const verifyWatermark = async (
  image: Blob & { name: string },
  verifyWatermarkImage: VerifyWatermarkImage,
): Promise<WatermarkVerificationResult> => {
  return { ...(await verifyWatermarkImage(image)), fileName: image.name };
};
