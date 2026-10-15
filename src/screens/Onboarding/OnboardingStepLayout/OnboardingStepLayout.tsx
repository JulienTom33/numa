import type { FormEvent, ReactNode } from "react";
import DiscoveryModeBadge from "../../../components/DiscoveryModeBadge";
import Button from "../../../components/ui/Button/Button";
import StepHeader from "../../../components/ui/StepHeader/StepHeader";
import TopBar from "../../../components/ui/TopBar/TopBar";

interface Props {
  id: string;
  step: number;
  totalSteps: number;
  title: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  discoveryMode?: boolean;
  continueLabel?: string;
  children: ReactNode;
}

/**
 * Gabarit commun aux étapes de l'onboarding : barre de retour, pastille « Mode découverte »,
 * « Étape n sur N », titre et bouton « Continuer » en pied.
 * Sous-éléments : `${id}-top-bar`, `${id}-header`, `${id}-content`, `${id}-continue`.
 */
function OnboardingStepLayout({
  id,
  step,
  totalSteps,
  title,
  onBack,
  onContinue,
  canContinue,
  discoveryMode = false,
  continueLabel = "Continuer",
  children,
}: Props) {
  // Un <form> permet de valider l'étape avec Entrée depuis un champ.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canContinue) onContinue();
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
      </div>
      <Button id={`${id}-continue`} type="submit" fullWidth disabled={!canContinue}>
        {continueLabel}
      </Button>
    </form>
  );
}

export default OnboardingStepLayout;
