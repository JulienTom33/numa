import { useMyChart } from "../../hooks/useMyChart";
import MyChart from "../../screens/MyChart/MyChart";

function MyChartFlow() {
  const { status, data, errorCode, retry } = useMyChart();

  return <MyChart status={status} data={data} errorCode={errorCode} onRetry={retry} />;
}

export default MyChartFlow;
