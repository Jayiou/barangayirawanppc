import { computed, ref, watch } from 'vue';

const THEME_STORAGE_KEY = 'theme';
const VALID_THEMES = new Set(['light', 'dark', 'system']);

const getStoredTheme = () => {
  const saved = globalThis.localStorage?.getItem(THEME_STORAGE_KEY) || 'system';
  return VALID_THEMES.has(saved) ? saved : 'system';
};

const theme = ref(getStoredTheme());
let initialized = false;
let systemThemeQuery = null;

const getSystemTheme = () => {
  if (!globalThis.matchMedia) return 'light';
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const currentTheme = computed(() => (theme.value === 'system' ? getSystemTheme() : theme.value));
const isDark = computed(() => currentTheme.value === 'dark');

const applyTheme = () => {
  if (!globalThis.document) return;

  const root = document.documentElement;
  root.classList.toggle('dark', isDark.value);
  root.dataset.theme = theme.value;
  root.style.colorScheme = isDark.value ? 'dark' : 'light';
};

const setTheme = (newTheme) => {
  const nextTheme = VALID_THEMES.has(newTheme) ? newTheme : 'system';
  theme.value = nextTheme;
  globalThis.localStorage?.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme();
};

const initTheme = () => {
  if (initialized) {
    applyTheme();
    return;
  }

  initialized = true;
  systemThemeQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)') || null;
  systemThemeQuery?.addEventListener?.('change', () => {
    if (theme.value === 'system') applyTheme();
  });

  watch(theme, applyTheme, { immediate: true });
};

export function useTheme() {
  initTheme();

  return {
    theme: computed(() => theme.value),
    currentTheme,
    setTheme,
    isDark
  };
}
