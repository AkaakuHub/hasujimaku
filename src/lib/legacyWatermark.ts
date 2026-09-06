import {
  blurLuminance,
  createImageLuminance,
  getGradientCorrelation,
  normalizeLuminanceRegion,
} from "./imageGradientCorrelation";

const baseCanvasWidth = 1920;
const baseCanvasHeight = 1080;
const minimumTemplateGradient = 10;

export const legacyWatermarkDetectionThreshold = 0.7;

export interface LegacyWatermarkSpecification {
  fontSize: number;
  opacity: number;
  region: {
    height: number;
    left: number;
    top: number;
    width: number;
  };
  text: string;
  x: number;
  y: number;
}

export const legacyWatermarkSpecifications: readonly LegacyWatermarkSpecification[] = [
  {
    fontSize: 20,
    opacity: 1,
    region: { height: 29, left: 32, top: 1028, width: 608 },
    text: "この画像は#活動記録字幕ジェネレーターによって作成されました。",
    x: 36,
    y: 1050,
  },
  {
    fontSize: 16,
    opacity: 0.55,
    region: { height: 25, left: 31, top: 1031, width: 228 },
    text: "#活動記録字幕ジェネレーター",
    x: 36,
    y: 1050,
  },
  {
    fontSize: 16,
    opacity: 0.55,
    region: { height: 24, left: 0, top: 1056, width: 228 },
    text: "#活動記録字幕ジェネレーター",
    x: 5,
    y: 1075,
  },
];

export interface LegacyWatermarkTemplate {
  height: number;
  left: number;
  luminance: Float32Array;
  topFromBottom: number;
  width: number;
}

export const createLegacyWatermarkTemplate = (
  pixels: Uint8ClampedArray,
  specification: LegacyWatermarkSpecification,
): LegacyWatermarkTemplate => {
  const { height, left, top, width } = specification.region;
  if (pixels.length !== width * height * 4) {
    throw new Error("旧透かしのテンプレート画像が不正です。");
  }

  return {
    height,
    left,
    luminance: createImageLuminance(pixels),
    topFromBottom: baseCanvasHeight - top,
    width,
  };
};

const getTextScale = (width: number, height: number): number =>
  height > width ? width / 1080 : Math.min(width / baseCanvasWidth, height / baseCanvasHeight);

const getCorrelation = (
  image: Float32Array,
  template: Float32Array,
  width: number,
  height: number,
): number => getGradientCorrelation(image, template, width, height, minimumTemplateGradient);

const getTemplateMatch = (
  imageLuminance: Float32Array,
  imageWidth: number,
  imageHeight: number,
  template: LegacyWatermarkTemplate,
): number => {
  const scale = getTextScale(imageWidth, imageHeight);
  const regionWidth = Math.round(template.width * scale);
  const regionHeight = Math.round(template.height * scale);
  if (regionHeight < 6) {
    return 0;
  }

  const expectedLeft = Math.round(template.left * scale);
  const expectedTop = Math.round(imageHeight - template.topFromBottom * scale);
  const offsetRange = Math.min(3, Math.max(1, Math.ceil(scale * 2)));
  const blurredTemplate = blurLuminance(template.luminance, template.width, template.height);
  const scaledTemplate = normalizeLuminanceRegion(
    template.luminance,
    template.width,
    template.height,
    0,
    0,
    template.width,
    template.height,
    regionWidth,
    regionHeight,
  );
  const blurredScaledTemplate = blurLuminance(scaledTemplate, regionWidth, regionHeight);
  let bestMatch = 0;

  for (let offsetY = -offsetRange; offsetY <= offsetRange; offsetY += 1) {
    for (let offsetX = -offsetRange; offsetX <= offsetRange; offsetX += 1) {
      const left = expectedLeft + offsetX;
      const top = expectedTop + offsetY;
      if (
        left < 0 ||
        top < 0 ||
        left + regionWidth > imageWidth ||
        top + regionHeight > imageHeight
      ) {
        continue;
      }

      const candidate = normalizeLuminanceRegion(
        imageLuminance,
        imageWidth,
        imageHeight,
        left,
        top,
        regionWidth,
        regionHeight,
        template.width,
        template.height,
      );
      const scaledCandidate = normalizeLuminanceRegion(
        imageLuminance,
        imageWidth,
        imageHeight,
        left,
        top,
        regionWidth,
        regionHeight,
        regionWidth,
        regionHeight,
      );
      bestMatch = Math.max(
        bestMatch,
        getCorrelation(candidate, template.luminance, template.width, template.height),
        getCorrelation(
          blurLuminance(candidate, template.width, template.height),
          blurredTemplate,
          template.width,
          template.height,
        ),
        getCorrelation(scaledCandidate, scaledTemplate, regionWidth, regionHeight),
        getCorrelation(
          blurLuminance(scaledCandidate, regionWidth, regionHeight),
          blurredScaledTemplate,
          regionWidth,
          regionHeight,
        ),
      );
    }
  }
  return bestMatch;
};

export const getLegacyWatermarkMatch = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  templates: readonly LegacyWatermarkTemplate[],
): number => {
  if (width <= 0 || height <= 0 || pixels.length !== width * height * 4) {
    return 0;
  }

  const imageLuminance = createImageLuminance(pixels);
  return templates.reduce(
    (bestMatch, template) =>
      Math.max(bestMatch, getTemplateMatch(imageLuminance, width, height, template)),
    0,
  );
};

export const detectLegacyWatermark = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  templates: readonly LegacyWatermarkTemplate[],
): boolean =>
  getLegacyWatermarkMatch(pixels, width, height, templates) >= legacyWatermarkDetectionThreshold;
