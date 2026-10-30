import { Navigate, type RouteObject } from "react-router";
import EphemerisFlow from "./features/ephemeris/EphemerisFlow/EphemerisFlow";
import HistoryFlow from "./features/history/HistoryFlow/HistoryFlow";
import AppRoot from "./shared/navigation/AppRoot/AppRoot";
import AuthCallbackRoute from "./shared/navigation/AuthCallbackRoute/AuthCallbackRoute";
import AuthRoute from "./shared/navigation/AuthRoute/AuthRoute";
import OnboardingRoute from "./shared/navigation/OnboardingRoute/OnboardingRoute";
import PrivacyPolicyRoute from "./shared/navigation/PrivacyPolicyRoute/PrivacyPolicyRoute";
import RequireOnboarding from "./shared/navigation/RequireOnboarding/RequireOnboarding";
import RequireSession from "./shared/navigation/RequireSession/RequireSession";
import { paths } from "./shared/navigation/routes/routes";
import TabScreen from "./shared/navigation/TabScreen/TabScreen";
import TabsLayout from "./shared/navigation/TabsLayout/TabsLayout";
import WelcomeRoute from "./shared/navigation/WelcomeRoute/WelcomeRoute";

export const routes: RouteObject[] = [
  {
    element: <AppRoot />,
    children: [
      { path: paths.welcome, element: <WelcomeRoute /> },
      { path: paths.signup, element: <AuthRoute mode="signup" /> },
      { path: paths.signin, element: <AuthRoute mode="signin" /> },
      { path: paths.authCallback, element: <AuthCallbackRoute /> },
      { path: paths.privacy, element: <PrivacyPolicyRoute /> },
      {
        element: <RequireSession />,
        children: [
          { path: paths.onboarding, element: <OnboardingRoute /> },
          {
            element: <RequireOnboarding />,
            children: [
              {
                element: <TabsLayout />,
                children: [
                  { path: paths.today, element: <TabScreen tab="today" /> },
                  { path: paths.consult, element: <TabScreen tab="consult" /> },
                  { path: paths.theme, element: <TabScreen tab="theme" /> },
                  { path: paths.profile, element: <TabScreen tab="profile" /> },
                  { path: paths.history, element: <HistoryFlow /> },
                  { path: paths.ephemeris, element: <EphemerisFlow /> },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to={paths.welcome} replace /> },
    ],
  },
];
