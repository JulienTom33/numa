import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import MagicLinkScreen from "./MagicLinkScreen";

const meta = {
  title: "Écrans/Lien magique/Parcours",
  component: MagicLinkScreen,
  args: { onSend: fn(), onResend: fn(), onOpenSpace: fn(), onBack: fn() },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Enchaîne la saisie et la confirmation. Les envois sont délégués aux callbacks : la logique Supabase est portée par le ticket #14.",
      },
    },
  },
} satisfies Meta<typeof MagicLinkScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flow: Story = {};

export const ShortCooldown: Story = {
  args: { resendCooldownSeconds: 5 },
};
