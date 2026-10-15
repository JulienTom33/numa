import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import DiscoverButton from "./DiscoverButton";

const meta = {
  title: "App/DiscoverButton",
  component: DiscoverButton,
  args: { onClick: fn(), loading: false, error: null },
} satisfies Meta<typeof DiscoverButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const WithError: Story = {
  args: { error: "Impossible de créer la session. Vérifiez votre connexion." },
};
