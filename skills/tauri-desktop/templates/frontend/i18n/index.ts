import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';

const LANGUAGE_KEY = 'app-language';

export const supportedLanguages = ['en', 'zh-CN'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function getSavedLanguage(): SupportedLanguage {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved === 'en' || saved === 'zh-CN' ? saved : 'zh-CN';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export async function changeLanguage(language: SupportedLanguage) {
  localStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
}

export default i18n;
