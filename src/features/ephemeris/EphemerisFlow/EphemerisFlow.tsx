import { useState } from "react";
import { useNavigate } from "react-router";
import { paths } from "../../../shared/navigation/routes/routes";
import EphemerisScreen from "../EphemerisScreen/EphemerisScreen";
import {
  defaultSelectedDay,
  isWithin,
  rangeFor,
  shiftAnchor,
  utcIsoDate,
  type EphemerisPeriod,
} from "../ephemerisPeriod/ephemerisPeriod";
import { useEphemeris } from "../useEphemeris/useEphemeris";

interface Props {
  now?: () => Date;
}

function EphemerisFlow({ now = () => new Date() }: Props) {
  const navigate = useNavigate();
  const [today] = useState(() => utcIsoDate(now()));
  const [period, setPeriod] = useState<EphemerisPeriod>("day");
  const [anchor, setAnchor] = useState(today);
  const [picked, setPicked] = useState<string | null>(null);
  const range = rangeFor(period, anchor);
  const { status, data, retry } = useEphemeris(range);
  const selectedDay = picked !== null && isWithin(picked, range) ? picked : defaultSelectedDay(range, today);

  const move = (nextAnchor: string) => {
    setAnchor(nextAnchor);
    setPicked(null);
  };

  return (
    <div id="app__screen--ephemeris" className="flex flex-col items-center gap-2 px-4 pt-2">
    <EphemerisScreen
      status={status}
      data={data}
      period={period}
      range={range}
      selectedDay={selectedDay}
      onBack={() => navigate(paths.today)}
      onPeriodChange={(next) => {
        setPeriod(next);
        setAnchor(selectedDay);
        setPicked(null);
      }}
      onPrevious={() => move(shiftAnchor(period, anchor, -1))}
      onNext={() => move(shiftAnchor(period, anchor, 1))}
      onToday={() => move(today)}
      onSelectDay={setPicked}
      onRetry={retry}
    />
    </div>
  );
}

export default EphemerisFlow;
