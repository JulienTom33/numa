import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import PlanetTrio, { type Placement } from "../../../shared/components/ui/PlanetTrio/PlanetTrio";
import TextLink from "../../../shared/components/ui/TextLink/TextLink";
import type { NatalChartSummaryStatus } from "../useNatalChartSummary/useNatalChartSummary";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import ChartUnderstandSheet from "../ChartUnderstandSheet/ChartUnderstandSheet";
import ChartMethodCard from "../ChartMethodCard/ChartMethodCard";
import PlacementReading from "../PlacementReading/PlacementReading";
import type { NatalChartSummary, SummaryPlacement } from "../natalChartSummary/natalChartSummary";

interface Props {
  status: NatalChartSummaryStatus;
  summary: NatalChartSummary | null;
  errorCode: NatalChartErrorCode | null;
  onRetry: () => void;
  onDiscover: () => void;
}

function ChartSummary({ status, summary, errorCode, onRetry, onDiscover }: Props) {
  const { t } = useTranslation(["chart", "astrology"]);
  const [understandOpen, setUnderstandOpen] = useState(false);

  if (status === "loading" || !summary) {
    return (
      <section id="chart-summary__section--root" className="flex flex-col gap-6 px-4 pb-10 pt-12">
        <h1 id="chart-summary__title--main" className="font-display text-2xl font-bold text-ink">
          {t("summary.title")}
        </h1>
        {status === "error" ? (
          <Callout id="chart-summary__callout--error" tone="error" className="w-full">
            <p id="chart-summary__text--error">{t(`progress.errors.${errorCode ?? "internal_error"}`)}</p>
            <Button id="chart-summary__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("summary.retry")}
            </Button>
          </Callout>
        ) : (
          <p id="chart-summary__status--loading" role="status" className="text-sm text-ink-muted">
            {t("summary.loading")}
          </p>
        )}
      </section>
    );
  }

  const signLabel = (sign: SummaryPlacement["sign"]) => t(`astrology:signs.${sign}`);
  const moonUncertain = summary.warnings.includes("moon_sign_uncertain");
  const showMoonDegree = summary.confidence !== "low" && !moonUncertain;
  const toPlacement = (placement: SummaryPlacement | null, showDegree: boolean, detail?: string): Placement | null =>
    placement && {
      sign: signLabel(placement.sign),
      detail: detail ?? (showDegree ? t("summary.degree", { degree: Math.floor(placement.degreeInSign) }) : undefined),
    };
  const { sun, moon, ascendant, moonSignChange } = summary;
  const title = summary.firstName
    ? t("summary.titleWithName", { name: summary.firstName })
    : t("summary.title");

  return (
    <section id="chart-summary__section--root" className="flex flex-col gap-6 px-4 pb-10 pt-12">
      <header className="flex flex-col gap-2">
        <h1 id="chart-summary__title--main" className="font-display text-2xl font-bold text-ink">
          {title}
        </h1>
        <p id="chart-summary__text--intro" className="text-sm text-ink-secondary">
          {t("summary.intro")}
        </p>
      </header>

      <PlanetTrio
        id="chart-summary__trio--placements"
        sun={toPlacement(sun, true) ?? { sign: t("astrology:placement.unknown") }}
        moon={
          toPlacement(moon, showMoonDegree, moonUncertain ? t("summary.moonToConfirm") : undefined) ?? {
            sign: t("astrology:placement.unknown"),
          }
        }
        ascendant={toPlacement(ascendant, true)}
        unknownLabel={t("summary.ascendantUnavailable")}
      />

      <Card id="chart-summary__card--explanations" tone="surface" as="section">
        <h2 id="chart-summary__title--explanations" className="font-display text-base font-bold text-ink">
          {t("summary.explanations.title")}
        </h2>
        <ul id="chart-summary__list--explanations" className="mt-3 flex flex-col gap-3 text-sm text-ink-secondary">
          {sun && (
            <li id="chart-summary__item--sun">
              <PlacementReading
                id="chart-summary__reading--sun"
                kind="sun"
                sign={sun.sign}
                degree={sun.degreeInSign}
                confidence={summary.confidence}
              />
            </li>
          )}
          {moon && (
            <li id="chart-summary__item--moon" className="flex flex-col gap-2">
              {moonUncertain && moonSignChange && (
                <p id="chart-summary__text--moon-uncertain">
                  {t("summary.explanations.moonUncertain", {
                    from: signLabel(moonSignChange.from),
                    to: signLabel(moonSignChange.to),
                  })}
                </p>
              )}
              <PlacementReading
                id="chart-summary__reading--moon"
                kind="moon"
                sign={moon.sign}
                degree={moon.degreeInSign}
                confidence={summary.confidence}
                moonUncertain={moonUncertain}
              />
            </li>
          )}
          <li id="chart-summary__item--ascendant">
            {ascendant ? (
              <PlacementReading
                id="chart-summary__reading--ascendant"
                kind="ascendant"
                sign={ascendant.sign}
                degree={ascendant.degreeInSign}
                confidence={summary.confidence}
              />
            ) : (
              t("summary.explanations.ascendantMissing")
            )}
          </li>
        </ul>
      </Card>

      {summary.warnings.length > 0 && (
        <Callout id="chart-summary__callout--notes" tone="info" title={t("summary.notes.title")}>
          <ul id="chart-summary__list--notes" className="flex flex-col gap-2">
            {summary.warnings.map((warning) => (
              <li key={warning} id={`chart-summary__item--note-${warning}`}>
                {t(`summary.notes.${warning}`)}
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <ChartMethodCard idPrefix="chart-summary" summary={summary} />

      <div className="flex flex-col items-center gap-4">
        <TextLink
          id="chart-summary__link--understand"
          onClick={() => setUnderstandOpen(true)}
        >
          {t("summary.understandLink")}
        </TextLink>
        <Button id="chart-summary__button--discover" type="button" fullWidth onClick={onDiscover}>
          {t("summary.discover")}
        </Button>
      </div>
      <ChartUnderstandSheet idPrefix="chart-summary" open={understandOpen} onClose={() => setUnderstandOpen(false)} />
    </section>
  );
}

export default ChartSummary;
