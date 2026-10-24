import type { Meta, StoryObj } from "@storybook/react-vite";
import { completeSummary } from "../../chart/ChartSummary/chartSummaryFixtures";
import ChatView from "./ChatView";

const meta = {
  title: "Chat/ChatView",
  component: ChatView,
  args: {
    messages: [],
    sending: false,
    errorMessage: null,
    summary: completeSummary,
    quota: { limit: 2, used: 0, remaining: 2 },
    exhausted: false,
    draft: "",
    onDraftChange: () => undefined,
    onSend: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="flex w-[358px] justify-center md:w-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Sending: Story = {
  args: { sending: true, messages: [{ id: "m1", author: "user", text: "Comment se présente ma semaine ?" }] },
};

export const Success: Story = {
  args: {
    messages: [
      { id: "m1", author: "user", text: "Comment se présente ma semaine ?" },
      { id: "m2", author: "numa", text: "Cette semaine invite à ralentir, sans certitude : à vous d'évaluer." },
    ],
  },
};

export const ErrorState: Story = {
  args: { errorMessage: "Le service est momentanément indisponible.", draft: "Ma question" },
};

export const QuotaReached: Story = {
  args: { exhausted: true, quota: { limit: 2, used: 2, remaining: 0 } },
};

export const ProfileLoading: Story = { args: { summary: null, quota: null } };
