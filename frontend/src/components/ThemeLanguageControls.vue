<template>
  <div class="theme-language-controls">
    <!-- Language Selector -->
    <div class="control-group">
      <label for="language-select" class="control-label">🌍</label>
      <select 
        id="language-select"
        v-model="language"
        @change="handleLanguageChange"
        class="control-select"
        :title="$t('language.english') + ' / ' + $t('language.tagalog')"
      >
        <option value="en">{{ $t('language.english') }}</option>
        <option value="tl">{{ $t('language.tagalog') }}</option>
      </select>
    </div>

    <!-- Theme Selector -->
    <div class="control-group">
      <label for="theme-select" class="control-label">🎨</label>
      <select 
        id="theme-select"
        v-model="currentTheme"
        @change="handleThemeChange"
        class="control-select"
        :title="$t('theme.light') + ' / ' + $t('theme.dark') + ' / ' + $t('theme.system')"
      >
        <option value="light">{{ $t('theme.light') }}</option>
        <option value="dark">{{ $t('theme.dark') }}</option>
        <option value="system">{{ $t('theme.system') }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';
import { useLanguage } from '@/composables/useLanguage';

const { locale } = useI18n();
const { theme, setTheme } = useTheme();
const { setLanguage } = useLanguage();

const language = ref(locale.value);
const currentTheme = ref(theme.value);

const handleLanguageChange = () => {
  setLanguage(language.value);
};

const handleThemeChange = () => {
  setTheme(currentTheme.value);
};
</script>

<style scoped>
.theme-language-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-label {
  font-size: 1.2rem;
  cursor: pointer;
  user-select: none;
}

.control-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.control-select:hover {
  border-color: var(--text-secondary);
}

.control-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

html.dark .control-select {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}
</style>
