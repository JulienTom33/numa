import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/ui/Button/Button";
import Callout from "../../../components/ui/Callout/Callout";
import SelectableCardGroup from "../../../components/ui/SelectableCardGroup/SelectableCardGroup";
import SignGrid from "../../../components/ui/SignGrid/SignGrid";
import TextLink from "../../../components/ui/TextLink/TextLink";
import type { ComputedAscendantStatus } from "../../../hooks/useComputedAscendant";
import {
  ascendantsDiffer,
  EMPTY_ASCENDANT_CHOICE,
  type AscendantChoice,
  type ComputedAscendant,
} from "../../../lib/ascendant";
import type { NatalChartErrorCode } from "../../../lib/natalChart";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";
import OnboardingStepLayout from "../OnboardingStepLayout/OnboardingStepLayout";

interface Props {
  value: AscendantChoice;
  onChange: (choice: AscendantChoice) => void;
  onContinue: () => void;
  computedStatus: ComputedAscendantStatus;
  computed: ComputedAscendant | null;
  computedErrorCode: NatalChartErrorCode | null;
  onRetry: () => void;
  precise: boolean;
  onBack?: () => void;
  discoveryMode?: boolean;
  error?: string | null;
  saving?: boolean;
}

type Mode = "computed" | "declared";
type Knowledge = "yes" | "no";
type Resolution = "keep" | "computed";

function initialMode(value: AscendantChoice, precise: boolean): Mode {
  return precise && value.source !== "declared" ? "computed" : "declared";
}

function initialKnowledge(value: AscendantChoice, precise: boolean): Knowledge | null {
  if (value.source === "declared") return "yes";
  return value.source === "computed" && !precise ? "no" : null;
}

function deriveChoice(
  mode: Mode,
  knowledge: Knowledge | null,
  sign: ZodiacSign | null,
  resolution: Resolution | null,
  computed: ComputedAscendant | null,
  computedStatus: ComputedAscendantStatus,
): AscendantChoice {
  if (mode === "computed") {
    return computedStatus === "ready" && computed ? { source: "computed", declaredSign: null } : EMPTY_ASCENDANT_CHOICE;
  }
  if (knowledge === "no") return { source: "computed", declaredSign: null };
  if (knowledge !== "yes" || sign === null || computedStatus === "loading") return EMPTY_ASCENDANT_CHOICE;
  if (!ascendantsDiffer(computed, sign)) return { source: "declared", declaredSign: sign };
  if (resolution === "keep") return { source: "declared", declaredSign: sign };
  if (resolution === "computed") return { source: "computed", declaredSign: null };
  return EMPTY_ASCENDANT_CHOICE;
}

function AscendantStep({
  value,
  onChange,
  onContinue,
  computedStatus,
  computed,
  computedErrorCode,
  onRetry,
  precise,
  onBack,
  discoveryMode,
  error,
  saving,
}: Props) {
  const { t } = useTranslation(["onboarding", "astrology"]);
  const [mode, setMode] = useState<Mode>(() => initialMode(value, precise));
  const [knowledge, setKnowledge] = useState<Knowledge | null>(() => initialKnowledge(value, precise));
  const [sign, setSign] = useState<ZodiacSign | null>(value.declaredSign);
  const [resolution, setResolution] = useState<Resolution | null>(value.source === "declared" ? "keep" : null);

  const choice = useMemo(
    () => deriveChoice(mode, knowledge, sign, resolution, computed, computedStatus),
    [mode, knowledge, sign, resolution, computed, computedStatus],
  );

  useEffect(() => {
    onChange(choice);
  }, [choice, onChange]);

  const showMismatch = mode === "declared" && knowledge === "yes" && ascendantsDiffer(computed, sign);
  const computedFailed = computedStatus === "error" || (computedStatus === "ready" && computed === null);

  const switchToDeclared = () => {
    setMode("declared");
  };

  return (
    <OnboardingStepLayout
      id="ascendant-step__form--main"
      step={5}
      totalSteps={5}
      title={t("onboarding:ascendant.title")}
      onBack={onBack}
      onContinue={onContinue}
      canContinue={choice.source !== null}
      continueLabel={t("onboarding:ascendant.continue")}
      discoveryMode={discoveryMode}
      error={error}
      saving={saving}
    >
      {mode === "computed" && (
        <>
          {computedStatus === "loading" && (
            <p id="ascendant-step__status--loading" role="status" className="text-sm text-ink-secondary">
              {t("onboarding:ascendant.computed.loading")}
            </p>
          )}
          {computedStatus === "ready" && computed && (
            <Callout id="ascendant-step__callout--computed" tone="highlight">
              <p id="ascendant-step__text--computed-intro">{t("onboarding:ascendant.computed.intro")}</p>
              <p id="ascendant-step__text--computed-value" className="font-display text-xl font-bold">
                {t("onboarding:ascendant.computed.value", {
                  sign: t(`astrology:signs.${computed.sign}`),
                  degree: Math.floor(computed.degreeInSign),
                })}
              </p>
            </Callout>
          )}
          {computedFailed && (
            <Callout id="ascendant-step__callout--computed-error" tone="error">
              <p id="ascendant-step__text--computed-error">
                {t(`onboarding:ascendant.errors.${computedErrorCode ?? "internal_error"}`)}
              </p>
              <Button id="ascendant-step__button--retry" type="button" variant="outline" onClick={onRetry}>
                {t("onboarding:ascendant.computed.retry")}
              </Button>
            </Callout>
          )}
          <TextLink id="ascendant-step__link--edit" onClick={switchToDeclared} className="text-sm">
            {t("onboarding:ascendant.computed.edit")}
          </TextLink>
        </>
      )}
      {mode === "declared" && (
        <>
          <SelectableCardGroup<Knowledge>
            id="ascendant-step__choice--knows"
            label={t("onboarding:ascendant.declared.question")}
            value={knowledge}
            onChange={setKnowledge}
            options={[
              { value: "yes", title: t("onboarding:ascendant.declared.yes") },
              { value: "no", title: t("onboarding:ascendant.declared.no") },
            ]}
          />
          {knowledge === "no" && (
            <Callout id="ascendant-step__callout--advice" tone="info">
              {t("onboarding:ascendant.declared.advice")}
            </Callout>
          )}
          {knowledge === "yes" && (
            <SignGrid
              id="ascendant-step__grid--sign"
              label={t("onboarding:ascendant.declared.signLabel")}
              value={sign}
              onChange={setSign}
            />
          )}
          {showMismatch && computed && sign && (
            <>
              <Callout id="ascendant-step__callout--mismatch" tone="warning">
                {t("onboarding:ascendant.mismatch.warning", {
                  computed: t(`astrology:signs.${computed.sign}`),
                  declared: t(`astrology:signs.${sign}`),
                })}
              </Callout>
              <SelectableCardGroup<Resolution>
                id="ascendant-step__choice--resolution"
                label={t("onboarding:ascendant.mismatch.question")}
                value={resolution}
                onChange={setResolution}
                options={[
                  {
                    value: "keep",
                    title: t("onboarding:ascendant.mismatch.keep"),
                    description: t(`astrology:signs.${sign}`),
                  },
                  {
                    value: "computed",
                    title: t("onboarding:ascendant.mismatch.useComputed"),
                    description: t(`astrology:signs.${computed.sign}`),
                  },
                ]}
              />
            </>
          )}
          {precise && (
            <TextLink id="ascendant-step__link--back-to-computed" onClick={() => setMode("computed")} className="text-sm">
              {t("onboarding:ascendant.declared.backToComputed")}
            </TextLink>
          )}
        </>
      )}
    </OnboardingStepLayout>
  );
}

export default AscendantStep;
