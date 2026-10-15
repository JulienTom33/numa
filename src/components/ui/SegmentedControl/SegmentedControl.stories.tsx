import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import SegmentedControl from "./SegmentedControl";

const meta = {
  title: "Base/SegmentedControl",
  component: SegmentedControl,
  args: {
    id: "storybook__segmented--day",
    label: "Jour de l'horoscope",
    options: [
      { value: "yesterday", label: "Hier" },
      { value: "today", label: "Aujourd'hui" },
      { value: "tomorrow", label: "Demain" },
    ],
    value: "today",
    onChange: () => undefined,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <SegmentedControl {...args} onChange={(value) => updateArgs({ value })} />;
  },
  parameters: {
    docs: {
      description: {
        component:
          "Groupe radio : Tab entre dans le groupe sur l'option active, les flèches, Début et Fin changent la sélection.",
      },
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {};

export const Yesterday: Story = { args: { value: "yesterday" } };
