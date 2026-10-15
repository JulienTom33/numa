import type { Meta, StoryObj } from "@storybook/react-vite";
import Select from "./Select";

const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
].map((label, index) => ({ value: String(index + 1), label }));

const meta = {
  title: "Base/Select",
  component: Select,
  args: {
    id: "storybook__select--month",
    label: "Mois",
    options: months,
    placeholder: "Mois",
    defaultValue: "",
  },
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { defaultValue: "6" } };

export const WithError: Story = {
  args: { label: "Jour", defaultValue: "2", error: "Cette date n'existe pas." },
};

export const Disabled: Story = { args: { disabled: true, defaultValue: "6" } };

export const BirthDate: Story = {
  render: () => (
    <fieldset className="w-80">
      <legend className="mb-2 font-display text-sm font-semibold text-ink">
        Date de naissance
      </legend>
      <div className="flex gap-2">
        <Select
          id="storybook__select--day"
          label="Jour"
          hideLabel
          className="flex-1"
          placeholder="Jour"
          defaultValue=""
          options={Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          }))}
        />
        <Select
          id="storybook__select--month-group"
          label="Mois"
          hideLabel
          className="flex-[1.4]"
          placeholder="Mois"
          defaultValue=""
          options={months}
        />
        <Select
          id="storybook__select--year"
          label="Année"
          hideLabel
          className="flex-1"
          placeholder="Année"
          defaultValue=""
          options={Array.from({ length: 100 }, (_, i) => {
            const year = String(2026 - i);
            return { value: year, label: year };
          })}
        />
      </div>
    </fieldset>
  ),
};
