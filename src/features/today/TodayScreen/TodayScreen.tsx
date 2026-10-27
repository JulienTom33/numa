import { useTranslation } from "react-i18next";
import { formatDate } from "../../../i18n/format/format";
import Avatar from "../../../shared/components/ui/Avatar/Avatar";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import Card, { type CardTone } from "../../../shared/components/ui/Card/Card";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";
import { cx } from "../../../shared/cx/cx";
import DiscoveryModeBadge from "../../discovery/DiscoveryModeBadge/DiscoveryModeBadge";
import type { NatalChartErrorCode } from "../../chart/natalChart/natalChart";
import type { MyChartStatus } from "../../chart/useMyChart/useMyChart";
import type { MyChartData } from "../../chart/skyChart/skyChart";
import HoroscopeCard from "../HoroscopeCard/HoroscopeCard";
import type { UseHoroscopeResult } from "../useHoroscope/useHoroscope";
import { readEnergy, type Influence, type IntensityLevel } from "../todayEnergy/todayEnergy";

interface Props {
  status: MyChartStatus;
  data: MyChartData | null;
  errorCode: NatalChartErrorCode | null;
  horoscope: UseHoroscopeResult;
  isAnonymous: boolean;
  today: Date;
  onRetry: () => void;
  onOpenProfile: () => void;
  onSignUp: () => void;
  onAskQuestion: () => void;
}

const INFLUENCE_TONES: Record<Influence, CardTone> = {
  relations: "coral",
  work: "sky",
  energy: "gold",
};

const INFLUENCE_BAR: Record<Influence, string> = {
  relations: "bg-coral",
  work: "bg-sky",
  energy: "bg-gold",
};

const LEVEL_SEGMENTS: Record<IntensityLevel, number> = { calm: 1, moderate: 2, strong: 3 };
const SEGMENTS = [1, 2, 3];

function TodayScreen({
  status,
  data,
  errorCode,
  horoscope,
  isAnonymous,
  today,
  onRetry,
  onOpenProfile,
  onSignUp,
  onAskQuestion,
}: Props) {
  const { t, i18n } = useTranslation(["today", "chart", "astrology"]);
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
          <Card id="today__card--energy" as="section" tone="violet" padding="lg">
            <h2 id="today__title--energy" className="font-display text-lg font-bold text-violet-ink">
              {t("today:energy.title")}
            </h2>
            {energy ? (
              <p id="today__text--energy" className="mt-3 text-base text-ink">
                {energy.headline
                  ? t("today:energy.headline", {
                      aspect: t(`chart:myChart.transits.aspects.${energy.headline.type}`, {
                        planet: t(`astrology:bodies.${energy.headline.transitBody}`),
                        point: t(`astrology:placement.${energy.headline.natalPoint}`).toLowerCase(),
                      }),
                    })
                  : t("today:energy.calm")}
              </p>
            ) : (
              <div className="mt-3 flex flex-col items-start gap-3">
                <p id="today__text--energy-unavailable" className="text-sm text-ink">
                  {t("today:energy.unavailable")}
                </p>
                <Button id="today__button--energy-retry" type="button" variant="outline" size="sm" onClick={onRetry}>
                  {t("today:retry")}
                </Button>
              </div>
            )}
          </Card>

          {energy && (
            <section aria-labelledby="today__title--influences" className="flex flex-col gap-3">
              <h2 id="today__title--influences" className="font-display text-base font-bold text-ink">
                {t("today:influences.title")}
              </h2>
              <ul id="today__list--influences" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {energy.influences.map(({ influence, level }) => (
                  <li key={influence} id={`today__item--influence-${influence}`}>
                    <Card id={`today__card--influence-${influence}`} tone={INFLUENCE_TONES[influence]}>
                      <p className="font-display text-sm font-bold">{t(`today:influences.${influence}`)}</p>
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
                        {t(`today:influences.levels.${level}`)}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <HoroscopeCard
            status={horoscope.status}
            data={horoscope.data}
            errorCode={horoscope.errorCode}
            onRetry={horoscope.retry}
            onOpenProfile={onOpenProfile}
          />

          <Card id="today__card--sources" as="section" tone="surface">
            <h2 id="today__title--sources" className="font-display text-sm font-bold text-ink">
              {t("today:sources.title")}
            </h2>
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
