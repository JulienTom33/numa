import { cx } from "../../../cx/cx";
import { focusRing } from "../styles/styles";
import Icon from "../Icon/Icon";
import { getInitial } from "./getInitial";

export type AvatarSize = "sm" | "md" | "lg";

interface Props {
  id: string;
  name: string;
  size?: AvatarSize;
  onClick?: () => void;
  label?: string;
  showEditBadge?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-[72px] w-[72px] text-title",
};

function Avatar({ id, name, size = "md", onClick, label, showEditBadge = false }: Props) {
  const classes = cx(
    "relative inline-flex shrink-0 items-center justify-center rounded-full bg-violet-soft font-display font-bold text-violet-ink",
    sizeClasses[size],
  );
  const content = (
    <>
      <span aria-hidden="true">{getInitial(name)}</span>
      {showEditBadge && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-page bg-coral text-white"
        >
          <Icon name="edit" size={12} />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        id={id}
        type="button"
        onClick={onClick}
        aria-label={label ?? name}
        className={cx(classes, "transition-colors hover:bg-violet/25", focusRing)}
      >
        {content}
      </button>
    );
  }

  return (
    <span id={id} role="img" aria-label={label ?? name} className={classes}>
      {content}
    </span>
  );
}

export default Avatar;
