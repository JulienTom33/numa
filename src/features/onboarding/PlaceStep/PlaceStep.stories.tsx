import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { userEvent, within } from "storybook/test";
import PlaceStep, { type PlaceSearch, type PlaceSuggestion, type SelectedPlace } from "./PlaceStep";
import { PlaceSearchFailure } from "../placeSearchAdapter/placeSearchAdapter";

const cities: PlaceSuggestion[] = [
  {
    id: "bordeaux-fr",
    name: "Bordeaux",
    region: "Gironde",
    country: "France",
    countryCode: "FR",
    label: "Bordeaux, Gironde, France",
    latitude: 44.84,
    longitude: -0.58,
    timezone: "Europe/Paris",
  },
  {
    id: "bourges-fr",
    name: "Bourges",
    region: "Cher",
    country: "France",
    countryCode: "FR",
    label: "Bourges, Cher, France",
    latitude: 47.08,
    longitude: 2.4,
    timezone: "Europe/Paris",
  },
  {
    id: "bologna-it",
    name: "Bologne",
    region: "Émilie-Romagne",
    country: "Italie",
    countryCode: "IT",
    label: "Bologne, Émilie-Romagne, Italie",
    latitude: 44.49,
    longitude: 11.34,
    timezone: "Europe/Rome",
  },
];

const searchCities: PlaceSearch = async (query) => {
  const term = query.toLocaleLowerCase("fr-FR");
  return cities.filter((city) => city.name.toLocaleLowerCase("fr-FR").startsWith(term));
};

const typeQuery =
  (query: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const input = within(canvasElement).getByRole("combobox");
    await userEvent.type(input, query);
  };

const meta = {
  title: "Écrans/Onboarding/Lieu de naissance",
  component: PlaceStep,
  args: {
    id: "storybook__place-step--demo",
    search: searchCities,
    value: null,
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Contenu de l'étape 4 de l'onboarding. La recherche est injectée (en production : `toPlaceSearch(searchPlaces)`, service de géocodage #19) ; elle est débouncée et les réponses périmées sont ignorées.",
      },
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<{ value: SelectedPlace | null }>();
    return <PlaceStep {...args} onChange={(place) => updateArgs({ value: place })} />;
  },
} satisfies Meta<typeof PlaceStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = {
  args: { search: () => new Promise<PlaceSuggestion[]>(() => undefined) },
  play: typeQuery("Bor"),
};

export const Suggestions: Story = { play: typeQuery("Bo") };

export const NoResult: Story = {
  args: { search: async () => [] },
  play: typeQuery("Zzz"),
};

export const NetworkError: Story = {
  args: { search: async () => Promise.reject(new Error("offline")) },
  play: typeQuery("Bor"),
};

export const ServiceUnavailable: Story = {
  args: { search: async () => Promise.reject(new PlaceSearchFailure("service_unavailable")) },
  play: typeQuery("Bor"),
};

export const CitySelected: Story = { args: { value: cities[0] } };
