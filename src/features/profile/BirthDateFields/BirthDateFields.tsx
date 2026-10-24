import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select, { type SelectOption } from "../../../shared/components/ui/Select/Select";
import { formatDate } from "../../../i18n/format/format";
import { MIN_BIRTH_YEAR, type BirthDateParts } from "../../onboarding/birthData/birthData";

interface Props {
  id: string;
  value: BirthDateParts;
  onChange: (value: BirthDateParts) => void;
  error?: string;
  today?: Date;
}

const dayOptions: SelectOption[] = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

function monthOptions(language: string): SelectOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const name = formatDate(new Date(Date.UTC(2000, index, 1)), language, { month: "long", timeZone: "UTC" });
    return { value: String(index + 1), label: name.charAt(0).toLocaleUpperCase(language) + name.slice(1) };
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
