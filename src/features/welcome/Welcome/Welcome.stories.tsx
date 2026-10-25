import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import Welcome from "./Welcome";

const meta = {
  title: "Écrans/Accueil",
  component: Welcome,
  args: { onSignUp: fn(), onSignIn: fn(), onDiscover: fn(), onPrivacy: fn() },
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "720px" },
      description: {
        component:
          "Écran d'accueil : création de compte, connexion ou découverte sans compte. Le mot-symbole « Numa » ouvre la fiche « Qui est Numa ? » (fermeture par le bouton, Échap ou un clic sur le voile).",
      },
    },
  },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DiscoverError: Story = {
  args: { discoverError: "Session anonyme non créée." },
};

export const AboutSheetOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Numa" }));
    await expect(canvas.getByRole("dialog", { name: "Qui est Numa ?" })).toBeInTheDocument();
  },
};
