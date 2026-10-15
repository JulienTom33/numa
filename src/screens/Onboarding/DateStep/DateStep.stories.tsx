import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import DateStep from "./DateStep";
import type { BirthDateParts } from "../../../lib/birthData";

const emptyBirthDateParts: BirthDateParts = { day: null, month: null, year: null };

const meta = {
  title: "Écrans/Onboarding/DateStep",
  component: DateStep,
  parameters: { layout: "fullscreen" },
  args: {
    value: emptyBirthDateParts,
    onChange: fn(),
    onContinue: fn(),
    onBack: fn(),
    today: new Date(2026, 9, 15),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <DateStep
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof DateStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Partial: Story = { args: { value: { day: 14, month: 3, year: null } } };

export const Filled: Story = { args: { value: { day: 14, month: 3, year: 1990 } } };

export const InvalidFebruary31: Story = {
  args: { value: { day: 31, month: 2, year: 1990 } },
};

export const InvalidNonLeapYear: Story = {
  args: { value: { day: 29, month: 2, year: 2023 } },
};

export const DiscoveryMode: Story = {
  args: { discoveryMode: true, value: { day: 1, month: 8, year: 2001 } },
};
