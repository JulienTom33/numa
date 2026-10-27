import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button/Button";
import { useCookieConsent } from "../cookieConsentContext";

function CookieBanner() {
  const { t } = useTranslation("cookies");
  const { consent, accept, refuse } = useCookieConsent();

  if (consent !== null) return null;

  return (
    <section
      id="cookie-banner__section--root"
      aria-labelledby="cookie-banner__title--main"
      aria-describedby="cookie-banner__text--body"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-app flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-lg">
        <h2 id="cookie-banner__title--main" className="font-display text-base font-bold text-ink">
          {t("banner.title")}
        </h2>
        <p id="cookie-banner__text--body" className="text-sm text-ink">
          {t("banner.body")}
        </p>
        <div className="flex gap-3">
          <Button id="cookie-banner__button--refuse" variant="outline" size="sm" fullWidth onClick={refuse}>
            {t("banner.refuse")}
          </Button>
          <Button id="cookie-banner__button--accept" variant="ink" size="sm" fullWidth onClick={accept}>
            {t("banner.accept")}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CookieBanner;
