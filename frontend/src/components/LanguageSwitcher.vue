<template>
  <div
    v-if="floating"
    class="language-switcher-float"
    :class="{ 'language-switcher-float--collapsed': collapsed }"
  >
    <button
      v-if="!collapsed"
      type="button"
      class="language-switcher"
      @click="toggleLocale"
      :aria-label="t('language.switcher')"
      :title="t('language.switcher')"
    >
      <i class="fa-solid fa-globe"></i>
      <span>{{ t(currentLabelKey) }}</span>
    </button>
    <button
      type="button"
      class="language-switcher-collapse"
      @click="toggleCollapsed"
      :aria-label="collapsed ? t('language.show') : t('language.hide')"
      :title="collapsed ? t('language.show') : t('language.hide')"
    >
      <i :class="collapsed ? 'fa-solid fa-globe' : 'fa-solid fa-chevron-right'"></i>
    </button>
  </div>

  <button
    v-else
    type="button"
    class="language-switcher"
    @click="toggleLocale"
    :aria-label="t('language.switcher')"
    :title="t('language.switcher')"
  >
    <i class="fa-solid fa-globe"></i>
    <span>{{ t(currentLabelKey) }}</span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps({
  floating: {
    type: Boolean,
    default: false,
  },
});

const { locale, t } = useI18n();
const collapsed = ref(globalThis.localStorage?.getItem('languageSwitcherCollapsed') === 'true');
const currentLabelKey = computed(() => (locale.value === 'tl' ? 'language.filipino' : 'language.english'));

const toggleLocale = () => {
  locale.value = locale.value === 'en' ? 'tl' : 'en';
  globalThis.localStorage?.setItem('locale', locale.value);
};

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
  globalThis.localStorage?.setItem('languageSwitcherCollapsed', String(collapsed.value));
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
.language-switcher-float {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1200;
  display: flex;
  align-items: center;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(19, 67, 43, 0.16);
  transition: right 180ms ease, transform 180ms ease;
}
.language-switcher-float .language-switcher {
  border-radius: 999px 0 0 999px;
  border-right: 0;
}
.language-switcher-collapse {
  width: 34px;
  align-self: stretch;
  border: 1px solid rgba(46, 125, 50, 0.2);
  background: #f1f8f4;
  color: #1c4d34;
  border-radius: 0 999px 999px 0;
  cursor: pointer;
}
.language-switcher-collapse:hover {
  background: #e3f2e8;
}
.language-switcher-float--collapsed {
  right: -8px;
  box-shadow: 0 6px 18px rgba(19, 67, 43, 0.18);
}
.language-switcher-float--collapsed .language-switcher-collapse {
  width: 42px;
  height: 42px;
  padding-right: 8px;
  border-radius: 999px 0 0 999px;
}

@media (max-width: 720px) {
  .language-switcher-float {
    top: 10px;
    right: 10px;
  }

  .language-switcher-float .language-switcher span {
    display: none;
  }

  .language-switcher-float .language-switcher {
    padding: 0.55rem 0.7rem;
  }

  .language-switcher-float--collapsed {
    right: -8px;
  }
}
</style>
