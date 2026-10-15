import type { Preview } from "@storybook/react-vite";
import "../src/index.css";
import "../src/i18n";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      options: {
        page: { name: "Page", value: "#EFEAE0" },
        surface: { name: "Surface", value: "#FFFDF9" },
      },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  initialGlobals: {
    backgrounds: { value: "page" },
  },
  tags: ["autodocs"],
};

export default preview;
