import type { ReactNode } from "react";
import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

interface Props {
  id: string;
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}

function EmptyState({ id, title, description, icon = "consult", action }: Props) {
  return (
    <div id={id} className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-violet-soft text-violet-ink">
        <Icon name={icon} size={26} />
      </span>
      <h2 className="text-title-sm font-bold text-ink">{title}</h2>
      {description && <p className="max-w-xs text-sm text-ink-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
