# Language & Theme Implementation Guide

## Overview
Ang system ay may built-in support para sa:
- **Language Translation**: English & Tagalog
- **Theme Switching**: Light, Dark, at System (auto-detect)

## Usage

### 1. Add Controls sa Component
I-import ang `ThemeLanguageControls` component sa kahit saang page:

```vue
<template>
  <div>
    <!-- Add this component sa top ng page -->
    <ThemeLanguageControls />
    
    <!-- Ang rest ng page content -->
  </div>
</template>

<script setup>
import ThemeLanguageControls from '@/components/ThemeLanguageControls.vue';
</script>
```

### 2. Use Translations sa Components

```vue
<template>
  <div>
    <h1>{{ $t('navigation.home') }}</h1>
    <button>{{ $t('common.save') }}</button>
  </div>
</template>
```

### 3. Use Theme Composable

```vue
<script setup>
import { useTheme } from '@/composables/useTheme';

const { theme, currentTheme, isDark, setTheme } = useTheme();

// Get current theme
console.log(theme.value); // 'light', 'dark', or 'system'

// Get actual applied theme
console.log(currentTheme.value); // 'light' or 'dark'

// Check if dark mode
if (isDark.value) {
  console.log('Dark mode is active');
}

// Change theme
setTheme('dark');
</script>
```

### 4. Use Language Composable

```vue
<script setup>
import { useLanguage } from '@/composables/useLanguage';

const { language, setLanguage } = useLanguage();

// Change language
setLanguage('tl'); // Tagalog
setLanguage('en'); // English
</script>
```

## Adding New Translations

### Edit `frontend/src/locales/en.json` and `frontend/src/locales/tl.json`:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "mySection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

Then use in template:
```vue
{{ $t('mySection.title') }}
```

## CSS Variables for Theme

Available CSS variables:
- `--bg-primary`: Primary background
- `--bg-secondary`: Secondary background  
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--border-color`: Border color
- `--shadow`: Shadow effect

Usage in CSS:
```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

## Storage
- Language preference: Saved sa `localStorage['language']`
- Theme preference: Saved sa `localStorage['theme']`

Both persist across browser sessions!

## Dark Mode Activation
- **System**: Uses OS preference
- **Dark**: Always dark
- **Light**: Always light

The theme is automatically applied sa document root at body element.
