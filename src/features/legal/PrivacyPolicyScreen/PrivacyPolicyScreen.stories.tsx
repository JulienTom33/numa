import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import PrivacyPolicyScreen from "./PrivacyPolicyScreen";

const meta = {
  title: "Écrans/Politique de confidentialité",
  component: PrivacyPolicyScreen,
  args: { onBack: fn() },
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "720px" },
      description: {
        component:
          "Politique de confidentialité du MVP, publique : données utilisées, IA, prestataires, conservation, suppression du compte et communications marketing.",
      },
    },
  },
} satisfies Meta<typeof PrivacyPolicyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
