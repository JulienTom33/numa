import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../../shared/components/ui/Card/Card";
import InfoTooltip from "../../../shared/components/ui/InfoTooltip/InfoTooltip";
import { formatDate } from "../../../i18n/format/format";
import type { NatalChartSummary } from "../natalChartSummary/natalChartSummary";

interface Props {
  idPrefix: string;
  summary: NatalChartSummary;
  titleRef?: Ref<HTMLHeadingElement>;
}

function ChartMethodCard({ idPrefix, summary, titleRef }: Props) {
  const { t, i18n } = useTranslation("chart");
  const computedDate = summary.computedAt ? formatDate(new Date(summary.computedAt), i18n.language, { dateStyle: "long" }) : null;

  return (
  <Card id={`${idPrefix}__card--method`} as="section">
    <h2
      id={`${idPrefix}__title--method`}
      ref={titleRef}
      tabIndex={-1}
      className="font-display text-base font-bold text-ink outline-hidden"
    >
      {t("summary.method.title")}
    </h2>
    <dl id={`${idPrefix}__list--method`} className="mt-3 flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="flex items-center gap-1 text-ink-secondary">
          {t("summary.method.zodiac")}
          <InfoTooltip id={`${idPrefix}__tooltip--zodiac`} label={t("summary.method.zodiacHelpLabel")}>
            {t("summary.method.zodiacHelp")}
          </InfoTooltip>
        </dt>
        <dd id={`${idPrefix}__value--zodiac`} className="font-semibold text-ink">
          {t("summary.method.zodiacValue")}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="flex items-center gap-1 text-ink-secondary">
          {t("summary.method.houses")}
          <InfoTooltip id={`${idPrefix}__tooltip--houses`} label={t("summary.method.housesHelpLabel")}>
            {t("summary.method.housesHelp")}
          </InfoTooltip>
        </dt>
        <dd id={`${idPrefix}__value--houses`} className="font-semibold text-ink">
          {summary.houseSystem
            ? t(`summary.method.housesSystems.${summary.houseSystem}`)
            : t("summary.method.housesUnavailable")}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="flex items-center gap-1 text-ink-secondary">
          {t("summary.method.timeQuality")}
          <InfoTooltip id={`${idPrefix}__tooltip--time-quality`} label={t("summary.method.timeQualityHelpLabel")}>
            {t("summary.method.timeQualityHelp")}
          </InfoTooltip>
        </dt>
        <dd id={`${idPrefix}__value--time-quality`} className="font-semibold text-ink">
          {t(`summary.method.quality.${summary.confidence}`)}
        </dd>
      </div>
      {computedDate && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-secondary">{t("summary.method.computedAt")}</dt>
          <dd id={`${idPrefix}__value--computed-at`} className="font-semibold text-ink">
            {computedDate}
          </dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <dt className="text-ink-secondary">{t("summary.method.engine")}</dt>
        <dd id={`${idPrefix}__value--engine`} className="font-semibold text-ink">
          {t("summary.method.engineValue", { name: summary.engine.name, version: summary.engine.version })}
        </dd>
      </div>
    </dl>
  </Card>
  );
}

export default ChartMethodCard;
