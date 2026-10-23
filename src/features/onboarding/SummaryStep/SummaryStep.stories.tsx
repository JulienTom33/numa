import type { Meta, StoryObj } from "@storybook/react-vite";
import type { OnboardingData } from "../birthData/birthData";
import SummaryStep from "./SummaryStep";

const data: OnboardingData = {
  firstName: "Émile",
  birthDate: "1990-03-12",
  birthTime: { precision: "exact", time: "14:30", margin: null },
  birthPlace: { label: "Bordeaux, Gironde, France", latitude: 44.84, longitude: -0.58, timezone: "Europe/Paris" },
};

const meta = {
  title: "Écrans/Onboarding/Récapitulatif",
  component: SummaryStep,
  args: {
    data,
    onEdit: () => undefined,
    onConfirm: () => undefined,
    onBack: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Étape 5 de l'onboarding : récapitulatif des réponses, liens « Modifier » vers chaque étape et validation du parcours.",
      },
    },
  },
} satisfies Meta<typeof SummaryStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExactTime: Story = {};

export const ApproximateTime: Story = {
  args: { data: { ...data, birthTime: { precision: "approximate", time: "08:45", margin: "between_30_min_and_2_h" } } },
};

export const UnknownTime: Story = {
  args: { data: { ...data, birthTime: { precision: "unknown", time: "", margin: null } } },
};

export const DiscoveryMode: Story = { args: { discoveryMode: true } };

export const Saving: Story = { args: { saving: true } };

export const SaveError: Story = {
  args: { error: "Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez." },
};
