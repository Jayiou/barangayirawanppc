<template>
    <div v-if="initializing" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; flex-direction: column;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #2c3e50; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #5e6f66; font-size: 0.9rem;">Initializing portal...</p>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    </div>
    <div class="page-shell app-shell resident-shell" v-else>
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button
                class="resident-sidebar-toggle"
                type="button"
                :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
                @click="sidebarOpen = !sidebarOpen"
            >
                <i class="fa-solid fa-bars"></i>
            </button>

            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <BrandMark initials="BI" eyebrow="Resident Portal" title="Barangay Irawan" />
            </div>

            <!-- Sidebar Navigation -->
            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'appointments' }" type="button" :title="texts.nav.appointments" :aria-label="texts.nav.appointments" @click="setResidentView('appointments')"><i class="fa-solid fa-calendar-check"></i><span class="nav-label">{{ texts.nav.appointments }}</span></button>

                <button :class="{ active: currentView === 'documents' }" type="button" :title="texts.nav.documents" :aria-label="texts.nav.documents" @click="setResidentView('documents')"><i class="fa-solid fa-file"></i><span class="nav-label">{{ texts.nav.documents }}</span></button>
                <button :class="{ active: currentView === 'reservations' }" type="button" :title="texts.nav.reservations" :aria-label="texts.nav.reservations" @click="setResidentView('reservations')"><i class="fa-solid fa-building"></i><span class="nav-label">{{ texts.nav.reservations }}</span></button>
                <button :class="{ active: currentView === 'manpower' }" type="button" :title="texts.nav.manpower" :aria-label="texts.nav.manpower" @click="setResidentView('manpower')"><i class="fa-solid fa-people-group"></i><span class="nav-label">{{ texts.nav.manpower }}</span></button>
                <button :class="{ active: currentView === 'reports' }" type="button" :title="texts.nav.reports" :aria-label="texts.nav.reports" @click="setResidentView('reports')"><i class="fa-solid fa-flag"></i><span class="nav-label">{{ texts.nav.reports }}</span></button>
                <button :class="{ active: currentView === 'disaster' }" type="button" :title="texts.nav.disaster" :aria-label="texts.nav.disaster" @click="setResidentView('disaster')"><i class="fa-solid fa-house-flood-water"></i><span class="nav-label">{{ texts.nav.disaster }}</span></button>
                <button :class="{ active: currentView === 'profile' }" type="button" :title="texts.nav.profile" :aria-label="texts.nav.profile" @click="setResidentView('profile')"><i class="fa-solid fa-user"></i><span class="nav-label">{{ texts.nav.profile }}</span></button>
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

        <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = !sidebarOpen"><i class="fa-solid fa-bars"></i></button>
                <nav class="mobile-quick-nav" aria-label="Resident quick navigation">
                    <button :class="{ active: currentView === 'appointments' }" type="button" :title="texts.nav.appointments" :aria-label="texts.nav.appointments" @click="setResidentView('appointments')"><i class="fa-solid fa-calendar-check"></i><span>Appoint</span></button>
                    <button :class="{ active: currentView === 'documents' }" type="button" :title="texts.nav.documents" :aria-label="texts.nav.documents" @click="setResidentView('documents')"><i class="fa-solid fa-file"></i><span>{{ texts.nav.documents }}</span></button>
                    <button :class="{ active: currentView === 'reservations' }" type="button" :title="texts.nav.reservations" :aria-label="texts.nav.reservations" @click="setResidentView('reservations')"><i class="fa-solid fa-building"></i><span>Facility</span></button>
                    <button :class="{ active: currentView === 'manpower' }" type="button" :title="texts.nav.manpower" :aria-label="texts.nav.manpower" @click="setResidentView('manpower')"><i class="fa-solid fa-people-group"></i><span>Manpower</span></button>
                    <button :class="{ active: currentView === 'reports' }" type="button" :title="texts.nav.reports" :aria-label="texts.nav.reports" @click="setResidentView('reports')"><i class="fa-solid fa-flag"></i><span>{{ texts.nav.reports }}</span></button>
                    <button :class="{ active: currentView === 'disaster' }" type="button" :title="texts.nav.disaster" :aria-label="texts.nav.disaster" @click="setResidentView('disaster')"><i class="fa-solid fa-house-flood-water"></i><span>Advisories</span></button>
                </nav>
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
                    <article class="content-card profile-card">
                        <div class="profile-hero">
                            <button type="button" class="profile-avatar-preview profile-avatar-preview--action" @click="openProfileImagePicker" aria-label="Upload profile picture">
                                <img v-if="profileAvatarSrc" :src="profileAvatarSrc" alt="Profile avatar" :style="profileAvatarImageStyle" />
                                <div v-else class="avatar-placeholder">{{ getInitials(profile) }}</div>
                                <span class="profile-avatar-edit-badge" aria-hidden="true">
                                    <i class="fa-solid fa-pen"></i>
                                </span>
                            </button>
                            <div class="profile-identity">
                                <span class="eyebrow">{{ texts.profile.eyebrow }}</span>
                                <h3>{{ displayName }}</h3>
                                <p class="profile-email">{{ profile.email || user?.email || 'No email on file' }}</p>
                            </div>
                        </div>

                        <div class="profile-sections">
                            <section class="profile-panel">
                                <div class="section-head profile-panel-head">
                                    <div>
                                        <h4>Account Information</h4>
                                    </div>
                                    <button type="button" class="ghost-button" @click="toggleProfileEdit">{{ isEditingProfile ? 'Cancel Edit' : 'Edit Profile' }}</button>
                                </div>

                                <template v-if="!isEditingProfile">
                                    <dl class="profile-info-list">
                                        <div class="profile-info-item">
                                            <dt>Birthday</dt>
                                            <dd>{{ formatDate(profile.birthDate) }}</dd>
                                        </div>
                                        <div class="profile-info-item">
                                            <dt>Contact Number</dt>
                                            <dd>{{ profile.contactNumber || 'N/A' }}</dd>
                                        </div>
                                        <div class="profile-info-item">
                                            <dt>Civil Status</dt>
                                            <dd>{{ normalizeLabel(profile.civilStatus) }}</dd>
                                        </div>
                                        <div class="profile-info-item">
                                            <dt>Barangay</dt>
                                            <dd>{{ profile.address || 'N/A' }}</dd>
                                        </div>
                                        <div class="profile-info-item">
                                            <dt>{{ selectedPurokZones.length ? 'Purok / Zone' : 'Purok' }}</dt>
                                            <dd>{{ profilePurokZoneLabel }}</dd>
                                        </div>
                                        <div class="profile-info-item">
                                            <dt>Occupation</dt>
                                            <dd>{{ profile.occupation || 'N/A' }}</dd>
                                        </div>
                                    </dl>
                                </template>

                                <form v-else class="stack profile-edit-form" @submit.prevent="handleSaveProfile">
                                    <div class="form-span-2 profile-image-field">
                                        <button type="button" class="profile-avatar-preview profile-avatar-preview--edit profile-avatar-preview--action" @click="openProfileImagePicker" aria-label="Change profile picture">
                                            <img v-if="profileAvatarSrc" :src="profileAvatarSrc" alt="Profile avatar preview" :style="profileAvatarImageStyle" />
                                            <div v-else class="avatar-placeholder">{{ getInitials(profile) }}</div>
                                            <span class="profile-avatar-edit-badge" aria-hidden="true">
                                                <i class="fa-solid fa-pen"></i>
                                            </span>
                                        </button>
                                        <input ref="profileImageInput" class="profile-image-input-hidden" type="file" accept="image/png,image/jpeg,image/jpg" @change="handleProfileImageChange">
                                        <button type="button" class="ghost-button profile-image-upload-button" @click="openProfileImagePicker">Choose Photo</button>
                                        <small class="fine-print">{{ UPLOAD_SIZE_NOTE }}</small>
                                        <div v-if="profileCropSourceUrl" class="profile-crop-tool">
                                            <div
                                                class="profile-crop-frame"
                                                :class="{ 'is-dragging': profileCropDragging }"
                                                @pointerdown.prevent="startProfileCropDrag"
                                                @pointermove.prevent="handleProfileCropDrag"
                                                @pointerup.prevent="endProfileCropDrag"
                                                @pointercancel.prevent="endProfileCropDrag"
                                                @lostpointercapture="endProfileCropDrag"
                                                @touchstart.prevent="startProfileCropTouch"
                                                @touchmove.prevent="handleProfileCropTouchMove"
                                                @touchend.prevent="endProfileCropTouch"
                                                @wheel.passive.prevent="handleProfileCropWheel"
                                            >
                                                <img :src="profileCropSourceUrl" alt="Profile crop preview" :style="profileCropImageStyle" draggable="false">
                                                <div class="profile-crop-overlay" aria-hidden="true"></div>
                                            </div>
                                            <small class="profile-password-note">Drag the photo until the circle covers the part you want to keep.</small>
                                        </div>
                                    </div>
                                    <div class="form-grid two-column profile-name-grid">
                                        <label>
                                            <span>{{ texts.profile.labels.firstName }}</span>
                                            <input v-model="profile.firstName" type="text" required>
                                        </label>
                                        <label>
                                            <span>{{ texts.profile.labels.middleName }}</span>
                                            <input v-model="profile.middleName" type="text" placeholder="Middle name">
                                        </label>
                                        <label>
                                            <span>{{ texts.profile.labels.lastName }}</span>
                                            <input v-model="profile.lastName" type="text" required>
                                        </label>
                                        <label>
                                            <span>{{ texts.profile.labels.suffix }}</span>
                                            <input v-model="profile.suffix" type="text" placeholder="Jr., Sr., III">
                                        </label>
                                    </div>
                                    <div class="form-grid two-column">
                                        <label><span>Birthday</span><input v-model="profile.birthDate" type="date" required></label>
                                        <label>
                                            <span>Contact Number</span>
                                            <div class="phone-input-wrapper">
                                                <span class="phone-country-badge" aria-hidden="true">
                                                    <span class="phone-country-flag">🇵🇭</span>
                                                    <span>PH</span>
                                                </span>
                                                <input v-model="profile.contactNumber" type="tel" inputmode="tel" placeholder="+639XXXXXXXXX" pattern="^(09\d{9}|\+639\d{9}|639\d{9})$" maxlength="13" @focus="ensureProfilePhonePrefix" @input="formatProfilePhoneInput">
                                            </div>
                                        </label>
                                        <label>
                                            <span>Civil Status</span>
                                            <select v-model="profile.civilStatus">
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="widowed">Widowed</option>
                                                <option value="separated">Separated</option>
                                            </select>
                                        </label>
                                        <label><span>Barangay</span><input v-model="profile.address" type="text" required></label>
                                        <label>
                                            <span>Purok</span>
                                            <select v-model="profile.purok" required>
                                                <option value="">Select Purok</option>
                                                <option v-for="purok in purokOptions" :key="purok" :value="purok">{{ purok }}</option>
                                            </select>
                                        </label>
                                        <label v-if="selectedPurokZones.length">
                                            <span>Zone</span>
                                            <select v-model="profile.zone" required>
                                                <option value="">Select Zone</option>
                                                <option v-for="zone in selectedPurokZones" :key="zone" :value="zone">{{ zone }}</option>
                                            </select>
                                        </label>
                                        <label v-else>
                                            <span>Zone</span>
                                            <input v-model="profile.zone" type="text" placeholder="Enter Zone" required>
                                        </label>
                                        <label class="form-span-2"><span>Occupation</span><input v-model="profile.occupation" type="text" placeholder="Ex. Teacher, Entrepreneur"></label>
                                    </div>
                                    <div class="profile-form-actions">
                                        <button type="button" class="ghost-button" @click="cancelProfileEdit">Discard Changes</button>
                                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</button>
                                    </div>
                                </form>
                            </section>

                            <section class="profile-panel">
                                <div class="section-head profile-panel-head">
                                    <div>
                                        <span class="eyebrow">About Account</span>
                                        <h4>Change Gmail</h4>
                                    </div>
                                </div>

                                <form class="stack profile-password-form" @submit.prevent="handleRequestEmailChange">
                                    <label>
                                        <span>Current Gmail</span>
                                        <input :value="user?.email || profile.email || ''" type="email" readonly>
                                    </label>
                                    <label v-if="user?.pendingEmail">
                                        <span>Pending Gmail</span>
                                        <input :value="user.pendingEmail" type="email" readonly>
                                    </label>
                                    <label>
                                        <span>New Gmail</span>
                                        <input v-model="emailChangeForm.newEmail" type="email" autocomplete="email" placeholder="juan@example.com" required>
                                    </label>
                                    <label>
                                        <span>Current Password</span>
                                        <div class="profile-password-input">
                                            <input v-model="emailChangeForm.currentPassword" :type="passwordVisibility.emailCurrent ? 'text' : 'password'" autocomplete="current-password" required>
                                            <button type="button" :aria-label="passwordVisibility.emailCurrent ? 'Hide current password' : 'Show current password'" @click="togglePasswordVisibility('emailCurrent')">
                                                <i :class="passwordVisibility.emailCurrent ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </label>
                                    <button type="submit" class="primary-button" :disabled="isChangingEmail">{{ isChangingEmail ? 'Sending Verification...' : 'Send Verification Link' }}</button>
                                </form>
                            </section>

                            <section class="profile-panel">
                                <div class="section-head profile-panel-head">
                                    <div>
                                        <span class="eyebrow">About Account</span>
                                        <h4>Change Password</h4>
                                    </div>
                                </div>

                                <form class="stack profile-password-form" @submit.prevent="handleChangePassword">
                                    <label>
                                        <span>Current Password</span>
                                        <div class="profile-password-input">
                                            <input v-model="changePasswordForm.currentPassword" :type="passwordVisibility.current ? 'text' : 'password'" autocomplete="current-password" required>
                                            <button type="button" :aria-label="passwordVisibility.current ? 'Hide current password' : 'Show current password'" @click="togglePasswordVisibility('current')">
                                                <i :class="passwordVisibility.current ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </label>
                                    <label>
                                        <span>New Password</span>
                                        <div class="profile-password-input">
                                            <input v-model="changePasswordForm.newPassword" :type="passwordVisibility.new ? 'text' : 'password'" autocomplete="new-password" minlength="8" required>
                                            <button type="button" :aria-label="passwordVisibility.new ? 'Hide new password' : 'Show new password'" @click="togglePasswordVisibility('new')">
                                                <i :class="passwordVisibility.new ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </label>
                                    <label>
                                        <span>Confirm New Password</span>
                                        <div class="profile-password-input">
                                            <input v-model="changePasswordForm.confirmPassword" :type="passwordVisibility.confirm ? 'text' : 'password'" autocomplete="new-password" minlength="8" required>
                                            <button type="button" :aria-label="passwordVisibility.confirm ? 'Hide confirmed password' : 'Show confirmed password'" @click="togglePasswordVisibility('confirm')">
                                                <i :class="passwordVisibility.confirm ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                                            </button>
                                        </div>
                                    </label>
                                    <div class="password-rules profile-password-rules" aria-live="polite">
                                        <p class="password-rules-title">Password must include:</p>
                                        <ul class="password-rules-list">
                                            <li v-for="rule in changePasswordRules" :key="rule.key" :class="['password-rule-item', rule.passed ? 'is-pass' : 'is-fail']">
                                                <i :class="rule.passed ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
                                                <span>{{ rule.label }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <button type="submit" class="primary-button" :disabled="isChangingPassword">{{ isChangingPassword ? 'Updating Password...' : 'Update Password' }}</button>
                                </form>
                            </section>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Appointments View -->
            <section class="app-view" :class="{ active: currentView === 'appointments' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">{{ texts.appointments.eyebrow }}</span>
                                <h3>{{ texts.appointments.heading }}</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'appointment'">{{ texts.appointments.requestButton }}</button>
                        </div>
                        <input class="portal-search-input" v-model="appointmentSearch" type="search" :placeholder="texts.appointments.searchPlaceholder">
                        <div class="table-filter-bar portal-record-filters">
                            <select v-model="appointmentStatusFilter">
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <label class="date-filter-field">
                                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                                <input v-model="appointmentDateFilter" type="date" aria-label="Filter appointments by date">
                            </label>
                        </div>
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead>
                                    <tr><th>Date</th><th>Official</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!pagedAppointments.items.length"><td colspan="5" class="portal-empty-cell">{{ texts.appointments.empty }}</td></tr>
                                    <tr v-for="item in pagedAppointments.items" :key="item._id">
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
                        <div v-if="filteredAppointments.length > 0" class="table-pagination">
                            <span class="pagination-meta">Page {{ pagedAppointments.page }} of {{ pagedAppointments.pages }} · {{ filteredAppointments.length }} records</span>
                            <div class="pagination-actions">
                                <button class="pagination-button" type="button" :disabled="pagedAppointments.page === 1" @click="appointmentPage = Math.max(appointmentPage - 1, 1)">Prev</button>
                                <button class="pagination-button primary-button" type="button" :disabled="pagedAppointments.page >= pagedAppointments.pages" @click="appointmentPage = Math.min(appointmentPage + 1, pagedAppointments.pages)">Next</button>
                            </div>
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
                                <span class="eyebrow">{{ texts.documents.eyebrow }}</span>
                                <h3>{{ texts.documents.heading }}</h3>
                            </div>
                            <button class="primary-button" @click="openDocumentRequestModal()">{{ texts.documents.requestButton }}</button>
                        </div>
                        <input class="portal-search-input" v-model="documentSearch" type="search" :placeholder="texts.documents.searchPlaceholder">
                        <div class="table-filter-bar portal-record-filters">
                            <select v-model="documentStatusFilter">
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="approved">Approved</option>
                                <option value="ready_for_pickup">Ready for pickup</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <label class="date-filter-field">
                                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                                <input v-model="documentDateFilter" type="date" aria-label="Filter documents by date">
                            </label>
                        </div>
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead>
                                    <tr><th>Date</th><th>Type</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!pagedDocumentRequests.items.length"><td colspan="5" class="portal-empty-cell">{{ texts.documents.empty }}</td></tr>
                                    <tr v-for="item in pagedDocumentRequests.items" :key="item._id">
                                        <td>{{ formatDate(item.createdAt) }}</td>
                                        <td>{{ normalizeLabel(item.type) }}</td>
                                        <td>{{ item.purpose || item.fields?.PURPOSE || '-' }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                                                    <button class="ghost-button table-action" @click="openRecordDetail('document', item)">View</button>
                                            <button v-if="canEditRecord('document', item)" class="ghost-button table-action" @click="openDocumentRequestEditor(item)">Edit</button>
                                            <button v-if="canDeleteRecord('document', item)" class="ghost-button table-action danger" @click="deleteResidentRecord('document', item)">Delete</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-if="filteredDocumentRequests.length > 0" class="table-pagination">
                            <span class="pagination-meta">Page {{ pagedDocumentRequests.page }} of {{ pagedDocumentRequests.pages }} · {{ filteredDocumentRequests.length }} records</span>
                            <div class="pagination-actions">
                                <button class="pagination-button" type="button" :disabled="pagedDocumentRequests.page === 1" @click="documentPage = Math.max(documentPage - 1, 1)">Prev</button>
                                <button class="pagination-button primary-button" type="button" :disabled="pagedDocumentRequests.page >= pagedDocumentRequests.pages" @click="documentPage = Math.min(documentPage + 1, pagedDocumentRequests.pages)">Next</button>
                            </div>
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
                                <span class="eyebrow">{{ texts.reservations.eyebrow }}</span>
                                <h3>{{ texts.reservations.heading }}</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'reservation'">{{ texts.reservations.requestButton }}</button>
                        </div>
                        <input class="portal-search-input" v-model="reservationSearch" type="search" :placeholder="texts.reservations.searchPlaceholder">
                        <div class="table-filter-bar portal-record-filters">
                            <select v-model="reservationStatusFilter">
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="rescheduled">Rescheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <label class="date-filter-field">
                                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                                <input v-model="reservationDateFilter" type="date" aria-label="Filter reservations by date">
                            </label>
                        </div>
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead><tr><th>Date</th><th>Facility</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-if="!pagedReservations.items.length"><td colspan="5" class="portal-empty-cell">{{ texts.reservations.empty }}</td></tr>
                                    <tr v-for="item in pagedReservations.items" :key="item._id">
                                        <td>
                                            {{ formatDate(item.reservationDate) }}<br>
                                            <small>{{ item.startTime }}-{{ item.endTime }}</small><br>
                                            <small>
                                                {{ getFacilityItemLabel(item.facilityName) }}
                                                <span v-if="getFacilityReservationQuantity(item) > 0"> x{{ getFacilityReservationQuantity(item) }}</span>
                                            </small>
                                        </td>
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
                        <div v-if="filteredReservations.length > 0" class="table-pagination">
                            <span class="pagination-meta">Page {{ pagedReservations.page }} of {{ pagedReservations.pages }} · {{ filteredReservations.length }} records</span>
                            <div class="pagination-actions">
                                <button class="pagination-button" type="button" :disabled="pagedReservations.page === 1" @click="reservationPage = Math.max(reservationPage - 1, 1)">Prev</button>
                                <button class="pagination-button primary-button" type="button" :disabled="pagedReservations.page >= pagedReservations.pages" @click="reservationPage = Math.min(reservationPage + 1, pagedReservations.pages)">Next</button>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Manpower Requests View -->
            <section class="app-view" :class="{ active: currentView === 'manpower' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head portal-table-head">
                            <div>
                                <span class="eyebrow">{{ texts.manpower.eyebrow }}</span>
                                <h3>{{ texts.manpower.heading }}</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'manpower'">{{ texts.manpower.requestButton }}</button>
                        </div>
                        <input class="portal-search-input" v-model="manpowerSearch" type="search" :placeholder="texts.manpower.searchPlaceholder">
                        <div class="table-filter-bar portal-record-filters">
                            <select v-model="manpowerStatusFilter">
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <label class="date-filter-field">
                                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                                <input v-model="manpowerDateFilter" type="date" aria-label="Filter manpower requests by date">
                            </label>
                        </div>
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead><tr><th>Date</th><th>Request</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-if="!pagedManpowerRequests.items.length"><td colspan="5" class="portal-empty-cell">{{ texts.manpower.empty }}</td></tr>
                                    <tr v-for="item in pagedManpowerRequests.items" :key="item._id">
                                        <td>{{ formatDate(item.requestDate) }}<br><small>{{ item.requestTime || 'Time TBD' }}</small></td>
                                        <td>{{ item.title }}<br><small>{{ normalizeLabel(item.assistanceType) }} | {{ item.requestedPersonnelCount }} personnel</small></td>
                                        <td>{{ item.requestLocation }}</td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td><div class="portal-row-actions">
                                            <button class="ghost-button table-action" @click="openRecordDetail('manpower', item)">View</button>
                                            <button v-if="canCancelManpowerRequest(item)" class="ghost-button table-action danger" @click="cancelResidentManpowerRequest(item)">Cancel</button>
                                            <button v-if="canDeleteRecord('manpower', item)" class="ghost-button table-action danger" @click="deleteResidentRecord('manpower', item)">Delete</button>
                                        </div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-if="filteredManpowerRequests.length > 0" class="table-pagination">
                            <span class="pagination-meta">Page {{ pagedManpowerRequests.page }} of {{ pagedManpowerRequests.pages }} · {{ filteredManpowerRequests.length }} records</span>
                            <div class="pagination-actions">
                                <button class="pagination-button" type="button" :disabled="pagedManpowerRequests.page === 1" @click="manpowerPage = Math.max(manpowerPage - 1, 1)">Prev</button>
                                <button class="pagination-button primary-button" type="button" :disabled="pagedManpowerRequests.page >= pagedManpowerRequests.pages" @click="manpowerPage = Math.min(manpowerPage + 1, pagedManpowerRequests.pages)">Next</button>
                            </div>
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
                                <span class="eyebrow">{{ texts.reports.eyebrow }}</span>
                                <h3>My submitted reports</h3>
                            </div>
                            <button class="primary-button" @click="activeModal = 'report'">Submit New Report</button>
                        </div>
                        <input class="portal-search-input" v-model="reportSearch" type="search" placeholder="Search reports">
                        <div class="table-filter-bar portal-record-filters">
                            <select v-model="reportStatusFilter">
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="approved">Approved</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                                <option value="closed">Closed</option>
                            </select>
                            <label class="date-filter-field">
                                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                                <input v-model="reportDateFilter" type="date" aria-label="Filter reports by date">
                            </label>
                        </div>
                        <div class="portal-table-wrap">
                            <table class="data-table portal-record-table">
                                <thead><tr><th>Date</th><th>Report</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-if="!pagedReports.items.length"><td colspan="5" class="portal-empty-cell">No reports found.</td></tr>
                                    <tr v-for="item in pagedReports.items" :key="item._id">
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
                        <div v-if="filteredReports.length > 0" class="table-pagination">
                            <span class="pagination-meta">Page {{ pagedReports.page }} of {{ pagedReports.pages }} · {{ filteredReports.length }} records</span>
                            <div class="pagination-actions">
                                <button class="pagination-button" type="button" :disabled="pagedReports.page === 1" @click="reportPage = Math.max(reportPage - 1, 1)">Prev</button>
                                <button class="pagination-button primary-button" type="button" :disabled="pagedReports.page >= pagedReports.pages" @click="reportPage = Math.min(reportPage + 1, pagedReports.pages)">Next</button>
                            </div>
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
                    <h2>{{ texts.modals.appointmentRequest }}</h2>
                    <p class="fine-print">Schedule a meeting with a barangay official.</p>
                    <form class="stack" @submit.prevent="handleSubmitAppointment">
                        <label><span>Official</span>
                            <select v-model="appointmentForm.officialId" required @change="loadAvailableSlots">
                                <option disabled value="">Select Official</option>
                                <option v-for="official in officials" :key="official._id" :value="official._id" :disabled="isOfficialInactive(official)">{{ formatAppointmentOfficialOption(official) }}</option>
                            </select>
                        </label>
                        <div v-if="selectedAppointmentOfficialInactive" class="facility-slot-note">{{ inactiveAppointmentOfficialMessage }}</div>
                        <label><span>Date</span><input v-model="appointmentForm.appointmentDate" type="date" :min="new Date().toLocaleDateString('en-CA')" required @change="loadAvailableSlots"></label>
                        
                        <div v-if="appointmentForm.officialId && appointmentForm.appointmentDate && !selectedAppointmentOfficialInactive">
                            <span>Available Time Slots</span>
                            <div v-if="isFetchingSlots" style="margin-top: 5px; font-size: 0.9em; color: #666;">Loading slots...</div>
                            <div v-else-if="availableSlots.length === 0" style="margin-top: 5px; font-size: 0.9em; color: #d32f2f;">No available slots for this date.</div>
                            <div v-else class="appointment-slot-grid" :style="{ '--appointment-slot-min-width': appointmentSlotMinWidth }">
                                <button type="button"
                                    class="appointment-slot-button"
                                    v-for="(slot, idx) in availableSlots" :key="idx"
                                    @click="slot.isAvailable ? selectSlot(slot) : null"
                                    :disabled="!slot.isAvailable"
                                    :style="{
                                        background: !slot.isAvailable ? '#f5f5f5' : (appointmentForm.startTime === slot.startTime ? '#2c3e50' : 'transparent'),
                                        color: !slot.isAvailable ? '#aaa' : (appointmentForm.startTime === slot.startTime ? '#fff' : '#2c3e50'),
                                        cursor: !slot.isAvailable ? 'not-allowed' : 'pointer',
                                    }"
                                >
                                    <span>{{ slot.label }}</span>
                                    <span class="appointment-slot-subtext" :class="{ 'is-placeholder': slot.isAvailable }">({{ slot.reason || 'Unavailable' }})</span>
                                </button>
                            </div>
                        </div>

                        <label><span>Purpose</span><input v-model="appointmentForm.purpose" type="text" required placeholder="What is this meeting about?"></label>
                        <button type="submit" class="primary-button" :disabled="!canSubmitAppointment">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button>
                    </form>
                </div>

                <div v-if="activeModal === 'reservation'">
                    <h2>{{ texts.modals.reservationRequest }}</h2>
                    <p class="fine-print">Book a barangay facility for your event.</p>
                    <form class="stack" @submit.prevent="handleSubmitReservation">
                        <label>
                            <span>Facility Type</span>
                            <select v-model="reservationForm.facilityName" required @change="handleReservationAvailabilityChange">
                                <option v-for="option in FACILITY_ITEM_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                            </select>
                        </label>
                        <label><span>Date</span><input v-model="reservationForm.reservationDate" type="date" :min="getMinimumFacilityReservationDate()" required @change="handleReservationAvailabilityChange"></label>
                        <div class="facility-slot-picker" v-if="reservationForm.facilityName && reservationForm.reservationDate">
                            <div class="facility-slot-head">
                                <span>Facility Time Slot</span>
                                <small>Open {{ portalFacilityTimeOptions.operatingHoursLabel }}</small>
                            </div>
                            <div v-if="isFetchingFacilityAvailability" class="facility-slot-note">Loading facility schedule...</div>
                            <div v-else class="facility-slot-grid">
                                <label>
                                    <span>Start Time</span>
                                    <select v-model="reservationForm.startTime" required @change="reservationForm.endTime = ''; handleReservationTimeChange()">
                                        <option disabled value="">Select start</option>
                                        <option v-for="slot in portalFacilityTimeOptions.startOptions" :key="slot.value" :value="slot.value" :disabled="slot.disabled">{{ slot.label }}</option>
                                    </select>
                                </label>
                                <label>
                                    <span>End Time</span>
                                    <select v-model="reservationForm.endTime" required :disabled="!reservationForm.startTime" @change="handleReservationTimeChange()">
                                        <option disabled value="">Select end</option>
                                        <option v-for="slot in portalFacilityTimeOptions.endOptions" :key="slot.value" :value="slot.value" :disabled="slot.disabled">{{ slot.label }}</option>
                                    </select>
                                </label>
                            </div>
                            <div class="facility-reserved-list" v-if="reservationInventoryPeakSummary">
                                <span>{{ reservationInventoryPeakSummary.title }}</span>
                                <small v-for="range in reservationInventoryPeakSummary.ranges" :key="`${range.type}-${range.start}-${range.end}`">{{ range.icon }} {{ range.rangeLabel }}: {{ range.message }}</small>
                                <small>{{ reservationInventoryPeakSummary.note }}</small>
                            </div>
                            <div class="facility-reserved-list" v-else-if="portalFacilityTimeOptions.reservedSlots.length">
                                <span>Reserved ranges</span>
                                <small v-for="slot in portalFacilityTimeOptions.reservedSlots" :key="slot.id || `${slot.startTime}-${slot.endTime}`">{{ formatFacilityRange(slot.startTime, slot.endTime) }} Reserved <span v-if="slot.facilityName">| {{ getFacilityItemLabel(slot.facilityName) }}</span> <span v-if="slot.quantity">x{{ slot.quantity }}</span></small>
                            </div>
                            <!-- Removed standard flow helper text -->
                        </div>
                            <div class="facility-slot-grid" v-if="reservationRequiresQuantity">
                            <label>
                                <span>Quantity</span>
                                <input v-model.number="reservationForm.quantity" type="number" min="1" :max="reservationQuantityMax" placeholder="0" :disabled="reservationInventoryUnavailable">
                            </label>
                        </div>
                        <div class="facility-slot-note" v-if="reservationInventoryMessage">{{ reservationInventoryMessage }}</div>
                        <label><span>Purpose</span><input v-model="reservationForm.purpose" type="text" required></label>
                        <label><span>Reservation details</span><textarea v-model="reservationForm.reservationDetails" rows="3"></textarea></label>
                        <button type="submit" class="primary-button" :disabled="!canSubmitReservation">{{ isSubmitting ? 'Submitting...' : 'Submit Reservation' }}</button>
                    </form>
                    <div class="facility-slot-note" v-if="!reservationRequiresQuantity && facilityAvailability">{{ facilityAvailability }}</div>
                </div>

                <div v-if="activeModal === 'manpower'">
                    <h2>{{ texts.modals.manpowerRequest }}</h2>
                    <p class="fine-print">Request tanod or barangay manpower support for an event or community activity.</p>
                    <form class="stack" @submit.prevent="handleSubmitManpowerRequest">
                        <label>
                            <span>Assistance Type</span>
                            <select v-model="manpowerForm.assistanceType" required>
                                <option value="peacekeeping">Peacekeeping</option>
                                <option value="traffic_control">Traffic Control</option>
                                <option value="event_security">Event Security</option>
                                <option value="community_service">Community Service</option>
                                <option value="emergency_response">Emergency Response</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label><span>Event / Request Title</span><input v-model="manpowerForm.title" type="text" required placeholder="Ex. Fiesta parade security"></label>
                        <label><span>Location</span><input v-model="manpowerForm.requestLocation" type="text" required placeholder="Street, purok, or venue"></label>
                        <div class="facility-slot-grid">
                            <label><span>Date</span><input v-model="manpowerForm.requestDate" type="date" :min="todayDate" required></label>
                            <label><span>Time</span><input v-model="manpowerForm.requestTime" type="time" required></label>
                        </div>
                        <div class="facility-slot-grid">
                            <label><span>Estimated Duration</span><input v-model="manpowerForm.estimatedDuration" type="text" required placeholder="Ex. 3 hours"></label>
                            <label><span>Personnel Needed</span><input v-model.number="manpowerForm.requestedPersonnelCount" type="number" min="1" required></label>
                        </div>
                        <label>
                            <span>Priority</span>
                            <select v-model="manpowerForm.priority" required>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </label>
                        <label><span>Description / Details</span><textarea v-model="manpowerForm.description" rows="4" required placeholder="Describe the event, expected crowd, route, or duties needed."></textarea></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Manpower Request' }}</button>
                    </form>
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
                        <label v-if="currentReportTypeConfig.requireIncidentDate">
                            <span>Date</span>
                            <input
                                v-model="reportForm.incidentDate"
                                type="date"
                                :max="todayDate"
                                required
                                @input="limitIncidentDateToToday"
                                @change="limitIncidentDateToToday"
                            >
                        </label>
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
                        <small v-if="currentReportTypeConfig.requireProof" class="fine-print">{{ UPLOAD_SIZE_NOTE }}</small>
                        <small v-if="reportProofFiles.length" style="color: #4f6b5d;">{{ reportProofFiles.length }} file(s) selected</small>
                        <label><span>Priority</span><select v-model="reportForm.priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option></select></label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : 'Submit Report' }}</button>
                    </form>
                </div>
                <div v-if="activeModal === 'document'">
                    <h2>{{ editingDocumentRequestId ? 'Edit Document Request' : texts.modals.documentRequest }}</h2>
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

                        <label><span>Barangay</span><input v-model="documentForm.fields.BARANGAY" type="text" placeholder="Irawan"></label>
                        <label><span>City/Municipality</span><input v-model="documentForm.fields.CITY" type="text" placeholder="Puerto Princesa City"></label>

                        <label><span>Purpose</span><input v-model="documentForm.purpose" type="text" placeholder="Reason for request"></label>

                        <button type="submit" class="primary-button" :disabled="isSubmitting">{{ isSubmitting ? 'Submitting...' : (editingDocumentRequestId ? 'Save Changes' : 'Submit Request') }}</button>
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
                        <small v-if="entry.note">{{ entry.note }}</small>
                    </div>
                </div>
                <div v-if="recordDetail.type === 'document' && recordDetail.item?.generatedEmailSentAt" style="display:grid; gap:12px; margin-top: 16px; padding: 14px; border: 1px solid rgba(27, 115, 71, 0.18); border-radius: 10px; background: #f8fcfa;">
                    <div>
                        <h3 style="margin:0 0 6px;">Revision Request Form</h3>
                        <p class="fine-print" style="margin:0;">If you need changes, send a revision note to the admin here.</p>
                    </div>
                    <div v-if="isDocumentRevisionRequested(recordDetail.item)" style="padding: 10px 12px; border-radius: 8px; background: #fff7f7; color: #7a1d1d; border: 1px solid #f1caca;">
                        Revision request already sent. Waiting for admin action.
                    </div>
                    <template v-else>
                        <label>
                            <span>Revision note</span>
                            <textarea v-model="revisionRequestNote" rows="4" placeholder="Tell the admin what needs to be changed."></textarea>
                        </label>
                        <button type="button" class="primary-button" :disabled="isRevisionRequesting" @click="submitDocumentRevisionRequest">
                            {{ isRevisionRequesting ? 'Sending...' : 'Send Revision Request' }}
                        </button>
                    </template>
                </div>
                <div class="portal-modal-actions">
                    <button v-if="canEditRecord(recordDetail.type, recordDetail.item)" class="ghost-button" @click="openDocumentRequestEditor(recordDetail.item)">Edit</button>
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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch, formatDate, formatDateTime, getAuth, setAuth } from '@/shared/client';
import { REPORT_TYPE_CONFIG, REPORT_TYPE_OPTIONS } from '@/shared/reportTypeConfig';
import { buildFacilityInventoryPeakSummary, buildFacilityTimeOptions, formatFacilityRange, FACILITY_ITEM_OPTIONS, getFacilityItemLabel, getFacilityReservationQuantity, getMinimumFacilityReservationDate, getFacilityItemOption } from '@/shared/facilityTimeSlots';
import { UPLOAD_SIZE_NOTE, getFileSizeError, getFilesSizeError } from '@/shared/uploadLimits';
import { usePortalAuth } from '@/composables/usePortalAuth';
import { usePortalData } from '@/composables/usePortalData';
import { usePortalForms } from '@/composables/usePortalForms';
import { useAppointments } from '@/composables/useAppointments';
import { useDocuments } from '@/composables/useDocuments';

// Composables
const { user, initializing, ensureResident, logout } = usePortalAuth();

const PORTAL_VIEW_STORAGE_KEY = 'barangayPortalCurrentView';
const PORTAL_VIEWS = new Set(['appointments', 'documents', 'reservations', 'manpower', 'reports', 'disaster', 'profile']);

const confirmLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
};
const { statusMessage, statusError, reservations, reports, manpowerRequests, appointments, officials, disasterAdvisories, facilityAvailability, facilityAvailabilityDetails, profile, setStatus, loadAll, saveProfile, loadProfile, loadFacilityAvailability } = usePortalData();
const { reservationForm, manpowerForm, reportForm, reportProofFiles, submitReservation, submitManpowerRequest, submitReport } = usePortalForms();
const { getAvailableSlots, requestAppointment } = useAppointments();
const { documentRequests, loadMyDocuments, createDocumentRequest, editDocumentRequest, deleteDocumentRequest, requestDocumentRevision } = useDocuments();
// Local state
const TABLE_PAGE_SIZE = 10;
const sidebarOpen = ref(false);
const currentView = ref('appointments');
const activeModal = ref(null);
const itemsPerPage = 5;
const isSubmitting = ref(false);
const isChangingPassword = ref(false);
const isEditingProfile = ref(false);
const appointmentSearch = ref('');
const appointmentStatusFilter = ref('all');
const appointmentDateFilter = ref('');
const appointmentPage = ref(1);

const reservationSearch = ref('');
const reservationStatusFilter = ref('all');
const reservationDateFilter = ref('');
const reservationPage = ref(1);

const manpowerSearch = ref('');
const manpowerStatusFilter = ref('all');
const manpowerDateFilter = ref('');
const manpowerPage = ref(1);

const reportSearch = ref('');
const reportStatusFilter = ref('all');
const reportDateFilter = ref('');
const reportPage = ref(1);

const documentSearch = ref('');
const documentStatusFilter = ref('all');
const documentDateFilter = ref('');
const documentPage = ref(1);
const recordDetail = ref(null);
const revisionRequestNote = ref('');
const isRevisionRequesting = ref(false);

const calculateResidentAge = (birthDate) => {
    if (!birthDate) return '';

    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age -= 1;
    }

    return age > 0 ? String(age) : '';
};

const getDocumentDefaultFields = () => ({
    FULL_NAME: [profile.firstName, profile.middleName, profile.lastName, profile.suffix].filter(Boolean).join(' ').trim(),
    AGE: calculateResidentAge(profile.birthDate),
    BARANGAY: profile.address?.replace(/^barangay\s+/i, '').trim() || 'Irawan',
    CITY: 'Puerto Princesa City'
});

const defaultDocumentForm = () => ({ type: 'certificate', fields: getDocumentDefaultFields(), purpose: '' });
const documentForm = ref(defaultDocumentForm());
const editingDocumentRequestId = ref(null);
const changePasswordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' });
const emailChangeForm = ref({ newEmail: '', currentPassword: '' });
const isChangingEmail = ref(false);
const isConfirmingEmailChange = ref(false);
const passwordVisibility = reactive({ emailCurrent: false, current: false, new: false, confirm: false });
const profileImageFile = ref(null);
const profileImageInput = ref(null);
const profileImagePreview = ref('');
const profileCropSourceFile = ref(null);
const profileCropSourceUrl = ref('');
const profileCropDragging = ref(false);
const profileCrop = reactive({ x: 50, y: 50, zoom: 1 });

const purokOptions = ['Magsasaka', 'Sampalok', 'Masagana', 'Acacia', 'Freedom', 'Visapa'];
const zoneOptionsByPurok = {
    Sampalok: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'],
    Acacia: Array.from({ length: 10 }, (_, index) => `Zone ${index + 5}`)
};
const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const selectedPurokZones = computed(() => zoneOptionsByPurok[profile.purok] || []);
const profilePurokZoneLabel = computed(() => {
    if (!profile.purok && !profile.zone) return 'N/A';
    if (profile.zone) return `${profile.purok || 'N/A'} / ${profile.zone}`;
    return profile.purok || 'N/A';
});

const profileAvatarSrc = computed(() => profileCropSourceUrl.value || profileImagePreview.value || profile.profileImage || '');
const profileCropImageStyle = computed(() => ({
    objectPosition: `${profileCrop.x}% ${profileCrop.y}%`,
    transform: `scale(${profileCrop.zoom || 1})`
}));
const profileAvatarImageStyle = computed(() => (profileCropSourceUrl.value ? profileCropImageStyle.value : {}));

const clampProfileCropValue = (value) => Math.min(100, Math.max(0, value));

const setProfileCropFromPointer = (event) => {
    if (!profileCropSourceUrl.value || !profileCropDragging.value || !event.currentTarget) {
        return;
    }

    const frame = event.currentTarget;
    const rect = frame.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const deltaX = event.clientX - profileCropDragState.startClientX;
    const deltaY = event.clientY - profileCropDragState.startClientY;

    profileCrop.x = clampProfileCropValue(profileCropDragState.startX - (deltaX / width) * 100);
    profileCrop.y = clampProfileCropValue(profileCropDragState.startY - (deltaY / height) * 100);
};

const profileCropDragState = reactive({
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startX: 50,
    startY: 50
});

const startProfileCropDrag = (event) => {
    if (!profileCropSourceUrl.value || event.button !== 0) {
        return;
    }

    profileCropDragging.value = true;
    profileCropDragState.pointerId = event.pointerId;
    profileCropDragState.startClientX = event.clientX;
    profileCropDragState.startClientY = event.clientY;
    profileCropDragState.startX = profileCrop.x;
    profileCropDragState.startY = profileCrop.y;

    event.currentTarget?.setPointerCapture?.(event.pointerId);
};

// Pinch / touch & wheel zoom support for crop frame
const profileCropPinchState = reactive({ active: false, startDist: 0, startZoom: 1 });

const getTouchDistance = (t0, t1) => Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);

const startProfileCropTouch = (event) => {
    if (!profileCropSourceUrl.value) return;

    const touches = event.touches || [];
    if (touches.length === 2) {
        profileCropPinchState.active = true;
        profileCropPinchState.startDist = getTouchDistance(touches[0], touches[1]);
        profileCropPinchState.startZoom = profileCrop.zoom || 1;
    } else if (touches.length === 1) {
        // start single-finger drag
        profileCropDragging.value = true;
        profileCropDragState.startClientX = touches[0].clientX;
        profileCropDragState.startClientY = touches[0].clientY;
        profileCropDragState.startX = profileCrop.x;
        profileCropDragState.startY = profileCrop.y;
    }
};

const handleProfileCropTouchMove = (event) => {
    if (!profileCropSourceUrl.value) return;
    const touches = event.touches || [];
    if (profileCropPinchState.active && touches.length >= 2) {
        const dist = getTouchDistance(touches[0], touches[1]);
        let newZoom = profileCropPinchState.startZoom * (dist / profileCropPinchState.startDist);
        newZoom = Math.min(3, Math.max(1, newZoom));
        profileCrop.zoom = newZoom;
        return;
    }

    if (profileCropDragging.value && touches.length === 1) {
        const touch = touches[0];
        // create a fake pointer-like event shape for reusing setProfileCropFromPointer
        setProfileCropFromPointer({ currentTarget: event.currentTarget, clientX: touch.clientX, clientY: touch.clientY });
    }
};

const endProfileCropTouch = (event) => {
    const touches = event.touches || [];
    if (profileCropPinchState.active && touches.length < 2) {
        profileCropPinchState.active = false;
    }

    if (profileCropDragging.value && touches.length === 0) {
        profileCropDragging.value = false;
        profileCropDragState.pointerId = null;
    }
};

const handleProfileCropWheel = (event) => {
    if (!profileCropSourceUrl.value) return;
    // Normalize wheel delta for zooming
    const delta = -event.deltaY;
    const factor = delta > 0 ? 1.08 : 0.92;
    let newZoom = (profileCrop.zoom || 1) * factor;
    newZoom = Math.min(3, Math.max(1, newZoom));
    profileCrop.zoom = newZoom;
};

const handleProfileCropDrag = (event) => {
    if (!profileCropDragging.value || event.pointerId !== profileCropDragState.pointerId) {
        return;
    }

    setProfileCropFromPointer(event);
};

const endProfileCropDrag = (event) => {
    if (event?.pointerId !== undefined && profileCropDragState.pointerId !== null && event.pointerId !== profileCropDragState.pointerId) {
        return;
    }

    profileCropDragging.value = false;
    profileCropDragState.pointerId = null;
};

const changePasswordRules = computed(() => {
    const password = changePasswordForm.value.newPassword || '';
    return [
        { key: 'min-length', label: 'At least 8 characters', passed: password.length >= 8 },
        { key: 'uppercase', label: 'At least 1 uppercase letter', passed: /[A-Z]/.test(password) },
        { key: 'number', label: 'At least 1 number', passed: /\d/.test(password) },
        { key: 'special', label: 'At least 1 special character', passed: PASSWORD_SPECIAL_CHAR_REGEX.test(password) },
        { key: 'match', label: 'Confirm password matches', passed: Boolean(password) && password === changePasswordForm.value.confirmPassword }
    ];
});

const togglePasswordVisibility = (field) => {
    passwordVisibility[field] = !passwordVisibility[field];
};

const clearProfileImageSelection = () => {
    if (profileImagePreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview.value);
    }

    if (profileCropSourceUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(profileCropSourceUrl.value);
    }

    profileImagePreview.value = '';
    profileImageFile.value = null;
    profileCropSourceFile.value = null;
    profileCropSourceUrl.value = '';
    profileCrop.x = 50;
    profileCrop.y = 50;
    profileCropDragging.value = false;
    profileCropDragState.pointerId = null;

    if (profileImageInput.value) {
        profileImageInput.value.value = '';
    }
};

const handleProfileImageChange = (event) => {
    const file = event.target?.files?.[0] || null;
    const error = getFileSizeError(file);

    if (error) {
        event.target.value = '';
        clearProfileImageSelection();
        setStatus(error, true);
        return;
    }

    if (profileImagePreview.value.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview.value);
    }

    if (profileCropSourceUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(profileCropSourceUrl.value);
    }

    profileImageFile.value = null;
    profileImagePreview.value = '';
    profileCropSourceFile.value = file;
    profileCropSourceUrl.value = file ? URL.createObjectURL(file) : '';
    profileCrop.x = 50;
    profileCrop.y = 50;
    profileCropDragging.value = false;
    profileCropDragState.pointerId = null;
};

const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

const createCroppedProfileImageFile = async () => {
    if (!profileCropSourceFile.value || !profileCropSourceUrl.value) {
        return profileImageFile.value;
    }

    const image = await loadImage(profileCropSourceUrl.value);
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const zoom = profileCrop.zoom || 1;
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (size - width) * (profileCrop.x / 100);
    const y = (size - height) * (profileCrop.y / 100);

    context.drawImage(image, x, y, width, height);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve(profileCropSourceFile.value);
                return;
            }

            resolve(new File([blob], profileCropSourceFile.value.name.replace(/\.[^.]+$/, '') + '-profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    });
};

const openProfileImagePicker = async () => {
    if (!isEditingProfile.value) {
        isEditingProfile.value = true;
        await nextTick();
    }

    profileImageInput.value?.click();
};

const displayName = computed(() => {
    const parts = [profile.firstName, profile.middleName, profile.lastName, profile.suffix].filter(Boolean);
    return parts.length ? parts.join(' ') : user.value?.username || 'Resident Profile';
});

const getStoredPortalView = () => {
    const storedView = globalThis.sessionStorage?.getItem(PORTAL_VIEW_STORAGE_KEY) || '';
    return PORTAL_VIEWS.has(storedView) ? storedView : '';
};

const setStoredPortalView = (view) => {
    if (!PORTAL_VIEWS.has(view)) return;
    globalThis.sessionStorage?.setItem(PORTAL_VIEW_STORAGE_KEY, view);
};

const ensureProfilePhonePrefix = () => {
    if (!String(profile.contactNumber || '').trim()) {
        profile.contactNumber = '+63';
    }
};

const formatProfilePhoneInput = () => {
    let value = String(profile.contactNumber || '').replace(/[^\d+]/g, '');

    if (value.startsWith('+63')) {
        profile.contactNumber = `+63${value.slice(3).replace(/\D/g, '').slice(0, 10)}`;
        return;
    }

    const digits = value.replace(/\D/g, '');
    if (!digits) {
        profile.contactNumber = '+63';
        return;
    }

    if (digits.startsWith('63')) {
        profile.contactNumber = `+63${digits.slice(2, 12)}`;
        return;
    }

    if (digits.startsWith('09')) {
        profile.contactNumber = `+63${digits.slice(1, 11)}`;
        return;
    }

    if (digits.startsWith('9')) {
        profile.contactNumber = `+63${digits.slice(0, 10)}`;
        return;
    }

    profile.contactNumber = `+63${digits.slice(0, 10)}`;
};

watch(() => profile.purok, () => {
    const zones = selectedPurokZones.value;

    if (zones.length && !zones.includes(profile.zone)) {
        profile.zone = '';
    }
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

        const result = editingDocumentRequestId.value
            ? await editDocumentRequest(editingDocumentRequestId.value, payload)
            : await createDocumentRequest(payload);
        if (result.success) {
            setStatus(editingDocumentRequestId.value ? 'Document request updated.' : 'Document request submitted.');
            closeModal();
            documentForm.value = defaultDocumentForm();
            editingDocumentRequestId.value = null;
        } else {
            setStatus(result.message || 'Failed to submit document request.', true);
        }
    } catch (err) {
        setStatus(err.message, true);
    } finally {
        isSubmitting.value = false;
    }
};

const submitDocumentRevisionRequest = async () => {
    const item = recordDetail.value?.item;
    if (!item?._id || isRevisionRequesting.value) return;

    if (!String(revisionRequestNote.value || '').trim()) {
        setStatus('Please enter a revision note before sending.', true);
        return;
    }

    isRevisionRequesting.value = true;
    try {
        const result = await requestDocumentRevision(item._id, revisionRequestNote.value.trim());
        if (result.success) {
            setStatus('Revision request sent to the admin.');
            const refreshed = {
                ...recordDetail.value.item,
                status: 'revision_requested',
                requesterRevisionNote: revisionRequestNote.value.trim(),
                revisionRequestedAt: new Date().toISOString()
            };
            const auditTrail = await loadDocumentAuditTrail(refreshed);
            recordDetail.value = {
                ...recordDetail.value,
                item: { ...refreshed, auditTrail }
            };
            revisionRequestNote.value = '';
            await loadMyDocuments();
            await loadAll();
        } else {
            setStatus(result.message || 'Failed to send revision request.', true);
        }
    } catch (error) {
        setStatus(error.message || 'Failed to send revision request.', true);
    } finally {
        isRevisionRequesting.value = false;
    }
};

const setResidentView = (view) => {
    currentView.value = view;
    setStoredPortalView(view);
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
const getOfficialInactiveReason = (official) => String(official?.notes || '').trim() || 'No reason provided';
const isOfficialInactive = (official) => official?.status === 'inactive';
const selectedAppointmentOfficial = computed(() => officials.value.find((official) => official._id === appointmentForm.value.officialId) || null);
const selectedAppointmentOfficialInactive = computed(() => isOfficialInactive(selectedAppointmentOfficial.value));
const inactiveAppointmentOfficialMessage = computed(() => {
    if (!selectedAppointmentOfficialInactive.value) {
        return '';
    }

    return `This official is currently inactive: ${getOfficialInactiveReason(selectedAppointmentOfficial.value)}`;
});
const formatAppointmentOfficialOption = (official) => {
    const base = `${official.name} - ${official.position}`;
    return isOfficialInactive(official) ? `${base} (Inactive: ${getOfficialInactiveReason(official)})` : base;
};
const canSubmitAppointment = computed(() => (
    !isSubmitting.value
    && Boolean(appointmentForm.value.officialId)
    && !selectedAppointmentOfficialInactive.value
    && Boolean(appointmentForm.value.startTime)
));
const appointmentSlotMinWidth = computed(() => {
    const longestLabelLength = availableSlots.value.reduce((longest, slot) => {
        const label = String(slot?.label || `${slot?.startTime || ''} - ${slot?.endTime || ''}`).trim();
        return Math.max(longest, label.length);
    }, 0);

    const estimatedWidth = Math.ceil(longestLabelLength * 10.5 + 28);
    return `${Math.min(Math.max(estimatedWidth, 160), 260)}px`;
});

const loadAvailableSlots = async () => {
    appointmentForm.value.startTime = '';
    appointmentForm.value.endTime = '';

    if (!appointmentForm.value.officialId || !appointmentForm.value.appointmentDate) {
        availableSlots.value = [];
        return;
    }

    if (selectedAppointmentOfficialInactive.value) {
        availableSlots.value = [];
        setStatus(inactiveAppointmentOfficialMessage.value, true);
        return;
    }

    isFetchingSlots.value = true;
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
const reservationInventoryPeakSummary = computed(() => buildFacilityInventoryPeakSummary(facilityAvailabilityDetails.value));
const selectedReservationItem = computed(() => getFacilityItemOption(reservationForm.facilityName) || FACILITY_ITEM_OPTIONS[0]);
const reservationRequiresQuantity = computed(() => selectedReservationItem.value?.isInventory === true);
const reservationHasSelectedTime = computed(() => Boolean(reservationForm.startTime && reservationForm.endTime));
const reservationAvailableQuantity = computed(() => {
    if (!reservationRequiresQuantity.value || !reservationHasSelectedTime.value) {
        return null;
    }

    const availableQuantity = Number(facilityAvailabilityDetails.value?.availableQuantity);
    return Number.isFinite(availableQuantity) ? availableQuantity : null;
});
const reservationQuantityMax = computed(() => {
    const availableQuantity = reservationAvailableQuantity.value;
    return availableQuantity === null ? selectedReservationItem.value.max : Math.max(availableQuantity, 0);
});
const reservationInventoryUnavailable = computed(() => reservationRequiresQuantity.value && reservationAvailableQuantity.value !== null && reservationAvailableQuantity.value <= 0);
const reservationInventoryMessage = computed(() => {
    if (!reservationRequiresQuantity.value || !reservationHasSelectedTime.value) {
        return '';
    }

    const availableQuantity = reservationAvailableQuantity.value;
    const label = selectedReservationItem.value?.availableLabel || 'items';

    if (availableQuantity !== null && availableQuantity <= 0) {
        return `No ${label} are available for the selected date and time. Please choose another time.`;
    }

    const requestedQuantity = Number(reservationForm.quantity || 0);
    if (availableQuantity !== null && requestedQuantity > availableQuantity) {
        return `Only ${availableQuantity} ${label} are available for the selected date and time.`;
    }

    return '';
});
const canSubmitReservation = computed(() => {
    if (isSubmitting.value || !reservationForm.startTime || !reservationForm.endTime) {
        return false;
    }

    if (!reservationRequiresQuantity.value) {
        return true;
    }

    const requestedQuantity = Number(reservationForm.quantity || 0);
    return requestedQuantity > 0 && !reservationInventoryUnavailable.value && requestedQuantity <= reservationQuantityMax.value;
});

const clampReservationQuantityToAvailability = () => {
    if (!reservationRequiresQuantity.value) {
        reservationForm.quantity = 0;
        return;
    }

    const maxQuantity = Number(reservationQuantityMax.value);
    if (Number.isFinite(maxQuantity) && maxQuantity > 0) {
        reservationForm.quantity = Math.min(Math.max(Number(reservationForm.quantity) || 1, 1), maxQuantity);
    }
};

const handleReservationAvailabilityChange = async () => {
    reservationForm.startTime = '';
    reservationForm.endTime = '';
    reservationForm.quantity = reservationRequiresQuantity.value ? Math.max(Number(reservationForm.quantity) || 1, 1) : 0;
    isFetchingFacilityAvailability.value = true;
    try {
        await loadFacilityAvailability(reservationForm.facilityName, reservationForm.reservationDate);
        clampReservationQuantityToAvailability();
    } finally {
        isFetchingFacilityAvailability.value = false;
    }
};

const handleReservationTimeChange = async () => {
    isFetchingFacilityAvailability.value = true;
    try {
        await loadFacilityAvailability(
            reservationForm.facilityName,
            reservationForm.reservationDate,
            reservationForm.startTime,
            reservationForm.endTime
        );
        clampReservationQuantityToAvailability();
    } finally {
        isFetchingFacilityAvailability.value = false;
    }
};

const handleSubmitAppointment = async () => {
    if (isSubmitting.value) return;

    if (selectedAppointmentOfficialInactive.value) {
        setStatus(inactiveAppointmentOfficialMessage.value, true);
        return;
    }

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
// Computed properties
const viewTitle = computed(() => ({
    profile: 'Manage your personal information',
    
    reservations: 'Reserve facilities for events',
    manpower: 'Request barangay manpower support',
    reports: 'Submit and monitor your reports',
    appointments: 'Schedule meetings with barangay officials',
    disaster: 'View weather and evacuation advisories'
}[currentView.value]));

const normalizeLabel = (value) => {
    if (!value) return 'Unspecified';
    return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getInitials = (profile) => {
    const first = String(profile.firstName || '').trim().split(' ')[0] || '';
    const last = String(profile.lastName || '').trim().split(' ')[0] || '';
    const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
    return initials || 'RP';
};

const translations = {
    en: {
        nav: { profile: 'My Profile', appointments: 'Appointments', documents: 'Documents', reservations: 'Facility Reservations', manpower: 'Manpower', reports: 'Reports', disaster: 'Disaster Advisories' },
        profile: {
            eyebrow: 'My Profile',
            heading: 'My Profile',
            lead: 'View and update your personal details. Ensure your name, contact, and address are correct for faster service.',
            labels: {
                firstName: 'First name', lastName: 'Last name', middleName: 'Middle name', suffix: 'Suffix',
                sex: 'Sex', birthDate: 'Birth date', civilStatus: 'Civil status', contactNumber: 'Contact number',
                email: 'Email', address: 'Address', purok: 'Purok', zone: 'Zone', citizenship: 'Citizenship',
                occupation: 'Occupation', profileImage: 'Profile Image URL', save: 'Save Profile', saving: 'Saving...', zoneHelper: 'Select the Zone for the chosen Purok.'
            }
        },
        appointments: { eyebrow: 'Appointments', heading: 'My appointments', requestButton: 'Request Appointment', searchPlaceholder: 'Search appointments', empty: 'No appointments found.' },
        documents: { eyebrow: 'Document Requests', heading: 'Request official barangay documents', requestButton: 'Request Document', searchPlaceholder: 'Search requests', empty: 'No document requests yet.' },
        reservations: { eyebrow: 'Facility Reservations', heading: 'My reservations', requestButton: 'Reserve Facility', searchPlaceholder: 'Search reservations', empty: 'No reservations found.' },
        manpower: { eyebrow: 'Manpower Requests', heading: 'My manpower requests', requestButton: 'Request Manpower', searchPlaceholder: 'Search manpower requests', empty: 'No manpower requests found.' },
        reports: { eyebrow: 'Reports', heading: 'Submit and monitor your reports' },
        modals: { appointmentRequest: 'Request Appointment', reservationRequest: 'Reserve Facility', manpowerRequest: 'Request Manpower', documentRequest: 'Request Document' }
    },
    tl: {
        nav: { profile: 'My Profile', appointments: 'Appointments', documents: 'Documents', reservations: 'Facility Reservations', manpower: 'Manpower', reports: 'Reports', disaster: 'Disaster Advisories' },
        profile: {
            eyebrow: 'My Profile',
            heading: 'Aking Profile',
            lead: 'Tingnan at i-update ang iyong personal na detalye. Siguraduhing tama ang pangalan, contact, at tirahan para mabilis ang serbisyo.',
            labels: {
                firstName: 'Pangalan', lastName: 'Apelyido', middleName: 'Gitnang Pangalan', suffix: 'Suffix',
                sex: 'Kasarian', birthDate: 'Petsa ng Kapanganakan', civilStatus: 'Katayuan', contactNumber: 'Numero ng Telepono',
                email: 'Email', address: 'Tirahan', purok: 'Purok', zone: 'Zone', citizenship: 'Pagkamamamayan',
                occupation: 'Trabaho', profileImage: 'Profile Image URL', save: 'I-save ang Profile', saving: 'Isinusumite...', zoneHelper: 'Piliin ang Zone para sa napiling Purok.'
            }
        },
        appointments: { eyebrow: 'Appointments', heading: 'My appointments', requestButton: 'Request Appointment', searchPlaceholder: 'Search appointments', empty: 'No appointments found.' },
        documents: { eyebrow: 'Document Requests', heading: 'Request official barangay documents', requestButton: 'Request Document', searchPlaceholder: 'Search requests', empty: 'No document requests yet.' },
        reservations: { eyebrow: 'Facility Reservations', heading: 'My reservations', requestButton: 'Reserve Facility', searchPlaceholder: 'Search reservations', empty: 'No reservations found.' },
        manpower: { eyebrow: 'Manpower Requests', heading: 'My manpower requests', requestButton: 'Request Manpower', searchPlaceholder: 'Search manpower requests', empty: 'No manpower requests found.' },
        reports: { eyebrow: 'Reports', heading: 'Submit and monitor your reports' },
        modals: { appointmentRequest: 'Request Appointment', reservationRequest: 'Reserve Facility', manpowerRequest: 'Request Manpower', documentRequest: 'Request Document' }
    }
};

const texts = computed(() => translations.en);

const matchesSearch = (item, term, fields) => {
    const needle = term.trim().toLowerCase();
    if (!needle) return true;
    return fields.some((field) => String(field(item) || '').toLowerCase().includes(needle));
};

const toFilterDate = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const matchesStatusFilter = (recordStatus, filterStatus) => {
    if (!filterStatus || filterStatus === 'all') return true;
    return String(recordStatus || '').toLowerCase() === String(filterStatus || '').toLowerCase();
};

const matchesDateFilter = (recordDate, filterDate) => {
    if (!filterDate) return true;
    return toFilterDate(recordDate) === filterDate;
};

const getCreatedTime = (record) => {
    const date = new Date(record?.createdAt || 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortNewestRequestsFirst = (records) => [...records].sort((left, right) => getCreatedTime(right) - getCreatedTime(left));
const getDocumentLatestActivityTime = (record) => {
    const candidates = [record?.updatedAt, record?.revisionRequestedAt, record?.generatedEmailSentAt, record?.generatedAt, record?.createdAt]
        .map((value) => new Date(value || 0).getTime())
        .filter((value) => !Number.isNaN(value));

    return candidates.length ? Math.max(...candidates) : 0;
};

const sortDocumentRequestsByLatestActivity = (records) => [...records].sort((left, right) => getDocumentLatestActivityTime(right) - getDocumentLatestActivityTime(left));

const paginateTable = (records, page) => {
    const total = records.length;
    const pages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
    const currentPage = Math.min(Math.max(Number(page) || 1, 1), pages);
    const start = (currentPage - 1) * TABLE_PAGE_SIZE;

    return {
        items: records.slice(start, start + TABLE_PAGE_SIZE),
        page: currentPage,
        pages,
        total
    };
};

const filteredAppointments = computed(() => sortNewestRequestsFirst(appointments.value.filter((item) => matchesSearch(item, appointmentSearch.value, [
    (record) => record.officialId?.name,
    (record) => record.officialId?.position,
    (record) => record.purpose,
    (record) => record.status,
    (record) => formatDate(record.appointmentDate)
]) && matchesStatusFilter(item.status, appointmentStatusFilter.value) && matchesDateFilter(item.appointmentDate || item.createdAt, appointmentDateFilter.value))));

const pagedAppointments = computed(() => paginateTable(filteredAppointments.value, appointmentPage.value));



const filteredReservations = computed(() => sortNewestRequestsFirst(reservations.value.filter((item) => matchesSearch(item, reservationSearch.value, [
    (record) => normalizeLabel(record.facilityName),
    (record) => record.purpose,
    (record) => record.status,
    (record) => formatDate(record.reservationDate)
]) && matchesStatusFilter(item.status, reservationStatusFilter.value) && matchesDateFilter(item.reservationDate || item.createdAt, reservationDateFilter.value))));

const pagedReservations = computed(() => paginateTable(filteredReservations.value, reservationPage.value));

const filteredManpowerRequests = computed(() => sortNewestRequestsFirst(manpowerRequests.value.filter((item) => matchesSearch(item, manpowerSearch.value, [
    (record) => record.title,
    (record) => normalizeLabel(record.assistanceType),
    (record) => normalizeLabel(record.priority),
    (record) => record.requestLocation,
    (record) => record.description,
    (record) => record.status,
    (record) => formatDate(record.requestDate)
]) && matchesStatusFilter(item.status, manpowerStatusFilter.value) && matchesDateFilter(item.requestDate || item.createdAt, manpowerDateFilter.value))));

const pagedManpowerRequests = computed(() => paginateTable(filteredManpowerRequests.value, manpowerPage.value));

const filteredReports = computed(() => sortNewestRequestsFirst(reports.value.filter((item) => matchesSearch(item, reportSearch.value, [
    (record) => record.title,
    (record) => normalizeLabel(record.reportType),
    (record) => normalizeLabel(record.priority),
    (record) => record.locationText,
    (record) => record.status,
    (record) => formatDate(record.createdAt)
]) && matchesStatusFilter(item.status, reportStatusFilter.value) && matchesDateFilter(item.createdAt || item.incidentDate, reportDateFilter.value))));

const pagedReports = computed(() => paginateTable(filteredReports.value, reportPage.value));

const filteredDocumentRequests = computed(() => sortDocumentRequestsByLatestActivity(documentRequests.value.filter((item) => matchesSearch(item, documentSearch.value, [
    (record) => normalizeLabel(record.type),
    (record) => record.purpose,
    (record) => record.status,
    (record) => getDocumentRequesterName(record),
    (record) => formatDate(record.createdAt)
]) && matchesStatusFilter(item.status, documentStatusFilter.value) && matchesDateFilter(item.createdAt, documentDateFilter.value))));

const pagedDocumentRequests = computed(() => paginateTable(filteredDocumentRequests.value, documentPage.value));

const reportTypeOptions = REPORT_TYPE_OPTIONS;

const formatLocalDateInputValue = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const todayDate = formatLocalDateInputValue();

const limitIncidentDateToToday = () => {
    if (reportForm.incidentDate && reportForm.incidentDate > todayDate) {
        reportForm.incidentDate = todayDate;
        setStatus('Date cannot be in the future.', true);
    }
};

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
    manpower: { path: (id) => `/manpower-requests/${id}`, terminal: ['rejected', 'completed', 'cancelled'], label: 'manpower request' },
    report: { path: (id) => `/reports/${id}`, terminal: ['resolved', 'rejected', 'closed'], label: 'report' },
    document: { path: (id) => `/documents/${id}`, terminal: ['pending'], label: 'document request' }
};

const isDocumentRevisionRequested = (item) => String(item?.status || '').toLowerCase() === 'revision_requested';
const canDeleteRecord = (type, item) => deleteConfig[type]?.terminal.includes(item?.status);
const canEditRecord = (type, item) => type === 'document' && item?.status === 'pending';
const canCancelAppointment = (item) => ['pending', 'approved'].includes(item?.status);
const canCancelManpowerRequest = (item) => ['pending', 'approved'].includes(item?.status);

const auditEntityTypeByRecordType = {
    document: 'DocumentRequest',
    reservation: 'FacilityReservation',
    manpower: 'ManpowerRequest',
    report: 'Report',
    appointment: 'Appointment'
};

const getAuditEntityType = (type) => auditEntityTypeByRecordType[type] || '';

const loadRecordAuditTrail = async (type, item) => {
    if (!item?._id) return [];
    const entityType = getAuditEntityType(type);
    if (!entityType) return [];

    try {
        const response = await apiFetch(`/status-audit/history/${entityType}/${item._id}`);
        return response?.data || [];
    } catch (error) {
        setStatus(error.message || 'Failed to load audit trail.', true);
        return [];
    }
};

const loadDocumentAuditTrail = (item) => loadRecordAuditTrail('document', item);

const openRecordDetail = async (type, item) => {
    if (type !== 'document') {
        const itemWithAudit = { ...item, auditTrail: await loadRecordAuditTrail(type, item) };
        recordDetail.value = { type, item: itemWithAudit };
        return;
    }

    try {
        const response = await apiFetch(`/documents/${item._id}`);
        const fullItem = response?.data || response || item;
        fullItem.auditTrail = await loadDocumentAuditTrail(fullItem);
        recordDetail.value = { type, item: fullItem };
        revisionRequestNote.value = fullItem.requesterRevisionNote || '';
    } catch (error) {
        setStatus(error.message || 'Failed to load document request details.', true);
        recordDetail.value = { type, item };
        revisionRequestNote.value = item?.requesterRevisionNote || '';
    }
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

const cancelResidentManpowerRequest = async (item) => {
    if (!confirm('Cancel this manpower request?')) return;
    try {
        await apiFetch(`/manpower-requests/${item._id}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ cancellationReason: 'Cancelled by resident' })
        });
        setStatus('Manpower request cancelled.');
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
        let deleteResult = { success: true };
        if (type === 'document') {
            deleteResult = await deleteDocumentRequest(item._id);
        } else {
            await apiFetch(config.path(item._id), { method: 'DELETE' });
        }
        if (!deleteResult.success) {
            throw new Error(deleteResult.message || 'Failed to delete request');
        }
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
        document: 'Document Request Details',
        reservation: 'Reservation Details',
        manpower: 'Manpower Request Details',
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
        document: [
            ['Document Type', normalizeLabel(item.type)],
            ['Purpose', item.purpose || item.fields?.PURPOSE],
            ['Status', normalizeLabel(item.status)],
            ['Revision Note', item.requesterRevisionNote],
            ['Revision Requested On', item.revisionRequestedAt ? formatDateTime(item.revisionRequestedAt) : ''],
            ['Requested On', formatDateTime(item.createdAt)]
        ],
        reservation: [
            ['Facility', normalizeLabel(item.facilityName)],
            ['Schedule', `${formatDate(item.reservationDate)} | ${item.startTime}-${item.endTime}`],
            ['Quantity', getFacilityReservationQuantity(item)],
            ['Purpose', item.purpose],
            ['Details', item.reservationDetails],
            ['Status', normalizeLabel(item.status)],
            ['Admin Notes', item.adminNotes]
        ],
        manpower: [
            ['Title', item.title],
            ['Assistance Type', normalizeLabel(item.assistanceType)],
            ['Schedule', `${formatDate(item.requestDate)} | ${item.requestTime || 'Time TBD'}`],
            ['Estimated Duration', item.estimatedDuration],
            ['Personnel Needed', item.requestedPersonnelCount],
            ['Priority', normalizeLabel(item.priority)],
            ['Location', item.requestLocation],
            ['Description', item.description],
            ['Status', normalizeLabel(item.status)],
            ['Admin Notes', item.adminNotes],
            ['Completion Notes', item.completionNotes]
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

    const type = recordDetail.value?.type;
    const entries = [];
    if (item.createdAt) {
        entries.push({
            label: type === 'report' ? 'Submitted' : 'Requested',
            value: formatDateTime(item.createdAt),
            note: type === 'document'
                ? `${normalizeLabel(item.type)} request submitted`
                : `${normalizeLabel(type)} record created`
        });
    }

    (Array.isArray(item.auditTrail) ? item.auditTrail : [])
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((entry) => {
            entries.push({
                label: normalizeLabel(entry.newStatus || 'Status updated'),
                value: formatDateTime(entry.createdAt),
                note: entry.reason || entry.actionDescription || ''
            });
        });

    if (type === 'manpower') {
        const existingStatusLabels = new Set(entries.map((entry) => String(entry.label || '').toLowerCase()));

        (Array.isArray(item.statusHistory) ? item.statusHistory : [])
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .forEach((entry, index) => {
                const label = normalizeLabel(entry.newStatus || 'Status updated');
                const key = String(label || '').toLowerCase();
                if (existingStatusLabels.has(key)) return;
                existingStatusLabels.add(key);
                entries.push({
                    label,
                    value: formatDateTime(entry.createdAt || item.updatedAt),
                    note: entry.reason || `Status changed from ${normalizeLabel(entry.previousStatus)} to ${label}`
                });
            });

        const currentStatus = String(item.status || '').toLowerCase();
        if (currentStatus && currentStatus !== 'pending' && !existingStatusLabels.has(normalizeLabel(currentStatus).toLowerCase())) {
            entries.push({
                label: normalizeLabel(currentStatus),
                value: formatDateTime(item.updatedAt || item.createdAt),
                note: 'Latest manpower status'
            });
        }
    }

    if (type === 'document' && item.generatedAt) {
        entries.push({
            label: 'Generated',
            value: formatDateTime(item.generatedAt),
            note: 'PDF copy generated'
        });
    }

    if (type === 'document' && item.generatedEmailSentAt) {
        entries.push({
            label: 'Sent to requester',
            value: formatDateTime(item.generatedEmailSentAt),
            note: 'Soft copy emailed to requester'
        });
    }

    if (entries.length > 1 || type === 'document') {
        return entries;
    }

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

const openDocumentRequestModal = () => {
    editingDocumentRequestId.value = null;
    documentForm.value = defaultDocumentForm();
    activeModal.value = 'document';
};

const openDocumentRequestEditor = (item) => {
    recordDetail.value = null;
    editingDocumentRequestId.value = item?._id || null;
    const defaultFields = getDocumentDefaultFields();
    documentForm.value = {
        type: item?.type || 'certificate',
        fields: {
            FULL_NAME: item?.fields?.FULL_NAME || defaultFields.FULL_NAME,
            AGE: item?.fields?.AGE || defaultFields.AGE,
            BARANGAY: item?.fields?.BARANGAY || defaultFields.BARANGAY,
            CITY: item?.fields?.CITY || defaultFields.CITY
        },
        purpose: item?.purpose || ''
    };
    activeModal.value = 'document';
};

const closeModal = () => {
    const wasDocumentModal = activeModal.value === 'document';
    activeModal.value = null;
    editingDocumentRequestId.value = null;
    if (wasDocumentModal) {
        documentForm.value = defaultDocumentForm();
    }
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
    const error = getFilesSizeError(incoming);

    if (error) {
        event.target.value = '';
        reportProofFiles.value = [];
        setStatus(error, true);
        return;
    }

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

    if (selectedPurokZones.value.length && !selectedPurokZones.value.includes(profile.zone)) {
        setStatus(`Please select a zone for Purok ${profile.purok}.`, true);
        return;
    }

    isSubmitting.value = true;
    try {
        const formData = new FormData();

        Object.entries(profile).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        const croppedProfileImage = await createCroppedProfileImageFile();
        if (croppedProfileImage) {
            formData.append('profileImage', croppedProfileImage);
        }

        await saveProfile(formData);
        clearProfileImageSelection();
        isEditingProfile.value = false;
    } finally {
        isSubmitting.value = false;
    }
};

const toggleProfileEdit = async () => {
    if (isEditingProfile.value) {
        clearProfileImageSelection();
        await loadProfile();
        isEditingProfile.value = false;
        return;
    }

    isEditingProfile.value = true;
};

const cancelProfileEdit = async () => {
    if (isSubmitting.value) return;
    clearProfileImageSelection();
    isEditingProfile.value = false;
    await loadProfile();
};

onUnmounted(() => {
    clearProfileImageSelection();
});

const handleChangePassword = async () => {
    if (isChangingPassword.value) return;

    if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
        setStatus('New passwords do not match.', true);
        return;
    }

    if (changePasswordRules.value.some((rule) => !rule.passed)) {
        setStatus('Please complete all password requirements.', true);
        return;
    }

    isChangingPassword.value = true;
    try {
        const response = await apiFetch('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(changePasswordForm.value)
        });

        setStatus(response.message || 'Password updated successfully.');
        changePasswordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        isChangingPassword.value = false;
    }
};

const syncResidentAuthUser = (updates = {}) => {
    if (!user.value) return;

    user.value = { ...user.value, ...updates };
    const auth = getAuth();
    if (auth.token) {
        setAuth(auth.token, user.value);
    }
};

const handleRequestEmailChange = async () => {
    if (isChangingEmail.value) return;

    if (!emailChangeForm.value.newEmail || !emailChangeForm.value.currentPassword) {
        setStatus('Please enter your new Gmail and current password.', true);
        return;
    }

    isChangingEmail.value = true;
    try {
        const response = await apiFetch('/auth/email-change-request', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword: emailChangeForm.value.currentPassword,
                newEmail: emailChangeForm.value.newEmail,
                appUrl: globalThis.location?.origin || '',
                redirectPath: '/portal'
            })
        });

        syncResidentAuthUser({ pendingEmail: response.pendingEmail || emailChangeForm.value.newEmail });
        emailChangeForm.value = { newEmail: '', currentPassword: '' };
        setStatus(response.message || 'A confirmation link has been sent to your new Gmail.');
    } catch (error) {
        setStatus(error.message || 'Unable to send Gmail verification right now.', true);
    } finally {
        isChangingEmail.value = false;
    }
};

const confirmResidentEmailChangeFromUrl = async () => {
    const params = new URLSearchParams(globalThis.location.search);
    const emailChangeToken = params.get('emailChangeToken') || '';
    const email = params.get('email') || '';

    if (!emailChangeToken || !email || isConfirmingEmailChange.value) {
        return;
    }

    isConfirmingEmailChange.value = true;
    try {
        const response = await apiFetch('/auth/email-change-confirm', {
            method: 'POST',
            body: JSON.stringify({ email, emailChangeToken })
        });

        syncResidentAuthUser({ ...(response.user || {}), pendingEmail: '' });
        profile.email = email;
        setStatus(response.message || 'Gmail updated successfully.');

        if (globalThis.history?.replaceState) {
            globalThis.history.replaceState({}, '', globalThis.location.pathname);
        }
    } catch (error) {
        setStatus(error.message || 'Unable to confirm Gmail update.', true);
    } finally {
        isConfirmingEmailChange.value = false;
    }
};

const handleSubmitReservation = async () => {
    if (isSubmitting.value) return;

    if (reservationRequiresQuantity.value) {
        const availableQuantity = Number(facilityAvailabilityDetails.value?.availableQuantity);

        if (Number.isFinite(availableQuantity)) {
            const requestedQuantity = Number(reservationForm.quantity || 0);

            if (availableQuantity <= 0) {
                setStatus(`No ${selectedReservationItem.value?.availableLabel || 'items'} are available for the selected time.`, true);
                return;
            }

            if (requestedQuantity > availableQuantity) {
                setStatus(`Only ${availableQuantity} ${selectedReservationItem.value?.availableLabel || 'items'} are available for the selected time.`, true);
                return;
            }
        }
    }

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

const handleSubmitManpowerRequest = async () => {
    if (isSubmitting.value) return;

    if (Number(manpowerForm.requestedPersonnelCount || 0) < 1) {
        setStatus('Please enter at least 1 personnel needed.', true);
        return;
    }

    isSubmitting.value = true;
    try {
        const result = await submitManpowerRequest(() => loadAll());
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
        setStatus('Date is required for this report type.', true);
        return;
    }

    if (reportForm.incidentDate && reportForm.incidentDate > todayDate) {
        setStatus('Date cannot be in the future.', true);
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
    await confirmResidentEmailChangeFromUrl();
    currentView.value = getStoredPortalView() || 'appointments';
    await loadAll();
    await loadMyDocuments();
});

onUnmounted(() => {});
</script>
