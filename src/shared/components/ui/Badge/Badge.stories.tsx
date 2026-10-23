import type { Meta, StoryObj } from "@storybook/react-vite";
import Badge from "./Badge";

const meta = {
  title: "Base/Badge",
  component: Badge,
  args: { id: "storybook__badge--demo", children: "Mode découverte" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DiscoveryMode: Story = {};

export const FreeAccount: Story = { args: { tone: "sage", children: "Compte gratuit" } };

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge id="storybook__badge--violet">Mode découverte</Badge>
      <Badge id="storybook__badge--sage" tone="sage">
        Compte gratuit
      </Badge>
      <Badge id="storybook__badge--gold" tone="gold">
        Heure approximative
      </Badge>
      <Badge id="storybook__badge--sky" tone="sky">
        Profil analysé : Léa
      </Badge>
      <Badge id="storybook__badge--coral" tone="coral">
        1 lecture restante
      </Badge>
      <Badge id="storybook__badge--neutral" tone="neutral">
        Étape 2 sur 5
      </Badge>
    </div>
  ),
};
