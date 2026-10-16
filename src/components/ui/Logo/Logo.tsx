import { useTranslation } from "react-i18next";
import { cx } from "../../../lib/cx";
import { focusRing } from "../styles";

export type LogoSize = "md" | "lg";

interface Props {
  id: string;
  size?: LogoSize;
  showWordmark?: boolean;
  onWordmarkClick?: () => void;
}

const markSizes: Record<LogoSize, number> = { md: 32, lg: 56 };

const wordmarkClasses: Record<LogoSize, string> = {
  md: "text-title-sm",
  lg: "text-title-lg",
};

function Logo({ id, size = "md", showWordmark = true, onWordmarkClick }: Props) {
  const { t } = useTranslation();
  const appName = t("app.name");
  const markSize = markSizes[size];
  const wordmarkClass = cx("font-display font-extrabold text-ink", wordmarkClasses[size]);

  return (
    <div id={id} className="inline-flex items-center gap-2">
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : appName}
        aria-hidden={showWordmark ? true : undefined}
      >
        <circle cx="16" cy="16" r="13" className="fill-violet" />
        <circle cx="24" cy="9" r="4" className="fill-coral" />
        <circle cx="9" cy="23" r="3" className="fill-sky" />
      </svg>
      {showWordmark &&
        (onWordmarkClick ? (
          <button
            id={`${id}-wordmark`}
            type="button"
            onClick={onWordmarkClick}
            aria-haspopup="dialog"
            className={cx(wordmarkClass, "rounded-xs hover:text-violet-ink", focusRing)}
          >
            {appName}
          </button>
        ) : (
          <span className={wordmarkClass}>{appName}</span>
        ))}
    </div>
  );
}

export default Logo;
