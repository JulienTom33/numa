import { useTranslation } from "react-i18next";
import TextField from "../../../components/ui/TextField/TextField";
import { FIRST_NAME_MAX_LENGTH } from "../../../lib/birthData";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  discoveryMode?: boolean;
  error?: string | null;
  saving?: boolean;
}

function NameStep({ value, onChange, onContinue, onBack, discoveryMode, error, saving }: Props) {
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
      error={error}
      saving={saving}
    >
      <TextField
        id="name-step__input--name"
        label={t("name.label")}
        hint={t("name.hint")}
        autoComplete="given-name"
        maxLength={FIRST_NAME_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </OnboardingStepLayout>
  );
}

export default NameStep;
