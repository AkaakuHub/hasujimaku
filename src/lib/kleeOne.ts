const fontDescription = '400 52px "Klee One"';

const buildKleeOneText = (quote: string, name: string): string => `${quote}[${name}]`;

export const loadKleeOneFont = async (quote: string, name: string): Promise<void> => {
  await import("@fontsource/klee-one/400.css");
  await document.fonts.load(fontDescription, buildKleeOneText(quote, name));
};
