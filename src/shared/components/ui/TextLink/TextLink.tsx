import type { ReactNode } from "react";
import { cx } from "../../../cx/cx";
import { focusRing } from "../styles/styles";

export type TextLinkTone = "violet" | "ink" | "coral";

interface Props {
  id: string;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: TextLinkTone;
  className?: string;
}

const toneClasses: Record<TextLinkTone, string> = {
  violet: "text-violet-ink",
  ink: "text-ink",
  coral: "text-coral-ink",
};

function TextLink({ id, children, href, onClick, tone = "violet", className }: Props) {
  const classes = cx(
    "rounded-xs font-display font-semibold underline-offset-4 hover:underline",
    focusRing,
    toneClasses[tone],
    className,
  );

  if (href) {
    return (
      <a id={id} href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button id={id} type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export default TextLink;
