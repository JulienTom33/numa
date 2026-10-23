import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import AuthScreen from "./AuthScreen";

const meta = {
  title: "Écrans/Auth",
  component: AuthScreen,
  parameters: { layout: "fullscreen" },
  args: {
    mode: "signup",
    onBack: fn(),
    onGoogle: fn(),
    onApple: fn(),
    onEmailLink: fn(),
    onSwitchMode: fn(),
  },
} satisfies Meta<typeof AuthScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignUp: Story = {};

export const SignUpFromDiscovery: Story = {
  args: { backLabel: "Retour à Aujourd'hui" },
};

export const SignIn: Story = {
  args: { mode: "signin", backLabel: "Retour à l'accueil" },
};

export const Pending: Story = {
  args: { mode: "signin", pendingProvider: "google" },
};

export const SignInFromDiscovery: Story = {
  args: {
    mode: "signin",
    backLabel: "Retour à Aujourd'hui",
    noticeMessage:
      "Vous êtes en mode découverte : en vous connectant à un compte existant, les lectures faites sans compte ne lui seront pas rattachées.",
  },
};

export const WithError: Story = {
  args: {
    mode: "signin",
    errorMessage: "La connexion a échoué. Réessayez dans un instant.",
  },
};
