import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button/Button";
import TextLink from "../../components/ui/TextLink/TextLink";
import { cx } from "../../cx/cx";
import { useCookieConsent } from "../cookieConsentContext";

interface Props {
  aboveTabBar?: boolean;
  onPrivacy?: () => void;
}

function CookieBanner({ aboveTabBar = false, onPrivacy }: Props) {
  const { t } = useTranslation("cookies");
  const { consent, accept, refuse } = useCookieConsent();

  if (consent !== null) return null;

  return (
    <section
      id="cookie-banner__section--root"
      aria-labelledby="cookie-banner__title--main"
      aria-describedby="cookie-banner__text--body"
      className={cx(
        "fixed inset-x-0 z-50 flex justify-center p-4",
        aboveTabBar
          ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]"
          : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="flex w-full max-w-app flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-lg">
        <h2 id="cookie-banner__title--main" className="font-display text-base font-bold text-ink">
          {t("banner.title")}
        </h2>
        <p id="cookie-banner__text--body" className="text-sm text-ink">
          {t("banner.body")}
        </p>
        {onPrivacy ? (
          <TextLink id="cookie-banner__link--privacy" onClick={onPrivacy} className="self-start text-sm">
            {t("banner.privacy")}
          </TextLink>
        ) : null}
        <div className="flex gap-3">
          <Button id="cookie-banner__button--refuse" variant="outline" size="md" fullWidth onClick={refuse}>
            {t("banner.refuse")}
          </Button>
          <Button id="cookie-banner__button--accept" variant="ink" size="md" fullWidth onClick={accept}>
            {t("banner.accept")}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CookieBanner;
