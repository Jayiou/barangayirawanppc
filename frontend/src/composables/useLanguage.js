import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const LANGUAGE_STORAGE_KEY = 'language';
const VALID_LANGUAGES = new Set(['en', 'tl']);

const getStoredLanguage = () => {
  const saved = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) || 'en';
  return VALID_LANGUAGES.has(saved) ? saved : 'en';
};

const language = ref(getStoredLanguage());

export function useLanguage() {
  const i18n = useI18n();

  const setLanguage = (lang) => {
    const nextLanguage = VALID_LANGUAGES.has(lang) ? lang : 'en';
    language.value = nextLanguage;
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    i18n.locale.value = nextLanguage;
  };

  if (i18n.locale.value !== language.value) {
    i18n.locale.value = language.value;
  }

  return {
    language,
    setLanguage,
    currentLanguage: () => i18n.locale.value
  };
}
