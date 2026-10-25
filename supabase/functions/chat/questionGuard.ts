const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const WORDED_DATE =
  /(?<![\p{L}\d])\d{1,2}(?:er)?\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+\d{4}(?!\d)/iu;
const PHONE = /(?:\+|\b)\d(?:[\s.-]?\d){8,}\b/;
const DATE = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/;

export function containsPersonalData(question: string): boolean {
  return EMAIL.test(question) || PHONE.test(question) || DATE.test(question) ||
    WORDED_DATE.test(question);
}
