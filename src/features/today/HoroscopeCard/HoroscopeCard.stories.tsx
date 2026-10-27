import type { Meta, StoryObj } from "@storybook/react-vite";
import HoroscopeCard from "./HoroscopeCard";
import { incompleteHoroscope, sampleHoroscope } from "./horoscopeFixtures";

const meta = {
  title: "Écrans/Aujourd'hui/Horoscope du jour",
  component: HoroscopeCard,
  args: {
    status: "ready",
    data: sampleHoroscope,
    errorCode: null,
    onRetry: () => undefined,
    onOpenProfile: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-app bg-page px-4 py-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HoroscopeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const IncompleteData: Story = { args: { data: incompleteHoroscope } };

export const Loading: Story = { args: { status: "loading", data: null } };

export const AiUnavailable: Story = {
  args: { status: "error", data: null, errorCode: "ai_unavailable" },
};

export const BirthDataMissing: Story = {
  args: { status: "error", data: null, errorCode: "birth_data_not_found" },
};

export const DailyLimitReached: Story = {
  args: { status: "error", data: null, errorCode: "ai_daily_limit_exceeded" },
};
