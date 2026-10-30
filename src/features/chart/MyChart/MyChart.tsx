import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import PlanetTrio, { type Placement } from "../../../shared/components/ui/PlanetTrio/PlanetTrio";
import type { MyChartStatus } from "../useMyChart/useMyChart";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import type { SummaryPlacement } from "../natalChartSummary/natalChartSummary";
import type { MyChartData } from "../skyChart/skyChart";
import ChartDetails from "../ChartDetails/ChartDetails";
import ChartUnderstandSheet from "../ChartUnderstandSheet/ChartUnderstandSheet";
import ChartMethodCard from "../ChartMethodCard/ChartMethodCard";
import SkyChartCard from "../SkyChartCard/SkyChartCard";
import TransitsCard from "../TransitsCard/TransitsCard";

interface Props {
  status: MyChartStatus;
  data: MyChartData | null;
  errorCode: NatalChartErrorCode | null;
  onRetry: () => void;
  skyDefaultOpen?: boolean;
  isAnonymous?: boolean;
  onSignUp?: () => void;
}

const ASCENDANT_HOUSE = 1;

function MyChart({ status, data, errorCode, onRetry, skyDefaultOpen = false, isAnonymous = false, onSignUp }: Props) {
  const { t } = useTranslation(["chart", "astrology", "chartDetail"]);
  const [understandOpen, setUnderstandOpen] = useState(false);

  const title = (
    <h1 id="my-chart__title--main" className="font-display text-2xl font-bold text-ink">
      {t("chart:myChart.title")}
    </h1>
  );

  if (status === "loading" || !data) {
    return (
      <section id="my-chart__section--root" className="flex w-full flex-col gap-6 pb-10">
        {title}
        {status === "error" ? (
          <Callout id="my-chart__callout--error" tone="error" className="w-full">
            <p id="my-chart__text--error">{t(`chart:progress.errors.${errorCode ?? "internal_error"}`)}</p>
            <Button id="my-chart__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("chart:myChart.retry")}
            </Button>
          </Callout>
        ) : (
          <p id="my-chart__status--loading" role="status" className="text-sm text-ink-muted">
            {t("chart:myChart.loading")}
          </p>
        )}
      </section>
    );
  }

  const { summary, natal, transits } = data;
  const { sun, moon, ascendant } = summary;
  const moonUncertain = summary.warnings.includes("moon_sign_uncertain");
  const signLabel = (sign: SummaryPlacement["sign"]) => t(`astrology:signs.${sign}`);
  const toPlacement = (placement: SummaryPlacement | null, detail?: string): Placement | null =>
    placement && {
      sign: signLabel(placement.sign),
      detail: detail ?? t("chart:summary.degree", { degree: Math.floor(placement.degreeInSign) }),
    };
  const unknown = { sign: t("astrology:placement.unknown") };

  return (
    <section id="my-chart__section--root" className="flex w-full flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2">
        {title}
        <p id="my-chart__text--intro" className="text-sm text-ink-secondary">
          {t("chart:myChart.intro")}
        </p>
      </header>

      <PlanetTrio
        id="my-chart__trio--placements"
        sun={toPlacement(sun) ?? unknown}
        moon={
          moonUncertain || summary.confidence === "low"
            ? { sign: moon ? signLabel(moon.sign) : unknown.sign, detail: t("chart:summary.moonToConfirm") }
            : (toPlacement(moon) ?? unknown)
        }
        ascendant={toPlacement(ascendant)}
        unknownLabel={t("chart:summary.ascendantUnavailable")}
      />

      <Card id="my-chart__card--ascendant" as="section">
        <h2 id="my-chart__title--ascendant" className="font-display text-base font-bold text-ink">
          {ascendant
            ? t("chart:myChart.ascendant.title", { sign: signLabel(ascendant.sign) })
            : t("chart:myChart.ascendant.titleMissing")}
        </h2>
        <p id="my-chart__text--ascendant" className="mt-2 text-sm text-ink-secondary">
          {ascendant
            ? t("chart:myChart.ascendant.explanation", { sign: signLabel(ascendant.sign) })
            : t("chart:summary.explanations.ascendantMissing")}
        </p>
        {ascendant && (
          <dl id="my-chart__list--ascendant" className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-secondary">{t("chart:myChart.ascendant.degreeLabel")}</dt>
              <dd id="my-chart__value--ascendant-degree" className="font-semibold text-ink">
                {t("chart:myChart.ascendant.degreeValue", {
                  degree: Math.floor(ascendant.degreeInSign),
                  sign: signLabel(ascendant.sign),
                })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-secondary">{t("chart:myChart.ascendant.houseLabel")}</dt>
              <dd id="my-chart__value--ascendant-house" className="font-semibold text-ink">
                {t("chart:myChart.ascendant.houseValue", { house: ASCENDANT_HOUSE })}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      {isAnonymous ? (
        <Card id="my-chart__card--discovery" tone="violet" as="section">
          <h2 id="my-chart__title--discovery" className="font-display text-base font-bold text-ink">
            {t("chartDetail:discovery.title")}
          </h2>
          <p id="my-chart__text--discovery" className="mt-2 text-sm text-ink-secondary">
            {t("chartDetail:discovery.body")}
          </p>
          <Button id="my-chart__button--signup" type="button" className="mt-3" fullWidth onClick={onSignUp}>
            {t("chartDetail:discovery.signup")}
          </Button>
        </Card>
      ) : (
        <ChartDetails idPrefix="my-chart" summary={summary} natal={natal} />
      )}

      <SkyChartCard natal={natal} defaultOpen={skyDefaultOpen} />

      <TransitsCard
        transits={transits}
        moonUncertain={moonUncertain}
        ascendantMissing={ascendant === null}
        onRetry={onRetry}
      />

      <ChartMethodCard idPrefix="my-chart" summary={summary} />

      <Button id="my-chart__button--understand" type="button" variant="outline" fullWidth onClick={() => setUnderstandOpen(true)}>
        {t("chartDetail:understand.button")}
      </Button>
      <ChartUnderstandSheet idPrefix="my-chart" open={understandOpen} onClose={() => setUnderstandOpen(false)} />
    </section>
  );
}

export default MyChart;
