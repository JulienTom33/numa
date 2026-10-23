import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Card from "../../../shared/components/ui/Card/Card";
import { formatDate, formatNumber } from "../../../i18n/format/format";
import type { CurrentSky } from "../skyChart/skyChart";
import { BODY_GLYPHS } from "../skyGeometry/skyGeometry";

interface Props {
  transits: CurrentSky | null;
  moonUncertain: boolean;
  ascendantMissing: boolean;
  onRetry: () => void;
}

const MAX_ASPECTS = 6;

function TransitsCard({ transits, moonUncertain, ascendantMissing, onRetry }: Props) {
  const { t, i18n } = useTranslation(["chart", "astrology"]);

  return (
    <Card id="my-chart__card--transits" as="section">
      <h2 id="my-chart__title--transits" className="font-display text-base font-bold text-ink">
        {t("chart:myChart.transits.title")}
      </h2>
      <p id="my-chart__text--transits-intro" className="mt-2 text-sm text-ink-secondary">
        {t("chart:myChart.transits.intro")}
      </p>

      {transits ? (
        <div className="mt-4 flex flex-col gap-4">
          <p id="my-chart__text--transits-date" className="text-xs text-ink-muted">
            {t("chart:myChart.transits.updatedAt", {
              date: formatDate(new Date(transits.generatedAt), i18n.language, { dateStyle: "long" }),
            })}
          </p>

          <div className="flex flex-col gap-2">
            <h3 id="my-chart__title--transits-aspects" className="font-display text-sm font-semibold text-ink">
              {t("chart:myChart.transits.aspectsTitle")}
            </h3>
            {transits.aspects.length === 0 ? (
              <p id="my-chart__text--transits-empty" className="text-sm text-ink-secondary">
                {t("chart:myChart.transits.noAspects")}
              </p>
            ) : (
              <ul id="my-chart__list--transits-aspects" className="flex flex-col gap-2 text-sm text-ink-secondary">
                {transits.aspects.slice(0, MAX_ASPECTS).map((aspect) => (
                  <li
                    key={`${aspect.transitBody}-${aspect.natalPoint}-${aspect.type}`}
                    id={`my-chart__item--aspect-${aspect.transitBody}-${aspect.natalPoint}-${aspect.type}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span>
                      {t(`chart:myChart.transits.aspects.${aspect.type}`, {
                        planet: t(`astrology:bodies.${aspect.transitBody}`),
                        point: t(`astrology:placement.${aspect.natalPoint}`).toLowerCase(),
                      })}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {t("chart:myChart.transits.orb", {
                        orb: formatNumber(aspect.orb, i18n.language, { maximumFractionDigits: 1 }),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {moonUncertain && (
              <p id="my-chart__text--transits-moon-skipped" className="text-xs text-ink-muted">
                {t("chart:myChart.transits.moonSkipped")}
              </p>
            )}
            {ascendantMissing && (
              <p id="my-chart__text--transits-ascendant-skipped" className="text-xs text-ink-muted">
                {t("chart:myChart.transits.ascendantSkipped")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 id="my-chart__title--transits-positions" className="font-display text-sm font-semibold text-ink">
              {t("chart:myChart.transits.positionsTitle")}
            </h3>
            <ul id="my-chart__list--transits-positions" className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {transits.bodies.map((body) => (
                <li
                  key={body.body}
                  id={`my-chart__item--transit-${body.body}`}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="text-ink-secondary">
                    <span aria-hidden="true" className="mr-1">
                      {BODY_GLYPHS[body.body]}
                    </span>
                    {t(`astrology:bodies.${body.body}`)}
                  </span>
                  <span className="font-semibold text-ink">
                    {t("chart:myChart.transits.positionValue", {
                      sign: t(`astrology:signs.${body.sign}`),
                      degree: Math.floor(body.degreeInSign),
                    })}
                    {body.retrograde && ` ${t("chart:myChart.transits.retrograde")}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p id="my-chart__text--transits-unavailable" className="text-sm text-ink-secondary">
            {t("chart:myChart.transits.unavailable")}
          </p>
          <Button id="my-chart__button--transits-retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("chart:myChart.transits.retry")}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default TransitsCard;
