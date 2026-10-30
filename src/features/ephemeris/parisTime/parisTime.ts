import { formatDate } from "../../../i18n/format/format";

export const PARIS_TIME_ZONE = "Europe/Paris";

export function formatParisDate(iso: string, language: string): string {
  return formatDate(new Date(iso), language, { dateStyle: "long", timeZone: PARIS_TIME_ZONE });
}

export function formatParisTime(iso: string, language: string): string {
  return formatDate(new Date(iso), language, { timeStyle: "short", timeZone: PARIS_TIME_ZONE });
}
