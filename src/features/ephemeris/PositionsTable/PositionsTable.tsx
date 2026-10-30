import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../../../i18n/format/format";
import Card from "../../../shared/components/ui/Card/Card";
import type { EphemerisDay } from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import { splitDegree, toUtcDate } from "../ephemerisPeriod/ephemerisPeriod";

interface Props {
  day: EphemerisDay;
}

function PositionsTable({ day }: Props) {
  const { t, i18n } = useTranslation(["ephemeris", "astrology"]);
  const date = formatDate(toUtcDate(day.date), i18n.language, { dateStyle: "full", timeZone: "UTC" });

  return (
    <Card id="ephemeris__card--positions" as="section" tone="white" padding="lg">
      <h2 id="ephemeris__title--positions" className="font-display text-base font-bold text-ink">
        {t("ephemeris:positions.title")}
      </h2>
      <p id="ephemeris__text--positions-intro" className="mt-1 text-sm text-ink-secondary">
        {t("ephemeris:positions.intro")}
      </p>
      <div
        id="ephemeris__region--positions"
        role="region"
        tabIndex={0}
        aria-label={t("ephemeris:positions.scrollLabel")}
        className="mt-3 overflow-x-auto rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <table id="ephemeris__table--positions" className="w-full border-collapse text-left text-sm">
          <caption className="pb-2 text-left text-xs text-ink-muted">
            {t("ephemeris:positions.caption", { date })}
          </caption>
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">{t("ephemeris:positions.columns.body")}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{t("ephemeris:positions.columns.sign")}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{t("ephemeris:positions.columns.position")}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{t("ephemeris:positions.columns.motion")}</th>
              <th scope="col" className="hidden py-2 font-semibold sm:table-cell">
                {t("ephemeris:positions.columns.speed")}
              </th>
            </tr>
          </thead>
          <tbody>
            {day.bodies.map((position) => {
              const { degree, minute } = splitDegree(position.degreeInSign);
              return (
                <tr
                  key={position.body}
                  id={`ephemeris__row--${position.body}`}
                  className="border-b border-line/60 last:border-b-0"
                >
                  <th scope="row" className="py-2 pr-3 font-semibold text-ink">
                    {t(`astrology:bodies.${position.body}`)}
                  </th>
                  <td className="py-2 pr-3 text-ink-secondary">{t(`astrology:signs.${position.sign}`)}</td>
                  <td className="py-2 pr-3 text-ink-secondary">
                    {t("ephemeris:positions.position", { degree, minute: String(minute).padStart(2, "0") })}
                  </td>
                  <td className="py-2 pr-3 text-ink-secondary">
                    {position.retrograde ? t("ephemeris:positions.retrograde") : t("ephemeris:positions.direct")}
                  </td>
                  <td className="hidden py-2 text-ink-secondary sm:table-cell">
                    {t("ephemeris:positions.speed", {
                      speed: formatNumber(position.speed, i18n.language, { maximumFractionDigits: 2 }),
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default PositionsTable;
