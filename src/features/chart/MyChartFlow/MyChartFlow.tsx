import { useNavigate } from "react-router";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { paths } from "../../../shared/navigation/routes/routes";
import { useMyChart } from "../useMyChart/useMyChart";
import MyChart from "../MyChart/MyChart";

function MyChartFlow() {
  const { status, data, errorCode, retry } = useMyChart();
  const { isAnonymous } = useAppContext();
  const navigate = useNavigate();

  return (
    <MyChart
      status={status}
      data={data}
      errorCode={errorCode}
      onRetry={retry}
      isAnonymous={isAnonymous}
      onSignUp={() => navigate(paths.signup)}
    />
  );
}

export default MyChartFlow;
