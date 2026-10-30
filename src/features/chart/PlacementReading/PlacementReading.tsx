import { useTranslation } from "react-i18next";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";
import type { NatalChartConfidence } from "../natalChart/natalChart";

export type ReadingKind = "sun" | "moon" | "ascendant";

interface Props {
  id: string;
  kind: ReadingKind;
  sign: ZodiacSign;
  degree: number;
  confidence: NatalChartConfidence;
  moonUncertain?: boolean;
}

function PlacementReading({ id, kind, sign, degree, confidence, moonUncertain = false }: Props) {
  const { t } = useTranslation("chartSigns");
  const zone = t(`zones.${sign}`);
  const flooredDegree = Math.floor(degree);
  const uncertain = kind === "moon" && moonUncertain;

  const why = (() => {
    if (kind === "sun") return t("why.sun", { degree: flooredDegree, zone, period: t(`periods.${sign}`) });
    if (kind === "moon") return uncertain ? t("why.moonUncertain") : t("why.moon", { degree: flooredDegree, zone });
    return t("why.ascendant", { zone });
  })();

  return (
    <div id={id} className="flex flex-col gap-2">
      {!uncertain && <p id={`${id}__text--reading`}>{t(`${kind}.${sign}`)}</p>}
      <p id={`${id}__text--why`} className="text-ink-muted">
        {why}
      </p>
      {kind === "ascendant" && confidence === "medium" && (
        <p id={`${id}__text--approximate`} className="text-ink-muted">
          {t("why.ascendantApproximate")}
        </p>
      )}
    </div>
  );
}

export default PlacementReading;
