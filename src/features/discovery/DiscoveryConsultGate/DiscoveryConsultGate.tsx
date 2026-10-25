import { useQuestionQuota } from "../useQuestionQuota/useQuestionQuota";
import DiscoveryQuotaGate from "../DiscoveryQuotaGate/DiscoveryQuotaGate";

interface Props {
  onSignUp: () => void;
}

function DiscoveryConsultGate({ onSignUp }: Props) {
  const { quota } = useQuestionQuota();

  return <DiscoveryQuotaGate quota={quota} onSignUp={onSignUp} />;
}

export default DiscoveryConsultGate;
