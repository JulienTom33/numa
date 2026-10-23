import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Logo from "./Logo";

const meta = {
  title: "Base/Logo",
  component: Logo,
  args: { id: "storybook__logo--main" },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { size: "lg" } };

export const ClickableWordmark: Story = { args: { size: "lg", onWordmarkClick: fn() } };

export const MarkOnly: Story = { args: { showWordmark: false } };
