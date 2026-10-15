import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { iconNames } from "../Icon/icons";
import IconButton from "./IconButton";

const meta = {
  title: "Base/IconButton",
  component: IconButton,
  args: { id: "storybook__button--icon", icon: "close", label: "Fermer", onClick: fn() },
  argTypes: { icon: { control: "select", options: iconNames } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};

export const Surface: Story = { args: { variant: "surface", icon: "back", label: "Retour" } };

export const Disabled: Story = { args: { disabled: true } };
