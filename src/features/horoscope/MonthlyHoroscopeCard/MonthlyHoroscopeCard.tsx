import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import Disclosure from "../../../shared/components/ui/Disclosure/Disclosure";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { MONTHLY_SECTIONS, type MonthlyErrorCode, type MonthlyHoroscope } from "../monthlyHoroscope/monthlyHoroscope";
import MonthlyBasisBlock from "./MonthlyBasisBlock";

interface Props {
  status: LoadStatus;
  data: MonthlyHoroscope | null;
  errorCode: MonthlyErrorCode | null;
  onRetry: () => void;
  onOpenProfile?: () => void;
}

const RETRYABLE: readonly MonthlyErrorCode[] = ["network_error", "rate_limit_exceeded"];

function MonthlyHoroscopeCard({ status, data, errorCode, onRetry, onOpenProfile }: Props) {
  const { t, i18n } = useTranslation(["horoscope"]);
  const code = errorCode ?? "network_error";
  const format = (iso: string) => formatDate(new Date(iso), i18n.language, { dateStyle: "long" });
  const sections = data?.sections ?? null;

  return (
    <Card id="monthly-horoscope__card--root" as="section" tone="white" padding="lg">
      <h2 id="monthly-horoscope__title--root" className="font-display text-lg font-bold text-ink">
        {t("horoscope:monthly.title")}
      </h2>

      {status === "loading" && (
        <p id="monthly-horoscope__status--loading" role="status" className="mt-3 text-sm text-ink-muted">
          {t("horoscope:monthly.loading")}
        </p>
      )}

      {status === "error" && (
        <Callout id="monthly-horoscope__callout--error" tone="error" className="mt-3">
          <p id="monthly-horoscope__text--error">{t(`horoscope:monthly.errors.${code}`)}</p>
          {RETRYABLE.includes(code) && (
            <Button id="monthly-horoscope__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("horoscope:monthly.retry")}
            </Button>
          )}
          {code === "birth_data_not_found" && onOpenProfile && (
            <Button
              id="monthly-horoscope__button--profile"
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
            >
              {t("horoscope:monthly.completeProfile")}
            </Button>
          )}
        </Callout>
      )}

      {status === "ready" && data && (
        <>
          <p id="monthly-horoscope__text--range" className="mt-1 text-sm text-ink-muted">
            {t("horoscope:monthly.range", { start: format(data.monthStart), end: format(data.monthEnd) })}
          </p>

          {sections ? (
            <>
              <ul id="monthly-horoscope__list--sections" className="mt-3 flex flex-col gap-3">
                {MONTHLY_SECTIONS.map((section) => (
                  <li key={section} id={`monthly-horoscope__item--${section}`}>
                    <h3
                      id={`monthly-horoscope__title--${section}`}
                      className="font-display text-sm font-bold text-violet-ink"
                    >
                      {t(`horoscope:weekly.sections.${section}`)}
                    </h3>
                    <p id={`monthly-horoscope__text--${section}`} className="mt-1 text-base text-ink">
                      {sections[section]}
                    </p>
                  </li>
                ))}
              </ul>
              <Disclosure
                id="monthly-horoscope__button--why"
                summary={t("horoscope:monthly.why.title")}
                className="mt-4 [&>button]:min-h-11"
              >
                <div id="monthly-horoscope__section--why" className="flex flex-col gap-2">
                  <p id="monthly-horoscope__text--why-intro">{t("horoscope:monthly.why.intro")}</p>
                  <MonthlyBasisBlock basis={data.basis} />
                  <p id="monthly-horoscope__text--why-disclaimer" className="text-xs text-ink-muted">
                    {t("horoscope:monthly.why.disclaimer")}
                  </p>
                </div>
              </Disclosure>
            </>
          ) : (
            <div id="monthly-horoscope__section--fallback" className="mt-3 flex flex-col gap-3">
              <Callout id="monthly-horoscope__callout--fallback" tone="info">
                <p id="monthly-horoscope__text--fallback">{t("horoscope:monthly.fallback.notice")}</p>
              </Callout>
              <h3 id="monthly-horoscope__title--basis" className="font-display text-base font-bold text-ink">
                {t("horoscope:monthly.basis.title")}
              </h3>
              <MonthlyBasisBlock basis={data.basis} />
              <p id="monthly-horoscope__text--basis-disclaimer" className="text-xs text-ink-muted">
                {t("horoscope:monthly.basis.disclaimer")}
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default MonthlyHoroscopeCard;
