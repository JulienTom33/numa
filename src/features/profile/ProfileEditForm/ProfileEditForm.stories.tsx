import type { Meta, StoryObj } from "@storybook/react-vite";
import { authenticatedProfile } from "../profileData/profileFixtures";
import ProfileEditForm from "./ProfileEditForm";

const meta = {
  title: "Écrans/Profil/Modifier",
  component: ProfileEditForm,
  args: {
    profile: authenticatedProfile,
    search: () => Promise.resolve([]),
    saving: false,
    errorCode: null,
    onSave: () => undefined,
    onCancel: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-3xl bg-page px-4 pt-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchanged: Story = {};

export const Saving: Story = { args: { saving: true } };

export const SaveError: Story = { args: { errorCode: "save_failed" } };
