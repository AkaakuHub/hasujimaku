import { createCachedAsyncLoader } from "../lib/createCachedAsyncLoader";
import {
  createLegacyWatermarkTemplate,
  legacyWatermarkSpecifications,
  type LegacyWatermarkTemplate,
} from "../lib/legacyWatermark";
import { createSvgRenderer } from "./svgRenderer";

const renderTemplate = async (
  specification: (typeof legacyWatermarkSpecifications)[number],
): Promise<LegacyWatermarkTemplate> => {
  const { height, left, top, width } = specification.region;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${left} ${top} ${width} ${height}"><rect x="${left}" y="${top}" width="${width}" height="${height}" fill="#808080"/><text x="${specification.x}" y="${specification.y}" opacity="${specification.opacity}" fill="#e6e6e6" stroke="#121311" stroke-width="3" paint-order="stroke fill" font-family="Klee One" font-size="${specification.fontSize}">${specification.text}</text></svg>`;
  const renderer = await createSvgRenderer(svg);

  try {
    const image = renderer.render();
    try {
      return createLegacyWatermarkTemplate(new Uint8ClampedArray(image.pixels), specification);
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
};

export const initializeLegacyWatermarkDetector = createCachedAsyncLoader(() =>
  Promise.all(legacyWatermarkSpecifications.map(renderTemplate)),
);
