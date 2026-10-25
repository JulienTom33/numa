import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "../../../shared/components/ui/Select/Select";
import type { BirthDateParts } from "../../onboarding/birthData/birthData";
import { dayOptions, monthOptions, toSelectValue, yearOptions } from "../../onboarding/DateStep/DateStep";

interface Props {
  id: string;
  value: BirthDateParts;
  onChange: (value: BirthDateParts) => void;
  error?: string;
  today?: Date;
}

function BirthDateFields({ id, value, onChange, error, today = new Date() }: Props) {
  const { t, i18n } = useTranslation("profile");
  const months = useMemo(() => monthOptions(i18n.language), [i18n.language]);
  const currentYear = today.getFullYear();
  const years = useMemo(() => yearOptions(currentYear), [currentYear]);

  return (
    <fieldset id={id} className="flex flex-col gap-2">
      <legend className="mb-1.5 font-display text-sm font-semibold text-ink">{t("edit.birthDate")}</legend>
      <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
        <Select
          id={`${id}-day`}
          label={t("dateParts.day")}
          hideLabel
          placeholder={t("dateParts.day")}
          options={dayOptions}
          value={toSelectValue(value.day)}
          onChange={(event) => onChange({ ...value, day: Number(event.target.value) })}
        />
        <Select
          id={`${id}-month`}
          label={t("dateParts.month")}
          hideLabel
          placeholder={t("dateParts.month")}
          options={months}
          value={toSelectValue(value.month)}
          onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
        />
        <Select
          id={`${id}-year`}
          label={t("dateParts.year")}
          hideLabel
          placeholder={t("dateParts.year")}
          options={years}
          value={toSelectValue(value.year)}
          onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-coral-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default BirthDateFields;
