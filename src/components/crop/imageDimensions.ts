export interface ImageDimensions {
  height: number;
  width: number;
}

const MAX_IMAGE_LONG_EDGE = 2560;

export const getResizedImageDimensions = ({ width, height }: ImageDimensions): ImageDimensions => {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_IMAGE_LONG_EDGE) {
    return { width, height };
  }

  const scale = MAX_IMAGE_LONG_EDGE / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};
