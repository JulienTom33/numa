import type { Meta, StoryObj } from "@storybook/react-vite";
import { anonymousProfile, authenticatedProfile } from "../profileData/profileFixtures";
import ProfileScreen from "./ProfileScreen";

const meta = {
  title: "Écrans/Profil/Profil",
  component: ProfileScreen,
  args: {
    profile: authenticatedProfile,
    email: "camille@example.com",
    sun: "pisces",
    ascendant: "taurus",
    saved: false,
    onEdit: () => undefined,
    onOpenHistory: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-3xl bg-page px-4 pt-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProfileScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FreeAccount: Story = {};

export const DiscoveryMode: Story = {
  args: { profile: anonymousProfile, email: null, ascendant: null },
};

export const Saved: Story = { args: { saved: true } };
