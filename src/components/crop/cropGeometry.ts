export interface Size {
  height: number;
  width: number;
}

interface Point {
  x: number;
  y: number;
}

export const getRadianAngle = (degreeValue: number): number => (degreeValue * Math.PI) / 180;

export const getRotatedSize = (width: number, height: number, rotation: number): Size => {
  const rotationRadians = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotationRadians) * width) + Math.abs(Math.sin(rotationRadians) * height),
    height:
      Math.abs(Math.sin(rotationRadians) * width) + Math.abs(Math.cos(rotationRadians) * height),
  };
};

export const getCropDrawOffset = (
  imageSize: Size,
  cropPosition: Point,
  rotation: number,
): Point => {
  const rotatedImageSize = getRotatedSize(imageSize.width, imageSize.height, rotation);

  return {
    x: rotatedImageSize.width / 2 - cropPosition.x,
    y: rotatedImageSize.height / 2 - cropPosition.y,
  };
};

export const getMinimumZoom = (
  mediaSize: Size | null,
  cropSize: Size | null,
  rotation: number,
): number => {
  if (!mediaSize || !cropSize) {
    return 1;
  }

  const rotationRadians = getRadianAngle(rotation);
  const cosine = Math.abs(Math.cos(rotationRadians));
  const sine = Math.abs(Math.sin(rotationRadians));

  return Math.max(
    (cosine * cropSize.width + sine * cropSize.height) / mediaSize.width,
    (sine * cropSize.width + cosine * cropSize.height) / mediaSize.height,
  );
};
