import type { Meta, StoryObj } from "@storybook/react-vite";
import PlanetTrio from "./PlanetTrio";

const meta = {
  title: "Composés/PlanetTrio",
  component: PlanetTrio,
  args: {
    id: "storybook__trio--main",
    sun: { sign: "Gémeaux" },
    moon: { sign: "Poissons" },
    ascendant: { sign: "Balance", detail: "12° 34′" },
  },
  decorators: [
    (Story) => (
      <div className="w-[358px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlanetTrio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {};

export const WithDegrees: Story = {
  args: {
    sun: { sign: "Gémeaux", detail: "21° 02′" },
    moon: { sign: "Poissons", detail: "3° 47′" },
  },
};

export const UnknownAscendant: Story = {
  args: { ascendant: null, unknownLabel: "Heure inconnue" },
};
