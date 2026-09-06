const getPixelLuminance = (pixels: Uint8ClampedArray, pixelIndex: number): number =>
  pixels[pixelIndex] * 0.2126 + pixels[pixelIndex + 1] * 0.7152 + pixels[pixelIndex + 2] * 0.0722;

export const createImageLuminance = (pixels: Uint8ClampedArray): Float32Array => {
  const luminance = new Float32Array(pixels.length / 4);
  for (let index = 0; index < luminance.length; index += 1) {
    luminance[index] = getPixelLuminance(pixels, index * 4);
  }
  return luminance;
};

const sampleLuminance = (
  luminance: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number => {
  const left = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const top = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const right = Math.min(width - 1, left + 1);
  const bottom = Math.min(height - 1, top + 1);
  const horizontal = x - Math.floor(x);
  const vertical = y - Math.floor(y);

  return (
    (luminance[top * width + left] * (1 - horizontal) +
      luminance[top * width + right] * horizontal) *
      (1 - vertical) +
    (luminance[bottom * width + left] * (1 - horizontal) +
      luminance[bottom * width + right] * horizontal) *
      vertical
  );
};

export const normalizeLuminanceRegion = (
  luminance: Float32Array,
  imageWidth: number,
  imageHeight: number,
  left: number,
  top: number,
  regionWidth: number,
  regionHeight: number,
  targetWidth: number,
  targetHeight: number,
): Float32Array => {
  const normalized = new Float32Array(targetWidth * targetHeight);
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = top + ((y + 0.5) * regionHeight) / targetHeight - 0.5;
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = left + ((x + 0.5) * regionWidth) / targetWidth - 0.5;
      normalized[y * targetWidth + x] = sampleLuminance(
        luminance,
        imageWidth,
        imageHeight,
        sourceX,
        sourceY,
      );
    }
  }
  return normalized;
};

export const blurLuminance = (
  luminance: Float32Array,
  width: number,
  height: number,
): Float32Array => {
  const horizontal = new Float32Array(luminance.length);
  const blurred = new Float32Array(luminance.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const left = y * width + Math.max(0, x - 1);
      const right = y * width + Math.min(width - 1, x + 1);
      horizontal[index] = (luminance[left] + luminance[index] * 2 + luminance[right]) / 4;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const top = Math.max(0, y - 1) * width + x;
      const bottom = Math.min(height - 1, y + 1) * width + x;
      blurred[index] = (horizontal[top] + horizontal[index] * 2 + horizontal[bottom]) / 4;
    }
  }
  return blurred;
};

export const getGradientCorrelation = (
  image: Float32Array,
  template: Float32Array,
  width: number,
  height: number,
  minimumTemplateGradient: number,
): number => {
  let dotProduct = 0;
  let imageMagnitude = 0;
  let templateMagnitude = 0;
  let comparedEdges = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const templateHorizontal = template[index + 1] - template[index - 1];
      const templateVertical = template[index + width] - template[index - width];
      if (Math.hypot(templateHorizontal, templateVertical) < minimumTemplateGradient) {
        continue;
      }

      const imageHorizontal = image[index + 1] - image[index - 1];
      const imageVertical = image[index + width] - image[index - width];
      dotProduct += templateHorizontal * imageHorizontal + templateVertical * imageVertical;
      templateMagnitude += templateHorizontal ** 2 + templateVertical ** 2;
      imageMagnitude += imageHorizontal ** 2 + imageVertical ** 2;
      comparedEdges += 1;
    }
  }

  if (comparedEdges < width || imageMagnitude === 0 || templateMagnitude === 0) {
    return 0;
  }
  return dotProduct / Math.sqrt(templateMagnitude * imageMagnitude);
};
