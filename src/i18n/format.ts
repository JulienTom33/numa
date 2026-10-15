export function formatNumber(
  value: number,
  language: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(language, options).format(value);
}

export function formatPercent(ratio: number, language: string): string {
  return formatNumber(ratio, language, { style: "percent", maximumFractionDigits: 0 });
}

export function formatDate(
  date: Date,
  language: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(language, options).format(date);
}
