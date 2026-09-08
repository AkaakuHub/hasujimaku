import { detectImageWatermark, type WatermarkDetection } from "../lib/imageWatermark";

export const verifyWatermark = async (image: Blob): Promise<WatermarkDetection> => {
  const imageBitmap = await createImageBitmap(image);
  try {
    const { width, height } = imageBitmap;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("画像を読み込めませんでした。");
    }

    context.drawImage(imageBitmap, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;
    return detectImageWatermark(pixels, width, height);
  } finally {
    imageBitmap.close();
  }
};
