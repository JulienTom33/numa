import { createContext, useContext } from "react";
import type { CookieConsent } from "./cookieConsent";

export interface CookieConsentContextValue {
  consent: CookieConsent | null;
  accept: () => void;
  refuse: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const value = useContext(CookieConsentContext);
  if (!value) throw new Error("useCookieConsent doit être utilisé dans un CookieConsentProvider.");
  return value;
}
