import { useState } from "react";
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
          Votre thème astral, lu simplement.
        </h1>
      </div>

      <div id="welcome__section--actions" className="flex flex-col items-center gap-3">
        <Button id="welcome__button--sign-up" fullWidth onClick={onSignUp}>
          Créer mon compte
        </Button>
        <Button id="welcome__button--sign-in" variant="outline" fullWidth onClick={onSignIn}>
          Se connecter
        </Button>
        <TextLink id="welcome__link--discover" onClick={onDiscover} className="mt-2">
          Découvrir sans compte
        </TextLink>
        <p id="welcome__text--account-later" className="text-center text-sm text-ink-secondary">
          Vous pourrez créer un compte plus tard pour retrouver vos lectures.
        </p>
      </div>

      <BottomSheet
        id="welcome__sheet--about"
        open={aboutOpen}
        onClose={closeAbout}
        title="Qui est Numa ?"
        closeLabel="Fermer la fiche"
        footer={
          <Button id="welcome__button--close-about" variant="outline" fullWidth onClick={closeAbout}>
            Fermer
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p id="welcome__text--about-intro">
            Numa lit votre thème astral à partir de votre date, de votre heure et de votre lieu de
            naissance, puis vous explique ce qu'il dit, sans jargon.
          </p>
          <p id="welcome__text--about-approach">
            Chaque lecture montre d'où elle vient et reste nuancée : l'astrologie propose des pistes
            de réflexion, jamais des certitudes.
          </p>
        </div>
      </BottomSheet>
    </main>
  );
}

export default Welcome;
