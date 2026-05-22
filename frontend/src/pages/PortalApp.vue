<template>
    <div v-if="initializing" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; flex-direction: column;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #2c3e50; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #5e6f66; font-size: 0.9rem;">Initializing portal...</p>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    </div>
    <div class="page-shell app-shell resident-shell" :class="{ 'sidebar-expanded': sidebarOpen }" v-else>
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button
                class="resident-sidebar-toggle"
                type="button"
                :aria-label="sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
                @click="sidebarOpen = !sidebarOpen"
            >
                <i class="fa-solid fa-bars"></i>
            </button>

            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <BrandMark initials="BC" eyebrow="Resident Portal" title="Barangay Connect" />
            </div>

            <!-- Sidebar Navigation -->
            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'profile' }" type="button" title="My Profile" aria-label="My Profile" @click="setResidentView('profile')"><i class="fa-solid fa-user"></i><span class="nav-label">My Profile</span></button>
                <button :class="{ active: currentView === 'appointments' }" type="button" title="Appointments" aria-label="Appointments" @click="setResidentView('appointments')"><i class="fa-solid fa-calendar-check"></i><span class="nav-label">Appointments</span></button>
                
                <button :class="{ active: currentView === 'documents' }" type="button" title="Documents" aria-label="Documents" @click="setResidentView('documents')"><i class="fa-solid fa-file"></i><span class="nav-label">Documents</span></button>
                <button :class="{ active: currentView === 'reservations' }" type="button" title="Facility Reservations" aria-label="Facility Reservations" @click="setResidentView('reservations')"><i class="fa-solid fa-building"></i><span class="nav-label">Facility Reservations</span></button>
                <button :class="{ active: currentView === 'reports' }" type="button" title="Reports" aria-label="Reports" @click="setResidentView('reports')"><i class="fa-solid fa-flag"></i><span class="nav-label">Reports</span></button>
                <button :class="{ active: currentView === 'disaster' }" type="button" title="Disaster Advisories" aria-label="Disaster Advisories" @click="setResidentView('disaster')"><i class="fa-solid fa-house-flood-water"></i><span class="nav-label">Disaster Advisories</span></button>
            </nav>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <span class="footer-eyebrow">Logged In As</span>
                <div class="user-info" v-if="user">
                    <strong class="user-name">{{ user.username }}</strong>
                    <div class="user-email">{{ user.email }}</div>
                </div>
                <div v-else class="fine-print">Checking session...</div>
                <button type="button" class="logout-btn" title="Log Out" @click="confirmLogout"><i class="fa-solid fa-right-from-bracket"></i><span class="nav-label">Log Out</span></button>
            </div>
        </aside>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = !sidebarOpen"><i class="fa-solid fa-bars"></i></button>
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
                                    <span>Senior Citizen</span>
                                    <select v-model="profile.isSeniorCitizen">
                                        <option :value="false">No</option>
                                        <option :value="true">Yes</option>
                                    </select>
                                </label>
                                <label>
                                    <span>PWD</span>
                                    <select v-model="profile.isPWD">
                                        <option :value="false">No</option>
                                        <option :value="true">Yes</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Vulnerability Type</span>
                                    <select v-model="profile.vulnerabilityType">
                                        <option value="">None</option>
                                        <option value="senior">Senior</option>
                                        <option value="pwd">PWD</option>
                                        <option value="both">Senior + PWD</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Verification Pending</span>
                                    <select v-model="profile.verificationPending">
                                        <option :value="false">No</option>
                                        <option :value="true">Yes</option>
                                    </select>
                                </label>
                                <label><span>Vulnerability Proof Path</span><input v-model="profile.vulnerabilityProofPath" type="text"></label>
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
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">Appointments</span>
                                <h3>My appointments</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'appointment'">Request Appointment</button>
                        </div>
                        <input class="portal-search-input" v-model="appointmentSearch" type="search" placeholder="Search appointments">
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead>
                                    <tr><th>Date</th><th>Official</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!filteredAppointments.length"><td colspan="5" class="portal-empty-cell">No appointments found.</td></tr>
                                    <tr v-for="item in filteredAppointments" :key="item._id">
                                        <td>{{ formatDate(item.appointmentDate) }}<br><small>{{ item.timeSlot?.startTime || 'TBD' }}-{{ item.timeSlot?.endTime || 'TBD' }}</small></td>
                                        <td>{{ item.officialId?.name || 'TBD' }}<br><small>{{ item.officialId?.position || 'Official' }}</small></td>
                                        <td>{{ item.purpose }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                            <button class="ghost-button table-action" @click="openRecordDetail('appointment', item)">View</button>
                                            <button v-if="canCancelAppointment(item)" class="ghost-button table-action danger" @click="cancelResidentAppointment(item)">Cancel</button>
                                            <button v-if="canDeleteRecord('appointment', item)" class="ghost-button table-action danger" @click="deleteResidentRecord('appointment', item)">Delete</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Document Requests view removed -->
            <section class="app-view" :class="{ active: currentView === 'documents' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">Document Requests</span>
                                <h3>Request official barangay documents</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'document'">Request Document</button>
                        </div>
                        <input class="portal-search-input" v-model="documentSearch" type="search" placeholder="Search requests">
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead>
                                    <tr><th>Date</th><th>Type</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!filteredDocumentRequests.length"><td colspan="5" class="portal-empty-cell">No document requests yet.</td></tr>
                                    <tr v-for="item in filteredDocumentRequests" :key="item._id">
                                        <td>{{ formatDate(item.createdAt) }}</td>
                                        <td>{{ normalizeLabel(item.type) }}</td>
                                        <td>{{ item.purpose || item.fields?.PURPOSE || '-' }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                            <button class="ghost-button table-action" @click="openRecordDetail('document', item)">View</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Facility Reservations View -->
            <section class="app-view" :class="{ active: currentView === 'reservations' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">Facility Reservations</span>
                                <h3>My reservations</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'reservation'">Reserve Facility</button>
                        </div>
                        <input class="portal-search-input" v-model="reservationSearch" type="search" placeholder="Search reservations">
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead><tr><th>Date</th><th>Facility</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-if="!filteredReservations.length"><td colspan="5" class="portal-empty-cell">No reservations found.</td></tr>
                                    <tr v-for="item in filteredReservations" :key="item._id">
                                        <td>{{ formatDate(item.reservationDate) }}<br><small>{{ item.startTime }}-{{ item.endTime }}</small></td>
                                        <td>{{ normalizeLabel(item.facilityName) }}</td>
                                        <td>{{ item.purpose }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                            <button class="ghost-button table-action" @click="openRecordDetail('reservation', item)">View</button>
                                            <button v-if="canDeleteRecord('reservation', item)" class="ghost-button table-action danger" @click="deleteResidentRecord('reservation', item)">Delete</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Reports View -->
            <section class="app-view" :class="{ active: currentView === 'reports' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">Reports</span>
                                <h3>My submitted reports</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'report'">Submit New Report</button>
                        </div>
                        <input class="portal-search-input" v-model="reportSearch" type="search" placeholder="Search reports">
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead><tr><th>Date</th><th>Report</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-if="!filteredReports.length"><td colspan="5" class="portal-empty-cell">No reports found.</td></tr>
                                    <tr v-for="item in filteredReports" :key="item._id">
                                        <td>{{ formatDate(item.createdAt) }}</td>
                                        <td>{{ item.title }}<br><small>{{ normalizeLabel(item.reportType) }} | {{ normalizeLabel(item.priority) }}</small></td>
                                        <td>{{ item.locationText }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                            <button class="ghost-button table-action" @click="openRecordDetail('report', item)">View</button>
                                            <button v-if="canDeleteRecord('report', item)" class="ghost-button table-action danger" @click="deleteResidentRecord('report', item)">Delete</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <section class="app-view" :class="{ active: currentView === 'disaster' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head">
                            <span class="eyebrow">Disaster Advisories</span>
                            <h3>Latest barangay emergency guidance</h3>
                        </div>
                        <div v-if="!disasterAdvisories.length" class="fine-print">No active advisories right now.</div>
                        <div v-else style="display:grid; gap:12px;">
                            <article v-for="advisory in disasterAdvisories" :key="advisory._id" class="record-item" style="padding:12px;">
                                <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
                                    <strong>{{ normalizeLabel(advisory.disasterType) }}</strong>
                                    <StatusBadge :status="advisory.status" />
                                </div>
                                <div class="fine-print" style="margin-top:4px;">Expected Impact: {{ formatDate(advisory.expectedImpactDate) }}</div>
                                <div class="fine-print">Severity: {{ normalizeLabel(advisory.severity) }}</div>
                                <p style="margin:8px 0 0;">{{ advisory.advisoryMessage }}</p>
                                <small class="fine-print" style="display:block; margin-top:8px;">Flood-Prone Areas: {{ advisory.floodProneAreas?.join(', ') || 'N/A' }}</small>
                                <small class="fine-print" style="display:block;">Evacuation Centers: {{ advisory.evacuationCenters?.join(', ') || 'N/A' }}</small>
                            </article>
                        </div>
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

                <div v-if="activeModal === 'reservation'">
                    <h2>Reserve Facility</h2>
                    <p class="fine-print">Book a barangay facility for your event.</p>
                    <form class="stack" @submit.prevent="handleSubmitReservation">
                        <label><span>Facility</span><select v-model="reservationForm.facilityName" required @change="handleReservationAvailabilityChange"><option value="barangay_hall">Barangay Hall</option><option value="covered_court">Covered Court</option><option value="multi_purpose_hall">Multi Purpose Hall</option></select></label>
                        <label><span>Date</span><input v-model="reservationForm.reservationDate" type="date" :min="new Date().toLocaleDateString('en-CA')" required @change="handleReservationAvailabilityChange"></label>
                        <div class="facility-slot-picker" v-if="reservationForm.facilityName && reservationForm.reservationDate">
                            <div class="facility-slot-head">
                                <span>Facility Time Slot</span>
                                <small>Open {{ portalFacilityTimeOptions.operatingHoursLabel }}</small>
                            </div>
                            <div v-if="isFetchingFacilityAvailability" class="facility-slot-note">Loading facility schedule...</div>
                            <div v-else class="facility-slot-grid">
                                <label>
                                    <span>Start Time</span>
                                    <select v-model="reservationForm.startTime" required @change="reservationForm.endTime = ''">
                                        <option disabled value="">Select start</option>
                                        <option v-for="slot in portalFacilityTimeOptions.startOptions" :key="slot.value" :value="slot.value" :disabled="slot.disabled">{{ slot.label }}</option>
                                    </select>
                                </label>
                                <label>
                                    <span>End Time</span>
                                    <select v-model="reservationForm.endTime" required :disabled="!reservationForm.startTime">
                                        <option disabled value="">Select end</option>
                                        <option v-for="slot in portalFacilityTimeOptions.endOptions" :key="slot.value" :value="slot.value" :disabled="slot.disabled">{{ slot.label }}</option>
                                    </select>
                                </label>
                            </div>
                            <div class="facility-reserved-list" v-if="portalFacilityTimeOptions.reservedSlots.length">
                                <span>Reserved ranges</span>
                                <small v-for="slot in portalFacilityTimeOptions.reservedSlots" :key="slot.id || `${slot.startTime}-${slot.endTime}`">{{ formatFacilityRange(slot.startTime, slot.endTime) }} Reserved</small>
                            </div>
                        </div>
                        <label><span>Purpose</span><input v-model="reservationForm.purpose" type="text" required></label>
                        <label><span>Reservation details</span><textarea v-model="reservationForm.reservationDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting || !reservationForm.startTime || !reservationForm.endTime">{{ isSubmitting ? 'Submitting...' : 'Submit Reservation' }}</button>
                    </form>
                    <div class="facility-slot-note" v-if="facilityAvailability">{{ facilityAvailability }}</div>
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
                <div v-if="activeModal === 'document'">
                    <h2>Request Document</h2>
                    <p class="fine-print">Choose document type and fill required fields.</p>
                    <form class="stack" @submit.prevent="handleSubmitDocument">
                        <label>
                            <span>Document Type</span>
                            <select v-model="documentForm.type" required>
                                <option value="certificate">Barangay Certificate</option>
                                <option value="clearance">Barangay Clearance</option>
                                <option value="indigency">Barangay Indigency</option>
                            </select>
                        </label>
                        <label><span>Full name</span><input type="text" v-model="documentForm.fields.FULL_NAME" required></label>
                        <label><span>Age</span><input type="text" v-model="documentForm.fields.AGE"></label>

                        <label v-if="documentForm.type !== 'indigency'"><span>Barangay</span><input v-model="documentForm.fields.BARANGAY" type="text" placeholder="Irawan"></label>
                        <label v-if="documentForm.type !== 'indigency'"><span>City/Municipality</span><input v-model="documentForm.fields.CITY" type="text" placeholder="Puerto Princesa City"></label>

                        <label><span>Purpose</span><input v-model="documentForm.purpose" type="text" placeholder="Reason for request"></label>

                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button>
                    </form>
                </div>
            </dialog>
        </div>

        <!-- Resident Record Details Modal -->
        <div class="landing-modal-backdrop" v-if="recordDetail" @click.self="recordDetail = null">
            <dialog class="landing-modal portal-detail-modal" open>
                <button class="landing-modal-close" @click="recordDetail = null">X</button>
                <h2>{{ recordDetailTitle }}</h2>
                <div class="portal-detail-grid">
                    <div v-for="[label, value] in recordDetailFields" :key="label" class="portal-detail-item">
                        <span>{{ label }}</span>
                        <p>{{ value }}</p>
                    </div>
                </div>
                <div v-if="recordTimeline.length" class="portal-timeline">
                    <h3>Status Log</h3>
                    <div v-for="entry in recordTimeline" :key="entry.label + entry.value" class="portal-timeline-item">
                        <strong>{{ entry.label }}</strong>
                        <span>{{ entry.value }}</span>
                    </div>
                </div>
                <div class="portal-modal-actions">
                    <button v-if="canDeleteRecord(recordDetail.type, recordDetail.item)" class="ghost-button danger" @click="deleteResidentRecord(recordDetail.type, recordDetail.item)">Delete</button>
                    <button class="primary-button" @click="recordDetail = null">Close</button>
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
import StatusBadge from '@/components/StatusBadge.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch, formatDate } from '@/shared/client';
import { REPORT_TYPE_CONFIG, REPORT_TYPE_OPTIONS } from '@/shared/reportTypeConfig';
import { buildFacilityTimeOptions, formatFacilityRange } from '@/shared/facilityTimeSlots';
import { usePortalAuth } from '@/composables/usePortalAuth';
import { usePortalData } from '@/composables/usePortalData';
import { usePortalForms } from '@/composables/usePortalForms';
import { useAppointments } from '@/composables/useAppointments';
import { useDocuments } from '@/composables/useDocuments';

// Composables
const { user, initializing, ensureResident, logout } = usePortalAuth();

const confirmLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
};
const { statusMessage, statusError, reservations, reports, appointments, officials, disasterAdvisories, facilityAvailability, facilityAvailabilityDetails, profile, setStatus, loadAll, saveProfile, loadFacilityAvailability } = usePortalData();
const { reservationForm, reportForm, reportProofFiles, submitReservation, submitReport } = usePortalForms();
const { getAvailableSlots, requestAppointment } = useAppointments();
const { documentRequests, loadMyDocuments, createDocumentRequest } = useDocuments();
// Local state
const sidebarOpen = ref(false);
const currentView = ref(localStorage.getItem('portal_current_view') || 'profile');
const activeModal = ref(null);
const itemsPerPage = 5;
const isSubmitting = ref(false);
const appointmentSearch = ref('');

const reservationSearch = ref('');
const reportSearch = ref('');
const documentSearch = ref('');
const recordDetail = ref(null);

const documentForm = ref({ type: 'certificate', fields: {}, purpose: '' });

const filteredDocumentRequests = computed(() => {
    const needle = String(documentSearch.value || '').trim().toLowerCase();
    return (documentRequests.value || []).filter((item) => {
        if (!needle) return true;
        return (item.type || '').toLowerCase().includes(needle) || (item.purpose || '').toLowerCase().includes(needle) || (item.status || '').toLowerCase().includes(needle);
    });
});

const handleSubmitDocument = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const payload = {
            type: documentForm.value.type,
            fields: documentForm.value.fields || {},
            purpose: documentForm.value.purpose || ''
        };

        const result = await createDocumentRequest(payload);
        if (result.success) {
            setStatus('Document request submitted.');
            closeModal();
            documentForm.value = { type: 'certificate', fields: {}, purpose: '' };
        } else {
            setStatus(result.message || 'Failed to submit document request.', true);
        }
    } catch (err) {
        setStatus(err.message, true);
    } finally {
        isSubmitting.value = false;
    }
};

const setResidentView = (view) => {
    currentView.value = view;
    document.activeElement?.blur();

    if (globalThis.matchMedia('(max-width: 760px)').matches) {
        sidebarOpen.value = false;
    }
};

const appointmentForm = ref({
    officialId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    purpose: ''
});
const availableSlots = ref([]);
const isFetchingSlots = ref(false);
const isFetchingFacilityAvailability = ref(false);
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

const portalFacilityTimeOptions = computed(() => buildFacilityTimeOptions(facilityAvailabilityDetails.value, reservationForm.startTime));

const handleReservationAvailabilityChange = async () => {
    reservationForm.startTime = '';
    reservationForm.endTime = '';
    isFetchingFacilityAvailability.value = true;
    try {
        await loadFacilityAvailability(reservationForm.facilityName, reservationForm.reservationDate);
    } finally {
        isFetchingFacilityAvailability.value = false;
    }
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
    
    reservations: 'Reserve facilities for events',
    reports: 'Submit and monitor your reports',
    appointments: 'Schedule meetings with barangay officials',
    disaster: 'View weather and evacuation advisories'
}[currentView.value]));

const normalizeLabel = (value) => {
    if (!value) return 'Unspecified';
    return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const matchesSearch = (item, term, fields) => {
    const needle = term.trim().toLowerCase();
    if (!needle) return true;
    return fields.some((field) => String(field(item) || '').toLowerCase().includes(needle));
};

const filteredAppointments = computed(() => appointments.value.filter((item) => matchesSearch(item, appointmentSearch.value, [
    (record) => record.officialId?.name,
    (record) => record.officialId?.position,
    (record) => record.purpose,
    (record) => record.status,
    (record) => formatDate(record.appointmentDate)
])));



const filteredReservations = computed(() => reservations.value.filter((item) => matchesSearch(item, reservationSearch.value, [
    (record) => normalizeLabel(record.facilityName),
    (record) => record.purpose,
    (record) => record.status,
    (record) => formatDate(record.reservationDate)
])));

const filteredReports = computed(() => reports.value.filter((item) => matchesSearch(item, reportSearch.value, [
    (record) => record.title,
    (record) => normalizeLabel(record.reportType),
    (record) => normalizeLabel(record.priority),
    (record) => record.locationText,
    (record) => record.status,
    (record) => formatDate(record.createdAt)
])));

const reportTypeOptions = REPORT_TYPE_OPTIONS;

const currentReportTypeConfig = computed(() => {
    return REPORT_TYPE_CONFIG[reportForm.reportType] || REPORT_TYPE_CONFIG.other;
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

const deleteConfig = {
    appointment: { path: (id) => `/appointments/${id}`, terminal: ['rejected', 'cancelled', 'completed', 'expired'], label: 'appointment' },
    reservation: { path: (id) => `/facility-reservations/${id}`, terminal: ['rejected', 'completed', 'cancelled'], label: 'reservation' },
    report: { path: (id) => `/reports/${id}`, terminal: ['resolved', 'rejected', 'closed'], label: 'report' }
};

const canDeleteRecord = (type, item) => deleteConfig[type]?.terminal.includes(item?.status);
const canCancelAppointment = (item) => ['pending', 'approved'].includes(item?.status);

const openRecordDetail = (type, item) => {
    recordDetail.value = { type, item };
};

const cancelResidentAppointment = async (item) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
        await apiFetch(`/appointments/${item._id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ cancellationReason: 'Cancelled by resident' })
        });
        setStatus('Appointment cancelled.');
        await loadAll();
    } catch (error) {
        setStatus(error.message, true);
    }
};

const deleteResidentRecord = async (type, item) => {
    const config = deleteConfig[type];
    if (!config || !item?._id) return;
    if (!confirm(`Delete this ${config.label} from your history?`)) return;

    try {
        await apiFetch(config.path(item._id), { method: 'DELETE' });
        setStatus(`${normalizeLabel(config.label)} deleted.`);
        if (recordDetail.value?.item?._id === item._id) {
            recordDetail.value = null;
        }
        await loadAll();
    } catch (error) {
        setStatus(error.message, true);
    }
};

const recordDetailTitle = computed(() => {
    if (!recordDetail.value) return '';
    return {
        appointment: 'Appointment Details',
        reservation: 'Reservation Details',
        report: 'Report Details'
    }[recordDetail.value.type];
});

const recordDetailFields = computed(() => {
    const detail = recordDetail.value;
    if (!detail) return [];
    const item = detail.item;
    const fieldSets = {
        appointment: [
            ['Official', `${item.officialId?.name || 'TBD'} - ${item.officialId?.position || 'Official'}`],
            ['Schedule', `${formatDate(item.appointmentDate)} | ${item.timeSlot?.startTime || 'TBD'}-${item.timeSlot?.endTime || 'TBD'}`],
            ['Purpose', item.purpose],
            ['Status', normalizeLabel(item.status)],
            ['Reason/Notes', item.rejectionReason || item.cancellationReason || item.remarks]
        ],
        reservation: [
            ['Facility', normalizeLabel(item.facilityName)],
            ['Schedule', `${formatDate(item.reservationDate)} | ${item.startTime}-${item.endTime}`],
            ['Purpose', item.purpose],
            ['Details', item.reservationDetails],
            ['Status', normalizeLabel(item.status)],
            ['Admin Notes', item.adminNotes]
        ],
        report: [
            ['Title', item.title],
            ['Type', normalizeLabel(item.reportType)],
            ['Priority', normalizeLabel(item.priority)],
            ['Location', item.locationText],
            ['Description', item.description],
            ['Status', normalizeLabel(item.status)],
            ['Admin Notes', item.adminNotes],
            ['Submitted', formatDate(item.createdAt)]
        ]
    };

    return (fieldSets[detail.type] || []).filter(([, value]) => value !== undefined && value !== null && value !== '');
});

const recordTimeline = computed(() => {
    const item = recordDetail.value?.item;
    if (!item) return [];
    return [
        ['Submitted', item.createdAt],
        ['Approved', item.approvedAt],
        ['Rejected', item.rejectedAt],
        ['Cancelled', item.cancelledAt],
        ['Completed', item.completedAt],
        ['Expired', item.expiredAt],
        ['Updated', item.updatedAt]
    ].filter(([, value]) => value).map(([label, value]) => ({ label, value: formatDate(value) }));
});

// Modal handlers
const openModal = (type) => {
    activeModal.value = type;
};

const closeModal = () => {
    activeModal.value = null;
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

const isSafariBrowser = () => {
    const userAgent = navigator.userAgent || '';
    return /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|FxiOS|Android/i.test(userAgent);
};

const requestGeolocation = (options) => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const readGeolocationPermissionState = async () => {
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

const isSecureGeolocationContext = () => globalThis.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const getGeolocationErrorMessage = (error, safari) => {
    if (error?.code === 1) {
        return safari
            ? '❌ Permission Denied on Safari: If no popup appears, Safari may already be blocked for this site. Open iPhone Settings → Privacy & Security → Location Services → Safari Websites, set to "While Using the App", then reload this page and tap "Use My Current Location" again.'
            : '❌ Permission Denied: When you clicked the button, you might have tapped "Block" instead of "Allow". Try again and tap Allow when the popup appears. OR check your browser settings to allow location access for this site.';
    }

    if (error?.code === 2) {
        return safari
            ? '⚠️ Safari could not get your location. Make sure iPhone Location Services is ON and Safari Websites is set to "While Using the App", then try again.'
            : '⚠️ Location Not Available: Make sure Location Services/GPS is ON in your phone settings, and you have a good network signal. Then try again.';
    }

    if (error?.code === 3) {
        return '⏱️ Timeout: Getting your location is taking too long. Check that Location Services is ON and your network is working, then try again.';
    }

    return error?.message || 'Unable to capture your location.';
};

const captureCurrentLocation = async () => {
    if (!navigator.geolocation) {
        setStatus('Geolocation is not supported on this device/browser.', true);
        return;
    }

    const safari = isSafariBrowser();
    if (!isSecureGeolocationContext()) {
        setStatus('Geolocation requires a secure connection (HTTPS). Please ensure you\'re using HTTPS on this site.', true);
        return;
    }

    locatingPosition.value = true;

    try {
        const permissionState = await readGeolocationPermissionState();

        if (permissionState === 'denied') {
            setStatus(
                safari
                    ? '🔒 Safari location access is blocked for this site. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using the App. Then open this site in Safari again and tap "Use My Current Location".'
                    : '🔒 Location access is blocked in this browser. Go to your browser settings → Permissions → Location, and allow access for this site. Then come back and try again.',
                true
            );
            return;
        }

        const position = await requestGeolocation({
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 5000
        });

        reportForm.locationLatitude = String(position.coords.latitude.toFixed(6));
        reportForm.locationLongitude = String(position.coords.longitude.toFixed(6));
        reportForm.locationAccuracy = String(Math.round(position.coords.accuracy || 0));
        setStatus('Current location captured.');
    } catch (error) {
        if (error?.code !== 1) {
            try {
                const fallbackPosition = await requestGeolocation({
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 0
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

        setStatus(getGeolocationErrorMessage(error, safari), true);
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
    await loadMyDocuments();
});

onUnmounted(() => {});
</script>
