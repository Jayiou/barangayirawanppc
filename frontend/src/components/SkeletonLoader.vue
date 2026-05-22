<template>
  <div :class="['skeleton', `skeleton-`]" :style="{ width, height }"></div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'text'
  },
  width: {
    type: String,
    default: null
  },
  height: {
    type: String,
    default: null
  }
});
</script>