import { useTranslation } from "react-i18next";
import AppShell from "../../components/AppShell/AppShell";
import { useComputedAscendant } from "../../hooks/useComputedAscendant";
import { useOnboarding } from "../../hooks/useOnboarding";
import AscendantStep from "../../screens/Onboarding/AscendantStep/AscendantStep";
import { isTimeStepComplete } from "../../screens/Onboarding/TimeStep/timeStepValue";
import { searchPlaces } from "../../lib/placeSearch";
import DateStep from "../../screens/Onboarding/DateStep/DateStep";
import NameStep from "../../screens/Onboarding/NameStep/NameStep";
import OnboardingStepLayout from "../../screens/Onboarding/OnboardingStepLayout/OnboardingStepLayout";
import PlaceStep from "../../screens/Onboarding/PlaceStep/PlaceStep";
import { toPlaceSearch, type PlaceSearch } from "../../screens/Onboarding/PlaceStep/placeSearchAdapter";
import SummaryStep from "../../screens/Onboarding/SummaryStep/SummaryStep";
import TimeStep from "../../screens/Onboarding/TimeStep/TimeStep";
import { ASCENDANT_STEP } from "../../lib/onboardingStore";
import OnboardingLoading from "./OnboardingLoading";
import { toBirthTimeInput, toTimeStepValue } from "./timeStepAdapter";

interface Props {
  userId: string;
  discoveryMode: boolean;
  onComplete: () => void;
  onExit?: () => void;
  search?: PlaceSearch;
  today?: Date;
}

const defaultPlaceSearch = toPlaceSearch(searchPlaces);

function OnboardingFlow({ userId, discoveryMode, onComplete, onExit, search = defaultPlaceSearch, today }: Props) {
  const { t } = useTranslation("onboarding");
  const onboarding = useOnboarding({ userId, today });
  const { step, stepCount, data, loading, saving, error, next, back, goToStep } = onboarding;
  const computedAscendant = useComputedAscendant(step === ASCENDANT_STEP && !loading, onboarding.birthDataId);

  if (loading) return <OnboardingLoading />;

  const handleBack = step === 1 ? onExit : back;
  const handleContinue = () => {
    void next();
  };
  const handleFinish = () => {
    void next().then((finished) => {
      if (finished) onComplete();
    });
  };
  const shared = { onBack: handleBack, discoveryMode, error, saving };
  const timeValue = toTimeStepValue(data.birthTime);

  return (
    <AppShell id="onboarding-flow__shell--root" screenKey={`onboarding-step-${step}`}>
      {step === 1 && (
        <NameStep {...shared} value={data.firstName} onChange={onboarding.setFirstName} onContinue={handleContinue} />
      )}
      {step === 2 && (
        <DateStep
          {...shared}
          value={onboarding.birthDateParts}
          onChange={onboarding.setBirthDateParts}
          onContinue={handleContinue}
          today={today}
        />
      )}
      {step === 3 && (
        <OnboardingStepLayout
          {...shared}
          id="onboarding-flow__form--time"
          step={3}
          totalSteps={stepCount}
          title={t("time.title")}
          onContinue={handleContinue}
          canContinue={isTimeStepComplete(timeValue)}
        >
          <TimeStep value={timeValue} onChange={(value) => onboarding.setBirthTime(toBirthTimeInput(value))} />
        </OnboardingStepLayout>
      )}
      {step === 4 && (
        <OnboardingStepLayout
          {...shared}
          id="onboarding-flow__form--place"
          step={4}
          totalSteps={stepCount}
          title={t("place.title")}
          onContinue={handleContinue}
          canContinue={data.birthPlace !== null}
        >
          <PlaceStep
            id="onboarding-flow__place-step--birth-place"
            search={search}
            value={data.birthPlace}
            onChange={onboarding.setBirthPlace}
          />
        </OnboardingStepLayout>
      )}
      {step === 5 && <SummaryStep {...shared} data={data} onEdit={goToStep} onConfirm={handleContinue} />}
      {step === ASCENDANT_STEP && (
        <AscendantStep
          {...shared}
          value={onboarding.ascendant}
          onChange={onboarding.setAscendant}
          onContinue={handleFinish}
          computedStatus={computedAscendant.status}
          computed={computedAscendant.ascendant}
          computedErrorCode={computedAscendant.errorCode}
          onRetry={computedAscendant.retry}
          precise={onboarding.hasPreciseBirthData}
        />
      )}
    </AppShell>
  );
}

export default OnboardingFlow;
