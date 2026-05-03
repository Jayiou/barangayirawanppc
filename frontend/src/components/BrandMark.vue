<template>
    <div class="brand-row">
        <div :class="['brand-mark', { admin }]">
            <img src="/images/hero-logo.jpg" alt="Logo" class="brand-logo" />
        </div>
        <div>
            <span class="eyebrow">{{ eyebrow }}</span>
            <h1>{{ title }}</h1>
        </div>
    </div>
</template>

<script setup>
defineProps({
    initials: { type: String, required: true },
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    admin: { type: Boolean, default: false }
});
</script>
