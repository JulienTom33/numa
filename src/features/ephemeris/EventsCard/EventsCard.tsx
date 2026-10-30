import { useTranslation } from "react-i18next";
import Card from "../../../shared/components/ui/Card/Card";
import Disclosure from "../../../shared/components/ui/Disclosure/Disclosure";
import type { Ephemeris } from "../ephemeris/ephemeris";
import { buildEvents, type EphemerisEventItem } from "../ephemerisEvents/ephemerisEvents";
import { formatParisDate, formatParisTime } from "../parisTime/parisTime";

interface Props {
  events: Ephemeris["events"];
}

const MOON_GROUP_MIN = 3;

function isMoonIngress(item: EphemerisEventItem): boolean {
  return item.kind === "ingress" && item.body === "moon";
}

function EventsCard({ events }: Props) {
  const { t, i18n } = useTranslation(["ephemeris", "astrology"]);
  const allItems = buildEvents({ events });
  const moonIngresses = allItems.filter(isMoonIngress);
  const grouped = moonIngresses.length >= MOON_GROUP_MIN;
  const items = grouped ? allItems.filter((item) => !isMoonIngress(item)) : allItems;

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

  const renderItem = (item: EphemerisEventItem) => (
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
          {items.map(renderItem)}
        </ul>
      )}
      {grouped && (
        <Disclosure
          id="ephemeris__disclosure--moon-ingresses"
          summary={t("ephemeris:events.moonIngressesSummary", { count: moonIngresses.length })}
          className="mt-3"
        >
          <p id="ephemeris__text--moon-ingresses-note" className="text-sm text-ink-muted">
            {t("ephemeris:events.moonIngressesNote")}
          </p>
          <ul id="ephemeris__list--moon-ingresses" className="mt-2 flex flex-col gap-3 text-sm">
            {moonIngresses.map(renderItem)}
          </ul>
        </Disclosure>
      )}
    </Card>
  );
}

export default EventsCard;
