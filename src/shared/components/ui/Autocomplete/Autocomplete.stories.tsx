import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import Autocomplete, { type AutocompleteSuggestion } from "./Autocomplete";

const cities: AutocompleteSuggestion[] = [
  { id: "bordeaux", label: "Bordeaux", description: "Gironde, France" },
  { id: "bourges", label: "Bourges", description: "Cher, France" },
  { id: "boulogne", label: "Boulogne-Billancourt", description: "Hauts-de-Seine, France" },
  { id: "bologna", label: "Bologne", description: "Émilie-Romagne, Italie" },
];

const meta = {
  title: "Composés/Autocomplete",
  component: Autocomplete,
  args: {
    id: "storybook__autocomplete--city",
    label: "Ville de naissance",
    placeholder: "Ex. : Bordeaux",
    value: "",
    suggestions: cities,
    onInputChange: () => undefined,
    onSelect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="h-80 w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Combobox ARIA : suggestions dès 2 caractères, flèches pour naviguer, Entrée pour choisir, Échap pour fermer. Les suggestions sont fournies par l'appelant (service de géocodage).",
      },
    },
  },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<{ value: string }>();
    const query = value.trim().toLocaleLowerCase("fr-FR");
    const suggestions = args.suggestions.filter((city) =>
      city.label.toLocaleLowerCase("fr-FR").startsWith(query),
    );
    return (
      <Autocomplete
        {...args}
        suggestions={suggestions}
        onInputChange={(next) => updateArgs({ value: next })}
        onSelect={(city) => updateArgs({ value: city.label })}
      />
    );
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Typing: Story = { args: { value: "Bo" } };

export const Loading: Story = { args: { value: "Bor", loading: true } };

export const NoResult: Story = { args: { value: "Zzz" } };

export const WithError: Story = {
  args: { value: "Bordo", error: "Sélectionnez une ville dans la liste." },
};
