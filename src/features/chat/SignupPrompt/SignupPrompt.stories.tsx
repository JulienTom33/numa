import type { Meta, StoryObj } from "@storybook/react-vite";
import SignupPrompt from "./SignupPrompt";

const meta = {
  title: "Chat/SignupPrompt",
  component: SignupPrompt,
  args: {
    open: true,
    onSignUp: () => undefined,
    onSignIn: () => undefined,
    onContinue: () => undefined,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SignupPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = { args: { open: false } };
