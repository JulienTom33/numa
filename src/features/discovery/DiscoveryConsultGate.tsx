import { useQuestionQuota } from "../../hooks/useQuestionQuota";
import DiscoveryQuotaGate from "./DiscoveryQuotaGate";

interface Props {
  onSignUp: () => void;
  onSignIn: () => void;
}

function DiscoveryConsultGate({ onSignUp, onSignIn }: Props) {
  const { quota } = useQuestionQuota();

  return <DiscoveryQuotaGate quota={quota} onSignUp={onSignUp} onSignIn={onSignIn} />;
}

export default DiscoveryConsultGate;
