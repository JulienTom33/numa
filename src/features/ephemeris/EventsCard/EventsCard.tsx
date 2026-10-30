import { useTranslation } from "react-i18next";
import Card from "../../../shared/components/ui/Card/Card";
import type { Ephemeris } from "../ephemeris/ephemeris";
import { buildEvents, type EphemerisEventItem } from "../ephemerisEvents/ephemerisEvents";
import { formatParisDate, formatParisTime } from "../parisTime/parisTime";

interface Props {
  events: Ephemeris["events"];
}

function EventsCard({ events }: Props) {
  const { t, i18n } = useTranslation(["ephemeris", "astrology"]);
  const items = buildEvents({ events });

  const describe = (item: EphemerisEventItem): string => {
    if (item.kind === "ingress") {
      return t("ephemeris:events.ingress", {
        body: t(`astrology:bodies.${item.body}`),
        from: t(`astrology:signs.${item.from}`),
        to: t(`astrology:signs.${item.to}`),
      });
    }
    if (item.kind === "station") {
      return t(`ephemeris:events.station.${item.type}`, {
        body: t(`astrology:bodies.${item.body}`),
        sign: t(`astrology:signs.${item.sign}`),
      });
    }
    if (item.kind === "moonPhase") return t(`ephemeris:events.moonPhase.${item.phase}`);
    return t("ephemeris:events.eclipse", {
      eclipse: t(`ephemeris:events.eclipseBody.${item.body}`),
      kind: t(`ephemeris:events.eclipseKind.${item.eclipseKind}`),
    });
  };

  return (
    <Card id="ephemeris__card--events" as="section" tone="white" padding="lg">
      <h2 id="ephemeris__title--events" className="font-display text-base font-bold text-ink">
        {t("ephemeris:events.title")}
      </h2>
      <p id="ephemeris__text--events-intro" className="mt-1 text-sm text-ink-secondary">
        {t("ephemeris:events.intro")}
      </p>
      {items.length === 0 ? (
        <p id="ephemeris__text--events-none" className="mt-3 text-sm text-ink-muted">
          {t("ephemeris:events.none")}
        </p>
      ) : (
        <ul id="ephemeris__list--events" className="mt-3 flex flex-col gap-3 text-sm">
          {items.map((item) => {
            return (
              <li key={item.id} id={`ephemeris__item--event-${item.id}`} className="flex flex-col">
                <span className="font-semibold text-ink">{describe(item)}</span>
                <time dateTime={item.at} className="text-ink-secondary">
                  {t("ephemeris:events.at", {
                    date: formatParisDate(item.at, i18n.language),
                    time: formatParisTime(item.at, i18n.language),
                  })}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default EventsCard;
