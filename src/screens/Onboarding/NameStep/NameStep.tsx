import { useTranslation } from "react-i18next";
import TextField from "../../../components/ui/TextField/TextField";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  discoveryMode?: boolean;
}

function NameStep({ value, onChange, onContinue, onBack, discoveryMode }: Props) {
  const { t } = useTranslation("onboarding");

  return (
    <OnboardingStepLayout
      id="name-step__form--main"
      step={1}
      totalSteps={5}
      title={t("name.title")}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={value.trim() !== ""}
      discoveryMode={discoveryMode}
    >
      <TextField
        id="name-step__input--name"
        label={t("name.label")}
        hint={t("name.hint")}
        autoComplete="given-name"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </OnboardingStepLayout>
  );
}

export default NameStep;
