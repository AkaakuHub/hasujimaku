export const createWatermarkTestImage = (
  width: number,
  height: number,
  variant = 0,
): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const contour = Math.sin((x + variant * 13) / 19 + Math.sin(y / 31) * 3);
      const bands = Math.sin(y / 11 + x / 43 + variant);
      const detail = 18 * Math.sin(x / 2.3 + y / 3.1);
      const isFlat = x < width / 4;
      pixels[index] = isFlat ? 230 : 155 + 65 * contour + detail;
      pixels[index + 1] = isFlat ? 210 : 145 + 60 * bands + detail;
      pixels[index + 2] = isFlat ? 190 : 140 + 50 * contour * bands + detail;
      pixels[index + 3] = 255;
    }
  }
  return pixels;
};
