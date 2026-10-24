import { Navigate, Outlet } from "react-router";
import OnboardingLoading from "../../../features/onboarding/OnboardingLoading/OnboardingLoading";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

function RequireOnboarding() {
  const { onboarding } = useAppContext();

  if (onboarding.status === "loading") return <OnboardingLoading />;
  if (onboarding.status === "required") return <Navigate to={paths.onboarding} replace />;
  return <Outlet />;
}

export default RequireOnboarding;
