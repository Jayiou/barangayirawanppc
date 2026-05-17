<template>
    <div v-if="initializing" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; flex-direction: column;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #2c3e50; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #5e6f66; font-size: 0.9rem;">Initializing portal...</p>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    </div>
    <div class="page-shell app-shell" v-else>
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button class="sidebar-close-btn" @click="sidebarOpen = false"><i class="fa-solid fa-xmark"></i></button>

            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <BrandMark initials="BC" eyebrow="Resident Portal" title="Barangay Connect" />
            </div>

            <!-- Sidebar Navigation -->
            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'profile' }" type="button" @click="currentView = 'profile'"><i class="fa-solid fa-user"></i> My Profile</button>
                <button :class="{ active: currentView === 'appointments' }" type="button" @click="currentView = 'appointments'"><i class="fa-solid fa-calendar-check"></i> Appointments</button>
                <button :class="{ active: currentView === 'documents' }" type="button" @click="currentView = 'documents'"><i class="fa-solid fa-file-signature"></i> Document Requests</button>
                <button :class="{ active: currentView === 'reservations' }" type="button" @click="currentView = 'reservations'"><i class="fa-solid fa-building"></i> Facility Reservations</button>
                <button :class="{ active: currentView === 'reports' }" type="button" @click="currentView = 'reports'"><i class="fa-solid fa-flag"></i> Reports</button>
            </nav>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <span class="footer-eyebrow">Logged In As</span>
                <div class="user-info" v-if="user">
                    <strong class="user-name">{{ user.username }}</strong>
                    <div class="user-email">{{ user.email }}</div>
                </div>
                <div v-else class="fine-print">Checking session...</div>
                <button type="button" class="logout-btn" @click="confirmLogout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
            </div>
        </aside>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
            </header>
            <section class="hero-banner">
                <div>
                    <span class="eyebrow">Resident Workspace</span>
                    <h2>{{ viewTitle }}</h2>
                </div>
            </section>
            
            <ToastPopup :message="statusMessage" :type="statusError ? 'error' : 'success'" @close="setStatus('', false)" />

            <!-- My Profile View -->
            <section class="app-view" :class="{ active: currentView === 'profile' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head">
                            <span class="eyebrow">My Profile</span>
                            <h3>Resident profile details</h3>
                        </div>
                        <form class="stack" @submit.prevent="saveProfile">
                            <div class="form-grid">
                                <label><span>First name</span><input v-model="profile.firstName" type="text" required></label>
                                <label><span>Last name</span><input v-model="profile.lastName" type="text" required></label>
                                <label><span>Middle name</span><input v-model="profile.middleName" type="text"></label>
                                <label><span>Suffix</span><input v-model="profile.suffix" type="text"></label>
                                <label>
                                    <span>Sex</span>
                                    <select v-model="profile.sex" required>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>
                                <label><span>Birth date</span><input v-model="profile.birthDate" type="date" required></label>
                                <label>
                                    <span>Civil status</span>
                                    <select v-model="profile.civilStatus">
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="widowed">Widowed</option>
                                        <option value="separated">Separated</option>
                                    </select>
                                </label>
                                <label><span>Contact number</span><input v-model="profile.contactNumber" type="text"></label>
                                <label><span>Email</span><input v-model="profile.email" type="email"></label>
                                <label><span>Address</span><input v-model="profile.address" type="text" required></label>
                                <label><span>Purok</span><input v-model="profile.purok" type="text"></label>
                                <label><span>Citizenship</span><input v-model="profile.citizenship" type="text"></label>
                                <label><span>Occupation</span><input v-model="profile.occupation" type="text"></label>
                                <label>
                                    <span>Voter status</span>
                                    <select v-model="profile.voterStatus">
                                        <option value="registered">Registered</option>
                                        <option value="not_registered">Not registered</option>
                                    </select>
                                </label>
                                <label><span>Profile image URL</span><input v-model="profile.profileImage" type="url"></label>
                            </div>
                            <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Saving...' : 'Save Resident Profile' }}</button>
                        </form>
                    </article>
                </div>
            </section>

            <!-- Appointments View -->
            <section class="app-view" :class="{ active: currentView === 'appointments' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="eyebrow">Appointments</span>
                                <h3>My appointments</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'appointment'">Request Appointment</button>
                        </div>
                        <div v-if="!appointmentItems.length" style="padding: 20px; text-align: center; color: #999;">No appointments found.</div>
                        <div v-else style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="item in appointmentItems" :key="item._id" style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; margin-bottom: 4px;">{{ item.title }}</div>
                                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">{{ item.meta }}</div>
                                    <div><StatusBadge :status="item.status" /></div>
                                </div>
                                <button class="primary-button" @click="viewingAppointment = item.fullItem" style="margin-left: 12px; white-space: nowrap;">View Details</button>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Document Requests View -->
            <section class="app-view" :class="{ active: currentView === 'documents' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <span class="eyebrow">Document Requests</span>
                                <h3>My requested documents</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'document'">Request Document</button>
                        </div>
                        
                        <div class="table-responsive" style="border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 15px;">
                            <table class="data-table" style="margin-top: 0;">
                                <thead>
                                    <tr>
                                        <th>Date Requested</th>
                                        <th>Document Type</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="documentRequests.length === 0">
                                        <td colspan="4" style="text-align: center; padding: 20px;">No document requests found.</td>
                                    </tr>
                                    <tr v-for="doc in paginatedDocumentRequests" :key="doc._id" class="hoverable">
                                        <td>{{ formatDate(doc.createdAt) }}</td>
                                        <td style="text-transform: capitalize;">{{ doc.documentType.replace(/_/g, ' ') }}</td>
                                        <td>{{ doc.purpose }}</td>
                                        <td><StatusBadge :status="doc.status" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div v-if="docTotalPages > 1" style="display: flex; gap: 8px; justify-content: center; align-items: center; padding: 15px; background: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                            <button 
                                @click="docCurrentPage > 1 && (docCurrentPage -= 1)" 
                                :disabled="docCurrentPage === 1"
                                style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; font-size: 0.9rem;"
                                :style="{ opacity: docCurrentPage === 1 ? 0.5 : 1, cursor: docCurrentPage === 1 ? 'not-allowed' : 'pointer' }"
                            >
                                ← Previous
                            </button>
                            <span style="font-size: 0.9rem; color: #666; min-width: 120px; text-align: center;">
                                Page {{ docCurrentPage }} of {{ docTotalPages }}
                            </span>
                            <button 
                                @click="docCurrentPage < docTotalPages && (docCurrentPage += 1)" 
                                :disabled="docCurrentPage === docTotalPages"
                                style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; font-size: 0.9rem;"
                                :style="{ opacity: docCurrentPage === docTotalPages ? 0.5 : 1, cursor: docCurrentPage === docTotalPages ? 'not-allowed' : 'pointer' }"
                            >
                                Next →
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Facility Reservations View -->
            <section class="app-view" :class="{ active: currentView === 'reservations' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="eyebrow">Facility Reservations</span>
                                <h3>My reservations</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'reservation'">Reserve Facility</button>
                        </div>
                        <RecordList :items="reservationItems" />
                    </article>
                </div>
            </section>

            <!-- Reports View -->
            <section class="app-view" :class="{ active: currentView === 'reports' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="eyebrow">Reports</span>
                                <h3>My submitted reports</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'report'">Submit New Report</button>
                        </div>
                        <RecordList :items="reportItems" />
                    </article>
                </div>
            </section>

        </main>

        <!-- Modals -->
        <div class="landing-modal-backdrop" v-if="activeModal" @click.self="closeModal">
            <dialog class="landing-modal" open>
                <button class="landing-modal-close" @click="closeModal">X</button>
                
                <div v-if="activeModal === 'appointment'">
                    <h2>Request Appointment</h2>
                    <p class="fine-print">Schedule a meeting with a barangay official.</p>
                    <form class="stack" @submit.prevent="handleSubmitAppointment">
                        <label><span>Official</span>
                            <select v-model="appointmentForm.officialId" required @change="loadAvailableSlots">
                                <option disabled value="">Select Official</option>
                                <option v-for="official in officials" :key="official._id" :value="official._id">{{ official.name }} - {{ official.position }}</option>
                            </select>
                        </label>
                        <label><span>Date</span><input v-model="appointmentForm.appointmentDate" type="date" :min="new Date().toLocaleDateString('en-CA')" required @change="loadAvailableSlots"></label>
                        
                        <div v-if="appointmentForm.officialId && appointmentForm.appointmentDate">
                            <span>Available Time Slots</span>
                            <div v-if="isFetchingSlots" style="margin-top: 5px; font-size: 0.9em; color: #666;">Loading slots...</div>
                            <div v-else-if="availableSlots.length === 0" style="margin-top: 5px; font-size: 0.9em; color: #d32f2f;">No available slots for this date.</div>
                            <div v-else style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                                <button type="button" 
                                    v-for="(slot, idx) in availableSlots" :key="idx"
                                    @click="slot.isAvailable ? selectSlot(slot) : null"
                                    :disabled="!slot.isAvailable"
                                    :style="{
                                        padding: '8px 12px',
                                        border: '1px solid #2c3e50',
                                        borderRadius: '6px',
                                        background: !slot.isAvailable ? '#f5f5f5' : (appointmentForm.startTime === slot.startTime ? '#2c3e50' : 'transparent'),
                                        color: !slot.isAvailable ? '#aaa' : (appointmentForm.startTime === slot.startTime ? '#fff' : '#2c3e50'),
                                        cursor: !slot.isAvailable ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }"
                                >
                                    <span>{{ slot.label }}</span>
                                    <span v-if="!slot.isAvailable" style="font-size: 0.75em; color: #d32f2f;">({{ slot.reason || 'Unavailable' }})</span>
                                </button>
                            </div>
                        </div>

                        <label><span>Purpose</span><input v-model="appointmentForm.purpose" type="text" required placeholder="What is this meeting about?"></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting || !appointmentForm.startTime">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button>
                    </form>
                </div>

                <div v-if="activeModal === 'document'">
                    <h2>Request Document</h2>
                    <p class="fine-print">Fill up the details for the document you need.</p>
                    <form class="stack" @submit.prevent="handleSubmitDocument">
                        <label><span>Document type</span><select v-model="documentForm.documentType" required><option value="barangay_clearance">Barangay Clearance</option><option value="certificate_of_residency">Certificate of Residency</option><option value="certificate_of_indigency">Certificate of Indigency</option></select></label>
                        <label><span>Purpose</span><input v-model="documentForm.purpose" type="text" required></label>
                        <label><span>Request details</span><textarea v-model="documentForm.requestDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button>
                    </form>
                </div>

                <div v-if="activeModal === 'reservation'">
                    <h2>Reserve Facility</h2>
                    <p class="fine-print">Book a barangay facility for your event.</p>
                    <form class="stack" @submit.prevent="handleSubmitReservation">
                        <label><span>Facility</span><select v-model="reservationForm.facilityName" required @change="loadFacilityAvailability"><option value="barangay_hall">Barangay Hall</option><option value="covered_court">Covered Court</option><option value="multi_purpose_hall">Multi Purpose Hall</option></select></label>
                        <label><span>Date</span><input v-model="reservationForm.reservationDate" type="date" :min="new Date().toLocaleDateString('en-CA')" required @change="loadFacilityAvailability"></label>
                        <label><span>Start time</span><input v-model="reservationForm.startTime" type="time" required></label>
                        <label><span>End time</span><input v-model="reservationForm.endTime" type="time" required></label>
                        <label><span>Purpose</span><input v-model="reservationForm.purpose" type="text" required></label>
                        <label><span>Reservation details</span><textarea v-model="reservationForm.reservationDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Reservation' }}</button>
                    </form>
                    <div style="margin-top: 15px; padding: 10px; background: rgba(58,78,67,0.05); color: #3a4e43; border-radius: 6px; font-size: 0.85rem; font-weight: 500;" v-if="facilityAvailability">{{ facilityAvailability }}</div>
                </div>

                <div v-if="activeModal === 'report'">
                    <h2>Submit Report</h2>
                    <p class="fine-print">Report an incident or concern in the barangay.</p>
                    <form class="stack" @submit.prevent="handleSubmitReport">
                        <label>
                            <span>Report type</span>
                            <select v-model="reportForm.reportType" required>
                                <option v-for="option in reportTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                        </label>
                        <label><span>Description</span><textarea v-model="reportForm.description" rows="3" required :placeholder="currentReportTypeConfig.descriptionPlaceholder"></textarea></label>
                        <label><span>Location</span><input v-model="reportForm.locationText" type="text" required :placeholder="currentReportTypeConfig.locationHint"></label>
                        <label v-if="currentReportTypeConfig.requireIncidentDate"><span>Incident date</span><input v-model="reportForm.incidentDate" type="date" required></label>
                        <div style="display: grid; gap: 8px; padding: 12px; border: 1px dashed #c7d1cc; border-radius: 8px;">
                            <span style="font-weight: 600; color: #3a4e43;">Current location (optional but recommended)</span>
                            <button type="button" class="ghost-button" @click="captureCurrentLocation" :disabled="locatingPosition">
                                {{ locatingPosition ? 'Getting location...' : 'Use My Current Location' }}
                            </button>
                            <small style="color: #6b7f74; line-height: 1.5; background: rgba(58, 78, 67, 0.05); padding: 8px; border-radius: 4px;">
                                <strong style="color: #3a4e43;">How it works:</strong><br>
                                1️⃣ Click the button above<br>
                                2️⃣ A popup will appear asking for permission<br>
                                3️⃣ Tap <strong>Allow</strong><br>
                                💡 Safari tip: if no popup appears, go to iPhone Settings → Privacy & Security → Location Services → Safari Websites → <strong>While Using the App</strong>.
                            </small>
                            <small v-if="hasCapturedCoordinates" style="color: #4f6b5d;">Pinned: {{ reportForm.locationLatitude }}, {{ reportForm.locationLongitude }} (±{{ reportForm.locationAccuracy || 'N/A' }}m)</small>
                            <iframe
                                v-if="reportMapEmbedUrl"
                                :src="reportMapEmbedUrl"
                                title="Report location preview map"
                                style="width: 100%; height: 180px; border: 1px solid #dce6e1; border-radius: 8px;"
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                        <label v-if="currentReportTypeConfig.requireProof">
                            <span>{{ currentReportTypeConfig.proofLabel }}</span>
                            <input type="file" accept="image/jpeg,image/png,image/jpg" multiple @change="handleReportProofFiles" required>
                        </label>
                        <small v-if="reportProofFiles.length" style="color: #4f6b5d;">{{ reportProofFiles.length }} file(s) selected</small>
                        <label><span>Priority</span><select v-model="reportForm.priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option></select></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Report' }}</button>
                    </form>
                </div>
            </dialog>
        </div>

        <!-- Appointment Details Modal -->
        <div class="landing-modal-backdrop" v-if="viewingAppointment" @click.self="viewingAppointment = null">
            <dialog class="landing-modal" open>
                <button class="landing-modal-close" @click="viewingAppointment = null">X</button>
                <h2>Appointment Details</h2>
                <div style="display: grid; gap: 12px; margin-top: 15px;">
                    <div>
                        <span style="font-weight: 600; color: #555;">Official:</span>
                        <p style="margin: 0; color: #333;">{{ viewingAppointment.officialId?.name }} - {{ viewingAppointment.officialId?.position }}</p>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: #555;">Date:</span>
                        <p style="margin: 0; color: #333;">{{ formatDate(viewingAppointment.appointmentDate) }}</p>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: #555;">Time:</span>
                        <p style="margin: 0; color: #333;">{{ viewingAppointment.timeSlot?.startTime }} - {{ viewingAppointment.timeSlot?.endTime }}</p>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: #555;">Purpose:</span>
                        <p style="margin: 0; color: #333;">{{ viewingAppointment.purpose }}</p>
                    </div>
                    <div>
                        <span style="font-weight: 600; color: #555;">Status:</span>
                        <div style="margin-top: 4px;"><StatusBadge :status="viewingAppointment.status" /></div>
                    </div>
                    <div v-if="viewingAppointment.status === 'rejected' && viewingAppointment.rejectionReason">
                        <span style="font-weight: 600; color: #d32f2f;">Rejection Reason:</span>
                        <p style="margin: 0; color: #333; padding: 10px; background: rgba(211,47,47,0.05); border-radius: 4px;">{{ viewingAppointment.rejectionReason }}</p>
                    </div>
                    <div v-if="viewingAppointment.status === 'cancelled' && viewingAppointment.cancellationReason">
                        <span style="font-weight: 600; color: #ff9800;">Cancellation Reason:</span>
                        <p style="margin: 0; color: #333; padding: 10px; background: rgba(255,152,0,0.05); border-radius: 4px;">{{ viewingAppointment.cancellationReason }}</p>
                    </div>
                    <div v-if="viewingAppointment.remarks">
                        <span style="font-weight: 600; color: #555;">Admin Notes:</span>
                        <p style="margin: 0; color: #333; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 4px;">{{ viewingAppointment.remarks }}</p>
                    </div>
                    <div v-if="viewingAppointment.approvedAt">
                        <span style="font-weight: 600; color: #555;">Approved:</span>
                        <p style="margin: 0; color: #333;">{{ formatDate(viewingAppointment.approvedAt) }}</p>
                    </div>
                    <div v-if="viewingAppointment.completedAt">
                        <span style="font-weight: 600; color: #555;">Completed:</span>
                        <p style="margin: 0; color: #333;">{{ formatDate(viewingAppointment.completedAt) }}</p>
                    </div>
                </div>
                <button class="primary-button" @click="viewingAppointment = null" style="margin-top: 20px; width: 100%;">Close</button>
            </dialog>
        </div>
    </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import RecordList from '@/components/RecordList.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { formatDate } from '@/shared/client';
import { REPORT_TYPE_CONFIG, REPORT_TYPE_OPTIONS } from '@/shared/reportTypeConfig';
import { usePortalAuth } from '@/composables/usePortalAuth';
import { usePortalData } from '@/composables/usePortalData';
import { usePortalForms } from '@/composables/usePortalForms';
import { useAppointments } from '@/composables/useAppointments';

// Composables
const { user, initializing, ensureResident, logout } = usePortalAuth();

const confirmLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
};
const { statusMessage, statusError, documentRequests, reservations, reports, appointments, officials, facilityAvailability, profile, setStatus, loadAll, saveProfile, loadFacilityAvailability } = usePortalData();
const { documentForm, reservationForm, reportForm, reportProofFiles, submitDocumentRequest, submitReservation, submitReport } = usePortalForms();
const { getAvailableSlots, requestAppointment } = useAppointments();
// Local state
const sidebarOpen = ref(false);
const currentView = ref(localStorage.getItem('portal_current_view') || 'profile');
const activeModal = ref(null);
const docCurrentPage = ref(1);
const itemsPerPage = 5;
const isSubmitting = ref(false);

const appointmentForm = ref({
    officialId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    purpose: ''
});
const availableSlots = ref([]);
const isFetchingSlots = ref(false);
const viewingAppointment = ref(null);
const locatingPosition = ref(false);

const loadAvailableSlots = async () => {
    if (!appointmentForm.value.officialId || !appointmentForm.value.appointmentDate) {
        availableSlots.value = [];
        return;
    }
    isFetchingSlots.value = true;
    appointmentForm.value.startTime = '';
    appointmentForm.value.endTime = '';
    try {
        availableSlots.value = await getAvailableSlots(appointmentForm.value.officialId, appointmentForm.value.appointmentDate);
    } catch(err) {
        console.error(err);
        availableSlots.value = [];
    } finally {
        isFetchingSlots.value = false;
    }
};

const selectSlot = (slot) => {
    appointmentForm.value.startTime = slot.startTime;
    appointmentForm.value.endTime = slot.endTime;
};

const handleSubmitAppointment = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        await requestAppointment(appointmentForm.value);
        setStatus("Appointment requested successfully!");
        closeModal();
        loadAll(); // reload data
        appointmentForm.value = { officialId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '' };
        availableSlots.value = [];
    } catch(err) {
        setStatus(err.message, true);
    } finally {
        isSubmitting.value = false;
    }
};
// Persist view state on change
watch(currentView, (newView) => {
    localStorage.setItem('portal_current_view', newView);
});

// Computed properties
const viewTitle = computed(() => ({
    profile: 'Manage your personal information',
    documents: 'Request and track barangay documents',
    reservations: 'Reserve facilities for events',
    reports: 'Submit and monitor your reports',
    appointments: 'Schedule meetings with barangay officials'
}[currentView.value]));

const documentItems = computed(() => documentRequests.value.map((item) => ({
    id: item._id,
    title: item.documentType,
    status: item.status,
    meta: item.purpose
})));

const appointmentItems = computed(() => appointments.value.map((item) => {
    const title = item.officialId && item.officialId.name ? `${item.officialId.position} - ${item.purpose}` : 'Appointment';
    const tStart = item.timeSlot?.startTime || 'TBD';
    const tEnd = item.timeSlot?.endTime || 'TBD';
    return {
        _id: item._id,
        id: item._id,
        title,
        status: item.status,
        meta: `${formatDate(item.appointmentDate)} | ${tStart}-${tEnd}`,
        fullItem: item
    };
}));

const reservationItems = computed(() => reservations.value.map((item) => ({
    id: item._id,
    title: item.facilityName,
    status: item.status,
    meta: formatDate(item.reservationDate) + ' | ' + item.startTime + '-' + item.endTime + ' | ' + item.purpose
})));

const reportItems = computed(() => reports.value.map((item) => ({
    id: item._id,
    title: item.title,
    status: item.status,
    meta: item.reportType + ' | ' + item.priority + ' | ' + item.locationText
})));

const reportTypeOptions = REPORT_TYPE_OPTIONS;

const currentReportTypeConfig = computed(() => {
    return REPORT_TYPE_CONFIG[reportForm.reportType] || REPORT_TYPE_CONFIG.other;
});

const paginatedDocumentRequests = computed(() => {
    const start = (docCurrentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return documentRequests.value.slice(start, end);
});

const docTotalPages = computed(() => {
    return Math.ceil(documentRequests.value.length / itemsPerPage) || 1;
});

const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) {
        return 'No time set';
    }

    const formatTime = (value) => {
        const [hours, minutes] = String(value).split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes || 0, 0, 0);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Modal handlers
const openModal = (type) => {
    activeModal.value = type;
};

const closeModal = () => {
    activeModal.value = null;
    docCurrentPage.value = 1;
};

const hasCapturedCoordinates = computed(() => {
    return Boolean(reportForm.locationLatitude && reportForm.locationLongitude);
});

const reportMapEmbedUrl = computed(() => {
    if (!hasCapturedCoordinates.value) {
        return '';
    }

    return `https://maps.google.com/maps?q=${reportForm.locationLatitude},${reportForm.locationLongitude}&z=16&output=embed`;
});

const handleReportProofFiles = (event) => {
    const incoming = Array.from(event.target.files || []);
    reportProofFiles.value = incoming.slice(0, 5);
};

const captureCurrentLocation = async () => {
    if (!navigator.geolocation) {
        setStatus('Geolocation is not supported on this device/browser.', true);
        return;
    }

    const userAgent = navigator.userAgent || '';
    const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|FxiOS|Android/i.test(userAgent);

    // Check if HTTPS is used (required for geolocation on production)
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        setStatus('Geolocation requires a secure connection (HTTPS). Please ensure you\'re using HTTPS on this site.', true);
        return;
    }

    const requestLocation = () => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 5000
        });
    });

    const readPermissionState = async () => {
        try {
            if (!navigator.permissions?.query) {
                return 'unknown';
            }

            const permission = await navigator.permissions.query({ name: 'geolocation' });
            return permission.state;
        } catch {
            return 'unknown';
        }
    };

    locatingPosition.value = true;

    try {
        const permissionState = await readPermissionState();

        if (permissionState === 'denied') {
            if (isSafari) {
                setStatus('🔒 Safari location access is blocked for this site. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using the App. Then open this site in Safari again and tap "Use My Current Location".', true);
            } else {
                setStatus('🔒 Location access is blocked in this browser. Go to your browser settings → Permissions → Location, and allow access for this site. Then come back and try again.', true);
            }
            return;
        }

        // Calling geolocation here triggers the browser permission popup when needed.
        const position = await requestLocation();

        reportForm.locationLatitude = String(position.coords.latitude.toFixed(6));
        reportForm.locationLongitude = String(position.coords.longitude.toFixed(6));
        reportForm.locationAccuracy = String(Math.round(position.coords.accuracy || 0));
        setStatus('Current location captured.');
    } catch (error) {
        // If GPS/high accuracy fails, try a network-based fallback.
        if (error?.code !== 1) {
            try {
                const fallbackPosition = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });

                reportForm.locationLatitude = String(fallbackPosition.coords.latitude.toFixed(6));
                reportForm.locationLongitude = String(fallbackPosition.coords.longitude.toFixed(6));
                reportForm.locationAccuracy = String(Math.round(fallbackPosition.coords.accuracy || 0));
                setStatus('Location captured (lower accuracy mode).');
                return;
            } catch (fallbackError) {
                error = fallbackError;
            }
        }

        // Provide helpful error messages based on error code
        let errorMsg = 'Unable to capture your location.';
        if (error?.code === 1) {
            if (isSafari) {
                errorMsg = '❌ Permission Denied on Safari: If no popup appears, Safari may already be blocked for this site. Open iPhone Settings → Privacy & Security → Location Services → Safari Websites, set to "While Using the App", then reload this page and tap "Use My Current Location" again.';
            } else {
                errorMsg = '❌ Permission Denied: When you clicked the button, you might have tapped "Block" instead of "Allow". Try again and tap Allow when the popup appears. OR check your browser settings to allow location access for this site.';
            }
        } else if (error?.code === 2) {
            errorMsg = isSafari
                ? '⚠️ Safari could not get your location. Make sure iPhone Location Services is ON and Safari Websites is set to "While Using the App", then try again.'
                : '⚠️ Location Not Available: Make sure Location Services/GPS is ON in your phone settings, and you have a good network signal. Then try again.';
        } else if (error?.code === 3) {
            errorMsg = '⏱️ Timeout: Getting your location is taking too long. Check that Location Services is ON and your network is working, then try again.';
        } else if (error?.message) {
            errorMsg = error.message;
        }
        setStatus(errorMsg, true);
    } finally {
        locatingPosition.value = false;
    }
};

const handleSaveProfile = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        await saveProfile();
        closeModal();
    } finally {
        isSubmitting.value = false;
    }
};

const handleSubmitDocument = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const result = await submitDocumentRequest(() => loadAll());
        if (result.success) {
            setStatus(result.message);
            closeModal();
        } else {
            setStatus(result.message, true);
        }
    } finally {
        isSubmitting.value = false;
    }
};

const handleSubmitReservation = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const result = await submitReservation(() => loadAll(), loadFacilityAvailability);
        if (result.success) {
            setStatus(result.message);
            closeModal();
        } else {
            setStatus(result.message, true);
        }
    } finally {
        isSubmitting.value = false;
    }
};

const handleSubmitReport = async () => {
    if (isSubmitting.value) return;

    if (currentReportTypeConfig.value.requireProof && reportProofFiles.value.length === 0) {
        setStatus('Please upload at least one proof image for this report type.', true);
        return;
    }

    if (currentReportTypeConfig.value.requireIncidentDate && !reportForm.incidentDate) {
        setStatus('Incident date is required for this report type.', true);
        return;
    }

    isSubmitting.value = true;
    try {
        const result = await submitReport(() => loadAll());
        if (result.success) {
            setStatus(result.message);
            closeModal();
        } else {
            setStatus(result.message, true);
        }
    } finally {
        isSubmitting.value = false;
    }
};

const handleLoadFacilityAvailability = async () => {
    await loadFacilityAvailability(reservationForm.facilityName, reservationForm.reservationDate);
};

onMounted(async () => {
    const allowed = await ensureResident();
    if (!allowed) return;
    await loadAll();
});

onUnmounted(() => {});
</script>
