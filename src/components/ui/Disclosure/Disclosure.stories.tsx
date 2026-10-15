import type { Meta, StoryObj } from "@storybook/react-vite";
import Disclosure from "./Disclosure";

const meta = {
  title: "Base/Disclosure",
  component: Disclosure,
  args: {
    id: "storybook__disclosure--why",
    summary: "Pourquoi cette lecture ?",
    children:
      "Vénus en trigone à votre Lune natale (du 14 au 17 octobre) favorise les échanges affectifs.",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = { args: { defaultOpen: true } };

export const BirthTimeHelp: Story = {
  args: {
    id: "storybook__disclosure--where",
    summary: "Où trouver cette information ?",
    children:
      "L'heure figure sur la copie intégrale de votre acte de naissance, à demander à la mairie de votre lieu de naissance.",
  },
};
