import "i18next";
import type { Translations } from "./locales/fr";
import type { defaultNS } from "./resources/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: Translations;
    strictKeyChecks: true;
  }
}
