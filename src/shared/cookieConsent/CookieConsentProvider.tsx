import { type ReactNode, useCallback, useMemo, useState } from "react";
import { readCookieConsent, writeCookieConsent, type CookieConsent } from "./cookieConsent";
import { CookieConsentContext, type CookieConsentContextValue } from "./cookieConsentContext";

interface Props {
  children: ReactNode;
}

function CookieConsentProvider({ children }: Props) {
  const [consent, setConsent] = useState<CookieConsent | null>(readCookieConsent);

  const choose = useCallback((choice: CookieConsent) => {
    writeCookieConsent(choice);
    setConsent(choice);
  }, []);
  const accept = useCallback(() => choose("accepted"), [choose]);
  const refuse = useCallback(() => choose("refused"), [choose]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({ consent, accept, refuse }),
    [consent, accept, refuse],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export default CookieConsentProvider;
