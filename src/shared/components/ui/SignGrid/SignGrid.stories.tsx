import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import SignGrid from "./SignGrid";

const meta = {
  title: "Composés/SignGrid",
  component: SignGrid,
  args: {
    id: "storybook__signs--ascendant",
    label: "Quel est votre ascendant ?",
    value: null,
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <SignGrid {...args} onChange={(value) => updateArgs({ value })} />;
  },
} satisfies Meta<typeof SignGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingSelected: Story = {};

export const LibraSelected: Story = { args: { value: "libra" } };
