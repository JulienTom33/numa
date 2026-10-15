import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import NameStep from "./NameStep";

const meta = {
  title: "Écrans/Onboarding/NameStep",
  component: NameStep,
  parameters: { layout: "fullscreen" },
  args: { value: "", onChange: fn(), onContinue: fn(), onBack: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <NameStep
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof NameStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = { args: { value: "Léa" } };

export const Blank: Story = { args: { value: "   " } };

export const DiscoveryMode: Story = { args: { discoveryMode: true } };
