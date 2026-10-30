import { useTranslation } from "react-i18next";
import { formatNumber, formatPercent } from "../../../i18n/format/format";
import Card from "../../../shared/components/ui/Card/Card";
import type { EphemerisDay } from "../../../../shared/contracts/ephemeris/ephemeris.ts";

interface Props {
  moon: EphemerisDay["moon"];
}

function MoonPhaseCard({ moon }: Props) {
  const { t, i18n } = useTranslation("ephemeris");

  return (
    <Card id="ephemeris__card--moon" as="section" tone="white" padding="lg">
      <h2 id="ephemeris__title--moon" className="font-display text-base font-bold text-ink">
        {t("moon.title")}
      </h2>
      <p id="ephemeris__text--moon-intro" className="mt-1 text-sm text-ink-secondary">
        {t("moon.intro")}
      </p>
      <p id="ephemeris__text--moon-name" className="mt-3 font-display text-lg font-bold text-ink">
        {t(`moon.phases.${moon.name}`)}
      </p>
      <p id="ephemeris__text--moon-illumination" className="text-sm text-ink-secondary">
        {t("moon.illumination", { value: formatPercent(moon.illumination, i18n.language) })}
      </p>
      <p id="ephemeris__text--moon-age" className="text-sm text-ink-secondary">
        {t("moon.age", { age: formatNumber(moon.age, i18n.language, { maximumFractionDigits: 1 }) })}
      </p>
    </Card>
  );
}

export default MoonPhaseCard;
