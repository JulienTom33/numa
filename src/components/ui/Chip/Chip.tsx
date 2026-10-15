import type { ReactNode } from "react";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";

interface Props {
  id: string;
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
}

const selectedClasses = "border-violet bg-violet-wash text-violet-ink";
const idleClasses = "border-line bg-white text-ink hover:border-violet";

function Chip({ id, children, onClick, selected, disabled = false }: Props) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center rounded-full border px-4 py-2 text-left text-sm transition-colors",
        focusRing,
        "disabled:cursor-not-allowed disabled:text-ink-muted",
        selected ? selectedClasses : idleClasses,
      )}
    >
      {children}
    </button>
  );
}

export default Chip;
