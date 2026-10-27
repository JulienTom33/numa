import type { Meta, StoryObj } from "@storybook/react-vite";
import CookieConsentProvider from "../CookieConsentProvider";
import CookieBanner from "./CookieBanner";

const meta = {
  title: "Base/CookieBanner",
  component: CookieBanner,
  decorators: [
    (Story) => (
      <CookieConsentProvider>
        <div className="h-64">
          <Story />
        </div>
      </CookieConsentProvider>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CookieBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstVisit: Story = {};
