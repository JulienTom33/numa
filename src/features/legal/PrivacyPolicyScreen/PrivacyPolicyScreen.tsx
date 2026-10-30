import { useTranslation } from "react-i18next";
import Callout from "../../../shared/components/ui/Callout/Callout";
import TopBar from "../../../shared/components/ui/TopBar/TopBar";

interface Props {
  onBack: () => void;
}

const sectionIds = [
  "collected",
  "birthData",
  "ai",
  "freeQuestion",
  "auth",
  "retention",
  "deletion",
  "rights",
  "marketing",
  "metrics",
] as const;

const providerIds = ["supabase", "ovh", "gemini", "groq", "openMeteo", "oauth"] as const;

function PrivacyPolicyScreen({ onBack }: Props) {
  const { t } = useTranslation(["legal", "common"]);

  return (
    <main
      id="privacy-policy__main--root"
      className="mx-auto flex min-h-screen w-full max-w-app flex-col bg-page px-4 pb-10 text-ink"
    >
      <TopBar id="privacy-policy__topbar--main" onBack={onBack} backLabel={t("common:actions.back")} />

      <div className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <h1 id="privacy-policy__title--main" className="font-display text-title-lg font-bold">
            {t("privacy.title")}
          </h1>
          <p id="privacy-policy__text--intro" className="text-sm text-ink-secondary">
            {t("privacy.intro")}
          </p>
        </div>

        <Callout id="privacy-policy__callout--summary" tone="highlight" title={t("privacy.summary.title")}>
          {t("privacy.summary.body")}
        </Callout>

        {sectionIds.map((section) => (
          <section key={section} id={`privacy-policy__section--${section}`} className="flex flex-col gap-2">
            <h2 id={`privacy-policy__title--${section}`} className="font-display text-base font-bold">
              {t(`privacy.sections.${section}.title`)}
            </h2>
            <p id={`privacy-policy__text--${section}`} className="text-sm">
              {t(`privacy.sections.${section}.body`)}
            </p>
          </section>
        ))}

        <section id="privacy-policy__section--providers" className="flex flex-col gap-2">
          <h2 id="privacy-policy__title--providers" className="font-display text-base font-bold">
            {t("privacy.providers.title")}
          </h2>
          <p id="privacy-policy__text--providers" className="text-sm">
            {t("privacy.providers.intro")}
          </p>
          <ul id="privacy-policy__list--providers" className="flex list-disc flex-col gap-2 pl-5 text-sm">
            {providerIds.map((provider) => (
              <li key={provider} id={`privacy-policy__item--${provider}`}>
                {t(`privacy.providers.items.${provider}`)}
              </li>
            ))}
          </ul>
        </section>

        <section id="privacy-policy__section--contact" className="flex flex-col gap-2">
          <h2 id="privacy-policy__title--contact" className="font-display text-base font-bold">
            {t("privacy.contact.title")}
          </h2>
          <p id="privacy-policy__text--contact" className="text-sm">
            {t("privacy.contact.body", { address: t("privacy.contact.address") })}
          </p>
        </section>
      </div>
    </main>
  );
}

export default PrivacyPolicyScreen;
