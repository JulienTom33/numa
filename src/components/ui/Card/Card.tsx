import type { ReactNode } from "react";
import { cx } from "../../../lib/cx";

export type CardTone = "white" | "surface" | "violet" | "sky" | "gold" | "sage" | "coral";
export type CardPadding = "none" | "md" | "lg";

interface Props {
  id: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
  tone?: CardTone;
  padding?: CardPadding;
  className?: string;
}

const toneClasses: Record<CardTone, string> = {
  white: "border border-line bg-white",
  surface: "border border-line bg-surface",
  violet: "bg-violet-soft",
  sky: "bg-sky-soft",
  gold: "bg-gold-soft",
  sage: "bg-sage-soft",
  coral: "bg-coral-soft",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  md: "p-4",
  lg: "p-5",
};

function Card({ id, children, as: Tag = "div", tone = "white", padding = "md", className }: Props) {
  return (
    <Tag
      id={id}
      className={cx("rounded-card text-ink", toneClasses[tone], paddingClasses[padding], className)}
    >
      {children}
    </Tag>
  );
}

export default Card;
