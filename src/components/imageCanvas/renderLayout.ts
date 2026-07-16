const MIN_CANVAS_SHORT_EDGE = 1000;
const BASE_CANVAS_WIDTH = 1920;
const BASE_CANVAS_HEIGHT = 1080;
const BASE_QUOTE_FONT_SIZE = 52;
const BASE_NAME_FONT_SIZE = 38;
const BASE_QUOTE_LETTER_SPACING = 2;
const BASE_STROKE_WIDTH = 6;
const BASE_QUOTE_BOTTOM_OFFSET = 155;
const BASE_QUOTE_LINE_HEIGHT = 61;
const BASE_NAME_BOTTOM_OFFSET = 66;

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

export const getSubtitleLayout = (
  canvasWidth: number,
  canvasHeight: number,
  quoteLineCount: number,
): SubtitleLayout => {
  const scale = Math.min(canvasWidth / BASE_CANVAS_WIDTH, canvasHeight / BASE_CANVAS_HEIGHT);
  const quoteYPositions = Array.from(
    { length: quoteLineCount },
    (_, index) =>
      canvasHeight -
      (BASE_QUOTE_BOTTOM_OFFSET + (quoteLineCount - index - 1) * BASE_QUOTE_LINE_HEIGHT) * scale,
  );

  return {
    nameFontSize: BASE_NAME_FONT_SIZE * scale,
    nameY: canvasHeight - BASE_NAME_BOTTOM_OFFSET * scale,
    quoteFontSize: BASE_QUOTE_FONT_SIZE * scale,
    quoteLetterSpacing: BASE_QUOTE_LETTER_SPACING * scale,
    quoteYPositions,
    strokeWidth: BASE_STROKE_WIDTH * scale,
  };
};
