import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";

interface Props {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

function Switch({ id, label, checked, onChange, description, disabled = false }: Props) {
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span id={labelId} className="font-display text-sm font-semibold text-ink">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-xs text-ink-secondary">
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-6 w-[42px] shrink-0 items-center rounded-full transition-colors",
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-sage" : "bg-line",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export default Switch;
