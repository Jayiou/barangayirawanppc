<template>
  <div class="status-action-buttons">
    <button
      v-for="action in availableActions"
      :key="action.action"
      @click="triggerAction(action)"
      :class="`btn btn-${action.color} btn-sm`"
      :disabled="loading"
      :title="action.label"
    >
      <i :class="`fa-solid fa-${action.icon}`"></i> {{ action.label }}
    </button>
    <span v-if="availableActions.length === 0" class="text-muted" style="font-size: 0.9rem;">
      No further actions available
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entityType: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['action-triggered', 'error']);

const actionDefinitions = {
  documentRequest: {
    pending: [
      { label: 'Approve', action: 'approve', icon: 'check', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true },
      { label: 'Processing', action: 'processing', icon: 'cog', color: 'warning' }
    ],
    approved: [
      { label: 'Processing', action: 'processing', icon: 'cog', color: 'warning' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    processing: [
      { label: 'Ready for Pickup', action: 'ready-pickup', icon: 'box', color: 'info' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    ready_for_pickup: [
      { label: 'Complete', action: 'complete', icon: 'check-circle', color: 'success' }
    ],
    rejected: [],
    completed: [],
    cancelled: []
  },
  facilityReservation: {
    pending: [
      { label: 'Approve', action: 'approve', icon: 'check', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    approved: [
      { label: 'Complete', action: 'complete', icon: 'check-circle', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    rescheduled: [
      { label: 'Complete', action: 'complete', icon: 'check-circle', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    rejected: [],
    completed: [],
    cancelled: []
  },
  report: {
    pending: [
      { label: 'Start Review', action: 'reviewing', icon: 'eye', color: 'info' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    reviewing: [
      { label: 'In Progress', action: 'progress', icon: 'spinner', color: 'warning' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    in_progress: [
      { label: 'Resolve', action: 'resolve', icon: 'check-circle', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    resolved: [],
    rejected: [],
    closed: []
  },
  appointment: {
    pending: [
      { label: 'Approve', action: 'approve', icon: 'check', color: 'success' },
      { label: 'Reject', action: 'reject', icon: 'times', color: 'danger', requiresReason: true }
    ],
    approved: [
      { label: 'Complete', action: 'complete', icon: 'check-circle', color: 'success', requiresReason: true },
      { label: 'Cancel', action: 'cancel', icon: 'times', color: 'danger', requiresReason: true }
    ],
    cancelled: [],
    completed: [],
    rejected: []
  }
};

const availableActions = computed(() => {
  const actions = actionDefinitions[props.entityType];
  if (!actions || !actions[props.currentStatus]) {
    return [];
  }
  return actions[props.currentStatus];
});

const triggerAction = (action) => {
  emit('action-triggered', action);
};
</script>

<style scoped>
.status-action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #2e7d32;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1b5e20;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b71c1c;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-warning {
  background: #f57c00;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e65100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-info {
  background: #1976d2;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #1565c0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.text-muted {
  color: #999;
}
</style>
