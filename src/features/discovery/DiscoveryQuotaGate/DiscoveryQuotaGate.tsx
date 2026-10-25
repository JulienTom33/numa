import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import type { QuestionQuota } from "../questionQuota/questionQuota";
import DiscoveryBanner from "../DiscoveryBanner/DiscoveryBanner";

interface Props {
  quota: QuestionQuota | null;
  onSignUp: () => void;
}

function DiscoveryQuotaGate({ quota, onSignUp }: Props) {
  const { t } = useTranslation("discovery");

  if (!quota) return null;
  if (quota.remaining === 1) return <DiscoveryBanner />;
  if (quota.remaining > 0) return null;

  return (
    <Button id="discovery-quota-gate__button--sign-up" fullWidth onClick={onSignUp}>
      {t("locked.cta")}
    </Button>
  );
}

export default DiscoveryQuotaGate;
