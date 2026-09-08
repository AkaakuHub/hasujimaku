export const watermarkBlockSize = 8;
const blockPixelCount = watermarkBlockSize ** 2;
const minimumTextureVariance = 12 ** 2;

// 正規直交DCTの(1,2)と(2,1)の差を使い、DC成分を変更しない。
const watermarkBasis = Float64Array.from({ length: blockPixelCount }, (_, index) => {
  const x = (((index % watermarkBlockSize) + 0.5) * Math.PI) / watermarkBlockSize;
  const y = ((Math.floor(index / watermarkBlockSize) + 0.5) * Math.PI) / watermarkBlockSize;
  return (Math.cos(x) * Math.cos(2 * y) - Math.cos(2 * x) * Math.cos(y)) / (4 * Math.SQRT2);
});

export const readWatermarkCoefficient = (
  pixels: Uint8ClampedArray,
  width: number,
  left: number,
  top: number,
): number | null => {
  let sum = 0;
  let squaredSum = 0;
  let coefficient = 0;

  for (let y = 0; y < watermarkBlockSize; y += 1) {
    for (let x = 0; x < watermarkBlockSize; x += 1) {
      const index = ((top + y) * width + left + x) * 4;
      if (pixels[index + 3] !== 255) {
        return null;
      }
      const luminance =
        pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
      sum += luminance;
      squaredSum += luminance ** 2;
      coefficient += luminance * watermarkBasis[y * watermarkBlockSize + x];
    }
  }

  // 埋め込み成分を除いた分散で選別し、生成側と検出側の選別条件を揃える。
  const textureVariance =
    (squaredSum - sum ** 2 / blockPixelCount - coefficient ** 2) / blockPixelCount;
  return textureVariance >= minimumTextureVariance ? coefficient : null;
};

export const applyWatermarkCoefficient = (
  pixels: Uint8ClampedArray,
  width: number,
  left: number,
  top: number,
  adjustment: number,
): void => {
  for (let y = 0; y < watermarkBlockSize; y += 1) {
    for (let x = 0; x < watermarkBlockSize; x += 1) {
      const index = ((top + y) * width + left + x) * 4;
      const luminanceAdjustment = adjustment * watermarkBasis[y * watermarkBlockSize + x];
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[index + channel] = Math.round(pixels[index + channel] + luminanceAdjustment);
      }
    }
  }
};
