import { readCookie, writeCookie } from "../supabaseClient/cookieStorage";

export type CookieConsent = "accepted" | "refused";

export const COOKIE_CONSENT_NAME = "sidera-cookie-consent";

export function readCookieConsent(): CookieConsent | null {
  const value = readCookie(COOKIE_CONSENT_NAME);
  return value === "accepted" || value === "refused" ? value : null;
}

export function writeCookieConsent(consent: CookieConsent): void {
  writeCookie(COOKIE_CONSENT_NAME, consent);
}
