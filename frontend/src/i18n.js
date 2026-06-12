import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import tl from './locales/tl.json';

const savedLocale = globalThis.localStorage?.getItem('locale');
const defaultLocale = savedLocale || (globalThis.navigator?.language?.startsWith('tl') ? 'tl' : 'en');

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  globalInjection: true,
  messages: { en, tl },
});

if (savedLocale !== defaultLocale) {
  globalThis.localStorage?.setItem('locale', defaultLocale);
}

export default i18n;
