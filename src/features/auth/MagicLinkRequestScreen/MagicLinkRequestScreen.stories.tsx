import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import MagicLinkRequestScreen from "./MagicLinkRequestScreen";

const meta = {
  title: "Écrans/Lien magique/Saisie",
  component: MagicLinkRequestScreen,
  args: { onSend: fn(), onBack: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MagicLinkRequestScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const InvalidEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Adresse email"), "lea@example");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Envoyer le lien" })).toBeDisabled();
  },
};

export const ValidEmail: Story = {
  args: { defaultEmail: "lea@example.fr" },
};

export const Sending: Story = {
  args: {
    defaultEmail: "lea@example.fr",
    onSend: fn(() => new Promise<void>(() => undefined)),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Envoyer le lien" }));
    await expect(canvas.getByRole("button", { name: "Envoi en cours…" })).toBeDisabled();
  },
};

export const SendFailed: Story = {
  args: {
    defaultEmail: "lea@example.fr",
    onSend: fn(() => Promise.reject(new Error("network"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Envoyer le lien" }));
    await expect(await canvas.findByRole("alert")).toBeVisible();
  },
};
