<template>
  <div class="queue-dashboard">
    <div class="dashboard-head">
      <div>
        <span class="eyebrow">Monitoring</span>
        <h3>Health queue dashboard</h3>
      </div>
      <div class="head-actions">
        <button class="ghost-button" type="button" @click="loadQueue" :disabled="!selectedEventId || loading">
          <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'"></i>
          Refresh
        </button>
        <button class="primary-button" type="button" @click="callNext" :disabled="!canCallNext">
          <i class="fa-solid fa-bullhorn"></i>
          Call Next
        </button>
      </div>
    </div>

    <div class="event-select-row">
      <label>
        <span>Select event</span>
        <select v-model="selectedEventId" @change="loadQueue">
          <option value="">Select health event</option>
          <option v-for="ev in events" :key="ev._id" :value="ev._id">
            {{ ev.title }} ({{ ev.prefix }}) - {{ ev.isQueueOpen ? 'Open' : 'Closed' }}
          </option>
        </select>
      </label>
      <div v-if="currentEvent" class="event-meta">
        <strong>{{ currentEvent.title }}</strong>
        <span>{{ formatDate(currentEvent.eventDate) }} | {{ currentEvent.startTime }} - {{ currentEvent.endTime }}</span>
      </div>
    </div>

    <div v-if="!selectedEventId" class="empty-state">Select an event to start monitoring the queue.</div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-tile"><span>Waiting</span><strong>{{ summary.waiting || 0 }}</strong></div>
        <div class="stat-tile"><span>Serving</span><strong>{{ currentCode }}</strong></div>
        <div class="stat-tile"><span>Completed</span><strong>{{ summary.completed || 0 }}</strong></div>
        <div class="stat-tile"><span>Total</span><strong>{{ summary.total || queue.length }}</strong></div>
      </div>

      <div class="now-grid">
        <section class="status-panel current">
          <span class="eyebrow">Now Serving</span>
          <strong>{{ summary.current?.queueCode || 'None' }}</strong>
          <p>{{ personName(summary.current) }}</p>
        </section>
        <section class="status-panel">
          <span class="eyebrow">Next In Line</span>
          <strong>{{ summary.next?.queueCode || 'None' }}</strong>
          <p>{{ personName(summary.next) }}</p>
        </section>
        <section class="status-panel">
          <span class="eyebrow">Queue State</span>
          <strong>{{ currentEvent?.isQueueOpen ? 'Open' : 'Closed' }}</strong>
          <p>{{ lastUpdated ? `Updated ${lastUpdated}` : 'Not refreshed yet' }}</p>
        </section>
      </div>

      <div class="queue-columns">
        <section class="queue-column">
          <div class="column-head">
            <h4>Waiting</h4>
            <span>{{ waitingItems.length }}</span>
          </div>
          <div v-if="!waitingItems.length" class="empty-state small">No waiting residents.</div>
          <article v-for="item in waitingItems" :key="item._id" class="queue-item">
            <div>
              <strong>{{ item.queueCode }}</strong>
              <span>{{ item.firstName }} {{ item.lastName }}</span>
              <small>{{ item.contactNumber }} | {{ item.email || 'No email' }}</small>
            </div>
            <button class="ghost-button icon-action" type="button" title="Serve now" @click="updateQueueStatus(item, 'serving')">
              <i class="fa-solid fa-play"></i>
            </button>
          </article>
        </section>

        <section class="queue-column">
          <div class="column-head">
            <h4>Serving and done</h4>
            <span>{{ activeOrDoneItems.length }}</span>
          </div>
          <div v-if="!activeOrDoneItems.length" class="empty-state small">No served entries yet.</div>
          <article v-for="item in activeOrDoneItems" :key="item._id" class="queue-item" :class="item.status">
            <div>
              <strong>{{ item.queueCode }}</strong>
              <span>{{ item.firstName }} {{ item.lastName }}</span>
              <small>{{ labelStatus(item.status) }}</small>
            </div>
            <div class="item-actions" v-if="item.status === 'serving'">
              <button class="ghost-button icon-action" type="button" title="Mark complete" @click="updateQueueStatus(item, 'completed')">
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="ghost-button icon-action" type="button" title="Mark no-show" @click="updateQueueStatus(item, 'no-show')">
                <i class="fa-solid fa-user-slash"></i>
              </button>
            </div>
          </article>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { apiFetch, formatDate } from '@/shared/client';

const events = ref([]);
const queue = ref([]);
const summary = ref({});
const loading = ref(false);
const selectedEventId = ref('');
const currentEvent = ref(null);
const lastUpdated = ref('');
const pollHandle = ref(null);

const waitingItems = computed(() => queue.value.filter((item) => item.status === 'waiting'));
const activeOrDoneItems = computed(() => queue.value.filter((item) => item.status !== 'waiting'));
const currentCode = computed(() => summary.value.current?.queueCode || (currentEvent.value?.currentServing ? `#${currentEvent.value.currentServing}` : 'None'));
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
  await apiFetch(`/api/health-queues/${selectedEventId.value}/call-next`, { method: 'POST', body: {} });
  await loadQueue();
  await loadEvents();
};

const updateQueueStatus = async (item, status) => {
  await apiFetch(`/api/health-queues/${selectedEventId.value}/${item._id}/status`, { method: 'PATCH', body: { status } });
  await loadQueue();
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
@media (max-width: 900px) {
  .stats-grid, .now-grid, .queue-columns { grid-template-columns: 1fr; }
  .dashboard-head, .event-select-row { align-items: stretch; flex-direction: column; }
  .event-meta { text-align: left; }
}
</style>
