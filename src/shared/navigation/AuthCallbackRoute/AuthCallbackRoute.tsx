import { Navigate } from "react-router";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

function AuthCallbackRoute() {
  const { auth, session } = useAppContext();

  if (auth.redirectError) return <Navigate to={paths.signin} replace />;
  if (auth.status === "loading") return null;
  return <Navigate to={session ? paths.today : paths.signin} replace />;
}

export default AuthCallbackRoute;
