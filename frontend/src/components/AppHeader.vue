<template>
  <header class="app-header">
    <div class="header-left">
      <h1>{{ $t('navigation.dashboard') }}</h1>
    </div>

    <div class="header-right">
      <ThemeLanguageControls />
      <button class="header-btn" type="button">
        <i class="fa-solid fa-user"></i>
        <span>{{ $t('navigation.profile') }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import ThemeLanguageControls from '@/components/ThemeLanguageControls.vue';
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 1rem 2rem;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.header-left h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.header-btn {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 700;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

.header-btn:hover {
  border-color: var(--accent, #257f49);
  color: var(--accent-deep, #0d4a2a);
}

@media (max-width: 720px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
