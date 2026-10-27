import type { MainTab } from "../mainTabs/mainTabs";

export const paths = {
  welcome: "/",
  signup: "/inscription",
  signin: "/connexion",
  authCallback: "/auth/callback",
  privacy: "/confidentialite",
  onboarding: "/onboarding",
  today: "/aujourdhui",
  consult: "/consulter",
  theme: "/mon-theme",
  profile: "/profil",
  history: "/historique",
} as const;

export const tabPaths: Record<MainTab, string> = {
  today: paths.today,
  consult: paths.consult,
  theme: paths.theme,
  profile: paths.profile,
};

export function tabFromPathname(pathname: string): MainTab {
  if (pathname === paths.consult) return "consult";
  if (pathname === paths.theme) return "theme";
  if (pathname === paths.profile || pathname === paths.history) return "profile";
  return "today";
}

export function authCallbackUrl(): string {
  return `${window.location.origin}${paths.authCallback}`;
}
