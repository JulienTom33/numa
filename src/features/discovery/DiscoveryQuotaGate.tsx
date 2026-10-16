import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button/Button";
import { dismissConversionSheet, isConversionSheetDismissed } from "../../lib/discoveryPrompt";
import type { QuestionQuota } from "../../lib/questionQuota";
import ConversionSheet from "./ConversionSheet";
import DiscoveryBanner from "./DiscoveryBanner";

interface Props {
  quota: QuestionQuota | null;
  onSignUp: () => void;
  onSignIn: () => void;
}

function DiscoveryQuotaGate({ quota, onSignUp, onSignIn }: Props) {
  const { t } = useTranslation("discovery");
  const [dismissed, setDismissed] = useState(isConversionSheetDismissed);
  const handleContinue = useCallback(() => {
    dismissConversionSheet();
    setDismissed(true);
  }, []);

  if (!quota) return null;
  if (quota.remaining === 1) return <DiscoveryBanner />;
  if (quota.remaining > 0) return null;

  return (
    <>
      <Button id="discovery-quota-gate__button--sign-up" fullWidth onClick={onSignUp}>
        {t("locked.cta")}
      </Button>
      <ConversionSheet
        open={!dismissed}
        onSignUp={onSignUp}
        onSignIn={onSignIn}
        onContinue={handleContinue}
      />
    </>
  );
}

export default DiscoveryQuotaGate;
