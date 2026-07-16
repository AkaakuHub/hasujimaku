/// <reference lib="webworker" />

import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmUrl from "@resvg/resvg-wasm/index_bg.wasm?url";

import { loadKleeOneFontBuffer } from "../../lib/kleeOneFont";

interface ImageRenderInput {
  baseImageBase64: string;
  name: string;
  quote: string;
}

interface ImageRenderRequest {
  input: ImageRenderInput;
  requestId: number;
}

const canvasWidth = 1920;
const canvasHeight = 1080;
const textX = canvasWidth / 2;
const quoteLetterSpacing = 2;

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

const createText = (text: string, y: number, fontSize: number, letterSpacing: number): string =>
  `<text x="${textX}" y="${y}" fill="#e6e6e6" stroke="#121311" stroke-width="6" paint-order="stroke fill" text-anchor="middle" font-family="Klee One" font-size="${fontSize}" letter-spacing="${letterSpacing}">${escapeXmlText(text)}</text>`;

const createSubtitleSvg = ({ baseImageBase64, name, quote }: ImageRenderInput): string => {
  const quoteText = quote.includes("\n")
    ? quote
        .split("\n")
        .map((line, index) => createText(line, index === 0 ? 864 : 925, 52, quoteLetterSpacing))
        .join("")
    : createText(quote, 925, 52, quoteLetterSpacing);
  const nameText = createText(`[${name}]`, 1014, 38, 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}"><image href="${escapeXmlAttribute(baseImageBase64)}" width="${canvasWidth}" height="${canvasHeight}"/>${quoteText}${nameText}</svg>`;
};

const render = async (input: ImageRenderInput): Promise<ArrayBuffer> => {
  const [, fontBuffer] = await Promise.all([initializeResvg(), loadKleeOneFontBuffer()]);
  const renderer = new Resvg(createSubtitleSvg(input), { font: { fontBuffers: [fontBuffer] } });

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

self.addEventListener("message", (event: MessageEvent<ImageRenderRequest>) => {
  void render(event.data.input)
    .then((png) => {
      self.postMessage({ png, requestId: event.data.requestId, type: "success" }, [png]);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "画像を生成できませんでした。";
      self.postMessage({ message, requestId: event.data.requestId, type: "failure" });
    });
});
