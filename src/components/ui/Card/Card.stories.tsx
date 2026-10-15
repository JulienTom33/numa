import type { Meta, StoryObj } from "@storybook/react-vite";
import Card from "./Card";

const meta = {
  title: "Base/Card",
  component: Card,
  args: {
    id: "storybook__card--demo",
    children: (
      <>
        <h3 className="text-title-sm font-bold">Méthode</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          Zodiaque tropical, maisons Placidus. Calculé le 15 octobre 2026.
        </p>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const White: Story = {};

export const Surface: Story = { args: { tone: "surface" } };

export const Violet: Story = {
  args: {
    tone: "violet",
    padding: "lg",
    children: (
      <>
        <h3 className="text-title-sm font-bold text-violet-ink">Votre énergie du jour</h3>
        <p className="mt-1 text-sm text-ink">Une journée propice aux échanges sincères.</p>
      </>
    ),
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="grid w-80 grid-cols-2 gap-3">
      {(["white", "surface", "violet", "sky", "gold", "sage", "coral"] as const).map((tone) => (
        <Card key={tone} id={`storybook__card--${tone}`} tone={tone}>
          <span className="font-display text-sm font-semibold">{tone}</span>
        </Card>
      ))}
    </div>
  ),
};
