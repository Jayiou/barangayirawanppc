<template>
  <div v-if="visible" class="modal-backdrop" @click.self="close">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 v-if="action" style="margin: 0;">
          <i :class="`fa-solid fa-${action.icon}`" style="margin-right: 8px;"></i>
          {{ action.label }}?
        </h3>
        <button class="close-btn" @click="close" aria-label="Close modal">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <p v-if="action" class="confirmation-text">
          Are you sure you want to <strong>{{ action.label.toLowerCase() }}</strong> this {{ entityName }}?
        </p>

        <div v-if="action && action.requiresReason" class="form-group">
          <label>
            <span style="font-weight: 600; color: #333;">Reason for {{ action.label.toLowerCase() }} *</span>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="Please provide a clear reason..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: inherit;
                font-size: 0.95rem;
                margin-top: 8px;
              "
            ></textarea>
          </label>
          <div v-if="reasonError" class="error-message">
            {{ reasonError }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn btn-secondary">Cancel</button>
        <button
          @click="handleConfirm"
          :class="`btn btn-${action?.color || 'primary'}`"
          :disabled="loading || (action?.requiresReason && !reason.trim())"
        >
          {{ loading ? 'Processing...' : (action?.label || 'Confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  action: {
    type: Object,
    default: null
  },
  entityName: {
    type: String,
    default: 'this item'
  },
  entityType: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const reason = ref('');
const reasonError = ref('');

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    reason.value = '';
    reasonError.value = '';
  }
});

const handleConfirm = () => {
  if (props.action?.requiresReason) {
    if (!reason.value.trim()) {
      reasonError.value = 'Reason is required';
      return;
    }
  }

  emit('confirm', reason.value);
};

const close = () => {
  emit('cancel');
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.confirmation-text {
  margin: 0 0 20px 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
}

.form-group {
  margin-top: 15px;
}

.form-group label {
  display: block;
}

.error-message {
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 6px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-success {
  background: #2e7d32;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1b5e20;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b71c1c;
}

.btn-warning {
  background: #f57c00;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e65100;
}

.btn-info {
  background: #1976d2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}
</style>
