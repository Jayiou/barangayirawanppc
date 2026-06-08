import { ref, computed, watch } from 'vue';

const theme = ref(localStorage.getItem('theme') || 'system');

export function useTheme() {
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const currentTheme = computed(() => {
    return theme.value === 'system' ? getSystemTheme() : theme.value;
  });

  const setTheme = (newTheme) => {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme();
  };

  const applyTheme = () => {
    const htmlElement = document.documentElement;
    const isDark = currentTheme.value === 'dark';
    
    if (isDark) {
      htmlElement.classList.add('dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      htmlElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
  };

  // Watch for system theme changes
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme();
      }
    });
  }

  // Watch theme changes
  watch(theme, () => {
    applyTheme();
  });

  // Apply theme on initialization
  applyTheme();

  return {
    theme: computed(() => theme.value),
    currentTheme,
    setTheme,
    isDark: computed(() => currentTheme.value === 'dark')
  };
}
