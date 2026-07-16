import kleeOneFontUrl from "../assets/fonts/KleeOne-Regular.dat?url";

let fontBufferPromise: Promise<Uint8Array> | undefined;

export const loadKleeOneFontBuffer = (): Promise<Uint8Array> => {
  if (!fontBufferPromise) {
    fontBufferPromise = fetch(kleeOneFontUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Klee Oneのフォントを読み込めませんでした。");
        }
        return response.arrayBuffer();
      })
      .then((fontBuffer) => new Uint8Array(fontBuffer));
  }

  return fontBufferPromise;
};
