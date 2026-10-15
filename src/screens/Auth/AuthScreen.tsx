import Button, { type ButtonVariant } from "../../components/ui/Button/Button";
import Callout from "../../components/ui/Callout/Callout";
import Icon from "../../components/ui/Icon/Icon";
import TextLink from "../../components/ui/TextLink/TextLink";
import TopBar from "../../components/ui/TopBar/TopBar";
import ProviderIcon, { type AuthProvider } from "./ProviderIcon";

export type AuthMode = "signup" | "signin";

interface Props {
  mode: AuthMode;
  onBack: () => void;
  onGoogle: () => void;
  onApple: () => void;
  onEmailLink: () => void;
  onSwitchMode: () => void;
  // Le libellé suit la destination du retour (accueil ou « Aujourd'hui » en mode découverte),
  // choisie par l'appelant.
  backLabel?: string;
  pendingProvider?: AuthProvider | null;
  errorMessage?: string | null;
}

interface Benefit {
  id: string;
  label: string;
}

const benefits: Benefit[] = [
  { id: "natal-chart", label: "Votre thème natal sauvegardé" },
  { id: "devices", label: "Vos lectures sur tous vos appareils" },
  { id: "history", label: "L'historique de vos consultations" },
  { id: "preferences", label: "Vos préférences conservées" },
];

const copy: Record<AuthMode, { title: string; subtitle: string; switchLabel: string }> = {
  signup: {
    title: "Gardez votre thème avec vous",
    subtitle: "Créez votre compte en quelques secondes, sans mot de passe.",
    switchLabel: "J'ai déjà un compte",
  },
  signin: {
    title: "Heureux de vous revoir",
    subtitle: "Connectez-vous pour retrouver votre thème et vos lectures.",
    switchLabel: "Créer un compte",
  },
};

interface ProviderAction {
  provider: AuthProvider;
  label: string;
  variant: ButtonVariant;
  idDescriptor: string;
}

const providerActions: ProviderAction[] = [
  {
    provider: "google",
    label: "Continuer avec Google",
    variant: "ink",
    idDescriptor: "google",
  },
  {
    provider: "apple",
    label: "Continuer avec Apple",
    variant: "outline",
    idDescriptor: "apple",
  },
  {
    provider: "email",
    label: "Recevoir un lien par email",
    variant: "soft",
    idDescriptor: "email-link",
  },
];

function AuthScreen({
  mode,
  onBack,
  onGoogle,
  onApple,
  onEmailLink,
  onSwitchMode,
  backLabel = "Retour",
  pendingProvider = null,
  errorMessage = null,
}: Props) {
  const { title, subtitle, switchLabel } = copy[mode];
  const handlers: Record<AuthProvider, () => void> = {
    google: onGoogle,
    apple: onApple,
    email: onEmailLink,
  };

  return (
    <main
      id={`auth-screen__main--${mode}`}
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-4 pb-8 text-ink"
    >
      <TopBar id="auth-screen__topbar--main" onBack={onBack} backLabel={backLabel} />

      <div className="flex flex-1 flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <h1 id="auth-screen__title--main" className="font-display text-title-lg font-bold">
            {title}
          </h1>
          <p id="auth-screen__subtitle--main" className="text-sm text-ink-secondary">
            {subtitle}
          </p>
        </div>

        {mode === "signup" && (
          <ul id="auth-screen__list--benefits" className="flex flex-col gap-3">
            {benefits.map((benefit) => (
              <li
                key={benefit.id}
                id={`auth-screen__item--${benefit.id}`}
                className="flex items-center gap-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-white"
                >
                  <Icon name="check" size={12} />
                </span>
                {benefit.label}
              </li>
            ))}
          </ul>
        )}

        {errorMessage && (
          <Callout id="auth-screen__callout--error" tone="error">
            {errorMessage}
          </Callout>
        )}

        <div className="flex flex-col gap-3">
          {providerActions.map(({ provider, label, variant, idDescriptor }) => (
            <Button
              key={provider}
              id={`auth-screen__button--${idDescriptor}`}
              variant={variant}
              fullWidth
              onClick={handlers[provider]}
              loading={pendingProvider === provider}
              // Une seule demande d'authentification à la fois : les autres fournisseurs sont
              // bloqués tant qu'une redirection ou un envoi est en cours.
              disabled={pendingProvider !== null && pendingProvider !== provider}
              leadingIcon={<ProviderIcon provider={provider} />}
            >
              {label}
            </Button>
          ))}
        </div>

        <p className="text-center text-sm">
          <TextLink id="auth-screen__link--switch-mode" onClick={onSwitchMode}>
            {switchLabel}
          </TextLink>
        </p>
      </div>

      {mode === "signup" && (
        <p id="auth-screen__text--privacy" className="pt-6 text-center text-xs text-ink-secondary">
          Vos données de naissance restent privées. Nous ne publions jamais rien en votre nom.
        </p>
      )}
    </main>
  );
}

export default AuthScreen;
