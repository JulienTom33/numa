import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import Switch from "./Switch";

const meta = {
  title: "Base/Switch",
  component: Switch,
  args: {
    id: "storybook__switch--demo",
    label: "Notifications horoscope",
    checked: true,
    onChange: () => undefined,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className="w-80">
        <Switch {...args} onChange={(checked) => updateArgs({ checked })} />
      </div>
    );
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = { args: { checked: false } };

export const WithDescription: Story = { args: { description: "Chaque matin à 8 h" } };

export const Disabled: Story = { args: { disabled: true } };
