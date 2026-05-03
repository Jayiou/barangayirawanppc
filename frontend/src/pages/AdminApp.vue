<template>
    <div v-if="!isAuthenticated" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; padding: 20px;">
        <div style="width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center;">
            <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />
            <BrandMark initials="BC" eyebrow="Barangay Admin" title="Barangay Connect" style="margin-bottom: 2rem;" />
            <form class="stack" @submit.prevent="loginAdmin" style="width: 100%; background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05);">
                <div class="section-head" style="text-align: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.5rem; color: #1a1a1a;">Administrator Login</h3>
                    <p class="fine-print" style="margin-top: 0.5rem;">Sign in to manage the barangay portal</p>
                </div>
                <label>
                    <span>Username</span>
                    <input v-model="loginForm.username" type="text" required>
                </label>
                <label>
                    <span>Password</span>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input v-model="loginForm.password" :type="showAdminPassword ? 'text' : 'password'" required style="padding-right: 42px; width: 100%;">
                        <button
                            type="button"
                            @click="showAdminPassword = !showAdminPassword"
                            :aria-label="showAdminPassword ? 'Hide password' : 'Show password'"
                            style="position: absolute; right: 10px; width: 28px; height: 28px; border: none; border-radius: 8px; background: transparent; color: #5e6f66; display: grid; place-items: center;"
                        >
                            <i :class="showAdminPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                        </button>
                    </div>
                </label>
                <button type="submit" class="primary-button" style="justify-content: center; width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: 6px; margin-top: 0.5rem;"><i class="fa-solid fa-lock"></i> Log In</button>
            </form>
        </div>
    </div>

    <div class="page-shell app-shell" v-else>
        <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button class="sidebar-close-btn" @click="sidebarOpen = false"><i class="fa-solid fa-xmark"></i></button>
            <BrandMark initials="BC" eyebrow="Admin Portal" title="Barangay Connect" />

            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'dashboard' }" type="button" @click="currentView = 'dashboard'"><i class="fa-solid fa-chart-pie"></i> Dashboard</button>
                <button :class="{ active: currentView === 'announcements' }" type="button" @click="currentView = 'announcements'"><i class="fa-solid fa-megaphone"></i> Announcements</button>
                <button :class="{ active: currentView === 'residents' }" type="button" @click="currentView = 'residents'"><i class="fa-solid fa-users"></i> Residents</button>
                <button :class="{ active: currentView === 'documents' }" type="button" @click="currentView = 'documents'"><i class="fa-solid fa-file-signature"></i> Documents <span class="badge" v-if="pendingCounts.docs">{{ pendingCounts.docs }}</span></button>
                <button :class="{ active: currentView === 'appointments' }" type="button" @click="currentView = 'appointments'"><i class="fa-solid fa-calendar-check"></i> Appointments <span class="badge" v-if="pendingCounts.appoints">{{ pendingCounts.appoints }}</span></button>
                <button :class="{ active: currentView === 'reservations' }" type="button" @click="currentView = 'reservations'"><i class="fa-solid fa-building"></i> Facilities <span class="badge" v-if="pendingCounts.reserves">{{ pendingCounts.reserves }}</span></button>
                <button :class="{ active: currentView === 'reports' }" type="button" @click="currentView = 'reports'"><i class="fa-solid fa-bullhorn"></i> Reports <span class="badge" v-if="pendingCounts.reports">{{ pendingCounts.reports }}</span></button>
                <button :class="{ active: currentView === 'officials' }" type="button" @click="currentView = 'officials'"><i class="fa-solid fa-user-tie"></i> Officials</button>
            </nav>

            <div class="sidebar-block">
                <span class="eyebrow">Logged In As</span>
                <div v-if="user">
                    <strong>{{ user.username }}</strong>
                    <div class="fine-print">{{ user.email }}</div>
                </div>
            </div>

            <button type="button" class="ghost-button" @click="logout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
        </aside>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
            </header>
            <section class="hero-banner" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <span class="eyebrow">Admin Workspace</span>
                    <h2>{{ viewTitle }}</h2>
                </div>
            </section>

            <!-- Dashboard View -->
            <section class="app-view" :class="{ active: currentView === 'dashboard' }">
                <article class="content-card dashboard-hero-card">
                    <div class="dashboard-hero-copy">
                        <span class="eyebrow">Operations Overview</span>
                        <h3>Barangay control center</h3>
                        <p>Monitor requests, approvals, and announcements from a single command view built for daily admin work.</p>
                        <div class="dashboard-pulse-grid">
                            <div class="dashboard-pulse-item">
                                <span>Total residents</span>
                                <strong>{{ totalResidentsCount }}</strong>
                            </div>
                            <div class="dashboard-pulse-item">
                                <span>Pending queue</span>
                                <strong>{{ pendingWorkload }}</strong>
                            </div>
                            <div class="dashboard-pulse-item">
                                <span>Live announcements</span>
                                <strong>{{ activeAnnouncementsCount }}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-ring-panel">
                        <div class="dashboard-ring" :style="workloadRingStyle">
                            <div class="dashboard-ring-inner">
                                <strong>{{ pendingWorkload }}</strong>
                                <span>Pending</span>
                            </div>
                        </div>
                        <div class="dashboard-ring-caption">
                            <strong>Portal activity</strong>
                            <span>Queue distribution across the main admin services.</span>
                        </div>
                    </div>
                </article>

                <div class="summary-grid dashboard-metrics-grid">
                    <article
                        v-for="metric in dashboardMetrics"
                        :key="metric.label"
                        class="summary-card dashboard-summary-card"
                        :class="metric.tone"
                    >
                        <span><i :class="metric.icon"></i> {{ metric.label }}</span>
                        <strong>{{ metric.value }}</strong>
                        <div class="fine-print">{{ metric.detail }}</div>
                    </article>
                </div>

                <div class="portal-grid dashboard-panels">
                    <article class="content-card dashboard-chart-card">
                        <div class="section-head dashboard-section-head">
                            <div>
                                <span class="eyebrow">Workload Mix</span>
                                <h3>Pending requests by service</h3>
                            </div>
                            <div class="dashboard-chip">{{ pendingWorkload }} total</div>
                        </div>
                        <div class="dashboard-bar-chart">
                            <div v-for="item in workloadBars" :key="item.key" class="dashboard-bar-row">
                                <div class="dashboard-bar-meta">
                                    <strong>{{ item.label }}</strong>
                                    <span>{{ item.value }} items • {{ item.percentLabel }}</span>
                                </div>
                                <div class="dashboard-bar-track">
                                    <div class="dashboard-bar-fill" :class="item.tone" :style="{ width: item.width }"></div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article class="content-card dashboard-chart-card">
                        <div class="section-head dashboard-section-head">
                            <div>
                                <span class="eyebrow">Community Pulse</span>
                                <h3>Active records snapshot</h3>
                            </div>
                        </div>
                        <div class="dashboard-insight-grid">
                            <div class="dashboard-insight">
                                <span>Residents approved</span>
                                <strong>{{ approvedResidentsCount }}</strong>
                                <small>{{ totalResidentsCount }} total profiles</small>
                            </div>
                            <div class="dashboard-insight">
                                <span>Public announcements</span>
                                <strong>{{ activeAnnouncementsCount }}</strong>
                                <small>{{ announcements.length }} stored posts</small>
                            </div>
                            <div class="dashboard-insight">
                                <span>Open reports</span>
                                <strong>{{ pendingCounts.reports }}</strong>
                                <small>For follow-up</small>
                            </div>
                            <div class="dashboard-insight">
                                <span>Active officials</span>
                                <strong>{{ activeOfficialsCount }}</strong>
                                <small>{{ officials.length }} offices listed</small>
                            </div>
                        </div>
                    </article>
                </div>

                <article class="content-card dashboard-feed-card">
                    <div class="section-head dashboard-section-head">
                        <div>
                            <span class="eyebrow">Latest Posts</span>
                            <h3>Announcements appearing on the homepage</h3>
                        </div>
                    </div>
                    <div class="dashboard-feed-list">
                        <div v-for="announcement in latestAnnouncements" :key="announcement._id" class="dashboard-feed-item">
                            <div>
                                <strong>{{ announcement.title }}</strong>
                                <p>{{ announcement.description }}</p>
                            </div>
                            <StatusBadge :status="announcement.isActive ? 'active' : 'inactive'" />
                        </div>
                        <div v-if="latestAnnouncements.length === 0" class="dashboard-empty-state">
                            No announcements yet.
                        </div>
                    </div>
                </article>
            </section>

            <!-- Data Table Generic Loop For Other Views -->
            <section class="app-view" :class="{ active: currentView !== 'dashboard' }">
                <div class="portal-grid">
                    <article class="content-card" style="overflow-x: auto;">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <span class="eyebrow">{{ viewTitle }}</span>
                                <h3>Manage {{ currentView }} records</h3>
                            </div>
                            <div class="toolbar" style="margin: 0; display: flex; gap: 10px;">
                                <span class="search-icon" v-if="currentView === 'residents'"><i class="fa-solid fa-search"></i></span>
                                <input v-if="currentView === 'residents'" v-model="residentSearch" type="search" placeholder="Search residents..." style="padding-left: 30px;">
                                <button v-if="currentView === 'announcements'" class="primary-button" @click="openModal('announcement', {})"><i class="fa-solid fa-plus"></i> Add Announcement</button>
                                <button v-if="currentView === 'officials'" class="primary-button" @click="openModal('official', {})"><i class="fa-solid fa-plus"></i> Add Official</button>
                            </div>
                        </div>

                        <table class="data-table">
                            <thead>
                                <tr v-if="currentView === 'residents'">
                                    <th scope="col">Name</th>
                                    <th scope="col">Address</th>
                                    <th scope="col">Account Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'documents'">
                                    <th scope="col">Type</th>
                                    <th scope="col">Resident</th>
                                    <th scope="col">Purpose</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'appointments'">
                                    <th scope="col">Date & Time</th>
                                    <th scope="col">Resident</th>
                                    <th scope="col">Concern</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'reservations'">
                                    <th scope="col">Facility & Date</th>
                                    <th scope="col">Resident</th>
                                    <th scope="col">Purpose</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'reports'">
                                    <th scope="col">Issue</th>
                                    <th scope="col">Resident / Type</th>
                                    <th scope="col">Priority</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'announcements'">
                                    <th scope="col">Title</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Display Order</th>
                                    <th scope="col">Date Range</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                <tr v-if="currentView === 'officials'">
                                    <th scope="col">Name</th>
                                    <th scope="col">Position</th>
                                    <th scope="col">Contact</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in currentList" :key="item._id" class="table-row hoverable">
                                    <td v-if="currentView === 'residents'"><strong>{{ item.firstName }} {{ item.lastName }}</strong></td>
                                    <td v-if="currentView === 'residents'">{{ item.address }}</td>
                                    <td v-if="currentView === 'residents'"><StatusBadge :status="item.userId?.accountStatus || 'pending'" /></td>
                                    <td v-if="currentView === 'residents'">
                                        <button class="icon-button" @click="openModal('resident', item)"><i class="fa-solid fa-pen-to-square"></i> Act</button>
                                    </td>

                                    <td v-if="currentView === 'documents'"><strong>{{ item.documentType.replaceAll('_', ' ') }}</strong></td>
                                    <td v-if="currentView === 'documents'">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if="currentView === 'documents'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'documents'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'documents'">
                                        <button class="icon-button" @click="openModal('document', item)"><i class="fa-solid fa-pen-to-square"></i> Act</button>
                                    </td>

                                    <td v-if="currentView === 'appointments'"><strong>{{ formatDate(item.appointmentDate) }}</strong><br><small>{{ item.timeSlot }}</small></td>
                                    <td v-if="currentView === 'appointments'">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if="currentView === 'appointments'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'appointments'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'appointments'">
                                        <button class="icon-button" @click="openModal('appointment', item)"><i class="fa-solid fa-pen-to-square"></i> Act</button>
                                    </td>

                                    <td v-if="currentView === 'reservations'"><strong>{{ item.facilityName.replaceAll('_', ' ') }}</strong><br><small>{{ formatDate(item.reservationDate) }} ({{ item.startTime }} - {{ item.endTime }})</small></td>
                                    <td v-if="currentView === 'reservations'">{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                    <td v-if="currentView === 'reservations'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'reservations'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'reservations'">
                                        <button class="icon-button" @click="openModal('reservation', item)"><i class="fa-solid fa-pen-to-square"></i> Act</button>
                                    </td>

                                    <td v-if="currentView === 'reports'"><strong>{{ item.title }}</strong><br><small>{{ formatDate(item.incidentDate) }}</small></td>
                                    <td v-if="currentView === 'reports'">{{ item.residentId ? (item.residentId.firstName + ' ' + item.residentId.lastName) : 'Anonymous' }}<br><small>{{ item.reportType.replaceAll('_', ' ') }}</small></td>
                                    <td v-if="currentView === 'reports'"><span class="priority-badge" :class="'p-' + item.priority">{{ item.priority.toUpperCase() }}</span></td>
                                    <td v-if="currentView === 'reports'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'reports'">
                                        <button class="icon-button" @click="openModal('report', item)"><i class="fa-solid fa-pen-to-square"></i> Act</button>
                                    </td>

                                    <td v-if="currentView === 'announcements'"><strong>{{ item.title }}</strong></td>
                                    <td v-if="currentView === 'announcements'"><StatusBadge :status="item.isActive ? 'active' : 'inactive'" /></td>
                                    <td v-if="currentView === 'announcements'">{{ item.displayOrder }}</td>
                                    <td v-if="currentView === 'announcements'"><small>{{ formatDate(item.startDate) }} - {{ item.endDate ? formatDate(item.endDate) : 'No end date' }}</small></td>
                                    <td v-if="currentView === 'announcements'">
                                        <button class="icon-button" @click="openModal('announcement', item)"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                    </td>

                                    <td v-if="currentView === 'officials'"><strong>{{ item.fullName }}</strong></td>
                                    <td v-if="currentView === 'officials'">{{ item.position }}</td>
                                    <td v-if="currentView === 'officials'">{{ item.contactNumber || 'N/A' }}</td>
                                    <td v-if="currentView === 'officials'"><StatusBadge :status="item.availabilityStatus || 'active'" /></td>
                                    <td v-if="currentView === 'officials'">
                                        <button class="icon-button" @click="openModal('official', item)"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                    </td>
                                </tr>
                                <tr v-if="currentList.length === 0">
                                    <td colspan="6" style="text-align: center; padding: 30px; color: #777;"><i class="fa-solid fa-folder-open"></i> No records found.</td>
                                </tr>
                            </tbody>
                        </table>
                    </article>
                </div>
            </section>
        </main>

        <!-- Dynamic Action Modal -->
        <div class="admin-modal-backdrop" v-if="activeModal" @click.self="activeModal = null">
            <div class="admin-modal">
                <button class="admin-modal-close" @click="activeModal = null"><i class="fa-solid fa-xmark"></i></button>

                <div v-if="activeModal === 'resident'">
                    <h2><i class="fa-solid fa-user-check"></i> Act on Resident</h2>
                    <p class="fine-print">Review resident details and decide account status.</p>
                    <div class="stack" style="background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 15px 0;">
                        <p><strong>Name:</strong> {{ selectedItem.firstName }} {{ selectedItem.middleName }} {{ selectedItem.lastName }}</p>
                        <p><strong>Birth Date:</strong> {{ formatDate(selectedItem.birthDate) }} (Age: {{ calculateAge(selectedItem.birthDate) }})</p>
                        <p><strong>Address:</strong> {{ selectedItem.address }}, {{ selectedItem.purok }}</p>
                        <p><strong>Contact:</strong> {{ selectedItem.contactNumber }} | {{ selectedItem.email }}</p>
                        <button v-if="selectedItem.proofOfResidency" type="button" class="ghost-button" @click="openResidentProof(selectedItem._id)">
                            <i class="fa-solid fa-id-card"></i> View Proof
                        </button>
                    </div>
                    <form class="stack" @submit.prevent="handleSave">
                        <label>
                            <span>Action / Status</span>
                            <select v-model="editForm.status" required>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                            </select>
                        </label>
                        <button type="submit" class="primary-button"><i class="fa-solid fa-save"></i> Save Changes</button>
                    </form>
                </div>

                <div v-if="['document', 'appointment', 'reservation', 'report'].includes(activeModal)">
                    <h2><i class="fa-solid fa-pen-to-square"></i> Update Request</h2>
                    <p class="fine-print">Change the status and provide notes to the resident.</p>
                    <form class="stack" @submit.prevent="saveGenericStatus" style="margin-top: 15px;">
                        <!-- Using contextual dropdowns based on modal -->
                        <label>
                            <span>New Status</span>
                            <select v-model="editForm.status" required v-if="activeModal === 'document'">
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="approved">Approved</option>
                                <option value="ready_for_pickup">Ready for Pickup</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select v-model="editForm.status" required v-if="activeModal === 'appointment' || activeModal === 'reservation'">
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rescheduled">Rescheduled</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select v-model="editForm.status" required v-if="activeModal === 'report'">
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                                <option value="closed">Closed</option>
                            </select>
                        </label>
                        <label>
                            <span>Admin Notes (Sent in Email)</span>
                            <textarea v-model="editForm.adminNotes" rows="3" placeholder="Explain the status change..."></textarea>
                        </label>
                        <button type="submit" class="primary-button"><i class="fa-solid fa-paper-plane"></i> Save & Notify Resident</button>
                    </form>
                </div>

                <div v-if="activeModal === 'announcement'">
                    <h2><i class="fa-solid fa-megaphone"></i> Announcement Details</h2>
                    <form class="stack" @submit.prevent="handleSaveAnnouncement" style="margin-top: 15px;">
                        <input type="hidden" v-model="editForm._id">
                        <label><span>Title</span><input v-model="editForm.title" required></label>
                        <label><span>Description</span><textarea v-model="editForm.description" rows="4" required></textarea></label>
                        <label><span>Image</span><input type="file" @change="onAnnouncementImageUpload" accept="image/*"></label>
                        <div v-if="editForm.imagePath && !announcementImageFile" style="margin-top: -10px; font-size: 0.9rem; color: #666;">Current: {{ editForm.imagePath }}</div>
                        <label><span>Start Date</span><input v-model="editForm.startDate" type="datetime-local" required></label>
                        <label><span>End Date (Optional)</span><input v-model="editForm.endDate" type="datetime-local"></label>
                        <div v-if="!editForm._id" style="font-size: 0.95rem; color: #1f3c5a; background: #eaf3ff; padding: 12px 14px; border-radius: 8px; border-left: 4px solid #4a90e2; margin-bottom: 15px; display: grid; gap: 4px;">
                            <strong>Display Order</strong>
                            <span v-if="nextDisplayOrderLoading">Loading next number...</span>
                            <span v-else-if="nextDisplayOrder !== null && nextDisplayOrder !== undefined">Next display order: {{ nextDisplayOrder }}</span>
                            <span v-else>Will be auto-assigned when saved</span>
                        </div>
                        <label v-else><span>Display Order</span><input v-model.number="editForm.displayOrder" type="number" min="1"></label>
                        <label>
                            <span>Active</span>
                            <select v-model="editForm.isActive">
                                <option :value="true">Active</option>
                                <option :value="false">Inactive</option>
                            </select>
                        </label>
                        <button type="submit" class="primary-button"><i class="fa-solid fa-save"></i> {{ editForm._id ? 'Update' : 'Create' }} Announcement</button>
                        <button v-if="editForm._id" type="button" class="ghost-button" @click="handleDeleteAnnouncement" style="color: #d52a2a;"><i class="fa-solid fa-trash"></i> Delete</button>
                    </form>
                </div>

                <div v-if="activeModal === 'official'">
                    <h2><i class="fa-solid fa-user-tie"></i> Official Details</h2>
                    <form class="stack" @submit.prevent="saveOfficial" style="margin-top: 15px;">
                        <input type="hidden" v-model="editForm._id">
                        <label><span>Full Name</span><input v-model="editForm.fullName" required></label>
                        <label><span>Position</span><input v-model="editForm.position" required></label>
                        <label><span>Contact Number</span><input v-model="editForm.contactNumber"></label>
                        <label><span>Email</span><input v-model="editForm.email" type="email"></label>
                        <label><span>Office Days</span><input v-model="editForm.officeDays" placeholder="Mon, Tue, Wed"></label>
                        <label><span>Session Start</span><input v-model="editForm.officeStartTime" type="time"></label>
                        <label><span>Session End</span><input v-model="editForm.officeEndTime" type="time"></label>
                        <label><span>Location</span><input v-model="editForm.officeLocation" placeholder="Barangay Hall"></label>
                        <label>
                            <span>Status</span>
                            <select v-model="editForm.availabilityStatus">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>
                        <button type="submit" class="primary-button"><i class="fa-solid fa-save"></i> Save Official</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch, formatDate } from '@/shared/client';
import { useAdminAuth } from '@/composables/useAdminAuth';
import { useAdminData } from '@/composables/useAdminData';
import { useAnnouncements } from '@/composables/useAnnouncements';
import { useResidents } from '@/composables/useResidents';
import { useOfficials } from '@/composables/useOfficials';

// Composables
const { isAuthenticated, user, loginForm, loginStatus, loginError, loginAdmin, logout, initSession } = useAdminAuth();
const { officials, residents, appointments, documentRequests, reservations, reports, announcements, dashboardStatus, dashboardError, msg, loadAll } = useAdminData();
const { announcementForm, announcementImageFile, nextDisplayOrder, nextDisplayOrderLoading, fetchNextDisplayOrder, saveAnnouncement, deleteAnnouncement, onImageUpload: onAnnouncementImageUpload } = useAnnouncements();
const { residentSearch, filteredResidents, calculateAge, saveResidentStatus, openResidentProof } = useResidents(residents);
const { saveOfficial, deleteOfficial } = useOfficials();

// Local state
const sidebarOpen = ref(false);
const showAdminPassword = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const currentView = ref('dashboard');
const activeModal = ref(null);
const selectedItem = ref({});
const editForm = reactive({});

const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
};

const showToast = (message, isError = false) => {
    clearToast();

    if (!message || message === 'Signing in...' || message === 'Loading portal...') {
        return;
    }

    toastMessage.value = message;
    toastType.value = isError ? 'error' : 'success';
    toastTimer = setTimeout(() => {
        clearToast();
    }, 3500);
};


// Computed properties
const pendingCounts = computed(() => ({
    docs: documentRequests.value.filter(r => r.status === 'pending' || r.status === 'processing').length,
    appoints: appointments.value.filter(r => r.status === 'pending').length,
    reserves: reservations.value.filter(r => r.status === 'pending').length,
    reports: reports.value.filter(r => r.status === 'pending' || r.status === 'reviewing').length,
    accs: residents.value.filter(r => r.userId?.accountStatus === 'pending_approval').length
}));

const viewTitle = computed(() => ({
    dashboard: 'Portal Overview',
    announcements: 'Announcements',
    residents: 'Resident Accounts',
    documents: 'Document Requests',
    appointments: 'Appointments',
    reservations: 'Facility Reservations',
    reports: 'Resident Reports',
    officials: 'Barangay Officials'
}[currentView.value]));

const pendingWorkload = computed(() => pendingCounts.value.docs + pendingCounts.value.appoints + pendingCounts.value.reserves + pendingCounts.value.reports);
const totalResidentsCount = computed(() => residents.value.length);
const approvedResidentsCount = computed(() => residents.value.filter((resident) => resident.userId?.accountStatus === 'approved').length);
const activeOfficialsCount = computed(() => officials.value.filter((official) => (official.availabilityStatus || 'active') === 'active').length);
const activeAnnouncementsCount = computed(() => announcements.value.filter((announcement) => announcement.isActive !== false).length);

const dashboardMetrics = computed(() => ([
    {
        label: 'Pending workload',
        value: pendingWorkload.value,
        detail: 'Requests waiting for action',
        icon: 'fa-solid fa-inbox',
        tone: 'accent'
    },
    {
        label: 'Approved residents',
        value: approvedResidentsCount.value,
        detail: `${totalResidentsCount.value} resident profiles`,
        icon: 'fa-solid fa-users',
        tone: 'blue'
    },
    {
        label: 'Active officials',
        value: activeOfficialsCount.value,
        detail: `${officials.value.length} officials tracked`,
        icon: 'fa-solid fa-user-tie',
        tone: 'green'
    },
    {
        label: 'Live announcements',
        value: activeAnnouncementsCount.value,
        detail: `${announcements.value.length} posts stored`,
        icon: 'fa-solid fa-bullhorn',
        tone: 'gold'
    }
]));

const workloadBars = computed(() => {
    const rows = [
        { key: 'docs', label: 'Documents', value: pendingCounts.value.docs, tone: 'docs' },
        { key: 'appoints', label: 'Appointments', value: pendingCounts.value.appoints, tone: 'appoints' },
        { key: 'reserves', label: 'Facilities', value: pendingCounts.value.reserves, tone: 'reserves' },
        { key: 'reports', label: 'Reports', value: pendingCounts.value.reports, tone: 'reports' }
    ];
    const max = Math.max(...rows.map((row) => row.value), 1);

    return rows.map((row) => ({
        ...row,
        width: `${Math.max(8, Math.round((row.value / max) * 100))}%`,
        percentLabel: pendingWorkload.value ? `${Math.round((row.value / pendingWorkload.value) * 100)}% of pending work` : 'No queue'
    }));
});

const workloadRingStyle = computed(() => {
    const segments = [
        { value: pendingCounts.value.docs, color: '#d52a2a' },
        { value: pendingCounts.value.appoints, color: '#235b82' },
        { value: pendingCounts.value.reserves, color: '#257f49' },
        { value: pendingCounts.value.reports, color: '#a6782a' }
    ];

    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    if (!total) {
        return { background: 'conic-gradient(#d9e2dc 0deg, #edf2ee 360deg)' };
    }

    let current = 0;
    const rings = segments.map((segment) => {
        const start = current;
        const end = start + (segment.value / total) * 360;
        current = end;
        return `${segment.color} ${start}deg ${end}deg`;
    });

    return { background: `conic-gradient(${rings.join(', ')})` };
});

const latestAnnouncements = computed(() => [...announcements.value]
    .sort((left, right) => new Date(right.createdAt || right.startDate || 0) - new Date(left.createdAt || left.startDate || 0))
    .slice(0, 3));

const currentList = computed(() => {
    switch (currentView.value) {
        case 'announcements': return announcements.value;
        case 'residents': return filteredResidents.value;
        case 'documents': return documentRequests.value.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'appointments': return appointments.value.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
        case 'reservations': return reservations.value.sort((a,b) => new Date(b.reservationDate) - new Date(a.reservationDate));
        case 'reports': return reports.value.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'officials': return officials.value;
        default: return [];
    }
});

const toDateTimeLocal = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

const setupAnnouncementEditModal = (item) => {
    Object.assign(editForm, {
        _id: item._id,
        title: item.title,
        description: item.description,
        imagePath: item.imagePath || '',
        displayOrder: item.displayOrder ?? 1,
        startDate: toDateTimeLocal(item.startDate),
        endDate: toDateTimeLocal(item.endDate),
        isActive: item.isActive !== false
    });

    Object.assign(announcementForm, {
        title: item.title,
        description: item.description,
        displayOrder: item.displayOrder ?? 1
    });
};

const setupAnnouncementCreateModal = async () => {
    editForm._id = '';
    editForm.title = '';
    editForm.description = '';
    editForm.imagePath = '';
    editForm.displayOrder = 1;
    editForm.startDate = '';
    editForm.endDate = '';
    editForm.isActive = true;

    Object.assign(announcementForm, { title: '', description: '', displayOrder: 1 });
    await fetchNextDisplayOrder();
};

const setupAnnouncementModal = async (item) => {
    if (item?._id) {
        setupAnnouncementEditModal(item);
    } else {
        await setupAnnouncementCreateModal();
    }

    announcementImageFile.value = null;
};

const setupResidentModal = (item) => {
    editForm.status = item.userId?.accountStatus || 'pending_approval';
};

const setupRecordStatusModal = (item) => {
    editForm.status = item.status;
    editForm.adminNotes = item.adminNotes || '';
};

const setupOfficialModal = (item) => {
    Object.assign(editForm, item);

    if (editForm.officeDays && Array.isArray(editForm.officeDays)) {
        editForm.officeDays = editForm.officeDays.join(', ');
    }
};

// Modal and form handlers
const openModal = async (type, item) => {
    selectedItem.value = { ...item };

    if (type === 'resident') {
        setupResidentModal(item);
        activeModal.value = type;
        return;
    }

    if (['document', 'appointment', 'reservation', 'report'].includes(type)) {
        setupRecordStatusModal(item);
        activeModal.value = type;
        return;
    } else if (type === 'official') {
        setupOfficialModal(item);
        activeModal.value = type;
        return;
    } else if (type === 'announcement') {
        await setupAnnouncementModal(item);
        activeModal.value = type;
        return;
    }

    activeModal.value = type;
};

const handleSave = async () => {
    try {
        switch (activeModal.value) {
            case 'resident':
                await saveResidentStatus(selectedItem.value._id, editForm.status);
                msg('Resident account status updated.');
                break;
            case 'document':
            case 'appointment':
            case 'reservation':
            case 'report':
                await apiFetch(`/document-requests${activeModal.value === 'document' ? '' : '/' + activeModal.value}/${selectedItem.value._id}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: editForm.status, adminNotes: editForm.adminNotes })
                });
                msg('Status updated and notification sent.');
                break;
            case 'official':
                await saveOfficial();
                msg('Official saved successfully.');
                break;
            case 'announcement':
                await saveAnnouncement(!!editForm._id, editForm._id);
                msg('Announcement saved successfully.');
                break;
        }
        await loadAll();
        activeModal.value = null;
    } catch (error) {
        msg(error.message || 'Operation failed', true);
    }
};

const handleDelete = async () => {
    if (!confirm(`Delete this ${activeModal.value}?`)) return;
    try {
        if (activeModal.value === 'announcement') {
            await deleteAnnouncement(editForm._id);
        } else if (activeModal.value === 'official') {
            await deleteOfficial(selectedItem.value._id);
        }
        msg(`${activeModal.value} deleted successfully.`);
        await loadAll();
        activeModal.value = null;
    } catch (error) {
        msg(error.message || 'Delete failed', true);
    }
};

const refreshAnnouncementsList = async () => {
    const response = await apiFetch('/announcements/admin/all');
    announcements.value = response.data || response;
};

// Announcement-specific handlers
const handleSaveAnnouncement = async () => {
    try {
        const isEdit = !!editForm._id;
        
        // Sync editForm to announcementForm for composable
        announcementForm.title = editForm.title;
        announcementForm.description = editForm.description;
        announcementForm.displayOrder = editForm.displayOrder;
        announcementForm.startDate = editForm.startDate;
        announcementForm.endDate = editForm.endDate;
        announcementForm.isActive = editForm.isActive;
        
        await saveAnnouncement(isEdit, editForm._id);
        msg(isEdit ? 'Announcement updated successfully.' : 'Announcement created successfully.');
        await refreshAnnouncementsList();
        activeModal.value = null;
    } catch (error) {
        msg(error.message, true);
    }
};

const handleDeleteAnnouncement = async () => {
    if (!confirm('Delete this announcement?')) return;
    try {
        await deleteAnnouncement(editForm._id);
        msg('Announcement deleted successfully.');
        await refreshAnnouncementsList();
        activeModal.value = null;
    } catch (error) {
        msg(error.message || 'Delete failed', true);
    }
};

watch(loginStatus, (message) => {
    if (!message) {
        return;
    }

    showToast(message, loginError.value);
});

watch(dashboardStatus, (message) => {
    if (!message) {
        return;
    }

    showToast(message, dashboardError.value);
});

onBeforeUnmount(() => {
    clearToast();
});

watch(isAuthenticated, async (authed) => {
    if (authed) {
        await loadAll();
    }
}, { immediate: true });

onMounted(initSession);
</script>
