import type { Meta, StoryObj } from "@storybook/react-vite";
import { approximateTimeChart, completeChart, unknownTimeChart } from "../../chart/MyChart/myChartFixtures";
import TodayScreen from "./TodayScreen";

const meta = {
  title: "Écrans/Aujourd'hui/Tableau de bord",
  component: TodayScreen,
  args: {
    status: "ready",
    data: completeChart,
    errorCode: null,
    isAnonymous: false,
    today: new Date("2026-10-24T10:00:00Z"),
    onRetry: () => undefined,
    onOpenProfile: () => undefined,
    onSignUp: () => undefined,
    onAskQuestion: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-app bg-page px-4 pt-2">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TodayScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {};

export const Discovery: Story = { args: { isAnonymous: true } };

export const IncompleteData: Story = { args: { data: unknownTimeChart } };

export const SkyUnavailable: Story = { args: { data: approximateTimeChart } };

export const Loading: Story = { args: { status: "loading", data: null } };

export const LoadError: Story = { args: { status: "error", data: null, errorCode: "network_error" } };
