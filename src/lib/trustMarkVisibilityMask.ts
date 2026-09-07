const maskFloor = 0.2;
const maskCeiling = 1.5;
const contrastReference = 6;
const contrastRadius = 2;

export const createTrustMarkVisibilityMask = (input: Float32Array, size: number): Float32Array => {
  const channelSize = size * size;
  const luminance = new Float32Array(channelSize);
  const mask = new Float32Array(channelSize);

  for (let index = 0; index < channelSize; index += 1) {
    luminance[index] =
      (input[index] * 0.2126 +
        input[channelSize + index] * 0.7152 +
        input[channelSize * 2 + index] * 0.0722 +
        1) *
      127.5;
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0;
      let squaredSum = 0;
      let sampleCount = 0;
      for (let offsetY = -contrastRadius; offsetY <= contrastRadius; offsetY += 1) {
        const sourceY = Math.max(0, Math.min(size - 1, y + offsetY));
        for (let offsetX = -contrastRadius; offsetX <= contrastRadius; offsetX += 1) {
          const sourceX = Math.max(0, Math.min(size - 1, x + offsetX));
          const value = luminance[sourceY * size + sourceX];
          sum += value;
          squaredSum += value * value;
          sampleCount += 1;
        }
      }
      const mean = sum / sampleCount;
      const standardDeviation = Math.sqrt(Math.max(0, squaredSum / sampleCount - mean * mean));
      mask[y * size + x] = Math.min(maskCeiling, maskFloor + standardDeviation / contrastReference);
    }
  }

  return mask;
};
