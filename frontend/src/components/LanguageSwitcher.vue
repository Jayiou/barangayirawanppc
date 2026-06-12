<template>
  <button
    type="button"
    class="language-switcher"
    :class="{ 'language-switcher--floating': floating }"
    @click="toggleLocale"
    :aria-label="t('language.switcher')"
    :title="t('language.switcher')"
  >
    <i class="fa-solid fa-globe"></i>
    <span>{{ t(currentLabelKey) }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps({
  floating: {
    type: Boolean,
    default: false,
  },
});

const { locale, t } = useI18n();
const currentLabelKey = computed(() => (locale.value === 'tl' ? 'language.filipino' : 'language.english'));

const toggleLocale = () => {
  locale.value = locale.value === 'en' ? 'tl' : 'en';
  globalThis.localStorage?.setItem('locale', locale.value);
};
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(46, 125, 50, 0.2);
  background: white;
  color: #1c4d34;
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
}
.language-switcher:hover {
  background: #f1f8f4;
}
.language-switcher i {
  width: 1rem;
  text-align: center;
}
.language-switcher--floating {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1200;
  box-shadow: 0 8px 24px rgba(19, 67, 43, 0.16);
}

@media (max-width: 720px) {
  .language-switcher--floating {
    top: 10px;
    right: 10px;
    padding: 0.55rem 0.7rem;
  }

  .language-switcher--floating span {
    display: none;
  }
}
</style>
