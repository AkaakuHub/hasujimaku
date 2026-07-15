export interface TextDrawingContext {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  strokeText: (text: string, x: number, y: number) => void;
  fillText: (text: string, x: number, y: number) => void;
}

export const drawTextWithOutline = (
  context: TextDrawingContext,
  text: string,
  x: number,
  y: number,
) => {
  context.strokeStyle = "#121311";
  context.lineWidth = 6;
  context.strokeText(text, x, y);
  context.fillText(text, x, y);
};
