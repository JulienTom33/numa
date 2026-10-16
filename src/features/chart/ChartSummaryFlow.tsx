import { useNatalChartSummary } from "../../hooks/useNatalChartSummary";
import ChartSummary from "../../screens/ChartSummary/ChartSummary";

interface Props {
  onDiscover: () => void;
}

function ChartSummaryFlow({ onDiscover }: Props) {
  const { status, summary, errorCode, retry } = useNatalChartSummary();

  return (
    <ChartSummary status={status} summary={summary} errorCode={errorCode} onRetry={retry} onDiscover={onDiscover} />
  );
}

export default ChartSummaryFlow;
