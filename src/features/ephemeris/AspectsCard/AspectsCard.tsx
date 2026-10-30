import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../i18n/format/format";
import Button from "../../../shared/components/ui/Button/Button";
import Card from "../../../shared/components/ui/Card/Card";
import type { EphemerisDay } from "../../../../shared/contracts/ephemeris/ephemeris.ts";

interface Props {
  aspects: EphemerisDay["aspects"];
}

const VISIBLE_COUNT = 5;

function AspectsCard({ aspects }: Props) {
  const { t, i18n } = useTranslation(["ephemeris", "astrology", "chartDetail"]);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? aspects : aspects.slice(0, VISIBLE_COUNT);

  return (
    <Card id="ephemeris__card--aspects" as="section" tone="white" padding="lg">
      <h2 id="ephemeris__title--aspects" className="font-display text-base font-bold text-ink">
        {t("ephemeris:aspects.title")}
      </h2>
      <p id="ephemeris__text--aspects-intro" className="mt-1 text-sm text-ink-secondary">
        {t("ephemeris:aspects.intro")}
      </p>
      {aspects.length === 0 ? (
        <p id="ephemeris__text--aspects-none" className="mt-3 text-sm text-ink-muted">
          {t("ephemeris:aspects.none")}
        </p>
      ) : (
        <ul id="ephemeris__list--aspects" className="mt-3 flex flex-col gap-2 text-sm">
          {visible.map((aspect) => (
            <li
              key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}
              id={`ephemeris__item--aspect-${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}
              className="flex flex-wrap items-baseline justify-between gap-x-3"
            >
              <span className="font-semibold text-ink">
                {t("ephemeris:aspects.pair", {
                  type: t(`chartDetail:details.aspects.types.${aspect.type}`),
                  a: t(`astrology:bodies.${aspect.bodyA}`),
                  b: t(`astrology:bodies.${aspect.bodyB}`),
                })}
              </span>
              <span className="text-ink-secondary">
                {t("ephemeris:aspects.orb", {
                  orb: formatNumber(aspect.orb, i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {aspects.length > VISIBLE_COUNT && (
        <Button
          id="ephemeris__button--aspects-toggle"
          type="button"
          variant="soft"
          size="sm"
          className="mt-3"
          aria-expanded={expanded}
          aria-controls="ephemeris__list--aspects"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? t("ephemeris:aspects.showLess") : t("ephemeris:aspects.showAll", { count: aspects.length })}
        </Button>
      )}
    </Card>
  );
}

export default AspectsCard;
