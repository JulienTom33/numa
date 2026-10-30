import { useTranslation } from "react-i18next";
import BottomSheet from "../../../shared/components/ui/BottomSheet/BottomSheet";

interface Props {
  idPrefix: string;
  open: boolean;
  onClose: () => void;
}

const SECTIONS = ["bigThree", "planets", "signs", "houses", "aspects", "limits"] as const;

function ChartUnderstandSheet({ idPrefix, open, onClose }: Props) {
  const { t } = useTranslation("chartDetail");

  return (
    <BottomSheet
      id={`${idPrefix}__sheet--understand`}
      open={open}
      onClose={onClose}
      title={t("understand.title")}
      closeLabel={t("understand.close")}
    >
      <div className="flex flex-col gap-4">
        <p id={`${idPrefix}__text--understand-intro`}>{t("understand.intro")}</p>
        {SECTIONS.map((section) => (
          <section key={section} id={`${idPrefix}__section--understand-${section}`} className="flex flex-col gap-1">
            <h3 className="font-display text-sm font-bold text-ink">{t(`understand.sections.${section}.title`)}</h3>
            <p>{t(`understand.sections.${section}.body`)}</p>
          </section>
        ))}
        <p id={`${idPrefix}__text--understand-conclusion`} className="font-semibold text-ink">
          {t("understand.conclusion")}
        </p>
      </div>
    </BottomSheet>
  );
}

export default ChartUnderstandSheet;
