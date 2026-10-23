import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import ProgressRing from "../../../shared/components/ui/ProgressRing/ProgressRing";
import StepChecklist from "../../../shared/components/ui/StepChecklist/StepChecklist";
import type { ChartProgressStatus } from "../useChartProgress/useChartProgress";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import { CHART_PHASES } from "../../../../shared/contracts/natalChart/natalChart.ts";

interface Props {
  completedCount: number;
  status: ChartProgressStatus;
  errorCode: NatalChartErrorCode | null;
  onRetry: () => void;
}

function ChartProgress({ completedCount, status, errorCode, onRetry }: Props) {
  const { t } = useTranslation("chart");
  const steps = CHART_PHASES.map((phase) => ({ id: phase, label: t(`progress.steps.${phase}`) }));
  const total = CHART_PHASES.length;
  const currentPhase = CHART_PHASES[Math.min(completedCount, total - 1)];
  const announcement =
    status === "done" ? t("progress.done") : t("progress.current", { step: t(`progress.steps.${currentPhase}`) });

  return (
    <section id="chart-progress__section--root" className="flex flex-col items-center gap-6 px-4 pb-10 pt-12">
      <h1 id="chart-progress__title--main" className="font-display text-2xl font-bold text-ink">
        {t("progress.title")}
      </h1>
      <ProgressRing
        id="chart-progress__ring--progress"
        value={(completedCount / total) * 100}
        label={t("progress.ringLabel")}
      />
      <StepChecklist id="chart-progress__list--steps" steps={steps} completedCount={completedCount} />
      <p id="chart-progress__text--duration" className="text-sm text-ink-muted">
        {t("progress.duration")}
      </p>
      <p id="chart-progress__status--current" aria-live="polite" className="sr-only">
        {status === "error" ? "" : announcement}
      </p>
      {status === "error" && (
        <Callout id="chart-progress__callout--error" tone="error" className="w-full">
          <p id="chart-progress__text--error">{t(`progress.errors.${errorCode ?? "internal_error"}`)}</p>
          <Button id="chart-progress__button--retry" type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("progress.retry")}
          </Button>
        </Callout>
      )}
    </section>
  );
}

export default ChartProgress;
