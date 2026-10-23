import type { Meta, StoryObj } from "@storybook/react-vite";
import ChartProgress from "./ChartProgress";

const meta = {
  title: "Écrans/Thème/Calcul",
  component: ChartProgress,
  args: { completedCount: 3, status: "loading", errorCode: null, onRetry: () => undefined },
  argTypes: { completedCount: { control: { type: "range", min: 0, max: 6, step: 1 } } },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Écran de progression du calcul du thème. Chaque étape est cochée à la réception de l'événement correspondant émis par l'Edge Function natal-chart.",
      },
    },
  },
} satisfies Meta<typeof ChartProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const Start: Story = { args: { completedCount: 0 } };

export const Done: Story = { args: { completedCount: 6, status: "done" } };

export const CalculationError: Story = { args: { completedCount: 2, status: "error", errorCode: "network_error" } };

export const ReducedMotion: Story = {
  decorators: [
    (Story) => (
      <div className="[&_*]:!transition-none">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Rendu avec les transitions désactivées, comme lorsque l'utilisateur active « réduire les animations » (classes motion-reduce).",
      },
    },
  },
};
