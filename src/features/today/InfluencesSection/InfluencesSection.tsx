import { useTranslation } from "react-i18next";
import Card, { type CardTone } from "../../../shared/components/ui/Card/Card";
import { cx } from "../../../shared/cx/cx";
import type { Influence, IntensityLevel, InfluenceReading } from "../todayEnergy/todayEnergy";

interface Props {
  influences: InfluenceReading[];
}

const INFLUENCE_TONES: Record<Influence, CardTone> = {
  relations: "coral",
  love: "violet",
  work: "sky",
  energy: "gold",
};

const INFLUENCE_BAR: Record<Influence, string> = {
  relations: "bg-coral",
  love: "bg-violet",
  work: "bg-sky",
  energy: "bg-gold",
};

const LEVEL_SEGMENTS: Record<IntensityLevel, number> = { calm: 1, moderate: 2, strong: 3 };
const SEGMENTS = [1, 2, 3];

function InfluencesSection({ influences }: Props) {
  const { t } = useTranslation("today");

  return (
    <section aria-labelledby="today__title--influences" className="flex flex-col gap-3">
      <h2 id="today__title--influences" className="font-display text-base font-bold text-ink">
        {t("influences.title")}
      </h2>
      <p id="today__text--influences-basis" className="text-sm text-ink-secondary">
        {t("influences.basis")}
      </p>
      <ul id="today__list--influences" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {influences.map(({ influence, level }) => (
          <li key={influence} id={`today__item--influence-${influence}`}>
            <Card id={`today__card--influence-${influence}`} tone={INFLUENCE_TONES[influence]}>
              <p className="font-display text-sm font-bold">{t(`influences.${influence}`)}</p>
              <p id={`today__text--influence-${influence}-bodies`} className="text-xs text-ink-muted">
                {t(`influences.bodies.${influence}`)}
              </p>
              <div aria-hidden="true" className="mt-2 flex gap-1">
                {SEGMENTS.map((segment) => (
                  <span
                    key={segment}
                    className={cx(
                      "h-1.5 flex-1 rounded-full",
                      segment <= LEVEL_SEGMENTS[level] ? INFLUENCE_BAR[influence] : "bg-white/60",
                    )}
                  />
                ))}
              </div>
              <p id={`today__text--influence-${influence}`} className="mt-2 text-sm text-ink-secondary">
                {t(`influences.levels.${level}`)}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default InfluencesSection;
