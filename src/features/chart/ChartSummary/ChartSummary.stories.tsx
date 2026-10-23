import type { Meta, StoryObj } from "@storybook/react-vite";
import ChartSummary from "./ChartSummary";
import { approximateTimeSummary, completeSummary, unknownTimeSummary } from "./chartSummaryFixtures";

const meta = {
  title: "Écrans/Thème/Résumé",
  component: ChartSummary,
  args: {
    status: "ready",
    summary: completeSummary,
    errorCode: null,
    onRetry: () => undefined,
    onDiscover: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Écran « Votre profil astrologique » : Soleil, Lune et Ascendant, explications non catégoriques, données manquantes et carte Méthode. Les valeurs proviennent de l'Edge Function natal-chart.",
      },
    },
  },
} satisfies Meta<typeof ChartSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const UnknownTime: Story = { args: { summary: unknownTimeSummary } };

export const ApproximateTime: Story = { args: { summary: approximateTimeSummary } };

export const Loading: Story = { args: { status: "loading", summary: null } };

export const CalculationError: Story = { args: { status: "error", summary: null, errorCode: "network_error" } };

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: "responsive" } },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-app bg-page">
        <Story />
      </div>
    ),
  ],
};
