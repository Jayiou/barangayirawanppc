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
        <div v-if="reportAlertVisible" class="report-alert-overlay" role="dialog" aria-modal="true" aria-live="assertive">
            <div class="report-alert-card">
                <span class="report-alert-eyebrow">New Incident Report</span>
                <h3>{{ reportAlertHeading }}</h3>
                <p>{{ reportAlertMessage }}</p>
                <div class="report-alert-actions">
                    <button type="button" class="ghost-button" @click="dismissReportAlert" :disabled="reportAlertBusy">Dismiss</button>
                    <button type="button" class="primary-button" @click="viewReportsFromAlert" :disabled="reportAlertBusy">
                        <i :class="reportAlertBusy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-flag'"></i>
                        {{ reportAlertBusy ? 'Loading reports...' : 'View Reports' }}
                    </button>
                </div>
            </div>
        </div>

        <aside class="app-sidebar" :class="{ open: sidebarOpen, 'notifications-blurred': reportAlertVisible }">
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
                <button :class="{ active: currentView === 'disaster' }" type="button" @click="currentView = 'disaster'"><i class="fa-solid fa-house-flood-water"></i> Disaster Management</button>
                <button :class="{ active: currentView === 'sms-logs' }" type="button" @click="currentView = 'sms-logs'"><i class="fa-solid fa-message"></i> SMS Logs</button>
            </nav>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <span class="footer-eyebrow">Logged In As</span>
                <div class="user-info" v-if="user">
                    <strong class="user-name">{{ user.username }}</strong>
                    <div class="user-email">{{ user.email }}</div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button type="button" class="logout-btn" @click="confirmLogout" style="flex: 1;"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
                    <button type="button" class="ghost-button sound-settings-btn" @click="soundSettingsModalOpen = true" title="Alert sound settings">
                        <i class="fa-solid fa-gear"></i>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Sound Settings Modal -->
        <div v-if="soundSettingsModalOpen" class="modal-overlay" @click.self="soundSettingsModalOpen = false">
            <div class="sound-settings-modal">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-volume"></i> Alert Sound Settings</h3>
                    <button type="button" class="modal-close-btn" @click="soundSettingsModalOpen = false">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="modal-body">
                    <!-- Upload Section -->
                    <div class="settings-section">
                        <label class="file-input-group">
                            <input type="file" accept="audio/*" @change="onAdminSoundChange" />
                            <span class="file-input-label">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                Choose Audio File
                            </span>
                        </label>
                        <button v-if="adminSoundFile" class="primary-button" type="button" @click="uploadAdminSound" :disabled="adminSoundUploading" style="width: 100%; margin-top: 8px;">
                            <i :class="adminSoundUploading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-upload'"></i>
                            {{ adminSoundUploading ? 'Uploading...' : 'Upload Sound' }}
                        </button>
                        <div v-if="adminSoundMessage" :class="['alert-message', adminSoundMessage.includes('successful') ? 'success' : 'error']">
                            {{ adminSoundMessage }}
                        </div>
                    </div>

                    <!-- Settings Controls (show only if custom sound is set) -->
                    <div v-if="getCustomSoundConfig() || adminSoundFile" class="settings-section">
                        <div class="control-group">
                            <label class="checkbox-label">
                                <input type="checkbox" v-model="soundLoop" @change="updateSoundConfig" />
                                <span>Loop alert sound</span>
                            </label>
                        </div>

                        <div class="control-group">
                            <div class="volume-header">
                                <span class="volume-label">Volume</span>
                                <span class="volume-value">{{ soundVolume.toFixed(1) }}x</span>
                            </div>
                            <input id="sound-volume-range" type="range" v-model.number="soundVolume" min="0" max="2" step="0.1" @change="updateSoundConfig" class="volume-slider" />
                            <div class="volume-labels">
                                <span>Silent</span>
                                <span>Normal</span>
                                <span>Loud</span>
                            </div>
                        </div>

                        <div class="button-group">
                            <button class="secondary-button" type="button" @click="testSound" :disabled="soundTesting">
                                <i :class="soundTesting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play'"></i>
                                {{ soundTesting ? 'Playing...' : 'Test' }}
                            </button>
                            <button class="secondary-button" type="button" @click="resetSound">
                                <i class="fa-solid fa-rotate-right"></i>
                                Reset
                            </button>
                        </div>

                        <div class="current-sound" v-if="getCustomSoundConfig()">
                            <small>📁 {{ getCustomSoundConfig().url.split('/').pop() }}</small>
                        </div>
                    </div>

                    <!-- No Sound Message -->
                    <div v-else class="empty-state">
                        <i class="fa-solid fa-volume-mute"></i>
                        <p>Using default alert tones</p>
                        <small>Upload a custom audio file to change</small>
                    </div>
                </div>
            </div>
        </div>

        <main class="app-main" :class="{ 'notifications-blurred': reportAlertVisible }">
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
            <!-- Dashboard View -->
            <section class="app-view" :class="{ active: currentView === 'dashboard' }">
                <div class="ops-dashboard-shell">
                    <div class="ops-dashboard-header">
                        <div>
                            <span class="eyebrow">Municipal Operations Command</span>
                            <h1>Barangay Operations Dashboard</h1>
                        </div>
                        <div class="ops-live-status">
                            <span class="live-dot"></span>
                            <span>Live operations feed</span>
                        </div>
                    </div>

                    <div class="ops-dashboard-layout">
                        <section class="ops-left-section">
                            <div class="ops-stat-grid">
                                <button
                                    v-for="card in dashboardCards"
                                    :key="card.key"
                                    type="button"
                                    class="ops-stat-card"
                                    :class="[`tone-${card.tone}`, { active: selectedDashboardCard === card.key }]"
                                    @click="selectedDashboardCard = card.key"
                                >
                                    <span class="ops-card-glow"></span>
                                    <span class="ops-stat-icon"><i :class="card.icon"></i></span>
                                    <span class="ops-stat-meta">
                                        <span class="ops-stat-label">{{ card.label }}</span>
                                        <strong>{{ card.value }}</strong>
                                        <small>{{ card.caption }}</small>
                                    </span>
                                </button>
                            </div>

                            <div class="ops-side-panels">
                                <article class="ops-mini-panel">
                                    <div class="ops-panel-heading">
                                        <h3>Recent Activity</h3>
                                        <span>{{ getRecentActivityItems.length }} latest</span>
                                    </div>
                                    <div v-if="getRecentActivityItems.length" class="ops-timeline">
                                        <button
                                            v-for="item in getRecentActivityItems"
                                            :key="item.id"
                                            type="button"
                                            class="ops-timeline-item"
                                            @click="currentView = item.view"
                                        >
                                            <span class="ops-timeline-icon" :class="`activity-${item.type}`">
                                                <i :class="item.icon"></i>
                                            </span>
                                            <span>
                                                <strong>{{ item.title }}</strong>
                                                <small>{{ item.timeAgo }}</small>
                                            </span>
                                        </button>
                                    </div>
                                    <div v-else class="dashboard-empty-state">
                                        <i class="fa-solid fa-circle-check"></i>
                                        <p>No recent activity</p>
                                    </div>
                                </article>

                                <article class="ops-mini-panel">
                                    <div class="ops-panel-heading">
                                        <h3>Quick Actions</h3>
                                        <span>Priority paths</span>
                                    </div>
                                    <div class="ops-quick-actions">
                                        <button type="button" @click="currentView = 'reports'"><i class="fa-solid fa-shield-halved"></i><span>Review reports</span></button>
                                        <button type="button" @click="currentView = 'documents'"><i class="fa-solid fa-file-signature"></i><span>Process requests</span></button>
                                        <button type="button" @click="currentView = 'appointments'"><i class="fa-solid fa-calendar-check"></i><span>Manage bookings</span></button>
                                        <button type="button" @click="openModal('announcement', {})"><i class="fa-solid fa-bullhorn"></i><span>Publish advisory</span></button>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section class="ops-analytics-panel" :key="selectedDashboardCard">
                            <div class="ops-analytics-top">
                                <div>
                                    <span class="ops-kicker">{{ activeAnalyticsData.kicker }}</span>
                                    <h2>{{ activeAnalyticsData.title }}</h2>
                                </div>
                                <div class="ops-range-tabs" role="tablist" aria-label="Analytics range">
                                    <button
                                        v-for="range in analyticsRanges"
                                        :key="range.key"
                                        type="button"
                                        :class="{ active: analyticsRange === range.key }"
                                        @click="analyticsRange = range.key"
                                    >
                                        {{ range.label }}
                                    </button>
                                </div>
                            </div>

                            <div class="ops-summary-strip">
                                <div v-for="summary in activeAnalyticsData.summaries" :key="summary.label" class="ops-summary-item">
                                    <span>{{ summary.label }}</span>
                                    <strong>{{ summary.value }}</strong>
                                    <small>{{ summary.detail }}</small>
                                </div>
                            </div>

                            <div class="ops-chart-zone">
                                <div class="ops-bar-chart" :aria-label="`${activeAnalyticsData.title} chart`">
                                    <div v-for="row in activeAnalyticsData.trend" :key="row.label" class="ops-bar-column">
                                        <div class="ops-bar-value">{{ row.value }}</div>
                                        <div class="ops-bar-track">
                                            <span :style="{ height: row.height }"></span>
                                        </div>
                                        <small>{{ row.label }}</small>
                                    </div>
                                </div>

                                <div class="ops-distribution-card">
                                    <div class="ops-distribution-ring" :style="activeAnalyticsData.ringStyle">
                                        <div>
                                            <strong>{{ activeAnalyticsData.total }}</strong>
                                            <span>Total</span>
                                        </div>
                                    </div>
                                    <div class="ops-distribution-list">
                                        <div v-for="item in activeAnalyticsData.distribution" :key="item.label">
                                            <span><i :style="{ background: item.color }"></i>{{ item.label }}</span>
                                            <strong>{{ item.value }}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="ops-insight-grid">
                                <article v-for="insight in activeAnalyticsData.insights" :key="insight.label" class="ops-insight-card">
                                    <span>{{ insight.label }}</span>
                                    <strong>{{ insight.value }}</strong>
                                    <small>{{ insight.detail }}</small>
                                </article>
                            </div>
                        </section>
                    </div>

                    <section class="ops-community-band">
                        <article class="ops-mini-panel community-insights-panel">
                            <div class="ops-panel-heading">
                                <h3>Community Insights</h3>
                                <span>Operational signals</span>
                            </div>
                            <div class="community-insight-grid">
                                <div>
                                    <span>Resident verification</span>
                                    <strong>{{ approvedResidentsCount }}/{{ totalResidentsCount }}</strong>
                                    <small>Approved account coverage</small>
                                </div>
                                <div>
                                    <span>Resolution load</span>
                                    <strong>{{ pendingCounts.reports }}</strong>
                                    <small>Reports needing review</small>
                                </div>
                                <div>
                                    <span>Public advisories</span>
                                    <strong>{{ activeAnnouncementsCount }}</strong>
                                    <small>Currently active posts</small>
                                </div>
                            </div>
                        </article>
                    </section>
                </div>
            </section>

            <section class="app-view" :class="{ active: currentView === 'disaster' }">
                <div class="portal-grid">
                    <article class="content-card">
                        <div class="section-head" style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;">
                            <div>
                                <span class="eyebrow">Disaster Management</span>
                                <h3>Incidents and response monitoring</h3>
                            </div>
                            <button class="primary-button" type="button" @click="createDisasterIncident"><i class="fa-solid fa-plus"></i> Create Incident</button>
                        </div>
                        <div class="summary-grid" style="margin-bottom:14px;">
                            <article class="summary-card"><span>Active Incidents</span><strong>{{ disasterSummary.activeIncidents }}</strong></article>
                            <article class="summary-card"><span>Evacuated Households</span><strong>{{ disasterSummary.evacuees }}</strong></article>
                            <article class="summary-card"><span>Injured / Missing</span><strong>{{ disasterSummary.injured }} / {{ disasterSummary.missing }}</strong></article>
                            <article class="summary-card"><span>Seniors / PWD</span><strong>{{ disasterSummary.seniors }} / {{ disasterSummary.pwds }}</strong></article>
                        </div>
                        <div class="portal-grid" style="grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.3fr);">
                            <article class="content-card" style="padding:16px;">
                                <label><span>Status Filter</span>
                                    <select v-model="disasterFilterStatus">
                                        <option value="all">All</option>
                                        <option value="active">Active</option>
                                        <option value="monitoring">Monitoring</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </label>
                                <div style="margin-top:10px; display:grid; gap:8px;">
                                    <button v-for="incident in filteredDisasterIncidents" :key="incident._id" type="button" class="ghost-button" style="justify-content:space-between;" @click="selectDisasterIncident(incident)">
                                        <span>{{ incident.title }}</span>
                                        <StatusBadge :status="incident.status" />
                                    </button>
                                </div>
                            </article>
                            <article class="content-card" style="padding:16px;">
                                <div v-if="selectedDisasterIncident">
                                    <div class="section-head" style="margin-bottom:10px;">
                                        <h3 style="margin:0;">{{ selectedDisasterIncident.incident.title }}</h3>
                                        <span class="fine-print">{{ selectedDisasterIncident.incident.disasterType?.replaceAll('_', ' ') }} | {{ formatDate(selectedDisasterIncident.incident.occurredAt) }}</span>
                                    </div>
                                    <p class="fine-print">{{ selectedDisasterIncident.incident.description || 'No description yet.' }}</p>
                                    <div class="status-btn-grid">
                                        <button class="status-btn" :class="{ active: selectedDisasterIncident.incident.status === 'active' }" @click="updateDisasterStatus('active')">active</button>
                                        <button class="status-btn" :class="{ active: selectedDisasterIncident.incident.status === 'monitoring' }" @click="updateDisasterStatus('monitoring')">monitoring</button>
                                        <button class="status-btn" :class="{ active: selectedDisasterIncident.incident.status === 'resolved' }" @click="updateDisasterStatus('resolved')">resolved</button>
                                    </div>
                                    <div style="margin-top:12px;">
                                        <h4 style="margin:0 0 8px;">Affected Residents / Families</h4>
                                        <div v-if="selectedDisasterIncident.affectedRecords.length" style="display:grid;gap:8px;">
                                            <div v-for="record in selectedDisasterIncident.affectedRecords" :key="record._id" class="record-item" style="padding:10px;">
                                                <strong>{{ getAffectedDisplayName(record) }}</strong>
                                                <div class="fine-print">Household: {{ record.householdSize }} | Evacuated: {{ record.isEvacuated ? 'Yes' : 'No' }} | Injured: {{ record.injuredCount }} | Missing: {{ record.missingCount }}</div>
                                            </div>
                                        </div>
                                        <div v-else class="fine-print">No affected records yet.</div>
                                        <form class="stack" style="margin-top:10px;" @submit.prevent="addAffectedToSelectedIncident">
                                            <label><span>Family Head Name</span><input v-model="disasterAffectedForm.familyHeadName" type="text" required></label>
                                            <label><span>Household Size</span><input v-model.number="disasterAffectedForm.householdSize" type="number" min="1"></label>
                                            <label><span>Urgent Needs (comma separated)</span><input v-model="disasterAffectedForm.urgentNeeds" type="text" placeholder="Food, medicine, rescue"></label>
                                            <button class="primary-button" type="submit" :disabled="isSubmitting"><i class="fa-solid fa-user-plus"></i> Add Affected Record</button>
                                        </form>
                                    </div>
                                    <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
                                        <select v-model="selectedDisasterReportId" style="min-width: 220px;">
                                            <option value="">Select disaster report to link</option>
                                            <option v-for="report in disasterReports" :key="report._id" :value="report._id">{{ report.title }}</option>
                                        </select>
                                        <button class="ghost-button" type="button" @click="prefillDisasterAdvisory"><i class="fa-solid fa-bullhorn"></i> Publish Advisory</button>
                                        <button class="ghost-button" type="button" @click="linkSelectedDisasterReport"><i class="fa-solid fa-link"></i> Link Selected Disaster Report</button>
                                    </div>
                                </div>
                                <div v-else class="fine-print">Select an incident to view details.</div>
                            </article>
                        </div>
                    </article>
                </div>
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
                    <h2><i class="fa-solid fa-eye"></i> View Report</h2>
                    <p class="fine-print">Review complete report details, then apply a status action.</p>

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
// Admin sound upload state
const adminSoundFile = ref(null);
const adminSoundPreview = ref('');
const adminSoundUploading = ref(false);
const adminSoundMessage = ref('');
const soundVolume = ref(1);
const soundLoop = ref(true);
const soundTesting = ref(false);
const soundSettingsModalOpen = ref(false);

// Initialize sound settings from localStorage
const initSoundSettings = () => {
    const cfg = getCustomSoundConfig();
    if (cfg) {
        soundVolume.value = cfg.volume || 1;
        soundLoop.value = cfg.loop !== false;
    }
};

const onAdminSoundChange = (evt) => {
    const f = evt.target.files && evt.target.files[0];
    if (!f) return;
    if (adminSoundPreview.value) {
        try { URL.revokeObjectURL(adminSoundPreview.value); } catch {}
    }
    adminSoundFile.value = f;
    try {
        adminSoundPreview.value = URL.createObjectURL(f);
    } catch {}
};

const deleteStoredSound = async (soundUrl) => {
    if (!soundUrl) {
        return;
    }

    try {
        await apiFetch('/admin/delete-sound', {
            method: 'POST',
            body: JSON.stringify({ url: soundUrl })
        });
    } catch (error) {
        console.warn('Unable to delete previous sound file:', error);
    }
};

const uploadAdminSound = async () => {
    if (!adminSoundFile.value) {
        adminSoundMessage.value = 'Choose a sound file first.';
        return;
    }

    const previousSound = getCustomSoundConfig();
    const previousUrl = previousSound?.url || '';

    adminSoundUploading.value = true;
    adminSoundMessage.value = '';
    const fd = new FormData();
    fd.append('sound', adminSoundFile.value);

    try {
        const res = await apiFetch('/admin/upload-sound', { method: 'POST', body: fd });
        if (res && res.url) {
            setCustomSound(res.url, { loop: soundLoop.value, volume: soundVolume.value });
            if (previousUrl && previousUrl !== res.url) {
                await deleteStoredSound(previousUrl);
            }
            adminSoundMessage.value = 'Upload successful. Sound configured for alerts.';
            adminSoundFile.value = null;
            if (adminSoundPreview.value) {
                try { URL.revokeObjectURL(adminSoundPreview.value); } catch {}
            }
            adminSoundPreview.value = '';
            initSoundSettings();
        } else {
            adminSoundMessage.value = 'Upload succeeded but no URL returned.';
        }
    } catch (err) {
        adminSoundMessage.value = err.message || 'Upload failed';
    } finally {
        adminSoundUploading.value = false;
    }
};

const updateSoundConfig = () => {
    const cfg = getCustomSoundConfig();
    if (cfg) {
        setCustomSound(cfg.url, { loop: soundLoop.value, volume: soundVolume.value });
        adminSoundMessage.value = 'Sound settings updated.';
        setTimeout(() => { adminSoundMessage.value = ''; }, 2000);
    }
};

const testSound = async () => {
    soundTesting.value = true;
    try {
        // Import and call the playAlertSound from useReportNotifications
        // Since we already have access to the composable functions, we can trigger a test
        const testAudio = new Audio();
        const cfg = getCustomSoundConfig();
        
        if (cfg && cfg.url) {
            testAudio.src = cfg.url;
            testAudio.volume = Math.max(0, Math.min(1, cfg.volume || 1));
            await testAudio.play();
            
            // Wait for audio to finish or timeout after 10 seconds
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, 10000);
                testAudio.onended = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            });
        }
    } catch (err) {
        console.warn('Test sound failed:', err);
    } finally {
        soundTesting.value = false;
    }
};

const resetSound = async () => {
    if (confirm('Remove custom alert sound and revert to default tones?')) {
        const cfg = getCustomSoundConfig();
        await deleteStoredSound(cfg?.url);
        setCustomSound(null);
        soundVolume.value = 1;
        soundLoop.value = true;
        adminSoundFile.value = null;
        if (adminSoundPreview.value) {
            try { URL.revokeObjectURL(adminSoundPreview.value); } catch {}
        }
        adminSoundPreview.value = '';
        adminSoundMessage.value = 'Custom sound removed. Using default alert tones.';
        setTimeout(() => { adminSoundMessage.value = ''; }, 3000);
    }
};

const { residents, documentRequests, reservations, reports, appointments, officials, announcements, disasterIncidents, dashboardStatus, dashboardError, msg, loadAll } = useAdminData();
const { announcementForm, announcementImageFile, nextDisplayOrder, nextDisplayOrderLoading, fetchNextDisplayOrder, saveAnnouncement, deleteAnnouncement, onImageUpload: onAnnouncementImageUpload } = useAnnouncements();
const { approveAppointment, rejectAppointment, completeAppointment, adminCancelAppointment } = useAppointments();
const { residentSearch, filteredResidents, calculateAge, saveResidentStatus, openResidentProof } = useResidents(residents);
const { unreadReports, startNotificationPolling, stopNotificationPolling, clearUnreadReports, setCustomSound, getCustomSoundConfig, stopAlertSound } = useReportNotifications();
// Local state
const sidebarOpen = ref(false);
const showAdminPassword = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const currentView = ref(localStorage.getItem('admin_current_view') || 'dashboard');
const selectedDashboardCard = ref('reports');
const analyticsRange = ref('monthly');
const documentRequestTab = ref('all');
const activeModal = ref(null);
const confirmingAction = ref(null);
const officialPictureFile = ref(null);
const officialPicturePreview = ref('');
const isSubmitting = ref(false);
const previewLoading = ref(false);
const reportAlertVisible = ref(false);
const reportAlertBusy = ref(false);
const reportAlertReports = ref([]);
// Persist view state on change
watch(currentView, (newView) => {
    localStorage.setItem('admin_current_view', newView);
    if (newView === 'disaster' && disasterIncidents.value.length > 0 && !selectedDisasterIncidentId.value) {
        selectDisasterIncident(disasterIncidents.value[0]);
    }
});
const selectedItem = ref({});
const editForm = reactive({});


// SMS Logs State
const smsLogs = ref([]);
const smsLogsLoading = ref(false);
const smsFilterType = ref('');
const smsCurrentPage = ref(1);
const smsPagination = ref(null);
const disasterFilterStatus = ref('all');
const selectedDisasterIncidentId = ref('');
const selectedDisasterReportId = ref('');
const selectedDisasterIncident = ref(null);
const disasterAffectedForm = reactive({
    familyHeadName: '',
    householdSize: 1,
    urgentNeeds: ''
});

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
    disaster: 'Disaster Management',
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

const analyticsRanges = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' }
];

const dashboardCards = computed(() => ([
    {
        key: 'residents',
        label: 'Total Residents',
        value: totalResidentsCount.value,
        caption: `${residentsThisWeek.value} this week`,
        icon: 'fa-solid fa-users',
        tone: 'emerald'
    },
    {
        key: 'pending',
        label: 'Pending Requests',
        value: pendingWorkload.value,
        caption: `${pendingCounts.value.docs} documents queued`,
        icon: 'fa-solid fa-inbox',
        tone: 'blue'
    },
    {
        key: 'reports',
        label: 'Open Reports',
        value: pendingCounts.value.reports,
        caption: `${reportsToday.value} submitted today`,
        icon: 'fa-solid fa-shield-halved',
        tone: 'red'
    },
    {
        key: 'appointments',
        label: 'Scheduled Appointments',
        value: scheduledAppointmentsCount.value,
        caption: `${appointmentsThisWeek.value} this week`,
        icon: 'fa-solid fa-calendar-check',
        tone: 'cyan'
    },
    {
        key: 'reservations',
        label: 'Facility Reservations',
        value: activeReservationsCount.value,
        caption: `${topFacilityLabel.value} most active`,
        icon: 'fa-solid fa-building-columns',
        tone: 'violet'
    },
    {
        key: 'announcements',
        label: 'Active Announcements',
        value: activeAnnouncementsCount.value,
        caption: `${announcements.value.length} total advisories`,
        icon: 'fa-solid fa-tower-broadcast',
        tone: 'gold'
    }
]));

const oneWeekAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
};

const isToday = (value) => {
    const date = new Date(value);
    const today = new Date();
    return !Number.isNaN(date.getTime())
        && date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
};

const isThisWeek = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= oneWeekAgo();
};

const residentsThisWeek = computed(() => residents.value.filter((resident) => isThisWeek(resident.createdAt || resident.updatedAt)).length);
const reportsToday = computed(() => reports.value.filter((report) => isToday(report.createdAt || report.incidentDate)).length);
const appointmentsThisWeek = computed(() => appointments.value.filter((appointment) => isThisWeek(appointment.appointmentDate || appointment.createdAt)).length);
const scheduledAppointmentsCount = computed(() => appointments.value.length);
const activeReservationsCount = computed(() => reservations.value.filter((reservation) => !['rejected', 'cancelled'].includes(reservation.status)).length);

const topFacilityLabel = computed(() => {
    const top = buildDistribution(reservations.value, (reservation) => normalizeLabel(reservation.facilityName), ['No reservations'])[0];
    return top?.label || 'Facility';
});

const filteredDisasterIncidents = computed(() => {
    if (disasterFilterStatus.value === 'all') {
        return disasterIncidents.value;
    }
    return disasterIncidents.value.filter((incident) => incident.status === disasterFilterStatus.value);
});

const disasterReports = computed(() => reports.value.filter((report) => report.reportType === 'disaster'));

const disasterSummary = computed(() => {
    const seed = {
        activeIncidents: 0,
        evacuees: 0,
        injured: 0,
        missing: 0,
        seniors: 0,
        pwds: 0
    };

    return disasterIncidents.value.reduce((summary, incident) => {
        if (incident.status === 'active' || incident.status === 'monitoring') {
            summary.activeIncidents += 1;
        }
        return summary;
    }, seed);
});

const normalizeLabel = (value) => {
    if (!value) return 'Unspecified';
    return String(value)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const countByStatus = (records, statusList) => statusList.reduce((total, status) => total + records.filter((record) => record.status === status).length, 0);

const buildDistribution = (records, getLabel, fallbackLabels = ['No data']) => {
    const counts = records.reduce((acc, record) => {
        const label = getLabel(record);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const colors = ['#0d4a2a', '#b91c1c', '#15803d', '#dc2626', '#166534', '#991b1b'];
    const rows = Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([label, value], index) => ({ label, value, color: colors[index % colors.length] }));

    if (rows.length) {
        return rows;
    }

    return fallbackLabels.map((label, index) => ({ label, value: 0, color: colors[index % colors.length] }));
};

const buildRingStyle = (rows) => {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    if (!total) {
        return { background: 'conic-gradient(#d9e2dc 0deg 360deg)' };
    }

    let cursor = 0;
    const stops = rows.map((row) => {
        const start = cursor;
        const end = start + (row.value / total) * 360;
        cursor = end;
        return `${row.color} ${start}deg ${end}deg`;
    });

    return { background: `conic-gradient(${stops.join(', ')})` };
};

const getRecordDate = (record, key) => {
    const date = new Date(record?.[key] || record?.createdAt || record?.updatedAt);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getPeriodBuckets = (range) => {
    const now = new Date();

    if (range === 'daily') {
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now);
            date.setDate(now.getDate() - (6 - index));
            return {
                label: date.toLocaleDateString([], { weekday: 'short' }),
                matches: (recordDate) => recordDate.toDateString() === date.toDateString()
            };
        });
    }

    if (range === 'weekly') {
        return Array.from({ length: 6 }, (_, index) => {
            const start = new Date(now);
            start.setDate(now.getDate() - ((5 - index) * 7 + 6));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return {
                label: `W${index + 1}`,
                matches: (recordDate) => recordDate >= start && recordDate <= end
            };
        });
    }

    if (range === 'yearly') {
        return Array.from({ length: 4 }, (_, index) => {
            const year = now.getFullYear() - (3 - index);
            return {
                label: String(year),
                matches: (recordDate) => recordDate.getFullYear() === year
            };
        });
    }

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return {
            label: date.toLocaleDateString([], { month: 'short' }),
            matches: (recordDate) => recordDate.getFullYear() === date.getFullYear() && recordDate.getMonth() === date.getMonth()
        };
    });
};

const buildTrend = (records, dateKey) => {
    const buckets = getPeriodBuckets(analyticsRange.value).map((bucket) => {
        const value = records.filter((record) => {
            const recordDate = getRecordDate(record, dateKey);
            return recordDate && bucket.matches(recordDate);
        }).length;
        return { label: bucket.label, value };
    });
    const max = Math.max(...buckets.map((bucket) => bucket.value), 1);

    return buckets.map((bucket) => ({
        ...bucket,
        height: `${Math.max(10, Math.round((bucket.value / max) * 100))}%`
    }));
};

const activeAnalyticsData = computed(() => {
    const pendingRecords = [
        ...documentRequests.value.filter((request) => ['pending', 'processing'].includes(request.status)).map((request) => ({ ...request, queueType: 'Documents' })),
        ...reservations.value.filter((reservation) => reservation.status === 'pending').map((reservation) => ({ ...reservation, queueType: 'Facilities' })),
        ...appointments.value.filter((appointment) => appointment.status === 'pending').map((appointment) => ({ ...appointment, queueType: 'Appointments' })),
        ...reports.value.filter((report) => ['pending', 'reviewing'].includes(report.status)).map((report) => ({ ...report, queueType: 'Reports' }))
    ];

    const configs = {
        residents: {
            kicker: 'Population registry',
            title: 'Resident Enrollment Analytics',
            records: residents.value,
            dateKey: 'createdAt',
            distribution: buildDistribution(residents.value, (resident) => normalizeLabel(resident.userId?.accountStatus || 'registered'), ['No residents']),
            summaries: [
                { label: 'Total Profiles', value: totalResidentsCount.value, detail: 'Resident records' },
                { label: 'Approved', value: approvedResidentsCount.value, detail: 'Verified accounts' },
                { label: 'Pending', value: pendingCounts.value.accs, detail: 'For validation' }
            ],
            insights: [
                { label: 'Approval Rate', value: `${totalResidentsCount.value ? Math.round((approvedResidentsCount.value / totalResidentsCount.value) * 100) : 0}%`, detail: 'Verified resident coverage' },
                { label: 'New This Week', value: residentsThisWeek.value, detail: 'Recent registrations' },
                { label: 'Most Active', value: 'Registry', detail: 'Citizen profile operations' }
            ]
        },
        pending: {
            kicker: 'Service queue',
            title: 'Pending Request Operations',
            records: pendingRecords,
            dateKey: 'createdAt',
            distribution: buildDistribution(pendingRecords, (record) => record.queueType, ['No pending queue']),
            summaries: [
                { label: 'Total Queue', value: pendingWorkload.value, detail: 'Awaiting action' },
                { label: 'Documents', value: pendingCounts.value.docs, detail: 'Review required' },
                { label: 'Citizen Reports', value: pendingCounts.value.reports, detail: 'Operational review' }
            ],
            insights: [
                { label: 'Queue Pressure', value: pendingWorkload.value ? 'Active' : 'Clear', detail: 'Current workload state' },
                { label: 'Top Queue', value: buildDistribution(pendingRecords, (record) => record.queueType)[0]?.label || 'None', detail: 'Largest pending category' },
                { label: 'Awaiting Review', value: `${pendingCounts.value.docs + pendingCounts.value.reports}`, detail: 'Document and report actions' }
            ]
        },
        reports: {
            kicker: 'Incident response',
            title: 'Open Report Intelligence',
            records: reports.value,
            dateKey: 'createdAt',
            distribution: buildDistribution(reports.value, (report) => normalizeLabel(report.reportType), ['No reports']),
            summaries: [
                { label: 'Open Reports', value: pendingCounts.value.reports, detail: 'Pending or reviewing' },
                { label: 'Resolved', value: countByStatus(reports.value, ['resolved', 'closed']), detail: 'Completed cases' },
                { label: 'High Priority', value: reports.value.filter((report) => ['high', 'emergency'].includes(report.priority)).length, detail: 'Priority reports' }
            ],
            insights: [
                { label: 'Complaint Mix', value: buildDistribution(reports.value, (report) => normalizeLabel(report.reportType))[0]?.label || 'None', detail: 'Top submitted category' },
                { label: 'Resolved vs Unresolved', value: `${countByStatus(reports.value, ['resolved', 'closed'])}/${reports.value.length}`, detail: 'Closure progress' },
                { label: 'Today', value: reportsToday.value, detail: 'Reports submitted today' }
            ]
        },
        appointments: {
            kicker: 'Civic scheduling',
            title: 'Appointment Booking Analytics',
            records: appointments.value,
            dateKey: 'appointmentDate',
            distribution: buildDistribution(appointments.value, (appointment) => normalizeLabel(appointment.purpose), ['No appointments']),
            summaries: [
                { label: 'Pending', value: pendingCounts.value.appointments, detail: 'Awaiting approval' },
                { label: 'Approved', value: countByStatus(appointments.value, ['approved']), detail: 'Confirmed bookings' },
                { label: 'Completed', value: countByStatus(appointments.value, ['completed']), detail: 'Served appointments' },
                { label: 'Rejected', value: countByStatus(appointments.value, ['rejected']), detail: 'Declined requests' },
                { label: 'Expired', value: countByStatus(appointments.value, ['expired']), detail: 'Missed schedule window' }
            ],
            insights: [
                { label: 'Peak Booking Day', value: peakDayLabel.value.appointments, detail: 'Most frequent appointment date' },
                { label: 'Top Service', value: buildDistribution(appointments.value, (appointment) => normalizeLabel(appointment.purpose))[0]?.label || 'None', detail: 'Most requested service' },
                { label: 'This Week', value: appointmentsThisWeek.value, detail: 'Scheduled activity' }
            ]
        },
        reservations: {
            kicker: 'Facility utilization',
            title: 'Facility Reservation Analytics',
            records: reservations.value,
            dateKey: 'reservationDate',
            distribution: buildDistribution(reservations.value, (reservation) => normalizeLabel(reservation.facilityName), ['No reservations']),
            summaries: [
                { label: 'Pending', value: pendingCounts.value.reserves, detail: 'Awaiting approval' },
                { label: 'Approved', value: countByStatus(reservations.value, ['approved']), detail: 'Confirmed usage' },
                { label: 'Completed', value: countByStatus(reservations.value, ['completed']), detail: 'Finished events' }
            ],
            insights: [
                { label: 'Most Reserved', value: topFacilityLabel.value, detail: 'Highest facility demand' },
                { label: 'Peak Day', value: peakDayLabel.value.reservations, detail: 'Frequent reservation day' },
                { label: 'Monthly Usage', value: buildTrend(reservations.value, 'reservationDate').reduce((sum, row) => sum + row.value, 0), detail: 'Current tab volume' }
            ]
        },
        announcements: {
            kicker: 'Public information',
            title: 'Announcement Reach Monitor',
            records: announcements.value,
            dateKey: 'createdAt',
            distribution: buildDistribution(announcements.value, (announcement) => announcement.isActive === false ? 'Inactive' : 'Active', ['No advisories']),
            summaries: [
                { label: 'Active', value: activeAnnouncementsCount.value, detail: 'Live on portal' },
                { label: 'Stored', value: announcements.value.length, detail: 'Total advisories' },
                { label: 'Recent', value: latestAnnouncements.value.length, detail: 'Latest posts' }
            ],
            insights: [
                { label: 'Publishing State', value: activeAnnouncementsCount.value ? 'Broadcasting' : 'Quiet', detail: 'Public advisory status' },
                { label: 'Latest Advisory', value: latestAnnouncements.value[0]?.title || 'None', detail: 'Newest public post' },
                { label: 'Active Ratio', value: `${announcements.value.length ? Math.round((activeAnnouncementsCount.value / announcements.value.length) * 100) : 0}%`, detail: 'Live advisory share' }
            ]
        }
    };

    const active = configs[selectedDashboardCard.value] || configs.reports;
    const distribution = active.distribution;
    const total = active.records.length;

    return {
        ...active,
        distribution,
        total,
        ringStyle: buildRingStyle(distribution),
        trend: buildTrend(active.records, active.dateKey)
    };
});

const peakDayLabel = computed(() => ({
    appointments: getPeakWeekday(appointments.value, 'appointmentDate'),
    reservations: getPeakWeekday(reservations.value, 'reservationDate')
}));

const getPeakWeekday = (records, dateKey) => {
    const counts = records.reduce((acc, record) => {
        const date = getRecordDate(record, dateKey);
        if (!date) return acc;
        const label = date.toLocaleDateString([], { weekday: 'short' });
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || 'None';
};

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

const latestDocuments = computed(() => [...documentRequests.value]
    .filter(d => d.status === 'pending' || d.status === 'processing')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3));

const latestReports = computed(() => [...reports.value]
    .filter(r => r.status === 'pending' || r.status === 'reviewing')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3));

const latestAppointments = computed(() => [...appointments.value]
    .filter(a => a.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3));

const getRecentActivityItems = computed(() => {
    const items = [];
    
    // Add recent documents
    latestDocuments.value.forEach(doc => {
        items.push({
            id: `doc-${doc._id}`,
            type: 'document',
            title: `Document request: ${doc.documentType?.replaceAll('_', ' ')}`,
            icon: 'fa-solid fa-file',
            view: 'documents',
            timeAgo: getTimeAgo(doc.createdAt),
            status: doc.status
        });
    });

    // Add recent reports
    latestReports.value.forEach(report => {
        items.push({
            id: `report-${report._id}`,
            type: 'report',
            title: `Report: ${report.title}`,
            icon: 'fa-solid fa-exclamation-circle',
            view: 'reports',
            timeAgo: getTimeAgo(report.createdAt),
            status: report.status
        });
    });

    // Add recent appointments
    latestAppointments.value.forEach(appt => {
        items.push({
            id: `appt-${appt._id}`,
            type: 'appointment',
            title: `Appointment: ${appt.officialId?.name || 'Official'}`,
            icon: 'fa-solid fa-calendar-check',
            view: 'appointments',
            timeAgo: getTimeAgo(appt.createdAt),
            status: appt.status
        });
    });

    // Sort by date and return latest 5
    return items
        .sort((a, b) => {
            const aTime = getTimeValue(a.timeAgo);
            const bTime = getTimeValue(b.timeAgo);
            return aTime - bTime;
        })
        .slice(0, 5);
});

const getTimeAgo = (date) => {
    if (!date) return 'Just now';
    
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
};

const getTimeValue = (timeAgo) => {
    const num = parseInt(timeAgo);
    if (isNaN(num)) return 0;
    if (timeAgo.includes('Just now')) return 0;
    if (timeAgo.includes('m ago')) return num * 60;
    if (timeAgo.includes('h ago')) return num * 3600;
    if (timeAgo.includes('d ago')) return num * 86400;
    return 999999;
};

const getWorkloadColor = (tone) => {
    const colors = {
        'docs': '#2563eb',
        'reserves': '#0891b2',
        'blue': '#1b7347',
        'reports': '#d97706'
    };
    return colors[tone] || '#1b7347';
};

const reportAlertHeading = computed(() => {
    if (reportAlertReports.value.length <= 1) {
        return 'A new report just arrived.';
    }
    return `${reportAlertReports.value.length} new reports just arrived.`;
});

const reportAlertMessage = computed(() => {
    if (reportAlertReports.value.length === 0) {
        return 'Please review the reports list for details.';
    }

    const names = reportAlertReports.value
        .map((report) => report?.title)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ');

    if (reportAlertReports.value.length === 1) {
        return names ? `Report received: ${names}` : 'A new report is waiting for review.';
    }

    return names
        ? `Latest reports: ${names}${reportAlertReports.value.length > 2 ? '...' : ''}`
        : 'Multiple reports are waiting for review.';
});

const selectDisasterIncident = async (incident) => {
    if (!incident?._id) return;
    selectedDisasterIncidentId.value = incident._id;
    try {
        selectedDisasterIncident.value = await apiFetch(`/disaster-incidents/${incident._id}`);
    } catch (error) {
        showToast(error.message || 'Failed to load disaster incident detail.', true);
    }
};

const createDisasterIncident = async () => {
    const title = prompt('Disaster incident title:');
    if (!title) return;

    try {
        const created = await apiFetch('/disaster-incidents', {
            method: 'POST',
            body: JSON.stringify({
                title: String(title).trim(),
                disasterType: 'other',
                status: 'active',
                severity: 'medium',
                source: 'manual'
            })
        });
        disasterIncidents.value.unshift(created);
        await selectDisasterIncident(created);
        showToast('Disaster incident created.');
    } catch (error) {
        showToast(error.message || 'Failed to create disaster incident.', true);
    }
};

const addAffectedToSelectedIncident = async () => {
    if (!selectedDisasterIncidentId.value) return;
    if (!disasterAffectedForm.familyHeadName.trim()) {
        showToast('Family head name is required.', true);
        return;
    }

    try {
        await apiFetch(`/disaster-incidents/${selectedDisasterIncidentId.value}/affected-records`, {
            method: 'POST',
            body: JSON.stringify({
                familyHeadName: disasterAffectedForm.familyHeadName.trim(),
                householdSize: disasterAffectedForm.householdSize || 1,
                urgentNeeds: disasterAffectedForm.urgentNeeds
            })
        });
        disasterAffectedForm.familyHeadName = '';
        disasterAffectedForm.householdSize = 1;
        disasterAffectedForm.urgentNeeds = '';
        await selectDisasterIncident({ _id: selectedDisasterIncidentId.value });
        showToast('Affected record added.');
    } catch (error) {
        showToast(error.message || 'Failed to add affected record.', true);
    }
};

const updateDisasterStatus = async (status) => {
    if (!selectedDisasterIncidentId.value) return;
    try {
        await apiFetch(`/disaster-incidents/${selectedDisasterIncidentId.value}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        await loadAll();
        await selectDisasterIncident({ _id: selectedDisasterIncidentId.value });
        showToast('Disaster incident status updated.');
    } catch (error) {
        showToast(error.message || 'Failed to update incident status.', true);
    }
};

const getAffectedDisplayName = (record) => {
    if (record.residentId) {
        return [
            record.residentId.firstName,
            record.residentId.middleName,
            record.residentId.lastName,
            record.residentId.suffix
        ].filter(Boolean).join(' ');
    }
    return record.familyHeadName || 'Unnamed Household';
};

const prefillDisasterAdvisory = () => {
    if (!selectedDisasterIncident.value?.incident) {
        showToast('Select an incident first.', true);
        return;
    }

    const incident = selectedDisasterIncident.value.incident;
    openModal('announcement', {
        title: `[Disaster Advisory] ${incident.title}`,
        description: `Advisory for ${incident.affectedArea || 'affected area'}.\nCurrent status: ${incident.status}.`,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: '',
        isActive: true
    });
};

const linkSelectedDisasterReport = async () => {
    if (!selectedDisasterIncidentId.value) {
        showToast('Select an incident first.', true);
        return;
    }
    if (!selectedDisasterReportId.value) {
        showToast('Select a disaster report from table list first.', true);
        return;
    }
    try {
        const detail = selectedDisasterIncident.value?.incident;
        const nextLinks = [...new Set([...(detail?.linkedReportIds || []), selectedDisasterReportId.value])];
        await apiFetch(`/disaster-incidents/${selectedDisasterIncidentId.value}`, {
            method: 'PATCH',
            body: JSON.stringify({ linkedReportIds: nextLinks })
        });
        await selectDisasterIncident({ _id: selectedDisasterIncidentId.value });
        showToast('Disaster report linked.');
    } catch (error) {
        showToast(error.message || 'Failed to link disaster report.', true);
    }
};

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
            { label: 'Report Type', value: item.reportType?.replaceAll('_', ' ') },
            { label: 'Priority', value: item.priority?.toUpperCase() },
            { label: 'Incident Date', value: formatDate(item.incidentDate) },
            { label: 'Location', value: item.locationText },
            { label: 'Description', value: item.description },
            {
                label: 'Proof Uploaded',
                value: Array.isArray(item.proofFiles) && item.proofFiles.length ? `${item.proofFiles.length} file(s)` : 'No files'
            },
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

const dismissReportAlert = () => {
    stopAlertSound();
    reportAlertVisible.value = false;
    reportAlertReports.value = [];
    clearUnreadReports();
};

const viewReportsFromAlert = async () => {
    reportAlertBusy.value = true;
    try {
        stopAlertSound();
        await loadAll();
        currentView.value = 'reports';
        dismissReportAlert();
    } finally {
        reportAlertBusy.value = false;
    }
};

watch(loginStatus, (message) => {
    if (!message) {
        return;
    }

    showToast(message, loginError.value);
});

watch(dashboardStatus, (message) => {
    if (!message || !dashboardError.value) {
        return;
    }

    showToast(message, true);
});

watch(unreadReports, (newReports) => {
    if (newReports.length > 0) {
        reportAlertReports.value = [...newReports];
        reportAlertVisible.value = true;
        reportAlertBusy.value = true;
        loadAll()
            .catch(() => {})
            .finally(() => {
                reportAlertBusy.value = false;
            });
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

onMounted(() => {
    initSession();
    initSoundSettings();
});
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.notifications-blurred {
    filter: blur(5px);
    pointer-events: none;
    user-select: none;
    transition: filter 0.2s ease;
}

.app-shell {
    position: relative;
    background:
    radial-gradient(circle at top left, rgba(27, 115, 71, 0.08), transparent 28%),
    radial-gradient(circle at top right, rgba(31, 90, 138, 0.06), transparent 30%),
    radial-gradient(circle at bottom right, rgba(181, 136, 56, 0.05), transparent 24%),
    linear-gradient(180deg, #f4f8f7 0%, #ebf2f0 100%);
}

.app-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image: linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.24), transparent 70%);
    opacity: 0.55;
}

/* Dashboard Welcome Section */
.dashboard-welcome {
    margin-bottom: 32px;
    animation: slideIn 0.5s ease;
}

.dashboard-welcome-title {
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 8px;
    font-family: "Fraunces", serif;
}

.dashboard-welcome-subtitle {
    font-size: 1rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.6;
}

/* Statistics Cards Grid */
.dashboard-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
    animation: slideIn 0.6s ease 0.1s both;
}

.dashboard-stat-card {
    background: var(--surface-strong);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
}

.dashboard-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow);
    border-color: var(--accent);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
}

.stat-icon-residents {
    background: rgba(27, 115, 71, 0.12);
    color: var(--accent);
}

.stat-icon-pending {
    background: rgba(37, 164, 160, 0.12);
    color: #25a4a0;
}

.stat-icon-announcements {
    background: rgba(251, 146, 60, 0.12);
    color: #fb923c;
}

.stat-icon-reports {
    background: rgba(229, 62, 62, 0.12);
    color: #e53e3e;
}

.stat-icon-appointments {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
}

.stat-icon-facilities {
    background: rgba(168, 85, 247, 0.12);
    color: #a855f7;
}

.stat-content {
    flex: 1;
}

.stat-label {
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    font-weight: 600;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 4px 0 0;
    font-family: "Manrope", sans-serif;
}

/* Main Dashboard Grid */
.dashboard-main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
    animation: slideIn 0.6s ease 0.2s both;
}

.dashboard-panel {
    background: var(--surface-strong);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
}

.dashboard-panel:hover {
    box-shadow: var(--shadow);
}

.panel-header {
    margin-bottom: 20px;
    border-bottom: 2px solid var(--line);
    padding-bottom: 16px;
}

.panel-header h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--ink);
}

.panel-subtitle {
    font-size: 0.85rem;
    color: var(--muted);
}

/* Activity Feed */
.activity-feed {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 320px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-md);
    background: var(--clay);
    transition: all 0.2s ease;
}

.activity-item:hover {
    background: rgba(27, 115, 71, 0.08);
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1rem;
}

.activity-document {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
}

.activity-report {
    background: rgba(229, 62, 62, 0.15);
    color: #e53e3e;
}

.activity-appointment {
    background: rgba(37, 164, 160, 0.15);
    color: #25a4a0;
}

.activity-content {
    flex: 1;
    min-width: 0;
}

.activity-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--ink);
    margin: 0 0 2px;
}

.activity-time {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0;
}

.activity-badge {
    flex-shrink: 0;
}

.activity-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
}

.activity-empty i {
    font-size: 2rem;
    margin-bottom: 8px;
    display: block;
    opacity: 0.5;
}

/* Pending Actions Panel */
.pending-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.pending-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.pending-section {
    padding: 12px;
    border-radius: var(--radius-md);
    background: var(--clay);
    border: 1px solid rgba(27, 115, 71, 0.1);
}

.pending-category {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.pending-action-btn {
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: var(--radius-md);
    background: white;
    border: 1px solid var(--accent);
    color: var(--accent);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
}

.pending-action-btn:hover {
    background: var(--accent);
    color: white;
    transform: translateX(4px);
}

.pending-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
}

.pending-empty i {
    font-size: 2.5rem;
    color: var(--accent);
    margin-bottom: 8px;
    display: block;
}

.pending-empty p {
    font-weight: 600;
    margin: 8px 0 4px;
    color: var(--ink);
}

.pending-empty small {
    display: block;
    font-size: 0.85rem;
}

/* Analytics Grid */
.dashboard-analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
    animation: slideIn 0.6s ease 0.3s both;
}

.dashboard-workload-panel,
.dashboard-metrics-panel {
    background: var(--surface-strong);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
}

/* Workload Chart */
.workload-chart {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.workload-bar-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.workload-bar-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.workload-bar-label strong {
    font-size: 0.95rem;
    color: var(--ink);
}

.workload-bar-count {
    background: var(--accent-light);
    color: var(--accent);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.workload-bar-track {
    height: 12px;
    border-radius: 999px;
    background: var(--clay);
    overflow: hidden;
}

.workload-bar-fill {
    height: 100%;
    border-radius: inherit;
    transition: width 0.3s ease;
}

.workload-bar-percent {
    font-size: 0.8rem;
    color: var(--muted);
}

/* Metrics Grid */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.metric-box {
    padding: 16px;
    border-radius: var(--radius-md);
    background: var(--clay);
    border: 1px solid rgba(27, 115, 71, 0.1);
    text-align: center;
}

.metric-label {
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 8px;
    font-weight: 600;
}

.metric-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--accent);
    margin: 0;
}

.metric-total {
    font-size: 0.9rem;
    color: var(--muted);
    font-weight: 500;
    margin-left: 4px;
}

/* Announcements Section */
.dashboard-announcements-panel {
    background: var(--surface-strong);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    animation: slideIn 0.6s ease 0.4s both;
}

.announcements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.announcement-card {
    background: linear-gradient(135deg, var(--accent-light) 0%, rgba(255, 255, 255, 0.8) 100%);
    border: 1px solid rgba(27, 115, 71, 0.2);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease;
}

.announcement-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(27, 115, 71, 0.12);
    border-color: var(--accent);
}

.announcement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.announcement-header h4 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: var(--ink);
    flex: 1;
}

.announcement-summary {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.5;
}

.announcement-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(27, 115, 71, 0.1);
}

.announcement-date {
    font-size: 0.8rem;
    color: var(--muted);
}

.announcement-edit-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: var(--accent);
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.announcement-edit-btn:hover {
    background: var(--accent-deep);
    transform: translateX(2px);
}

.announcements-empty {
    text-align: center;
    padding: 60px 40px;
    color: var(--muted);
}

.announcements-empty i {
    font-size: 3rem;
    color: var(--accent);
    margin-bottom: 12px;
    display: block;
    opacity: 0.8;
}

.announcements-empty p {
    font-weight: 600;
    margin: 8px 0;
    color: var(--ink);
    font-size: 1rem;
}

/* Modern Operations Dashboard */
.ops-dashboard-shell {
    display: grid;
    gap: 18px;
}

.ops-dashboard-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    padding: 4px 2px 2px;
}

.ops-dashboard-header h1 {
    margin-top: 4px;
    font-family: "Manrope", sans-serif;
    font-size: clamp(1.6rem, 2.8vw, 2.55rem);
    line-height: 1.05;
    color: #0b1f1c;
}

.ops-live-status {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 9px 13px;
    border: 1px solid rgba(13, 74, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    color: #174a2e;
    font-size: 0.82rem;
    font-weight: 800;
    box-shadow: 0 10px 22px rgba(12, 32, 27, 0.08);
}

.live-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: #10b981;
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.14);
}

.ops-dashboard-layout {
    display: grid;
    grid-template-columns: minmax(360px, 0.82fr) minmax(520px, 1.18fr);
    gap: 18px;
    align-items: start;
}

.ops-left-section,
.ops-side-panels {
    display: grid;
    gap: 14px;
}

.ops-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.ops-stat-card {
    position: relative;
    min-height: 142px;
    padding: 15px;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid rgba(15, 31, 27, 0.1);
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(244, 250, 247, 0.92));
    box-shadow: 0 14px 32px rgba(15, 31, 27, 0.09);
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.ops-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 42px rgba(15, 31, 27, 0.14);
}

.ops-stat-card.active {
    color: #f8fffc;
    border-color: rgba(255, 255, 255, 0.26);
    background: linear-gradient(145deg, #0d4a2a, #a1121c);
}

.ops-card-glow {
    position: absolute;
    inset: auto -28px -36px auto;
    width: 92px;
    height: 92px;
    border-radius: 999px;
    background: rgba(15, 118, 110, 0.16);
    pointer-events: none;
}

.ops-stat-card.active .ops-card-glow {
    background: rgba(255, 255, 255, 0.16);
}

.ops-stat-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #0f766e;
    background: rgba(15, 118, 110, 0.11);
}

.ops-stat-card.active .ops-stat-icon {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.16);
}

.ops-stat-meta {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 2px;
}

.ops-stat-label {
    color: #5f706b;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.ops-stat-meta strong {
    color: #0f1f1b;
    font-size: clamp(1.55rem, 3vw, 2.15rem);
    line-height: 1;
}

.ops-stat-meta small {
    color: #60756d;
    font-size: 0.76rem;
    font-weight: 700;
}

.ops-stat-card.active .ops-stat-label,
.ops-stat-card.active .ops-stat-meta strong,
.ops-stat-card.active .ops-stat-meta small {
    color: inherit;
}

.tone-blue .ops-stat-icon { color: #0d4a2a; background: rgba(13, 74, 42, 0.1); }
.tone-red .ops-stat-icon { color: #be123c; background: rgba(190, 18, 60, 0.1); }
.tone-cyan .ops-stat-icon { color: #15803d; background: rgba(21, 128, 61, 0.1); }
.tone-violet .ops-stat-icon { color: #991b1b; background: rgba(153, 27, 27, 0.1); }
.tone-gold .ops-stat-icon { color: #b91c1c; background: rgba(185, 28, 28, 0.1); }

.ops-analytics-panel,
.ops-mini-panel {
    border: 1px solid rgba(15, 31, 27, 0.1);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 16px 40px rgba(15, 31, 27, 0.1);
}

.ops-analytics-panel {
    min-height: 604px;
    padding: 20px;
    display: grid;
    gap: 16px;
    animation: analyticsIn 0.24s ease;
}

.ops-analytics-top,
.ops-panel-heading {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
}

.ops-kicker,
.ops-panel-heading span {
    color: #0f766e;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.ops-analytics-top h2,
.ops-panel-heading h3 {
    margin: 2px 0 0;
    font-family: "Manrope", sans-serif;
    color: #0f1f1b;
}

.ops-analytics-top h2 {
    font-size: clamp(1.35rem, 2.3vw, 2rem);
}

.ops-range-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
    background: #edf4f1;
}

.ops-range-tabs button {
    padding: 8px 10px;
    border-radius: 9px;
    background: transparent;
    color: #48625a;
    font-size: 0.78rem;
    font-weight: 900;
}

.ops-range-tabs button.active {
    background: linear-gradient(135deg, #0d4a2a, #a1121c);
    color: white;
    box-shadow: 0 8px 18px rgba(112, 24, 24, 0.18);
}

.ops-summary-strip,
.ops-insight-grid,
.community-insight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
}

.ops-summary-item,
.ops-insight-card,
.community-insight-grid div {
    padding: 13px;
    border: 1px solid rgba(15, 31, 27, 0.08);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(248, 252, 250, 0.96), rgba(255, 255, 255, 0.94));
}

.ops-summary-item span,
.ops-insight-card span,
.community-insight-grid span {
    display: block;
    color: #5f706b;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.ops-summary-item strong,
.ops-insight-card strong,
.community-insight-grid strong {
    display: block;
    margin-top: 4px;
    color: #0d4a2a;
    font-size: 1.45rem;
    line-height: 1.1;
}

.ops-summary-item small,
.ops-insight-card small,
.community-insight-grid small {
    display: block;
    margin-top: 4px;
    color: #667b73;
    font-size: 0.78rem;
}

.ops-chart-zone {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.7fr);
    gap: 14px;
    min-height: 250px;
}

.ops-bar-chart,
.ops-distribution-card {
    border-radius: 18px;
    border: 1px solid rgba(15, 31, 27, 0.08);
    background:
        linear-gradient(rgba(15, 31, 27, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 31, 27, 0.035) 1px, transparent 1px),
        #fbfefd;
    background-size: 42px 42px;
}

.ops-bar-chart {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    align-items: end;
    gap: 10px;
    padding: 16px 16px 12px;
}

.ops-bar-column {
    min-width: 0;
    height: 210px;
    display: grid;
    grid-template-rows: 24px 1fr 22px;
    gap: 7px;
    align-items: end;
    text-align: center;
}

.ops-bar-value {
    color: #19463a;
    font-size: 0.78rem;
    font-weight: 900;
}

.ops-bar-track {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border-radius: 999px;
    background: rgba(13, 74, 42, 0.07);
    overflow: hidden;
}

.ops-bar-track span {
    width: 100%;
    min-height: 10px;
    border-radius: inherit;
    background: linear-gradient(180deg, #16a34a, #a1121c);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    animation: barGrow 0.38s ease both;
}

.ops-bar-column small {
    color: #60756d;
    font-size: 0.75rem;
    font-weight: 800;
    white-space: nowrap;
}

.ops-distribution-card {
    padding: 16px;
    display: grid;
    place-items: center;
    gap: 14px;
}

.ops-distribution-ring {
    width: 146px;
    height: 146px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 0 1px rgba(15, 31, 27, 0.08);
}

.ops-distribution-ring div {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: #ffffff;
    display: grid;
    place-items: center;
    align-content: center;
    box-shadow: 0 8px 20px rgba(15, 31, 27, 0.12);
}

.ops-distribution-ring strong {
    font-size: 1.6rem;
    color: #0d4a2a;
    line-height: 1;
}

.ops-distribution-ring span {
    color: #60756d;
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
}

.ops-distribution-list {
    width: 100%;
    display: grid;
    gap: 8px;
}

.ops-distribution-list div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: #20342d;
    font-size: 0.82rem;
    font-weight: 800;
}

.ops-distribution-list span {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ops-distribution-list i {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 999px;
}

.ops-mini-panel {
    padding: 16px;
}

.ops-timeline,
.ops-quick-actions {
    display: grid;
    gap: 9px;
    margin-top: 12px;
}

.ops-timeline-item,
.ops-quick-actions button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 13px;
    border: 1px solid rgba(15, 31, 27, 0.08);
    background: rgba(248, 252, 250, 0.86);
    color: #18342b;
    text-align: left;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.ops-timeline-item:hover,
.ops-quick-actions button:hover {
    transform: translateX(3px);
    border-color: rgba(13, 74, 42, 0.22);
    background: #ffffff;
}

.ops-timeline-icon,
.ops-quick-actions i {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: #0f766e;
    background: rgba(15, 118, 110, 0.1);
}

.ops-timeline-item strong {
    display: block;
    color: #18342b;
    font-size: 0.86rem;
    line-height: 1.2;
}

.ops-timeline-item small {
    color: #60756d;
    font-size: 0.75rem;
    font-weight: 700;
}

.ops-quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ops-quick-actions button {
    min-height: 76px;
    flex-direction: column;
    align-items: flex-start;
    font-weight: 900;
}

.ops-community-band {
    display: grid;
}

.community-insights-panel {
    background: linear-gradient(135deg, rgba(13, 74, 42, 0.97), rgba(161, 18, 28, 0.92));
}

.community-insights-panel .ops-panel-heading h3,
.community-insights-panel .ops-panel-heading span {
    color: #f8fffc;
}

.community-insight-grid div {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.1);
}

.community-insight-grid span,
.community-insight-grid strong,
.community-insight-grid small {
    color: #f8fffc;
}

@keyframes analyticsIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes barGrow {
    from { height: 10px; opacity: 0.65; }
}

/* Responsive Design */
@media (max-width: 1200px) {
    .ops-dashboard-layout {
        grid-template-columns: 1fr;
    }

    .ops-analytics-panel {
        min-height: auto;
    }

    .dashboard-main-grid,
    .dashboard-analytics-grid {
        grid-template-columns: 1fr;
    }
    
    .dashboard-stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
}

@media (max-width: 768px) {
    .ops-dashboard-header,
    .ops-analytics-top,
    .ops-panel-heading {
        align-items: stretch;
        flex-direction: column;
    }

    .ops-stat-grid,
    .ops-summary-strip,
    .ops-insight-grid,
    .community-insight-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ops-chart-zone {
        grid-template-columns: 1fr;
    }

    .ops-bar-chart {
        gap: 6px;
        padding: 12px;
    }

    .ops-bar-column {
        height: 176px;
    }

    .ops-range-tabs,
    .ops-quick-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-welcome-title {
        font-size: 1.8rem;
    }
    
    .dashboard-stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    
    .dashboard-stat-card {
        padding: 16px;
        gap: 12px;
    }
    
    .stat-icon {
        width: 48px;
        height: 48px;
        font-size: 1.2rem;
    }
    
    .stat-value {
        font-size: 1.5rem;
    }
    
    .announcements-grid {
        grid-template-columns: 1fr;
    }
}

.app-main {
    position: relative;
    z-index: 1;
}

.hero-banner {
    padding: 20px 24px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 246, 243, 0.96));
    border: 1px solid rgba(58, 78, 67, 0.10);
    box-shadow: 0 18px 50px rgba(28, 39, 33, 0.09);
    backdrop-filter: blur(14px);
}

.dashboard-top-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 18px;
}

.sound-settings-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.28);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 24px rgba(12, 34, 23, 0.16);
}

.sound-settings-btn i {
    color: #ffffff;
    font-size: 1rem;
}

.sound-settings-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 14px 28px rgba(12, 34, 23, 0.20);
}

/* Sound Settings Modal Styles */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 22, 18, 0.56);
    display: grid;
    place-items: center;
    z-index: 1000;
    padding: 20px;
    backdrop-filter: blur(10px);
}

.sound-settings-modal {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 246, 0.96));
    border-radius: 20px;
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.20);
    width: 100%;
    max-width: 420px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(58, 78, 67, 0.08);
    background: linear-gradient(135deg, rgba(37, 127, 73, 0.04), rgba(35, 91, 130, 0.04));
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 10px;
}

.modal-header i {
    color: #257f49;
}

.modal-close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #7f8c8d;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: grid;
    place-items: center;
}

.modal-close-btn:hover {
    background: rgba(37, 127, 73, 0.10);
    color: #2c3e50;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section:last-of-type {
    margin-bottom: 0;
}

/* File Input Styling */
.file-input-group {
    display: block;
    position: relative;
}

.file-input-group input[type="file"] {
    display: none;
}

.file-input-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #235b82 0%, #1f4e6b 100%);
    color: white;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.file-input-label:hover {
    background: linear-gradient(135deg, #1f4e6b 0%, #173a51 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(31, 78, 107, 0.28);
}

.file-input-label:active {
    transform: translateY(0);
}

/* Control Groups */
.control-group {
    margin-bottom: 16px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
    color: #2c3e50;
}

.checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #257f49;
}

/* Volume Control */
.volume-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.volume-header label {
    font-weight: 600;
    color: #2c3e50;
}

.volume-value {
    font-weight: 700;
    color: #257f49;
    font-size: 1.1rem;
}

.volume-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, #ecf0f1 0%, #bdc3c7 100%);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    margin: 12px 0;
}

.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #257f49, #235b82);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
    transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 16px rgba(37, 127, 73, 0.36);
}

.volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #257f49, #235b82);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
    transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 16px rgba(37, 127, 73, 0.36);
}

.volume-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #7f8c8d;
    padding: 0 4px;
}

/* Button Group */
.button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
}

.primary-button,
.secondary-button {
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.primary-button {
    background: linear-gradient(135deg, #257f49 0%, #1f6a3b 100%);
    color: white;
}

.primary-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37, 127, 73, 0.28);
}

.secondary-button {
    background: #edf3ef;
    color: #234033;
    border: 1px solid rgba(58, 78, 67, 0.12);
}

.secondary-button:hover:not(:disabled) {
    background: #e1e8e3;
    transform: translateY(-1px);
}

.primary-button:disabled,
.secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Alert Messages */
.alert-message {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    border-left: 4px solid;
}

.alert-message.success {
    background: #e2f3e8;
    color: #257f49;
    border-left-color: #257f49;
}

.alert-message.error {
    background: #f9e6e5;
    color: #a83d35;
    border-left-color: #a83d35;
}

/* Current Sound Display */
.current-sound {
    margin-top: 12px;
    padding: 10px 12px;
    background: rgba(37, 127, 73, 0.08);
    border-radius: 6px;
    color: #234033;
    font-size: 0.85rem;
    border-left: 3px solid #257f49;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
}

.empty-state i {
    font-size: 3rem;
    margin-bottom: 16px;
    color: #bdc3c7;
}

.empty-state p {
    margin: 0 0 8px 0;
    font-weight: 500;
    color: #34495e;
}

.empty-state small {
    color: #95a5a6;
}

.hero-banner h2 {
    margin: 4px 0 0;
    letter-spacing: -0.02em;
    color: #1a2a22;
}

.content-card {
    border-radius: 22px;
    border: 1px solid rgba(58, 78, 67, 0.08);
    box-shadow: 0 16px 40px rgba(28, 39, 33, 0.08);
    overflow: hidden;
}

.dashboard-hero-card {
    background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 34%),
        linear-gradient(135deg, rgba(37, 127, 73, 0.98), rgba(23, 74, 46, 0.96));
    color: #f6fbf7;
    padding: 28px;
    position: relative;
    overflow: hidden;
}

.dashboard-hero-card::after {
    content: '';
    position: absolute;
    inset: auto -12% -35% auto;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 68%);
    pointer-events: none;
}

.dashboard-hero-card .eyebrow,
.dashboard-hero-card h3,
.dashboard-hero-card p,
.dashboard-hero-card span,
.dashboard-hero-card strong {
    color: inherit;
}

.dashboard-hero-card p {
    opacity: 0.9;
}

.dashboard-ring-panel {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 18px;
    backdrop-filter: blur(8px);
}

.dashboard-ring-caption {
    color: rgba(255, 255, 255, 0.88);
}

.dashboard-summary-card,
.dashboard-chart-card,
.dashboard-feed-card {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(247, 250, 248, 0.97));
}

.dashboard-summary-card {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.dashboard-summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 42px rgba(28, 39, 33, 0.10);
}

.dashboard-summary-card.accent {
    background: linear-gradient(180deg, rgba(37, 127, 73, 0.1), rgba(255, 255, 255, 0.96));
}

.dashboard-summary-card.blue {
    background: linear-gradient(180deg, rgba(35, 91, 130, 0.1), rgba(255, 255, 255, 0.96));
}

.dashboard-summary-card.gold {
    background: linear-gradient(180deg, rgba(181, 136, 56, 0.12), rgba(255, 255, 255, 0.96));
}

.dashboard-section-head h3 {
    letter-spacing: -0.015em;
    color: #1b2a22;
}

.dashboard-chip {
    background: rgba(37, 127, 73, 0.1);
    color: #257f49;
    border: 1px solid rgba(37, 127, 73, 0.16);
}

.dashboard-bar-track {
    background: rgba(58, 78, 67, 0.08);
}

.dashboard-feed-item {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(58, 78, 67, 0.08);
    border-radius: 16px;
    padding: 14px 16px;
}

.dashboard-empty-state {
    background: rgba(255, 255, 255, 0.7);
    border: 1px dashed rgba(58, 78, 67, 0.16);
    border-radius: 16px;
}

.report-alert-overlay {
    position: fixed;
    inset: 0;
    z-index: 2600;
    display: grid;
    place-items: center;
    background: rgba(20, 33, 30, 0.38);
    padding: 20px;
}

.report-alert-card {
    width: min(520px, 100%);
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 22px 56px rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(58, 78, 67, 0.16);
    padding: 22px;
    display: grid;
    gap: 10px;
}

.report-alert-eyebrow {
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.11em;
    color: #8b4c1e;
    font-weight: 700;
}

.report-alert-card h3 {
    margin: 0;
    color: #243b31;
    font-size: 1.3rem;
}

.report-alert-card p {
    margin: 0;
    color: #53675d;
    line-height: 1.45;
}

.report-alert-actions {
    margin-top: 8px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.report-alert-actions .primary-button,
.report-alert-actions .ghost-button {
    min-width: 140px;
    justify-content: center;
}

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
