import type { Meta, StoryObj } from "@storybook/react-vite";
import Icon from "./Icon";
import { iconNames } from "./icons";

const meta = {
  title: "Base/Icon",
  component: Icon,
  args: { name: "info", size: 24 },
  argTypes: { name: { control: "select", options: iconNames } },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllIcons: Story = {
  render: () => (
    <ul className="grid grid-cols-4 gap-4 text-ink">
      {iconNames.map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-xs text-ink-secondary">
          <Icon name={name} size={24} className="text-ink" />
          {name}
        </li>
      ))}
    </ul>
  ),
};
