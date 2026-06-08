<template>
  <div class="preference-controls" aria-label="Display preferences">
    <div class="preference-group" role="group" aria-label="Language">
      <span class="group-icon" aria-hidden="true">
        <i class="fa-solid fa-language"></i>
      </span>
      <button
        v-for="option in languageOptions"
        :key="option.value"
        type="button"
        class="preference-button"
        :class="{ active: language === option.value }"
        :aria-pressed="language === option.value"
        :title="option.label"
        @click="setLanguage(option.value)"
      >
        <span>{{ option.short }}</span>
      </button>
    </div>

    <div class="preference-group" role="group" aria-label="Theme">
      <span class="group-icon" aria-hidden="true">
        <i class="fa-solid fa-circle-half-stroke"></i>
      </span>
      <button
        v-for="option in themeOptions"
        :key="option.value"
        type="button"
        class="preference-button icon-only"
        :class="{ active: theme === option.value }"
        :aria-pressed="theme === option.value"
        :title="option.label"
        :aria-label="option.label"
        @click="setTheme(option.value)"
      >
        <i :class="option.icon"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';
import { useLanguage } from '@/composables/useLanguage';

const { t } = useI18n();
const { theme, setTheme } = useTheme();
const { language, setLanguage } = useLanguage();

const languageOptions = computed(() => [
  { value: 'en', short: 'EN', label: t('language.english') },
  { value: 'tl', short: 'TL', label: t('language.tagalog') }
]);

const themeOptions = computed(() => [
  { value: 'light', label: t('theme.light'), icon: 'fa-solid fa-sun' },
  { value: 'dark', label: t('theme.dark'), icon: 'fa-solid fa-moon' },
  { value: 'system', label: t('theme.system'), icon: 'fa-solid fa-desktop' }
]);
</script>

<style scoped>
.preference-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.preference-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 3px;
  border: 1px solid var(--border-color, rgba(31, 41, 55, 0.14));
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg-primary, #ffffff) 86%, transparent);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.group-icon {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  color: var(--text-secondary, #667085);
  font-size: 0.86rem;
}

.preference-button {
  min-width: 34px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  padding: 0 8px;
  background: transparent;
  color: var(--text-secondary, #667085);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.preference-button.icon-only {
  min-width: 30px;
  padding: 0;
  font-size: 0.82rem;
}

.preference-button:hover {
  background: color-mix(in srgb, var(--accent-light, #e8f5f1) 72%, transparent);
  color: var(--accent-deep, #0d4a2a);
}

.preference-button.active {
  background: var(--accent, #257f49);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.16);
}

.preference-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent, #257f49) 70%, white);
  outline-offset: 2px;
}

:global(html.dark) .preference-group {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
}

:global(html.dark) .group-icon,
:global(html.dark) .preference-button {
  color: #d7dfda;
}

:global(html.dark) .preference-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

:global(html.dark) .preference-button.active {
  background: #4fa36c;
  color: #08140d;
}

@media (max-width: 520px) {
  .preference-controls {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
