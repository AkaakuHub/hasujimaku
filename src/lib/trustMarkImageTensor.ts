interface ResamplingWeights {
  start: number;
  values: Float32Array;
}

const createResamplingWeights = (sourceSize: number, targetSize: number): ResamplingWeights[] => {
  const scale = sourceSize / targetSize;
  const radius = Math.max(1, scale);

  return Array.from({ length: targetSize }, (_, index) => {
    const center = (index + 0.5) * scale;
    const start = Math.max(0, Math.ceil(center - radius - 0.5));
    const end = Math.min(sourceSize - 1, Math.floor(center + radius - 0.5));
    const values = new Float32Array(end - start + 1);
    let total = 0;

    for (let offset = 0; offset < values.length; offset += 1) {
      const weight = Math.max(0, 1 - Math.abs(start + offset + 0.5 - center) / radius);
      values[offset] = weight;
      total += weight;
    }
    for (let offset = 0; offset < values.length; offset += 1) {
      values[offset] /= total;
    }
    return { start, values };
  });
};

export const createTrustMarkImageTensor = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  targetSize: number,
): Float32Array => {
  const horizontalWeights = createResamplingWeights(width, targetSize);
  const verticalWeights = createResamplingWeights(height, targetSize);
  const horizontal = new Float32Array(height * targetSize * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const { start, values } = horizontalWeights[x];
      const targetOffset = (y * targetSize + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        let value = 0;
        for (let offset = 0; offset < values.length; offset += 1) {
          value += pixels[(y * width + start + offset) * 4 + channel] * values[offset];
        }
        horizontal[targetOffset + channel] = value;
      }
    }
  }

  const channelSize = targetSize * targetSize;
  const tensor = new Float32Array(channelSize * 3);
  for (let y = 0; y < targetSize; y += 1) {
    const { start, values } = verticalWeights[y];
    for (let x = 0; x < targetSize; x += 1) {
      for (let channel = 0; channel < 3; channel += 1) {
        let value = 0;
        for (let offset = 0; offset < values.length; offset += 1) {
          value += horizontal[((start + offset) * targetSize + x) * 3 + channel] * values[offset];
        }
        tensor[channel * channelSize + y * targetSize + x] = value / 127.5 - 1;
      }
    }
  }
  return tensor;
};
