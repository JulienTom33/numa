import { useTranslation } from "react-i18next";
import { ASPECT_TYPES, BODY_IDS } from "../../../../shared/contracts/natalChart/natalChart.ts";
import { ECLIPSE_BODIES, ECLIPSE_KINDS, MAJOR_MOON_PHASES, STATION_TYPES } from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import { ZODIAC_SIGNS } from "../../../../shared/zodiac/zodiac.ts";
import { formatDate } from "../../../i18n/format/format";
import type { MonthlyBasis, MonthlyEvent } from "../monthlyHoroscope/monthlyHoroscope";

interface Props {
  basis: MonthlyBasis;
}

function pick<T extends string>(list: readonly T[], value: string): T | undefined {
  return list.find((item) => item === value);
}

function MonthlyBasisBlock({ basis }: Props) {
  const { t, i18n } = useTranslation(["horoscope", "astrology"]);
  const format = (iso: string) => formatDate(new Date(iso), i18n.language, { dateStyle: "long" });

  const eventLabel = (event: MonthlyEvent): string | null => {
    const body = pick(BODY_IDS, event.body);
    switch (event.kind) {
      case "ingress": {
        const sign = pick(ZODIAC_SIGNS, event.detail);
        return body && sign
          ? t("horoscope:weekly.events.ingress", { body: t(`astrology:bodies.${body}`), sign: t(`astrology:signs.${sign}`) })
          : null;
      }
      case "station": {
        const station = pick(STATION_TYPES, event.detail);
        return body && station
          ? t(`horoscope:weekly.events.station.${station}`, { body: t(`astrology:bodies.${body}`) })
          : null;
      }
      case "moonPhase": {
        const phase = pick(MAJOR_MOON_PHASES, event.detail);
        return phase ? t(`horoscope:weekly.events.moonPhase.${phase}`) : null;
      }
      case "eclipse": {
        const eclipseBody = pick(ECLIPSE_BODIES, event.body);
        const kind = pick(ECLIPSE_KINDS, event.detail);
        return eclipseBody && kind
          ? t(`horoscope:weekly.events.eclipse.${eclipseBody}`, {
              kind: t(`horoscope:weekly.events.eclipseKinds.${kind}`),
            })
          : null;
      }
    }
  };

  const events = basis.events.flatMap((event) => {
    const label = eventLabel(event);
    return label ? [{ event, label }] : [];
  });

  const aspects = basis.aspects.flatMap((aspect) => {
    const bodyA = pick(BODY_IDS, aspect.bodyA);
    const bodyB = pick(BODY_IDS, aspect.bodyB);
    const type = pick(ASPECT_TYPES, aspect.type);
    return bodyA && bodyB && type ? [{ aspect, bodyA, bodyB, type }] : [];
  });

  return (
    <div id="monthly-horoscope__section--basis" className="flex flex-col gap-2">
      {events.length > 0 && (
        <>
          <h3 id="monthly-horoscope__title--events" className="font-display text-sm font-bold text-violet-ink">
            {t("horoscope:monthly.basis.eventsTitle")}
          </h3>
          <ul id="monthly-horoscope__list--events" className="list-disc pl-5">
            {events.map(({ event, label }) => (
              <li
                key={`${event.kind}-${event.body}-${event.at}`}
                id={`monthly-horoscope__item--event-${event.kind}-${event.body}-${event.at}`}
              >
                {label} ({format(event.at)})
              </li>
            ))}
          </ul>
        </>
      )}
      {aspects.length > 0 && (
        <>
          <h3 id="monthly-horoscope__title--aspects" className="font-display text-sm font-bold text-violet-ink">
            {t("horoscope:monthly.basis.aspectsTitle")}
          </h3>
          <ul id="monthly-horoscope__list--aspects" className="list-disc pl-5">
            {aspects.map(({ aspect, bodyA, bodyB, type }) => (
              <li
                key={`${bodyA}-${bodyB}-${type}`}
                id={`monthly-horoscope__item--aspect-${bodyA}-${bodyB}-${type}`}
              >
                {t(`horoscope:weekly.aspects.${type}`, {
                  a: t(`astrology:bodies.${bodyA}`),
                  b: t(`astrology:bodies.${bodyB}`).toLowerCase(),
                })}{" "}
                {t("horoscope:weekly.basis.orb", { orb: aspect.orb })}
              </li>
            ))}
          </ul>
        </>
      )}
      {events.length === 0 && aspects.length === 0 && (
        <p id="monthly-horoscope__text--empty">{t("horoscope:monthly.basis.empty")}</p>
      )}
      {!basis.ascendantKnown && (
        <p id="monthly-horoscope__text--ascendant-unknown" className="text-xs text-ink-muted">
          {t("horoscope:weekly.basis.ascendantUnknown")}
        </p>
      )}
    </div>
  );
}

export default MonthlyBasisBlock;
