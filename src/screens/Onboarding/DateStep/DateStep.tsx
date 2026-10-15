import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Callout from "../../../components/ui/Callout/Callout";
import Select from "../../../components/ui/Select/Select";
import type { SelectOption } from "../../../components/ui/Select/Select";
import { formatDate } from "../../../i18n/format";
import { MIN_BIRTH_YEAR, validateBirthDateParts } from "../../../lib/birthData";
import type { BirthDateParts } from "../../../lib/birthData";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";

interface Props {
  value: BirthDateParts;
  onChange: (value: BirthDateParts) => void;
  onContinue: () => void;
  onBack: () => void;
  discoveryMode?: boolean;
  /** Injectable pour des tests et stories déterministes (années proposées, dates futures). */
  today?: Date;
}

const dayOptions: SelectOption[] = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

function monthName(month: number, language: string): string {
  return formatDate(new Date(Date.UTC(2000, month - 1, 1)), language, {
    month: "long",
    timeZone: "UTC",
  });
}

function monthOptions(language: string): SelectOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const name = monthName(index + 1, language);
    return {
      value: String(index + 1),
      label: name.charAt(0).toLocaleUpperCase(language) + name.slice(1),
    };
  });
}

function yearOptions(currentYear: number): SelectOption[] {
  return Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  });
}

function toSelectValue(part: number | null): string {
  return part === null ? "" : String(part);
}

/**
 * Étape 2 : date de naissance en trois listes Jour / Mois / Année.
 * Les 31 jours restent proposés quel que soit le mois : une combinaison impossible est
 * signalée explicitement plutôt que corrigée en silence.
 */
function DateStep({ value, onChange, onContinue, onBack, discoveryMode, today = new Date() }: Props) {
  const { t, i18n } = useTranslation("onboarding");
  const months = useMemo(() => monthOptions(i18n.language), [i18n.language]);
  const { isoDate } = validateBirthDateParts(value, today);
  const isComplete = value.day !== null && value.month !== null && value.year !== null;
  const isInvalid = isComplete && isoDate === null;

  return (
    <OnboardingStepLayout
      id="date-step__form--main"
      step={2}
      totalSteps={5}
      title={t("date.title")}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={isoDate !== null}
      discoveryMode={discoveryMode}
    >
      <fieldset id="date-step__fieldset--birth-date" className="flex flex-col gap-4">
        <legend className="sr-only">{t("date.legend")}</legend>
        <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
          <Select
            id="date-step__select--day"
            label={t("date.day")}
            placeholder={t("date.day")}
            options={dayOptions}
            value={toSelectValue(value.day)}
            onChange={(event) => onChange({ ...value, day: Number(event.target.value) })}
          />
          <Select
            id="date-step__select--month"
            label={t("date.month")}
            placeholder={t("date.month")}
            options={months}
            value={toSelectValue(value.month)}
            onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
          />
          <Select
            id="date-step__select--year"
            label={t("date.year")}
            placeholder={t("date.year")}
            options={yearOptions(today.getFullYear())}
            value={toSelectValue(value.year)}
            onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
          />
        </div>
      </fieldset>
      <div aria-live="polite">
        {isoDate !== null && value.day !== null && value.month !== null && value.year !== null && (
          <Callout id="date-step__callout--confirmation" tone="success">
            {t("date.confirmation", {
              day: t("date.dayOrdinal", { count: value.day, ordinal: true }),
              month: monthName(value.month, i18n.language),
              year: value.year,
            })}
          </Callout>
        )}
      </div>
      {isInvalid && (
        <Callout id="date-step__callout--invalid" tone="error">
          {t("date.invalid")}
        </Callout>
      )}
    </OnboardingStepLayout>
  );
}

export default DateStep;
