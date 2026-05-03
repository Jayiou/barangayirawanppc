const fs = require('fs');
const template = \<template>
    <div class=\"page-shell app-shell\" v-if=\"!isAuthenticated\">
        <main class=\"app-main\" style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;\">
            <BrandMark initials=\"BC\" eyebrow=\"Barangay Admin\" title=\"Barangay Connect\" style=\"margin: 0 auto 2rem;\" />
            <form class=\"stack\" @submit.prevent=\"loginAdmin\" style=\"width: 100%; max-width: 400px; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);\">
                <div class=\"section-head\" style=\"text-align: center; margin-bottom: 2rem;\">
                    <h3>Administrator Login</h3>
                </div>
                <label><span>Username</span><input v-model=\"loginForm.username\" type=\"text\" required></label>
                <label><span>Password</span><input v-model=\"loginForm.password\" type=\"password\" required></label>
                <button type=\"submit\" class=\"primary-button\" style=\"justify-content: center; width: 100%;\"><i class=\"fa-solid fa-lock\"></i> Log In</button>
                <div v-if=\"loginStatus\" class=\"status-box\" :style=\"{ color: loginError ? '#d52a2a' : '#257f49', marginTop: '1rem' }\">{{ loginStatus }}</div>
            </form>
        </main>
    </div>

    <div class=\"page-shell app-shell\" v-else>
        <aside class=\"app-sidebar\" :class=\"{ open: sidebarOpen }\">
            <button class=\"sidebar-close-btn\" @click=\"sidebarOpen = false\"><i class=\"fa-solid fa-xmark\"></i></button>
            <BrandMark initials=\"BC\" eyebrow=\"Admin Portal\" title=\"Barangay Connect\" />

            <nav class=\"sidebar-nav\">
                <button :class=\"{ active: currentView === 'dashboard' }\" type=\"button\" @click=\"currentView = 'dashboard'\"><i class=\"fa-solid fa-chart-pie\"></i> Dashboard</button>
                <button :class=\"{ active: currentView === 'residents' }\" type=\"button\" @click=\"currentView = 'residents'\"><i class=\"fa-solid fa-users\"></i> Residents</button>
                <button :class=\"{ active: currentView === 'documents' }\" type=\"button\" @click=\"currentView = 'documents'\"><i class=\"fa-solid fa-file-signature\"></i> Documents <span class=\"badge\" v-if=\"pendingCounts.docs\">{{ pendingCounts.docs }}</span></button>
                <button :class=\"{ active: currentView === 'appointments' }\" type=\"button\" @click=\"currentView = 'appointments'\"><i class=\"fa-solid fa-calendar-check\"></i> Appointments <span class=\"badge\" v-if=\"pendingCounts.appoints\">{{ pendingCounts.appoints }}</span></button>
                <button :class=\"{ active: currentView === 'reservations' }\" type=\"button\" @click=\"currentView = 'reservations'\"><i class=\"fa-solid fa-building\"></i> Facilities <span class=\"badge\" v-if=\"pendingCounts.reserves\">{{ pendingCounts.reserves }}</span></button>
                <button :class=\"{ active: currentView === 'reports' }\" type=\"button\" @click=\"currentView = 'reports'\"><i class=\"fa-solid fa-bullhorn\"></i> Reports <span class=\"badge\" v-if=\"pendingCounts.reports\">{{ pendingCounts.reports }}</span></button>
                <button :class=\"{ active: currentView === 'officials' }\" type=\"button\" @click=\"currentView = 'officials'\"><i class=\"fa-solid fa-user-tie\"></i> Officials</button>
            </nav>

            <div class=\"sidebar-block\">
                <span class=\"eyebrow\">Logged In As</span>
                <div v-if=\"user\">
                    <strong>{{ user.username }}</strong>
                    <div class=\"fine-print\">{{ user.email }}</div>
                </div>
            </div>

            <button type=\"button\" class=\"ghost-button\" @click=\"logout\" style=\"color: #d52a2a;\"><i class=\"fa-solid fa-right-from-bracket\"></i> Log Out</button>
        </aside>

        <main class=\"app-main\">
            <header class=\"mobile-app-header\">
                <button class=\"sidebar-open-btn\" @click=\"sidebarOpen = true\"><i class=\"fa-solid fa-bars\"></i></button>
            </header>
            <section class=\"hero-banner\" style=\"display: flex; justify-content: space-between; align-items: flex-end;\">
                <div>
                    <span class=\"eyebrow\">Admin Workspace</span>
                    <h2>{{ viewTitle }}</h2>
                </div>
                <div class=\"status-box\" :style=\"{ color: dashboardError ? '#d52a2a' : '#257f49' }\" style=\"background: white;\">
                    <i :class=\"dashboardError ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'\"></i> {{ dashboardStatus }}
                </div>
            </section>

            <!-- Dashboard View -->
            <section class=\"app-view\" :class=\"{ active: currentView === 'dashboard' }\">
                <div class=\"portal-grid\">
                    <article class=\"stat-card hover-lift\" @click=\"currentView = 'documents'\">
                        <div class=\"stat-icon docs\"><i class=\"fa-solid fa-file-signature\"></i></div>
                        <div class=\"stat-info\">
                            <h3>{{ pendingCounts.docs }}</h3>
                            <span>Pending Documents</span>
                        </div>
                    </article>
                    <article class=\"stat-card hover-lift\" @click=\"currentView = 'appointments'\">
                        <div class=\"stat-icon appoints\"><i class=\"fa-solid fa-calendar-check\"></i></div>
                        <div class=\"stat-info\">
                            <h3>{{ pendingCounts.appoints }}</h3>
                            <span>Pending Appointments</span>
                        </div>
                    </article>
                    <article class=\"stat-card hover-lift\" @click=\"currentView = 'reservations'\">
                        <div class=\"stat-icon reserves\"><i class=\"fa-solid fa-building\"></i></div>
                        <div class=\"stat-info\">
                            <h3>{{ pendingCounts.reserves }}</h3>
                            <span>Facility Requests</span>
                        </div>
                    </article>
                    <article class=\"stat-card hover-lift\" @click=\"currentView = 'reports'\">
                        <div class=\"stat-icon reports\"><i class=\"fa-solid fa-bullhorn\"></i></div>
                        <div class=\"stat-info\">
                            <h3>{{ pendingCounts.reports }}</h3>
                            <span>Active Reports</span>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Data Table Generic Loop For Other Views -->
            <section class=\"app-view\" :class=\"{ active: currentView !== 'dashboard' }\">
                <div class=\"portal-grid\">
                    <article class=\"content-card\" style=\"overflow-x: auto;\">
                        <div class=\"section-head\" style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;\">
                            <div>
                                <span class=\"eyebrow\">{{ viewTitle }}</span>
                                <h3>Manage {{ currentView }} records</h3>
                            </div>
                            <div class=\"toolbar\" style=\"margin: 0; display: flex; gap: 10px;\">
                                <span class=\"search-icon\" v-if=\"currentView === 'residents'\"><i class=\"fa-solid fa-search\"></i></span>
                                <input v-if=\"currentView === 'residents'\" v-model=\"residentSearch\" type=\"search\" placeholder=\"Search residents...\" style=\"padding-left: 30px;\">
                                <button v-if=\"currentView === 'officials'\" class=\"primary-button\" @click=\"openModal('official', {})\"><i class=\"fa-solid fa-plus\"></i> Add Official</button>
                            </div>
                        </div>

                        <table class=\"data-table\">
                            <thead>
                                <tr v-if=\"currentView === 'residents'\">
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Account Status</th>
                                    <th>Actions</th>
                                </tr>
                                <tr v-if=\"currentView === 'documents'\">
                                    <th>Type</th>
                                    <th>Resident</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                <tr v-if=\"currentView === 'appointments'\">
                                    <th>Date & Time</th>
                                    <th>Resident</th>
                                    <th>Concern</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                <tr v-if=\"currentView === 'reservations'\">
                                    <th>Facility & Date</th>
                                    <th>Resident</th>
                                    <th>Purpose</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                <tr v-if=\"currentView === 'reports'\">
                                    <th>Issue</th>
                                    <th>Resident / Type</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                <tr v-if=\"currentView === 'officials'\">
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for=\"item in currentList\" :key=\"item._id\" class=\"table-row hoverable\">
                                    <td v-if=\"currentView === 'residents'\"><strong>{{ item.firstName }} {{ item.lastName }}</strong></td>
                                    <td v-if=\"currentView === 'residents'\">{{ item.address }}</td>
                                    <td v-if=\"currentView === 'residents'\"><StatusBadge :status=\"item.userId?.accountStatus || 'pending'\" /></td>
                                    <td v-if=\"currentView === 'residents'\">
                                        <button class=\"icon-button\" @click=\"openModal('resident', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Act</button>
                                    </td>

                                    <td v-if=\"currentView === 'documents'\"><strong>{{ item.documentType.replace(/_/g, ' ') }}</strong></td>
                                    <td v-if=\"currentView === 'documents'\">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if=\"currentView === 'documents'\">{{ item.purpose }}</td>
                                    <td v-if=\"currentView === 'documents'\"><StatusBadge :status=\"item.status\" /></td>
                                    <td v-if=\"currentView === 'documents'\">
                                        <button class=\"icon-button\" @click=\"openModal('document', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Act</button>
                                    </td>

                                    <td v-if=\"currentView === 'appointments'\"><strong>{{ formatDate(item.appointmentDate) }}</strong><br><small>{{ item.timeSlot }}</small></td>
                                    <td v-if=\"currentView === 'appointments'\">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if=\"currentView === 'appointments'\">{{ item.purpose }}</td>
                                    <td v-if=\"currentView === 'appointments'\"><StatusBadge :status=\"item.status\" /></td>
                                    <td v-if=\"currentView === 'appointments'\">
                                        <button class=\"icon-button\" @click=\"openModal('appointment', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Act</button>
                                    </td>

                                    <td v-if=\"currentView === 'reservations'\"><strong>{{ item.facilityName.replace(/_/g, ' ') }}</strong><br><small>{{ formatDate(item.reservationDate) }} ({{ item.startTime }} - {{ item.endTime }})</small></td>
                                    <td v-if=\"currentView === 'reservations'\">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if=\"currentView === 'reservations'\">{{ item.purpose }}</td>
                                    <td v-if=\"currentView === 'reservations'\"><StatusBadge :status=\"item.status\" /></td>
                                    <td v-if=\"currentView === 'reservations'\">
                                        <button class=\"icon-button\" @click=\"openModal('reservation', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Act</button>
                                    </td>

                                    <td v-if=\"currentView === 'reports'\"><strong>{{ item.title }}</strong><br><small>{{ formatDate(item.incidentDate) }}</small></td>
                                    <td v-if=\"currentView === 'reports'\">{{ item.residentId ? (item.residentId.firstName + ' ' + item.residentId.lastName) : 'Anonymous' }}<br><small>{{ item.reportType.replace(/_/g,' ') }}</small></td>
                                    <td v-if=\"currentView === 'reports'\"><span class=\"priority-badge\" :class=\"'p-' + item.priority\">{{ item.priority.toUpperCase() }}</span></td>
                                    <td v-if=\"currentView === 'reports'\"><StatusBadge :status=\"item.status\" /></td>
                                    <td v-if=\"currentView === 'reports'\">
                                        <button class=\"icon-button\" @click=\"openModal('report', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Act</button>
                                    </td>

                                    <td v-if=\"currentView === 'officials'\"><strong>{{ item.fullName }}</strong></td>
                                    <td v-if=\"currentView === 'officials'\">{{ item.position }}</td>
                                    <td v-if=\"currentView === 'officials'\">{{ item.contactNumber || 'N/A' }}</td>
                                    <td v-if=\"currentView === 'officials'\"><StatusBadge :status=\"item.availabilityStatus || 'active'\" /></td>
                                    <td v-if=\"currentView === 'officials'\">
                                        <button class=\"icon-button\" @click=\"openModal('official', item)\"><i class=\"fa-solid fa-pen-to-square\"></i> Edit</button>
                                    </td>
                                </tr>
                                <tr v-if=\"currentList.length === 0\">
                                    <td colspan=\"6\" style=\"text-align: center; padding: 30px; color: #777;\"><i class=\"fa-solid fa-folder-open\"></i> No records found.</td>
                                </tr>
                            </tbody>
                        </table>
                    </article>
                </div>
            </section>
        </main>

        <!-- Dynamic Action Modal -->
        <div class=\"landing-modal-backdrop\" v-if=\"activeModal\" @click.self=\"activeModal = null\">
            <dialog class=\"landing-modal\" open style=\"min-width: 400px;\">
                <button class=\"landing-modal-close\" @click=\"activeModal = null\"><i class=\"fa-solid fa-xmark\"></i></button>

                <div v-if=\"activeModal === 'resident'\">
                    <h2><i class=\"fa-solid fa-user-check\"></i> Act on Resident</h2>
                    <p class=\"fine-print\">Review resident details and decide account status.</p>
                    <div class=\"stack\" style=\"background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 15px 0;\">
                        <p><strong>Name:</strong> {{ selectedItem.firstName }} {{ selectedItem.middleName }} {{ selectedItem.lastName }}</p>
                        <p><strong>Birth Date:</strong> {{ formatDate(selectedItem.birthDate) }} (Age: {{ calculateAge(selectedItem.birthDate) }})</p>
                        <p><strong>Address:</strong> {{ selectedItem.address }}, {{ selectedItem.purok }}</p>
                        <p><strong>Contact:</strong> {{ selectedItem.contactNumber }} | {{ selectedItem.email }}</p>
                    </div>
                    <form class=\"stack\" @submit.prevent=\"saveResidentStatus\">
                        <label>
                            <span>Action / Status</span>
                            <select v-model=\"editForm.status\" required>
                                <option value=\"pending_approval\">Pending Approval</option>
                                <option value=\"approved\">Approve</option>
                                <option value=\"rejected\">Reject</option>
                            </select>
                        </label>
                        <button type=\"submit\" class=\"primary-button\"><i class=\"fa-solid fa-save\"></i> Save Changes</button>
                    </form>
                </div>

                <div v-if=\"['document', 'appointment', 'reservation', 'report'].includes(activeModal)\">
                    <h2><i class=\"fa-solid fa-pen-to-square\"></i> Update Request</h2>
                    <p class=\"fine-print\">Change the status and provide notes to the resident.</p>
                    <form class=\"stack\" @submit.prevent=\"saveGenericStatus\" style=\"margin-top: 15px;\">
                        <!-- Using contextual dropdowns based on modal -->
                        <label>
                            <span>New Status</span>
                            <select v-model=\"editForm.status\" required v-if=\"activeModal === 'document'\">
                                <option value=\"pending\">Pending</option>
                                <option value=\"processing\">Processing</option>
                                <option value=\"approved\">Approved</option>
                                <option value=\"ready_for_pickup\">Ready for Pickup</option>
                                <option value=\"completed\">Completed</option>
                                <option value=\"rejected\">Rejected</option>
                            </select>
                            <select v-model=\"editForm.status\" required v-if=\"activeModal === 'appointment' || activeModal === 'reservation'\">
                                <option value=\"pending\">Pending</option>
                                <option value=\"approved\">Approved</option>
                                <option value=\"rescheduled\">Rescheduled</option>
                                <option value=\"completed\">Completed</option>
                                <option value=\"rejected\">Rejected</option>
                            </select>
                            <select v-model=\"editForm.status\" required v-if=\"activeModal === 'report'\">
                                <option value=\"pending\">Pending</option>
                                <option value=\"reviewing\">Reviewing</option>
                                <option value=\"in_progress\">In Progress</option>
                                <option value=\"resolved\">Resolved</option>
                                <option value=\"rejected\">Rejected</option>
                                <option value=\"closed\">Closed</option>
                            </select>
                        </label>
                        <label>
                            <span>Admin Notes (Sent in Email)</span>
                            <textarea v-model=\"editForm.adminNotes\" rows=\"3\" placeholder=\"Explain the status change...\"></textarea>
                        </label>
                        <button type=\"submit\" class=\"primary-button\"><i class=\"fa-solid fa-paper-plane\"></i> Save & Notify Resident</button>
                    </form>
                </div>

                <div v-if=\"activeModal === 'official'\">
                    <h2><i class=\"fa-solid fa-user-tie\"></i> Official Details</h2>
                    <form class=\"stack\" @submit.prevent=\"saveOfficial\" style=\"margin-top: 15px;\">
                        <input type=\"hidden\" v-model=\"editForm._id\">
                        <label><span>Full Name</span><input v-model=\"editForm.fullName\" required></label>
                        <label><span>Position</span><input v-model=\"editForm.position\" required></label>
                        <label><span>Contact Number</span><input v-model=\"editForm.contactNumber\"></label>
                        <label><span>Email</span><input v-model=\"editForm.email\" type=\"email\"></label>
                        <label><span>Office Days</span><input v-model=\"editForm.officeDays\" placeholder=\"Mon, Tue, Wed\"></label>
                        <label><span>Session Start</span><input v-model=\"editForm.officeStartTime\" type=\"time\"></label>
                        <label><span>Session End</span><input v-model=\"editForm.officeEndTime\" type=\"time\"></label>
                        <label><span>Location</span><input v-model=\"editForm.officeLocation\" placeholder=\"Barangay Hall\"></label>
                        <label>
                            <span>Status</span>
                            <select v-model=\"editForm.availabilityStatus\">
                                <option value=\"active\">Active</option>
                                <option value=\"inactive\">Inactive</option>
                            </select>
                        </label>
                        <button type=\"submit\" class=\"primary-button\"><i class=\"fa-solid fa-save\"></i> Save Official</button>
                    </form>
                </div>
            </dialog>
        </div>
    </div>
</template>\;
const script = \<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { apiFetch, clearAuth, formatDate, getAuth, setAuth } from '@/shared/client';

const isAuthenticated = ref(false);
const loginForm = reactive({ username: '', password: '' });
const loginStatus = ref('');
const loginError = ref(false);
const sidebarOpen = ref(false);

const dashboardStatus = ref('Loading portal...');
const dashboardError = ref(false);
const user = ref(null);
const currentView = ref('dashboard');

const activeModal = ref(null);
const selectedItem = ref({});
const editForm = reactive({});

const officials = ref([]);
const residents = ref([]);
const appointments = ref([]);
const documentRequests = ref([]);
const reservations = ref([]);
const reports = ref([]);

const residentSearch = ref('');

const pendingCounts = computed(() => ({
    docs: documentRequests.value.filter(r => r.status === 'pending' || r.status === 'processing').length,
    appoints: appointments.value.filter(r => r.status === 'pending').length,
    reserves: reservations.value.filter(r => r.status === 'pending').length,
    reports: reports.value.filter(r => r.status === 'pending' || r.status === 'reviewing').length,
    accs: residents.value.filter(r => r.userId?.accountStatus === 'pending_approval').length
}));

const viewTitle = computed(() => ({
    dashboard: 'Portal Overview',
    residents: 'Resident Accounts',
    documents: 'Document Requests',
    appointments: 'Appointments',
    reservations: 'Facility Reservations',
    reports: 'Resident Reports',
    officials: 'Barangay Officials'
}[currentView.value]));

const normalizeText = (text) => (text || '').toLowerCase().replace(/\\s+/g, ' ').trim();

const currentList = computed(() => {
    switch (currentView.value) {
        case 'residents':
            return residents.value.filter(r => !residentSearch.value || normalizeText(\\ \ \\).includes(normalizeText(residentSearch.value)));
        case 'documents': return documentRequests.value.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'appointments': return appointments.value.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
        case 'reservations': return reservations.value.sort((a,b) => new Date(b.reservationDate) - new Date(a.reservationDate));
        case 'reports': return reports.value.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'officials': return officials.value;
        default: return [];
    }
});

const calculateAge = (birthDateString) => {
    if(!birthDateString) return '?';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

const openModal = (type, item) => {
    selectedItem.value = { ...item };
    
    if (type === 'resident') {
        editForm.status = item.userId?.accountStatus || 'pending_approval';
    } else if (['document', 'appointment', 'reservation', 'report'].includes(type)) {
        editForm.status = item.status;
        editForm.adminNotes = item.adminNotes || '';
    } else if (type === 'official') {
        Object.assign(editForm, item);
        if(editForm.officeDays && Array.isArray(editForm.officeDays)) {
            editForm.officeDays = editForm.officeDays.join(', ');
        }
    }
    
    activeModal.value = type;
};

const msg = (txt, err=false) => { dashboardStatus.value = txt; dashboardError.value = err; };

const saveResidentStatus = async () => {
    try {
        await apiFetch(\/residents/\/status\, {
            method: 'PATCH',
            body: JSON.stringify({ status: editForm.status })
        });
        await loadAll();
        activeModal.value = null;
        msg('Resident status updated.');
    } catch (error) {
        msg(error.message, true);
    }
};

const saveGenericStatus = async () => {
    const pathMap = {
        document: '/document-requests',
        appointment: '/appointments',
        reservation: '/facility-reservations',
        report: '/reports'
    };
    try {
        await apiFetch(\\/\/status\, {
            method: 'PATCH',
            body: JSON.stringify({ status: editForm.status, adminNotes: editForm.adminNotes })
        });
        await loadAll();
        activeModal.value = null;
        msg('Status updated and notification sent.');
    } catch (error) {
        msg(error.message, true);
    }
};

const saveOfficial = async () => {
    try {
        const p = { ...editForm, officeDays: editForm.officeDays ? editForm.officeDays.split(',').map(d=>d.trim()) : [] };
        if (p._id) {
            await apiFetch(\/officials/\\, { method: 'PUT', body: JSON.stringify(p) });
            msg('Official updated.');
        } else {
            await apiFetch('/officials', { method: 'POST', body: JSON.stringify(p) });
            msg('Official created.');
        }
        await loadAll();
        activeModal.value = null;
    } catch(e) {
        msg(e.message, true);
    }
};

const loginAdmin = async () => {
    try {
        const response = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
        if (response.user.role !== 'admin') {
            clearAuth();
            loginStatus.value = 'This entry page is for admin accounts only.';
            loginError.value = true;
            return;
        }
        setAuth(response.token, response.user);
        user.value = response.user;
        isAuthenticated.value = true;
        await loadAll();
        msg('Welcome to the admin portal.');
    } catch (error) {
        loginStatus.value = error.message;
        loginError.value = true;
    }
};

const loadAll = async () => {
    try {
        [officials.value, residents.value, appointments.value, documentRequests.value, reservations.value, reports.value] = await Promise.all([
            apiFetch('/officials'),
            apiFetch('/residents'),
            apiFetch('/appointments'),
            apiFetch('/document-requests'),
            apiFetch('/facility-reservations'),
            apiFetch('/reports')
        ]);
        msg('Data refreshed.', false);
    } catch (error) {
        msg('Failed to resync data.', true);
    }
};

const logout = () => {
    clearAuth();
    isAuthenticated.value = false;
    loginStatus.value = '';
};

const initSession = async () => {
    const auth = getAuth();
    if (!auth.token) return;
    try {
        const me = await apiFetch('/auth/me');
        if (me.role === 'admin') {
            user.value = me;
            isAuthenticated.value = true;
            await loadAll();
        } else {
            clearAuth();
        }
    } catch {
        clearAuth();
    }
};

onMounted(initSession);
</script>\;
fs.writeFileSync('frontend/src/pages/AdminApp.vue', template + '\n' + script);
