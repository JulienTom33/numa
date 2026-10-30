import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Avatar from "../../../shared/components/ui/Avatar/Avatar";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card from "../../../shared/components/ui/Card/Card";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";
import DiscoveryModeBadge from "../../discovery/DiscoveryModeBadge/DiscoveryModeBadge";
import type { NatalChartErrorCode } from "../../chart/natalChart/natalChart";
import type { MyChartStatus } from "../../chart/useMyChart/useMyChart";
import type { MyChartData } from "../../chart/skyChart/skyChart";
import SegmentedControl from "../../../shared/components/ui/SegmentedControl/SegmentedControl";
import WeeklyHoroscopeCard from "../../horoscope/WeeklyHoroscopeCard/WeeklyHoroscopeCard";
import type { UseWeeklyHoroscopeResult } from "../../horoscope/weeklyHoroscope/useWeeklyHoroscope";
import MonthlyHoroscopeCard from "../../horoscope/MonthlyHoroscopeCard/MonthlyHoroscopeCard";
import type { UseMonthlyHoroscopeResult } from "../../horoscope/monthlyHoroscope/useMonthlyHoroscope";
import HoroscopeCard from "../HoroscopeCard/HoroscopeCard";
import type { UseHoroscopeResult } from "../useHoroscope/useHoroscope";
import EnergyCard from "../EnergyCard/EnergyCard";
import InfluencesSection from "../InfluencesSection/InfluencesSection";
import { readEnergy } from "../todayEnergy/todayEnergy";

interface Props {
  status: MyChartStatus;
  data: MyChartData | null;
  errorCode: NatalChartErrorCode | null;
  horoscope: UseHoroscopeResult;
  weeklyHoroscope: UseWeeklyHoroscopeResult;
  monthlyHoroscope: UseMonthlyHoroscopeResult;
  period: HoroscopePeriod;
  isAnonymous: boolean;
  today: Date;
  onPeriodChange: (period: HoroscopePeriod) => void;
  onRetry: () => void;
  onOpenProfile: () => void;
  onSignUp: () => void;
  onAskQuestion: () => void;
  onOpenEphemeris: () => void;
}

export type HoroscopePeriod = "day" | "week" | "month";

const PERIOD_OPTIONS: HoroscopePeriod[] = ["day", "week", "month"];

function TodayScreen({
  status,
  data,
  errorCode,
  horoscope,
  weeklyHoroscope,
  monthlyHoroscope,
  period,
  isAnonymous,
  today,
  onPeriodChange,
  onRetry,
  onOpenProfile,
  onSignUp,
  onAskQuestion,
  onOpenEphemeris,
}: Props) {
  const { t, i18n } = useTranslation(["today", "chart", "astrology", "horoscope", "ephemeris"]);
  const firstName = data?.summary.firstName ?? null;
  const transits = data?.transits ?? null;
  const energy = transits ? readEnergy(transits) : null;
  const moonUncertain = data?.summary.warnings.includes("moon_sign_uncertain") ?? false;
  const ascendantMissing = data !== null && data.summary.ascendant === null;

  return (
    <section id="today__section--root" className="flex w-full flex-col gap-5 pb-10">
      <TopBar
        id="today__topbar--main"
        leading={
          isAnonymous && (
            <button
              id="today__button--discovery"
              type="button"
              aria-label={t("today:discoveryBadgeLabel")}
              onClick={onSignUp}
              className="rounded-full"
            >
              <DiscoveryModeBadge />
            </button>
          )
        }
        trailing={
          <Avatar
            id="today__avatar--profile"
            name={firstName ?? t("today:avatarFallback")}
            label={t("today:avatarLabel")}
            onClick={onOpenProfile}
          />
        }
      />

      <header className="flex flex-col gap-1">
        <p id="today__text--date" className="text-sm capitalize text-ink-muted">
          {formatDate(today, i18n.language, { dateStyle: "full" })}
        </p>
        <h1 id="today__title--greeting" className="font-display text-2xl font-bold text-ink">
          {firstName ? t("today:greeting", { name: firstName }) : t("today:greetingAnonymous")}
        </h1>
      </header>

      {status === "loading" && (
        <p id="today__status--loading" role="status" className="text-sm text-ink-muted">
          {t("today:loading")}
        </p>
      )}

      {status === "error" && (
        <Callout id="today__callout--error" tone="error">
          <p id="today__text--error">{t(`chart:progress.errors.${errorCode ?? "internal_error"}`)}</p>
          <Button id="today__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("today:retry")}
          </Button>
        </Callout>
      )}

      {status === "ready" && (
        <>
          <EnergyCard energy={energy} onRetry={onRetry} />

          {energy && <InfluencesSection influences={energy.influences} />}

          <SegmentedControl
            id="today__control--period"
            label={t("horoscope:periodLabel")}
            options={PERIOD_OPTIONS.map((value) => ({ value, label: t(`horoscope:period.${value}`) }))}
            value={period}
            onChange={onPeriodChange}
          />

          {period === "day" ? (
            <HoroscopeCard
              status={horoscope.status}
              data={horoscope.data}
              errorCode={horoscope.errorCode}
              onRetry={horoscope.retry}
              onOpenProfile={onOpenProfile}
            />
          ) : period === "week" ? (
            <WeeklyHoroscopeCard
              status={weeklyHoroscope.status}
              data={weeklyHoroscope.data}
              errorCode={weeklyHoroscope.errorCode}
              onRetry={weeklyHoroscope.retry}
              onOpenProfile={onOpenProfile}
            />
          ) : (
            <MonthlyHoroscopeCard
              status={monthlyHoroscope.status}
              data={monthlyHoroscope.data}
              errorCode={monthlyHoroscope.errorCode}
              onRetry={monthlyHoroscope.retry}
              onOpenProfile={onOpenProfile}
            />
          )}

          <Card id="today__card--sources" as="section" tone="surface">
            <h2 id="today__title--sources" className="font-display text-sm font-bold text-ink">
              {t("today:sources.title")}
            </h2>
            <p id="today__text--sources-purpose" className="mt-1 text-sm text-ink-secondary">
              {t("today:sources.purpose")}
            </p>
            <p id="today__text--sources" className="mt-1 text-sm text-ink-secondary">
              {transits
                ? t("today:sources.text", {
                    date: formatDate(new Date(transits.generatedAt), i18n.language, { dateStyle: "long" }),
                  })
                : t("today:sources.unavailable")}
            </p>
            {moonUncertain && (
              <p id="today__text--moon-skipped" className="mt-1 text-xs text-ink-muted">
                {t("today:sources.moonSkipped")}
              </p>
            )}
            {ascendantMissing && (
              <p id="today__text--ascendant-skipped" className="mt-1 text-xs text-ink-muted">
                {t("today:sources.ascendantSkipped")}
              </p>
            )}
          </Card>
        </>
      )}

      <Card id="today__card--ephemeris" as="section" tone="sky" padding="lg">
        <h2 id="today__title--ephemeris" className="font-display text-base font-bold text-ink">
          {t("ephemeris:entry.title")}
        </h2>
        <p id="today__text--ephemeris" className="mt-1 text-sm text-ink-secondary">
          {t("ephemeris:entry.description")}
        </p>
        <Button
          id="today__button--ephemeris"
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onOpenEphemeris}
        >
          {t("ephemeris:entry.action")}
        </Button>
      </Card>

      <Card id="today__card--chat" as="section" tone="white" padding="lg">
        <h2 id="today__title--chat" className="font-display text-base font-bold text-ink">
          {t("today:chat.title")}
        </h2>
        <p id="today__text--chat" className="mt-1 text-sm text-ink-secondary">
          {t("today:chat.description")}
        </p>
        <Button id="today__button--chat" type="button" className="mt-4" onClick={onAskQuestion}>
          {t("today:chat.action")}
        </Button>
      </Card>
    </section>
  );
}

export default TodayScreen;
