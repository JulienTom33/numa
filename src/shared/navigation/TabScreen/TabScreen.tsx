import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import DiscoveryConsultGate from "../../../features/discovery/DiscoveryConsultGate/DiscoveryConsultGate";
import DiscoveryModeBadge from "../../../features/discovery/DiscoveryModeBadge/DiscoveryModeBadge";
import MyChartFlow from "../../../features/chart/MyChartFlow/MyChartFlow";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import { useAppContext } from "../appContext/appContext";
import { useMainTabs, type MainTab } from "../mainTabs/mainTabs";
import { paths } from "../routes/routes";

interface Props {
  tab: MainTab;
}

function TabScreen({ tab }: Props) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { isAnonymous } = useAppContext();
  const item = useMainTabs().find((candidate) => candidate.key === tab);

  if (!item) return null;

  return (
    <div id={`app__screen--${tab}`} className="flex flex-col items-center gap-2 px-4 pt-6">
      {isAnonymous && <DiscoveryModeBadge />}
      {tab === "theme" ? (
        <MyChartFlow />
      ) : (
        <EmptyState
          id={`app__placeholder--${tab}`}
          icon={item.icon}
          title={item.label}
          description={t("comingSoon")}
        />
      )}
      {isAnonymous && tab === "consult" && (
        <DiscoveryConsultGate
          onSignUp={() => navigate(paths.signup)}
          onSignIn={() => navigate(paths.signin)}
        />
      )}
    </div>
  );
}

export default TabScreen;
