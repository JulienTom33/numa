import { useCallback } from "react";
import { useNavigate } from "react-router";
import AuthFlow, { type AuthFlowDestination } from "../../../features/auth/AuthFlow/AuthFlow";
import type { AuthMode } from "../../../features/auth/auth/auth";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

interface Props {
  mode: AuthMode;
}

function AuthRoute({ mode }: Props) {
  const navigate = useNavigate();
  const { auth } = useAppContext();
  const exit = useCallback(
    (destination: AuthFlowDestination) => {
      if (destination === "today") navigate(paths.today, { replace: true });
      else navigate(paths.welcome);
    },
    [navigate],
  );

  return <AuthFlow key={mode} initialMode={mode} auth={auth} onExit={exit} />;
}

export default AuthRoute;
