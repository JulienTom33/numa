import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button/Button";
import StepChecklist from "../../components/ui/StepChecklist/StepChecklist";

interface Props {
  onContinue: () => void;
}

const KEPT_ITEMS = ["theme", "conversations", "preferences"] as const;

function MigrationScreen({ onContinue }: Props) {
  const { t } = useTranslation("discovery");
  const steps = KEPT_ITEMS.map((item) => ({ id: item, label: t(`migration.items.${item}`) }));

  return (
    <main
      id="migration__main--root"
      className="mx-auto flex min-h-screen w-full max-w-app flex-col justify-between gap-8 bg-page px-6 py-10 text-ink"
    >
      <section id="migration__section--summary" className="flex flex-col gap-6">
        <h1 id="migration__title--main" className="font-display text-title-lg font-extrabold">
          {t("migration.title")}
        </h1>
        <p id="migration__text--subtitle" className="text-ink-secondary">
          {t("migration.subtitle")}
        </p>
        <StepChecklist id="migration__list--kept" steps={steps} completedCount={steps.length} />
      </section>
      <Button id="migration__button--continue" fullWidth onClick={onContinue}>
        {t("migration.continue")}
      </Button>
    </main>
  );
}

export default MigrationScreen;
