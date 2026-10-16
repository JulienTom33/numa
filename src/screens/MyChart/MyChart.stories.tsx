import type { Meta, StoryObj } from "@storybook/react-vite";
import MyChart from "./MyChart";
import { approximateTimeChart, completeChart, unknownTimeChart } from "./myChartFixtures";

const meta = {
  title: "Écrans/Thème/Mon thème",
  component: MyChart,
  args: {
    status: "ready",
    data: completeChart,
    errorCode: null,
    onRetry: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-app bg-page px-4 pt-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Écran « Mon thème » : trio Soleil / Lune / Ascendant, carte Ascendant, carte du ciel dépliable (roue SVG avec alternative textuelle), transits actuels et méthode de calcul.",
      },
    },
  },
} satisfies Meta<typeof MyChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const SkyChartOpen: Story = { args: { skyDefaultOpen: true } };

export const UnknownTime: Story = { args: { data: unknownTimeChart, skyDefaultOpen: true } };

export const TransitsUnavailable: Story = { args: { data: approximateTimeChart } };

export const Loading: Story = { args: { status: "loading", data: null } };

export const CalculationError: Story = {
  args: { status: "error", data: null, errorCode: "network_error" },
};
