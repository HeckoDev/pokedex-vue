import { ref } from "vue";
import type { Language } from "./usePokemon";
import frTranslations from "@/locales/fr.json";
import enTranslations from "@/locales/en.json";
import jpTranslations from "@/locales/jp.json";

type NestedTranslationKey = string;

const translations = {
  fr: frTranslations,
  en: enTranslations,
  jp: jpTranslations,
};

// Langue UI séparée de la langue des noms de Pokémon
const uiLanguage = ref<Language>("fr");

export function useTranslation() {
  const t = (key: NestedTranslationKey): string => {
    const keys = key.split(".");
    let value: any = translations[uiLanguage.value];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  const setUILanguage = (lang: Language) => {
    uiLanguage.value = lang;
  };

  return {
    t,
    uiLanguage,
    setUILanguage,
  };
}
