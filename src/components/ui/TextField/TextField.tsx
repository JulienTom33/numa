import type { InputHTMLAttributes } from "react";
import { cx } from "../../../lib/cx";
import { fieldControl, fieldLabel } from "../styles";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

function TextField({ id, label, hint, error, hideLabel = false, className, ...rest }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cx(fieldLabel, hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(fieldControl(Boolean(error)), "placeholder:text-ink-muted px-4")}
      />
      {hint && (
        <p id={hintId} className="text-xs text-ink-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-coral-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextField;
