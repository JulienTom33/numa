import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultNS, fallbackLng, namespaces, resources, supportedLanguages } from "./resources";

void i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLng,
  fallbackLng,
  supportedLngs: supportedLanguages,
  ns: namespaces,
  defaultNS,
  initAsync: false,
  interpolation: { escapeValue: false },
});

export default i18n;
