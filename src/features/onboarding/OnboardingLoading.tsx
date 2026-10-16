import { useTranslation } from "react-i18next";
import AppShell from "../../components/AppShell/AppShell";

function OnboardingLoading() {
  const { t } = useTranslation("onboarding");

  return (
    <AppShell id="onboarding-flow__shell--loading" screenKey="onboarding-loading">
      <div
        id="onboarding-flow__status--loading"
        role="status"
        aria-busy="true"
        className="flex min-h-full items-center justify-center px-4 py-8 text-sm text-ink-secondary"
      >
        {t("flow.loading")}
      </div>
    </AppShell>
  );
}

export default OnboardingLoading;
