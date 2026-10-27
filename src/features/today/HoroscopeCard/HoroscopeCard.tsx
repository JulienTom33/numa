import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import Disclosure from "../../../shared/components/ui/Disclosure/Disclosure";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import { HOROSCOPE_SECTIONS, type Horoscope, type HoroscopeErrorCode } from "../horoscope/horoscope";

interface Props {
  status: LoadStatus;
  data: Horoscope | null;
  errorCode: HoroscopeErrorCode | null;
  onRetry: () => void;
}

function HoroscopeCard({ status, data, errorCode, onRetry }: Props) {
  const { t } = useTranslation(["today", "chart", "astrology"]);

  return (
    <Card id="horoscope__card--root" as="section" tone="white" padding="lg">
      <h2 id="horoscope__title--root" className="font-display text-lg font-bold text-ink">
        {t("today:horoscope.title")}
      </h2>

      {status === "loading" && (
        <p id="horoscope__status--loading" role="status" className="mt-3 text-sm text-ink-muted">
          {t("today:horoscope.loading")}
        </p>
      )}

      {status === "error" && (
        <Callout id="horoscope__callout--error" tone="error" className="mt-3">
          <p id="horoscope__text--error">{t(`today:horoscope.errors.${errorCode ?? "network_error"}`)}</p>
          <Button id="horoscope__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("today:retry")}
          </Button>
        </Callout>
      )}

      {status === "ready" && data && (
        <>
          <ul id="horoscope__list--sections" className="mt-3 flex flex-col gap-3">
            {HOROSCOPE_SECTIONS.map((section) => (
              <li key={section} id={`horoscope__item--${section}`}>
                <h3 id={`horoscope__title--${section}`} className="font-display text-sm font-bold text-violet-ink">
                  {t(`today:horoscope.sections.${section}`)}
                </h3>
                <p id={`horoscope__text--${section}`} className="mt-1 text-base text-ink">
                  {data.sections[section]}
                </p>
              </li>
            ))}
          </ul>

          <Disclosure id="horoscope__button--why" summary={t("today:horoscope.why.title")} className="mt-4">
            <div id="horoscope__section--why" className="flex flex-col gap-2">
              <p id="horoscope__text--why-intro">{t("today:horoscope.why.intro")}</p>
              {data.basis.aspects.length > 0 ? (
                <ul id="horoscope__list--why-aspects" className="list-disc pl-5">
                  {data.basis.aspects.map((aspect) => (
                    <li
                      key={`${aspect.transitBody}-${aspect.natalPoint}-${aspect.type}`}
                      id={`horoscope__item--aspect-${aspect.transitBody}-${aspect.natalPoint}-${aspect.type}`}
                    >
                      {t(`chart:myChart.transits.aspects.${aspect.type}`, {
                        planet: t(`astrology:bodies.${aspect.transitBody}`),
                        point: t(`astrology:placement.${aspect.natalPoint}`).toLowerCase(),
                      })}
                    </li>
                  ))}
                </ul>
              ) : (
                <p id="horoscope__text--why-calm">{t("today:horoscope.why.calm")}</p>
              )}
              {data.basis.warnings.map((warning) => (
                <p key={warning} id={`horoscope__text--warning-${warning}`} className="text-xs text-ink-muted">
                  {t(`chart:summary.notes.${warning}`)}
                </p>
              ))}
              <p id="horoscope__text--why-disclaimer" className="text-xs text-ink-muted">
                {t("today:horoscope.why.disclaimer")}
              </p>
            </div>
          </Disclosure>
        </>
      )}
    </Card>
  );
}

export default HoroscopeCard;
