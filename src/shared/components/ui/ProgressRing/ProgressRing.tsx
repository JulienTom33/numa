import { useTranslation } from "react-i18next";
import { formatPercent } from "../../../../i18n/format/format";

interface Props {
  id: string;
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ id, value, label, size = 84, strokeWidth = 6 }: Props) {
  const { i18n } = useTranslation();
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      id={id}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-violet transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute font-display text-lg font-bold text-ink">{formatPercent(clamped / 100, i18n.language)}</span>
    </div>
  );
}

export default ProgressRing;
