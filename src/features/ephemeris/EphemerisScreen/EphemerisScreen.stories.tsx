import type { Meta, StoryObj } from "@storybook/react-vite";
import { sampleEphemeris } from "../ephemerisFixtures/ephemerisFixtures";
import EphemerisScreen from "./EphemerisScreen";

const meta = {
  title: "Écrans/Éphéméride/Écran",
  component: EphemerisScreen,
  args: {
    status: "ready",
    data: sampleEphemeris,
    period: "day",
    range: { from: "2026-10-30", to: "2026-10-30" },
    selectedDay: "2026-10-30",
    onBack: () => undefined,
    onPeriodChange: () => undefined,
    onPrevious: () => undefined,
    onNext: () => undefined,
    onToday: () => undefined,
    onSelectDay: () => undefined,
    onRetry: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-app bg-page px-4 pt-2">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EphemerisScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Day: Story = {};

export const Week: Story = {
  args: { period: "week", range: { from: "2026-10-26", to: "2026-11-01" } },
};

export const Month: Story = {
  args: { period: "month", range: { from: "2026-10-01", to: "2026-10-31" } },
};

export const Loading: Story = { args: { status: "loading", data: null } };

export const ErrorState: Story = { args: { status: "error", data: null } };

export const Empty: Story = { args: { data: { ...sampleEphemeris, days: [] } } };
