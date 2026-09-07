export const trustMarkEncoderSize = 256;
export const trustMarkDecoderSize = 256;

const trustMarkDetectionThreshold = 0.75;

export interface TrustMarkDetection {
  detected: boolean;
  matchRate: number;
}

const createSignature = (): Float32Array => {
  const signature = new Float32Array(100);
  let state = 0x68a5_19d3;

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

const sampleChannel = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
): number => {
  const left = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const top = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const right = Math.min(left + 1, width - 1);
  const bottom = Math.min(top + 1, height - 1);
  const horizontal = x - Math.floor(x);
  const vertical = y - Math.floor(y);
  const topLeft = pixels[(top * width + left) * 4 + channel];
  const topRight = pixels[(top * width + right) * 4 + channel];
  const bottomLeft = pixels[(bottom * width + left) * 4 + channel];
  const bottomRight = pixels[(bottom * width + right) * 4 + channel];

  return (
    (topLeft * (1 - horizontal) + topRight * horizontal) * (1 - vertical) +
    (bottomLeft * (1 - horizontal) + bottomRight * horizontal) * vertical
  );
};

export const createTrustMarkImageTensor = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  targetSize: number,
): Float32Array => {
  const channelSize = targetSize * targetSize;
  const tensor = new Float32Array(channelSize * 3);

  for (let y = 0; y < targetSize; y += 1) {
    const sourceY = ((y + 0.5) * height) / targetSize - 0.5;
    for (let x = 0; x < targetSize; x += 1) {
      const sourceX = ((x + 0.5) * width) / targetSize - 0.5;
      const tensorIndex = y * targetSize + x;
      tensor[tensorIndex] = sampleChannel(pixels, width, height, sourceX, sourceY, 0) / 127.5 - 1;
      tensor[channelSize + tensorIndex] =
        sampleChannel(pixels, width, height, sourceX, sourceY, 1) / 127.5 - 1;
      tensor[channelSize * 2 + tensorIndex] =
        sampleChannel(pixels, width, height, sourceX, sourceY, 2) / 127.5 - 1;
    }
  }

  return tensor;
};

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const sampleResidual = (residual: Float32Array, channel: number, x: number, y: number): number => {
  const size = trustMarkEncoderSize;
  const left = Math.max(0, Math.min(size - 1, Math.floor(x)));
  const top = Math.max(0, Math.min(size - 1, Math.floor(y)));
  const right = Math.min(left + 1, size - 1);
  const bottom = Math.min(top + 1, size - 1);
  const horizontal = x - Math.floor(x);
  const vertical = y - Math.floor(y);
  const channelOffset = channel * size * size;

  return (
    (residual[channelOffset + top * size + left] * (1 - horizontal) +
      residual[channelOffset + top * size + right] * horizontal) *
      (1 - vertical) +
    (residual[channelOffset + bottom * size + left] * (1 - horizontal) +
      residual[channelOffset + bottom * size + right] * horizontal) *
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
  const modelPixelCount = trustMarkEncoderSize * trustMarkEncoderSize;
  const residual = new Float32Array(output.length);
  const channelMeans = new Float32Array(3);

  for (let channel = 0; channel < 3; channel += 1) {
    const channelOffset = channel * modelPixelCount;
    let total = 0;
    for (let index = 0; index < modelPixelCount; index += 1) {
      const tensorIndex = channelOffset + index;
      const difference = Math.max(-1, Math.min(1, output[tensorIndex])) - input[tensorIndex];
      residual[tensorIndex] = difference;
      total += difference;
    }
    channelMeans[channel] = total / modelPixelCount;
  }

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
          (sampleResidual(residual, channel, residualX, residualY) - channelMeans[channel]) *
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
  for (let index = 0; index < decoderOutput.length; index += 1) {
    const decodedBit = Number(decoderOutput[index] >= 0);
    matchingBits += Number(decodedBit === trustMarkSignature[index]);
  }

  const matchRate = matchingBits / trustMarkSignature.length;
  return { detected: matchRate >= trustMarkDetectionThreshold, matchRate };
};
