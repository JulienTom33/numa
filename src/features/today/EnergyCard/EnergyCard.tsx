import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Card from "../../../shared/components/ui/Card/Card";
import type { EnergyReading } from "../todayEnergy/todayEnergy";

interface Props {
  energy: EnergyReading | null;
  onRetry: () => void;
}

function EnergyCard({ energy, onRetry }: Props) {
  const { t } = useTranslation(["today", "chart", "astrology"]);
  const headline = energy?.headline ?? null;

  return (
    <Card id="today__card--energy" as="section" tone="violet" padding="lg">
      <h2 id="today__title--energy" className="font-display text-lg font-bold text-violet-ink">
        {t("today:energy.title")}
      </h2>
      {energy ? (
        <>
          <p id="today__text--energy" className="mt-3 text-base text-ink">
            {headline
              ? t("today:energy.headline", {
                  aspect: t(`chart:myChart.transits.aspects.${headline.type}`, {
                    planet: t(`astrology:bodies.${headline.transitBody}`),
                    point: t(`astrology:placement.${headline.natalPoint}`).toLowerCase(),
                  }),
                })
              : t("today:energy.calm")}
          </p>
          {headline && (
            <p id="today__text--energy-meaning" className="mt-2 text-sm text-ink-secondary">
              {t(`today:horoscope.why.aspectMeanings.${headline.type}`)}{" "}
              {t("today:energy.orb", { orb: headline.orb })}
            </p>
          )}
          <p id="today__text--energy-how" className="mt-2 text-xs text-ink-muted">
            {t("today:energy.how")}
          </p>
        </>
      ) : (
        <div className="mt-3 flex flex-col items-start gap-3">
          <p id="today__text--energy-unavailable" className="text-sm text-ink">
            {t("today:energy.unavailable")}
          </p>
          <Button id="today__button--energy-retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("today:retry")}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default EnergyCard;
