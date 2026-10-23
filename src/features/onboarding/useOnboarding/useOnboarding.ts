import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  birthDateErrorMessage,
  birthPlaceErrorMessage,
  birthTimeErrorMessage,
  buildOnboardingSummary,
  firstNameErrorMessage,
  onboardingErrorMessage,
  type OnboardingErrorCode,
} from "../../../i18n/messages/onboarding/onboarding";
import {
  EMPTY_ONBOARDING_DATA,
  hasPreciseBirthData,
  validateBirthDateParts,
  validateBirthPlace,
  validateBirthTime,
  validateFirstName,
  type BirthDateParts,
  type BirthPlace,
  type BirthTimeInput,
  type OnboardingData,
  type OnboardingSummary,
} from "../birthData/birthData";
import { EMPTY_ASCENDANT_CHOICE, type AscendantChoice } from "../../chart/ascendant/ascendant";
import {
  ASCENDANT_STEP,
  completeOnboarding,
  loadOnboardingDraft,
  ONBOARDING_STEP_COUNT,
  saveOnboardingDraft,
  SUMMARY_STEP,
  type OnboardingStep,
} from "../onboardingStore/onboardingStore";

export interface OnboardingErrors {
  firstName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
}

export interface UseOnboardingOptions {
  userId: string | null;
  today?: Date;
}

export interface UseOnboardingResult {
  step: OnboardingStep;
  stepCount: number;
  data: OnboardingData;
  ascendant: AscendantChoice;
  birthDateParts: BirthDateParts;
  errors: OnboardingErrors;
  isStepValid: (step: OnboardingStep) => boolean;
  canContinue: boolean;
  summary: OnboardingSummary;
  hasPreciseBirthData: boolean;
  birthDataId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  errorCode: OnboardingErrorCode | null;
  setFirstName: (value: string) => void;
  setBirthDateParts: (parts: BirthDateParts) => void;
  setBirthTime: (input: BirthTimeInput) => void;
  setBirthPlace: (place: BirthPlace | null) => void;
  setAscendant: (choice: AscendantChoice) => void;
  next: () => Promise<boolean>;
  back: () => void;
  goToStep: (step: OnboardingStep) => void;
}

const EMPTY_DATE_PARTS: BirthDateParts = { day: null, month: null, year: null };

function isoToParts(isoDate: string | null): BirthDateParts {
  if (isoDate === null) {
    return EMPTY_DATE_PARTS;
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  return { day, month, year };
}

/**
 * Pilote les cinq étapes de l'onboarding : validation, sauvegarde du brouillon et finalisation.
 * Les erreurs de la couche domaine sont des codes, traduits ici dans la langue courante.
 */
export function useOnboarding({ userId, today }: UseOnboardingOptions): UseOnboardingResult {
  const { t, i18n } = useTranslation("onboarding");
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING_DATA);
  const [birthDateParts, setBirthDatePartsState] = useState<BirthDateParts>(EMPTY_DATE_PARTS);
  const [ascendant, setAscendant] = useState<AscendantChoice>(EMPTY_ASCENDANT_CHOICE);
  const [birthDataId, setBirthDataId] = useState<string | null>(null);
  const [loading, setLoading] = useState(userId !== null);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState<OnboardingErrorCode | null>(null);

  useEffect(() => {
    if (userId === null) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorCode(null);

    loadOnboardingDraft(userId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.error) {
        setErrorCode(result.error);
      } else if (result.draft) {
        setStep(result.draft.step);
        setData(result.draft.data);
        setAscendant(result.draft.ascendant ?? EMPTY_ASCENDANT_CHOICE);
        setBirthDatePartsState(isoToParts(result.draft.data.birthDate));
        setBirthDataId(result.birthDataId);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const errors = useMemo<OnboardingErrors>(() => {
    const firstName = validateFirstName(data.firstName);
    const birthDate = validateBirthDateParts(birthDateParts, today ?? new Date()).error;
    const birthTime = validateBirthTime(data.birthTime);
    const birthPlace = validateBirthPlace(data.birthPlace);
    return {
      firstName: firstName && firstNameErrorMessage(firstName, t),
      birthDate: birthDate && birthDateErrorMessage(birthDate, t),
      birthTime: birthTime && birthTimeErrorMessage(birthTime, t),
      birthPlace: birthPlace && birthPlaceErrorMessage(birthPlace, t),
    };
  }, [data, birthDateParts, today, t]);

  const isStepValid = useCallback(
    (target: OnboardingStep): boolean => {
      const stepErrors = [errors.firstName, errors.birthDate, errors.birthTime, errors.birthPlace];
      return stepErrors.slice(0, Math.min(target, stepErrors.length)).every((stepError) => stepError === null);
    },
    [errors],
  );

  const setFirstName = useCallback((value: string) => {
    setData((current) => ({ ...current, firstName: value }));
  }, []);

  const setBirthDateParts = useCallback(
    (parts: BirthDateParts) => {
      setBirthDatePartsState(parts);
      const { isoDate } = validateBirthDateParts(parts, today ?? new Date());
      setData((current) => ({ ...current, birthDate: isoDate }));
    },
    [today],
  );

  const setBirthTime = useCallback((input: BirthTimeInput) => {
    setData((current) => ({ ...current, birthTime: input }));
  }, []);

  const setBirthPlace = useCallback((place: BirthPlace | null) => {
    setData((current) => ({ ...current, birthPlace: place }));
  }, []);

  const ascendantComplete =
    ascendant.source !== null && (ascendant.source === "computed" || ascendant.declaredSign !== null);
  const canContinue = isStepValid(step) && (step !== ASCENDANT_STEP || ascendantComplete) && !loading && !saving;

  const next = useCallback(async (): Promise<boolean> => {
    if (!canContinue) {
      return false;
    }
    if (userId === null) {
      setErrorCode("missing_session");
      return false;
    }

    const nextStep = Math.min(step + 1, ASCENDANT_STEP) as OnboardingStep;
    setSaving(true);
    setErrorCode(null);

    const { error: saveError } = await saveOnboardingDraft(userId, { step: nextStep, data, ascendant });
    if (saveError) {
      setErrorCode(saveError);
      setSaving(false);
      return false;
    }

    if (nextStep === SUMMARY_STEP || step === ASCENDANT_STEP) {
      const completion = await completeOnboarding();
      if (completion.error) {
        setErrorCode(completion.error);
        setSaving(false);
        return false;
      }
      setBirthDataId(completion.birthDataId);
    }

    setStep(nextStep);
    setSaving(false);
    return true;
  }, [canContinue, step, userId, data, ascendant]);

  const back = useCallback(() => {
    setErrorCode(null);
    setStep((current) => (current > 1 ? ((current - 1) as OnboardingStep) : current));
  }, []);

  const goToStep = useCallback(
    (target: OnboardingStep) => {
      if (target === 1 || isStepValid((target - 1) as OnboardingStep)) {
        setErrorCode(null);
        setStep(target);
      }
    },
    [isStepValid],
  );

  const summary = useMemo(() => buildOnboardingSummary(data, t, i18n.language), [data, t, i18n.language]);
  const error = useMemo(() => errorCode && onboardingErrorMessage(errorCode, t), [errorCode, t]);

  return {
    step,
    stepCount: ONBOARDING_STEP_COUNT,
    data,
    ascendant,
    birthDateParts,
    errors,
    isStepValid,
    canContinue,
    summary,
    hasPreciseBirthData: hasPreciseBirthData(data),
    birthDataId,
    loading,
    saving,
    error,
    errorCode,
    setFirstName,
    setBirthDateParts,
    setBirthTime,
    setBirthPlace,
    setAscendant,
    next,
    back,
    goToStep,
  };
}
