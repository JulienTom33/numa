import { useTranslation } from "react-i18next";
import Card from "../../../shared/components/ui/Card/Card";
import type { Ephemeris } from "../ephemeris/ephemeris";

interface Props {
  engine: Ephemeris["engine"];
}

function SourceCard({ engine }: Props) {
  const { t } = useTranslation("ephemeris");

  return (
    <Card id="ephemeris__card--source" as="section" tone="surface">
      <h2 id="ephemeris__title--source" className="font-display text-sm font-bold text-ink">
        {t("source.title")}
      </h2>
      <p id="ephemeris__text--source" className="mt-1 text-sm text-ink-secondary">
        {t("source.text", { name: engine.name, version: engine.version })}
      </p>
      <p id="ephemeris__text--source-precision" className="mt-1 text-sm text-ink-secondary">
        {t("source.precision")}
      </p>
      <p id="ephemeris__text--source-not-prediction" className="mt-1 text-sm text-ink-secondary">
        {t("source.notPrediction")}
      </p>
    </Card>
  );
}

export default SourceCard;
