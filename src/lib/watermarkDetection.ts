import type { TrustMarkDetection } from "./trustMark";

type DetectAdobeWatermark = () => Promise<TrustMarkDetection>;
type DetectLegacyWatermark = () => Promise<boolean>;

export const detectWatermarkWithLegacyFallback = async (
  detectAdobeWatermark: DetectAdobeWatermark,
  detectLegacyWatermark: DetectLegacyWatermark,
): Promise<TrustMarkDetection> => {
  const adobeDetection = await detectAdobeWatermark();
  if (adobeDetection.detected) {
    return adobeDetection;
  }

  return {
    ...adobeDetection,
    detected: await detectLegacyWatermark(),
  };
};
