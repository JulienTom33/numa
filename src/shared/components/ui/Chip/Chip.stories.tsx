import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Chip from "./Chip";

const suggestions = [
  "Comment se présente ma semaine ?",
  "Que dit mon thème sur ma vie amoureuse ?",
  "Est-ce un bon moment pour changer de travail ?",
  "Que signifie mon ascendant ?",
  "Quelle énergie pour ce week-end ?",
];

const meta = {
  title: "Base/Chip",
  component: Chip,
  args: { id: "storybook__chip--demo", children: suggestions[0], onClick: fn() },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { selected: true } };

export const Disabled: Story = { args: { disabled: true } };

export const Suggestions: Story = {
  render: (args) => (
    <div className="flex w-80 flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Chip key={suggestion} {...args} id={`storybook__chip--suggestion-${index + 1}`}>
          {suggestion}
        </Chip>
      ))}
    </div>
  ),
};
