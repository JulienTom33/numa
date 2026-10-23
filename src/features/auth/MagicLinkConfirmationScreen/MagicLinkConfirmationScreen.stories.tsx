import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import MagicLinkConfirmationScreen from "./MagicLinkConfirmationScreen";

const meta = {
  title: "Écrans/Lien magique/Confirmation",
  component: MagicLinkConfirmationScreen,
  args: {
    email: "lea@example.fr",
    onOpenSpace: fn(),
    onResend: fn(),
    onBack: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MagicLinkConfirmationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JustSent: Story = {};

export const ResendAvailable: Story = {
  args: { initialCooldownSeconds: 0 },
};

export const Resending: Story = {
  args: {
    initialCooldownSeconds: 0,
    onResend: fn(() => new Promise<void>(() => undefined)),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Renvoyer le lien" }));
    await expect(canvas.getByRole("button", { name: "Renvoi en cours…" })).toBeDisabled();
  },
};

export const Resent: Story = {
  args: { initialCooldownSeconds: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Renvoyer le lien" }));
    await expect(await canvas.findByText(/Un nouveau lien vient d'être envoyé/)).toBeVisible();
  },
};

export const ResendFailed: Story = {
  args: {
    initialCooldownSeconds: 0,
    onResend: fn(() => Promise.reject(new Error("network"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Renvoyer le lien" }));
    await expect(await canvas.findByRole("alert")).toBeVisible();
  },
};

export const LongAddress: Story = {
  args: { email: "lea.martin-dupont+numa@sous-domaine.exemple-tres-long.fr" },
};
