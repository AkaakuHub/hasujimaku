import { getCanvasSize, getSubtitleLayout } from "../components/imageCanvas/renderLayout";
import { createCachedAsyncLoader } from "../lib/createCachedAsyncLoader";
import type { ImageRenderInput } from "../lib/imageProcessorMessages";
import { embedTrustMark, initializeTrustMarkEncoder } from "../lib/trustMarkRuntime";
import { createSvgRenderer, initializeSvgRenderer } from "./svgRenderer";

export const initializeImageRenderer = createCachedAsyncLoader(async () => {
  await Promise.all([initializeSvgRenderer(), initializeTrustMarkEncoder()]);
});

const escapeXmlAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

const escapeXmlText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const createText = (
  text: string,
  y: number,
  fontSize: number,
  letterSpacing: number,
  textX: number,
  strokeWidth: number,
): string =>
  `<text x="${textX}" y="${y}" fill="#e6e6e6" stroke="#121311" stroke-width="${strokeWidth}" paint-order="stroke fill" text-anchor="middle" font-family="Klee One" font-size="${fontSize}" letter-spacing="${letterSpacing}">${escapeXmlText(text)}</text>`;

interface ImageSize {
  height: number;
  width: number;
}

const getImageSize = async (baseImageBase64: string): Promise<ImageSize> => {
  const response = await fetch(baseImageBase64);
  const imageBitmap = await createImageBitmap(await response.blob());
  const imageSize = { width: imageBitmap.width, height: imageBitmap.height };
  imageBitmap.close();

  return imageSize;
};

const createSubtitleSvg = async ({
  baseImageBase64,
  name,
  quote,
}: ImageRenderInput): Promise<string> => {
  const imageSize = await getImageSize(baseImageBase64);
  const { width: canvasWidth, height: canvasHeight } = getCanvasSize(
    imageSize.width,
    imageSize.height,
  );
  const quoteLines = quote.split("\n");
  const subtitleLayout = getSubtitleLayout(canvasWidth, canvasHeight, quoteLines.length);
  const textX = canvasWidth / 2;

  const quoteText = quoteLines
    .map((line, index) =>
      createText(
        line,
        subtitleLayout.quoteYPositions[index],
        subtitleLayout.quoteFontSize,
        subtitleLayout.quoteLetterSpacing,
        textX,
        subtitleLayout.strokeWidth,
      ),
    )
    .join("");
  const nameText = createText(
    `[${name}]`,
    subtitleLayout.nameY,
    subtitleLayout.nameFontSize,
    0,
    textX,
    subtitleLayout.strokeWidth,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}"><image href="${escapeXmlAttribute(baseImageBase64)}" width="${canvasWidth}" height="${canvasHeight}"/>${quoteText}${nameText}</svg>`;
};

export const renderImage = async (input: ImageRenderInput): Promise<ArrayBuffer> => {
  await initializeImageRenderer();
  const renderer = await createSvgRenderer(await createSubtitleSvg(input));

  try {
    const image = renderer.render();
    try {
      const pixels = new Uint8ClampedArray(image.pixels);
      await embedTrustMark(pixels, image.width, image.height);
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("画像を生成できませんでした。");
      }
      context.putImageData(new ImageData(pixels, image.width, image.height), 0, 0);
      return (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer();
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
};
