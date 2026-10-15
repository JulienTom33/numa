import Callout from "../../../components/ui/Callout/Callout";
import Select from "../../../components/ui/Select/Select";
import type { SelectOption } from "../../../components/ui/Select/Select";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";
import {
  FRENCH_MONTHS,
  MIN_BIRTH_YEAR,
  formatBirthDate,
  isComplete,
  isValidBirthDate,
} from "./birthDateParts";
import type { BirthDateParts } from "./birthDateParts";

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

const monthOptions: SelectOption[] = FRENCH_MONTHS.map((month, index) => ({
  value: String(index + 1),
  label: month.charAt(0).toUpperCase() + month.slice(1),
}));

function yearOptions(currentYear: number): SelectOption[] {
  return Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  });
}

function DateStep({ value, onChange, onContinue, onBack, discoveryMode, today = new Date() }: Props) {
  const isValid = isValidBirthDate(value, today);
  // Les 31 jours restent proposés quel que soit le mois : une combinaison impossible est
  // signalée explicitement plutôt que corrigée en silence.
  const isInvalid = isComplete(value) && !isValid;

  return (
    <OnboardingStepLayout
      id="date-step__form--main"
      step={2}
      totalSteps={5}
      title="Quand êtes-vous né(e) ?"
      onBack={onBack}
      onContinue={onContinue}
      canContinue={isValid}
      discoveryMode={discoveryMode}
    >
      <fieldset id="date-step__fieldset--birth-date" className="flex flex-col gap-4">
        <legend className="sr-only">Date de naissance</legend>
        <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
          <Select
            id="date-step__select--day"
            label="Jour"
            placeholder="Jour"
            options={dayOptions}
            value={value.day}
            onChange={(event) => onChange({ ...value, day: event.target.value })}
          />
          <Select
            id="date-step__select--month"
            label="Mois"
            placeholder="Mois"
            options={monthOptions}
            value={value.month}
            onChange={(event) => onChange({ ...value, month: event.target.value })}
          />
          <Select
            id="date-step__select--year"
            label="Année"
            placeholder="Année"
            options={yearOptions(today.getFullYear())}
            value={value.year}
            onChange={(event) => onChange({ ...value, year: event.target.value })}
          />
        </div>
      </fieldset>
      <div aria-live="polite">
        {isValid && (
          <Callout id="date-step__callout--confirmation" tone="success">
            Date enregistrée : {formatBirthDate(value)}
          </Callout>
        )}
      </div>
      {isInvalid && (
        <Callout id="date-step__callout--invalid" tone="error">
          Cette date n'existe pas ou n'est pas encore passée. Vérifiez le jour et le mois.
        </Callout>
      )}
    </OnboardingStepLayout>
  );
}

export default DateStep;
