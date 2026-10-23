import { type KeyboardEvent, useRef } from "react";
import { cx } from "../../../cx/cx";
import { focusRing } from "../styles/styles";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  id: string;
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const checkedClasses = "border-ink bg-violet-wash text-ink";
const uncheckedClasses = "border-transparent text-ink-secondary hover:text-ink";

function SegmentedControl<T extends string>({ id, label, options, value, onChange }: Props<T>) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const option = options[index];
    onChange(option.value);
    optionRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in targets)) return;

    event.preventDefault();
    select(targets[event.key]);
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      className="inline-flex gap-1 rounded-button border border-line bg-white p-1"
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            id={`${id}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cx(
              "flex-1 rounded-field border px-4 py-2 font-display text-sm font-semibold transition-colors",
              focusRing,
              checked ? checkedClasses : uncheckedClasses,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
