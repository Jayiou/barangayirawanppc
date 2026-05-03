<template>
    <span :class="['badge', status]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: { type: String, default: 'unknown' }
});

const label = computed(() => props.status.replaceAll('_', ' '));
</script>
