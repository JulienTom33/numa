import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,mdx}", "./.storybook/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      page: "#EFEAE0",
      surface: "#FFFDF9",
      white: "#FFFFFF",
      ink: {
        DEFAULT: "#20243A",
        secondary: "#6D7183",
        muted: "#8C90A0",
      },
      line: "#E8E5E0",
      coral: {
        DEFAULT: "#F27D72",
        hover: "#DE6459",
        disabled: "#F2C4BF",
        soft: "#FDEBE9",
        ink: "#C2544A",
      },
      violet: {
        DEFAULT: "#9C8ED8",
        ink: "#6E5A99",
        soft: "#F1EEFB",
        wash: "#F4F1FA",
      },
      sky: {
        DEFAULT: "#8DC9E8",
        ink: "#3E7997",
        soft: "#EAF5FB",
      },
      gold: {
        DEFAULT: "#C9A85E",
        ink: "#8A6A1F",
        soft: "#FDF3DC",
      },
      sage: {
        DEFAULT: "#A8C6A1",
        ink: "#5C7A56",
        soft: "#EFF6ED",
      },
      overlay: "rgb(32 36 58 / 0.35)",
    },
    extend: {
      fontFamily: {
        display: ['"Manrope Variable"', "Manrope", "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        tab: ["10.5px", { lineHeight: "14px" }],
        "title-sm": ["18px", { lineHeight: "24px" }],
        title: ["22px", { lineHeight: "28px" }],
        "title-lg": ["26px", { lineHeight: "32px" }],
      },
      borderRadius: {
        field: "13px",
        button: "14px",
        card: "16px",
        sheet: "22px",
      },
      maxWidth: {
        app: "390px",
      },
    },
  },
  plugins: [],
} satisfies Config;
