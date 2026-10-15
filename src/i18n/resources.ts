import { fr, type Translations } from "./locales/fr";

export const defaultNS = "common";

export const fallbackLng = "fr";

export const resources = { fr } satisfies Record<string, Translations>;

export type Language = keyof typeof resources;

export const supportedLanguages = Object.keys(resources) as Language[];

export const namespaces = Object.keys(fr) as (keyof Translations)[];
