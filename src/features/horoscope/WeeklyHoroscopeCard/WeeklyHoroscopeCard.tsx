import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import Disclosure from "../../../shared/components/ui/Disclosure/Disclosure";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { WEEKLY_SECTIONS, type WeeklyErrorCode, type WeeklyHoroscope } from "../weeklyHoroscope/weeklyHoroscope";
import WeeklyBasisBlock from "./WeeklyBasisBlock";

interface Props {
  status: LoadStatus;
  data: WeeklyHoroscope | null;
  errorCode: WeeklyErrorCode | null;
  onRetry: () => void;
  onOpenProfile?: () => void;
}

const RETRYABLE: readonly WeeklyErrorCode[] = ["network_error", "rate_limit_exceeded"];

function WeeklyHoroscopeCard({ status, data, errorCode, onRetry, onOpenProfile }: Props) {
  const { t, i18n } = useTranslation(["horoscope"]);
  const code = errorCode ?? "network_error";
  const format = (iso: string) => formatDate(new Date(iso), i18n.language, { dateStyle: "long" });
  const sections = data?.sections ?? null;

  return (
    <Card id="weekly-horoscope__card--root" as="section" tone="white" padding="lg">
      <h2 id="weekly-horoscope__title--root" className="font-display text-lg font-bold text-ink">
        {t("horoscope:weekly.title")}
      </h2>

      {status === "loading" && (
        <p id="weekly-horoscope__status--loading" role="status" className="mt-3 text-sm text-ink-muted">
          {t("horoscope:weekly.loading")}
        </p>
      )}

      {status === "error" && (
        <Callout id="weekly-horoscope__callout--error" tone="error" className="mt-3">
          <p id="weekly-horoscope__text--error">{t(`horoscope:weekly.errors.${code}`)}</p>
          {RETRYABLE.includes(code) && (
            <Button id="weekly-horoscope__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("horoscope:weekly.retry")}
            </Button>
          )}
          {code === "birth_data_not_found" && onOpenProfile && (
            <Button
              id="weekly-horoscope__button--profile"
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
            >
              {t("horoscope:weekly.completeProfile")}
            </Button>
          )}
        </Callout>
      )}

      {status === "ready" && data && (
        <>
          <p id="weekly-horoscope__text--range" className="mt-1 text-sm text-ink-muted">
            {t("horoscope:weekly.range", { start: format(data.weekStart), end: format(data.weekEnd) })}
          </p>

          {sections ? (
            <>
              <ul id="weekly-horoscope__list--sections" className="mt-3 flex flex-col gap-3">
                {WEEKLY_SECTIONS.map((section) => (
                  <li key={section} id={`weekly-horoscope__item--${section}`}>
                    <h3
                      id={`weekly-horoscope__title--${section}`}
                      className="font-display text-sm font-bold text-violet-ink"
                    >
                      {t(`horoscope:weekly.sections.${section}`)}
                    </h3>
                    <p id={`weekly-horoscope__text--${section}`} className="mt-1 text-base text-ink">
                      {sections[section]}
                    </p>
                  </li>
                ))}
              </ul>
              <Disclosure
                id="weekly-horoscope__button--why"
                summary={t("horoscope:weekly.why.title")}
                className="mt-4 [&>button]:min-h-11"
              >
                <div id="weekly-horoscope__section--why" className="flex flex-col gap-2">
                  <p id="weekly-horoscope__text--why-intro">{t("horoscope:weekly.why.intro")}</p>
                  <WeeklyBasisBlock basis={data.basis} />
                  <p id="weekly-horoscope__text--why-disclaimer" className="text-xs text-ink-muted">
                    {t("horoscope:weekly.why.disclaimer")}
                  </p>
                </div>
              </Disclosure>
            </>
          ) : (
            <div id="weekly-horoscope__section--fallback" className="mt-3 flex flex-col gap-3">
              <Callout id="weekly-horoscope__callout--fallback" tone="info">
                <p id="weekly-horoscope__text--fallback">{t("horoscope:weekly.fallback.notice")}</p>
              </Callout>
              <h3 id="weekly-horoscope__title--basis" className="font-display text-base font-bold text-ink">
                {t("horoscope:weekly.basis.title")}
              </h3>
              <WeeklyBasisBlock basis={data.basis} />
              <p id="weekly-horoscope__text--basis-disclaimer" className="text-xs text-ink-muted">
                {t("horoscope:weekly.basis.disclaimer")}
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default WeeklyHoroscopeCard;
