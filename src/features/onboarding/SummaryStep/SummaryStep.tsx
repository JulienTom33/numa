import { Trans, useTranslation } from "react-i18next";
import Callout from "../../../shared/components/ui/Callout/Callout";
import TextLink from "../../../shared/components/ui/TextLink/TextLink";
import { formatDate } from "../../../i18n/format/format";
import type { BirthTimeInput, OnboardingData } from "../birthData/birthData";
import type { OnboardingStep } from "../onboardingStore/onboardingStore";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";

interface Props {
  data: OnboardingData;
  onEdit: (step: OnboardingStep) => void;
  onConfirm: () => void;
  onBack?: () => void;
  discoveryMode?: boolean;
  error?: string | null;
  saving?: boolean;
}

type SummaryField = "firstName" | "birthDate" | "birthTime" | "birthPlace";

interface SummaryRow {
  field: SummaryField;
  slug: string;
  step: OnboardingStep;
  value: string;
  detail?: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };

function formatIsoDate(isoDate: string | null, language: string): string | null {
  const match = isoDate ? ISO_DATE.exec(isoDate) : null;
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return formatDate(date, language, DATE_OPTIONS);
}

function SummaryStep({ data, onEdit, onConfirm, onBack, discoveryMode, error, saving }: Props) {
  const { t, i18n } = useTranslation("onboarding");
  const missing = t("summary.missing");

  const formattedDate = formatIsoDate(data.birthDate, i18n.language) ?? missing;

  const describeTime = ({ precision, time, margin }: BirthTimeInput): string => {
    if (precision === "unknown") return t("summary.time.unknown");
    if (precision === "exact" && time) return t("summary.time.exact", { time });
    if (precision === "approximate" && time && margin) {
      return t("summary.time.approximate", { time, margin: t(`time.margins.${margin}`) });
    }
    return missing;
  };

  const rows: SummaryRow[] = [
    { field: "firstName", slug: "first-name", step: 1, value: data.firstName.trim() || missing },
    { field: "birthDate", slug: "birth-date", step: 2, value: formattedDate },
    { field: "birthTime", slug: "birth-time", step: 3, value: describeTime(data.birthTime) },
    {
      field: "birthPlace",
      slug: "birth-place",
      step: 4,
      value: data.birthPlace?.label ?? missing,
      detail: data.birthPlace ? t("summary.timezone", { timezone: data.birthPlace.timezone }) : undefined,
    },
  ];

  const precision = data.birthTime.precision;
  const warning = precision === "approximate" || precision === "unknown" ? t(`summary.warnings.${precision}`) : null;

  return (
    <OnboardingStepLayout
      id="summary-step__form--main"
      step={5}
      totalSteps={5}
      title={t("summary.title")}
      onBack={onBack}
      onContinue={onConfirm}
      canContinue
      continueLabel={t("summary.confirm")}
      discoveryMode={discoveryMode}
      error={error}
      saving={saving}
    >
      <dl id="summary-step__list--fields" className="flex flex-col divide-y divide-line rounded-card bg-white">
        {rows.map((row) => {
          const label = t(`summary.fields.${row.field}`);
          return (
            <div
              key={row.field}
              id={`summary-step__item--${row.slug}`}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <dt className="text-sm text-ink-secondary">{label}</dt>
                <dd id={`summary-step__value--${row.slug}`} className="font-display font-semibold">
                  {row.value}
                </dd>
                {row.detail && (
                  <dd id={`summary-step__detail--${row.slug}`} className="text-sm text-ink-secondary">
                    {row.detail}
                  </dd>
                )}
              </div>
              <TextLink id={`summary-step__link--edit-${row.slug}`} onClick={() => onEdit(row.step)} className="text-sm">
                <Trans
                  t={t}
                  i18nKey="summary.edit"
                  values={{ field: label }}
                  components={{ hidden: <span className="sr-only" /> }}
                />
              </TextLink>
            </div>
          );
        })}
      </dl>
      {warning && (
        <Callout id="summary-step__callout--time-warning" tone="warning">
          {warning}
        </Callout>
      )}
    </OnboardingStepLayout>
  );
}

export default SummaryStep;
