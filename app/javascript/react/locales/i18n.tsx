import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./en/translation.json";

export const resources = {
  en: {
    translation: enTranslation,
  },
};

i18next.use(initReactI18next).init({
  lng: "en",
  resources,
});

export default i18next;
