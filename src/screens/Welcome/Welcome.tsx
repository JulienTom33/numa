import { useState } from "react";
import { useTranslation } from "react-i18next";
import BottomSheet from "../../components/ui/BottomSheet/BottomSheet";
import Button from "../../components/ui/Button/Button";
import Logo from "../../components/ui/Logo/Logo";
import TextLink from "../../components/ui/TextLink/TextLink";

interface Props {
  onSignUp: () => void;
  onSignIn: () => void;
  onDiscover: () => void;
}

function Welcome({ onSignUp, onSignIn, onDiscover }: Props) {
  const { t } = useTranslation(["welcome", "common"]);
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeAbout = () => setAboutOpen(false);

  return (
    <main
      id="welcome__main--root"
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-6 py-10 text-ink"
    >
      <div
        id="welcome__section--hero"
        className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
      >
        <Logo id="welcome__logo--main" size="lg" onWordmarkClick={() => setAboutOpen(true)} />
        <h1 id="welcome__title--main" className="font-display text-title-lg font-extrabold">
          {t("title")}
        </h1>
      </div>

      <div id="welcome__section--actions" className="flex flex-col items-center gap-3">
        <Button id="welcome__button--sign-up" fullWidth onClick={onSignUp}>
          {t("account.signUp")}
        </Button>
        <Button id="welcome__button--sign-in" variant="outline" fullWidth onClick={onSignIn}>
          {t("account.signIn")}
        </Button>
        <TextLink id="welcome__link--discover" onClick={onDiscover} className="mt-2">
          {t("discover.start")}
        </TextLink>
        <p id="welcome__text--account-later" className="text-center text-sm text-ink-secondary">
          {t("account.later")}
        </p>
      </div>

      <BottomSheet
        id="welcome__sheet--about"
        open={aboutOpen}
        onClose={closeAbout}
        title={t("about.title")}
        closeLabel={t("about.closeLabel")}
        footer={
          <Button id="welcome__button--close-about" variant="outline" fullWidth onClick={closeAbout}>
            {t("common:actions.close")}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p id="welcome__text--about-intro">
            {t("about.intro")}
          </p>
          <p id="welcome__text--about-approach">
            {t("about.approach")}
          </p>
        </div>
      </BottomSheet>
    </main>
  );
}

export default Welcome;
