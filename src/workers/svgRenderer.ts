import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmUrl from "@resvg/resvg-wasm/index_bg.wasm?url";

import { createCachedAsyncLoader } from "../lib/createCachedAsyncLoader";
import { loadKleeOneFontBuffer } from "../lib/kleeOneFont";

export const initializeSvgRenderer = createCachedAsyncLoader(async () => {
  const [, fontBuffer] = await Promise.all([
    initWasm(fetch(resvgWasmUrl)),
    loadKleeOneFontBuffer(),
  ]);
  return fontBuffer;
});

export const createSvgRenderer = async (svg: string) =>
  new Resvg(svg, {
    font: { fontBuffers: [await initializeSvgRenderer()] },
  });
