import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import TabBar from "./TabBar";

const meta = {
  title: "Composés/TabBar",
  component: TabBar,
  args: {
    id: "storybook__tabbar--main",
    items: [
      { key: "today", label: "Aujourd'hui", icon: "today" },
      { key: "consult", label: "Consulter", icon: "consult" },
      { key: "theme", label: "Mon thème", icon: "theme" },
      { key: "profile", label: "Profil", icon: "profile" },
    ],
    activeKey: "today",
    onSelect: () => undefined,
  },
  parameters: { layout: "fullscreen" },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className="mx-auto flex h-[300px] max-w-app flex-col justify-end bg-page">
        <TabBar {...args} onSelect={(activeKey) => updateArgs({ activeKey })} />
      </div>
    );
  },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {};

export const Profile: Story = { args: { activeKey: "profile" } };
