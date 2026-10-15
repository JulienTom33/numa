import { useTranslation } from "react-i18next";
import Badge from "./ui/Badge/Badge";

function DiscoveryModeBadge() {
  const { t } = useTranslation("welcome");

  return <Badge id="discovery-mode-badge__badge--main">{t("discoveryMode")}</Badge>;
}

export default DiscoveryModeBadge;
