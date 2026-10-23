import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import DiscoveryModeBadge from "../../discovery/DiscoveryModeBadge/DiscoveryModeBadge";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import StepHeader from "../../../shared/components/ui/StepHeader/StepHeader";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";

interface Props {
  id: string;
  step: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
  onContinue: () => void;
  canContinue: boolean;
  discoveryMode?: boolean;
  continueLabel?: string;
  error?: string | null;
  saving?: boolean;
  children: ReactNode;
}

function OnboardingStepLayout({
  id,
  step,
  totalSteps,
  title,
  onBack,
  onContinue,
  canContinue,
  discoveryMode = false,
  continueLabel,
  error = null,
  saving = false,
  children,
}: Props) {
  const { t } = useTranslation("onboarding");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canContinue && !saving) onContinue();
  }

  return (
    <form
      id={id}
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-4 pb-6 text-ink"
    >
      <TopBar
        id={`${id}-top-bar`}
        onBack={onBack}
        trailing={discoveryMode ? <DiscoveryModeBadge /> : undefined}
      />
      <div className="flex flex-1 flex-col gap-6 pt-2">
        <StepHeader id={`${id}-header`} step={step} total={totalSteps} title={title} />
        <div id={`${id}-content`} className="flex flex-col gap-4">
          {children}
        </div>
        {error && (
          <Callout id={`${id}-error`} tone="error">
            {error}
          </Callout>
        )}
      </div>
      <Button id={`${id}-continue`} type="submit" fullWidth disabled={!canContinue} loading={saving}>
        {continueLabel ?? t("layout.continue")}
      </Button>
    </form>
  );
}

export default OnboardingStepLayout;
