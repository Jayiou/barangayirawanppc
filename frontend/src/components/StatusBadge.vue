<template>
    <span :class="['badge', statusClass]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: { type: String, default: 'unknown' }
});

const label = computed(() => props.status.replaceAll('_', ' '));

const statusClass = computed(() => {
    if (!props.status) return 'unknown';
    return props.status.toLowerCase();
});
</script>

<style scoped>
.badge {
    text-decoration: none;
}
</style>
