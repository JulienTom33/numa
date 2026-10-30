import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import EmptyState from "../../../shared/components/ui/EmptyState/EmptyState";
import Select from "../../../shared/components/ui/Select/Select";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";
import type { LoadStatus } from "../../../shared/queryClient/loadStatus/loadStatus";
import AspectsCard from "../AspectsCard/AspectsCard";
import type { Ephemeris } from "../ephemeris/ephemeris";
import EventsCard from "../EventsCard/EventsCard";
import {
  listDays,
  toUtcDate,
  type DateRange,
  type EphemerisPeriod,
} from "../ephemerisPeriod/ephemerisPeriod";
import MoonPhaseCard from "../MoonPhaseCard/MoonPhaseCard";
import PeriodNav from "../PeriodNav/PeriodNav";
import PositionsTable from "../PositionsTable/PositionsTable";
import SourceCard from "../SourceCard/SourceCard";

interface Props {
  status: LoadStatus;
  data: Ephemeris | null;
  period: EphemerisPeriod;
  range: DateRange;
  selectedDay: string;
  onBack: () => void;
  onPeriodChange: (period: EphemerisPeriod) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectDay: (day: string) => void;
  onRetry: () => void;
}

function EphemerisScreen({
  status,
  data,
  period,
  range,
  selectedDay,
  onBack,
  onPeriodChange,
  onPrevious,
  onNext,
  onToday,
  onSelectDay,
  onRetry,
}: Props) {
  const { t, i18n } = useTranslation("ephemeris");
  const day = data?.days.find((candidate) => candidate.date === selectedDay) ?? null;
  const isEmpty = status === "ready" && (data === null || day === null);

  return (
    <section id="ephemeris__section--root" className="flex w-full flex-col gap-5 pb-10">
      <TopBar id="ephemeris__topbar--main" onBack={onBack} backLabel={t("back")} />

      <header className="flex flex-col gap-1">
        <h1 id="ephemeris__title--main" className="font-display text-2xl font-bold text-ink">
          {t("title")}
        </h1>
        <p id="ephemeris__text--intro" className="text-sm text-ink-secondary">
          {t("intro")}
        </p>
        <p id="ephemeris__text--utc" className="text-xs text-ink-muted">
          {t("utcNote")}
        </p>
      </header>

      <PeriodNav
        period={period}
        range={range}
        onPeriodChange={onPeriodChange}
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
      />

      {period !== "day" && (
        <Select
          id="ephemeris__select--day"
          label={t("daySelect")}
          value={selectedDay}
          options={listDays(range).map((value) => ({
            value,
            label: formatDate(toUtcDate(value), i18n.language, { dateStyle: "full", timeZone: "UTC" }),
          }))}
          onChange={(event) => onSelectDay(event.target.value)}
        />
      )}

      {status === "loading" && (
        <p id="ephemeris__status--loading" role="status" className="text-sm text-ink-muted">
          {t("loading")}
        </p>
      )}

      {status === "error" && (
        <Callout id="ephemeris__callout--error" tone="error">
          <p id="ephemeris__text--error">{t("error.text")}</p>
          <Button id="ephemeris__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("error.retry")}
          </Button>
        </Callout>
      )}

      {isEmpty && (
        <EmptyState id="ephemeris__empty--root" title={t("empty.title")} description={t("empty.description")} />
      )}

      {status === "ready" && data && day && (
        <>
          <PositionsTable day={day} />
          <MoonPhaseCard moon={day.moon} />
          <AspectsCard key={day.date} aspects={day.aspects} />
          <EventsCard events={data.events} />
          <SourceCard engine={data.engine} />
        </>
      )}
    </section>
  );
}

export default EphemerisScreen;
