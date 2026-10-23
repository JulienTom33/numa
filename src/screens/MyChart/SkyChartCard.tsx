import { useTranslation } from "react-i18next";
import Callout from "../../components/ui/Callout/Callout";
import Card from "../../components/ui/Card/Card";
import Disclosure from "../../components/ui/Disclosure/Disclosure";
import { formatNumber } from "../../i18n/format";
import { SKY_BODIES, type NatalSky } from "../../lib/skyChart";
import { BODY_GLYPHS, SIGN_GLYPHS } from "../../lib/skyGeometry";
import { ZODIAC_SIGNS } from "../../../shared/zodiac/zodiac.ts";
import SkyWheel from "./SkyWheel";

interface Props {
  natal: NatalSky;
  defaultOpen?: boolean;
}

function SkyChartCard({ natal, defaultOpen = false }: Props) {
  const { t, i18n } = useTranslation(["chart", "astrology"]);
  const hasHouses = natal.cusps !== null;

  return (
    <Card id="my-chart__card--sky" as="section">
      <h2 id="my-chart__title--sky" className="font-display text-base font-bold text-ink">
        {t("chart:myChart.sky.title")}
      </h2>
      <p id="my-chart__text--sky-intro" className="mt-2 text-sm text-ink-secondary">
        {t("chart:myChart.sky.intro")}
      </p>
      <Disclosure
        id="my-chart__disclosure--sky"
        summary={t("chart:myChart.sky.toggle")}
        defaultOpen={defaultOpen}
        className="mt-3"
      >
        <div className="flex flex-col gap-4">
          {!hasHouses && (
            <Callout id="my-chart__callout--sky-no-houses" tone="info">
              <p id="my-chart__text--sky-no-houses">{t("chart:myChart.sky.noHouses")}</p>
            </Callout>
          )}

          <SkyWheel
            id="my-chart__wheel--sky"
            bodies={natal.bodies}
            ascendantLongitude={natal.ascendantLongitude}
            cusps={natal.cusps}
          />

          <div id="my-chart__legend--sky" className="flex flex-col gap-3">
            <h3 id="my-chart__title--legend" className="font-display text-sm font-semibold text-ink">
              {t("chart:myChart.sky.legend.title")}
            </h3>
            <ul
              id="my-chart__list--legend-signs"
              aria-label={t("chart:myChart.sky.legend.signs")}
              className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm"
            >
              {ZODIAC_SIGNS.map((sign) => (
                <li key={sign} id={`my-chart__item--legend-sign-${sign}`}>
                  <span aria-hidden="true" className="mr-2 text-violet-ink">
                    {SIGN_GLYPHS[sign]}
                  </span>
                  {t(`astrology:signs.${sign}`)}
                </li>
              ))}
            </ul>
            <ul
              id="my-chart__list--legend-bodies"
              aria-label={t("chart:myChart.sky.legend.bodies")}
              className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm"
            >
              {SKY_BODIES.map((body) => (
                <li key={body} id={`my-chart__item--legend-body-${body}`}>
                  <span aria-hidden="true" className="mr-2 text-violet-ink">
                    {BODY_GLYPHS[body]}
                  </span>
                  {t(`astrology:bodies.${body}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-x-auto">
            <table id="my-chart__table--positions" className="w-full text-left text-sm">
              <caption id="my-chart__caption--positions" className="pb-2 text-left font-display text-sm font-semibold text-ink">
                {t("chart:myChart.sky.table.caption")}
              </caption>
              <thead>
                <tr className="text-xs text-ink-muted">
                  <th scope="col" className="pr-2 font-semibold">{t("chart:myChart.sky.table.body")}</th>
                  <th scope="col" className="pr-2 font-semibold">{t("chart:myChart.sky.table.sign")}</th>
                  <th scope="col" className="pr-2 font-semibold">{t("chart:myChart.sky.table.degree")}</th>
                  <th scope="col" className="pr-2 font-semibold">{t("chart:myChart.sky.table.house")}</th>
                  <th scope="col" className="font-semibold">{t("chart:myChart.sky.table.motion")}</th>
                </tr>
              </thead>
              <tbody>
                {natal.bodies.map((body) => (
                  <tr key={body.body} id={`my-chart__row--position-${body.body}`} className="border-t border-line">
                    <th scope="row" className="py-1 pr-2 font-semibold text-ink">
                      {t(`astrology:bodies.${body.body}`)}
                    </th>
                    <td className="pr-2">{t(`astrology:signs.${body.sign}`)}</td>
                    <td className="pr-2">
                      {t("chart:summary.degree", {
                        degree: formatNumber(body.degreeInSign, i18n.language, { maximumFractionDigits: 1 }),
                      })}
                    </td>
                    <td className="pr-2">{body.house ?? t("chart:myChart.sky.table.houseUnknown")}</td>
                    <td>
                      {body.retrograde
                        ? t("chart:myChart.sky.table.retrograde")
                        : t("chart:myChart.sky.table.direct")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Disclosure>
    </Card>
  );
}

export default SkyChartCard;
