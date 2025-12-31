import { ref, computed } from "vue";
import type { Language } from "./usePokemon";
import frTranslations from "@/locales/fr.json";
import enTranslations from "@/locales/en.json";
import jpTranslations from "@/locales/jp.json";

// Type for translations
type Translations = typeof frTranslations;

// Recursive type to generate valid key paths
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? R extends string[]
      ? `${F}${D}${Join<R, D>}`
      : never
    : never
  : string;

// Type for valid translation keys
export type TranslationKey = Join<PathsToStringProps<Translations>, ".">;

const translations: Record<Language, Translations> = {
  fr: frTranslations,
  en: enTranslations,
  jp: jpTranslations as Translations,
};

// UI language separate from Pokémon names language
const uiLanguage = ref<Language>("fr");

export function useTranslation() {
  /**
   * Translation function with strict key typing and variable interpolation
   * @param key - Translation key in format "namespace.key"
   * @param vars - Optional object containing variables for interpolation (e.g., {{name}})
   * @returns The corresponding translation or the key if not found
   */
  const t = (key: TranslationKey, vars?: Record<string, string>): string => {
    const keys = key.split(".");
    let value: any = translations[uiLanguage.value];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Translation key not found: "${key}" for language "${uiLanguage.value}"`);
        }
        return key;
      }
    }

    let result = typeof value === "string" ? value : key;
    
    // Interpolate variables if provided
    if (vars) {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
      });
    }
    
    return result;
  };

  /**
   * Change the user interface language
   * @param lang - Language code (fr, en, jp)
   */
  const setUILanguage = (lang: Language) => {
    if (lang in translations) {
      uiLanguage.value = lang;
      // Save preference in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("ui-language", lang);
      }
    } else {
      console.error(`[i18n] Invalid language code: "${lang}"`);
    }
  };

  /**
   * Get the current interface language
   */
  const currentLanguage = computed(() => uiLanguage.value);

  /**
   * Check if a translation key exists
   * @param key - Translation key to check
   */
  const hasTranslation = (key: string): boolean => {
    const keys = key.split(".");
    let value: any = translations[uiLanguage.value];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return typeof value === "string";
  };

  return {
    t,
    uiLanguage,
    currentLanguage,
    setUILanguage,
    hasTranslation,
  };
}

// Initialize language from localStorage on startup
if (typeof window !== "undefined") {
  const savedLanguage = localStorage.getItem("ui-language") as Language;
  if (savedLanguage && savedLanguage in translations) {
    uiLanguage.value = savedLanguage;
  }
}
