import { useTranslation } from "react-i18next";
import { cx } from "../../../lib/cx";
import { fieldLabel, focusWithinRing } from "../styles";
import { ZODIAC_SIGNS, type ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";

interface Props {
  id: string;
  label: string;
  value: ZodiacSign | null;
  onChange: (sign: ZodiacSign) => void;
  hideLabel?: boolean;
}

const selectedClasses = "border-violet bg-violet-soft text-violet-ink";
const idleClasses = "border-line bg-white text-ink hover:border-violet";

function SignGrid({ id, label, value, onChange, hideLabel = false }: Props) {
  const { t } = useTranslation("astrology");

  return (
    <fieldset id={id}>
      <legend className={cx("mb-3", fieldLabel, hideLabel && "sr-only")}>{label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {ZODIAC_SIGNS.map((sign) => {
          const optionId = `${id}-${sign}`;
          const selected = sign === value;
          return (
            <label
              key={sign}
              htmlFor={optionId}
              className={cx(
                "flex cursor-pointer items-center justify-center rounded-field border px-1 py-3 text-center font-display text-xs font-semibold transition-colors",
                focusWithinRing,
                selected ? selectedClasses : idleClasses,
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={id}
                value={sign}
                checked={selected}
                onChange={() => onChange(sign)}
                className="sr-only"
              />
              {t(`signs.${sign}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SignGrid;
