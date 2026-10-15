import { type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";
import Icon from "../Icon/Icon";

interface Props {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}

function InfoTooltip({ id, label, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const contentId = `${id}-content`;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className={cx("relative inline-flex align-middle", className)}>
      <button
        id={id}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className={cx(
          "-m-1 inline-flex rounded-full p-1 text-ink-secondary hover:text-violet-ink",
          focusRing,
        )}
      >
        <Icon name="info" size={14} />
      </button>
      {open && (
        <span
          id={contentId}
          className="absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-card border border-line bg-white p-3 text-xs leading-relaxed text-ink shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}

export default InfoTooltip;
