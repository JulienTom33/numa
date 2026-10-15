import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import InfoTooltip from "./InfoTooltip";

const meta = {
  title: "Base/InfoTooltip",
  component: InfoTooltip,
  args: {
    id: "storybook__tooltip--zodiac",
    label: "En savoir plus sur le zodiaque tropical",
    children:
      "Le zodiaque tropical se cale sur les saisons : le Bélier commence à l'équinoxe de printemps.",
  },
  render: (args) => (
    <p className="text-sm text-ink">
      Zodiaque tropical <InfoTooltip {...args} />
    </p>
  ),
  parameters: {
    docs: {
      description: {
        component:
          "Bulle (i) : s'ouvre au clic ou avec Entrée/Espace, se ferme avec Échap, un nouveau clic ou un clic à l'extérieur.",
      },
    },
  },
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(canvas.getByText(/équinoxe/)).toBeVisible();
  },
};
