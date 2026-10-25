import { useNavigate } from "react-router";
import PrivacyPolicyScreen from "../../../features/legal/PrivacyPolicyScreen/PrivacyPolicyScreen";
import { paths } from "../routes/routes";

function PrivacyPolicyRoute() {
  const navigate = useNavigate();

  return <PrivacyPolicyScreen onBack={() => navigate(paths.welcome)} />;
}

export default PrivacyPolicyRoute;
