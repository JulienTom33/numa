import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import Callout from "../Callout/Callout";
import TextField from "../TextField/TextField";
import SelectableCardGroup from "./SelectableCardGroup";

const meta = {
  title: "Composés/SelectableCardGroup",
  component: SelectableCardGroup,
  args: {
    id: "storybook__cards--birth-time",
    label: "Connaissez-vous votre heure de naissance ?",
    hideLabel: true,
    value: null,
    onChange: () => undefined,
    options: [
      {
        value: "exact",
        title: "Heure exacte",
        description: "Je connais l'heure à la minute près.",
        content: (
          <TextField id="storybook__input--exact-time" label="Heure de naissance" type="time" />
        ),
      },
      {
        value: "approximate",
        title: "Heure approximative",
        description: "Je connais l'heure à peu près.",
        content: (
          <TextField
            id="storybook__input--approximate-time"
            label="Heure approximative"
            type="time"
          />
        ),
      },
      {
        value: "unknown",
        title: "Heure inconnue",
        description: "Je ne connais pas mon heure de naissance.",
        content: (
          <Callout id="storybook__callout--unknown-time" tone="warning">
            Votre ascendant et vos maisons seront imprécis.
          </Callout>
        ),
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Boutons radio natifs : Tab entre dans le groupe, les flèches changent la sélection. Le contenu de l'option sélectionnée s'affiche sous la carte.",
      },
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <SelectableCardGroup {...args} onChange={(value) => updateArgs({ value })} />;
  },
} satisfies Meta<typeof SelectableCardGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingSelected: Story = {};

export const ExactSelected: Story = { args: { value: "exact" } };

export const UnknownSelected: Story = { args: { value: "unknown" } };
