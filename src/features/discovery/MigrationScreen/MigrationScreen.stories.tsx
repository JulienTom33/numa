import type { Meta, StoryObj } from "@storybook/react-vite";
import MigrationScreen from "./MigrationScreen";

const meta = {
  title: "Discovery/MigrationScreen",
  component: MigrationScreen,
  args: { onContinue: () => undefined },
} satisfies Meta<typeof MigrationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
