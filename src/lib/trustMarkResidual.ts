const luminanceRed = 0.2126;
const luminanceGreen = 0.7152;
const luminanceBlue = 0.0722;
const luminanceReduction = 0.25;

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
  return residual;
};
