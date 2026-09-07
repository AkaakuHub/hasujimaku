const luminanceRed = 0.2126;
const luminanceGreen = 0.7152;
const luminanceBlue = 0.0722;
const luminanceReduction = 0.25;
const blurSigma = 1;
const blurRadius = Math.ceil(blurSigma * 3);

const blurWeights = Float32Array.from({ length: blurRadius * 2 + 1 }, (_, index) =>
  Math.exp(-((index - blurRadius) ** 2) / (2 * blurSigma ** 2)),
);
const blurWeightTotal = blurWeights.reduce((total, weight) => total + weight, 0);
for (let index = 0; index < blurWeights.length; index += 1) {
  blurWeights[index] /= blurWeightTotal;
}

const blurResidual = (residual: Float32Array, size: number): Float32Array => {
  const channelSize = size * size;
  const horizontal = new Float32Array(residual.length);
  const blurred = new Float32Array(residual.length);

  for (let channel = 0; channel < 3; channel += 1) {
    const channelOffset = channel * channelSize;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let weightIndex = 0; weightIndex < blurWeights.length; weightIndex += 1) {
          const sourceX = Math.max(0, Math.min(size - 1, x + weightIndex - blurRadius));
          value += residual[channelOffset + y * size + sourceX] * blurWeights[weightIndex];
        }
        horizontal[channelOffset + y * size + x] = value;
      }
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let value = 0;
        for (let weightIndex = 0; weightIndex < blurWeights.length; weightIndex += 1) {
          const sourceY = Math.max(0, Math.min(size - 1, y + weightIndex - blurRadius));
          value += horizontal[channelOffset + sourceY * size + x] * blurWeights[weightIndex];
        }
        blurred[channelOffset + y * size + x] = value;
      }
    }
  }

  return blurred;
};

export const createTrustMarkResidual = (
  input: Float32Array,
  output: Float32Array,
  size: number,
): Float32Array => {
  const channelSize = size * size;
  const residual = output.map((value, index) => Math.max(-1, Math.min(1, value)) - input[index]);

  for (let index = 0; index < channelSize; index += 1) {
    const luminance =
      residual[index] * luminanceRed +
      residual[channelSize + index] * luminanceGreen +
      residual[channelSize * 2 + index] * luminanceBlue;
    for (let channel = 0; channel < 3; channel += 1) {
      residual[channel * channelSize + index] -= luminance * luminanceReduction;
    }
  }
  return blurResidual(residual, size);
};
