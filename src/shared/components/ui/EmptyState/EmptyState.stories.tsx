import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Button from "../Button/Button";
import EmptyState from "./EmptyState";

const meta = {
  title: "Composés/EmptyState",
  component: EmptyState,
  args: {
    id: "storybook__empty--history",
    title: "Aucune conversation",
    description: "Vos échanges avec Numa apparaîtront ici.",
    icon: "history",
  },
  decorators: [
    (Story) => (
      <div className="w-[358px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const History: Story = {};

export const ChatWelcome: Story = {
  args: {
    id: "storybook__empty--chat",
    icon: "consult",
    title: "Posez votre question à Numa",
    description: "Numa répond à partir de votre thème et des transits du moment.",
  },
};

export const WithAction: Story = {
  args: {
    action: (
      <Button id="storybook__button--first-question" size="sm" onClick={fn()}>
        Poser une question
      </Button>
    ),
  },
};
