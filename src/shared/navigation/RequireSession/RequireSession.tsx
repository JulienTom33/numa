import { Navigate, Outlet } from "react-router";
import { useAppContext } from "../appContext/appContext";
import { paths } from "../routes/routes";

function RequireSession() {
  const { auth, session } = useAppContext();

  if (auth.status === "loading") return null;
  if (!session) return <Navigate to={paths.welcome} replace />;
  return <Outlet />;
}

export default RequireSession;
