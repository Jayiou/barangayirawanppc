<template>
    <div class="record-list">
        <div v-if="!items.length" class="record-item">No records found.</div>
        <div v-for="item in items" :key="item.id" class="record-item">
            <div class="record-title">
                <span>{{ item.title }}</span>
                <StatusBadge v-if="item.status" :status="item.status" />
            </div>
            <div class="record-meta">{{ item.meta }}</div>
            <slot name="extra" :item="item" />
        </div>
    </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue';

defineProps({
    items: {
        type: Array,
        default: () => []
    }
});
</script>
