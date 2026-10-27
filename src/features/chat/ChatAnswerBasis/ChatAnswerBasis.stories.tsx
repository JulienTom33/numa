import type { Meta, StoryObj } from "@storybook/react-vite";
import type { AnswerBasis } from "../answerBasis/answerBasis";
import ChatAnswerBasis from "./ChatAnswerBasis";

const basis: AnswerBasis = {
  confidence: "high",
  houseSystem: "placidus",
  bodies: [
    { body: "sun", sign: "leo", degreeInSign: 12.3, retrograde: false, house: 5 },
    { body: "mercury", sign: "virgo", degreeInSign: 3, retrograde: true, house: 6 },
  ],
  ascendant: { sign: "scorpio", degreeInSign: 20 },
  midheaven: { sign: "leo", degreeInSign: 1.5 },
  aspects: [{ bodyA: "sun", bodyB: "moon", type: "square", orb: 2.1 }],
  warnings: [],
};

const meta = {
  title: "Chat/ChatAnswerBasis",
  component: ChatAnswerBasis,
  args: { messageId: "m2", basis },
  decorators: [
    (Story) => (
      <div className="w-[320px] text-sm text-ink-secondary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatAnswerBasis>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const WithoutChart: Story = { args: { basis: null } };

export const UnknownBirthTime: Story = {
  args: {
    basis: {
      ...basis,
      confidence: "low",
      houseSystem: null,
      ascendant: null,
      midheaven: null,
      bodies: basis.bodies.map((body) => ({ ...body, house: null })),
      warnings: ["unknown_time"],
    },
  },
};

export const NoAspects: Story = { args: { basis: { ...basis, aspects: [] } } };

export const PolarFallback: Story = {
  args: { basis: { ...basis, houseSystem: "porphyry", warnings: ["polar_fallback"] } },
};

export const WithWarnings: Story = {
  args: {
    basis: {
      ...basis,
      confidence: "medium",
      warnings: ["approximate_time", "moon_sign_uncertain"],
    },
  },
};
