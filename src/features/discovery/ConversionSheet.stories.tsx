import type { Meta, StoryObj } from "@storybook/react-vite";
import ConversionSheet from "./ConversionSheet";

const meta = {
  title: "Discovery/ConversionSheet",
  component: ConversionSheet,
  args: { open: true, onSignUp: () => undefined, onSignIn: () => undefined, onContinue: () => undefined },
} satisfies Meta<typeof ConversionSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
