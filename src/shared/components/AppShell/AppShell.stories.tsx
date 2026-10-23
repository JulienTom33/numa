import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useMainTabs, type MainTab } from "../../navigation/mainTabs/mainTabs";
import EmptyState from "../ui/EmptyState/EmptyState";
import TabBar from "../ui/TabBar/TabBar";
import AppShell from "./AppShell";

const meta = {
  title: "App/AppShell",
  component: AppShell,
  args: { id: "storybook__shell--main", screenKey: "today", children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const sections = ["intro", "detail", "suite", "fin"];

export const WithTabBar: Story = {
  render: function Render(args) {
    const [activeTab, setActiveTab] = useState<MainTab>("today");
    const tabItems = useMainTabs();
    const tab = tabItems.find((item) => item.key === activeTab) ?? tabItems[0];
    return (
      <AppShell
        {...args}
        screenKey={activeTab}
        tabBar={
          <TabBar
            id="storybook__tabbar--main"
            items={tabItems}
            activeKey={activeTab}
            onSelect={setActiveTab}
          />
        }
      >
        {sections.map((section) => (
          <EmptyState
            key={section}
            id={`storybook__screen--${tab.key}-${section}`}
            icon={tab.icon}
            title={`${tab.label} (${section})`}
            description="Contenu long pour vérifier le défilement et son retour en haut."
          />
        ))}
      </AppShell>
    );
  },
};

export const WithoutTabBar: Story = {
  args: {
    screenKey: "welcome",
    children: (
      <EmptyState
        id="storybook__screen--welcome"
        title="Écran hors onglets"
        description="Les écrans secondaires n'affichent pas la barre d'onglets."
      />
    ),
  },
};
