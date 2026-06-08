<template>
  <header class="app-header">
    <div class="header-left">
      <h1>{{ $t('navigation.dashboard') }}</h1>
    </div>
    
    <div class="header-right">
      <!-- Add Theme & Language Controls -->
      <ThemeLanguageControls />
      
      <!-- Other header items -->
      <button class="header-btn">
        <i class="fa-solid fa-user"></i> {{ $t('navigation.profile') }}
      </button>
    </div>
  </header>
</template>

<script setup>
import ThemeLanguageControls from '@/components/ThemeLanguageControls.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.header-left h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-btn {
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background-color: var(--text-secondary);
  color: var(--bg-primary);
}
</style>
