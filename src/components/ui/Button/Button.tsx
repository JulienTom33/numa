import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";

export type ButtonVariant = "primary" | "ink" | "outline" | "soft" | "danger";
export type ButtonSize = "md" | "sm";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id"> {
  id: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-coral text-white hover:bg-coral-hover disabled:bg-coral-disabled",
  ink: "bg-ink text-white hover:bg-ink/90 disabled:bg-ink-muted",
  outline:
    "border border-ink bg-transparent text-ink hover:bg-white disabled:border-line disabled:text-ink-muted disabled:hover:bg-transparent",
  soft: "bg-violet-soft text-violet-ink hover:bg-violet/25 disabled:text-ink-muted disabled:hover:bg-violet-soft",
  danger: "bg-coral-ink text-white hover:bg-coral-ink/90 disabled:bg-coral-disabled",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-5 text-base",
  sm: "h-9 px-4 text-sm",
};

function Button({
  id,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingLabel,
  leadingIcon,
  disabled,
  type = "button",
  className,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      id={id}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-button font-display font-bold transition-colors",
        focusRing,
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : (
        leadingIcon
      )}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export default Button;
