import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";
import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

export type IconButtonVariant = "ghost" | "surface";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "children"> {
  id: string;
  icon: IconName;
  label: string;
  variant?: IconButtonVariant;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: "text-ink hover:bg-ink/5",
  surface: "border border-line bg-white text-ink hover:bg-surface",
};

function IconButton({
  id,
  icon,
  label,
  variant = "ghost",
  type = "button",
  className,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      id={id}
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        focusRing,
        "disabled:cursor-not-allowed disabled:text-ink-muted",
        variantClasses[variant],
        className,
      )}
    >
      <Icon name={icon} />
    </button>
  );
}

export default IconButton;
