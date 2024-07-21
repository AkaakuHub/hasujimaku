/**
 * Google FontsのCSSファイルから、
 * フォントURL `src: url(ここ) format(truetype OR opentype)` を探し、
 * 見つかればfetchしてArrayBufferにして返す
 * @see https://github.com/kvnang/workers-og/blob/main/packages/workers-og/src/font.ts
 * @see https://zenn.dev/uzimaru0000/articles/satori-workers
 *
 * 調べてみると、next/fontも同じようなことをしている
 * @see https://github.com/vercel/next.js/blob/canary/packages/font/src/google/find-font-files-in-css.ts
 */
const fs = require("fs");

// let fontCache: { [key: string]: ArrayBuffer } = {};

export async function loadGoogleFont({
  family,
  weight,
  text,
}: {
  family: string;
  weight?: number;
  text?: string;
}) {
  // const cacheKey = `${family}-${weight}-${text}`;
  // if (fontCache[cacheKey]) {
  //   console.log('Font loaded from cache');
  //     return fontCache[cacheKey];
  // }
  console.log('Font will be loaded from Google Fonts');

  const params = new URLSearchParams({
      family: `${family}${weight ? `:wght@${weight}` : ''}`,
  });
  if (text) {
      params.append('text', text);
  } else {
      params.append('subset', 'latin');
  }

  const url = `https://fonts.googleapis.com/css2?${params.toString()}`;

  const css = await fetch(url).then((res) => res.text());

  const fontUrl = css.match(
      /src: url\((.+)\) format\('(opentype|truetype)'\)/
  )?.[1];

  if (!fontUrl) {
      throw new Error('Font file not found in CSS fetched from Google Fonts');
  }

  const fontArrayBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

  // fontCache[cacheKey] = fontArrayBuffer;

  // 今、一回だけ{font名}.arrayBufferというファイルを作成して保存する
  // console.log("保存します。");
  // fs.writeFileSync(`./public/${family}${weight ? weight : ''}.ttf`, Buffer.from(fontArrayBuffer), err => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   }
  //   console.log('Font file saved', `./${family}${weight ? weight : ''}.ttf`);
  // });

  return fontArrayBuffer;
}
