import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { buildOnboardingSummary } from "../../../i18n/messages/onboarding/onboarding";
import Avatar from "../../../shared/components/ui/Avatar/Avatar";
import Badge from "../../../shared/components/ui/Badge/Badge";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import ListRow from "../../../shared/components/ui/ListRow/ListRow";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";
import ChartDetails from "../../chart/ChartDetails/ChartDetails";
import type { MyChartData } from "../../chart/skyChart/skyChart";
import { maskEmail } from "../maskEmail/maskEmail";
import type { ProfileData } from "../profileData/profileData";

interface Props {
  profile: ProfileData;
  email: string | null;
  sun: ZodiacSign | null;
  ascendant: ZodiacSign | null;
  chart?: MyChartData | null;
  saved: boolean;
  onEdit: () => void;
  onOpenHistory: () => void;
}

interface RowProps {
  id: string;
  label: string;
  children: ReactNode;
}

function Row({ id, label, children }: RowProps) {
  return (
    <div id={id} className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-ink-secondary">{label}</dt>
      <dd className="text-right font-display text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

function ProfileScreen({ profile, email, sun, ascendant, chart = null, saved, onEdit, onOpenHistory }: Props) {
  const { t, i18n } = useTranslation("profile");
  const { t: tOnboarding } = useTranslation("onboarding");
  const { t: tAstrology } = useTranslation("astrology");
  const summary = buildOnboardingSummary(
    { firstName: profile.firstName, birthDate: profile.birth.birthDate, birthTime: profile.birth.birthTime, birthPlace: profile.birth.birthPlace },
    tOnboarding,
    i18n.language,
  );
  const placement = (key: "sun" | "ascendant", sign: ZodiacSign | null) =>
    sign ? t(`placements.${key}`, { sign: tAstrology(`signs.${sign}`) }) : t("placements.unknown");

  return (
    <div id="profile__container--root" className="flex w-full flex-col gap-6">
      <header id="profile__header--main" className="flex flex-col items-center gap-3 text-center">
        <Avatar id="profile__avatar--main" name={profile.firstName} size="lg" label={t("avatarLabel", { name: profile.firstName })} />
        <h1 id="profile__title--main" className="font-display text-title font-bold text-ink">
          {profile.firstName}
        </h1>
        <p id="profile__text--placements" className="text-sm text-ink-secondary">
          {placement("sun", sun)} · {placement("ascendant", ascendant)}
        </p>
        <Badge id="profile__badge--status" tone={profile.status === "anonymous" ? "violet" : "sage"}>
          {t(`status.${profile.status}`)}
        </Badge>
      </header>
      {saved && (
        <Callout id="profile__callout--saved" tone="success">
          <span role="status">{t("success.saved")}</span>
        </Callout>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <section id="profile__section--info" aria-labelledby="profile__title--info" className="flex flex-col gap-2">
          <h2 id="profile__title--info" className="font-display text-sm font-bold text-ink">
            {t("info.title")}
          </h2>
          <dl className="divide-y divide-line rounded-card border border-line bg-white">
            <Row id="profile__row--first-name" label={t("info.firstName")}>{profile.firstName}</Row>
            <Row id="profile__row--email" label={t("info.email")}>{email ? maskEmail(email) : t("info.emailNone")}</Row>
            <Row id="profile__row--birth-date" label={t("info.birthDate")}>{summary.birthDate}</Row>
            <Row id="profile__row--birth-time" label={t("info.birthTime")}>{summary.birthTime}</Row>
            <Row id="profile__row--birth-place" label={t("info.birthPlace")}>{profile.birth.birthPlace.label}</Row>
          </dl>
        </section>
        <section id="profile__section--preferences" aria-labelledby="profile__title--preferences" className="flex flex-col gap-2">
          <h2 id="profile__title--preferences" className="font-display text-sm font-bold text-ink">
            {t("preferences.title")}
          </h2>
          <dl className="divide-y divide-line rounded-card border border-line bg-white">
            <Row id="profile__row--language" label={t("preferences.language")}>{t(`languages.${profile.language}`)}</Row>
            <Row id="profile__row--tone" label={t("preferences.tone")}>{t(`tones.${profile.tone}`)}</Row>
          </dl>
        </section>
      </div>
      {chart && <ChartDetails idPrefix="profile" summary={chart.summary} natal={chart.natal} />}
      <div className="rounded-card border border-line bg-white">
        <ListRow id="profile__row--history" label={t("history.open")} onClick={onOpenHistory} />
      </div>
      <Button id="profile__button--edit" variant="outline" fullWidth onClick={onEdit}>
        {t("edit.open")}
      </Button>
    </div>
  );
}

export default ProfileScreen;
