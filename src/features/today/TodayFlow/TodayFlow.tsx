import { useNavigate } from "react-router";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { paths } from "../../../shared/navigation/routes/routes";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import { localIsoDate } from "../horoscope/horoscope";
import TodayScreen from "../TodayScreen/TodayScreen";
import { useHoroscope } from "../useHoroscope/useHoroscope";

function TodayFlow() {
  const navigate = useNavigate();
  const { isAnonymous } = useAppContext();
  const { status, data, errorCode, retry } = useMyChart();
  const today = new Date();
  const horoscope = useHoroscope(localIsoDate(today), status === "ready");

  return (
    <TodayScreen
      status={status}
      data={data}
      errorCode={errorCode}
      horoscope={horoscope}
      isAnonymous={isAnonymous}
      today={today}
      onRetry={retry}
      onOpenProfile={() => navigate(paths.profile)}
      onSignUp={() => navigate(paths.signup)}
      onAskQuestion={() => navigate(paths.consult)}
    />
  );
}

export default TodayFlow;
