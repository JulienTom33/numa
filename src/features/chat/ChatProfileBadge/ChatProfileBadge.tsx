import { useTranslation } from "react-i18next";
import Badge from "../../../shared/components/ui/Badge/Badge";
import type { NatalChartSummary, SummaryPlacement } from "../../chart/natalChartSummary/natalChartSummary";

interface Props {
  summary: NatalChartSummary | null;
}

function ChatProfileBadge({ summary }: Props) {
  const { t } = useTranslation(["chat", "astrology"]);

  if (!summary) {
    return (
      <Badge id="chat-profile-badge__badge--main" tone="neutral">
        {t("chat:profile.unavailable")}
      </Badge>
    );
  }

  const placement = (body: "sun" | "moon" | "ascendant", value: SummaryPlacement | null) =>
    value
      ? t("chat:profile.placement", {
          body: t(`astrology:placement.${body}`),
          sign: t(`astrology:signs.${value.sign}`),
        })
      : null;
  const details = [
    summary.firstName,
    placement("sun", summary.sun),
    placement("moon", summary.moon),
    placement("ascendant", summary.ascendant),
  ]
    .filter((part): part is string => part !== null && part !== "")
    .join(" · ");

  return (
    <Badge id="chat-profile-badge__badge--main" className="max-w-full flex-wrap">
      {t("chat:profile.label", { details })}
    </Badge>
  );
}

export default ChatProfileBadge;
