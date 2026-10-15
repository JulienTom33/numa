import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import TimeStep from "./TimeStep";
import { isTimeStepComplete, type TimeStepValue } from "./timeStepValue";

const meta = {
  title: "Écrans/Onboarding/TimeStep",
  component: TimeStep,
  args: {
    value: { precision: null },
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-app bg-page p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Contenu de l'étape 3 de l'onboarding, à placer dans le gabarit d'étape (#77). `isTimeStepComplete(value)` pilote le bouton « Continuer ».",
      },
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    const value: TimeStepValue = args.value;
    return (
      <div className="flex flex-col gap-4">
        <TimeStep value={value} onChange={(next) => updateArgs({ value: next })} />
        <p id="storybook__text--completeness" className="text-sm text-ink-secondary">
          Étape {isTimeStepComplete(value) ? "complète" : "incomplète"}
        </p>
      </div>
    );
  },
} satisfies Meta<typeof TimeStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingSelected: Story = {};

export const ExactIncomplete: Story = { args: { value: { precision: "exact" } } };

export const ExactComplete: Story = { args: { value: { precision: "exact", time: "08:45" } } };

export const ApproximateIncomplete: Story = {
  args: { value: { precision: "approximate", time: "08:45" } },
};

export const ApproximateComplete: Story = {
  args: { value: { precision: "approximate", time: "08:45", margin: "30-min-to-2-h" } },
};

export const Unknown: Story = { args: { value: { precision: "unknown" } } };
