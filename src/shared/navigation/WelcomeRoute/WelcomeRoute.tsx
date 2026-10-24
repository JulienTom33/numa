import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router";
import Welcome from "../../../features/welcome/Welcome/Welcome";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

function WelcomeRoute() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { auth, session, discover, discoverFailed } = useAppContext();

  if (auth.redirectError) return <Navigate to={paths.signin} replace />;
  if (session) return <Navigate to={paths.today} replace />;

  return (
    <Welcome
      onSignUp={() => navigate(paths.signup)}
      onSignIn={() => navigate(paths.signin)}
      onDiscover={discover}
      discoverError={discoverFailed ? t("anonymousSession.notCreated") : null}
    />
  );
}

export default WelcomeRoute;
