import type { Meta, StoryObj } from "@storybook/react-vite";
import StepHeader from "./StepHeader";

const meta = {
  title: "Composés/StepHeader",
  component: StepHeader,
  args: {
    id: "storybook__step--name",
    step: 1,
    total: 5,
    title: "Comment devons-nous vous appeler ?",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {};

export const MiddleStep: Story = {
  args: { step: 3, title: "À quelle heure êtes-vous né(e) ?" },
};

export const WithSubtitle: Story = {
  args: {
    step: 4,
    title: "Où êtes-vous né(e) ?",
    subtitle: "Le lieu permet de déterminer votre fuseau horaire et votre ascendant.",
  },
};

export const LastStep: Story = { args: { step: 5, title: "Votre ascendant" } };
