import type { Meta, StoryObj } from "@storybook/react-vite";
import MonthlyHoroscopeCard from "./MonthlyHoroscopeCard";
import { calmMonthlyHoroscope, fallbackMonthlyHoroscope, sampleMonthlyHoroscope } from "./monthlyHoroscopeFixtures";

const meta = {
  title: "Écrans/Aujourd'hui/Horoscope du mois",
  component: MonthlyHoroscopeCard,
  args: {
    status: "ready",
    data: sampleMonthlyHoroscope,
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
} satisfies Meta<typeof MonthlyHoroscopeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const WithoutAi: Story = { args: { data: fallbackMonthlyHoroscope } };

export const CalmMonthWithoutAi: Story = { args: { data: calmMonthlyHoroscope } };

export const Loading: Story = { args: { status: "loading", data: null } };

export const NetworkError: Story = { args: { status: "error", data: null, errorCode: "network_error" } };

export const BirthDataMissing: Story = { args: { status: "error", data: null, errorCode: "birth_data_not_found" } };
