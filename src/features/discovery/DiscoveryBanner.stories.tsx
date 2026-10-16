import type { Meta, StoryObj } from "@storybook/react-vite";
import DiscoveryBanner from "./DiscoveryBanner";

const meta = {
  title: "Discovery/DiscoveryBanner",
  component: DiscoveryBanner,
} satisfies Meta<typeof DiscoveryBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
