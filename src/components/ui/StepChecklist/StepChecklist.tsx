import { cx } from "../../../lib/cx";
import Icon from "../Icon/Icon";

export interface ChecklistStep {
  id: string;
  label: string;
}

type StepStatus = "done" | "current" | "pending";

interface Props {
  id: string;
  steps: ChecklistStep[];
  completedCount: number;
}

const statusLabels: Record<StepStatus, string> = {
  done: "terminé",
  current: "en cours",
  pending: "à venir",
};

const markerClasses: Record<StepStatus, string> = {
  done: "bg-sage text-white",
  current: "border-2 border-violet bg-white",
  pending: "border-2 border-line bg-white",
};

const labelClasses: Record<StepStatus, string> = {
  done: "text-ink",
  current: "font-semibold text-ink",
  pending: "text-ink-muted",
};

function getStatus(index: number, completedCount: number): StepStatus {
  if (index < completedCount) return "done";
  return index === completedCount ? "current" : "pending";
}

function StepChecklist({ id, steps, completedCount }: Props) {
  return (
    <ol id={id} className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const status = getStatus(index, completedCount);
        return (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden="true"
              className={cx(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                markerClasses[status],
              )}
            >
              {status === "done" && <Icon name="check" size={12} />}
            </span>
            <span className={labelClasses[status]}>
              {step.label}
              <span className="sr-only"> ({statusLabels[status]})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default StepChecklist;
