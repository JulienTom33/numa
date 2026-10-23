import { cx } from "../../../cx/cx";
import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { focusRing } from "../styles/styles";

export type ListRowTone = "default" | "danger";

interface Props {
  id: string;
  label: string;
  onClick: () => void;
  value?: string;
  icon?: IconName;
  tone?: ListRowTone;
}

function ListRow({ id, label, onClick, value, icon, tone = "default" }: Props) {
  const danger = tone === "danger";

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface",
        focusRing,
        danger ? "text-coral-ink" : "text-ink",
      )}
    >
      {icon && <Icon name={icon} size={20} className="shrink-0" />}
      <span className="flex-1 font-display text-sm font-semibold">{label}</span>
      {value && <span className="text-sm text-ink-secondary">{value}</span>}
      {!danger && <Icon name="chevron-right" size={18} className="shrink-0 text-ink-muted" />}
    </button>
  );
}

export default ListRow;
