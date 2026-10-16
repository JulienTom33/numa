import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import TextField from "../../../components/ui/TextField/TextField";
import OnboardingStepLayout from "./OnboardingStepLayout";

const meta = {
  title: "Écrans/Onboarding/OnboardingStepLayout",
  component: OnboardingStepLayout,
  parameters: { layout: "fullscreen" },
  args: {
    id: "storybook__form--step",
    step: 1,
    totalSteps: 5,
    title: "Comment devons-nous vous appeler ?",
    onBack: fn(),
    onContinue: fn(),
    canContinue: false,
    children: <TextField id="storybook__input--name" label="Prénom ou pseudonyme" />,
  },
} satisfies Meta<typeof OnboardingStepLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incomplete: Story = {};

export const Complete: Story = { args: { canContinue: true } };

export const DiscoveryMode: Story = { args: { discoveryMode: true } };

export const CustomContinueLabel: Story = {
  args: { step: 5, canContinue: true, continueLabel: "Découvrir mon thème" },
};
