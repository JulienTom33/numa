import { useTranslation } from "react-i18next";

export type OptionalNamespace = "chartSignsPersonal" | "chartSignsOuter" | "chartHouses";

export function useOptionalText() {
  const { i18n } = useTranslation();
  return (namespace: OptionalNamespace, key: string): string | null => {
    const value: unknown = i18n.getResource(i18n.language, namespace, key);
    return typeof value === "string" && value.trim() !== "" ? value : null;
  };
}
