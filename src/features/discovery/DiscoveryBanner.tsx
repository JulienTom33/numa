import { useTranslation } from "react-i18next";
import Callout from "../../components/ui/Callout/Callout";

function DiscoveryBanner() {
  const { t } = useTranslation("discovery");

  return (
    <Callout id="discovery-banner__callout--remaining" tone="warning" title={t("banner.title")}>
      {t("banner.body")}
    </Callout>
  );
}

export default DiscoveryBanner;
