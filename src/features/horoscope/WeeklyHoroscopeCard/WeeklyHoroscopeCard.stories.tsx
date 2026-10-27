import type { Meta, StoryObj } from "@storybook/react-vite";
import WeeklyHoroscopeCard from "./WeeklyHoroscopeCard";
import { calmWeeklyHoroscope, fallbackWeeklyHoroscope, sampleWeeklyHoroscope } from "./weeklyHoroscopeFixtures";

const meta = {
  title: "Écrans/Aujourd'hui/Horoscope de la semaine",
  component: WeeklyHoroscopeCard,
  args: {
    status: "ready",
    data: sampleWeeklyHoroscope,
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
} satisfies Meta<typeof WeeklyHoroscopeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const WithoutAi: Story = { args: { data: fallbackWeeklyHoroscope } };

export const CalmWeekWithoutAi: Story = { args: { data: calmWeeklyHoroscope } };

export const Loading: Story = { args: { status: "loading", data: null } };

export const NetworkError: Story = { args: { status: "error", data: null, errorCode: "network_error" } };

export const BirthDataMissing: Story = { args: { status: "error", data: null, errorCode: "birth_data_not_found" } };
