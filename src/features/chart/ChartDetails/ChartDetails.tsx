import { useTranslation } from "react-i18next";
import Card from "../../../shared/components/ui/Card/Card";
import { ZODIAC_SIGNS } from "../../../../shared/zodiac/zodiac.ts";
import type { NatalChartSummary } from "../natalChartSummary/natalChartSummary";
import type { NatalSky } from "../skyChart/skyChart";
import PlacementReading from "../PlacementReading/PlacementReading";
import { useOptionalText, type OptionalNamespace } from "../optionalText/optionalText";

interface Props {
  idPrefix: string;
  summary: NatalChartSummary;
  natal: NatalSky;
}

const DEGREES_PER_SIGN = 30;

const OPTIONAL_SIGN_NAMESPACE: Record<string, OptionalNamespace> = {
  mercury: "chartSignsPersonal",
  venus: "chartSignsPersonal",
  mars: "chartSignsPersonal",
  jupiter: "chartSignsOuter",
  saturn: "chartSignsOuter",
  uranus: "chartSignsOuter",
  neptune: "chartSignsOuter",
  pluto: "chartSignsOuter",
};

function signOf(longitude: number) {
  const index = Math.floor(longitude / DEGREES_PER_SIGN) % ZODIAC_SIGNS.length;
  return { sign: ZODIAC_SIGNS[index], degree: Math.floor(longitude - index * DEGREES_PER_SIGN) };
}

function ChartDetails({ idPrefix, summary, natal }: Props) {
  const { t } = useTranslation(["chartDetail", "astrology"]);
  const optionalText = useOptionalText();
  const optionalSignText = (body: string, sign: string) => {
    const namespace = OPTIONAL_SIGN_NAMESPACE[body];
    return namespace ? optionalText(namespace, `${body}.${sign}`) : null;
  };
  const moonUncertain = summary.warnings.includes("moon_sign_uncertain");
  const signLabel = (sign: (typeof ZODIAC_SIGNS)[number]) => t(`astrology:signs.${sign}`);
  const angles = [
    { key: "ascendant", longitude: natal.ascendantLongitude },
    { key: "midheaven", longitude: natal.midheavenLongitude },
  ] as const;
  const hasAngles = angles.some((angle) => angle.longitude !== null);

  return (
    <Card id={`${idPrefix}__card--details`} as="section">
      <h2 id={`${idPrefix}__title--details`} className="font-display text-base font-bold text-ink">
        {t("details.title")}
      </h2>
      <p id={`${idPrefix}__text--details-intro`} className="mt-2 text-sm text-ink-secondary">
        {t("details.intro")}
      </p>
      <p id={`${idPrefix}__text--details-confidence`} className="mt-2 text-sm text-ink-secondary">
        {t(`details.confidence.${summary.confidence}`)}
      </p>

      <h3 id={`${idPrefix}__title--planets`} className="mt-4 font-display text-sm font-bold text-ink">
        {t("details.planets.title")}
      </h3>
      <ul id={`${idPrefix}__list--planets`} className="mt-2 flex flex-col gap-3 text-sm">
        {natal.bodies.map((body) => (
          <li key={body.body} id={`${idPrefix}__item--planet-${body.body}`} className="flex flex-col gap-1">
            <span className="font-semibold text-ink">
              {t(`astrology:bodies.${body.body}`)} ·{" "}
              {t("details.planets.position", { sign: signLabel(body.sign), degree: Math.floor(body.degreeInSign) })} ·{" "}
              {body.house === null ? t("details.planets.houseUnknown") : t("details.planets.house", { house: body.house })}
              {body.retrograde && ` · ${t("details.planets.retrograde")}`}
            </span>
            {body.body === "sun" || body.body === "moon" ? (
              <span className="text-ink-secondary">
                <PlacementReading
                  id={`${idPrefix}__reading--${body.body}`}
                  kind={body.body}
                  sign={body.sign}
                  degree={body.degreeInSign}
                  confidence={summary.confidence}
                  moonUncertain={moonUncertain}
                />
              </span>
            ) : (
              <span id={`${idPrefix}__text--planet-${body.body}`} className="text-ink-secondary">
                {optionalSignText(body.body, body.sign) ?? t(`details.planets.roles.${body.body}`)}
              </span>
            )}
            {body.house !== null && optionalText("chartHouses", String(body.house)) !== null && (
              <span id={`${idPrefix}__text--house-${body.body}`} className="text-ink-secondary">
                {optionalText("chartHouses", String(body.house))}
              </span>
            )}
            {body.retrograde && (
              <span id={`${idPrefix}__text--retrograde-${body.body}`} className="text-ink-muted">
                {t("details.planets.retrogradeHelp")}
              </span>
            )}
          </li>
        ))}
      </ul>

      <h3 id={`${idPrefix}__title--angles`} className="mt-4 font-display text-sm font-bold text-ink">
        {t("details.angles.title")}
      </h3>
      {hasAngles ? (
        <ul id={`${idPrefix}__list--angles`} className="mt-2 flex flex-col gap-3 text-sm">
          {angles.map(({ key, longitude }) => {
            if (longitude === null) return null;
            const { sign, degree } = signOf(longitude);
            return (
              <li key={key} id={`${idPrefix}__item--angle-${key}`} className="flex flex-col gap-1">
                <span className="font-semibold text-ink">{t(`details.angles.${key}`, { sign: signLabel(sign), degree })}</span>
                <span className="text-ink-secondary">{t(`details.angles.${key}Help`)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p id={`${idPrefix}__text--angles-unavailable`} className="mt-2 text-sm text-ink-secondary">
          {t("details.angles.unavailable")}
        </p>
      )}

      <h3 id={`${idPrefix}__title--aspects`} className="mt-4 font-display text-sm font-bold text-ink">
        {t("details.aspects.title")}
      </h3>
      <p className="mt-2 text-sm text-ink-secondary">{t("details.aspects.intro")}</p>
      {natal.aspects.length === 0 ? (
        <p id={`${idPrefix}__text--aspects-none`} className="mt-2 text-sm text-ink-secondary">
          {t("details.aspects.none")}
        </p>
      ) : (
        <ul id={`${idPrefix}__list--aspects`} className="mt-2 flex flex-col gap-3 text-sm">
          {natal.aspects.map((aspect) => (
            <li
              key={`${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}
              id={`${idPrefix}__item--aspect-${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`}
              className="flex flex-col gap-1"
            >
              <span className="font-semibold text-ink">
                {t(`details.aspects.types.${aspect.type}`)} ·{" "}
                {t("details.aspects.pair", {
                  a: t(`astrology:bodies.${aspect.bodyA}`),
                  b: t(`astrology:bodies.${aspect.bodyB}`),
                })}{" "}
                · {t("details.aspects.orb", { orb: aspect.orb.toFixed(1) })}
              </span>
              <span className="text-ink-secondary">{t(`details.aspects.meanings.${aspect.type}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default ChartDetails;
