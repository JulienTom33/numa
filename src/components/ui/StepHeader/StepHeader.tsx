import { cx } from "../../../lib/cx";

interface Props {
  id: string;
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}

function StepHeader({ id, step, total, title, subtitle }: Props) {
  return (
    <div id={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="font-display text-xs font-semibold text-ink-secondary">
          Étape {step} sur {total}
        </p>
        <div aria-hidden="true" className="flex gap-1">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cx("h-1 flex-1 rounded-full", index < step ? "bg-coral" : "bg-line")}
            />
          ))}
        </div>
      </div>
      <h1 className="text-title font-bold text-ink">{title}</h1>
      {subtitle && <p className="text-sm text-ink-secondary">{subtitle}</p>}
    </div>
  );
}

export default StepHeader;
