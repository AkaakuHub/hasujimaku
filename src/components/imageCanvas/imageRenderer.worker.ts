/// <reference lib="webworker" />

import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmUrl from "@resvg/resvg-wasm/index_bg.wasm?url";

import { loadKleeOneFontBuffer } from "../../lib/kleeOneFont";
import { getCanvasSize, getSubtitleLayout } from "./renderLayout";

interface ImageRenderInput {
  baseImageBase64: string;
  name: string;
  quote: string;
}

interface ImageRenderRequest {
  input: ImageRenderInput;
  requestId: number;
  type: "render";
}

interface ImageRendererInitializeRequest {
  type: "initialize";
}

type ImageRenderWorkerRequest = ImageRenderRequest | ImageRendererInitializeRequest;

let resvgPromise: Promise<void> | undefined;

const initializeResvg = (): Promise<void> => {
  if (!resvgPromise) {
    resvgPromise = initWasm(fetch(resvgWasmUrl));
  }

  return resvgPromise;
};

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
  textAnchor: "middle" | "start" = "middle",
  opacity = 1,
): string =>
  `<text x="${textX}" y="${y}" opacity="${opacity}" fill="#e6e6e6" stroke="#121311" stroke-width="${strokeWidth}" paint-order="stroke fill" text-anchor="${textAnchor}" font-family="Klee One" font-size="${fontSize}" letter-spacing="${letterSpacing}">${escapeXmlText(text)}</text>`;

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
  const watermarkText = createText(
    "#活動記録字幕ジェネレーター",
    subtitleLayout.watermarkY,
    subtitleLayout.watermarkFontSize,
    0,
    subtitleLayout.watermarkX,
    subtitleLayout.strokeWidth * 0.5,
    "start",
    0.55,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}"><image href="${escapeXmlAttribute(baseImageBase64)}" width="${canvasWidth}" height="${canvasHeight}"/>${quoteText}${nameText}${watermarkText}</svg>`;
};

const render = async (input: ImageRenderInput): Promise<ArrayBuffer> => {
  const [, fontBuffer] = await Promise.all([initializeResvg(), loadKleeOneFontBuffer()]);
  const renderer = new Resvg(await createSubtitleSvg(input), {
    font: { fontBuffers: [fontBuffer] },
  });

  try {
    const image = renderer.render();
    try {
      const png = image.asPng();
      const pngCopy = new Uint8Array(png.byteLength);
      pngCopy.set(png);
      return pngCopy.buffer;
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
};

self.addEventListener("message", (event: MessageEvent<ImageRenderWorkerRequest>) => {
  const request = event.data;
  if (request.type === "initialize") {
    void Promise.all([initializeResvg(), loadKleeOneFontBuffer()]).catch(() => undefined);
    return;
  }

  void render(request.input)
    .then((png) => {
      self.postMessage({ png, requestId: request.requestId, type: "success" }, [png]);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "画像を生成できませんでした。";
      self.postMessage({ message, requestId: request.requestId, type: "failure" });
    });
});
