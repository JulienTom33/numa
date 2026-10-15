import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildOnboardingSummary,
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
} from "../lib/birthData";
import {
  completeOnboarding,
  loadOnboardingDraft,
  ONBOARDING_STEP_COUNT,
  saveOnboardingDraft,
  type OnboardingStep,
} from "../lib/onboardingStore";

export const MISSING_SESSION_MESSAGE = "Votre session a expiré. Rechargez la page pour reprendre votre saisie.";

export interface OnboardingErrors {
  firstName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
}

export interface UseOnboardingOptions {
  /** user_id Supabase de la session courante (anonyme ou permanente) ; null tant qu'elle n'existe pas. */
  userId: string | null;
  /** Référence pour refuser les dates futures ; injectable pour les tests. */
  today?: Date;
}

export interface UseOnboardingResult {
  step: OnboardingStep;
  stepCount: number;
  data: OnboardingData;
  birthDateParts: BirthDateParts;
  /** Erreurs de saisie courantes ; à afficher par l'écran au moment opportun (après interaction). */
  errors: OnboardingErrors;
  isStepValid: (step: OnboardingStep) => boolean;
  /** Pilote l'état actif du bouton « Continuer ». */
  canContinue: boolean;
  summary: OnboardingSummary;
  hasPreciseBirthData: boolean;
  /** Ligne birth_data produite à la finalisation (fin de l'étape 4). */
  birthDataId: string | null;
  loading: boolean;
  saving: boolean;
  /** Erreur de chargement ou de sauvegarde, en français, sans détail technique. */
  error: string | null;
  setFirstName: (value: string) => void;
  setBirthDateParts: (parts: BirthDateParts) => void;
  setBirthTime: (input: BirthTimeInput) => void;
  setBirthPlace: (place: BirthPlace | null) => void;
  /** Sauvegarde puis passe à l'étape suivante ; finalise l'onboarding en quittant l'étape 4. */
  next: () => Promise<boolean>;
  back: () => void;
  /** Retour sur une étape déjà remplie (lien « Modifier » du récapitulatif). */
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

export function useOnboarding({ userId, today }: UseOnboardingOptions): UseOnboardingResult {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING_DATA);
  const [birthDateParts, setBirthDatePartsState] = useState<BirthDateParts>(EMPTY_DATE_PARTS);
  const [birthDataId, setBirthDataId] = useState<string | null>(null);
  const [loading, setLoading] = useState(userId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadOnboardingDraft(userId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.error) {
        setError(result.error);
      } else if (result.draft) {
        setStep(result.draft.step);
        setData(result.draft.data);
        setBirthDatePartsState(isoToParts(result.draft.data.birthDate));
        setBirthDataId(result.birthDataId);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const errors = useMemo<OnboardingErrors>(
    () => ({
      firstName: validateFirstName(data.firstName),
      birthDate: validateBirthDateParts(birthDateParts, today ?? new Date()).error,
      birthTime: validateBirthTime(data.birthTime),
      birthPlace: validateBirthPlace(data.birthPlace),
    }),
    [data, birthDateParts, today],
  );

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

  const canContinue = isStepValid(step) && !loading && !saving;

  const next = useCallback(async (): Promise<boolean> => {
    if (!canContinue) {
      return false;
    }
    if (step === ONBOARDING_STEP_COUNT) {
      return true;
    }
    if (userId === null) {
      setError(MISSING_SESSION_MESSAGE);
      return false;
    }

    const nextStep = (step + 1) as OnboardingStep;
    setSaving(true);
    setError(null);

    const { error: saveError } = await saveOnboardingDraft(userId, { step: nextStep, data });
    if (saveError) {
      setError(saveError);
      setSaving(false);
      return false;
    }

    if (nextStep === ONBOARDING_STEP_COUNT) {
      const completion = await completeOnboarding();
      if (completion.error) {
        setError(completion.error);
        setSaving(false);
        return false;
      }
      setBirthDataId(completion.birthDataId);
    }

    setStep(nextStep);
    setSaving(false);
    return true;
  }, [canContinue, step, userId, data]);

  const back = useCallback(() => {
    setError(null);
    setStep((current) => (current > 1 ? ((current - 1) as OnboardingStep) : current));
  }, []);

  const goToStep = useCallback(
    (target: OnboardingStep) => {
      if (target === 1 || isStepValid((target - 1) as OnboardingStep)) {
        setError(null);
        setStep(target);
      }
    },
    [isStepValid],
  );

  const summary = useMemo(() => buildOnboardingSummary(data), [data]);

  return {
    step,
    stepCount: ONBOARDING_STEP_COUNT,
    data,
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
    setFirstName,
    setBirthDateParts,
    setBirthTime,
    setBirthPlace,
    next,
    back,
    goToStep,
  };
}
