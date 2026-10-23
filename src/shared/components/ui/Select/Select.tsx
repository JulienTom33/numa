import type { SelectHTMLAttributes } from "react";
import { cx } from "../../../cx/cx";
import { fieldControl, fieldLabel } from "../styles/styles";
import Icon from "../Icon/Icon";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hideLabel?: boolean;
}

function Select({
  id,
  label,
  options,
  placeholder,
  error,
  hideLabel = false,
  className,
  ...rest
}: Props) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cx(fieldLabel, hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative">
        <select
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cx(fieldControl(Boolean(error)), "appearance-none pl-4 pr-10")}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary"
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-coral-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
