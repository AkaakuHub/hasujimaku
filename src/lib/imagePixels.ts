export interface ImagePixels {
  height: number;
  pixels: Uint8ClampedArray;
  width: number;
}

const maxAnalysisEdge = 2048;

export const readImagePixels = async (image: Blob): Promise<ImagePixels> => {
  const imageBitmap = await createImageBitmap(image);
  try {
    const scale = Math.min(1, maxAnalysisEdge / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.max(1, Math.round(imageBitmap.width * scale));
    const height = Math.max(1, Math.round(imageBitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("画像を読み込めませんでした。");
    }

    context.drawImage(imageBitmap, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    return { height, pixels: imageData.data, width };
  } finally {
    imageBitmap.close();
  }
};
