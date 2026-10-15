import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Avatar from "./Avatar";

const meta = {
  title: "Base/Avatar",
  component: Avatar,
  args: { id: "storybook__avatar--user", name: "Léa" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = { args: { onClick: fn(), label: "Ouvrir mon profil" } };

export const ProfileHeader: Story = { args: { size: "lg", showEditBadge: true } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar id="storybook__avatar--sm" name="Léa" size="sm" />
      <Avatar id="storybook__avatar--md" name="Léa" size="md" />
      <Avatar id="storybook__avatar--lg" name="Léa" size="lg" />
    </div>
  ),
};
