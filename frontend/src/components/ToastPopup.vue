<template>
    <transition name="toast-pop">
        <output v-if="message" class="toast-popup" :class="[`is-${type}`]" aria-live="polite">
            <div class="toast-icon" aria-hidden="true">
                <i :class="iconClass"></i>
            </div>
            <div class="toast-body">
                <strong>{{ title }}</strong>
                <p>{{ message }}</p>
            </div>
            <button type="button" class="toast-close" :aria-label="`Dismiss ${type} message`" @click="$emit('close')">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </output>
    </transition>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
    message: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'success',
        validator: (value) => ['success', 'error', 'info'].includes(value)
    }
});

const emit = defineEmits(['close']);
let timeoutId = null;

const title = computed(() => ({
    success: 'Success',
    error: 'Action failed',
    info: 'Notice'
}[props.type] || 'Notice'));

const iconClass = computed(() => ({
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info'
}[props.type] || 'fa-solid fa-circle-info'));

const scheduleClose = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (props.message) {
        timeoutId = setTimeout(() => {
            emit('close');
        }, 4000);
    }
};

// Watch for message changes and reset the auto-dismiss timer
watch(() => props.message, () => {
    scheduleClose();
});

onBeforeUnmount(() => {
    if (timeoutId) clearTimeout(timeoutId);
});
</script>

<style scoped>
.toast-popup {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 10050;
    width: min(100vw - 32px, 420px);
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    align-items: start;
    padding: 16px 18px 16px 16px;
    border-radius: 22px;
    box-shadow: 0 24px 80px rgba(12, 18, 14, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.42);
    backdrop-filter: blur(16px);
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 42%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(244, 248, 246, 0.92));
    position: fixed;
    overflow: hidden;
}

.toast-popup::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 6px;
    border-radius: 22px 0 0 22px;
    background: linear-gradient(180deg, rgba(58, 165, 99, 0.95), rgba(37, 127, 73, 0.9));
}

.toast-popup.is-success {
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.78), transparent 42%),
        linear-gradient(135deg, rgba(236, 248, 241, 0.97), rgba(214, 243, 225, 0.97));
    border-color: rgba(40, 127, 77, 0.18);
}

.toast-popup.is-error {
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.8), transparent 42%),
        linear-gradient(135deg, rgba(254, 240, 240, 0.98), rgba(255, 228, 228, 0.96));
    border-color: rgba(213, 42, 42, 0.18);
}

.toast-popup.is-info {
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.8), transparent 42%),
        linear-gradient(135deg, rgba(236, 243, 255, 0.98), rgba(224, 234, 255, 0.94));
    border-color: rgba(35, 91, 130, 0.18);
}

.toast-icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: #ffffff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    position: relative;
}

.toast-icon::after {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.22);
}

.is-success .toast-icon {
    background: linear-gradient(135deg, #257f49, #3aa563);
}

.is-error .toast-icon {
    background: linear-gradient(135deg, #d52a2a, #f05d5d);
}

.is-info .toast-icon {
    background: linear-gradient(135deg, #235b82, #4d88b0);
}

.toast-body {
    min-width: 0;
}

.toast-body strong {
    display: block;
    font-size: 0.98rem;
    color: #16241a;
    margin-bottom: 2px;
    letter-spacing: 0.01em;
}

.toast-body p {
    margin: 0;
    color: #405148;
    line-height: 1.45;
    font-size: 0.92rem;
    word-break: break-word;
}

.toast-close {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: none;
    background: rgba(255, 255, 255, 0.55);
    color: #5e6f66;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
}

.toast-close:hover {
    background: rgba(255, 255, 255, 0.92);
    color: #16241a;
    transform: scale(1.04);
}

.toast-pop-enter-active,
.toast-pop-leave-active {
    transition: all 0.22s ease;
}

.toast-pop-enter-from,
.toast-pop-leave-to {
    opacity: 0;
    transform: translateY(-12px) translateX(12px) scale(0.96);
}

@media (max-width: 640px) {
    .toast-popup {
        top: 14px;
        right: 14px;
        left: 14px;
        width: auto;
    }
}
</style>