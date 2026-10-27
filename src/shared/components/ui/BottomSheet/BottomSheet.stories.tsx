import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import Button from "../Button/Button";
import BottomSheet from "./BottomSheet";

const meta = {
  title: "Composés/BottomSheet",
  component: BottomSheet,
  args: {
    id: "storybook__sheet--about",
    open: true,
    title: "Qui est Sidéra ?",
    onClose: () => undefined,
    children:
      "Sidéra lit votre thème astral à partir de vos données de naissance et vous explique ce qu'il dit, sans certitude ni jargon.",
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "480px" },
      description: {
        component:
          "Modale en bas d'écran : focus placé sur le premier contrôle et piégé (Tab / Maj+Tab), fermeture par le bouton, Échap ou un clic sur le voile, focus rendu à l'élément déclencheur.",
      },
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className="flex min-h-screen items-start justify-center p-6">
        <Button id="storybook__button--open-sheet" onClick={() => updateArgs({ open: true })}>
          Ouvrir la fiche
        </Button>
        <BottomSheet {...args} onClose={() => updateArgs({ open: false })} />
      </div>
    );
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const About: Story = {};

export const ConversionPrompt: Story = {
  args: {
    id: "storybook__sheet--conversion",
    title: "Gardez votre lecture avec vous",
    children:
      "Créez un compte gratuit pour retrouver vos lectures, votre thème et vos conversations sur tous vos appareils.",
    footer: (
      <>
        <Button id="storybook__button--signup" fullWidth>
          Créer un compte
        </Button>
        <Button id="storybook__button--login" variant="outline" fullWidth>
          Se connecter
        </Button>
        <Button id="storybook__button--later" variant="soft" fullWidth>
          Continuer sans compte
        </Button>
      </>
    ),
  },
};

export const DeleteConfirmation: Story = {
  args: {
    id: "storybook__sheet--delete",
    title: "Supprimer mes données ?",
    children: "Votre thème, vos conversations et vos préférences seront définitivement effacés.",
    footer: (
      <>
        <Button id="storybook__button--confirm-delete" variant="danger" fullWidth>
          Supprimer définitivement
        </Button>
        <Button id="storybook__button--cancel-delete" variant="outline" fullWidth>
          Annuler
        </Button>
      </>
    ),
  },
};
