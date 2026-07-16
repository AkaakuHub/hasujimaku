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

export const drawTextWithOutlineAndLetterSpacing = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
) => {
  const characters = [...text];
  const characterWidths = characters.map((character) => context.measureText(character).width);
  const textWidth =
    characterWidths.reduce((totalWidth, characterWidth) => totalWidth + characterWidth, 0) +
    letterSpacing * (characters.length - 1);
  let characterX = x - textWidth / 2;

  for (const [index, character] of characters.entries()) {
    const characterWidth = characterWidths[index];
    drawTextWithOutline(context, character, characterX + characterWidth / 2, y);
    characterX += characterWidth + letterSpacing;
  }
};
