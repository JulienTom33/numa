import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Button from "./Button";

const meta = {
  title: "Base/Button",
  component: Button,
  args: { id: "storybook__button--demo", children: "Créer mon compte", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Ink: Story = { args: { variant: "ink", children: "Continuer avec Google" } };

export const Outline: Story = { args: { variant: "outline", children: "Se connecter" } };

export const Soft: Story = { args: { variant: "soft", children: "Recevoir un lien par email" } };

export const Danger: Story = { args: { variant: "danger", children: "Supprimer mes données" } };

export const Disabled: Story = { args: { disabled: true, children: "Continuer" } };

export const Loading: Story = { args: { loading: true, loadingLabel: "Envoi du lien…" } };

export const Small: Story = { args: { size: "sm", variant: "outline", children: "Modifier" } };

export const FullWidth: Story = {
  args: { fullWidth: true, children: "Voir mon thème" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-3">
      <Button {...args} id="storybook__button--primary">
        Créer mon compte
      </Button>
      <Button {...args} id="storybook__button--ink" variant="ink">
        Continuer avec Google
      </Button>
      <Button {...args} id="storybook__button--outline" variant="outline">
        Continuer avec Apple
      </Button>
      <Button {...args} id="storybook__button--soft" variant="soft">
        Recevoir un lien par email
      </Button>
      <Button {...args} id="storybook__button--danger" variant="danger">
        Supprimer mes données
      </Button>
    </div>
  ),
};
