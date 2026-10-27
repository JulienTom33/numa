import type { Meta, StoryObj } from "@storybook/react-vite";
import CookieConsentProvider from "../CookieConsentProvider";
import CookieBanner from "./CookieBanner";

const meta = {
  title: "Base/CookieBanner",
  component: CookieBanner,
  decorators: [
    (Story) => (
      <CookieConsentProvider>
        <div className="relative h-[600px] w-[390px] transform-gpu overflow-hidden bg-page">
          <Story />
        </div>
      </CookieConsentProvider>
    ),
  ],
  loaders: [
    () => {
      document.cookie = "sidera-cookie-consent=; Path=/; Max-Age=0";
      return {};
    },
  ],
  args: { onPrivacy: () => undefined },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CookieBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstVisit: Story = {};

export const AboveTabBar: Story = {
  args: { aboveTabBar: true },
  decorators: [
    (Story) => (
      <>
        <Story />
        <div
          id="cookie-banner__tabbar--placeholder"
          className="absolute inset-x-0 bottom-0 h-16 border-t border-line bg-surface"
        />
      </>
    ),
  ],
};

export const AlreadyChosen: Story = {
  loaders: [
    () => {
      document.cookie = "sidera-cookie-consent=accepted; Path=/";
      return {};
    },
  ],
};
