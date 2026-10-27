import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import Card from "../Card/Card";
import ListRow from "./ListRow";

const meta = {
  title: "Composés/ListRow",
  component: ListRow,
  args: { id: "storybook__row--info", label: "Mes informations", onClick: fn() },
  decorators: [
    (Story) => (
      <div className="w-80 overflow-hidden rounded-card border border-line bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = { args: { label: "Langue", value: "Français" } };

export const WithIcon: Story = { args: { label: "Historique", icon: "history" } };

export const Danger: Story = {
  args: { label: "Supprimer mes données", tone: "danger", icon: "trash" },
};

export const ProfileSection: Story = {
  decorators: [(Story) => <Story />],
  render: (args) => (
    <Card id="storybook__card--profile-section" padding="none" className="w-80 overflow-hidden">
      <ul className="divide-y divide-line">
        <li>
          <ListRow {...args} id="storybook__row--informations" label="Mes informations" />
        </li>
        <li>
          <ListRow {...args} id="storybook__row--preferences" label="Préférences" />
        </li>
        <li>
          <ListRow
            {...args}
            id="storybook__row--trust"
            label="Comment Sidéra construit ses lectures"
          />
        </li>
      </ul>
    </Card>
  ),
};
