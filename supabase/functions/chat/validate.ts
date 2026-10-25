import type { Completion } from "./completion.ts";

export const MAX_ANSWER_CHARS = 2400;

const FRENCH_WORDS = new Set([
  "le",
  "la",
  "les",
  "de",
  "des",
  "du",
  "et",
  "un",
  "une",
  "est",
  "vous",
  "votre",
  "vos",
  "dans",
  "pour",
  "que",
  "qui",
  "en",
]);

const MIN_FRENCH_WORDS = 3;

function frenchWordCount(text: string): number {
  const words = text.toLowerCase().match(/[a-zà-ÿ']+/g) ?? [];
  return words.filter((word) => FRENCH_WORDS.has(word)).length;
}

function cutAtLastSentence(text: string): string {
  const end = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
  return end > 0 ? text.slice(0, end + 1) : text;
}

export function finalizeAnswer({ text, truncated }: Completion): string | null {
  let result = text.trim();
  if (result === "") return null;
  if (truncated || result.length > MAX_ANSWER_CHARS) {
    result = cutAtLastSentence(result.slice(0, MAX_ANSWER_CHARS)).trim();
  }
  return frenchWordCount(result) >= MIN_FRENCH_WORDS ? result : null;
}
