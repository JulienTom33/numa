import type { ReactNode } from "react";
import { cx } from "../../../lib/cx";
import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

export type CalloutTone = "info" | "warning" | "success" | "error" | "highlight";

interface Props {
  id: string;
  children: ReactNode;
  tone?: CalloutTone;
  title?: string;
  className?: string;
}

const toneStyles: Record<CalloutTone, { classes: string; icon: IconName }> = {
  info: { classes: "bg-sky-soft text-sky-ink", icon: "info" },
  warning: { classes: "bg-gold-soft text-gold-ink", icon: "warning" },
  success: { classes: "bg-sage-soft text-sage-ink", icon: "check" },
  error: { classes: "bg-coral-soft text-coral-ink", icon: "warning" },
  highlight: { classes: "bg-violet-soft text-violet-ink", icon: "info" },
};

function Callout({ id, children, tone = "info", title, className }: Props) {
  const { classes, icon } = toneStyles[tone];

  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : undefined}
      className={cx("flex gap-3 rounded-card p-4", classes, className)}
    >
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1 text-sm">
        {title && <p className="font-display font-bold">{title}</p>}
        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}

export default Callout;
