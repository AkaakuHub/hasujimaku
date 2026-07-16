const ignoredCharacters = new Set(["\n", "\r"]);
const graphemeSegmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

export const getUnsupportedCharacters = (
  text: string,
  isSupportedCharacter: (character: string) => boolean,
): string[] => {
  const unsupportedCharacters = new Set<string>();

  for (const { segment } of graphemeSegmenter.segment(text)) {
    const hasUnsupportedCharacter = [...segment].some(
      (character) => !ignoredCharacters.has(character) && !isSupportedCharacter(character),
    );
    if (hasUnsupportedCharacter) {
      unsupportedCharacters.add(segment);
    }
  }

  return [...unsupportedCharacters];
};
