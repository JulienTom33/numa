import type { ReactNode } from "react";
import { cx } from "../../../lib/cx";
import { fieldLabel, focusWithinRing } from "../styles";

export interface SelectableCardOption<T extends string> {
  value: T;
  title: string;
  description?: string;
  content?: ReactNode;
}

interface Props<T extends string> {
  id: string;
  label: string;
  options: SelectableCardOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  hideLabel?: boolean;
}

const selectedClasses = "border-coral bg-coral-soft";
const idleClasses = "border-line bg-white hover:border-coral";

function SelectableCardGroup<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  hideLabel = false,
}: Props<T>) {
  return (
    <fieldset id={id} className="flex flex-col gap-3">
      <legend className={cx("mb-3", fieldLabel, hideLabel && "sr-only")}>{label}</legend>
      {options.map((option) => {
        const optionId = `${id}-${option.value}`;
        const selected = option.value === value;
        return (
          <div
            key={option.value}
            className={cx(
              "rounded-card border-2 transition-colors",
              focusWithinRing,
              selected ? selectedClasses : idleClasses,
            )}
          >
            <label htmlFor={optionId} className="flex cursor-pointer items-start gap-3 p-4">
              <input
                id={optionId}
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-coral-ink"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-base font-bold text-ink">{option.title}</span>
                {option.description && (
                  <span className="text-sm text-ink-secondary">{option.description}</span>
                )}
              </span>
            </label>
            {selected && option.content && <div className="px-4 pb-4">{option.content}</div>}
          </div>
        );
      })}
    </fieldset>
  );
}

export default SelectableCardGroup;
