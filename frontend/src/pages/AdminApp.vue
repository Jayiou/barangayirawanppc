<template>
        <div v-if="initializing" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; flex-direction: column;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #2c3e50; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #5e6f66; font-size: 0.9rem;">Initializing admin session...</p>
    </div>
    <div v-else-if="!isAuthenticated" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; padding: 20px;">
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
                <button type="submit" class="primary-button" :disabled="loginLoading" style="justify-content: center; width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: 6px; margin-top: 0.5rem;"><i :class="loginLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'"></i> {{ loginLoading ? 'Signing in...' : 'Log In' }}</button>
            </form>
        </div>
    </div>

    <div class="page-shell app-shell" v-else>
        <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />
        <aside class="app-sidebar" :class="{ open: sidebarOpen }">
            <button class="sidebar-close-btn" @click="sidebarOpen = false"><i class="fa-solid fa-xmark"></i></button>
            
            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <BrandMark initials="BC" eyebrow="Admin Portal" title="Barangay Connect" />
            </div>

            <!-- Sidebar Navigation -->
            <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'dashboard' }" type="button" @click="currentView = 'dashboard'"><i class="fa-solid fa-chart-pie"></i> Dashboard</button>
                <button :class="{ active: currentView === 'announcements' }" type="button" @click="currentView = 'announcements'"><i class="fa-solid fa-bullhorn"></i> Announcements</button>
                <button :class="{ active: currentView === 'residents' }" type="button" @click="currentView = 'residents'"><i class="fa-solid fa-users"></i> Residents</button>
                <button :class="{ active: currentView === 'appointments' }" type="button" @click="currentView = 'appointments'"><i class="fa-solid fa-calendar-check"></i> Appointments <span class="badge" v-if="pendingCounts.appointments">{{ pendingCounts.appointments }}</span></button>
                <button :class="{ active: currentView === 'officials' }" type="button" @click="currentView = 'officials'"><i class="fa-solid fa-crown"></i> Officials</button>
                <button :class="{ active: currentView === 'documents' }" type="button" @click="currentView = 'documents'"><i class="fa-solid fa-file-signature"></i> Documents <span class="badge" v-if="pendingCounts.docs">{{ pendingCounts.docs }}</span></button>
                <button :class="{ active: currentView === 'reservations' }" type="button" @click="currentView = 'reservations'"><i class="fa-solid fa-building"></i> Facilities <span class="badge" v-if="pendingCounts.reserves">{{ pendingCounts.reserves }}</span></button>
                <button :class="{ active: currentView === 'reports' }" type="button" @click="currentView = 'reports'"><i class="fa-solid fa-flag"></i> Reports <span class="badge" v-if="pendingCounts.reports">{{ pendingCounts.reports }}</span></button>
                <button :class="{ active: currentView === 'sms-logs' }" type="button" @click="currentView = 'sms-logs'"><i class="fa-solid fa-message"></i> SMS Logs</button>
            </nav>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <span class="footer-eyebrow">Logged In As</span>
                <div class="user-info" v-if="user">
                    <strong class="user-name">{{ user.username }}</strong>
                    <div class="user-email">{{ user.email }}</div>
                </div>
                <button type="button" class="logout-btn" @click="confirmLogout"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
            </div>
        </aside>

        <main class="app-main">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
            </header>
            <!-- Preview loading modal -->
            <div v-if="previewLoading" class="preview-loading-overlay">
                <div class="preview-loading-box">
                    <div class="spinner" aria-hidden="true"></div>
                    <div style="margin-top: 12px; font-weight: 600;">Generating PDF — please wait…</div>
                    <div style="margin-top: 6px; color: #666; font-size: 0.95rem;">This may take a few seconds on first generation.</div>
                </div>
            </div>
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
            <section class="app-view" :class="{ active: ['documents', 'reservations', 'reports', 'announcements', 'residents'].includes(currentView) }">
                <div class="portal-grid">
                    <article class="content-card" style="overflow-x: auto;">
                        <div class="section-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <span class="eyebrow">{{ viewTitle }}</span>
                                <h3>Manage {{ currentView }} records</h3>
                            </div>
                            <div class="toolbar" style="margin: 0; display: flex; gap: 10px; align-items: center;">
                                <span class="search-icon" v-if="currentView === 'residents'"><i class="fa-solid fa-search"></i></span>
                                <input v-if="currentView === 'residents'" v-model="residentSearch" type="search" placeholder="Search residents..." style="padding-left: 30px;">

                                <div v-if="currentView === 'documents'" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button type="button" class="ghost-button" :class="{ active: documentRequestTab === 'all' }" @click="documentRequestTab = 'all'">
                                        All <span class="badge">{{ documentRequestCounts.all }}</span>
                                    </button>
                                    <button type="button" class="ghost-button" :class="{ active: documentRequestTab === 'residents' }" @click="documentRequestTab = 'residents'">
                                        Residents <span class="badge">{{ documentRequestCounts.residents }}</span>
                                    </button>
                                    <button type="button" class="ghost-button" :class="{ active: documentRequestTab === 'non_residents' }" @click="documentRequestTab = 'non_residents'">
                                        Non-Residents <span class="badge">{{ documentRequestCounts.nonResidents }}</span>
                                    </button>
                                </div>
                                

                                <button v-if="currentView === 'announcements'" class="primary-button" @click="openModal('announcement', {})"><i class="fa-solid fa-plus"></i> Add Announcement</button>
                            </div>
                        </div>

                        <div class="table-responsive">
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
                                    <th scope="col">Requester</th>
                                    <th scope="col">Purpose</th>
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
                            </thead>
                            <tbody>
                                <tr v-for="item in currentList" :key="item._id" class="table-row hoverable">
                                    <td v-if="currentView === 'residents'"><strong>{{ item.firstName }} {{ item.lastName }}</strong></td>
                                    <td v-if="currentView === 'residents'">{{ item.address }}</td>
                                    <td v-if="currentView === 'residents'"><StatusBadge :status="item.userId?.accountStatus || 'pending'" /></td>
                                    <td v-if="currentView === 'residents'">
                                        <button class="icon-button" @click="openModal('resident', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>

                                    <td v-if="currentView === 'documents'"><strong>{{ item.documentType.replaceAll('_', ' ') }}</strong></td>
                                    <td v-if="currentView === 'documents'">
                                        {{ getRequestorName(item) }}
                                        <br>
                                        <small>{{ item.requesterType === 'non_resident' ? 'Non-Resident' : 'Resident' }}</small>
                                    </td>
                                    <td v-if="currentView === 'documents'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'documents'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'documents'">
                                        <button class="icon-button" @click="openModal('document', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>


                                    <td v-if="currentView === 'reservations'"><strong>{{ item.facilityName.replaceAll('_', ' ') }}</strong><br><small>{{ formatDate(item.reservationDate) }} ({{ item.startTime }} - {{ item.endTime }})</small></td>
                                    <td v-if="currentView === 'reservations'">{{ getRequestorName(item) }}</td>
                                    <td v-if="currentView === 'reservations'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'reservations'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'reservations'">
                                        <button class="icon-button" @click="openModal('reservation', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>

                                    <td v-if="currentView === 'reports'"><strong>{{ item.title }}</strong><br><small>{{ formatDate(item.incidentDate) }}</small></td>
                                    <td v-if="currentView === 'reports'">{{ getRequestorName(item) }}<br><small>{{ item.reportType.replaceAll('_', ' ') }}</small></td>
                                    <td v-if="currentView === 'reports'"><span class="priority-badge" :class="'p-' + item.priority">{{ item.priority.toUpperCase() }}</span></td>
                                    <td v-if="currentView === 'reports'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'reports'">
                                        <button class="icon-button" @click="openModal('report', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>

                                    <td v-if="currentView === 'announcements'"><strong>{{ item.title }}</strong></td>
                                    <td v-if="currentView === 'announcements'"><StatusBadge :status="item.isActive ? 'active' : 'inactive'" /></td>
                                    <td v-if="currentView === 'announcements'">{{ item.displayOrder }}</td>
                                    <td v-if="currentView === 'announcements'"><small>{{ formatDate(item.startDate) }} - {{ item.endDate ? formatDate(item.endDate) : 'No end date' }}</small></td>
                                    <td v-if="currentView === 'announcements'">
                                        <button class="icon-button" @click="openModal('announcement', item)"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                    </td>
                                </tr>
                                <tr v-if="currentList.length === 0">
                                    <td colspan="6" style="text-align: center; padding: 30px; color: #777;"><i class="fa-solid fa-folder-open"></i> No records found.</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Appointments View -->
            <section class="app-view" :class="{ active: currentView === 'appointments' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="margin-bottom: 15px;">
                            <div>
                                <span class="eyebrow">Appointments</span>
                                <h3>Manage appointment requests</h3>
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Official</th>
                                        <th>Resident</th>
                                        <th>Date & Time</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in appointments" :key="item._id" class="table-row hoverable">
                                        <td><strong>{{ item.officialId?.name }}</strong><br><small>{{ item.officialId?.position }}</small></td>
                                        <td>{{ item.residentId?.firstName }} {{ item.residentId?.lastName }}</td>
                                        <td>{{ formatDate(item.appointmentDate) }}<br><small>{{ item.timeSlot?.startTime || 'N/A' }} - {{ item.timeSlot?.endTime || 'N/A' }}</small></td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td>
                                            <button class="icon-button" @click="openModal('appointment', item)"><i class="fa-solid fa-eye"></i> View</button>
                                        </td>
                                    </tr>
                                    <tr v-if="appointments.length === 0">
                                        <td colspan="5" style="text-align: center; padding: 30px; color: #777;"><i class="fa-solid fa-folder-open"></i> No appointments found.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Officials View -->
            <section class="app-view" :class="{ active: currentView === 'officials' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="eyebrow">Officials</span>
                                <h3>Manage barangay officials</h3>
                            </div>
                            <button class="primary-button" @click="openModal('official', {})"><i class="fa-solid fa-plus"></i> Add Official</button>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <th>Name</th>
                                        <th>Position</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in officials" :key="item._id" class="table-row hoverable">
                                        <td>
                                            <div class="table-avatar" :style="item.picture ? { backgroundImage: `url(${item.picture})` } : {}">
                                                <span v-if="!item.picture">{{ item.name?.split(' ').map(part => part.charAt(0)).join('').slice(0,2).toUpperCase() }}</span>
                                            </div>
                                        </td>
                                        <td><strong>{{ item.name }}</strong></td>
                                        <td>{{ item.position }}</td>
                                        <td>{{ item.email || 'N/A' }}<br><small>{{ item.contactNumber || '' }}</small></td>
                                        <td><StatusBadge :status="item.status" /></td>
                                        <td>
                                            <button class="icon-button" @click="openModal('official', item)"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                                        </td>
                                    </tr>
                                    <tr v-if="officials.length === 0">
                                        <td colspan="6" style="text-align: center; padding: 30px; color: #777;"><i class="fa-solid fa-folder-open"></i> No officials found.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                </div>
            </section>

            <!-- SMS Logs View -->
            <section class="app-view" :class="{ active: currentView === 'sms-logs' }">
                <article class="content-card">
                    <div style="padding: 20px;">
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 10px 0;">SMS Message Logs</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9rem;">View all sent SMS messages in real-time</p>
                        </div>

                        <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                            <select v-model="smsFilterType" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
                                <option value="">All Types</option>
                                <option value="document_status">Document Status</option>
                                <option value="resident_approval">Resident Approval</option>

                            </select>
                            <button @click="loadSMSLogs" class="primary-button" style="padding: 8px 16px;"><i class="fa-solid fa-refresh"></i> Refresh</button>
                        </div>

                        <div v-if="smsLogsLoading" style="text-align: center; padding: 40px; color: #999;">
                            <i class="fa-solid fa-spinner" style="animation: spin 1s linear infinite; font-size: 2rem;"></i>
                            <p>Loading SMS logs...</p>
                        </div>

                        <div v-else-if="smsLogs.length === 0" style="text-align: center; padding: 40px; color: #999;">
                            <i class="fa-solid fa-inbox" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                            <p>No SMS logs found</p>
                        </div>

                        <div v-else style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem;">Phone</th>
                                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem;">Type</th>
                                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem;">Message</th>
                                        <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem;">Sent At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="log in filteredSMSLogs" :key="log._id" style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 12px;"><strong>{{ log.phoneNumber }}</strong></td>
                                        <td style="padding: 12px;"><span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; color: #1976d2;">{{ log.messageType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }}</span></td>
                                        <td style="padding: 12px; font-size: 0.9rem; color: #555; max-width: 300px; word-break: break-word;">{{ log.messageContent }}</td>
                                        <td style="padding: 12px; font-size: 0.85rem; color: #999; white-space: nowrap;">{{ formatDate(log.createdAt) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div v-if="smsPagination && smsPagination.pages > 1" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                            <button
                                v-for="page in smsPagination.pages"
                                :key="page"
                                @click="loadSMSLogs(page)"
                                :class="{ 'primary-button': smsCurrentPage === page }"
                                style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;"
                            >
                                {{ page }}
                            </button>
                        </div>
                    </div>
                </article>
            </section>
        </main>

        <!-- Dynamic Action Modal -->
        <div class="admin-modal-backdrop" v-if="activeModal" @click.self="activeModal = null">
            <div class="admin-modal">
                <button class="admin-modal-close" @click="activeModal = null"><i class="fa-solid fa-xmark"></i></button>

                <div v-if="activeModal === 'resident'">
                    <h2><i class="fa-solid fa-user-check"></i> View Resident</h2>
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
                        <button type="submit" class="primary-button" :disabled="isSubmitting"><i :class="isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'"></i> {{ isSubmitting ? 'Saving...' : 'Save Changes' }}</button>
                    </form>
                </div>

                <div v-if="['document', 'reservation', 'report', 'appointment'].includes(activeModal)">
                    <h2><i class="fa-solid fa-eye"></i> View Request</h2>
                    <p class="fine-print">Review complete request details, then apply a status action.</p>

                    <div class="stack" style="background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 15px 0;">
                        <p v-for="detail in getRequestDetails(selectedItem)" :key="detail.label" v-show="detail.value">
                            <strong>{{ detail.label }}:</strong> {{ detail.value }}
                        </p>
                    </div>

                    <div v-if="activeModal === 'report'" style="margin: 12px 0 16px; display: grid; gap: 12px;">
                        <div v-if="selectedItem.locationCoordinates?.latitude && selectedItem.locationCoordinates?.longitude" style="padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;">
                            <strong style="display: block; margin-bottom: 6px;">Pinned Location</strong>
                            <p style="margin: 0 0 8px; color: #4f6b5d;">{{ selectedItem.locationCoordinates.latitude }}, {{ selectedItem.locationCoordinates.longitude }}</p>
                            <iframe
                                :src="getReportMapEmbedUrl(selectedItem)"
                                title="Report location map"
                                style="width: 100%; height: 200px; border: 1px solid #dce6e1; border-radius: 8px; margin: 6px 0 10px;"
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                            ></iframe>
                            <a
                                :href="`https://www.google.com/maps?q=${selectedItem.locationCoordinates.latitude},${selectedItem.locationCoordinates.longitude}`"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="ghost-button"
                                style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none;"
                            >
                                <i class="fa-solid fa-location-dot"></i>
                                Open in Google Maps
                            </a>
                        </div>

                        <div v-if="Array.isArray(selectedItem.proofFiles) && selectedItem.proofFiles.length" style="padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;">
                            <strong style="display: block; margin-bottom: 10px;">Proof Images</strong>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <a
                                    v-for="proofPath in selectedItem.proofFiles"
                                    :key="proofPath"
                                    :href="proofPath"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;"
                                >
                                    <i class="fa-regular fa-image"></i>
                                    {{ proofPath.split('/').pop() }}
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Status display and action buttons -->
                    <div style="margin-top: 15px; margin-bottom: 20px;">
                        <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
                            <span style="font-weight: 600; color: #333;">Status:</span>
                            <StatusBadge :status="selectedItem.status" />
                        </div>

                        <StatusActionButtons
                            :entityType="activeModal === 'document' ? 'documentRequest' : activeModal === 'reservation' ? 'facilityReservation' : activeModal === 'appointment' ? 'appointment' : 'report'"
                            :currentStatus="selectedItem.status"
                            :loading="isSubmitting"
                            @action-triggered="handleStatusAction"
                        />

                        <!-- Document preview and send buttons -->
                        <div v-if="activeModal === 'document'" style="margin-top: 15px;">
                            <div v-if="['approved', 'ready_for_pickup', 'completed'].includes(selectedItem.status)" style="display: flex; gap: 12px; margin-bottom: 12px;">
                                <button 
                                    type="button" 
                                    class="ghost-button" 
                                    @click="previewDocument(selectedItem._id)"
                                    style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;"
                                >
                                    <i class="fa-solid fa-eye"></i>
                                    Preview PDF
                                </button>
                            </div>
                            <button 
                                v-if="selectedItem.status === 'ready_for_pickup'"
                                type="button" 
                                class="primary-button" 
                                @click="sendDocumentToResident" 
                                :disabled="isSubmitting || selectedItem.documentSentAt"
                                style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                            >
                                <i :class="isSubmitting ? 'fa-solid fa-spinner fa-spin' : selectedItem.documentSentAt ? 'fa-solid fa-check-circle' : 'fa-solid fa-paper-plane'"></i>
                                {{ isSubmitting ? 'Sending...' : selectedItem.documentSentAt ? 'Sent on ' + formatDate(selectedItem.documentSentAt) : 'Send to Resident' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="activeModal === 'official'">
                    <h2><i class="fa-solid fa-user-tie"></i> Official Details</h2>
                    <form class="stack" @submit.prevent="handleSaveOfficial" style="margin-top: 15px;">
                        <input type="hidden" v-model="editForm._id">
                        <label><span>Name</span><input v-model="editForm.name" required></label>
                        <label>
                            <span>Position</span>
                            <select v-model="editForm.position" required>
                                <option value="" disabled>Select Position</option>
                                <option value="Barangay Captain">Barangay Captain</option>
                                <option value="Barangay Secretary">Barangay Secretary</option>
                                <option value="Barangay Treasurer">Barangay Treasurer</option>
                                <option value="Barangay Kagawad">Barangay Kagawad</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <label><span>Email</span><input v-model="editForm.email" type="email"></label>
                        <label><span>Contact Number</span><input v-model="editForm.contactNumber" type="text"></label>
                        <label>
                            <span>Profile Picture</span>
                            <input type="file" accept="image/*" @change="handleOfficialPictureChange">
                        </label>
                        <div v-if="officialPicturePreview" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: #f4f4f4; display: grid; place-items: center; border: 1px solid #ddd;">
                                <img :src="officialPicturePreview" alt="Official preview" style="width: 100%; height: 100%; object-fit: cover;" />
                            </div>
                            <span style="color: #5e6f66; font-size: 0.9rem;">Profile picture selected.</span>
                        </div>
                        <label><span>Notes</span><textarea v-model="editForm.notes" rows="2"></textarea></label>
                        <label>
                            <span>Status</span>
                            <select v-model="editForm.status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting"><i :class="isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'"></i> {{ isSubmitting ? 'Saving...' : 'Save Official' }}</button>
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
                        <div style="font-size: 0.95rem; color: #1f3c5a; background: #eaf3ff; padding: 12px 14px; border-radius: 8px; border-left: 4px solid #4a90e2; margin-bottom: 15px; display: grid; gap: 4px;">
                            <strong>Display Order</strong>
                            <span v-if="editForm._id">Current order: {{ editForm.displayOrder || 'N/A' }}</span>
                            <template v-else>
                                <span v-if="nextDisplayOrderLoading">Loading next number...</span>
                                <span v-else-if="nextDisplayOrder !== null && nextDisplayOrder !== undefined">Next display order: {{ nextDisplayOrder }}</span>
                                <span v-else>Will be auto-assigned when saved</span>
                            </template>
                        </div>
                        <label>
                            <span>Active</span>
                            <select v-model="editForm.isActive">
                                <option :value="true">Active</option>
                                <option :value="false">Inactive</option>
                            </select>
                        </label>
                        <button type="submit" class="primary-button" :disabled="isSubmitting"><i :class="isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'"></i> {{ isSubmitting ? (editForm._id ? 'Updating...' : 'Creating...') : (editForm._id ? 'Update' : 'Create') }} Announcement</button>
                        <button v-if="editForm._id" type="button" class="ghost-button" @click="handleDelete" :disabled="isSubmitting" style="color: #d52a2a;"><i :class="isSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash'"></i> {{ isSubmitting ? 'Deleting...' : 'Delete' }}</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Status Action Modal -->
        <StatusActionModal
            :visible="confirmingAction !== null"
            :action="confirmingAction"
            :entity-name="getEntityName(selectedItem)"
            :entity-type="activeModal"
            :loading="isSubmitting"
            @confirm="submitStatusAction"
            @cancel="confirmingAction = null"
        />
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import StatusActionButtons from '@/components/StatusActionButtons.vue';
import StatusActionModal from '@/components/StatusActionModal.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch, formatDate } from '@/shared/client';
import { useAdminAuth } from '@/composables/useAdminAuth';
import { useAdminData } from '@/composables/useAdminData';
import { useAnnouncements } from '@/composables/useAnnouncements';
import { useAppointments } from '@/composables/useAppointments';
import { useResidents } from '@/composables/useResidents';
import { useReportNotifications } from '@/composables/useReportNotifications';

// Composables
const { isAuthenticated, user, loginForm, loginStatus, loginError, loginLoading, initializing, loginAdmin, logout, initSession } = useAdminAuth();

const confirmLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
};
const { residents, documentRequests, reservations, reports, appointments, officials, announcements, dashboardStatus, dashboardError, msg, loadAll } = useAdminData();
const { announcementForm, announcementImageFile, nextDisplayOrder, nextDisplayOrderLoading, fetchNextDisplayOrder, saveAnnouncement, deleteAnnouncement, onImageUpload: onAnnouncementImageUpload } = useAnnouncements();
const { approveAppointment, rejectAppointment, completeAppointment, adminCancelAppointment } = useAppointments();
const { residentSearch, filteredResidents, calculateAge, saveResidentStatus, openResidentProof } = useResidents(residents);
const { unreadReports, startNotificationPolling, stopNotificationPolling, clearUnreadReports } = useReportNotifications();
// Local state
const sidebarOpen = ref(false);
const showAdminPassword = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const currentView = ref(localStorage.getItem('admin_current_view') || 'dashboard');
const documentRequestTab = ref('all');
const activeModal = ref(null);
const confirmingAction = ref(null);
const officialPictureFile = ref(null);
const officialPicturePreview = ref('');
const isSubmitting = ref(false);
const previewLoading = ref(false);
// Persist view state on change
watch(currentView, (newView) => {
    localStorage.setItem('admin_current_view', newView);
});
const selectedItem = ref({});
const editForm = reactive({});


// SMS Logs State
const smsLogs = ref([]);
const smsLogsLoading = ref(false);
const smsFilterType = ref('');
const smsCurrentPage = ref(1);
const smsPagination = ref(null);

const todayDate = computed(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
});

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
    reserves: reservations.value.filter(r => r.status === 'pending').length,
    reports: reports.value.filter(r => r.status === 'pending' || r.status === 'reviewing').length,
    appointments: appointments.value.filter(r => r.status === 'pending').length,
    accs: residents.value.filter(r => r.userId?.accountStatus === 'pending_approval').length
}));

const viewTitle = computed(() => ({
    dashboard: 'Portal Overview',
    announcements: 'Announcements',
    residents: 'Resident Accounts',
    appointments: 'Appointments',
    officials: 'Officials Directory',
    documents: 'Document Requests',
    reservations: 'Facility Reservations',
    reports: 'Resident Reports',
    'sms-logs': 'SMS Logs'
}[currentView.value]));

const pendingWorkload = computed(() => pendingCounts.value.docs + pendingCounts.value.reserves + pendingCounts.value.reports + pendingCounts.value.appointments);
const totalResidentsCount = computed(() => residents.value.length);
const approvedResidentsCount = computed(() => residents.value.filter((resident) => resident.userId?.accountStatus === 'approved').length);
const activeAnnouncementsCount = computed(() => announcements.value.filter((announcement) => announcement.isActive !== false).length);
const documentRequestCounts = computed(() => ({
    all: documentRequests.value.length,
    residents: documentRequests.value.filter((request) => request.requesterType !== 'non_resident').length,
    nonResidents: documentRequests.value.filter((request) => request.requesterType === 'non_resident').length
}));

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
        { key: 'reserves', label: 'Facilities', value: pendingCounts.value.reserves, tone: 'reserves' },
        { key: 'appointments', label: 'Appointments', value: pendingCounts.value.appointments, tone: 'blue' },
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
        case 'documents': {
            const sortedDocuments = [...documentRequests.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (documentRequestTab.value === 'non_residents') {
                return sortedDocuments.filter((request) => request.requesterType === 'non_resident');
            }

            if (documentRequestTab.value === 'residents') {
                return sortedDocuments.filter((request) => request.requesterType !== 'non_resident');
            }

            return sortedDocuments;
        }

        case 'reservations': return [...reservations.value].sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate));
        case 'reports': return [...reports.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        default: return [];
    }
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

const getResidentName = (item) => {
    return item.residentId ? `${item.residentId.firstName} ${item.residentId.lastName}` : 'Unknown Resident (Or Anonymous)';
};

const getRequestorName = (item) => {
    const guestName = [item?.firstName, item?.middleName, item?.lastName, item?.suffix].filter(Boolean).join(' ').trim();

    if (guestName) {
        return guestName;
    }

    if (item?.residentId) {
        return [item.residentId.firstName, item.residentId.middleName, item.residentId.lastName, item.residentId.suffix].filter(Boolean).join(' ').trim();
    }

    return item?.requesterType === 'guest' ? 'Guest Requester' : 'Unknown Requester';
};

const getReportMapEmbedUrl = (item) => {
    const latitude = item?.locationCoordinates?.latitude;
    const longitude = item?.locationCoordinates?.longitude;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return '';
    }

    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
};

const getRequestDetails = (item) => {
    if (activeModal.value === 'document') {
        return [
            { label: 'Requester', value: getRequestorName(item) },
            { label: 'Requester Type', value: item.requesterType === 'non_resident' ? 'Non-Resident' : 'Resident' },
            { label: 'Contact Number', value: item.contactNumber || item.residentId?.contactNumber },
            { label: 'Email', value: item.email || item.residentId?.email },
            { label: 'Address', value: item.address || item.residentId?.address },
            { label: 'Document Type', value: item.documentType?.replaceAll('_', ' ') },
            { label: 'Purpose', value: item.purpose },
            { label: 'Request Details', value: item.requestDetails },
            { label: 'Requested On', value: formatDate(item.createdAt) }
        ];
    }

    if (activeModal.value === 'reservation') {
        return [
            { label: 'Requester', value: getRequestorName(item) },
            { label: 'Contact Number', value: item.contactNumber || item.residentId?.contactNumber },
            { label: 'Email', value: item.email || item.residentId?.email },
            { label: 'Address', value: item.address || item.residentId?.address },
            { label: 'Facility', value: item.facilityName?.replaceAll('_', ' ') },
            { label: 'Reservation Date', value: formatDate(item.reservationDate) },
            { label: 'Time', value: `${item.startTime || 'N/A'} - ${item.endTime || 'N/A'}` },
            { label: 'Purpose', value: item.purpose },
            { label: 'Request Details', value: item.reservationDetails },
            { label: 'Requested On', value: formatDate(item.createdAt) }
        ];
    }

    if (activeModal.value === 'report') {
        return [
            { label: 'Requester', value: getRequestorName(item) },
            { label: 'Contact Number', value: item.contactNumber || item.residentId?.contactNumber },
            { label: 'Email', value: item.email || item.residentId?.email },
            { label: 'Address', value: item.address || item.residentId?.address },
            { label: 'Issue Title', value: item.title },
            { label: 'Report Type', value: item.reportType?.replaceAll('_', ' ') },
            { label: 'Priority', value: item.priority?.toUpperCase() },
            { label: 'Incident Date', value: formatDate(item.incidentDate) },
            { label: 'Location', value: item.locationText },
            {
                label: 'Proof Uploaded',
                value: Array.isArray(item.proofFiles) && item.proofFiles.length ? `${item.proofFiles.length} file(s)` : 'No files'
            },
            { label: 'Description', value: item.description },
            { label: 'Submitted On', value: formatDate(item.createdAt) }
        ];
    }
    
    if (activeModal.value === 'appointment') {
        return [
            { label: 'Official', value: `${item.officialId?.name} (${item.officialId?.position})` },
            { label: 'Date', value: formatDate(item.appointmentDate) },
            { label: 'Time', value: `${item.timeSlot?.startTime || 'N/A'} - ${item.timeSlot?.endTime || 'N/A'}` },
            { label: 'Purpose', value: item.purpose },
            { label: 'Requested On', value: formatDate(item.createdAt) }
        ];
    }

    return [];
};

// Modal and form handlers
const setupResidentModal = (item) => {
    editForm.status = item.userId?.accountStatus || 'pending_approval';
};

const setupRecordStatusModal = (item) => {
    confirmingAction.value = null;
};

const setupAnnouncementModal = async (item) => {
    editForm._id = item._id || '';
    editForm.title = item.title || '';
    editForm.description = item.description || '';
    editForm.startDate = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '';
    editForm.endDate = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '';
    editForm.isActive = item.isActive !== false;
    // For editing, we don't change displayOrder
};

const openModal = async (type, item) => {
    selectedItem.value = { ...item };

    if (type === 'resident') {
        setupResidentModal(item);
        activeModal.value = type;
        return;
    }

    if (['document', 'reservation', 'report', 'appointment'].includes(type)) {
        setupRecordStatusModal(item);
        activeModal.value = type;
        return;
    } else if (type === 'announcement') {
        await setupAnnouncementModal(item);
        activeModal.value = type;
        return;
    } else if (type === 'official') {
        editForm._id = item._id || '';
        editForm.name = item.name || '';
        editForm.position = item.position || '';
        editForm.email = item.email || '';
        editForm.contactNumber = item.contactNumber || '';
        editForm.status = item.status || 'active';
        editForm.notes = item.notes || '';
        officialPictureFile.value = null;
        officialPicturePreview.value = item.picture || '';
    }

    activeModal.value = type;
};

const handleSave = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        switch (activeModal.value) {
            case 'resident':
                await saveResidentStatus(selectedItem.value._id, editForm.status);
                msg('Resident account status updated.');
                break;
            case 'document':
            case 'reservation':
            case 'report':
                msg('Admin notes saved. Use action buttons to change status.');
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
    } finally {
        isSubmitting.value = false;
    }
};

const handleDelete = async () => {
    if (!confirm(`Delete this ${activeModal.value}?`)) return;
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        if (activeModal.value === 'announcement') {
            await deleteAnnouncement(editForm._id);
        }
        msg(`${activeModal.value} deleted successfully.`);
        await loadAll();
        activeModal.value = null;
    } catch (error) {
        msg(error.message || 'Delete failed', true);
    } finally {
        isSubmitting.value = false;
    }
};

const refreshAnnouncementsList = async () => {
    const response = await apiFetch('/announcements/admin/all');
    announcements.value = response.data || response;
};

// Announcement-specific handlers
const handleSaveOfficial = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const isEdit = !!editForm._id;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/appointments/officials/${editForm._id}` : '/appointments/officials';
        const formData = new FormData();

        formData.append('name', editForm.name);
        formData.append('position', editForm.position);
        formData.append('email', editForm.email || '');
        formData.append('contactNumber', editForm.contactNumber || '');
        formData.append('status', editForm.status);
        formData.append('notes', editForm.notes || '');

        if (officialPictureFile.value) {
            formData.append('picture', officialPictureFile.value);
        }

        await apiFetch(url, {
            method,
            body: formData
        });
        showToast(isEdit ? 'Official updated successfully.' : 'Official created successfully.');
        await loadAll();
        activeModal.value = null;
    } catch (error) {
        showToast(error.message, true);
    } finally {
        isSubmitting.value = false;
    }
};

const handleOfficialPictureChange = (event) => {
    const file = event.target.files?.[0] || null;
    officialPictureFile.value = file;

    if (file) {
        officialPicturePreview.value = URL.createObjectURL(file);
    }
};

const handleSaveAnnouncement = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const isEdit = !!editForm._id;
        
        // Sync editForm to announcementForm for composable
        announcementForm.title = editForm.title;
        announcementForm.description = editForm.description;
        announcementForm.startDate = editForm.startDate;
        announcementForm.endDate = editForm.endDate;
        announcementForm.isActive = editForm.isActive;
        
        await saveAnnouncement(isEdit, editForm._id);
        msg(isEdit ? 'Announcement updated successfully.' : 'Announcement created successfully.');
        await refreshAnnouncementsList();
        activeModal.value = null;
    } catch (error) {
        msg(error.message, true);
    } finally {
        isSubmitting.value = false;
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

const getEntityName = (item) => {
    if (activeModal.value === 'document') {
        return item.documentType?.replaceAll('_', ' ') || 'Document';
    } else if (activeModal.value === 'reservation') {
        return `Facility Reservation (${item.facilityName?.replaceAll('_', ' ')})`;
    } else if (activeModal.value === 'report') {
        return `Report: ${item.title}`;
    } else if (activeModal.value === 'appointment') {
        return `Appointment with ${item.officialId?.name}`;
    }
    return 'Request';
};

const handleStatusAction = (actionObj) => {
    confirmingAction.value = actionObj;
};

const submitStatusAction = async (reason) => {
    if (!confirmingAction.value || !selectedItem.value._id) {
        msg('Invalid action or item', true);
        return;
    }

    isSubmitting.value = true;
    try {
        const action = confirmingAction.value.action;
        
        if (activeModal.value === 'appointment') {
            if (action === 'approve') await approveAppointment(selectedItem.value._id);
            else if (action === 'reject') await rejectAppointment(selectedItem.value._id, reason);
            else if (action === 'complete') await completeAppointment(selectedItem.value._id, reason);
            else if (action === 'cancel') await adminCancelAppointment(selectedItem.value._id, reason);
            else throw new Error(`Unknown action: ${action}`);
        } else {
            const entityTypeMap = { 'document': 'documents', 'reservation': 'reservations' };
            const entityType = entityTypeMap[activeModal.value] || 'reports';

            const actionEndpoints = {
                'approve': '/approve',
                'reject': '/reject',
                'processing': '/processing',
                'ready-pickup': '/ready-pickup',
                'complete': '/complete',
                'reviewing': '/reviewing',
                'progress': '/progress',
                'resolve': '/resolve'
            };

            const endpoint = actionEndpoints[action];
            if (!endpoint) {
                throw new Error(`Unknown action: ${action}`);
            }

            await apiFetch(`/actions/${entityType}/${selectedItem.value._id}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify({ reason: reason || '' })
            });
        }

        msg(`Request ${action}ed successfully`);
        await loadAll();
        activeModal.value = null;
        confirmingAction.value = null;
    } catch (error) {
        msg(error.message || 'Action failed', true);
    } finally {
        isSubmitting.value = false;
    }
};

const sendDocumentToResident = async () => {
    if (!selectedItem.value?._id) {
        msg('Invalid document request', true);
        return;
    }

    if (selectedItem.value.documentSentAt) {
        msg('Document has already been sent to this resident', true);
        return;
    }

    isSubmitting.value = true;
    try {
        const response = await apiFetch(`/document-requests/${selectedItem.value._id}/send-to-resident`, {
            method: 'POST'
        });

        msg('Document sent to resident successfully');
        
        // Update the selected item with the sent timestamp
        selectedItem.value.documentSentAt = new Date().toISOString();
        
        await loadAll();
    } catch (error) {
        msg(error.message || 'Failed to send document to resident', true);
    } finally {
        isSubmitting.value = false;
    }
};

const previewDocument = async (documentId) => {
    previewLoading.value = true;
    try {
        const previewUrl = `/preview.html?documentId=${encodeURIComponent(documentId)}`;
        const link = document.createElement('a');
        link.href = previewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        msg(error.message || 'Failed to open document preview', true);
        console.error('Preview error:', error);
    } finally {
        previewLoading.value = false;
    }
};

const loadSMSLogs = async (page = 1) => {
    try {
        smsLogsLoading.value = true;
        smsCurrentPage.value = page;
        const messageType = smsFilterType.value ? `&messageType=${smsFilterType.value}` : '';
        const response = await apiFetch(`/sms-logs?page=${page}&limit=20${messageType}`);
        smsLogs.value = response.data || [];
        smsPagination.value = response.pagination;
    } catch (error) {
        console.error('Error loading SMS logs:', error);
        msg('Failed to load SMS logs', true);
    } finally {
        smsLogsLoading.value = false;
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

watch(unreadReports, (newReports) => {
    if (newReports.length > 0) {
        const reportTitles = newReports.map(r => r.title).join(', ');
        showToast(`🚨 New Report Received: ${reportTitles}`);
        
        // Auto-switch to reports view
        currentView.value = 'reports';
    }
});

onBeforeUnmount(() => {
    clearToast();
    stopNotificationPolling();
});

watch(isAuthenticated, async (authed) => {
    if (authed) {
        await Promise.all([
            loadAll(),
            loadSMSLogs()
        ]);
        
        // Start real-time report notifications
        startNotificationPolling();
    } else {
        stopNotificationPolling();
    }
}, { immediate: true });

onMounted(initSession);
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.status-btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-top: 8px; }
.status-btn { padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-size: 0.8rem; text-transform: capitalize; transition: all 0.2s; color: #555; }
.status-btn:hover { background: #f8f9fa; border-color: #ccc; }
.status-btn.active { background: #2c3e50; color: white; border-color: #2c3e50; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Preview loading modal */
.preview-loading-overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0,0,0,0.35);
    z-index: 1200;
}
.preview-loading-box {
    background: white;
    padding: 22px 26px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 12px 40px rgba(0,0,0,0.28);
    width: 360px;
}
.preview-loading-box .spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    border: 4px solid rgba(0,0,0,0.08);
    border-top-color: #2c3e50;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
</style>
