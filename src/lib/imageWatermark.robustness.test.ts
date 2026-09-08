import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { createWatermarkTestImage } from "../../test/fixtures/watermarkImage";
import { detectImageWatermark, embedImageWatermark } from "./imageWatermark";

type ImageTransform = (image: sharp.Sharp) => sharp.Sharp;

const jpeg: ImageTransform = (image) => image.jpeg({ quality: 60, chromaSubsampling: "4:2:0" });
const palette: ImageTransform = (image) => image.png({ palette: true, colours: 256, dither: 0 });
const paletteDither: ImageTransform = (image) =>
  image.png({ palette: true, colours: 256, dither: 1 });

const attacks: { name: string; transforms: ImageTransform[] }[] = [
  { name: "JPEG品質60", transforms: [jpeg] },
  { name: "256色減色", transforms: [palette] },
  { name: "ディザ付き256色減色", transforms: [paletteDither] },
  { name: "JPEG品質60→256色減色", transforms: [jpeg, palette] },
  { name: "256色減色→JPEG品質60", transforms: [palette, jpeg] },
];

describe.each(attacks)("画像透かしの耐性: $name", ({ transforms }) => {
  it.each([0, 1, 2])(
    "画像%iを実際に圧縮・減色しても検出し、未加工画像は誤検出しない",
    async (variant) => {
      const width = 1000;
      const height = 720;
      const original = createWatermarkTestImage(width, height, variant);
      const watermarked = original.slice();
      embedImageWatermark(watermarked, width, height);

      for (const [pixels, expected] of [
        [original, false],
        [watermarked, true],
      ] as const) {
        let image = sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } });
        for (const transform of transforms) {
          const encoded = await transform(image).toBuffer();
          image = sharp(encoded);
        }
        const decoded = new Uint8ClampedArray(await image.ensureAlpha().raw().toBuffer());
        expect(detectImageWatermark(decoded, width, height).detected).toBe(expected);
      }
    },
  );
});
