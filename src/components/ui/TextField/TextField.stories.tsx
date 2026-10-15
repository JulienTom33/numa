import type { Meta, StoryObj } from "@storybook/react-vite";
import TextField from "./TextField";

const meta = {
  title: "Base/TextField",
  component: TextField,
  args: { id: "storybook__input--demo", label: "Prénom ou pseudonyme", placeholder: "Léa" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "Il sera utilisé pour personnaliser vos lectures." },
};

export const WithError: Story = {
  args: {
    label: "Email",
    type: "email",
    defaultValue: "lea@",
    error: "Saisissez une adresse email valide.",
  },
};

export const Filled: Story = { args: { defaultValue: "Léa" } };

export const Disabled: Story = { args: { disabled: true, defaultValue: "Léa" } };

export const HiddenLabel: Story = {
  args: { label: "Ville de naissance", hideLabel: true, placeholder: "Ville de naissance" },
};
