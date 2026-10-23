import { useTranslation } from "react-i18next";
import type { TabBarItem } from "../../components/ui/TabBar/TabBar";

export type MainTab = "today" | "consult" | "theme" | "profile";

export const mainTabs: Omit<TabBarItem<MainTab>, "label">[] = [
  { key: "today", icon: "today" },
  { key: "consult", icon: "consult" },
  { key: "theme", icon: "theme" },
  { key: "profile", icon: "profile" },
];

export function useMainTabs(): TabBarItem<MainTab>[] {
  const { t } = useTranslation("common");
  return mainTabs.map((item) => ({ ...item, label: t(`tabs.${item.key}`) }));
}
