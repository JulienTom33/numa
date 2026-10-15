import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import IconButton from "../IconButton/IconButton";

interface Props {
  id: string;
  onBack?: () => void;
  backLabel?: string;
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

function TopBar({ id, onBack, backLabel, title, leading, trailing }: Props) {
  const { t } = useTranslation();

  return (
    <header id={id} className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex items-center justify-start gap-2">
        {onBack && <IconButton id={`${id}-back`} icon="back" label={backLabel ?? t("actions.back")} onClick={onBack} />}
        {leading}
      </div>
      {title ? (
        <h1 className="truncate text-center font-display text-base font-bold text-ink">{title}</h1>
      ) : (
        <span />
      )}
      <div className="flex items-center justify-end gap-2">{trailing}</div>
    </header>
  );
}

export default TopBar;
