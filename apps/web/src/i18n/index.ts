import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export const LOCALE_STORAGE_KEY = "open-xdownload-locale";
export type AppLocale = "en" | "zh";

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "zh";
}

export function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function detectInitialLocale(): AppLocale {
  const stored = readStoredLocale();
  if (stored) return stored;
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  }
  // Fork default: English for non-Chinese browsers (and unknown).
  return "en";
}

export function applyDocumentLocale(locale: AppLocale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.documentElement.setAttribute("translate", "no");
  document.documentElement.classList.add("notranslate");
  document.body?.classList.add("notranslate");
  document.body?.setAttribute("translate", "no");
}

export function persistLocale(locale: AppLocale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // privacy mode
  }
  applyDocumentLocale(locale);
}

const initialLocale = detectInitialLocale();
applyDocumentLocale(initialLocale);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: initialLocale,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", (lng) => {
  if (isAppLocale(lng)) persistLocale(lng);
});

export default i18n;
