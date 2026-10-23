import type { Meta, StoryObj } from "@storybook/react-vite";
import AscendantStep from "./AscendantStep";

const meta = {
  title: "Écrans/Onboarding/Ascendant",
  component: AscendantStep,
  args: {
    value: { source: null, declaredSign: null },
    onChange: () => undefined,
    onContinue: () => undefined,
    onBack: () => undefined,
    onRetry: () => undefined,
    computedStatus: "ready",
    computed: { sign: "scorpio", degreeInSign: 14.6 },
    computedErrorCode: null,
    precise: true,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Étape 5 de l'onboarding, après le récapitulatif : ascendant calculé (heure exacte et lieu connus) ou déclaré, avec choix de la version à conserver en cas d'écart.",
      },
    },
  },
} satisfies Meta<typeof AscendantStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Computed: Story = {};

export const Loading: Story = { args: { computedStatus: "loading", computed: null } };

export const CalculationError: Story = {
  args: { computedStatus: "error", computed: null, computedErrorCode: "network_error" },
};

export const DeclaredUnknown: Story = { args: { precise: false, computedStatus: "ready", computed: null } };

export const DeclaredMismatch: Story = {
  args: { precise: false, value: { source: "declared", declaredSign: "leo" } },
};

export const DiscoveryMode: Story = { args: { discoveryMode: true } };

export const Saving: Story = { args: { saving: true } };
