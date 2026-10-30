import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { paths } from "../../../shared/navigation/routes/routes";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import { useWeeklyHoroscope } from "../../horoscope/weeklyHoroscope/useWeeklyHoroscope";
import { localIsoDate } from "../horoscope/horoscope";
import TodayScreen, { type HoroscopePeriod } from "../TodayScreen/TodayScreen";
import { useHoroscope } from "../useHoroscope/useHoroscope";

function TodayFlow() {
  const navigate = useNavigate();
  const { isAnonymous } = useAppContext();
  const { status, data, errorCode, retry } = useMyChart();
  const [period, setPeriod] = useState<HoroscopePeriod>("day");
  const today = new Date();
  const isoDate = localIsoDate(today);
  const horoscope = useHoroscope(isoDate, status === "ready");
  const weeklyHoroscope = useWeeklyHoroscope(isoDate, status === "ready" && period === "week");

  return (
    <TodayScreen
      status={status}
      data={data}
      errorCode={errorCode}
      horoscope={horoscope}
      weeklyHoroscope={weeklyHoroscope}
      period={period}
      isAnonymous={isAnonymous}
      today={today}
      onPeriodChange={setPeriod}
      onRetry={retry}
      onOpenProfile={() => navigate(paths.profile)}
      onSignUp={() => navigate(paths.signup)}
      onAskQuestion={() => navigate(paths.consult)}
    />
  );
}

export default TodayFlow;
