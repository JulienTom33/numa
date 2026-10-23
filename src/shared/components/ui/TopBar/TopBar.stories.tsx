import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Avatar from "../Avatar/Avatar";
import Badge from "../Badge/Badge";
import TopBar from "./TopBar";

const meta = {
  title: "Composés/TopBar",
  component: TopBar,
  args: { id: "storybook__topbar--main" },
  decorators: [
    (Story) => (
      <div className="w-[390px] px-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBackAndTitle: Story = {
  args: { onBack: fn(), title: "Horoscope du jour" },
};

export const OnboardingStep: Story = {
  args: {
    onBack: fn(),
    trailing: <Badge id="storybook__badge--discovery">Mode découverte</Badge>,
  },
};

export const Dashboard: Story = {
  args: {
    leading: <Badge id="storybook__badge--discovery-dashboard">Mode découverte</Badge>,
    trailing: (
      <Avatar id="storybook__avatar--topbar" name="Léa" label="Ouvrir mon profil" onClick={fn()} />
    ),
  },
};

export const AvatarOnly: Story = {
  args: {
    trailing: (
      <Avatar
        id="storybook__avatar--topbar-only"
        name="Léa"
        label="Ouvrir mon profil"
        onClick={fn()}
      />
    ),
  },
};
