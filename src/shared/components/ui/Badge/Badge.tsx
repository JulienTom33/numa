import type { ReactNode } from "react";
import { cx } from "../../../cx/cx";

export type BadgeTone = "violet" | "sage" | "gold" | "sky" | "coral" | "neutral";

interface Props {
  id: string;
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  violet: "bg-violet-soft text-violet-ink",
  sage: "bg-sage-soft text-sage-ink",
  gold: "bg-gold-soft text-gold-ink",
  sky: "bg-sky-soft text-sky-ink",
  coral: "bg-coral-soft text-coral-ink",
  neutral: "border border-line bg-white text-ink-secondary",
};

function Badge({ id, children, tone = "violet", className }: Props) {
  return (
    <span
      id={id}
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
