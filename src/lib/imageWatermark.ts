import {
  applyWatermarkCoefficient,
  readWatermarkCoefficient,
  watermarkBlockSize,
} from "./watermark/dctBlock";
import { getWatermarkAdjustment, getWatermarkCorrelation } from "./watermark/quantization";

export interface WatermarkDetection {
  detected: boolean;
  matchRate: number;
}

const minimumBlockCount = 128;
const minimumMeanCorrelation = 0.08;
const minimumCorrelationScore = 8;

const validateImage = (pixels: Uint8ClampedArray, width: number, height: number): void => {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    pixels.length !== width * height * 4
  ) {
    throw new Error("透かしを処理する画像のサイズが不正です。");
  }
};

export const embedImageWatermark = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void => {
  validateImage(pixels, width, height);
  const blocks: { left: number; top: number; adjustment: number }[] = [];

  for (let top = 0; top + watermarkBlockSize <= height; top += watermarkBlockSize) {
    for (let left = 0; left + watermarkBlockSize <= width; left += watermarkBlockSize) {
      const coefficient = readWatermarkCoefficient(pixels, width, left, top);
      if (coefficient !== null) {
        blocks.push({
          left,
          top,
          adjustment: getWatermarkAdjustment(
            coefficient,
            left / watermarkBlockSize,
            top / watermarkBlockSize,
          ),
        });
      }
    }
  }

  if (blocks.length < minimumBlockCount) {
    throw new Error("画像の輪郭や模様が少ないため、透かしを埋め込めませんでした。");
  }
  for (const { left, top, adjustment } of blocks) {
    applyWatermarkCoefficient(pixels, width, left, top, adjustment);
  }
};

export const detectImageWatermark = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): WatermarkDetection => {
  validateImage(pixels, width, height);
  let correlationSum = 0;
  let matchingBlocks = 0;
  let blockCount = 0;

  for (let top = 0; top + watermarkBlockSize <= height; top += watermarkBlockSize) {
    for (let left = 0; left + watermarkBlockSize <= width; left += watermarkBlockSize) {
      const coefficient = readWatermarkCoefficient(pixels, width, left, top);
      if (coefficient === null) {
        continue;
      }
      const correlation = getWatermarkCorrelation(
        coefficient,
        left / watermarkBlockSize,
        top / watermarkBlockSize,
      );
      correlationSum += correlation;
      matchingBlocks += Number(correlation > 0);
      blockCount += 1;
    }
  }

  const sampleCount = Math.max(1, blockCount);
  const meanCorrelation = correlationSum / sampleCount;
  const correlationScore = correlationSum / Math.sqrt(sampleCount / 2);
  return {
    detected:
      blockCount >= minimumBlockCount &&
      meanCorrelation >= minimumMeanCorrelation &&
      correlationScore >= minimumCorrelationScore,
    matchRate: matchingBlocks / sampleCount,
  };
};
