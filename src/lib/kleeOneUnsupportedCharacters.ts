import { getUnsupportedCharacters } from "./fontValidation";
import { isKleeOneSupportedCharacter } from "./kleeOneCharacterCoverage";

export const getUnsupportedKleeOneCharacters = (quote: string, name: string): string[] =>
  getUnsupportedCharacters(`${quote}[${name}]`, isKleeOneSupportedCharacter);
