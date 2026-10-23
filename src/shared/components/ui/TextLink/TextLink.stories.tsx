import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import TextLink from "./TextLink";

const meta = {
  title: "Base/TextLink",
  component: TextLink,
  args: { id: "storybook__link--demo", children: "Découvrir sans compte", onClick: fn() },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {};

export const AsAnchor: Story = { args: { href: "#", children: "J'ai déjà un compte" } };

export const Ink: Story = { args: { tone: "ink", children: "Comprendre mon thème" } };

export const Coral: Story = { args: { tone: "coral", children: "Ce n'est pas exact ? Modifier" } };
