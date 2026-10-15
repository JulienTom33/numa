import type { Meta, StoryObj } from "@storybook/react-vite";
import StepChecklist from "./StepChecklist";

const meta = {
  title: "Composés/StepChecklist",
  component: StepChecklist,
  args: {
    id: "storybook__checklist--chart",
    completedCount: 2,
    steps: [
      { id: "check", label: "Vérification de vos données" },
      { id: "timezone", label: "Fuseau horaire historique" },
      { id: "planets", label: "Positions planétaires" },
      { id: "ascendant", label: "Calcul de l'ascendant" },
      { id: "houses", label: "Maisons et aspects" },
      { id: "reading", label: "Préparation de votre lecture" },
    ],
  },
  argTypes: { completedCount: { control: { type: "range", min: 0, max: 6, step: 1 } } },
} satisfies Meta<typeof StepChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const Start: Story = { args: { completedCount: 0 } };

export const Complete: Story = { args: { completedCount: 6 } };
