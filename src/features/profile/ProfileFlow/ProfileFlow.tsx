import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/ui/Button/Button";
import Callout from "../../../shared/components/ui/Callout/Callout";
import { useAppContext } from "../../../shared/navigation/appContext/appContext";
import { useMyChart } from "../../chart/useMyChart/useMyChart";
import { searchPlaces } from "../../onboarding/placeSearch/placeSearch";
import { toPlaceSearch, type PlaceSearch } from "../../onboarding/placeSearchAdapter/placeSearchAdapter";
import ProfileEditForm from "../ProfileEditForm/ProfileEditForm";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import type { ProfileData, ProfileUpdate } from "../profileData/profileData";
import { useProfile } from "../useProfile/useProfile";
import { useSaveProfile } from "../useSaveProfile/useSaveProfile";

interface Props {
  userId: string;
  email: string | null;
  search?: PlaceSearch;
}

interface LoadedProps extends Props {
  profile: ProfileData;
  search: PlaceSearch;
}

const defaultPlaceSearch = toPlaceSearch(searchPlaces);

function LoadedProfile({ profile, email, search }: LoadedProps) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation("profile");
  const { data: chart, status: chartStatus, retry: retryChart } = useMyChart();
  const { save, saving, errorCode, reset } = useSaveProfile(profile);

  const handleSave = (update: ProfileUpdate) => {
    void save(update).then((ok) => {
      if (!ok) return;
      setSaved(true);
      setEditing(false);
    });
  };

  const closeEditor = () => {
    reset();
    setEditing(false);
  };

  if (editing) {
    return (
      <ProfileEditForm
        profile={profile}
        search={search}
        saving={saving}
        errorCode={errorCode}
        onSave={handleSave}
        onCancel={closeEditor}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {chartStatus === "error" && (
        <div id="profile__container--recalc-error" className="flex flex-col gap-3">
          <Callout id="profile__callout--recalc-error" tone="error">
            {t("recalc.failed")}
          </Callout>
          <Button id="profile__button--recalc-retry" variant="outline" onClick={retryChart}>
            {t("retry")}
          </Button>
        </div>
      )}
      <ProfileScreen
        profile={profile}
        email={email}
        sun={chart?.summary.sun?.sign ?? null}
        ascendant={chart?.summary.ascendant?.sign ?? null}
        saved={saved}
        onEdit={() => {
          setSaved(false);
          setEditing(true);
        }}
      />
    </div>
  );
}

function ProfileFlowContent({ userId, email, search = defaultPlaceSearch }: Props) {
  const { t } = useTranslation("profile");
  const { status, data, errorCode, retry } = useProfile(userId);

  if (status === "loading") {
    return (
      <p id="profile__text--loading" role="status" className="text-sm text-ink-secondary">
        {t("loading")}
      </p>
    );
  }
  if (status === "error" || data === null) {
    return (
      <div id="profile__container--error" className="flex w-full flex-col gap-3">
        <Callout id="profile__callout--load-error" tone="error">
          {t(`errors.${errorCode ?? "internal_error"}`)}
        </Callout>
        <Button id="profile__button--retry" variant="outline" onClick={retry}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  return <LoadedProfile profile={data} userId={userId} email={email} search={search} />;
}

interface FlowProps {
  search?: PlaceSearch;
}

function ProfileFlow({ search }: FlowProps) {
  const { session } = useAppContext();
  if (!session) return null;
  return <ProfileFlowContent userId={session.user.id} email={session.user.email ?? null} search={search} />;
}

export default ProfileFlow;
