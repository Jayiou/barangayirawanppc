<template>
    <div class="brand-row">
        <div :class="['brand-mark', { admin }]">
            <img
                src="/images/hero-logo-160.jpg"
                srcset="/images/hero-logo-96.jpg 96w, /images/hero-logo-160.jpg 160w, /images/hero-logo-320.jpg 320w"
                sizes="(max-width: 700px) 42px, 60px"
                width="160"
                height="160"
                alt="Barangay Irawan logo"
                class="brand-logo"
                decoding="async"
            />
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
