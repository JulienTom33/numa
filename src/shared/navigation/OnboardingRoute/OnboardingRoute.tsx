import { Navigate } from "react-router";
import OnboardingFlow from "../../../features/onboarding/OnboardingFlow/OnboardingFlow";
import OnboardingLoading from "../../../features/onboarding/OnboardingLoading/OnboardingLoading";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

function OnboardingRoute() {
  const { session, isAnonymous, onboarding } = useAppContext();

  if (!session || onboarding.status === "loading") return <OnboardingLoading />;
  if (onboarding.status === "completed") return <Navigate to={paths.today} replace />;

  return (
    <OnboardingFlow
      userId={session.user.id}
      discoveryMode={isAnonymous}
      onComplete={onboarding.markCompleted}
    />
  );
}

export default OnboardingRoute;
