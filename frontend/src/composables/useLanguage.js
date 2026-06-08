import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const language = ref(localStorage.getItem('language') || 'en');

export function useLanguage() {
  const i18n = useI18n();

  const setLanguage = (lang) => {
    language.value = lang;
    localStorage.setItem('language', lang);
    i18n.locale.value = lang;
  };

  return {
    language,
    setLanguage,
    currentLanguage: () => i18n.locale.value
  };
}
