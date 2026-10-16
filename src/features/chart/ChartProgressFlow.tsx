import { useEffect } from "react";
import { useChartProgress } from "../../hooks/useChartProgress";
import ChartProgress from "../../screens/ChartProgress/ChartProgress";

interface Props {
  onComplete: () => void;
}

function ChartProgressFlow({ onComplete }: Props) {
  const { completedCount, status, errorCode, retry } = useChartProgress();

  useEffect(() => {
    if (status === "done") onComplete();
  }, [status, onComplete]);

  return <ChartProgress completedCount={completedCount} status={status} errorCode={errorCode} onRetry={retry} />;
}

export default ChartProgressFlow;
