import { useChartProgress } from "../../hooks/useChartProgress";
import ChartProgress from "../../screens/ChartProgress/ChartProgress";
import ChartSummaryFlow from "./ChartSummaryFlow";

interface Props {
  onComplete: () => void;
}

function ChartProgressFlow({ onComplete }: Props) {
  const { completedCount, status, errorCode, retry } = useChartProgress();

  if (status === "done") return <ChartSummaryFlow onDiscover={onComplete} />;

  return <ChartProgress completedCount={completedCount} status={status} errorCode={errorCode} onRetry={retry} />;
}

export default ChartProgressFlow;
