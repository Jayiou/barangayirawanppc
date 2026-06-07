<template>
  <div>
    <h3>Health Events</h3>
    <form @submit.prevent="createEvent" style="display:grid; gap:8px; max-width:560px;">
      <label><span>Title</span><input v-model="form.title" required></label>
      <label><span>Prefix (e.g. VAX)</span><input v-model="form.prefix" maxlength="5" required></input></label>
      <label><span>Date</span><input v-model="form.eventDate" type="date" required></label>
      <div style="display:flex; gap:8px;"><label style="flex:1;"><span>Start Time</span><input v-model="form.startTime" type="time" required></label><label style="flex:1;"><span>End Time</span><input v-model="form.endTime" type="time" required></label></div>
      <label><span>Description</span><textarea v-model="form.description"></textarea></label>
      <div style="display:flex; gap:8px;"><button class="primary-button" type="submit">Create</button><button type="button" class="ghost-button" @click="resetForm">Reset</button></div>
    </form>

    <hr style="margin:16px 0;" />

    <h4>Events</h4>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="ev in events" :key="ev._id" style="padding:8px; border:1px solid #e6eee9; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ ev.title }}</strong>
          <div class="fine-print">{{ formatDate(ev.eventDate) }} · {{ ev.startTime }} - {{ ev.endTime }} · Prefix: {{ ev.prefix }}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="ghost-button" @click="toggleQueue(ev)">{{ ev.isQueueOpen ? 'Close Queue' : 'Open Queue' }}</button>
          <button class="ghost-button" @click="editEvent(ev)">Edit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiFetch, formatDate } from '@/shared/client';

const events = ref([]);
const loading = ref(false);
const form = ref({ title: '', prefix: '', eventDate: '', startTime: '', endTime: '', description: '' });

const load = async () => {
  loading.value = true;
  const res = await apiFetch('/api/health-events');
  if (res?.success) events.value = res.data;
  loading.value = false;
};

onMounted(load);

const createEvent = async () => {
  await apiFetch('/api/health-events', { method: 'POST', body: form.value });
  resetForm();
  await load();
};

const resetForm = () => { form.value = { title: '', prefix: '', eventDate: '', startTime: '', endTime: '', description: '' }; };

const toggleQueue = async (ev) => {
  await apiFetch(`/api/health-events/${ev._id}/toggle-queue`, { method: 'POST', body: { open: !ev.isQueueOpen } });
  await load();
};

const editEvent = (ev) => {
  form.value = { title: ev.title, prefix: ev.prefix, eventDate: new Date(ev.eventDate).toISOString().slice(0,10), startTime: ev.startTime, endTime: ev.endTime, description: ev.description || '' };
};

export { formatDate };
</script>

<style scoped>
.fine-print { color:#666; font-size:0.9rem; }
</style>
