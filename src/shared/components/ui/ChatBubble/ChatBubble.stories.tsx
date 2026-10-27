import type { Meta, StoryObj } from "@storybook/react-vite";
import ChatBubble from "./ChatBubble";

const meta = {
  title: "Composés/ChatBubble",
  component: ChatBubble,
  args: {
    id: "storybook__bubble--answer",
    author: "sidera",
    children:
      "Cette semaine invite à ralentir : la Lune traverse votre maison IV, un bon moment pour vous recentrer sur vos proches.",
    period: "du 14 au 20 octobre",
    why: "Lune en transit dans votre maison IV et Vénus en trigone à votre Soleil natal (Gémeaux).",
  },
  decorators: [
    (Story) => (
      <div className="flex w-[358px] flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SideraAnswer: Story = {};

export const UserQuestion: Story = {
  args: {
    id: "storybook__bubble--question",
    author: "user",
    children: "Comment se présente ma semaine ?",
    period: undefined,
    why: undefined,
  },
};

export const Pending: Story = { args: { pending: true } };

export const Conversation: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ChatBubble id="storybook__bubble--1" author="user">
        Est-ce un bon moment pour changer de travail ?
      </ChatBubble>
      <ChatBubble
        id="storybook__bubble--2"
        author="sidera"
        period="octobre à décembre"
        why="Jupiter en transit dans votre maison X."
      >
        Les prochains mois favorisent les projets professionnels, sans garantie d'issue : prenez le
        temps d'évaluer vos options.
      </ChatBubble>
      <ChatBubble id="storybook__bubble--3" author="user">
        Et pour ma vie amoureuse ?
      </ChatBubble>
      <ChatBubble id="storybook__bubble--4" author="sidera" pending />
    </div>
  ),
};
