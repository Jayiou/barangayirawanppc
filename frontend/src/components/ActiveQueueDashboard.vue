<template>
  <div class="queue-dashboard">
    <div class="dashboard-head">
      <div>
        <span class="eyebrow">{{ t('components.activeQueueDashboard.monitoring') }}</span>
        <h3>{{ t('components.activeQueueDashboard.healthQueueDashboard') }}</h3>
      </div>
      <div class="head-actions">
        <button class="ghost-button" type="button" @click="loadQueue" :disabled="!selectedEventId || loading">
          <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'"></i>
          {{ t('components.activeQueueDashboard.refresh') }}
        </button>
        <button class="primary-button" type="button" @click="callNext" :disabled="!canCallNext">
          <i class="fa-solid fa-bullhorn"></i>
          {{ t('components.activeQueueDashboard.callNext') }}
        </button>
      </div>
    </div>

    <p v-if="actionMessage" class="action-message" :class="{ error: actionError }">{{ actionMessage }}</p>

    <div class="event-select-row">
      <label>
        <span>{{ t('components.activeQueueDashboard.selectEvent') }}</span>
        <select v-model="selectedEventId" @change="loadQueue">
          <option value="">{{ t('components.activeQueueDashboard.selectHealthEvent') }}</option>
          <option v-for="ev in events" :key="ev._id" :value="ev._id">
            {{ ev.title }} ({{ ev.prefix }}) - {{ t(ev.isQueueOpen ? 'common.open' : 'common.closed') }}
          </option>
        </select>
      </label>
      <div v-if="currentEvent" class="event-meta">
        <strong>{{ currentEvent.title }}</strong>
        <span>{{ formatDate(currentEvent.eventDate) }} | {{ currentEvent.startTime }} - {{ currentEvent.endTime }}</span>
      </div>
    </div>

    <div v-if="!selectedEventId" class="empty-state">{{ t('components.activeQueueDashboard.selectEventHelp') }}</div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-tile"><span>{{ t('components.activeQueueDashboard.waiting') }}</span><strong>{{ summary.waiting || 0 }}</strong></div>
        <div class="stat-tile"><span>{{ t('components.activeQueueDashboard.nowServing') }}</span><strong>{{ currentCode }}</strong></div>
        <div class="stat-tile"><span>{{ t('components.activeQueueDashboard.completed') }}</span><strong>{{ summary.completed || 0 }}</strong></div>
        <div class="stat-tile"><span>{{ t('components.activeQueueDashboard.total') }}</span><strong>{{ summary.total || queue.length }}</strong></div>
      </div>

      <div class="now-grid">
        <section class="status-panel current">
          <span class="eyebrow">{{ t('components.activeQueueDashboard.nowServing') }}</span>
          <strong>{{ summary.current?.queueCode || t('common.none') }}</strong>
          <p>{{ personName(summary.current) }}</p>
        </section>
        <section class="status-panel">
          <span class="eyebrow">{{ t('components.activeQueueDashboard.nextInLine') }}</span>
          <strong>{{ summary.next?.queueCode || t('common.none') }}</strong>
          <p>{{ personName(summary.next) }}</p>
        </section>
        <section class="status-panel">
          <span class="eyebrow">{{ t('components.activeQueueDashboard.queueState') }}</span>
          <strong>{{ t(currentEvent?.isQueueOpen ? 'common.open' : 'common.closed') }}</strong>
          <p>{{ lastUpdated ? `${t('components.activeQueueDashboard.updatedPrefix')} ${lastUpdated}` : t('components.activeQueueDashboard.updatedNotRefreshed') }}</p>
        </section>
      </div>

      <div class="queue-columns">
        <section class="queue-column">
          <div class="column-head">
            <h4>{{ t('components.activeQueueDashboard.waiting') }}</h4>
            <span>{{ waitingItems.length }}</span>
          </div>
          <div v-if="!waitingItems.length" class="empty-state small">{{ t('components.activeQueueDashboard.noWaitingResidents') }}</div>
          <article v-for="item in waitingItems" :key="item._id" class="queue-item">
            <div>
              <strong>{{ item.queueCode }}</strong>
              <span>{{ item.firstName }} {{ item.lastName }}</span>
              <small>{{ item.contactNumber }} | {{ item.email || t('common.noEmail') }}</small>
            </div>
            <div class="item-actions">
              <button class="ghost-button icon-action" type="button" :title="t('components.activeQueueDashboard.editEntry')" @click="openEdit(item)">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="ghost-button icon-action" type="button" :title="t('common.serveNow')" @click="updateQueueStatus(item, 'serving')">
                <i class="fa-solid fa-play"></i>
              </button>
              <button class="ghost-button icon-action danger" type="button" :title="t('components.activeQueueDashboard.cancelEntry')" @click="cancelEntry(item)">
                <i class="fa-solid fa-ban"></i>
              </button>
            </div>
          </article>
        </section>

        <section class="queue-column">
          <div class="column-head">
            <h4>{{ t('components.activeQueueDashboard.servingAndDone') }}</h4>
            <span>{{ activeOrDoneItems.length }}</span>
          </div>
          <div v-if="!activeOrDoneItems.length" class="empty-state small">{{ t('components.activeQueueDashboard.noServedEntries') }}</div>
          <article v-for="item in activeOrDoneItems" :key="item._id" class="queue-item" :class="item.status">
            <div>
              <strong>{{ item.queueCode }}</strong>
              <span>{{ item.firstName }} {{ item.lastName }}</span>
              <small>{{ labelStatus(item.status) }}</small>
            </div>
            <div class="item-actions" v-if="item.status === 'serving'">
              <button class="ghost-button icon-action" type="button" :title="t('components.activeQueueDashboard.markComplete')" @click="updateQueueStatus(item, 'completed')">
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="ghost-button icon-action" type="button" :title="t('components.activeQueueDashboard.markNoShow')" @click="updateQueueStatus(item, 'no-show')">
                <i class="fa-solid fa-user-slash"></i>
              </button>
            </div>
            <button v-else-if="canDelete(item)" class="ghost-button icon-action danger" type="button" :title="t('components.activeQueueDashboard.deleteEntry')" @click="deleteEntry(item)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </article>
        </section>
      </div>
    </template>

    <div v-if="editingItem" class="queue-modal-backdrop" @click.self="closeEdit">
      <form class="queue-modal" @submit.prevent="saveEdit">
        <div class="column-head">
          <h4>{{ t('components.activeQueueDashboard.editEntry') }} {{ editingItem.queueCode }}</h4>
          <button class="ghost-button icon-action" type="button" @click="closeEdit"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <label><span>{{ t('components.activeQueueDashboard.firstName') }}</span><input v-model.trim="editForm.firstName" required></label>
        <label><span>{{ t('components.activeQueueDashboard.lastName') }}</span><input v-model.trim="editForm.lastName" required></label>
        <label><span>{{ t('common.contact') }}</span><input v-model.trim="editForm.contactNumber" required></label>
        <label><span>{{ t('components.activeQueueDashboard.email') }}</span><input v-model.trim="editForm.email" type="email"></label>
        <div class="item-actions">
          <button class="primary-button" type="submit" :disabled="saving">{{ saving ? t('common.processing') : t('common.saveChanges') }}</button>
          <button class="ghost-button" type="button" @click="closeEdit">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiFetch, formatDate } from '@/shared/client';

const { t } = useI18n();
const events = ref([]);
const queue = ref([]);
const summary = ref({});
const loading = ref(false);
const selectedEventId = ref('');
const currentEvent = ref(null);
const lastUpdated = ref('');
const pollHandle = ref(null);
const actionMessage = ref('');
const actionError = ref(false);
const saving = ref(false);
const editingItem = ref(null);
const editForm = ref({ firstName: '', lastName: '', contactNumber: '', email: '' });

const waitingItems = computed(() => queue.value.filter((item) => item.status === 'waiting'));
const activeOrDoneItems = computed(() => queue.value.filter((item) => item.status !== 'waiting'));
const currentCode = computed(() => summary.value.current?.queueCode || t('common.none'));
const canCallNext = computed(() => Boolean(selectedEventId.value && currentEvent.value?.isQueueOpen && waitingItems.value.length && !loading.value));

const loadEvents = async () => {
  const res = await apiFetch('/api/health-events');
  if (res?.success) {
    events.value = res.data || [];
    if (!selectedEventId.value) {
      const openEvent = events.value.find((event) => event.isQueueOpen) || events.value[0];
      selectedEventId.value = openEvent?._id || '';
    }
  }
};

const loadQueue = async () => {
  if (!selectedEventId.value) return;
  loading.value = true;
  try {
    const res = await apiFetch(`/api/health-queues/${selectedEventId.value}`);
    if (res?.success) {
      queue.value = res.data || [];
      summary.value = res.summary || {};
      currentEvent.value = res.event || events.value.find((event) => event._id === selectedEventId.value) || null;
      lastUpdated.value = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  } finally {
    loading.value = false;
  }
};

const startPolling = () => {
  stopPolling();
  pollHandle.value = window.setInterval(loadQueue, 10000);
};

const stopPolling = () => {
  if (pollHandle.value) {
    clearInterval(pollHandle.value);
    pollHandle.value = null;
  }
};

onMounted(async () => {
  await loadEvents();
  await loadQueue();
  startPolling();
});

onUnmounted(stopPolling);

const callNext = async () => {
  if (!selectedEventId.value) return;
  try {
    const res = await apiFetch(`/api/health-queues/${selectedEventId.value}/call-next`, { method: 'POST', body: {} });
    setActionMessage(notificationMessage(res, res?.message || t('components.activeQueueDashboard.calledNext')));
    await loadQueue();
    await loadEvents();
  } catch (error) {
    setActionMessage(error?.message || t('components.activeQueueDashboard.actionFailed'), true);
  }
};

const updateQueueStatus = async (item, status) => {
  try {
    const res = await apiFetch(`/api/health-queues/${selectedEventId.value}/${item._id}/status`, { method: 'PATCH', body: { status } });
    setActionMessage(notificationMessage(res, res?.message || t('components.activeQueueDashboard.statusUpdated')));
    await loadQueue();
  } catch (error) {
    setActionMessage(error?.message || t('components.activeQueueDashboard.actionFailed'), true);
  }
};

const setActionMessage = (message, isError = false) => {
  actionMessage.value = message;
  actionError.value = isError;
};
const notificationMessage = (response, fallback) => {
  if (!response?.notification) return fallback;
  if (response.notification.turnSent) {
    return response.notification.nextSent
      ? `${fallback} ${t('components.activeQueueDashboard.turnAndNextSent')}`
      : `${fallback} ${t('components.activeQueueDashboard.turnSent')}`;
  }
  return `${fallback} ${t('components.activeQueueDashboard.notificationNotSent')}`;
};
const canDelete = (item) => ['completed', 'no-show', 'cancelled'].includes(item.status);
const cancelEntry = async (item) => {
  if (!window.confirm(t('components.activeQueueDashboard.confirmCancel', { code: item.queueCode }))) return;
  await updateQueueStatus(item, 'cancelled');
};
const deleteEntry = async (item) => {
  if (!window.confirm(t('components.activeQueueDashboard.confirmDelete', { code: item.queueCode }))) return;
  try {
    const res = await apiFetch(`/api/health-queues/${selectedEventId.value}/${item._id}`, { method: 'DELETE' });
    setActionMessage(res?.message || t('components.activeQueueDashboard.entryDeleted'));
    await loadQueue();
  } catch (error) {
    setActionMessage(error?.message || t('components.activeQueueDashboard.actionFailed'), true);
  }
};
const openEdit = (item) => {
  editingItem.value = item;
  editForm.value = {
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    contactNumber: item.contactNumber || '',
    email: item.email || ''
  };
};
const closeEdit = () => {
  editingItem.value = null;
};
const saveEdit = async () => {
  if (!editingItem.value) return;
  saving.value = true;
  try {
    const res = await apiFetch(`/api/health-queues/${selectedEventId.value}/${editingItem.value._id}`, {
      method: 'PATCH',
      body: editForm.value
    });
    setActionMessage(res?.message || t('components.activeQueueDashboard.entryUpdated'));
    closeEdit();
    await loadQueue();
  } catch (error) {
    setActionMessage(error?.message || t('components.activeQueueDashboard.actionFailed'), true);
  } finally {
    saving.value = false;
  }
};

const personName = (item) => item ? `${item.firstName} ${item.lastName}` : 'No resident selected';
const labelStatus = (status) => String(status || '').replace('-', ' ');
</script>

<style scoped>
.queue-dashboard { display: grid; gap: 16px; }
.dashboard-head, .head-actions, .event-select-row, .column-head, .queue-item, .item-actions {
  display: flex;
  align-items: center;
}
.dashboard-head, .event-select-row, .column-head, .queue-item { justify-content: space-between; gap: 12px; }
.dashboard-head h3 { margin: 0; }
.head-actions, .item-actions { gap: 8px; flex-wrap: wrap; }
.event-select-row label { flex: 1; min-width: 260px; }
.event-meta { display: grid; gap: 2px; color: #607169; text-align: right; }
.stats-grid, .now-grid, .queue-columns { display: grid; gap: 12px; }
.stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.now-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.queue-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
.stat-tile, .status-panel, .queue-column { border: 1px solid #dfe9e4; border-radius: 8px; padding: 12px; }
.stat-tile { display: grid; gap: 6px; background: #fbfdfc; }
.stat-tile span, .status-panel p, .queue-item small { color: #66756e; }
.stat-tile strong { font-size: 1.8rem; line-height: 1; }
.status-panel { display: grid; gap: 4px; min-height: 112px; }
.status-panel strong { font-size: 1.45rem; }
.status-panel.current { border-color: #93d7b1; background: #f2fbf6; }
.queue-column { display: grid; gap: 10px; }
.column-head h4 { margin: 0; }
.column-head span { border-radius: 999px; background: #eef3f0; padding: 3px 8px; font-weight: 700; color: #52665b; }
.queue-item { border: 1px solid #e5ece8; border-radius: 8px; padding: 10px; align-items: flex-start; }
.queue-item > div:first-child { display: grid; gap: 3px; min-width: 0; }
.queue-item.serving { border-color: #93d7b1; background: #f4fbf7; }
.queue-item.completed { opacity: 0.8; }
.queue-item.no-show { border-color: #f0c0bd; background: #fff7f6; }
.icon-action { width: 38px; height: 38px; justify-content: center; padding: 0; }
.empty-state { padding: 20px; text-align: center; color: #66736d; border: 1px dashed #d9e3de; border-radius: 8px; }
.empty-state.small { padding: 14px; }
.action-message { margin: 0; padding: 10px 12px; border-radius: 8px; background: #e8f7ee; color: #17623a; }
.action-message.error { background: #fff0ef; color: #9c2f27; }
.danger { color: #a7372f; }
.queue-modal-backdrop { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 20px; background: rgba(20, 35, 28, 0.45); }
.queue-modal { width: min(480px, 100%); display: grid; gap: 12px; padding: 18px; border-radius: 12px; background: #fff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
.queue-modal h4 { margin: 0; }
@media (max-width: 900px) {
  .stats-grid, .now-grid, .queue-columns { grid-template-columns: 1fr; }
  .dashboard-head, .event-select-row { align-items: stretch; flex-direction: column; }
  .event-meta { text-align: left; }
}
</style>
