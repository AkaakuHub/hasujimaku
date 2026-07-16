const MIN_CANVAS_SHORT_EDGE = 1000;
const BASE_CANVAS_WIDTH = 1920;
const BASE_CANVAS_HEIGHT = 1080;
const BASE_QUOTE_FONT_SIZE = 52;
const BASE_NAME_FONT_SIZE = 38;
const BASE_QUOTE_LETTER_SPACING = 2;
const BASE_STROKE_WIDTH = 6;
const BASE_QUOTE_BOTTOM_OFFSET = 155;
const BASE_QUOTE_LINE_HEIGHT = 61;
const BASE_NAME_FROM_QUOTE_GAP = 89;
const BASE_WATERMARK_FONT_SIZE = 20;
const BASE_WATERMARK_LEFT_OFFSET = 36;
const BASE_WATERMARK_BOTTOM_OFFSET = 30;

interface ImageCanvasSize {
  height: number;
  width: number;
}

export interface SubtitleLayout {
  nameFontSize: number;
  nameY: number;
  quoteFontSize: number;
  quoteLetterSpacing: number;
  quoteYPositions: number[];
  strokeWidth: number;
  watermarkFontSize: number;
  watermarkX: number;
  watermarkY: number;
}

export const getCanvasSize = (imageWidth: number, imageHeight: number): ImageCanvasSize => {
  const shortEdge = Math.min(imageWidth, imageHeight);
  if (shortEdge >= MIN_CANVAS_SHORT_EDGE) {
    return { width: imageWidth, height: imageHeight };
  }

  const scale = MIN_CANVAS_SHORT_EDGE / shortEdge;
  return {
    width: Math.round(imageWidth * scale),
    height: Math.round(imageHeight * scale),
  };
};

const getTextScale = (canvasWidth: number, canvasHeight: number): number => {
  if (canvasHeight > canvasWidth) {
    return canvasWidth / BASE_CANVAS_HEIGHT;
  }

  return Math.min(canvasWidth / BASE_CANVAS_WIDTH, canvasHeight / BASE_CANVAS_HEIGHT);
};

const getQuoteYPositions = (
  canvasHeight: number,
  quoteLineCount: number,
  textScale: number,
): number[] => {
  const lastQuoteY = canvasHeight - BASE_QUOTE_BOTTOM_OFFSET * textScale;

  return Array.from(
    { length: quoteLineCount },
    (_, index) => lastQuoteY - (quoteLineCount - index - 1) * BASE_QUOTE_LINE_HEIGHT * textScale,
  );
};

export const getSubtitleLayout = (
  canvasWidth: number,
  canvasHeight: number,
  quoteLineCount: number,
): SubtitleLayout => {
  const textScale = getTextScale(canvasWidth, canvasHeight);
  const quoteYPositions = getQuoteYPositions(canvasHeight, quoteLineCount, textScale);
  const lastQuoteY = quoteYPositions[quoteYPositions.length - 1] ?? canvasHeight;

  return {
    nameFontSize: BASE_NAME_FONT_SIZE * textScale,
    nameY: lastQuoteY + BASE_NAME_FROM_QUOTE_GAP * textScale,
    quoteFontSize: BASE_QUOTE_FONT_SIZE * textScale,
    quoteLetterSpacing: BASE_QUOTE_LETTER_SPACING * textScale,
    quoteYPositions,
    strokeWidth: BASE_STROKE_WIDTH * textScale,
    watermarkFontSize: BASE_WATERMARK_FONT_SIZE * textScale,
    watermarkX: BASE_WATERMARK_LEFT_OFFSET * textScale,
    watermarkY: canvasHeight - BASE_WATERMARK_BOTTOM_OFFSET * textScale,
  };
};
