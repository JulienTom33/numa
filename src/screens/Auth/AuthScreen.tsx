import { useTranslation } from "react-i18next";
import Button, { type ButtonVariant } from "../../components/ui/Button/Button";
import Callout from "../../components/ui/Callout/Callout";
import Icon from "../../components/ui/Icon/Icon";
import TextLink from "../../components/ui/TextLink/TextLink";
import TopBar from "../../components/ui/TopBar/TopBar";
import type { AuthMode } from "../../lib/auth";
import ProviderIcon, { type AuthProvider } from "./ProviderIcon";

export type { AuthMode };

interface Props {
  mode: AuthMode;
  onBack: () => void;
  onGoogle: () => void;
  onApple: () => void;
  onEmailLink: () => void;
  onSwitchMode: () => void;
  backLabel?: string;
  pendingProvider?: AuthProvider | null;
  errorMessage?: string | null;
  noticeMessage?: string | null;
}

type BenefitKey = "natalChart" | "devices" | "history" | "preferences";

interface Benefit {
  id: string;
  labelKey: BenefitKey;
}

const benefits: Benefit[] = [
  { id: "natal-chart", labelKey: "natalChart" },
  { id: "devices", labelKey: "devices" },
  { id: "history", labelKey: "history" },
  { id: "preferences", labelKey: "preferences" },
];

interface ProviderAction {
  provider: AuthProvider;
  variant: ButtonVariant;
  idDescriptor: string;
}

const providerActions: ProviderAction[] = [
  { provider: "google", variant: "ink", idDescriptor: "google" },
  { provider: "apple", variant: "outline", idDescriptor: "apple" },
  { provider: "email", variant: "soft", idDescriptor: "email-link" },
];

function AuthScreen({
  mode,
  onBack,
  onGoogle,
  onApple,
  onEmailLink,
  onSwitchMode,
  backLabel,
  pendingProvider = null,
  errorMessage = null,
  noticeMessage = null,
}: Props) {
  const { t } = useTranslation(["auth", "common"]);
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
      <TopBar
        id="auth-screen__topbar--main"
        onBack={onBack}
        backLabel={backLabel ?? t("common:actions.back")}
      />

      <div className="flex flex-1 flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <h1 id="auth-screen__title--main" className="font-display text-title-lg font-bold">
            {t(`screen.${mode}.title`)}
          </h1>
          <p id="auth-screen__subtitle--main" className="text-sm text-ink-secondary">
            {t(`screen.${mode}.subtitle`)}
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
                {t(`screen.benefits.${benefit.labelKey}`)}
              </li>
            ))}
          </ul>
        )}

        {noticeMessage && (
          <Callout id="auth-screen__callout--notice" tone="warning">
            {noticeMessage}
          </Callout>
        )}

        {errorMessage && (
          <Callout id="auth-screen__callout--error" tone="error">
            {errorMessage}
          </Callout>
        )}

        <div className="flex flex-col gap-3">
          {providerActions.map(({ provider, variant, idDescriptor }) => (
            <Button
              key={provider}
              id={`auth-screen__button--${idDescriptor}`}
              variant={variant}
              fullWidth
              onClick={handlers[provider]}
              loading={pendingProvider === provider}
              disabled={pendingProvider !== null && pendingProvider !== provider}
              leadingIcon={<ProviderIcon provider={provider} />}
            >
              {t(`screen.providers.${provider}`)}
            </Button>
          ))}
        </div>

        <p className="text-center text-sm">
          <TextLink id="auth-screen__link--switch-mode" onClick={onSwitchMode}>
            {t(`screen.${mode}.switchMode`)}
          </TextLink>
        </p>
      </div>

      {mode === "signup" && (
        <p id="auth-screen__text--privacy" className="pt-6 text-center text-xs text-ink-secondary">
          {t("screen.privacy")}
        </p>
      )}
    </main>
  );
}

export default AuthScreen;
