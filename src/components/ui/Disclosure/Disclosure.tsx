import { type ReactNode, useState } from "react";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";
import Icon from "../Icon/Icon";

interface Props {
  id: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function Disclosure({ id, summary, children, defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `${id}-content`;

  return (
    <div className={cx("flex flex-col", className)}>
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className={cx(
          "flex items-center justify-between gap-2 rounded-xs py-1 text-left font-display text-sm font-semibold text-violet-ink",
          focusRing,
        )}
      >
        {summary}
        <Icon
          name="chevron-down"
          size={18}
          className={cx(
            "shrink-0 transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={id}
        hidden={!open}
        className="pt-2 text-sm text-ink-secondary"
      >
        {children}
      </div>
    </div>
  );
}

export default Disclosure;
