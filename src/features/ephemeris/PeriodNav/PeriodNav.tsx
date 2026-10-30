import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Button from "../../../shared/components/ui/Button/Button";
import SegmentedControl from "../../../shared/components/ui/SegmentedControl/SegmentedControl";
import { toUtcDate, type DateRange, type EphemerisPeriod } from "../ephemerisPeriod/ephemerisPeriod";

interface Props {
  period: EphemerisPeriod;
  range: DateRange;
  onPeriodChange: (period: EphemerisPeriod) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const PERIODS: EphemerisPeriod[] = ["day", "week", "month"];

function rangeLabel(period: EphemerisPeriod, range: DateRange, language: string): string {
  const options = { timeZone: "UTC" } as const;
  if (period === "day") return formatDate(toUtcDate(range.from), language, { ...options, dateStyle: "full" });
  if (period === "month") {
    return formatDate(toUtcDate(range.from), language, { ...options, month: "long", year: "numeric" });
  }
  return `${formatDate(toUtcDate(range.from), language, { ...options, dateStyle: "long" })} – ${formatDate(
    toUtcDate(range.to),
    language,
    { ...options, dateStyle: "long" },
  )}`;
}

function PeriodNav({ period, range, onPeriodChange, onPrevious, onNext, onToday }: Props) {
  const { t, i18n } = useTranslation("ephemeris");
  const label = rangeLabel(period, range, i18n.language);

  return (
    <div id="ephemeris__nav--period" className="flex flex-col gap-3">
      <SegmentedControl
        id="ephemeris__control--period"
        label={t("period.label")}
        options={PERIODS.map((value) => ({ value, label: t(`period.${value}`) }))}
        value={period}
        onChange={onPeriodChange}
      />
      <div role="group" aria-label={t("nav.label")} className="flex flex-wrap items-center gap-2">
        <Button id="ephemeris__button--previous" type="button" variant="outline" size="sm" onClick={onPrevious}>
          {t("nav.previous")}
        </Button>
        <Button id="ephemeris__button--next" type="button" variant="outline" size="sm" onClick={onNext}>
          {t("nav.next")}
        </Button>
        <Button id="ephemeris__button--today" type="button" variant="soft" size="sm" onClick={onToday}>
          {t("nav.today")}
        </Button>
      </div>
      <p id="ephemeris__text--range" className="font-display text-base font-bold capitalize text-ink">
        {label}
      </p>
      <p id="ephemeris__status--announce" role="status" aria-live="polite" className="sr-only">
        {t("announce", { range: label })}
      </p>
    </div>
  );
}

export default PeriodNav;
