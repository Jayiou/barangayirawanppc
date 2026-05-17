<template>
    <div class="page-shell landing-shell">
        <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />

        <header class="landing-topbar">
            <div class="landing-topbar-inner">
                <BrandMark initials="BI" eyebrow="Management System" title="Barangay Irawan" />
                <nav class="landing-nav" aria-label="Main navigation">
                    <a href="#home">Home</a>
                    <a href="#vmg">VMG</a>
                    <a href="#services">Services</a>
                    <a href="#officials">Officials</a>
                    <a href="#announcements">Announcements</a>
                    <a href="#location">Location</a>
                    <button type="button" class="landing-auth-btn" @click="openModal('login')">
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Login
                    </button>
                    <button type="button" class="landing-auth-btn" @click="openModal('register')">
                        <i class="fa-solid fa-user-plus"></i>
                        Register
                    </button>
                    <button v-if="pendingOtpEmail" type="button" class="landing-auth-btn pending-otp-btn" @click="resumeOtpVerification">
                        <i class="fa-solid fa-shield-halved"></i>
                        Continue OTP
                    </button>
                </nav>
            </div>
        </header>

        <section class="landing-hero" id="home">
            <div class="landing-hero-overlay"></div>
            <div class="landing-hero-content">
                <span class="eyebrow light animate-section slide-up">Barangay Digital Services</span>
                <h2 class="animate-section slide-up">Welcome to Barangay Irawan</h2>
                <h3 class="animate-section slide-up">Puerto Princesa City</h3>
                <p class="animate-section slide-up">
                    Your gateway to efficient, modern barangay services. Access documents, schedule
                    appointments, report incidents, and stay connected with your community, all in one place.
                </p>
            </div>
        </section>

        <!-- Vision / Mission / Goals Section -->
        <section class="landing-vmg-section animate-section slide-up" id="vmg">

            <div class="vmg-grid">
                <article class="vmg-card animate-section slide-up">
                    <div class="vmg-card-bg"></div>
                    <div class="vmg-wave top"></div>
                    <div class="vmg-wave outer top"></div>
                    <div class="vmg-overlay"></div>
                    <div class="vmg-copy">
                        <h4>VISION</h4>
                        <p><strong>BARANGAY IRAWAN:</strong><br>A PROGRESSIVE AGRICULTURAL TRADING CENTER OF PALAWAN, DEMONSTRATING A CLEAN AND GREEN ENVIRONMENT, INHABITED BY A COMPASSIONATE AND EMPOWERED CITIZENRY UNDER A PARTICIPATORY AND ACCOUNTABLE GOVERNANCE.</p>
                    </div>
                    <div class="vmg-wave bottom"></div>
                    <div class="vmg-wave outer bottom"></div>
                </article>

                <article class="vmg-card animate-section slide-up">
                    <div class="vmg-card-bg"></div>
                    <div class="vmg-wave top"></div>
                    <div class="vmg-wave outer top"></div>
                    <div class="vmg-overlay"></div>
                    <div class="vmg-copy">
                        <h4>MISSION</h4>
                        <p>WE AIM TO BE A PEACEFUL, GREEN AND PROGRESSIVE COMMUNITY.</p>
                    </div>
                    <div class="vmg-wave bottom"></div>
                    <div class="vmg-wave outer bottom"></div>
                </article>

                <article class="vmg-card animate-section slide-up">
                    <div class="vmg-card-bg"></div>
                    <div class="vmg-wave top"></div>
                    <div class="vmg-wave outer top"></div>
                    <div class="vmg-overlay"></div>
                    <div class="vmg-copy">
                        <h4>GOALS</h4>
                        <p>TO GIVE ENOUGH SERVICES TO ALL THE RESIDENCES OF THIS BARANGAY, TO PROVIDE LIVELIHOOD PROGRAMS FOR BETTER LIVING AND CREATE MORE PROJECTS FOR THE BENEFITS OF THE CONSTITUENTS.</p>
                    </div>
                    <div class="vmg-wave bottom"></div>
                    <div class="vmg-wave outer bottom"></div>
                </article>
            </div>
        </section>
        <section class="landing-services-section animate-section slide-up" id="services">
            <div class="landing-section-heading center">
                <h3>Barangay Services</h3>
                <p>Everything you need to connect with Barangay Irawan and access essential community services.</p>
            </div>

            <div class="landing-service-grid">
                <article
                    v-for="service in services"
                    :key="service.title"
                    :class="['landing-service-card animate-section slide-left', { 'is-clickable': service.action }]"
                    :role="service.action ? 'button' : null"
                    :tabindex="service.action ? 0 : null"
                    :aria-label="service.action ? `${service.title} request form` : null"
                    @click="handleServiceClick(service)"
                    @keydown.enter.prevent="handleServiceClick(service)"
                    @keydown.space.prevent="handleServiceClick(service)"
                >
                    <div class="landing-service-icon">{{ service.icon }}</div>
                    <h4>{{ service.title }}</h4>
                    <p>{{ service.copy }}</p>
                    <span v-if="service.action" class="landing-service-cta">Request online</span>
                </article>
            </div>
        </section>

        <section class="landing-officials-section animate-section slide-up" id="officials">
            <div class="landing-section-heading center">
                <h3>Barangay Officials</h3>
                <p>Meet the leaders and public servants helping Barangay Irawan deliver faster, clearer services.</p>
            </div>

            <div v-if="officialsLoading" class="officials-loading">Loading officials...</div>
            <div v-else-if="sortedOfficials.length === 0" class="empty-state">No officials are available right now. Please check back later.</div>
            <div v-else class="officials-sections">
                <!-- Barangay Captain (Solo Row) -->
                <div class="officials-row captain-row">
                    <article v-for="official in sortedOfficials.filter(o => o.position === 'Barangay Captain')" :key="official._id" class="official-card animate-section slide-up">
                        <div class="official-avatar" :style="official.picture ? { backgroundImage: `url(${official.picture})` } : {}">
                            <span v-if="!official.picture">{{ getOfficialInitials(official) }}</span>
                        </div>
                        <div class="official-copy">
                            <strong>{{ official.name }}</strong>
                            <small>{{ official.position }}</small>
                        </div>
                    </article>
                </div>

                <!-- Secretary & Treasurer (Dual Row) -->
                <div class="officials-row dual-row">
                    <article v-for="official in sortedOfficials.filter(o => ['Barangay Secretary', 'Barangay Treasurer'].includes(o.position))" :key="official._id" class="official-card animate-section slide-up">
                        <div class="official-avatar" :style="official.picture ? { backgroundImage: `url(${official.picture})` } : {}">
                            <span v-if="!official.picture">{{ getOfficialInitials(official) }}</span>
                        </div>
                        <div class="official-copy">
                            <strong>{{ official.name }}</strong>
                            <small>{{ official.position }}</small>
                        </div>
                    </article>
                </div>

                <!-- Kagawads (3 Columns) -->
                <div class="officials-row kagawad-row">
                    <article v-for="official in sortedOfficials.filter(o => o.position === 'Barangay Kagawad')" :key="official._id" class="official-card animate-section slide-up">
                        <div class="official-avatar" :style="official.picture ? { backgroundImage: `url(${official.picture})` } : {}">
                            <span v-if="!official.picture">{{ getOfficialInitials(official) }}</span>
                        </div>
                        <div class="official-copy">
                            <strong>{{ official.name }}</strong>
                            <small>{{ official.position }}</small>
                        </div>
                    </article>
                </div>

                <!-- Other (Dynamic Columns) -->
                <div class="officials-row other-row">
                    <article v-for="official in sortedOfficials.filter(o => o.position === 'Other')" :key="official._id" class="official-card animate-section slide-up">
                        <div class="official-avatar" :style="official.picture ? { backgroundImage: `url(${official.picture})` } : {}">
                            <span v-if="!official.picture">{{ getOfficialInitials(official) }}</span>
                        </div>
                        <div class="official-copy">
                            <strong>{{ official.name }}</strong>
                            <small>{{ official.position }}</small>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="landing-lower-grid" id="announcements">
            <AnnouncementSlideshow />
        </section>

        <section class="landing-location-band" id="location">
            <div class="landing-location-inner">
                <div class="landing-location-copy animate-section slide-up">
                    <span class="eyebrow">Barangay Location</span>
                    <h3>Visit Barangay Irawan Hall</h3>
                    <p>
                        View our exact location in Puerto Princesa and tap the map to open Google Maps for directions.
                    </p>
                </div>

                <a
                    class="landing-map-link animate-section slide-up"
                    href="https://www.google.com/maps/search/?api=1&query=Barangay+Hall+Irawan+Puerto+Princesa+Palawan"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Barangay Irawan Hall in Google Maps"
                >
                    <iframe
                        class="landing-map-frame"
                        src="https://maps.google.com/maps?q=Barangay%20Hall%20Irawan%20Puerto%20Princesa%20Palawan&z=16&output=embed"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        title="Barangay Irawan Hall location map"
                    ></iframe>
                    <div class="landing-map-overlay">
                        <span>Open in Google Maps</span>
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </div>
                </a>
            </div>
        </section>

        <footer class="landing-footer">
            <div class="landing-footer-inner">
                <div class="landing-footer-top">
                    <div class="landing-footer-brand">
                        <div class="brand-mark small">BI</div>
                        <div>
                            <strong>Barangay Irawan</strong>
                            <div class="fine-print">Puerto Princesa City</div>
                        </div>
                    </div>

                    <nav class="landing-footer-nav" aria-label="Footer navigation">
                        <a href="#home">Home</a>
                        <a href="#vmg">VMG</a>
                        <a href="#services">Services</a>
                        <a href="#officials">Officials</a>
                        <a href="#announcements">Announcements</a>
                        <a href="#location">Location</a>
                    </nav>
                </div>

                <div class="landing-footer-bottom">
                    <div class="landing-footer-contact">
                        <a href="tel:+639171234567" class="landing-footer-contact-item">
                            <i class="fa-solid fa-phone"></i>
                            <span>+63 917 123 4567</span>
                        </a>
                        <a href="mailto:barangay.irawan@example.com" class="landing-footer-contact-item">
                            <i class="fa-solid fa-envelope"></i>
                            <span>barangay.irawan@example.com</span>
                        </a>
                        <a href="https://www.facebook.com/barangay.irawan.2025" target="_blank" rel="noopener noreferrer" class="landing-footer-contact-item">
                            <i class="fa-brands fa-facebook"></i>
                            <span>Facebook</span>
                        </a>
                    </div>

                    <div class="fine-print">© 2026 Barangay Irawan. All rights reserved.</div>
                </div>
            </div>
        </footer>

        <div v-if="activeModal" class="auth-modal-backdrop" @click.self="closeModal">
            <div class="auth-modal-container" :class="{ 'is-register': activeModal === 'register', 'is-request': activeModal.startsWith('guest-') }">
                <button type="button" class="auth-modal-close" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>

                <!-- Left Visual Panel -->
                <div class="auth-modal-visual">
                    <div class="visual-overlay"></div>
                    <div class="visual-content">
                        <BrandMark initials="BI" eyebrow="Barangay Irawan" title="Resident Portal" />
                        <div class="visual-text">
                            <h3>{{ getVisualTitle(activeModal) }}</h3>
                            <p>
                                {{ getVisualCopy(activeModal) }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Right Form Panel -->
                <div class="auth-modal-form-area">
                    <div class="form-header">
                        <h2>{{ getModalTitle(activeModal) }}</h2>
                        <div class="auth-toggle" v-if="['login', 'register', 'forgot-password', 'reset-password'].includes(activeModal)">
                            <span class="toggle-text">
                                {{ activeModal === 'login' ? "Don't have an account?" : activeModal === 'forgot-password' || activeModal === 'reset-password' ? 'Need to go back?' : 'Already have an account?' }}
                            </span>
                            <button type="button" class="toggle-link" @click="switchAuthMode">
                                {{ getToggleLabel(activeModal) }}
                            </button>
                        </div>
                        <div v-else-if="activeModal === 'guest-document-request'" class="modal-helper-copy">
                            Non-residents can submit a document request without registering. Provide your Gmail address so we can send the decision and next steps.
                        </div>
                    </div>

                    <transition name="fade-slide" mode="out-in">
                        <div :key="activeModal" class="form-transition-wrapper">
                            <form v-if="activeModal === 'guest-document-request'" class="modern-form register-form guest-request-form" @submit.prevent="handleGuestDocumentRequest">
                                <div class="guest-request-banner">
                                    <i class="fa-solid fa-file-circle-check"></i>
                                    <div>
                                        <strong>Non-Resident Document Request</strong>
                                        <p>Fill out the request and personal details below. The admin will review it and send updates to your email address.</p>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-document-type">Document Type</label>
                                    <div class="custom-select">
                                        <select id="guest-document-type" v-model="guestDocumentForm.documentType" required>
                                            <option value="barangay_clearance">Barangay Clearance</option>
                                            <option value="certificate_of_residency">Certificate of Residency</option>
                                            <option value="certificate_of_indigency">Certificate of Indigency</option>
                                        </select>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-purpose">Purpose</label>
                                    <input id="guest-purpose" v-model="guestDocumentForm.purpose" type="text" placeholder="Employment, school, legal, or travel requirement" required>
                                </div>

                                <div class="input-group">
                                    <label for="guest-details">Request Details</label>
                                    <textarea id="guest-details" v-model="guestDocumentForm.requestDetails" rows="4" placeholder="Add any extra context the admin should know"></textarea>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-first-name">First Name</label>
                                        <input id="guest-first-name" v-model="guestDocumentForm.firstName" type="text" autocomplete="given-name" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-last-name">Last Name</label>
                                        <input id="guest-last-name" v-model="guestDocumentForm.lastName" type="text" autocomplete="family-name" required>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-middle-name">Middle Name</label>
                                        <input id="guest-middle-name" v-model="guestDocumentForm.middleName" type="text" autocomplete="additional-name">
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-suffix">Suffix</label>
                                        <input id="guest-suffix" v-model="guestDocumentForm.suffix" type="text" placeholder="Jr., Sr., III">
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-contact">Contact Number</label>
                                        <input id="guest-contact" v-model="guestDocumentForm.contactNumber" type="tel" autocomplete="tel" placeholder="09xxxxxxxxx" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-email">Gmail Address</label>
                                        <input id="guest-email" v-model="guestDocumentForm.email" type="email" autocomplete="email" placeholder="yourname@gmail.com" required>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-address">Current Address</label>
                                    <input id="guest-address" v-model="guestDocumentForm.address" type="text" placeholder="City / municipality / barangay" required>
                                </div>

                                <div class="input-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="guestDocumentForm.agreePrivacy"> I have read and agree to the <a href="#" @click.prevent="showPrivacy(activeModal)">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" class="auth-submit-btn" :disabled="isGuestDocumentLoading || !guestDocumentForm.agreePrivacy">
                                    {{ isGuestDocumentLoading ? 'Submitting...' : 'Submit Request' }} <i :class="isGuestDocumentLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'"></i>
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'guest-report-request'" class="modern-form register-form guest-request-form" @submit.prevent="handleGuestReportRequest">
                                <div class="guest-request-banner">
                                    <i class="fa-solid fa-flag"></i>
                                    <div>
                                        <strong>Non-Resident Report</strong>
                                        <p>Submit an incident report, complaint, or community concern. The admin will review it and email the update.</p>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-report-type">Report Type</label>
                                        <div class="custom-select">
                                            <select id="guest-report-type" v-model="guestReportForm.reportType" required>
                                                <option value="noise_complaint">Noise Complaint</option>
                                                <option value="disturbance">Disturbance</option>
                                                <option value="sanitation">Sanitation</option>
                                                <option value="infrastructure">Infrastructure</option>
                                                <option value="public_safety">Public Safety</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-report-priority">Priority</label>
                                        <div class="custom-select">
                                            <select id="guest-report-priority" v-model="guestReportForm.priority" required>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="emergency">Emergency</option>
                                            </select>
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-report-description">Description</label>
                                    <textarea id="guest-report-description" v-model="guestReportForm.description" rows="4" placeholder="Describe what happened" required></textarea>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-report-location">Location</label>
                                        <input id="guest-report-location" v-model="guestReportForm.locationText" type="text" placeholder="Where did it happen?" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-report-incident-date">Incident Date</label>
                                        <input id="guest-report-incident-date" v-model="guestReportForm.incidentDate" type="date">
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-report-first-name">First Name</label>
                                        <input id="guest-report-first-name" v-model="guestReportForm.firstName" type="text" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-report-last-name">Last Name</label>
                                        <input id="guest-report-last-name" v-model="guestReportForm.lastName" type="text" required>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-report-contact">Contact Number</label>
                                        <input id="guest-report-contact" v-model="guestReportForm.contactNumber" type="tel" placeholder="09xxxxxxxxx" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-report-email">Gmail Address</label>
                                        <input id="guest-report-email" v-model="guestReportForm.email" type="email" placeholder="yourname@gmail.com" required>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-report-address">Current Address</label>
                                    <input id="guest-report-address" v-model="guestReportForm.address" type="text" placeholder="City / municipality / barangay" required>
                                </div>

                                <div class="input-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="guestReportForm.agreePrivacy"> I agree to the <a href="#" @click.prevent="showPrivacy(activeModal)">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" class="auth-submit-btn" :disabled="isGuestReportLoading || !guestReportForm.agreePrivacy">
                                    {{ isGuestReportLoading ? 'Submitting...' : 'Submit Report' }} <i :class="isGuestReportLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'"></i>
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'guest-facility-request'" class="modern-form register-form guest-request-form" @submit.prevent="handleGuestReservationRequest">
                                <div class="guest-request-banner">
                                    <i class="fa-solid fa-building-circle-check"></i>
                                    <div>
                                        <strong>Non-Resident Facility Request</strong>
                                        <p>Reserve a barangay facility for your event. The admin will confirm availability and send an update by email.</p>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-facility-name">Facility</label>
                                        <div class="custom-select">
                                            <select id="guest-facility-name" v-model="guestReservationForm.facilityName" required>
                                                <option value="barangay_hall">Barangay Hall</option>
                                                <option value="covered_court">Covered Court</option>
                                                <option value="multi_purpose_hall">Multi-Purpose Hall</option>
                                            </select>
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-facility-date">Reservation Date</label>
                                        <input id="guest-facility-date" v-model="guestReservationForm.reservationDate" type="date" required>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-facility-start">Start Time</label>
                                        <input id="guest-facility-start" v-model="guestReservationForm.startTime" type="time" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-facility-end">End Time</label>
                                        <input id="guest-facility-end" v-model="guestReservationForm.endTime" type="time" required>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-facility-purpose">Purpose</label>
                                    <input id="guest-facility-purpose" v-model="guestReservationForm.purpose" type="text" placeholder="Wedding, meeting, celebration, etc." required>
                                </div>

                                <div class="input-group">
                                    <label for="guest-facility-details">Reservation Details</label>
                                    <textarea id="guest-facility-details" v-model="guestReservationForm.reservationDetails" rows="4" placeholder="Add event notes or setup requirements"></textarea>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-facility-first-name">First Name</label>
                                        <input id="guest-facility-first-name" v-model="guestReservationForm.firstName" type="text" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-facility-last-name">Last Name</label>
                                        <input id="guest-facility-last-name" v-model="guestReservationForm.lastName" type="text" required>
                                    </div>
                                </div>

                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="guest-facility-contact">Contact Number</label>
                                        <input id="guest-facility-contact" v-model="guestReservationForm.contactNumber" type="tel" placeholder="09xxxxxxxxx" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="guest-facility-email">Gmail Address</label>
                                        <input id="guest-facility-email" v-model="guestReservationForm.email" type="email" placeholder="yourname@gmail.com" required>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="guest-facility-address">Current Address</label>
                                    <input id="guest-facility-address" v-model="guestReservationForm.address" type="text" placeholder="City / municipality / barangay" required>
                                </div>

                                <div class="input-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="guestReservationForm.agreePrivacy"> I agree to the <a href="#" @click.prevent="showPrivacy(activeModal)">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" class="auth-submit-btn" :disabled="isGuestReservationLoading || !guestReservationForm.agreePrivacy">
                                    {{ isGuestReservationLoading ? 'Submitting...' : 'Submit Request' }} <i :class="isGuestReservationLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'"></i>
                                </button>
                            </form>

                            <!-- Login Form -->
                            <form v-if="activeModal === 'login'" class="modern-form" @submit.prevent="handleLogin">
                                <div class="input-group">
                                    <label for="login-username">Username</label>
                                    <div class="input-wrapper">
                                        <i class="fa-regular fa-user"></i>
                                        <input id="login-username" name="username" v-model="loginForm.username" type="text" autocomplete="username" placeholder="Enter your username" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="login-password">Password</label>
                                    <div class="input-wrapper has-toggle">
                                        <i class="fa-solid fa-lock"></i>
                                        <input id="login-password" name="password" v-model="loginForm.password" :type="passwordVisibility.login ? 'text' : 'password'" autocomplete="off" placeholder="Enter your password" required>
                                        <button
                                            type="button"
                                            class="password-toggle-btn"
                                            :aria-label="passwordVisibility.login ? 'Hide password' : 'Show password'"
                                            @click="togglePasswordVisibility('login')"
                                        >
                                            <i :class="passwordVisibility.login ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" class="auth-submit-btn" :disabled="isLoginLoading">
                                    {{ isLoginLoading ? 'Signing in...' : 'Login to Portal' }} <i :class="isLoginLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="openModal('forgot-password')">
                                    Forgot password?
                                </button>
                            </form>

                            <!-- Registration Form -->
                            <form v-else-if="activeModal === 'register'" class="modern-form register-form" @submit.prevent="handleRegister">
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-firstname">First Name</label>
                                        <input id="reg-firstname" name="firstName" v-model="registerForm.firstName" type="text" autocomplete="given-name" placeholder="Juan" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-lastname">Last Name</label>
                                        <input id="reg-lastname" name="lastName" v-model="registerForm.lastName" type="text" autocomplete="family-name" placeholder="Dela Cruz" required>
                                    </div>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-sex">Sex</label>
                                        <div class="custom-select">
                                            <select id="reg-sex" name="sex" v-model="registerForm.sex" required>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-birthdate">Birth Date</label>
                                        <input id="reg-birthdate" name="birthDate" v-model="registerForm.birthDate" type="date" autocomplete="bday" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="reg-address">Barangay</label>
                                    <input id="reg-address" name="address" v-model="registerForm.address" type="text" autocomplete="address-line1" placeholder="Barangay Irawan" required>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-contact">Contact Number</label>
                                        <input id="reg-contact" name="contactNumber" v-model="registerForm.contactNumber" type="tel" autocomplete="tel" placeholder="09xxxxxxxxx" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-email">Email Address</label>
                                        <input id="reg-email" name="email" v-model="registerForm.email" type="email" autocomplete="email" placeholder="juan@example.com" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="reg-purok">Purok / Zone</label>
                                    <input id="reg-purok" name="purok" v-model="registerForm.purok" type="text" placeholder="Purok 1" required>
                                </div>
                                <div class="input-group">
                                    <label for="reg-username">Username</label>
                                    <div class="input-wrapper">
                                        <i class="fa-regular fa-user"></i>
                                        <input id="reg-username" name="new-username" v-model="registerForm.username" type="text" autocomplete="username" placeholder="Choose a username" required>
                                    </div>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-password">Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reg-password" name="new-password" v-model="registerForm.password" :type="passwordVisibility.register ? 'text' : 'password'" autocomplete="off" placeholder="Min. 8 characters" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.register ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('register')"
                                            >
                                                <i :class="passwordVisibility.register ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-confirm">Confirm Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reg-confirm" name="confirm-password" v-model="registerForm.confirmPassword" :type="passwordVisibility.registerConfirm ? 'text' : 'password'" autocomplete="off" placeholder="Repeat password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.registerConfirm ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('registerConfirm')"
                                            >
                                                <i :class="passwordVisibility.registerConfirm ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="password-rules" aria-live="polite">
                                        <p class="password-rules-title">Password must include:</p>
                                        <ul class="password-rules-list">
                                            <li
                                                v-for="rule in registerPasswordRules"
                                                :key="rule.key"
                                                :class="['password-rule-item', rule.passed ? 'is-pass' : 'is-fail']"
                                            >
                                                <i :class="rule.passed ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                                                <span>{{ rule.label }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="input-group file-upload-group">
                                    <label for="reg-proof">Proof of Residency (Valid ID / Doc)</label>
                                    <div class="file-upload-wrapper">
                                        <input id="reg-proof" name="proofOfResidency" type="file" @change="handleFileUpload" accept="image/*,application/pdf" required class="file-input">
                                        <div class="upload-btn"><i class="fa-solid fa-cloud-arrow-up"></i> Choose File</div>
                                        <span class="file-name">{{ proofOfResidencyFile ? proofOfResidencyFile.name : 'No file chosen' }}</span>
                                    </div>
                                </div>

                                <div class="recaptcha-shell">
                                    <div id="g-recaptcha" class="recaptcha-container"></div>
                                </div>
                                <div class="legal-text">
                                    Protected by reCAPTCHA and subject to the Google 
                                    <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and 
                                    <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a>.
                                </div>
                                
                                <div class="input-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" v-model="registerForm.agreePrivacy"> I agree to the <a href="#" @click.prevent="showPrivacy(activeModal)">Privacy Policy</a>
                                    </label>
                                </div>

                                <button type="submit" class="auth-submit-btn" :disabled="isRegisterLoading || !registerForm.agreePrivacy">
                                    {{ isRegisterLoading ? 'Submitting...' : 'Submit Registration' }} <i :class="isRegisterLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user-plus'"></i>
                                </button>
                            </form>

                            <!-- OTP Form -->
                            <form v-else-if="activeModal === 'otp'" class="modern-form otp-form" @submit.prevent="handleVerifyOtp">
                                <p class="otp-instruction">We've sent a 6-digit verification code to your email. Check your inbox (or spam folder).</p>
                                <div class="input-group">
                                    <label for="otp-email">Email Address</label>
                                    <input id="otp-email" name="email" v-model="otpForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <div class="input-group">
                                    <label for="otp-code">6-Digit OTP Code</label>
                                    <input id="otp-code" name="otp" v-model="otpForm.code" type="text" autocomplete="one-time-code" required maxlength="6" class="otp-input" placeholder="• • • • • •">
                                </div>
                                <button type="submit" class="auth-submit-btn" :disabled="isOtpLoading">
                                    {{ isOtpLoading ? 'Verifying...' : 'Verify Email' }} <i :class="isOtpLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="handleResendOtp" :disabled="isResendOtpLoading || isOtpLoading">
                                    {{ isResendOtpLoading ? 'Resending...' : 'Resend OTP' }}
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'" :disabled="isOtpLoading">
                                    Cancel & Go to Login
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'forgot-password'" class="modern-form" @submit.prevent="handleForgotPassword">
                                <p class="otp-instruction">
                                    Enter the email address linked to your account. We will send a reset link if it exists.
                                </p>
                                <div class="input-group">
                                    <label for="forgot-email">Email Address</label>
                                    <input id="forgot-email" name="email" v-model="forgotPasswordForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    {{ forgotPasswordLoading ? 'Sending...' : 'Send Reset Link' }} <i class="fa-solid fa-paper-plane"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'" :disabled="forgotPasswordLoading">
                                    Back to Login
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'reset-password'" class="modern-form" @submit.prevent="handleResetPassword">
                                <p class="otp-instruction">
                                    Set a new password for your account. The reset link expires after 30 minutes.
                                </p>
                                <div class="input-group">
                                    <label for="reset-email">Email Address</label>
                                    <input id="reset-email" name="email" v-model="resetPasswordForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reset-password">New Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reset-password" name="password" v-model="resetPasswordForm.password" :type="passwordVisibility.reset ? 'text' : 'password'" autocomplete="off" placeholder="New password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.reset ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('reset')"
                                            >
                                                <i :class="passwordVisibility.reset ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reset-confirm">Confirm Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reset-confirm" name="confirm-password" v-model="resetPasswordForm.confirmPassword" :type="passwordVisibility.resetConfirm ? 'text' : 'password'" autocomplete="off" placeholder="Repeat password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.resetConfirm ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('resetConfirm')"
                                            >
                                                <i :class="passwordVisibility.resetConfirm ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    {{ resetPasswordLoading ? 'Updating...' : 'Update Password' }} <i class="fa-solid fa-key"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'" :disabled="resetPasswordLoading">
                                    Back to Login
                                </button>
                            </form>

                            <div v-else-if="activeModal === 'pending-approval'" class="modern-form pending-approval-view">
                                <div class="pending-status-icon">
                                    <i class="fa-solid fa-clock-rotate-left"></i>
                                </div>
                                <p class="otp-instruction">
                                    Thank you! Your email is verified. Please wait for <strong>Barangay Administrator approval</strong> before you can log in.
                                </p>
                                <div class="pending-info-card">
                                    <p><i class="fa-solid fa-info-circle"></i> Your registration is now under review by the barangay admin.</p>
                                    <p><i class="fa-solid fa-envelope"></i> We will notify you by email once your account has been approved.</p>
                                </div>
                                <button type="button" class="auth-submit-btn" @click="closeModal">
                                    Back to Homepage <i class="fa-solid fa-house"></i>
                                </button>
                            </div>

                            <!-- Privacy Policy Modal -->
                            <div v-else-if="activeModal === 'privacy'" class="modern-form privacy-policy-view">
                                <div class="privacy-header">
                                    <h2>Privacy Policy</h2>
                                    <button type="button" class="privacy-close-btn" @click="closeModal">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div class="privacy-content">
                                    <section class="privacy-section">
                                        <h3>1. Introduction</h3>
                                        <p>Barangay Irawan is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Barangay Management System.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>2. Information We Collect</h3>
                                        <p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
                                        <ul>
                                            <li><strong>Personal Data:</strong> Name, email address, phone number, address, birth date, and identification documents.</li>
                                            <li><strong>Barangay-Related Information:</strong> Resident status, household details, and civic participation records.</li>
                                            <li><strong>Usage Data:</strong> Log files, IP addresses, browser type, pages visited, and time spent on the platform.</li>
                                        </ul>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>3. How We Use Your Information</h3>
                                        <p>The information we collect is used for the following purposes:</p>
                                        <ul>
                                            <li>Processing document requests and applications.</li>
                                            <li>Managing appointments and facility reservations.</li>
                                            <li>Handling incident reports and complaints.</li>
                                            <li>Communicating barangay announcements and updates.</li>
                                            <li>Improving and personalizing your experience.</li>
                                            <li>Complying with legal obligations.</li>
                                        </ul>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>4. Data Protection &amp; Security</h3>
                                        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>5. Your Rights</h3>
                                        <p>You have the right to access, correct, update, or request deletion of your personal information. Contact us at <strong>barangay.irawan@email.com</strong> to exercise these rights.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>6. Contact Us</h3>
                                        <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
                                        <p><strong>Barangay Irawan</strong><br>Email: barangay.irawan@email.com<br>Phone: (555) 123-4567</p>
                                    </section>

                                    <section class="privacy-section privacy-last">
                                        <p class="privacy-updated">Last Updated: May 2026</p>
                                    </section>
                                </div>

                                <div class="privacy-footer">
                                    <button type="button" class="auth-submit-btn" @click="openModal('register')">
                                        I Understand <i class="fa-solid fa-check"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Privacy Overlay (preserve underlying modal DOM) -->
                            <div v-if="privacyOverlay" class="modern-form privacy-policy-view privacy-overlay">
                                <div class="privacy-header">
                                    <h2>Privacy Policy</h2>
                                    <button type="button" class="privacy-close-btn" @click="hidePrivacyOverlay">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div class="privacy-content">
                                    <section class="privacy-section">
                                        <h3>1. Introduction</h3>
                                        <p>Barangay Irawan ("we," "us," "our," or "the Barangay") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Barangay Management System.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>2. Information We Collect</h3>
                                        <p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
                                        <ul>
                                            <li><strong>Personal Data:</strong> Name, email address, phone number, address, birth date, and identification documents.</li>
                                            <li><strong>Barangay-Related Information:</strong> Resident status, household details, and civic participation records.</li>
                                            <li><strong>Usage Data:</strong> Log files, IP addresses, browser type, pages visited, and time spent on the platform.</li>
                                        </ul>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>3. How We Use Your Information</h3>
                                        <p>The information we collect is used for the following purposes:</p>
                                        <ul>
                                            <li>Processing document requests and applications.</li>
                                            <li>Managing appointments and facility reservations.</li>
                                            <li>Handling incident reports and complaints.</li>
                                            <li>Communicating barangay announcements and updates.</li>
                                            <li>Improving and personalizing your experience.</li>
                                            <li>Complying with legal obligations.</li>
                                        </ul>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>4. Data Protection &amp; Security</h3>
                                        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>5. Your Rights</h3>
                                        <p>You have the right to access, correct, update, or request deletion of your personal information. Contact us at <strong>barangay.irawan@email.com</strong> to exercise these rights.</p>
                                    </section>

                                    <section class="privacy-section">
                                        <h3>6. Contact Us</h3>
                                        <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
                                        <p><strong>Barangay Irawan</strong><br>Email: barangay.irawan@email.com<br>Phone: (555) 123-4567</p>
                                    </section>

                                    <section class="privacy-section privacy-last">
                                        <p class="privacy-updated">Last Updated: May 2026</p>
                                    </section>
                                </div>

                                <div class="privacy-footer">
                                    <button type="button" class="auth-submit-btn" @click.prevent="hidePrivacyOverlay">
                                        I Understand <i class="fa-solid fa-check"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import AnnouncementSlideshow from '@/components/AnnouncementSlideshow.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch } from '@/shared/client';
import { useLandingAuth } from '@/composables/useLandingAuth';
import { useRecaptcha } from '@/composables/useRecaptcha';
import { usePasswordReset } from '@/composables/usePasswordReset';

// Composables
const { loginForm, registerForm, proofOfResidencyFile, otpForm, loginResident, registerResident, verifyOtp, resendOtp, handleFileUpload, getPendingOtpEmail, setPendingOtpEmail, clearPendingOtpEmail } = useLandingAuth();
const { recaptchaReady, ensureRecaptchaReady, renderRecaptchaCheckbox, getRecaptchaToken, resetRecaptcha, cleanupRecaptchaWidget } = useRecaptcha();
const { forgotPasswordForm, resetPasswordForm, forgotPasswordLoading, resetPasswordLoading, hydrateResetPasswordFromUrl, requestPasswordReset, submitPasswordReset } = usePasswordReset();

// Local state
const activeModal = ref('');
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const pendingOtpEmail = ref(getPendingOtpEmail());
const guestDocumentFormDefaults = {
    documentType: 'barangay_clearance',
    purpose: '',
    requestDetails: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    agreePrivacy: false
};
const guestDocumentForm = reactive({ ...guestDocumentFormDefaults });
const guestReportFormDefaults = {
    reportType: 'noise_complaint',
    description: '',
    locationText: '',
    incidentDate: '',
    priority: 'medium',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    agreePrivacy: false
};
const guestReportForm = reactive({ ...guestReportFormDefaults });
const guestReservationFormDefaults = {
    facilityName: 'covered_court',
    reservationDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    reservationDetails: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    agreePrivacy: false
};
const guestReservationForm = reactive({ ...guestReservationFormDefaults });

// Ensure privacy flag exists on register form (composable may not include it)
if (registerForm.agreePrivacy === undefined) {
    registerForm.agreePrivacy = false;
}
const passwordVisibility = reactive({
    login: false,
    register: false,
    registerConfirm: false,
    reset: false,
    resetConfirm: false
});

const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const isStrongPassword = (password) => {
    const value = String(password || '');
    return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && PASSWORD_SPECIAL_CHAR_REGEX.test(value);
};

const registerPasswordRules = computed(() => {
    const password = registerForm.password || '';
    return [
        { key: 'min-length', label: 'At least 8 characters', passed: password.length >= 8 },
        { key: 'uppercase', label: 'At least 1 uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
        { key: 'number', label: 'At least 1 number (0-9)', passed: /\d/.test(password) },
        { key: 'special', label: 'At least 1 special character', passed: PASSWORD_SPECIAL_CHAR_REGEX.test(password) }
    ];
});

const registerPasswordStrong = computed(() => isStrongPassword(registerForm.password));

const togglePasswordVisibility = (field) => {
    passwordVisibility[field] = !passwordVisibility[field];
};

const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
};

const setStatus = (message, isError = false) => {
    clearToast();

    if (!message) {
        return;
    }

    toastMessage.value = message;
    toastType.value = isError ? 'error' : 'success';
    toastTimer = setTimeout(() => {
        clearToast();
    }, 3500);
};

const resumeOtpVerification = () => {
    const email = pendingOtpEmail.value || getPendingOtpEmail();
    if (!email) {
        setStatus('Please register first to receive an OTP.', true);
        return;
    }

    pendingOtpEmail.value = email;
    otpForm.email = email;
    openModal('otp');
};

const officials = ref([]);
const officialsLoading = ref(false);
const positionOrder = {
    'Barangay Captain': 1,
    'Barangay Secretary': 2,
    'Barangay Treasurer': 3,
    'Barangay Kagawad': 4,
    'Other': 5
};

const sortedOfficials = computed(() => {
    return [...officials.value].sort((a, b) => {
        const orderA = positionOrder[a.position] || 99;
        const orderB = positionOrder[b.position] || 99;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return String(a.name || '').localeCompare(String(b.name || ''));
    });
});

const getOfficialInitials = (official) => {
    const names = String(official.name || '').split(' ').filter(Boolean);
    if (!names.length) return 'BI';
    return names.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

const loadOfficials = async () => {
    officialsLoading.value = true;
    try {
        const response = await apiFetch('/appointments/officials');
        officials.value = response.data || response;
    } catch (error) {
        console.error('Failed to load officials:', error);
    } finally {
        officialsLoading.value = false;
    }
};

const setupScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate-section').forEach((section) => observer.observe(section));
};

const loadOfficialsAndAnimations = async () => {
    await loadOfficials();
    setupScrollAnimations();
};

const loadRecaptcha = () => {
    return ensureRecaptchaReady()
        .then(() => {
            renderRecaptchaCheckbox();
        })
        .catch((error) => {
            console.error('reCaptcha loading error:', error);
            setStatus('reCaptcha failed to load. Please refresh the page.', true);
        });
};

// UI helpers
const modalTitles = {
    login: 'Resident Login',
    register: 'Resident Registration',
    otp: 'Email Verification',
    'forgot-password': 'Forgot Password',
    'reset-password': 'Reset Password',
    'pending-approval': 'Registration Received',
    'guest-document-request': 'Non-Resident Document Request',
    'guest-report-request': 'Non-Resident Incident Report',
    'guest-facility-request': 'Non-Resident Facility Request'
};

const visualTitles = {
    login: 'Welcome Back!',
    register: 'Join Our Community',
    otp: 'Verify Your Email',
    'forgot-password': 'Reset Access Safely',
    'reset-password': 'Choose a New Password',
    'pending-approval': 'Account Pending Approval',
    'guest-document-request': 'Request Without Registration',
    'guest-report-request': 'Report Without Registration',
    'guest-facility-request': 'Reserve Without Registration'
};

const visualCopies = {
    login: 'Access your digital barangay services, view announcements, and request documents seamlessly.',
    register: 'Create an account to streamline your document requests, appointments, and report submissions.',
    otp: 'We need to verify your email to secure your resident account.',
    'forgot-password': 'We will send a secure reset link to the email address attached to your account.',
    'reset-password': 'Set a new password to restore access to your resident portal.',
    'pending-approval': 'Your registration has been verified and is now being reviewed by the Barangay Admin.',
    'guest-document-request': 'Non-residents may submit a document request here. The admin will review your details and send an update to your Gmail address.',
    'guest-report-request': 'Non-residents may file incident reports or community concerns. The admin will review the report and respond by email.',
    'guest-facility-request': 'Non-residents may submit facility reservations. The barangay admin will review your request and contact you by email.'
};

const getModalTitle = (mode) => modalTitles[mode] || 'Resident Portal';
const getVisualTitle = (mode) => visualTitles[mode] || 'Resident Portal';
const getVisualCopy = (mode) => visualCopies[mode] || 'Access barangay services securely from any device.';

const getToggleLabel = (mode) => {
    if (mode === 'login') return 'Create an account';
    if (mode === 'register') return 'Log in here';
    if (mode === 'forgot-password' || mode === 'reset-password') return 'Back to Login';
    return 'Log in here';
};

const switchAuthMode = () => {
    if (activeModal.value === 'login') {
        activeModal.value = 'register';
        return;
    }

    if (activeModal.value === 'register') {
        activeModal.value = 'login';
        return;
    }

    activeModal.value = 'login';
};

const openModal = (mode) => {
    const prev = activeModal.value;
    // If we're leaving the register modal, clean up the recaptcha widget to avoid stale DOM/state
    if (prev === 'register' && mode !== 'register') {
        cleanupRecaptchaWidget();
    }

    activeModal.value = mode;
    setStatus('');
    if (mode === 'guest-document-request') {
        resetGuestDocumentForm();
    }
    if (mode === 'guest-report-request') {
        resetGuestReportForm();
    }
    if (mode === 'guest-facility-request') {
        resetGuestReservationForm();
    }
    if (mode === 'otp' && !otpForm.email) {
        otpForm.email = getPendingOtpEmail();
    }
    if (mode !== 'reset-password') {
        resetPasswordForm.resetToken = '';
        resetPasswordForm.password = '';
        resetPasswordForm.confirmPassword = '';
    }
    // Pre-load reCaptcha script when registration modal opens
    if (mode === 'register') {
        // Use nextTick to ensure DOM is updated before loading recaptcha
        nextTick(() => {
            loadRecaptcha();
        });
    }
};

// Privacy overlay helpers: show policy as an overlay so underlying modal DOM (e.g. register) stays mounted
const privacyOverlay = ref(false);
const privacyPrevModal = ref('');

const showPrivacy = (prev = '') => {
    privacyPrevModal.value = prev || '';
    privacyOverlay.value = true;
};

const hidePrivacyOverlay = () => {
    privacyOverlay.value = false;
    // We intentionally do not change activeModal here; the underlying modal remains as it was
};

const closeModal = () => {
    // Clear recaptcha container when closing register modal to avoid stale state
    if (activeModal.value === 'register') {
        cleanupRecaptchaWidget();
    }
    clearToast();
    activeModal.value = '';
};

const isLoginLoading = ref(false);

const handleLogin = async () => {
    if (isLoginLoading.value) return;
    isLoginLoading.value = true;
    try {
        const result = await loginResident(loginForm);
        if (!result.success) {
            setStatus(result.message, true);
            return;
        }
        setStatus('');
    } finally {
        isLoginLoading.value = false;
    }
};

const isRegisterLoading = ref(false);

const handleRegister = async () => {
    if (isRegisterLoading.value) return;
    if (!registerForm.agreePrivacy) {
        setStatus('Please accept the Privacy Policy before registering.', true);
        return;
    }
    if (!registerPasswordStrong.value) {
        setStatus('Password does not meet all required security rules yet.', true);
        return;
    }

    isRegisterLoading.value = true;
    try {
        const recaptchaToken = getRecaptchaToken();
        const result = await registerResident(registerForm, proofOfResidencyFile.value, recaptchaToken);
        if (result.success) {
            otpForm.email = result.email;
            pendingOtpEmail.value = result.email;
            setPendingOtpEmail(result.email);
            openModal('otp');
            setStatus(result.message, false);
        } else {
            setStatus(result.message, true);
            resetRecaptcha();
        }
    } finally {
        isRegisterLoading.value = false;
    }
};

const isOtpLoading = ref(false);

const handleVerifyOtp = async () => {
    if (isOtpLoading.value) return;
    isOtpLoading.value = true;
    try {
        const result = await verifyOtp(otpForm);
        if (result.success) {
            openModal('pending-approval');
            otpForm.code = '';
            pendingOtpEmail.value = '';
            clearPendingOtpEmail();
        } else {
            setStatus(result.message, true);
        }
    } finally {
        isOtpLoading.value = false;
    }
};

const isResendOtpLoading = ref(false);

const handleResendOtp = async () => {
    if (isResendOtpLoading.value) return;
    isResendOtpLoading.value = true;
    try {
        const result = await resendOtp(otpForm);
        setStatus(result.message, !result.success);
    } finally {
        isResendOtpLoading.value = false;
    }
};

const handleForgotPassword = async () => {
    const result = await requestPasswordReset();
    if (result.success) {
        activeModal.value = 'login';
        setStatus(result.message, false);
    } else {
        setStatus(result.message, true);
    }
};

const handleResetPassword = async () => {
    if (resetPasswordForm.password && !isStrongPassword(resetPasswordForm.password)) {
        setStatus('Use a stronger password before submitting the reset form.', true);
        return;
    }

    const result = await submitPasswordReset();
    if (result.success) {
        activeModal.value = 'login';
        setStatus(result.message, false);
    } else {
        setStatus(result.message, true);
    }
};

const resetGuestDocumentForm = () => {
    Object.assign(guestDocumentForm, guestDocumentFormDefaults);
};

const resetGuestReportForm = () => {
    Object.assign(guestReportForm, guestReportFormDefaults);
};

const resetGuestReservationForm = () => {
    Object.assign(guestReservationForm, guestReservationFormDefaults);
};

const isGuestDocumentLoading = ref(false);

const handleGuestDocumentRequest = async () => {
    if (isGuestDocumentLoading.value) return;
    if (!guestDocumentForm.agreePrivacy) {
        setStatus('Please accept the Privacy Policy before submitting your request.', true);
        return;
    }

    isGuestDocumentLoading.value = true;
    try {
        const payload = {
            ...guestDocumentForm,
            email: String(guestDocumentForm.email || '').trim().toLowerCase(),
            firstName: String(guestDocumentForm.firstName || '').trim(),
            middleName: String(guestDocumentForm.middleName || '').trim(),
            lastName: String(guestDocumentForm.lastName || '').trim(),
            suffix: String(guestDocumentForm.suffix || '').trim(),
            contactNumber: String(guestDocumentForm.contactNumber || '').trim(),
            address: String(guestDocumentForm.address || '').trim(),
            purpose: String(guestDocumentForm.purpose || '').trim(),
            requestDetails: String(guestDocumentForm.requestDetails || '').trim()
        };

        const result = await apiFetch('/document-requests/public', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        resetGuestDocumentForm();
        closeModal();
        setStatus(`Request submitted. We will send the decision to ${result.email || payload.email}.`, false);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        isGuestDocumentLoading.value = false;
    }
};

const isGuestReportLoading = ref(false);

const handleGuestReportRequest = async () => {
    if (isGuestReportLoading.value) return;
    if (!guestReportForm.agreePrivacy) {
        setStatus('Please accept the Privacy Policy before submitting your report.', true);
        return;
    }

    isGuestReportLoading.value = true;
    try {
        const payload = {
            ...guestReportForm,
            reportType: String(guestReportForm.reportType || '').trim(),
            description: String(guestReportForm.description || '').trim(),
            locationText: String(guestReportForm.locationText || '').trim(),
            incidentDate: guestReportForm.incidentDate || undefined,
            priority: guestReportForm.priority,
            firstName: String(guestReportForm.firstName || '').trim(),
            middleName: String(guestReportForm.middleName || '').trim(),
            lastName: String(guestReportForm.lastName || '').trim(),
            suffix: String(guestReportForm.suffix || '').trim(),
            contactNumber: String(guestReportForm.contactNumber || '').trim(),
            email: String(guestReportForm.email || '').trim().toLowerCase(),
            address: String(guestReportForm.address || '').trim()
        };

        const result = await apiFetch('/reports/public', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        resetGuestReportForm();
        closeModal();
        setStatus(`Report submitted. We will send the update to ${result.email || payload.email}.`, false);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        isGuestReportLoading.value = false;
    }
};

const isGuestReservationLoading = ref(false);

const handleGuestReservationRequest = async () => {
    if (isGuestReservationLoading.value) return;
    if (!guestReservationForm.agreePrivacy) {
        setStatus('Please accept the Privacy Policy before submitting your reservation request.', true);
        return;
    }

    isGuestReservationLoading.value = true;
    try {
        const payload = {
            ...guestReservationForm,
            facilityName: String(guestReservationForm.facilityName || '').trim(),
            reservationDate: guestReservationForm.reservationDate,
            startTime: String(guestReservationForm.startTime || '').trim(),
            endTime: String(guestReservationForm.endTime || '').trim(),
            purpose: String(guestReservationForm.purpose || '').trim(),
            reservationDetails: String(guestReservationForm.reservationDetails || '').trim(),
            firstName: String(guestReservationForm.firstName || '').trim(),
            middleName: String(guestReservationForm.middleName || '').trim(),
            lastName: String(guestReservationForm.lastName || '').trim(),
            suffix: String(guestReservationForm.suffix || '').trim(),
            contactNumber: String(guestReservationForm.contactNumber || '').trim(),
            email: String(guestReservationForm.email || '').trim().toLowerCase(),
            address: String(guestReservationForm.address || '').trim()
        };

        const result = await apiFetch('/facility-reservations/public', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        resetGuestReservationForm();
        closeModal();
        setStatus(`Facility request submitted. We will send the update to ${result.email || payload.email}.`, false);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        isGuestReservationLoading.value = false;
    }
};

const services = [
    { icon: '👥', title: 'Document Requests', copy: 'Submit a barangay document request even if you are not a registered resident.', action: 'guest-document-request' },
    { icon: '🗓', title: 'Appointments & Facilities', copy: 'Schedule meetings and reserve community facilities easily.', action: 'guest-facility-request' },
    { icon: '🔔', title: 'Real-Time Announcements', copy: 'Stay updated with barangay news, advisories, and public information.' },
    { icon: '🛡', title: 'Incident Reporting', copy: 'Submit complaints and track resolution progress.', action: 'guest-report-request' },
    { icon: '📍', title: 'Disaster Management', copy: 'Receive emergency alerts and access support information.' },
    { icon: '🏢', title: 'Community Hub', copy: 'Connect with your barangay and access essential services.' }
];

const handleServiceClick = (service) => {
    if (service.action) {
        openModal(service.action);
    }
};

const announcements = [
    { title: 'Community Cleanup Drive', copy: 'Saturday, 7:00 AM at the covered court assembly area. Volunteers are encouraged to register in advance.' },
    { title: 'Document Request Window', copy: 'Certificate processing runs from 8:00 AM to 4:00 PM on weekdays with pickup notices posted inside the portal.' },
    { title: 'Facility Booking Reminder', copy: 'Residents are advised to check available slots before sending reservation requests for the multi-purpose hall.' }
];

onMounted(() => {
    console.log('[LandingApp] onMounted hook called');

    loadRecaptcha().catch(() => {
        // The register flow will show a visible error if the script never becomes available.
    });
    
    const pendingEmail = getPendingOtpEmail();
    if (pendingEmail) {
        pendingOtpEmail.value = pendingEmail;
        otpForm.email = pendingEmail;
        console.log('[LandingApp] Restored pending OTP email:', pendingEmail);
    }

    const hasReset = hydrateResetPasswordFromUrl();
    if (hasReset) {
        activeModal.value = 'reset-password';
        setStatus('Create a new password to finish resetting your account.', false);
    }
    
    console.log('[LandingApp] Preloading hero background image');
    const img = new Image();
    img.src = '/images/hero-bg.jpg';
    img.onload = () => {
        console.log('[LandingApp] ✓ Hero image loaded successfully');
    };
    img.onerror = () => {
        console.log('[LandingApp] ℹ Hero image not found, fallback color will be used');
    };
    
    console.log('[LandingApp] Preloading fonts');
    if (document.fonts && document.fonts.load) {
        try {
            document.fonts.load('600 24px Fraunces');
            document.fonts.load('400 16px Manrope');
            console.log('[LandingApp] ✓ Fonts preload initiated');
        } catch (e) {
            console.log('[LandingApp] Font preload error (non-critical):', e.message);
        }
    }

    Promise.resolve().then(loadOfficialsAndAnimations);
    console.log('[LandingApp] ✓ Component fully initialized and visible');
});

</script>

<style scoped>
/* Highly Attractive Modern Split Auth Modal Styles */

.auth-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(16, 12, 10, 0.4);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.auth-modal-container {
    display: flex;
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(22, 36, 26, 0.08);
    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.35);
    width: 100%;
    max-width: 900px;
    min-height: 550px;
    max-height: calc(100vh - 40px);
    position: relative;
    overflow: hidden;
    transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.auth-modal-container.is-register {
    max-width: 1100px;
}

.auth-modal-container.is-request {
    max-width: 1120px;
}

.auth-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #1a1a1a;
    font-size: 1.2rem;
    border: none;
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.auth-modal-close:hover {
    background: #1a1a1a;
    color: white;
    transform: rotate(90deg) scale(1.1);
}

/* Left Visual Side (Image/Branding) */
.auth-modal-visual {
    flex: 0 0 400px;
    background: url('/images/hero-bg.jpg') center/cover no-repeat;
    position: relative;
    display: flex;
    padding: 40px;
    flex-direction: column;
    justify-content: flex-end;
}

.visual-overlay {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(90deg, rgba(82, 12, 12, 0.8), rgba(16, 82, 36, 0.95)),
        linear-gradient(180deg, rgba(190, 0, 5, 0.3) 0%, rgba(16, 82, 36, 0.95) 100%);
    backdrop-filter: blur(2px);
    z-index: 1;
}

.visual-content {
    position: relative;
    z-index: 2;
    color: white;
}

.visual-text {
    margin-top: auto;
    padding-top: 40px;
}

.visual-text h3 {
    font-family: "Fraunces", serif;
    font-size: 2.2rem;
    line-height: 1.1;
    margin-bottom: 15px;
    color: #ffffff;
}

.visual-text p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
}

/* Right Form Side */
.auth-modal-form-area {
    flex: 1;
    padding: 50px 60px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    position: relative;
    height: 100%;
    min-height: 0;
    max-height: 90vh;
    overflow-y: auto;
}

.form-transition-wrapper {
    width: 100%;
}

.form-header {
    margin-bottom: 36px;
}

.modal-helper-copy {
    margin-top: 12px;
    font-size: 0.95rem;
    line-height: 1.55;
    color: #4f5f56;
}

.form-header h2 {
    font-family: inherit;
    font-size: 2rem;
    color: #1a1a1a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.auth-toggle {
    font-size: 0.95rem;
    color: #5e6f66;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 12px;
}

.toggle-text {
    display: inline;
}

.toggle-link {
    background: none;
    border: none;
    padding: 0;
    font-weight: 600;
    color: #16241a;
    cursor: pointer;
    font-size: inherit;
    text-decoration: underline;
    text-decoration-color: rgba(22, 36, 26, 0.3);
    text-underline-offset: 4px;
    transition: all 0.2s;
    display: inline;
    white-space: nowrap;
}

.toggle-link:hover {
    color: #a41c1c;
    text-decoration-color: #a41c1c;
}

.modern-form {
    display: grid;
    gap: 22px;
}

.guest-request-banner {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 14px;
    align-items: start;
    padding: 18px 18px 16px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(213, 42, 42, 0.08), rgba(35, 91, 130, 0.08));
    border: 1px solid rgba(22, 36, 26, 0.08);
}

.guest-request-banner i {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: #ffffff;
    color: #b50009;
    box-shadow: 0 10px 18px rgba(34, 40, 52, 0.08);
}

.guest-request-banner strong {
    display: block;
    font-size: 1rem;
    margin-bottom: 4px;
}

.guest-request-banner p {
    margin: 0;
    color: #4f5f56;
    line-height: 1.5;
}

.two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a1a;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-wrapper > i {
    position: absolute;
    left: 16px;
    color: #8b9d93;
    font-size: 1.1rem;
    pointer-events: none;
}

.input-wrapper input {
    padding-left: 44px !important;
}

/* Hide native browser password reveal/clear icons to avoid duplicate controls */
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
    display: none;
}

/* Additional vendor selectors for Chrome/Edge (Blink) to hide password reveal/clear */
input[type="password"]::-webkit-clear-button,
input[type="password"]::-webkit-password-toggle-button,
input[type="password"]::-webkit-credentials-auto-fill-button {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
}

.input-wrapper.has-toggle input {
    padding-right: 48px !important;
    min-height: 54px;
}

.password-toggle-btn {
    position: absolute;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #5e6f66;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
}

.password-toggle-btn i {
    position: static;
    color: #415349 !important;
    font-size: 1rem;
    pointer-events: none;
}

.password-toggle-btn:hover {
    background: #e8eeea;
    color: #16241a;
}

.password-rules {
    grid-column: 1 / -1;
    border-radius: 14px;
    border: 1px solid #e2e8e5;
    background: #f8faf9;
    padding: 12px 14px;
}

.password-rules-title {
    margin: 0 0 8px;
    font-size: 0.86rem;
    color: #4f5f56;
    font-weight: 600;
}

.password-rules-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
}

.password-rule-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.86rem;
}

.password-rule-item.is-fail {
    color: #c53a3a;
}

.password-rule-item.is-pass {
    color: #2c8a4e;
}

.input-group input,
.input-group select,
.input-group textarea {
    width: 100%;
    border-radius: 14px;
    border: 2px solid #e2e8e5;
    background: #f8faf9;
    padding: 15px 18px;
    font-size: 1rem;
    color: #1a1a1a;
    transition: all 0.3s ease;
    font-family: inherit;
}

.input-group input:hover,
.input-group select:hover,
.input-group textarea:hover {
    background: #f0f4f2;
}

.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
    background: #ffffff;
    border-color: #1a1a1a;
    outline: none;
    box-shadow: 0 0 0 4px rgba(22, 36, 26, 0.08);
}

.input-group textarea {
    min-height: 120px;
    resize: vertical;
}

.custom-select {
    position: relative;
}

.custom-select i {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #8b9d93;
    pointer-events: none;
}

.custom-select select {
    appearance: none;
    -webkit-appearance: none;
}

/* File Upload Beauty */
.file-upload-group {
    grid-column: 1 / -1;
}
.file-upload-wrapper {
    position: relative;
    border: 2px dashed #cbd5d0;
    padding: 20px;
    border-radius: 14px;
    background: #f8faf9;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s;
}
.file-upload-wrapper:hover {
    border-color: #1a1a1a;
    background: #f0f4f2;
}
.file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
}
.upload-btn {
    background: #1a1a1a;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    pointer-events: none;
}
.file-name {
    color: #5e6f66;
    font-size: 0.95rem;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.recaptcha-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
    grid-column: 1 / -1;
    width: 100%;
    min-height: 78px;
    overflow: hidden;
}

.recaptcha-shell {
    display: grid;
    gap: 8px;
    grid-column: 1 / -1;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

@media (max-width: 480px) {
    .recaptcha-container {
        transform: scale(0.9);
        transform-origin: center;
        margin: 0;
        min-height: 90px;
    }
    
    .recaptcha-shell {
        padding: 0 5px;
    }
}

.recaptcha-loading {
    margin: 0;
    text-align: center;
    font-size: 0.9rem;
    color: #5e6f66;
}

.legal-text {
    text-align: center;
    font-size: 0.8rem;
    color: #8b9d93;
    grid-column: 1 / -1;
    margin-bottom: 6px;
}

.legal-text a {
    color: #5e6f66;
    font-weight: 600;
}

/* Checkbox Label Alignment */
.checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    color: #1a1a1a;
    cursor: pointer;
    font-weight: 400;
    line-height: 1.5;
    grid-column: 1 / -1;
}

.checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    cursor: pointer;
    accent-color: #16241a;
    border-radius: 4px;
    border: 2px solid #e2e8e5;
    background: #ffffff;
    transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:hover {
    border-color: #16241a;
    box-shadow: 0 0 0 3px rgba(22, 36, 26, 0.08);
}

.checkbox-label input[type="checkbox"]:checked {
    background: #16241a;
    border-color: #16241a;
}

.checkbox-label a {
    color: #16241a;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.checkbox-label a:hover {
    color: #2a4531;
    border-bottom-color: #2a4531;
}

/* Primary Form Submit Button */
.auth-submit-btn {
    background: linear-gradient(135deg, #16241a, #2a4531);
    color: white;
    border: none;
    padding: 18px 24px;
    border-radius: 14px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s ease;
    grid-column: 1 / -1;
    box-shadow: 0 8px 20px rgba(22, 36, 26, 0.2);
}

.auth-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(22, 36, 26, 0.3);
    background: linear-gradient(135deg, #101c13, #1e3323);
}

.auth-submit-btn i {
    font-size: 1.1rem;
    transition: transform 0.3s;
}

.auth-submit-btn:hover i {
    transform: translateX(4px);
}

.auth-secondary-btn {
    background: transparent;
    color: #5e6f66;
    border: 2px solid #e2e8e5;
    padding: 16px 24px;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    grid-column: 1 / -1;
}

.auth-secondary-btn:hover {
    background: #f0f4f2;
    border-color: #cbd5d0;
    color: #1a1a1a;
}

/* OTP Specific */
.otp-instruction {
    text-align: center;
    color: #5e6f66;
    line-height: 1.6;
    margin-bottom: 10px;
}
.otp-input {
    text-align: center;
    font-size: 2rem !important;
    letter-spacing: 12px;
    padding: 20px !important;
    font-family: monospace;
    font-weight: bold;
}

/* Pending Approval View */
.pending-status-icon {
    display: flex;
    justify-content: center;
    font-size: 4rem;
    color: #4a90e2;
    margin-bottom: 20px;
    animation: pulse-ring 2s infinite ease-in-out;
}

@keyframes pulse-ring {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
}

.pending-info-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
    border: 1px solid #e2e8f0;
}

.pending-info-card p {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 0.95rem;
    color: #475569;
    line-height: 1.5;
}

.pending-info-card p:last-child {
    margin-bottom: 0;
}

.pending-info-card i {
    margin-top: 3px;
    color: #4a90e2;
}

/* Privacy Policy Modal */
.privacy-policy-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0 !important;
    height: 100%;
}

.privacy-header {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 40px;
    border-bottom: 1px solid #e2e8e5;
    background: #ffffff;
    z-index: 10;
}

.privacy-header h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
}

.privacy-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #f5f5f5;
    color: #1a1a1a;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.privacy-close-btn:hover {
    background: #e0e0e0;
    transform: rotate(90deg);
}

.privacy-content {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0 40px;
}

.privacy-section {
    margin-bottom: 28px;
    line-height: 1.7;
    padding-top: 24px;
}

.privacy-section:first-child {
    padding-top: 0;
}

.privacy-section h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
}

.privacy-section p {
    color: #4f5f56;
    font-size: 0.95rem;
    margin: 0 0 12px 0;
}

.privacy-section ul {
    margin: 12px 0;
    padding-left: 24px;
    color: #4f5f56;
    font-size: 0.95rem;
}

.privacy-section li {
    margin-bottom: 8px;
    line-height: 1.6;
}

.privacy-last {
    border-top: 1px solid #e2e8e5;
    padding-top: 20px;
    margin-top: 28px;
}

.privacy-updated {
    font-size: 0.85rem;
    color: #8b9d93;
    font-style: italic;
    margin: 0 0 24px;
}

.privacy-footer {
    flex: 0 0 auto;
    padding: 24px 40px;
    border-top: 1px solid #e2e8e5;
    background: #f8faf9;
    display: flex;
    gap: 12px;
}

.privacy-footer .auth-submit-btn {
    flex: 1;
}

/* Slide Transition Between Forms */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(15px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}

/* Responsive */
@media (max-width: 900px) {
    .auth-modal-backdrop {
        align-items: flex-start;
    }

    .auth-modal-container {
        flex-direction: column;
        max-width: 540px !important;
        max-height: calc(100vh - 40px);
        margin: auto;
    }

    .auth-modal-visual {
        display: flex;
        flex: 0 0 auto;
        min-height: 180px;
        padding: 22px 22px 18px;
        justify-content: flex-end;
    }

    .visual-content {
        width: 100%;
    }

    .visual-text {
        padding-top: 16px;
    }

    .visual-text h3 {
        font-size: 1.55rem;
        margin-bottom: 10px;
    }

    .visual-text p {
        font-size: 0.95rem;
    }

    .auth-modal-form-area {
        padding: 34px 24px 30px;
        max-height: none;
    }

    .two-col-grid {
        grid-template-columns: 1fr;
        gap: 22px;
    }
}
@media (max-width: 480px) {
    .auth-modal-container {
        max-height: calc(100vh - 20px);
        border-radius: 22px;
    }

    .modern-form {
        gap: 18px;
    }

    .input-group {
        min-width: 0;
        overflow: hidden;
    }

    .input-group input,
    .input-group select {
        font-size: 16px;
        padding: 12px 14px;
    }

    .input-wrapper input {
        padding-left: 40px !important;
    }

    .auth-modal-visual {
        min-height: 150px;
        padding: 18px;
    }

    .visual-text h3 {
        font-size: 1.35rem;
    }

    .visual-text p {
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .auth-modal-form-area {
        padding: 26px 18px 24px;
    }
    .form-header h2 {
        font-size: 1.8rem;
    }
    .auth-modal-backdrop {
        padding: 10px;
    }
}

.animate-section {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 1.2s ease, transform 1.2s ease;
}
.animate-section.in-view {
    opacity: 1;
    transform: translateY(0);
}
.animate-section.slide-left {
    transform: translateX(-24px);
}
.animate-section.slide-right {
    transform: translateX(24px);
}
.animate-section.slide-up {
    transform: translateY(24px);
}
.animate-section.in-view.slide-left,
.animate-section.in-view.slide-right,
.animate-section.in-view.slide-up {
    transform: translateX(0) translateY(0);
}

.landing-officials-section {
    padding: 60px 0;
}

.officials-sections {
    display: flex;
    flex-direction: column;
    gap: 48px;
    margin-top: 32px;
}

.officials-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 40px;
    padding: 0 20px;
}

.captain-row {
    display: flex;
    justify-content: center;
}

.captain-row .official-card {
    width: 280px;
}

.dual-row {
    display: flex;
    justify-content: center;
    gap: 48px;
}

.dual-row .official-card {
    width: 280px;
}

.kagawad-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    max-width: 1000px;
    margin: 0 auto;
}

.other-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 40px;
}

.official-card {
    display: grid;
    gap: 20px;
    align-items: center;
    text-align: center;
    padding: 16px 0;
}

.official-avatar {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    margin: 0 auto;
    background: #e9f2ec;
    background-size: cover;
    background-position: center;
    display: grid;
    place-items: center;
    color: #2f4f3c;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.official-copy strong {
    display: block;
    font-size: 1.1rem;
    margin-bottom: 6px;
    font-weight: 600;
    color: #1a1a1a;
}

.official-copy small {
    color: #5e6f66;
    font-size: 0.95rem;
    display: block;
}

.officials-loading,
.empty-state {
    text-align: center;
    color: #55635a;
    font-size: 1rem;
    padding: 40px 20px;
}

@media (max-width: 1024px) {
    .kagawad-row {
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
        max-width: 100%;
    }
}

@media (max-width: 768px) {
    .officials-row {
        gap: 32px;
        padding: 0 16px;
    }

    .dual-row .official-card {
        width: 240px;
    }

    .captain-row .official-card {
        width: 240px;
    }

    .official-avatar {
        width: 120px;
        height: 120px;
        font-size: 1.5rem;
    }

    .official-copy strong {
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .officials-sections {
        gap: 32px;
        margin-top: 24px;
    }

    .officials-row {
        gap: 20px;
        padding: 0 12px;
    }

    .dual-row {
        gap: 16px;
    }

    .dual-row .official-card {
        width: 160px;
    }

    .captain-row .official-card {
        width: 180px;
    }

    .kagawad-row {
        gap: 16px;
    }

    .official-avatar {
        width: 100px;
        height: 100px;
        font-size: 1.3rem;
    }

    .official-copy strong {
        font-size: 0.9rem;
    }

    .official-copy small {
        font-size: 0.85rem;
    }
}
</style>

<style scoped>
/* VMG Cards */
.landing-vmg-section {
    padding: 48px 0 72px;
}
.vmg-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    align-items: stretch;
    margin-top: 20px;
}
.vmg-card {
    position: relative;
    overflow: hidden;
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 14px;
    background: transparent;
}
.vmg-card .vmg-card-bg {
    position: absolute;
    inset: 0;
    background-image: url('/images/hero-logo.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 200px 200px;
    filter: saturate(0.9) brightness(0.95);
    opacity: 0.95;
}
.vmg-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.88);
    display: block;
    border-radius: inherit;
}
.vmg-copy { position: relative; padding: 36px 28px; z-index: 6; }
.vmg-copy h4 { margin: 0 0 12px; font-size: 1.05rem; letter-spacing: .08em; }
.vmg-copy p { margin: 0; font-size: 0.95rem; line-height: 1.45; color: #1b1b1b; }

/* waves */
.vmg-wave {
    position: absolute;
    left: 0;
    right: 0;
    height: 48px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
}
.vmg-wave.top { top: 0; z-index: 5; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0,0 C150,70 350,70 600,30 C850,-10 1050,30 1200,60 L1200,0 L0,0 Z' fill='%2327ae60'/></svg>"); }
.vmg-wave.bottom { bottom: 0; z-index: 5; transform: rotate(180deg); background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0,0 C150,70 350,70 600,30 C850,-10 1050,30 1200,60 L1200,0 L0,0 Z' fill='%2327ae60'/></svg>"); }
.vmg-wave.outer.top { z-index: 4; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0,0 C150,80 350,80 600,40 C850,0 1050,40 1200,80 L1200,0 L0,0 Z' fill='%23f1c40f' opacity='0.95'/></svg>"); }
.vmg-wave.outer.bottom { z-index: 4; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'><path d='M0,0 C150,80 350,80 600,40 C850,0 1050,40 1200,80 L1200,0 L0,0 Z' fill='%23f1c40f' opacity='0.95'/></svg>"); }

/* responsive */
@media (max-width: 992px) {
    .vmg-grid { grid-template-columns: repeat(2, 1fr); }

    .privacy-header {
        padding: 24px 24px;
    }

    .privacy-header h2 {
        font-size: 1.5rem;
    }

    .privacy-content {
        padding: 0 24px;
        max-height: calc(90vh - 180px);
    }

    .privacy-footer {
        padding: 20px 24px;
    }
}
@media (max-width: 640px) {
    .vmg-grid { grid-template-columns: 1fr; gap: 20px; }
    .vmg-card { min-height: 260px; }

    .privacy-header {
        padding: 20px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .privacy-header h2 {
        font-size: 1.2rem;
    }

    .privacy-close-btn {
        align-self: flex-end;
    }

    .privacy-content {
        padding: 0 16px;
        max-height: calc(90vh - 160px);
    }

    .privacy-section {
        margin-bottom: 20px;
    }

    .privacy-section h3 {
        font-size: 1rem;
    }

    .privacy-section p,
    .privacy-section ul {
        font-size: 0.9rem;
    }

    .privacy-footer {
        padding: 16px;
    }
}
</style>
