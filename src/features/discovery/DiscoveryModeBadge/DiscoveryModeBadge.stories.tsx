import type { Meta, StoryObj } from "@storybook/react-vite";
import DiscoveryModeBadge from "./DiscoveryModeBadge";

const meta = {
  title: "App/DiscoveryModeBadge",
  component: DiscoveryModeBadge,
} satisfies Meta<typeof DiscoveryModeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
