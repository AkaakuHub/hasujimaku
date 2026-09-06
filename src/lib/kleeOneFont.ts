import kleeOneFontUrl from "../assets/fonts/KleeOne-Regular.dat?url";
import { createCachedAsyncLoader } from "./createCachedAsyncLoader";

export const loadKleeOneFontBuffer = createCachedAsyncLoader(async () => {
  const response = await fetch(kleeOneFontUrl);
  if (!response.ok) {
    throw new Error("Klee Oneのフォントを読み込めませんでした。");
  }

  return new Uint8Array(await response.arrayBuffer());
});
