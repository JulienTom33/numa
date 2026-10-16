import { type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../lib/cx";
import IconButton from "../IconButton/IconButton";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  id: string;
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  aboveTabBar?: boolean;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function BottomSheet({
  id,
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel,
  aboveTabBar = false,
}: Props) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) (getFocusable(panel)[0] ?? panel).focus();

    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = getFocusable(panelRef.current);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={cx(
        "fixed inset-x-0 top-0 z-40 flex items-end justify-center",
        aboveTabBar ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]" : "bottom-0",
      )}
    >
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-overlay" />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative flex max-h-[85%] w-full max-w-app flex-col gap-4 overflow-y-auto rounded-t-sheet bg-surface p-5 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title-sm font-bold text-ink">
            {title}
          </h2>
          <IconButton id={`${id}-close`} icon="close" label={closeLabel ?? t("actions.close")} onClick={onClose} />
        </div>
        <div className="text-sm text-ink-secondary">{children}</div>
        {footer && <div className="flex flex-col gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export default BottomSheet;
