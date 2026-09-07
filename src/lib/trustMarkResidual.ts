const createBlurWeights = (radius: number, sigma: number): Float32Array => {
  const weights = Float32Array.from({ length: radius * 2 + 1 }, (_, index) =>
    Math.exp(-((index - radius) ** 2) / (2 * sigma ** 2)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
};

const horizontalBlurRadius = 2;
const horizontalBlurWeights = createBlurWeights(horizontalBlurRadius, 0.7);
const verticalBlurRadius = 9;
const verticalBlurWeights = createBlurWeights(verticalBlurRadius, 3.2);

export const createTrustMarkResidual = (
  input: Float32Array,
  output: Float32Array,
  size: number,
): Float32Array => {
  const channelSize = size * size;
  const difference = output.map((value, index) => Math.max(-1, Math.min(1, value)) - input[index]);
  const horizontal = new Float32Array(difference.length);
  const residual = new Float32Array(difference.length);
  const columnMeans = new Float32Array(size);

  for (let channel = 0; channel < 3; channel += 1) {
    const channelOffset = channel * channelSize;
    for (let y = 0; y < size; y += 1) {
      const rowOffset = channelOffset + y * size;
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let tap = 0; tap < horizontalBlurWeights.length; tap += 1) {
          const sourceX = Math.max(0, Math.min(size - 1, x + tap - horizontalBlurRadius));
          value += difference[rowOffset + sourceX] * horizontalBlurWeights[tap];
        }
        horizontal[rowOffset + x] = value;
      }
    }

    for (let y = 0; y < size; y += 1) {
      const rowOffset = channelOffset + y * size;
      let rowMean = 0;
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let tap = 0; tap < verticalBlurWeights.length; tap += 1) {
          const sourceY = Math.max(0, Math.min(size - 1, y + tap - verticalBlurRadius));
          value += horizontal[channelOffset + sourceY * size + x] * verticalBlurWeights[tap];
        }
        residual[rowOffset + x] = value;
        rowMean += value;
      }
      rowMean /= size;
      for (let x = 0; x < size; x += 1) {
        residual[rowOffset + x] -= rowMean;
        columnMeans[x] += residual[rowOffset + x];
      }
    }
    for (let x = 0; x < size; x += 1) {
      columnMeans[x] /= size;
      for (let y = 0; y < size; y += 1) {
        residual[channelOffset + y * size + x] -= columnMeans[x];
      }
    }
    columnMeans.fill(0);
  }
  return residual;
};
