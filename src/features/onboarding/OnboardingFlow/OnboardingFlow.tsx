import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppShell from "../../../shared/components/AppShell/AppShell";
import { useComputedAscendant } from "../../chart/useComputedAscendant/useComputedAscendant";
import { useOnboarding } from "../useOnboarding/useOnboarding";
import AscendantStep from "../AscendantStep/AscendantStep";
import { isTimeStepComplete } from "../timeStepValue/timeStepValue";
import { searchPlaces } from "../placeSearch/placeSearch";
import DateStep from "../DateStep/DateStep";
import NameStep from "../NameStep/NameStep";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";
import PlaceStep from "../PlaceStep/PlaceStep";
import { toPlaceSearch, type PlaceSearch } from "../placeSearchAdapter/placeSearchAdapter";
import SummaryStep from "../SummaryStep/SummaryStep";
import TimeStep from "../TimeStep/TimeStep";
import { ASCENDANT_STEP } from "../onboardingStore/onboardingStore";
import ChartProgressFlow from "../../chart/ChartProgressFlow/ChartProgressFlow";
import OnboardingLoading from "../OnboardingLoading/OnboardingLoading";
import { toBirthTimeInput, toTimeStepValue } from "../timeStepAdapter/timeStepAdapter";

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
  const [computingChart, setComputingChart] = useState(false);
  const computedAscendant = useComputedAscendant(step === ASCENDANT_STEP && !loading, onboarding.birthDataId);

  if (loading) return <OnboardingLoading />;

  const handleBack = step === 1 ? onExit : back;
  const handleContinue = () => {
    void next();
  };
  const handleFinish = () => {
    void next().then((finished) => {
      if (finished) setComputingChart(true);
    });
  };
  if (computingChart) {
    return (
      <AppShell id="onboarding-flow__shell--chart-progress" screenKey="chart-progress">
        <ChartProgressFlow onComplete={onComplete} />
      </AppShell>
    );
  }

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
