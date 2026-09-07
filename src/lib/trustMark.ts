import { createTrustMarkResidual } from "./trustMarkResidual";
import { createTrustMarkVisibilityMask } from "./trustMarkVisibilityMask";

export const trustMarkEncoderSize = 256;
export const trustMarkDecoderSize = 256;

const trustMarkDetectionThreshold = 0.75;
const trustMarkPairDetectionThreshold = 0.82;

export interface TrustMarkDetection {
  detected: boolean;
  matchRate: number;
}

const createSignature = (): Float32Array => {
  const signature = new Float32Array(100);
  let state = 0xcacb_2b13;

  for (let index = 0; index < signature.length; index += 2) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const bit = state & 1;
    signature[index] = bit;
    signature[index + 1] = 1 - bit;
  }

  return signature;
};

export const trustMarkSignature = createSignature();

const watermarkStrength = 0.8;

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const samplePlane = (values: Float32Array, offset: number, x: number, y: number): number => {
  const size = trustMarkEncoderSize;
  const sourceX = Math.max(0, Math.min(size - 1, x));
  const sourceY = Math.max(0, Math.min(size - 1, y));
  const left = Math.floor(sourceX);
  const top = Math.floor(sourceY);
  const right = Math.min(left + 1, size - 1);
  const bottom = Math.min(top + 1, size - 1);
  const horizontal = sourceX - left;
  const vertical = sourceY - top;

  return (
    (values[offset + top * size + left] * (1 - horizontal) +
      values[offset + top * size + right] * horizontal) *
      (1 - vertical) +
    (values[offset + bottom * size + left] * (1 - horizontal) +
      values[offset + bottom * size + right] * horizontal) *
      vertical
  );
};

export const applyTrustMarkOutput = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  input: Float32Array,
  output: Float32Array,
): void => {
  const modelPlaneSize = trustMarkEncoderSize * trustMarkEncoderSize;
  const residual = createTrustMarkResidual(input, output, trustMarkEncoderSize);
  const visibilityMask = createTrustMarkVisibilityMask(input, trustMarkEncoderSize);

  const featherSize = Math.max(1, Math.min(50, Math.floor(Math.min(width, height) * 0.01)));

  for (let y = 0; y < height; y += 1) {
    const residualY = ((y + 0.5) * trustMarkEncoderSize) / height - 0.5;
    for (let x = 0; x < width; x += 1) {
      const residualX = ((x + 0.5) * trustMarkEncoderSize) / width - 0.5;
      const edgeDistance = Math.min(x + 1, y + 1, width - x, height - y);
      const feather = Math.min(1, edgeDistance / featherSize);
      const pixelIndex = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const adjustment =
          samplePlane(residual, channel * modelPlaneSize, residualX, residualY) *
          samplePlane(visibilityMask, 0, residualX, residualY) *
          watermarkStrength *
          127.5 *
          feather;
        pixels[pixelIndex + channel] = clampByte(pixels[pixelIndex + channel] + adjustment);
      }
    }
  }
};

export const getTrustMarkDetection = (decoderOutput: Float32Array): TrustMarkDetection => {
  if (decoderOutput.length !== trustMarkSignature.length) {
    throw new Error("透かしの検証結果が不正です。");
  }

  let matchingBits = 0;
  let matchingPairs = 0;
  for (let index = 0; index < decoderOutput.length; index += 1) {
    const decodedBit = Number(decoderOutput[index] >= 0);
    matchingBits += Number(decodedBit === trustMarkSignature[index]);
  }
  for (let index = 0; index < decoderOutput.length; index += 2) {
    const decodedFirstBit = Number(decoderOutput[index] >= decoderOutput[index + 1]);
    matchingPairs += Number(decodedFirstBit === trustMarkSignature[index]);
  }

  const matchRate = matchingBits / trustMarkSignature.length;
  const pairMatchRate = matchingPairs / (trustMarkSignature.length / 2);
  return {
    detected:
      matchRate >= trustMarkDetectionThreshold || pairMatchRate >= trustMarkPairDetectionThreshold,
    matchRate,
  };
};
