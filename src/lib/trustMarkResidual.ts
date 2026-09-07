const blurRadius = 2;
const blurSigma = 0.7;
const blurWeights = Float32Array.from({ length: blurRadius * 2 + 1 }, (_, index) =>
  Math.exp(-((index - blurRadius) ** 2) / (2 * blurSigma ** 2)),
);
const weightTotal = blurWeights.reduce((total, weight) => total + weight, 0);
for (let index = 0; index < blurWeights.length; index += 1) {
  blurWeights[index] /= weightTotal;
}

export const createTrustMarkResidual = (
  input: Float32Array,
  output: Float32Array,
  size: number,
): Float32Array => {
  const channelSize = size * size;
  const difference = output.map((value, index) => Math.max(-1, Math.min(1, value)) - input[index]);
  const horizontal = new Float32Array(difference.length);
  const residual = new Float32Array(difference.length);

  for (let channel = 0; channel < 3; channel += 1) {
    const channelOffset = channel * channelSize;
    for (let y = 0; y < size; y += 1) {
      const rowOffset = channelOffset + y * size;
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let tap = 0; tap < blurWeights.length; tap += 1) {
          const sourceX = Math.max(0, Math.min(size - 1, x + tap - blurRadius));
          value += difference[rowOffset + sourceX] * blurWeights[tap];
        }
        horizontal[rowOffset + x] = value;
      }
    }

    for (let y = 0; y < size; y += 1) {
      const rowOffset = channelOffset + y * size;
      let rowMean = 0;
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let tap = 0; tap < blurWeights.length; tap += 1) {
          const sourceY = Math.max(0, Math.min(size - 1, y + tap - blurRadius));
          value += horizontal[channelOffset + sourceY * size + x] * blurWeights[tap];
        }
        residual[rowOffset + x] = value;
        rowMean += value;
      }
      rowMean /= size;
      for (let x = 0; x < size; x += 1) {
        residual[rowOffset + x] -= rowMean;
      }
    }
  }
  return residual;
};
