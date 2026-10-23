import { useMyChart } from "../useMyChart/useMyChart";
import MyChart from "../MyChart/MyChart";

function MyChartFlow() {
  const { status, data, errorCode, retry } = useMyChart();

  return <MyChart status={status} data={data} errorCode={errorCode} onRetry={retry} />;
}

export default MyChartFlow;
