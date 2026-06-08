import { createI18n } from 'vue-i18n';
import enMessages from './locales/en.json';
import tlMessages from './locales/tl.json';

const messages = {
  en: enMessages,
  tl: tlMessages
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'en',
  fallbackLocale: 'en',
  messages
});

export default i18n;
