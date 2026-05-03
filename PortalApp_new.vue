<template>
    <div class="page-shell app-shell">
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button class="sidebar-close-btn" @click="sidebarOpen = false">X</button>
            <BrandMark initials="BC" eyebrow="Resident Portal" title="Barangay Connect" />

            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'profile' }" type="button" @click="currentView = 'profile'">My Profile</button>
                <button :class="{ active: currentView === 'documents' }" type="button" @click="currentView = 'documents'">Document Requests</button>
                <button :class="{ active: currentView === 'appointments' }" type="button" @click="currentView = 'appointments'">Appointments</button>
                <button :class="{ active: currentView === 'reservations' }" type="button" @click="currentView = 'reservations'">Facility Reservations</button>
                <button :class="{ active: currentView === 'reports' }" type="button" @click="currentView = 'reports'">Reports</button>
            </nav>

            <div class="sidebar-block">
                <span class="eyebrow">Signed In</span>
                <div v-if="user">
                    <strong>{{ user.username }}</strong>
                    <div class="fine-print">{{ user.email }}</div>
                </div>
                <div v-else class="fine-print">Checking session...</div>
            </div>

            <button type="button" class="ghost-button" @click="logout">Log Out</button>
        </aside>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = true">☰</button>
            </header>
            <section class="hero-banner">
                <div>
                    <span class="eyebrow">Resident Workspace</span>
                    <h2>{{ viewTitle }}</h2>
                </div>
                <div class="status-box" :style="{ color: statusError ? '#d52a2a' : '' }">{{ statusMessage }}</div>
            </section>

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
                            <button type="submit" class="primary-button">Save Resident Profile</button>
                        </form>
                    </article>
                </div>
            </section>

            <!-- Document Requests View -->
            <section class="app-view" :class="{ active: currentView === 'documents' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="eyebrow">Document Requests</span>
                                <h3>My requested documents</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'document'">Request Document</button>
                        </div>
                        <RecordList :items="documentItems" />
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
                                <h3>My booked appointments</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'appointment'">Book Appointment</button>
                        </div>
                        <RecordList :items="appointmentItems" />
                    </article>
                    
                    <article class="content-card">
                        <div class="section-head">
                            <span class="eyebrow">Officials</span>
                            <h3>Available barangay staff</h3>
                        </div>
                        <RecordList :items="officialItems" />
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
        <div class="landing-modal-backdrop" v-if="activeModal" @click.self="activeModal = null">
            <dialog class="landing-modal" open>
                <button class="landing-modal-close" @click="activeModal = null">X</button>
                
                <div v-if="activeModal === 'document'">
                    <h2>Request Document</h2>
                    <p class="fine-print">Fill up the details for the document you need.</p>
                    <form class="stack" @submit.prevent="submitDocumentRequest">
                        <label><span>Document type</span><select v-model="documentForm.documentType" required><option value="barangay_clearance">Barangay Clearance</option><option value="certificate_of_residency">Certificate of Residency</option><option value="certificate_of_indigency">Certificate of Indigency</option></select></label>
                        <label><span>Purpose</span><input v-model="documentForm.purpose" type="text" required></label>
                        <label><span>Request details</span><textarea v-model="documentForm.requestDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button">Submit Request</button>
                    </form>
                </div>

                <div v-if="activeModal === 'appointment'">
                    <h2>Book Appointment</h2>
                    <p class="fine-print">Set an appointment with a barangay official.</p>
                    <form class="stack" @submit.prevent="submitAppointment">
                        <label><span>Official</span><select v-model="appointmentForm.officialId" required><option value="">Select an official</option><option v-for="official in officials" :key="official._id" :value="official._id">{{ official.fullName }} - {{ official.position }}</option></select></label>
                        <label><span>Date</span><input v-model="appointmentForm.appointmentDate" type="date" required></label>
                        <label><span>Time slot</span><input v-model="appointmentForm.timeSlot" type="text" placeholder="09:00-10:00" required></label>
                        <label><span>Purpose</span><input v-model="appointmentForm.purpose" type="text" required></label>
                        <label><span>Concern details</span><textarea v-model="appointmentForm.concernDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button">Submit Appointment</button>
                    </form>
                </div>

                <div v-if="activeModal === 'reservation'">
                    <h2>Reserve Facility</h2>
                    <p class="fine-print">Book a barangay facility for your event.</p>
                    <form class="stack" @submit.prevent="submitReservation">
                        <label><span>Facility</span><select v-model="reservationForm.facilityName" required @change="loadFacilityAvailability"><option value="barangay_hall">Barangay Hall</option><option value="covered_court">Covered Court</option><option value="multi_purpose_hall">Multi Purpose Hall</option></select></label>
                        <label><span>Date</span><input v-model="reservationForm.reservationDate" type="date" required @change="loadFacilityAvailability"></label>
                        <label><span>Start time</span><input v-model="reservationForm.startTime" type="time" required></label>
                        <label><span>End time</span><input v-model="reservationForm.endTime" type="time" required></label>
                        <label><span>Purpose</span><input v-model="reservationForm.purpose" type="text" required></label>
                        <label><span>Reservation details</span><textarea v-model="reservationForm.reservationDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button">Submit Reservation</button>
                    </form>
                    <div class="status-box">{{ facilityAvailability }}</div>
                </div>

                <div v-if="activeModal === 'report'">
                    <h2>Submit Report</h2>
                    <p class="fine-print">Report an incident or concern in the barangay.</p>
                    <form class="stack" @submit.prevent="submitReport">
                        <label><span>Report type</span><select v-model="reportForm.reportType" required><option value="noise_complaint">Noise Complaint</option><option value="disturbance">Disturbance</option><option value="blotter">Blotter</option><option value="sanitation">Sanitation</option><option value="infrastructure">Infrastructure</option><option value="manpower_request">Manpower Request</option><option value="public_safety">Public Safety</option><option value="animal_related">Animal Related</option><option value="disaster">Disaster</option><option value="other">Other</option></select></label>
                        <label><span>Title</span><input v-model="reportForm.title" type="text" required></label>
                        <label><span>Description</span><textarea v-model="reportForm.description" rows="3" required></textarea></label>
                        <label><span>Location</span><input v-model="reportForm.locationText" type="text" required></label>
                        <label><span>Incident date</span><input v-model="reportForm.incidentDate" type="date"></label>
                        <label><span>Priority</span><select v-model="reportForm.priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option></select></label>
                        <label><span>Contact preference</span><select v-model="reportForm.contactPreference"><option value="phone">Phone</option><option value="email">Email</option><option value="in_app">In app</option><option value="none">None</option></select></label>
                        <label class="checkbox-row"><input v-model="reportForm.isAnonymous" type="checkbox"><span>Submit anonymously</span></label>
                        <button type="submit" class="primary-button">Submit Report</button>
                    </form>
                </div>
            </dialog>
        </div>
    </div>
</template>