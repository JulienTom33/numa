import type { TabBarItem } from "../components/ui/TabBar/TabBar";

export type MainTab = "today" | "consult" | "theme" | "profile";

export const mainTabs: TabBarItem<MainTab>[] = [
  { key: "today", label: "Aujourd'hui", icon: "today" },
  { key: "consult", label: "Consulter", icon: "consult" },
  { key: "theme", label: "Mon thème", icon: "theme" },
  { key: "profile", label: "Profil", icon: "profile" },
];
