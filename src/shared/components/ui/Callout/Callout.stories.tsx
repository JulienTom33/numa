import type { Meta, StoryObj } from "@storybook/react-vite";
import Callout from "./Callout";

const meta = {
  title: "Base/Callout",
  component: Callout,
  args: {
    id: "storybook__callout--demo",
    tone: "info",
    title: "Bordeaux, France",
    children: "Fuseau horaire détecté : Europe/Paris (UTC+1).",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Warning: Story = {
  args: {
    tone: "warning",
    title: "Heure inconnue",
    children: "Votre ascendant et vos maisons seront imprécis.",
  },
};

export const Success: Story = {
  args: { tone: "success", title: undefined, children: "Date enregistrée : 12 juin 1994." },
};

export const ErrorTone: Story = {
  args: {
    tone: "error",
    title: "Le calcul a échoué",
    children: "Vérifiez votre connexion puis réessayez.",
  },
};

export const Highlight: Story = {
  args: {
    tone: "highlight",
    title: "Ascendant Balance",
    children: "Selon nos calculs, votre ascendant est Balance.",
  },
};
