<template>
  <div>
    <h3>Active Queue Dashboard</h3>
    <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
      <label style="flex:1;"><span>Select Event</span>
        <select v-model="selectedEventId" @change="loadQueue">
          <option value="">-- Select --</option>
          <option v-for="ev in events" :key="ev._id" :value="ev._id">{{ ev.title }} ({{ ev.prefix }})</option>
        </select>
      </label>
      <div v-if="currentEvent"><strong>Now Serving: {{ currentEvent.currentServing || 0 }}</strong></div>
      <button class="primary-button" @click="callNext" :disabled="!selectedEventId">Call Next</button>
    </div>

    <div v-if="loading">Loading queue...</div>
    <div v-else>
      <div v-for="item in queue" :key="item._id" style="padding:8px; border:1px solid #e6eee9; border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ item.queueCode }}</strong> · {{ item.firstName }} {{ item.lastName }} <small class="fine-print">({{ item.status }})</small>
        </div>
        <div class="fine-print">{{ item.contactNumber }} · {{ item.email || '-' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiFetch } from '@/shared/client';

const events = ref([]);
const queue = ref([]);
const loading = ref(false);
const selectedEventId = ref('');
const currentEvent = ref(null);

const loadEvents = async () => {
  const res = await apiFetch('/api/health-events');
  if (res?.success) events.value = res.data;
};

const loadQueue = async () => {
  if (!selectedEventId.value) return;
  loading.value = true;
  const [qRes, eRes] = await Promise.all([
    apiFetch(`/api/health-queues/${selectedEventId.value}`),
    apiFetch(`/api/health-events/${selectedEventId.value}`)
  ]);
  if (qRes?.success) queue.value = qRes.data;
  if (eRes?.success) currentEvent.value = eRes.data;
  loading.value = false;
};

onMounted(async () => { await loadEvents(); });

const callNext = async () => {
  if (!selectedEventId.value) return;
  await apiFetch(`/api/health-queues/${selectedEventId.value}/call-next`, { method: 'POST', body: {} });
  await loadQueue();
  await loadEvents();
};
</script>

<style scoped>
.fine-print { color:#666; font-size:0.9rem; }
</style>
