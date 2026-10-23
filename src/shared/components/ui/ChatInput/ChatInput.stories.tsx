import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import ChatInput from "./ChatInput";

const meta = {
  title: "Composés/ChatInput",
  component: ChatInput,
  args: {
    id: "storybook__chat-input--question",
    value: "",
    onChange: () => undefined,
    onSubmit: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[358px]">
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <ChatInput
        {...args}
        onChange={(value) => updateArgs({ value })}
        onSubmit={(value) => {
          args.onSubmit(value);
          updateArgs({ value: "" });
        }}
      />
    );
  },
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = { args: { value: "Comment se présente ma semaine ?" } };

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Créez un compte pour continuer" },
};
