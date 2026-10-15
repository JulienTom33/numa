import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgressRing from "./ProgressRing";

const meta = {
  title: "Base/ProgressRing",
  component: ProgressRing,
  args: { id: "storybook__progress--chart", value: 45, label: "Calcul du thème" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100, step: 1 } } },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const Start: Story = { args: { value: 0 } };

export const Complete: Story = { args: { value: 100 } };
