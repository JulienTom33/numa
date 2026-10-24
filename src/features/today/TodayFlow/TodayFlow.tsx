import { useNavigate } from "react-router";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { paths } from "../../../shared/navigation/routes/routes";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import TodayScreen from "../TodayScreen/TodayScreen";

function TodayFlow() {
  const navigate = useNavigate();
  const { isAnonymous } = useAppContext();
  const { status, data, errorCode, retry } = useMyChart();

  return (
    <TodayScreen
      status={status}
      data={data}
      errorCode={errorCode}
      isAnonymous={isAnonymous}
      today={new Date()}
      onRetry={retry}
      onOpenProfile={() => navigate(paths.profile)}
      onSignUp={() => navigate(paths.signup)}
      onAskQuestion={() => navigate(paths.consult)}
    />
  );
}

export default TodayFlow;
