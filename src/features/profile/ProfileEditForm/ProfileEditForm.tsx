import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  birthDateErrorMessage,
  birthPlaceErrorMessage,
  birthTimeErrorMessage,
  firstNameErrorMessage,
} from "../../../i18n/messages/onboarding/onboarding";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import SegmentedControl from "../../../shared/components/ui/SegmentedControl/SegmentedControl";
import Select from "../../../shared/components/ui/Select/Select";
import TextField from "../../../shared/components/ui/TextField/TextField";
import { FIRST_NAME_MAX_LENGTH } from "../../onboarding/birthData/birthData";
import PlaceStep from "../../onboarding/PlaceStep/PlaceStep";
import type { PlaceSearch } from "../../onboarding/placeSearchAdapter/placeSearchAdapter";
import TimeStep from "../../onboarding/TimeStep/TimeStep";
import { toBirthTimeInput, toTimeStepValue } from "../../onboarding/timeStepAdapter/timeStepAdapter";
import BirthDateFields from "../BirthDateFields/BirthDateFields";
import {
  PROFILE_LANGUAGES,
  PROFILE_TONES,
  findOption,
  hasBirthChanged,
  toProfileDraft,
  validateProfileDraft,
  type ProfileData,
  type ProfileDraft,
  type ProfileErrorCode,
  type ProfileFieldErrors,
  type ProfileUpdate,
} from "../profileData/profileData";

interface Props {
  profile: ProfileData;
  search: PlaceSearch;
  saving: boolean;
  errorCode: ProfileErrorCode | null;
  onSave: (update: ProfileUpdate) => void;
  onCancel: () => void;
  today?: Date;
}

interface SectionProps {
  draft: ProfileDraft;
  patch: (changes: Partial<ProfileDraft>) => void;
}

interface BirthSectionProps extends SectionProps {
  search: PlaceSearch;
  errors: ProfileFieldErrors | null;
  today?: Date;
}

function BirthSection({ draft, patch, search, errors, today }: BirthSectionProps) {
  const { t } = useTranslation("profile");
  const { t: tOnboarding } = useTranslation("onboarding");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section id="profile-edit__section--info" className="flex flex-col gap-4">
        <TextField
          id="profile-edit__input--first-name"
          label={t("edit.firstName")}
          autoComplete="given-name"
          maxLength={FIRST_NAME_MAX_LENGTH}
          value={draft.firstName}
          error={errors?.firstName ? firstNameErrorMessage(errors.firstName, tOnboarding) : undefined}
          onChange={(event) => patch({ firstName: event.target.value })}
        />
        <BirthDateFields
          id="profile-edit__fieldset--birth-date"
          value={draft.birthDate}
          today={today}
          error={errors?.birthDate ? birthDateErrorMessage(errors.birthDate, tOnboarding) : undefined}
          onChange={(birthDate) => patch({ birthDate })}
        />
        <PlaceStep
          id="profile-edit__place--birth"
          search={search}
          value={draft.birthPlace}
          onChange={(birthPlace) => patch({ birthPlace })}
        />
        {errors?.birthPlace && (
          <p id="profile-edit__error--birth-place" className="text-xs font-medium text-coral-ink">
            {birthPlaceErrorMessage(errors.birthPlace, tOnboarding)}
          </p>
        )}
      </section>
      <section id="profile-edit__section--time" className="flex flex-col gap-4">
        <TimeStep
          value={toTimeStepValue(draft.birthTime)}
          onChange={(value) => patch({ birthTime: toBirthTimeInput(value) })}
        />
        {errors?.birthTime && (
          <p id="profile-edit__error--birth-time" className="text-xs font-medium text-coral-ink">
            {birthTimeErrorMessage(errors.birthTime, tOnboarding)}
          </p>
        )}
      </section>
    </div>
  );
}

function PreferencesSection({ draft, patch }: SectionProps) {
  const { t } = useTranslation("profile");
  const languageOptions = PROFILE_LANGUAGES.map((language) => ({ value: language, label: t(`languages.${language}`) }));
  const toneOptions = PROFILE_TONES.map((tone) => ({ value: tone, label: t(`tones.${tone}`) }));

  return (
    <section id="profile-edit__section--preferences" className="flex flex-col gap-4">
      <Select
        id="profile-edit__select--language"
        label={t("edit.language")}
        options={languageOptions}
        value={draft.language}
        onChange={(event) => {
          const language = findOption(PROFILE_LANGUAGES, event.target.value);
          if (language) patch({ language });
        }}
      />
      <div className="flex flex-col gap-1.5">
        <span id="profile-edit__label--tone" className="font-display text-sm font-semibold text-ink">
          {t("edit.tone")}
        </span>
        <SegmentedControl
          id="profile-edit__segmented--tone"
          label={t("edit.tone")}
          options={toneOptions}
          value={draft.tone}
          onChange={(tone) => patch({ tone })}
        />
      </div>
    </section>
  );
}

function ProfileEditForm({ profile, search, saving, errorCode, onSave, onCancel, today }: Props) {
  const { t } = useTranslation("profile");
  const [draft, setDraft] = useState<ProfileDraft>(() => toProfileDraft(profile));
  const [errors, setErrors] = useState<ProfileFieldErrors | null>(null);

  const patch = (changes: Partial<ProfileDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const birthChanged = hasBirthChanged(profile, draft);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateProfileDraft(profile, draft, today);
    setErrors(result.errors);
    if (result.update) onSave(result.update);
  };

  return (
    <form id="profile-edit__form--main" noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 id="profile-edit__title--main" className="font-display text-title font-bold text-ink">
        {t("edit.title")}
      </h2>
      <BirthSection draft={draft} patch={patch} search={search} errors={errors} today={today} />
      <PreferencesSection draft={draft} patch={patch} />
      {birthChanged && (
        <Callout id="profile-edit__callout--birth-warning" tone="warning">
          {t("edit.birthWarning")}
        </Callout>
      )}
      {errorCode && (
        <Callout id="profile-edit__callout--error" tone="error">
          {t(`errors.${errorCode}`)}
        </Callout>
      )}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          id="profile-edit__button--save"
          type="submit"
          loading={saving}
          loadingLabel={t("edit.saving")}
          className="sm:flex-1"
        >
          {t("edit.save")}
        </Button>
        <Button id="profile-edit__button--cancel" variant="outline" onClick={onCancel} className="sm:flex-1">
          {t("edit.cancel")}
        </Button>
      </div>
    </form>
  );
}

export default ProfileEditForm;
