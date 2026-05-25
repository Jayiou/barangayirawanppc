<template>
        <div v-if="initializing" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; flex-direction: column;">
            <div style="width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #2c3e50; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="margin-top: 1rem; color: #5e6f66; font-size: 0.9rem;">{{ texts.admin.initializing }}</p>
        </div>
    <div v-else-if="!isAuthenticated" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f4f7f6; padding: 20px;">
        <div style="width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center;">
            <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />
            <BrandMark initials="BC" eyebrow="Barangay Admin" title="Barangay Connect" style="margin-bottom: 2rem;" />
            <form class="stack" @submit.prevent="loginAdmin" style="width: 100%; background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05);">
                <div class="section-head" style="text-align: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.5rem; color: #1a1a1a;">{{ texts.admin.login.heading }}</h3>
                    <p class="fine-print" style="margin-top: 0.5rem;">{{ texts.admin.login.sub }}</p>
                </div>
                <label>
                    <span>{{ texts.admin.login.username }}</span>
                    <input v-model="loginForm.username" type="text" required>
                </label>
                <label>
                    <span>{{ texts.admin.login.password }}</span>
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
                <button type="submit" class="primary-button" :disabled="loginLoading" style="justify-content: center; width: 100%; padding: 0.85rem; font-size: 1rem; border-radius: 6px; margin-top: 0.5rem;"><i :class="loginLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'"></i> {{ loginLoading ? texts.admin.login.signingIn : texts.admin.login.login }}</button>
            </form>
        </div>
    </div>

    <div class="page-shell app-shell" v-else>
        <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />
        <dialog v-if="reportAlertVisible" class="report-alert-overlay" aria-modal="true" aria-live="assertive" open>
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
        </dialog>

        <aside class="app-sidebar" aria-label="Admin sidebar" :class="{ open: sidebarOpen, 'notifications-blurred': reportAlertVisible }">
            <button class="sidebar-close-btn" @click="sidebarOpen = false"><i class="fa-solid fa-xmark"></i></button>
            
            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <BrandMark initials="BC" eyebrow="Admin Portal" title="Barangay Connect" />
            </div>

            <!-- Sidebar Navigation -->
                <nav class="sidebar-nav">
                <button :class="{ active: currentView === 'dashboard' }" type="button" @click="currentView = 'dashboard'"><i class="fa-solid fa-chart-pie"></i> {{ texts.admin.sidebar.dashboard }}</button>
                <button :class="{ active: currentView === 'announcements' }" type="button" @click="currentView = 'announcements'"><i class="fa-solid fa-bullhorn"></i> {{ texts.admin.sidebar.announcements }}</button>
                <button :class="{ active: currentView === 'residents' }" type="button" @click="currentView = 'residents'"><i class="fa-solid fa-users"></i> {{ texts.admin.sidebar.residents }}</button>
                <button :class="{ active: currentView === 'appointments' }" type="button" @click="currentView = 'appointments'"><i class="fa-solid fa-calendar-check"></i> {{ texts.admin.sidebar.appointments }} <span class="badge" v-if="pendingCounts.appointments">{{ pendingCounts.appointments }}</span></button>
                <button :class="{ active: currentView === 'officials' }" type="button" @click="currentView = 'officials'"><i class="fa-solid fa-crown"></i> {{ texts.admin.sidebar.officials }}</button>

                <button :class="{ active: currentView === 'reservations' }" type="button" @click="currentView = 'reservations'"><i class="fa-solid fa-building"></i> {{ texts.admin.sidebar.facilities }} <span class="badge" v-if="pendingCounts.reserves">{{ pendingCounts.reserves }}</span></button>
                <button :class="{ active: currentView === 'reports' }" type="button" @click="currentView = 'reports'"><i class="fa-solid fa-flag"></i> {{ texts.admin.sidebar.reports }} <span class="badge" v-if="pendingCounts.reports">{{ pendingCounts.reports }}</span></button>
                <button :class="{ active: currentView === 'documents' }" type="button" @click="currentView = 'documents'"><i class="fa-solid fa-file-lines"></i> {{ texts.admin.sidebar.documents }} <span class="badge" v-if="documentRequests.length">{{ documentRequests.length }}</span></button>
                <button :class="{ active: currentView === 'disaster' }" type="button" @click="currentView = 'disaster'"><i class="fa-solid fa-house-flood-water"></i> {{ texts.admin.sidebar.disaster }}</button>
                <button :class="{ active: currentView === 'sms-logs' }" type="button" @click="currentView = 'sms-logs'"><i class="fa-solid fa-message"></i> {{ texts.admin.sidebar.smsLogs }}</button>
            </nav>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <span class="footer-eyebrow">Logged In As</span>
                <div class="user-info" v-if="user">
                    <strong class="user-name">{{ user.username }}</strong>
                    <div class="user-email">{{ user.email }}</div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button type="button" class="logout-btn" @click="confirmLogout" style="flex: 1;"><i class="fa-solid fa-right-from-bracket"></i> {{ texts.admin.sidebar.logout }}</button>
                </div>
            </div>
        </aside>

        <main class="app-main" :class="{ 'notifications-blurred': reportAlertVisible }">
            <header class="mobile-app-header">
                <button class="sidebar-open-btn" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
            </header>
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
                                <template v-if="isDataLoading">
                                    <div v-for="i in 3" :key="'skel-stat-' + i" class="ops-stat-card skeleton-card" style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; gap: 10px;">
                                        <SkeletonLoader type="avatar" style="margin: 0; width: 38px; height: 38px;" />
                                        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                                            <SkeletonLoader type="text" width="60%" style="margin: 0;" />
                                            <SkeletonLoader type="text" width="40%" style="margin: 0; height: 1.5rem;" />
                                            <SkeletonLoader type="text" width="80%" style="margin: 0; height: 0.8rem;" />
                                        </div>
                                    </div>
                                </template>
                                <template v-else>
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
                                </template>
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
                                    <div class="ops-chart-frame">
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ops-line-chart" role="img" :aria-label="`${activeAnalyticsData.title} trend line chart`">
                                            <defs>
                                                <linearGradient id="opsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.12" />
                                                    <stop offset="50%" stop-color="#10b981" stop-opacity="0.06" />
                                                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.01" />
                                                </linearGradient>
                                                <filter id="chartLineBlur">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
                                                </filter>
                                            </defs>
                                            <!-- Grid Lines -->
                                            <g class="chart-grid-lines">
                                                <line
                                                    v-for="(point, index) in analyticsLineDots"
                                                    :key="`grid-${index}`"
                                                    :x1="point.x"
                                                    :y1="14"
                                                    :x2="point.x"
                                                    :y2="84"
                                                    stroke="rgba(15, 31, 27, 0.05)"
                                                    stroke-width="1"
                                                    stroke-dasharray="2,3"
                                                />
                                            </g>
                                            <path :d="analyticsAreaPath" fill="url(#opsAreaGradient)" class="chart-area"></path>
                                            <path :d="analyticsLinePath" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chart-line"></path>
                                            <g class="chart-points-group">
                                                <circle
                                                    v-for="(point, index) in analyticsLineDots"
                                                    :key="point.key"
                                                    :cx="point.x"
                                                    :cy="point.y"
                                                    r="0"
                                                    fill="#10b981"
                                                    stroke="#ffffff"
                                                    stroke-width="1.5"
                                                    class="chart-point"
                                                    :class="{ 'active': hoveredTrendIndex === index }"
                                                    @mouseenter="setHoveredTrendIndex(index)"
                                                    @mouseleave="clearHoveredTrendIndex"
                                                    @focus="setHoveredTrendIndex(index)"
                                                    @blur="clearHoveredTrendIndex"
                                                    @keydown="setHoveredTrendIndex(index)"
                                                    tabindex="0"
                                                    role="button"
                                                    :aria-label="`Trend point ${activeAnalyticsData.trend[index]?.label}: ${activeAnalyticsData.trend[index]?.value}`"
                                                ></circle>
                                            </g>
                                        </svg>
                                        <div v-if="analyticsTooltip" class="ops-tooltip" :style="{ left: analyticsTooltip.left, top: analyticsTooltip.top }">
                                            <small class="tooltip-label">{{ analyticsTooltip.label }}</small>
                                            <strong>{{ analyticsTooltip.value }}</strong>
                                            <span>{{ analyticsTooltip.tooltip }}</span>
                                        </div>
                                    </div>
                                    <div class="ops-line-labels">
                                        <div v-for="row in activeAnalyticsData.trend" :key="`label-${row.label}`" class="ops-line-label-item">
                                            <small>{{ row.label }}</small>
                                            <span>{{ row.value }}</span>
                                        </div>
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
                                <span class="eyebrow">Disaster Advisory Module</span>
                                <h3>Weather impact advisory and evacuation guidance</h3>
                            </div>
                            <button class="ghost-button" type="button" @click="resetDisasterAdvisoryForm"><i class="fa-solid fa-rotate-right"></i> Clear Form</button>
                        </div>
                        <div class="summary-grid" style="margin-bottom:14px;">
                            <article class="summary-card"><span>Total Advisories</span><strong>{{ disasterSummary.total }}</strong></article>
                            <article class="summary-card"><span>Upcoming</span><strong>{{ disasterSummary.upcoming }}</strong></article>
                            <article class="summary-card"><span>Ongoing</span><strong>{{ disasterSummary.ongoing }}</strong></article>
                            <article class="summary-card"><span>Ended</span><strong>{{ disasterSummary.ended }}</strong></article>
                        </div>
                        <div class="portal-grid" style="grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.3fr);">
                            <article class="content-card" style="padding:16px;">
                                <form class="stack" @submit.prevent="saveDisasterAdvisory">
                                    <label><span>Disaster Type</span>
                                        <select v-model="disasterAdvisoryForm.disasterType" required>
                                            <option value="typhoon">Typhoon</option>
                                            <option value="flood">Flood</option>
                                            <option value="landslide">Landslide</option>
                                        </select>
                                    </label>
                                    <label><span>Expected Impact Date</span><input v-model="disasterAdvisoryForm.expectedImpactDate" type="datetime-local" required></label>
                                    <label><span>Severity</span>
                                        <select v-model="disasterAdvisoryForm.severity" required>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </label>
                                    <div style="display:grid; gap:10px; padding:12px; border:1px solid #dce6e1; border-radius:8px; background:#fbfdfc;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                                            <span style="font-weight:600;">Flood-Prone Areas</span>
                                            <button type="button" class="ghost-button" @click="addFloodProneAreaRow"><i class="fa-solid fa-plus"></i> Add Area</button>
                                        </div>
                                        <div v-for="(area, index) in disasterFloodAreaRows" :key="area.id" style="display:grid; gap:10px; padding:12px; border:1px solid #e6eee9; border-radius:8px; background:#fff;">
                                            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                                <strong>Area {{ index + 1 }}</strong>
                                                <button v-if="disasterFloodAreaRows.length > 1" type="button" class="ghost-button" @click="removeFloodProneAreaRow(index)" style="color:#b42318;"><i class="fa-solid fa-trash"></i> Remove</button>
                                            </div>
                                            <label>
                                                <span>Purok</span>
                                                <select v-model="area.purok" required @change="area.zone = ''">
                                                    <option value="" disabled>Select Purok</option>
                                                    <option v-for="purok in disasterPurokOptions" :key="purok" :value="purok">{{ purok }}</option>
                                                </select>
                                            </label>
                                            <label v-if="getFloodProneAreaZoneOptions(area.purok).length">
                                                <span>Zone</span>
                                                <select v-model="area.zone" required>
                                                    <option value="" disabled>Select Zone</option>
                                                    <option v-for="zone in getFloodProneAreaZoneOptions(area.purok)" :key="zone" :value="zone">{{ zone }}</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <label><span>Available Evacuation Centers (comma separated)</span><input v-model="disasterAdvisoryForm.evacuationCenters" type="text" placeholder="Barangay Hall, Covered Court"></label>
                                    <label><span>Advisory Message</span><textarea v-model="disasterAdvisoryForm.advisoryMessage" rows="4" required placeholder="Safety reminders and evacuation instructions"></textarea></label>
                                    <label><span>Status</span>
                                        <select v-model="disasterAdvisoryForm.status">
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </label>
                                    <button class="primary-button" type="submit" :disabled="isSubmitting">
                                        <i class="fa-solid fa-floppy-disk"></i> {{ disasterAdvisoryForm._id ? 'Update Advisory' : 'Create Advisory' }}
                                    </button>
                                </form>
                            </article>
                            <article class="content-card" style="padding:16px;">
                                <label><span>Filter by Status</span>
                                    <select v-model="disasterFilterStatus">
                                        <option value="all">All</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                </label>
                                <div style="margin-top:10px; display:grid; gap:8px;">
                                    <article v-for="advisory in filteredDisasterIncidents" :key="advisory._id" class="record-item" style="padding:12px;">
                                        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
                                            <strong>{{ normalizeLabel(advisory.disasterType) }}</strong>
                                            <StatusBadge :status="advisory.status" />
                                        </div>
                                        <div class="fine-print" style="margin-top:4px;">Impact Date: {{ formatDate(advisory.expectedImpactDate) }}</div>
                                        <div class="fine-print">Severity: {{ normalizeLabel(advisory.severity) }}</div>
                                        <p style="margin:8px 0 0;">{{ advisory.advisoryMessage }}</p>
                                        <small class="fine-print" style="display:block; margin-top:8px;">Flood-Prone Areas: {{ advisory.floodProneAreas?.join(', ') || 'N/A' }}</small>
                                        <small class="fine-print" style="display:block;">Evacuation Centers: {{ advisory.evacuationCenters?.join(', ') || 'N/A' }}</small>
                                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                                            <button class="ghost-button" type="button" @click="editDisasterAdvisory(advisory)"><i class="fa-solid fa-pen"></i> Edit</button>
                                            <button class="ghost-button" type="button" @click="deleteDisasterAdvisory(advisory._id)"><i class="fa-solid fa-trash"></i> Delete</button>
                                            <button class="ghost-button" type="button" @click="markDisasterAdvisoryStatus(advisory, 'ended')"><i class="fa-solid fa-check"></i> Mark Ended</button>
                                        </div>
                                    </article>
                                    <div v-if="!filteredDisasterIncidents.length" class="fine-print">No advisories found.</div>
                                </div>
                            </article>
                        </div>
                    </article>
                </div>
            </section>
            <!-- Data Table Generic Loop For Other Views -->
            <section class="app-view" :class="{ active: ['reservations', 'reports', 'announcements', 'residents', 'documents'].includes(currentView) }">
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

                                
                                

                                <button v-if="currentView === 'announcements'" class="primary-button" @click="openModal('announcement', {})"><i class="fa-solid fa-plus"></i> Add Announcement</button>
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr v-if="currentView === 'residents'">
                                    <th scope="col">Photo</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Address</th>
                                    <th scope="col">Account Status</th>
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
                                <tr v-if="currentView === 'documents'">
                                    <th scope="col">Date</th>
                                    <th scope="col">Requester</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Purpose</th>
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
                                <template v-if="isDataLoading && (!currentList || currentList.length === 0)">
                                    <tr v-for="i in 5" :key="'skel-main-' + i" class="table-row">
                                        <td colspan="5">
                                            <div style="display: flex; gap: 20px; align-items: center;">
                                                <SkeletonLoader type="text" width="25%" style="margin: 0;" />
                                                <SkeletonLoader type="text" width="35%" style="margin: 0;" />
                                                <SkeletonLoader type="text" width="15%" style="margin: 0;" />
                                                <SkeletonLoader type="button" width="80px" style="margin: 0;" />
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                                <tr v-for="item in currentList" :key="item._id" class="table-row hoverable">
                                    <td v-if="currentView === 'residents'">
                                        <div class="table-avatar resident-table-avatar" :style="item.profileImage ? { backgroundImage: `url(${item.profileImage})` } : {}">
                                            <span v-if="!item.profileImage">{{ getResidentInitials(item) }}</span>
                                        </div>
                                    </td>
                                    <td v-if="currentView === 'residents'"><strong>{{ item.firstName }} {{ item.lastName }}</strong></td>
                                    <td v-if="currentView === 'residents'">{{ item.address }}</td>
                                    <td v-if="currentView === 'residents'"><StatusBadge :status="item.userId?.accountStatus || 'pending'" /></td>
                                    <td v-if="currentView === 'residents'">
                                        <button class="icon-button" @click="openModal('resident', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>

                                    


                                    <td v-if="currentView === 'reservations'"><strong>{{ normalizeLabel(item.facilityName) }}</strong><br><small>{{ formatDate(item.reservationDate) }} ({{ item.startTime }} - {{ item.endTime }})</small><br><small v-if="isInventoryReservation(item)">Quantity: {{ item.quantity || item.chairQuantity || item.tentQuantity || item.tableQuantity || 0 }}</small><small v-else>Time-slot reservation</small></td>
                                    <td v-if="currentView === 'reservations'">{{ getRequestorName(item) }}</td>
                                    <td v-if="currentView === 'reservations'">{{ item.purpose }}</td>
                                    <td v-if="currentView === 'reservations'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'reservations'">
                                        <button class="icon-button" @click="openModal('reservation', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>

                                    <td v-if="currentView === 'reports'"><strong>{{ item.title }}</strong><br><small>{{ formatDate(item.incidentDate) }}</small></td>
                                    <td v-if="currentView === 'documents'"><strong>{{ formatDate(item.createdAt) }}</strong></td>
                                    <td v-if="currentView === 'documents'">{{ getDocumentRequesterName(item) }}</td>
                                    <td v-if="currentView === 'documents'">{{ (item.type || '').replaceAll('_',' ') }}</td>
                                    <td v-if="currentView === 'documents'">{{ item.purpose || item.fields?.PURPOSE || '-' }}</td>
                                    <td v-if="currentView === 'documents'"><StatusBadge :status="item.status" /></td>
                                    <td v-if="currentView === 'documents'">
                                        <button class="icon-button" @click="openModal('document', item)"><i class="fa-solid fa-eye"></i> View</button>
                                    </td>
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
                                    <template v-if="isDataLoading && (!appointments || appointments.length === 0)">
                                        <tr v-for="i in 5" :key="'skel-apt-' + i" class="table-row">
                                            <td colspan="5">
                                                <div style="display: flex; gap: 20px; align-items: center;">
                                                    <SkeletonLoader type="text" width="25%" style="margin: 0;" />
                                                    <SkeletonLoader type="text" width="35%" style="margin: 0;" />
                                                    <SkeletonLoader type="text" width="15%" style="margin: 0;" />
                                                    <SkeletonLoader type="button" width="80px" style="margin: 0;" />
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
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
                                    <template v-if="isDataLoading && (!officials || officials.length === 0)">
                                        <tr v-for="i in 5" :key="'skel-off-' + i" class="table-row">
                                            <td colspan="6">
                                                <div style="display: flex; gap: 20px; align-items: center;">
                                                    <SkeletonLoader type="avatar" style="margin: 0;" />
                                                    <SkeletonLoader type="text" width="30%" style="margin: 0;" />
                                                    <SkeletonLoader type="text" width="20%" style="margin: 0;" />
                                                    <SkeletonLoader type="button" width="80px" style="margin: 0;" />
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
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
            <div class="admin-modal" :class="{ 'admin-modal-wide': activeModal === 'resident' || activeModal === 'document' || activeModal === 'report' }">
                <button class="admin-modal-close" @click="activeModal = null"><i class="fa-solid fa-xmark"></i></button>

                <div v-if="activeModal === 'resident'">
                    <h2><i class="fa-solid fa-users-viewfinder"></i> Resident Overview Dashboard</h2>
                    <p class="fine-print">Complete resident information, verification workflow, and service history.</p>
                    <div class="resident-overview-layout">
                        <aside class="resident-identity-card" aria-label="Resident identity">
                            <div class="resident-avatar">
                                <img v-if="selectedItem.profileImage" :src="selectedItem.profileImage" alt="Resident avatar">
                                <span v-else>{{ getResidentInitials(selectedItem) }}</span>
                            </div>
                            <h3>{{ getFullResidentName(selectedItem) }}</h3>
                            <p class="fine-print">Resident ID: {{ residentSystemId(selectedItem) }}</p>
                            <StatusBadge :status="selectedItem.userId?.accountStatus || 'pending_approval'" />
                            <p class="fine-print"><strong>Verification:</strong> {{ formatVerificationStatus(selectedItem.verificationStatus) }}</p>
                            <div class="resident-tags">
                                <span v-for="tag in residentVulnerabilityTags(selectedItem)" :key="tag" class="resident-tag">{{ tag }}</span>
                            </div>
                            <div class="resident-meta-list">
                                <small>Registered: {{ formatDate(selectedItem.createdAt) }}</small>
                                <small>Last Activity: {{ formatDate(selectedItem.updatedAt || selectedItem.createdAt) }}</small>
                            </div>
                            <div class="resident-quick-actions">
                                <button v-if="canApproveRejectResident" type="button" class="primary-button" @click="setResidentStatusAndSave('approved')"><i class="fa-solid fa-circle-check"></i> Approve</button>
                                <button v-if="canApproveRejectResident" type="button" class="ghost-button" @click="setResidentStatusAndSave('rejected')"><i class="fa-solid fa-circle-xmark"></i> Reject</button>
                                <button v-if="canSuspendResident" type="button" class="ghost-button" @click="setResidentStatusAndSave('suspended')"><i class="fa-solid fa-user-lock"></i> Suspend</button>
                                <button v-if="canArchiveResident" type="button" class="ghost-button" @click="setResidentStatusAndSave('archived')"><i class="fa-solid fa-box-archive"></i> Archive</button>
                            </div>
                        </aside>
                        <section class="resident-center-pane">
                            <div class="resident-tab-nav">
                                <button type="button" :class="{ active: residentTab === 'personal' }" @click="residentTab = 'personal'"><i class="fa-solid fa-id-card"></i> Personal Information</button>
                                <button type="button" :class="{ active: residentTab === 'activity' }" @click="residentTab = 'activity'"><i class="fa-solid fa-timeline"></i> Activity History</button>
                                <button type="button" :class="{ active: residentTab === 'transactions' }" @click="residentTab = 'transactions'"><i class="fa-solid fa-receipt"></i> Requests & Transactions</button>
                            </div>
                            <div class="resident-tab-content" v-if="residentTab === 'personal'">
                                <div class="resident-info-grid">
                                    <p><strong>Full Name:</strong> {{ getFullResidentName(selectedItem) }}</p>
                                    <p><strong>Suffix:</strong> {{ selectedItem.suffix || 'N/A' }}</p>
                                    <p><strong>Birthdate / Age:</strong> {{ formatDate(selectedItem.birthDate) }} ({{ calculateAge(selectedItem.birthDate) }})</p>
                                    <p><strong>Sex:</strong> {{ selectedItem.sex || 'N/A' }}</p>
                                    <p><strong>Civil Status:</strong> {{ selectedItem.civilStatus || 'N/A' }}</p>
                                    <p><strong>Citizenship:</strong> {{ selectedItem.citizenship || 'N/A' }}</p>
                                    <p><strong>Occupation:</strong> {{ selectedItem.occupation || 'N/A' }}</p>
                                    <p><strong>Contact Number:</strong> {{ selectedItem.contactNumber || 'N/A' }}</p>
                                    <p><strong>Email:</strong> {{ selectedItem.email || selectedItem.userId?.email || 'N/A' }}</p>
                                    <p><strong>Address:</strong> {{ selectedItem.address || 'N/A' }}</p>
                                    <p><strong>Purok/Zone:</strong> {{ formatPurokZone(selectedItem) }}</p>
                                </div>
                                <section class="resident-proof-panel">
                                    <div class="resident-proof-head">
                                        <div>
                                            <strong>Proof of Residency</strong>
                                            <p class="fine-print">{{ residentProofLabel(selectedItem) }}</p>
                                        </div>
                                        <button
                                            v-if="residentProofPreview.url"
                                            type="button"
                                            class="ghost-button table-action"
                                            @click="openResidentProofPreview"
                                        >
                                            <i class="fa-solid fa-up-right-from-square"></i> Open
                                        </button>
                                    </div>
                                    <div v-if="residentProofPreview.loading" class="resident-proof-state">Loading proof of residency...</div>
                                    <div v-else-if="residentProofPreview.error" class="resident-proof-state is-error">{{ residentProofPreview.error }}</div>
                                    <button
                                        v-else-if="residentProofPreview.url && residentProofPreview.isImage"
                                        type="button"
                                        class="resident-proof-image-button"
                                        @click="openResidentProofPreview"
                                    >
                                        <img :src="residentProofPreview.url" :alt="residentProofLabel(selectedItem)">
                                    </button>
                                    <div v-else-if="residentProofPreview.url" class="resident-proof-file">
                                        <i class="fa-solid fa-file"></i>
                                        <span>Proof file is ready to open.</span>
                                    </div>
                                    <div v-else class="resident-proof-state">No proof of residency uploaded.</div>
                                </section>
                            </div>
                            <div class="resident-tab-content" v-else-if="residentTab === 'activity'">
                                <div class="resident-timeline">
                                    <div class="resident-timeline-item" v-for="item in residentActivityTimeline(selectedItem)" :key="item.key">
                                        <div class="dot"></div>
                                        <div><strong>{{ item.label }}</strong><small>{{ item.time }}</small></div>
                                    </div>
                                </div>
                            </div>
                            <div class="resident-tab-content" v-else-if="residentTab === 'transactions'">
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead><tr><th>Type</th><th>Status</th><th>Date Submitted</th><th>Stage</th></tr></thead>
                                        <tbody>
                                            <tr v-for="entry in residentTransactions(selectedItem)" :key="entry.key">
                                                <td>{{ entry.type }}</td>
                                                <td><StatusBadge :status="entry.status" /></td>
                                                <td>{{ entry.date }}</td>
                                                <td>{{ entry.stage }}</td>
                                            </tr>
                                            <tr v-if="residentTransactions(selectedItem).length === 0"><td colspan="4" style="text-align:center;">No transactions yet.</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div class="resident-bottom-panels">
                        <article class="content-card">
                            <h4><i class="fa-solid fa-tags"></i> Resident Tags</h4>
                            <div class="resident-tags"><span class="resident-tag" v-for="tag in residentAutoTags(selectedItem)" :key="tag">{{ tag }}</span></div>
                        </article>
                    </div>
                </div>

                <div v-if="['reservation', 'report', 'appointment'].includes(activeModal)">
                    <h2><i class="fa-solid fa-eye"></i>
                        {{ activeModal === 'report' ? 'View Report' : activeModal === 'reservation' ? 'View Reservation' : 'View Appointment' }}
                    </h2>
                    <p class="fine-print">{{ activeModal === 'report' ? 'Review complete report details, then apply a status action.' : activeModal === 'reservation' ? 'Review reservation details and manage the booking.' : 'Review appointment details and manage scheduling.' }}</p>

                    <div v-if="['reservation', 'appointment'].includes(activeModal)" class="stack" style="background: linear-gradient(180deg,#fbfffc,#f7fbf8); padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 15px 0 0 0; box-shadow: 0 6px 18px rgba(13,74,42,0.03);">
                        <p v-for="detail in getRequestDetails(selectedItem)" :key="detail.label" v-show="detail.value">
                            <strong>{{ detail.label }}:</strong> {{ detail.value }}
                        </p>
                    </div>

                    <div v-if="activeModal === 'report'" class="report-modal-grid">
                        <div class="report-modal-left">
                            <div class="stack report-details-card">
                                <p v-for="detail in getRequestDetails(selectedItem)" :key="detail.label" v-show="detail.value">
                                    <strong>{{ detail.label }}:</strong> {{ detail.value }}
                                </p>
                            </div>
                        </div>

                        <div class="report-modal-right">
                            <div v-if="selectedItem.locationCoordinates?.latitude && selectedItem.locationCoordinates?.longitude" class="report-side-card">
                                <strong class="report-side-title">Pinned Location</strong>
                                <p class="report-side-coordinates">{{ selectedItem.locationCoordinates.latitude }}, {{ selectedItem.locationCoordinates.longitude }}</p>
                                <iframe
                                    :src="getReportMapEmbedUrl(selectedItem)"
                                    title="Report location map"
                                    class="report-map-frame"
                                    loading="lazy"
                                    referrerpolicy="no-referrer-when-downgrade"
                                ></iframe>
                                <button type="button" class="ghost-button report-map-link" @click="openLocationPreview(selectedItem)">
                                    <i class="fa-solid fa-location-dot"></i>
                                    View location in system
                                </button>
                            </div>

                            <div v-if="Array.isArray(selectedItem.proofFiles) && selectedItem.proofFiles.length" class="report-side-card">
                                <strong class="report-side-title">Proof Images</strong>
                                <div class="proof-preview-grid">
                                    <div
                                        v-for="proofPath in selectedItem.proofFiles"
                                        :key="proofPath"
                                        class="proof-preview-card proof-preview-button"
                                        role="button"
                                        tabindex="0"
                                        @click="openProofPreview(proofPath)"
                                        @keydown.enter.prevent="openProofPreview(proofPath)"
                                        @keydown.space.prevent="openProofPreview(proofPath)">
                                        <img
                                            :src="resolveProofImageUrl(proofPath)"
                                            :alt="getProofImageLabel(proofPath)"
                                            class="proof-preview-image"
                                        >
                                        <span class="proof-preview-label">{{ getProofImageLabel(proofPath) }}</span>
                                    </div>
                                </div>
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
                            :entityType="activeModal === 'reservation' ? 'facilityReservation' : activeModal === 'appointment' ? 'appointment' : 'report'"
                            :currentStatus="selectedItem.status"
                            :loading="isSubmitting"
                            @action-triggered="handleStatusAction"
                        />
                    </div>
                </div>

                <div v-if="activeModal === 'document'">
                    <h2><i class="fa-solid fa-file-lines"></i> View Document Request</h2>
                    <p class="fine-print">Review complete document request details and process the document generation.</p>
                    
                    <div style="display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.85fr); gap: 24px; align-items: start; margin-top: 15px;">
                        <!-- Left Pane: Details -->
                        <div style="display: grid; gap: 12px;">
                            <div class="stack" style="background: linear-gradient(180deg,#fbfffc,#f7fbf8); padding: 15px; border-radius: 6px; border-left: 3px solid var(--accent); margin: 0; box-shadow: 0 6px 18px rgba(13,74,42,0.03);">
                                <p v-for="detail in getRequestDetails(selectedItem)" :key="detail.label" v-show="detail.value">
                                    <strong>{{ detail.label }}:</strong> {{ detail.value }}
                                </p>
                            </div>

                            <div v-if="Array.isArray(selectedItem.proofFiles) && selectedItem.proofFiles.length" style="padding: 12px; border: 1px solid #dce6e1; border-radius: 8px; background: #fcfefe;">
                                <strong style="display: block; margin-bottom: 10px;">Proof Images</strong>
                                <div class="proof-preview-grid">
                                    <div
                                        v-for="proofPath in selectedItem.proofFiles"
                                        :key="proofPath"
                                        class="proof-preview-card">
                                        <img
                                            :src="resolveProofImageUrl(proofPath)"
                                            :alt="getProofImageLabel(proofPath)"
                                            class="proof-preview-image"
                                        >
                                        <span class="proof-preview-label">{{ getProofImageLabel(proofPath) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Pane: Management & Status -->
                        <div style="display: grid; gap: 12px;">
                            <div v-if="isDocumentProcessing(selectedItem)" style="padding:16px; border:1px solid rgba(13,74,42,0.06); border-radius:8px; background: linear-gradient(180deg,#fbfffc,#f3f8f6); box-shadow: 0 6px 18px rgba(13,74,42,0.03);">
                                <h3 style="margin:0 0 12px 0; color: #0f3f33;">Document Management</h3>
                                <div class="stack" style="gap: 12px;">
                                    <label><span>Formal Purpose (admin)</span><input v-model="formalPurposeInput" type="text" style="width: 100%;"></label>

                                    <div style="display:grid; grid-template-columns: 1fr; gap:12px;">
                                        <label><span>Full name</span><input v-model="editableFields.FULL_NAME" type="text" style="width: 100%;"></label>
                                        <label><span>Age</span><input v-model="editableFields.AGE" type="text" style="width: 100%;"></label>
                                        <label><span>Barangay</span><input v-model="editableFields.BARANGAY" type="text" style="width: 100%;"></label>
                                        <label><span>City</span><input v-model="editableFields.CITY" type="text" style="width: 100%;"></label>
                                        <label><span>Purpose</span><input v-model="editableFields.PURPOSE" type="text" style="width: 100%;"></label>
                                    </div>

                                    <div style="display:flex; gap:8px; flex-direction: column;">
                                        <button type="button" class="primary-button" @click="saveDocumentEdits" :disabled="isSubmitting" style="width: 100%;">
                                            <i class="fa-solid fa-save"></i> {{ isSubmitting ? 'Saving...' : 'Save Edits' }}
                                        </button>
                                        <div style="display: grid; gap: 8px;">
                                            <button type="button" class="primary-button" @click="generateAndSavePdf(selectedItem)" :disabled="previewLoading || isSubmitting" style="width: 100%; background: #2c3e50;">
                                                <i class="fa-solid fa-file-pdf"></i> {{ previewLoading ? 'Generating...' : 'Generate PDF' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="isDocumentRejected(selectedItem)" style="padding:12px; border:1px solid #f1caca; border-radius:8px; background:#fff7f7; color:#7a1d1d;">
                                This document request has been rejected.
                            </div>

                            <div v-if="isDocumentReady(selectedItem) || isDocumentCompleted(selectedItem)" style="padding:12px; border:1px solid #dce6e1; border-radius:8px; background:#f7fbf9; color:#2d5f45;">
                                PDF has already been generated and marked ready.
                            </div>

                            <!-- Status display and action buttons -->
                            <div style="padding:16px; border:1px solid rgba(13,74,42,0.06); border-radius:8px; background: linear-gradient(180deg,#f7fbf8,#f3f8f6);">
                                <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 600; color: #333;">Status:</span>
                                    <StatusBadge :status="selectedItem.status" />
                                    <span style="text-transform: capitalize; color: #2d5f45; font-weight: 700;">{{ selectedItem.status }}</span>
                                </div>

                                <StatusActionButtons
                                    entityType="documentRequest"
                                    :currentStatus="selectedItem.status"
                                    :loading="isSubmitting"
                                    @action-triggered="handleStatusAction"
                                />
                            </div>
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

        <!-- Custom Confirmation Dialog -->
        <div v-if="showConfirmDialog" class="confirm-dialog-backdrop" @click.self="cancelConfirm">
            <div class="confirm-dialog">
                <p class="confirm-message">{{ confirmMessage }}</p>
                <div class="confirm-actions">
                    <button type="button" class="ghost-button" @click="cancelConfirm">Cancel</button>
                    <button type="button" class="primary-button" @click="confirmAction" :disabled="isConfirmSubmitting">
                        <i v-if="isConfirmSubmitting" class="fa-solid fa-spinner fa-spin"></i>
                        {{ isConfirmSubmitting ? 'Confirming...' : 'Confirm' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Preview loading modal -->
        <div v-if="previewLoading" class="preview-loading-overlay">
            <div class="preview-loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <div style="margin-top: 12px; font-weight: 600;">Generating PDF...</div>
                <div style="margin-top: 6px; color: #666; font-size: 0.95rem;">Preparing the certificate and opening it when ready.</div>
            </div>
        </div>
        <div v-if="residentModalLoading" class="preview-loading-overlay">
            <div class="preview-loading-box">
                <div class="spinner" aria-hidden="true"></div>
                <div style="margin-top: 12px; font-weight: 600;">Loading resident profile...</div>
                <div style="margin-top: 6px; color: #666; font-size: 0.95rem;">Preparing full resident details for review.</div>
            </div>
        </div>
        <div v-if="recordPreview.open" class="record-preview-overlay" @click.self="closeRecordPreview">
            <div class="record-preview-modal" :class="{ 'record-preview-map': recordPreview.type === 'map' }">
                <button type="button" class="record-preview-close" @click="closeRecordPreview" aria-label="Close preview">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <h3 class="record-preview-title">{{ recordPreview.title }}</h3>
                <img
                    v-if="recordPreview.type === 'image'"
                    :src="recordPreview.src"
                    :alt="recordPreview.alt"
                    class="record-preview-image"
                >
                <iframe
                    v-else
                    :src="recordPreview.src"
                    title="Pinned location preview"
                    class="record-preview-map-frame"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import StatusActionButtons from '@/components/StatusActionButtons.vue';
import StatusActionModal from '@/components/StatusActionModal.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { apiFetch, formatDate, getAuth } from '@/shared/client';
import { useAdminAuth } from '@/composables/useAdminAuth';
import { useAdminData } from '@/composables/useAdminData';
import { useAnnouncements } from '@/composables/useAnnouncements';
import { useAppointments } from '@/composables/useAppointments';
import { useResidents } from '@/composables/useResidents';
import { useReportNotifications } from '@/composables/useReportNotifications';

// Composables
const { isAuthenticated, user, loginForm, loginStatus, loginError, loginLoading, initializing, loginAdmin, logout, initSession } = useAdminAuth();

const texts = {
    admin: {
        initializing: 'Initializing admin session...',
        login: {
            heading: 'Administrator Login',
            sub: 'Sign in to manage the barangay portal',
            username: 'Username',
            password: 'Password',
            signingIn: 'Signing in...',
            login: 'Log In'
        },
        sidebar: {
            dashboard: 'Dashboard',
            announcements: 'Announcements',
            residents: 'Residents',
            appointments: 'Appointments',
            officials: 'Officials',
            facilities: 'Facilities',
            reports: 'Reports',
            documents: 'Documents',
            disaster: 'Disaster Management',
            smsLogs: 'SMS Logs',
            logout: 'Log Out'
        }
    }
};

const confirmLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        logout();
    }
};

const { residents, documentRequests, reservations, reports, appointments, officials, announcements, disasterIncidents, dashboardStatus, dashboardError, isDataLoading, msg, loadAll } = useAdminData();
const { announcementForm, announcementImageFile, nextDisplayOrder, nextDisplayOrderLoading, fetchNextDisplayOrder, saveAnnouncement, deleteAnnouncement, onImageUpload: onAnnouncementImageUpload } = useAnnouncements();
const { approveAppointment, rejectAppointment, completeAppointment, adminCancelAppointment } = useAppointments();
const { residentSearch, filteredResidents, calculateAge, saveResidentStatus } = useResidents(residents);
const { unreadReports, startNotificationPolling, stopNotificationPolling, clearUnreadReports, stopAlertSound } = useReportNotifications();
// Local state
const sidebarOpen = ref(false);
const showAdminPassword = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const validAdminViews = new Set(['dashboard', 'announcements', 'residents', 'appointments', 'officials', 'reservations', 'reports', 'documents', 'disaster', 'sms-logs']);
const hashView = (() => {
    try {
        const matched = globalThis.location.hash.match(/view=([a-z-]+)/i);
        return matched ? decodeURIComponent(matched[1]) : null;
    } catch (error) {
        return null;
    }
})();
const savedAdminView = localStorage.getItem('admin_current_view');
let initialAdminView;
if (validAdminViews.has(hashView)) {
    initialAdminView = hashView;
} else if (validAdminViews.has(savedAdminView)) {
    initialAdminView = savedAdminView;
} else {
    initialAdminView = 'dashboard';
}
const currentView = ref(initialAdminView);
const selectedDashboardCard = ref('reports');
const analyticsRange = ref('monthly');
const activeModal = ref(null);
const residentModalLoading = ref(false);
const confirmingAction = ref(null);
const officialPictureFile = ref(null);
const officialPicturePreview = ref('');
const isSubmitting = ref(false);
const previewLoading = ref(false);
const recordPreview = reactive({
    open: false,
    type: '',
    title: '',
    src: '',
    alt: ''
});
const residentProofPreview = reactive({
    url: '',
    isImage: false,
    loading: false,
    error: ''
});
const hoveredTrendIndex = ref(null);
const setHoveredTrendIndex = (index) => {
    hoveredTrendIndex.value = index;
};
const clearHoveredTrendIndex = () => {
    hoveredTrendIndex.value = null;
};
const reportAlertVisible = ref(false);
const reportAlertBusy = ref(false);
const reportAlertReports = ref([]);
// Persist view state on change
watch(currentView, (newView) => {
    localStorage.setItem('admin_current_view', newView);
    try {
        globalThis.history.replaceState(null, '', `#view=${encodeURIComponent(newView)}`);
    } catch (error) {
        globalThis.location.hash = `view=${encodeURIComponent(newView)}`;
    }
});

const syncViewFromHash = () => {
    try {
        const matched = globalThis.location.hash.match(/view=([a-z-]+)/i);
        const hashValue = matched ? decodeURIComponent(matched[1]) : null;
        if (hashValue && validAdminViews.has(hashValue) && hashValue !== currentView.value) {
            currentView.value = hashValue;
        }
    } catch (error) {
        // Ignore malformed hashes.
    }
};
const selectedItem = ref({});
const editForm = reactive({});
const formalPurposeInput = ref('');
const documentSearch = ref('');
const editableFields = reactive({ FULL_NAME: '', AGE: '', BARANGAY: '', CITY: '', PURPOSE: '', DAY: '', MONTH: '' });


// SMS Logs State
const smsLogs = ref([]);
const smsLogsLoading = ref(false);
const smsFilterType = ref('');
const smsCurrentPage = ref(1);
const smsPagination = ref(null);
const residentTab = ref('personal');
const residentAccountStatus = computed(() => selectedItem.value?.userId?.accountStatus || editForm.status || 'pending_approval');
const canApproveRejectResident = computed(() => !['approved', 'rejected'].includes(residentAccountStatus.value));
const canSuspendResident = computed(() => residentAccountStatus.value === 'approved');
const canArchiveResident = computed(() => ['rejected', 'suspended'].includes(residentAccountStatus.value));
const disasterFilterStatus = ref('all');
const disasterPurokOptions = ['Magsasaka', 'Sampalok', 'Masagana', 'Acacia', 'Freedom', 'Visapa'];
const disasterZoneOptionsByPurok = {
    Sampalok: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'],
    Acacia: Array.from({ length: 10 }, (_, index) => `Zone ${index + 5}`)
};

let disasterFloodAreaRowId = 0;

const createFloodProneAreaRow = (entry = {}) => ({
    id: ++disasterFloodAreaRowId,
    purok: entry.purok || '',
    zone: entry.zone || ''
});

const parseFloodProneAreaEntry = (value) => {
    const text = String(value || '').trim();
    if (!text) return createFloodProneAreaRow();

    const match = text.match(/^(?:\d+\.\s*)?([^,-]+?)(?:\s*[-,]\s*(Zone\s*\d+))?$/i);
    if (!match) return createFloodProneAreaRow({ purok: text });

    return createFloodProneAreaRow({
        purok: match[1].trim(),
        zone: match[2] ? match[2].replace(/\s+/g, ' ').trim() : ''
    });
};

const getFloodProneAreaZoneOptions = (purok) => disasterZoneOptionsByPurok[purok] || [];

const addFloodProneAreaRow = () => {
    disasterFloodAreaRows.value.push(createFloodProneAreaRow());
};

const removeFloodProneAreaRow = (index) => {
    if (disasterFloodAreaRows.value.length === 1) {
        disasterFloodAreaRows.value = [createFloodProneAreaRow()];
        return;
    }

    disasterFloodAreaRows.value.splice(index, 1);
};

const formatFloodProneAreaRow = (row, index) => {
    const parts = [row.purok, row.zone].filter(Boolean);
    return `${index + 1}. ${parts.join(' - ')}`.trim();
};

const normalizeFloodProneAreaRows = (entries) => {
    const rows = Array.isArray(entries) && entries.length
        ? entries.map((entry) => parseFloodProneAreaEntry(entry))
        : [createFloodProneAreaRow()];

    return rows.map((row) => {
        if (!row.purok) return row;
        row.zone = getFloodProneAreaZoneOptions(row.purok).includes(row.zone) ? row.zone : '';
        return row;
    });
};

const disasterAdvisoryForm = reactive({
    _id: '',
    disasterType: 'typhoon',
    expectedImpactDate: '',
    severity: 'medium',
    evacuationCenters: '',
    advisoryMessage: '',
    status: 'upcoming'
});
const disasterFloodAreaRows = ref([createFloodProneAreaRow()]);

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
    reservations: 'Facility Reservations',
    reports: 'Resident Reports',
    disaster: 'Disaster Management',
    'sms-logs': 'SMS Logs'
    ,
    'documents': 'Document Requests'
}[currentView.value]));

const pendingWorkload = computed(() => pendingCounts.value.reserves + pendingCounts.value.reports + pendingCounts.value.appointments);
const totalResidentsCount = computed(() => residents.value.length);
const approvedResidentsCount = computed(() => residents.value.filter((resident) => resident.userId?.accountStatus === 'approved').length);
const activeAnnouncementsCount = computed(() => announcements.value.filter((announcement) => announcement.isActive !== false).length);

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
        caption: `${pendingWorkload.value} in queue`,
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

const disasterSummary = computed(() => {
    return disasterIncidents.value.reduce((summary, advisory) => {
        summary.total += 1;
        if (advisory.status === 'upcoming') summary.upcoming += 1;
        if (advisory.status === 'ongoing') summary.ongoing += 1;
        if (advisory.status === 'ended') summary.ended += 1;
        return summary;
    }, {
        total: 0,
        upcoming: 0,
        ongoing: 0,
        ended: 0
    });
});

const normalizeLabel = (value) => {
    if (!value) return 'Unspecified';
    return String(value)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const INVENTORY_FACILITY_NAMES = new Set(['chair', 'tent']);

const isInventoryReservation = (reservation) => INVENTORY_FACILITY_NAMES.has(String(reservation?.facilityName || '').trim());

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
                tooltip: date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
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
                tooltip: `Week of ${start.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
                matches: (recordDate) => recordDate >= start && recordDate <= end
            };
        });
    }

    if (range === 'yearly') {
        return Array.from({ length: 4 }, (_, index) => {
            const year = now.getFullYear() - (3 - index);
            return {
                label: String(year),
                tooltip: String(year),
                matches: (recordDate) => recordDate.getFullYear() === year
            };
        });
    }

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return {
            label: date.toLocaleDateString([], { month: 'short' }),
            tooltip: date.toLocaleDateString([], { month: 'long', year: 'numeric' }),
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
                { label: 'Citizen Reports', value: pendingCounts.value.reports, detail: 'Operational review' },
                { label: 'Scheduled Appointments', value: pendingCounts.value.appointments, detail: 'Waiting confirmation' }
            ],
            insights: [
                { label: 'Queue Pressure', value: pendingWorkload.value ? 'Active' : 'Clear', detail: 'Current workload state' },
                { label: 'Top Queue', value: buildDistribution(pendingRecords, (record) => record.queueType)[0]?.label || 'None', detail: 'Largest pending category' },
                { label: 'Awaiting Review', value: `${pendingCounts.value.reports}`, detail: 'Report action pending' }
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

const analyticsLineDots = computed(() => {
    const rows = activeAnalyticsData.value?.trend || [];
    if (!rows.length) {
        return [];
    }
    const maxValue = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row, index) => {
        const x = rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100;
        const y = 14 + (1 - (row.value / maxValue)) * 70;
        return {
            key: `${row.label}-${index}`,
            x: Number(x.toFixed(2)),
            y: Number(y.toFixed(2))
        };
    });
});

const analyticsLinePath = computed(() => {
    const dots = analyticsLineDots.value;
    if (!dots.length) {
        return '';
    }
    if (dots.length === 1) {
        return `M ${dots[0].x} ${dots[0].y} L ${dots[0].x} ${dots[0].y}`;
    }
    const controls = dots.slice(1).map((dot, index) => {
        const prev = dots[index];
        const midX = (prev.x + dot.x) / 2;
        const midY = (prev.y + dot.y) / 2;
        return `Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }).join(' ');
    const last = dots[dots.length - 1];
    return `M ${dots[0].x} ${dots[0].y} ${controls} T ${last.x} ${last.y}`;
});

const analyticsAreaPath = computed(() => {
    if (!analyticsLinePath.value) {
        return '';
    }
    return `${analyticsLinePath.value} L 100 100 L 0 100 Z`;
});

const analyticsTooltip = computed(() => {
    const index = hoveredTrendIndex.value;
    const dots = analyticsLineDots.value;
    const trend = activeAnalyticsData.value?.trend?.[index];
    if (index === null || !dots[index] || !trend) {
        return null;
    }
    return {
        left: `${dots[index].x}%`,
        top: `${dots[index].y}%`,
        label: trend.label,
        value: trend.value,
        tooltip: trend.tooltip || trend.label
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
        { value: pendingCounts.value.reserves, color: '#257f49' },
        { value: pendingCounts.value.reports, color: '#a6782a' },
        { value: pendingCounts.value.appointments, color: '#2563eb' }
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
    const num = Number.parseInt(timeAgo);
    if (Number.isNaN(num)) return 0;
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

    const suffix = reportAlertReports.value.length > 2 ? '...' : '';
    return names
        ? `Latest reports: ${names}${suffix}`
        : 'Multiple reports are waiting for review.';
});

const resetDisasterAdvisoryForm = () => {
    disasterAdvisoryForm._id = '';
    disasterAdvisoryForm.disasterType = 'typhoon';
    disasterAdvisoryForm.expectedImpactDate = '';
    disasterAdvisoryForm.severity = 'medium';
    disasterAdvisoryForm.evacuationCenters = '';
    disasterAdvisoryForm.advisoryMessage = '';
    disasterAdvisoryForm.status = 'upcoming';
    disasterFloodAreaRows.value = [createFloodProneAreaRow()];
};

const splitByComma = (value) => String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const saveDisasterAdvisory = async () => {
    if (!disasterAdvisoryForm.expectedImpactDate || !disasterAdvisoryForm.advisoryMessage.trim()) {
        showToast('Expected impact date and advisory message are required.', true);
        return;
    }

    const payload = {
        disasterType: disasterAdvisoryForm.disasterType,
        expectedImpactDate: disasterAdvisoryForm.expectedImpactDate,
        severity: disasterAdvisoryForm.severity,
        floodProneAreas: disasterFloodAreaRows.value
            .filter((area) => area.purok)
            .map((area, index) => formatFloodProneAreaRow(area, index)),
        evacuationCenters: splitByComma(disasterAdvisoryForm.evacuationCenters),
        advisoryMessage: disasterAdvisoryForm.advisoryMessage.trim(),
        status: disasterAdvisoryForm.status
    };

    isSubmitting.value = true;
    try {
        if (disasterAdvisoryForm._id) {
            await apiFetch(`/disaster-advisories/${disasterAdvisoryForm._id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            showToast('Disaster advisory updated.');
        } else {
            await apiFetch('/disaster-advisories', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('Disaster advisory created.');
        }
        await loadAll();
        resetDisasterAdvisoryForm();
    } catch (error) {
        showToast(error.message || 'Failed to save disaster advisory.', true);
    } finally {
        isSubmitting.value = false;
    }
};

const editDisasterAdvisory = (advisory) => {
    disasterAdvisoryForm._id = advisory._id;
    disasterAdvisoryForm.disasterType = ['typhoon', 'flood', 'landslide'].includes(advisory.disasterType) ? advisory.disasterType : 'typhoon';
    disasterAdvisoryForm.expectedImpactDate = advisory.expectedImpactDate ? new Date(advisory.expectedImpactDate).toISOString().slice(0, 16) : '';
    disasterAdvisoryForm.severity = advisory.severity || 'medium';
    disasterFloodAreaRows.value = normalizeFloodProneAreaRows(advisory.floodProneAreas);
    disasterAdvisoryForm.evacuationCenters = Array.isArray(advisory.evacuationCenters) ? advisory.evacuationCenters.join(', ') : '';
    disasterAdvisoryForm.advisoryMessage = advisory.advisoryMessage || '';
    disasterAdvisoryForm.status = advisory.status || 'upcoming';
};

const deleteDisasterAdvisory = async (advisoryId) => {
    if (!advisoryId) return;
    if (!(await showConfirm('Delete this disaster advisory?'))) return;

    try {
        await apiFetch(`/disaster-advisories/${advisoryId}`, { method: 'DELETE' });
        showToast('Disaster advisory deleted.');
        await loadAll();
        if (disasterAdvisoryForm._id === advisoryId) {
            resetDisasterAdvisoryForm();
        }
    } catch (error) {
        showToast(error.message || 'Failed to delete disaster advisory.', true);
    }
};

const markDisasterAdvisoryStatus = async (advisory, status) => {
    if (!advisory?._id) return;
    try {
        await apiFetch(`/disaster-advisories/${advisory._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        showToast(`Advisory marked as ${status}.`);
        await loadAll();
    } catch (error) {
        showToast(error.message || 'Failed to update advisory status.', true);
    }
};

const currentList = computed(() => {
    switch (currentView.value) {
        case 'announcements': return announcements.value;
        case 'residents': return filteredResidents.value;
        case 'reservations': return [...reservations.value].sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate));
        case 'reports': return [...reports.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'documents': return [...(documentRequests.value || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

const getDocumentRequesterName = (item) => {
    const fieldName = item?.adminEdits?.FULL_NAME || item?.fields?.FULL_NAME || item?.fields?.full_name || '';
    if (String(fieldName).trim()) return String(fieldName).trim();

    if (item?.resident && typeof item.resident === 'object') {
        const fullName = [item.resident.firstName, item.resident.middleName, item.resident.lastName, item.resident.suffix].filter(Boolean).join(' ').trim();
        if (fullName) return fullName;
    }

    if (item?.residentId && typeof item.residentId === 'object') {
        const fullName = [item.residentId.firstName, item.residentId.middleName, item.residentId.lastName, item.residentId.suffix].filter(Boolean).join(' ').trim();
        if (fullName) return fullName;
    }

    return getRequestorName(item);
};

const normalizeStatus = (item) => String(item?.status || '').toLowerCase();
const isDocumentApproved = (item) => normalizeStatus(item) === 'approved';
const isDocumentPending = (item) => normalizeStatus(item) === 'pending';
const isDocumentProcessing = (item) => normalizeStatus(item) === 'processing';
const isDocumentRejected = (item) => normalizeStatus(item) === 'rejected';
const isDocumentReady = (item) => normalizeStatus(item) === 'ready_for_pickup';
const isDocumentCompleted = (item) => normalizeStatus(item) === 'completed';
const mergeDocumentResponse = (current, data = {}) => ({
    ...current,
    ...data,
    resident: typeof data.resident === 'object' && data.resident !== null ? data.resident : current?.resident,
    residentId: typeof data.residentId === 'object' && data.residentId !== null ? data.residentId : current?.residentId
});

const getReportMapEmbedUrl = (item) => {
    const latitude = item?.locationCoordinates?.latitude;
    const longitude = item?.locationCoordinates?.longitude;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return '';
    }

    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
};

const normalizeProofImagePath = (value) => {
    const rawValue = typeof value === 'string' ? value : value?.url || value?.path || value?.imagePath || '';

    if (!rawValue) {
        return '';
    }

    const normalized = String(rawValue).replaceAll('\\', '/').trim();

    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return normalized;
    }

    if (normalized.startsWith('/uploads/')) {
        return normalized;
    }

    if (normalized.startsWith('uploads/')) {
        return `/${normalized}`;
    }

    if (normalized.startsWith('/public/uploads/')) {
        return normalized.replace(/^\/public\//, '/');
    }

    if (normalized.startsWith('public/uploads/')) {
        return `/${normalized.replace(/^public\//, '')}`;
    }

    const filename = normalized.split('/').pop();
    if (!normalized.includes('/')) {
        return `/uploads/${normalized}`;
    }

    if (filename && filename !== normalized) {
        return `/uploads/${filename}`;
    }

    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const resolveProofImageUrl = (value) => normalizeProofImagePath(value);

const getProofImageLabel = (value) => {
    const rawValue = typeof value === 'string' ? value : value?.url || value?.path || value?.imagePath || '';

    if (!rawValue) {
        return 'Proof image';
    }

    const fileName = String(rawValue).replaceAll('\\', '/').split('/').pop();
    return fileName || 'Proof image';
};

const openProofPreview = (proofPath) => {
    const src = resolveProofImageUrl(proofPath);
    if (!src) return;

    recordPreview.type = 'image';
    recordPreview.title = 'Proof Image Preview';
    recordPreview.src = src;
    recordPreview.alt = getProofImageLabel(proofPath);
    recordPreview.open = true;
};

const clearResidentProofPreview = () => {
    if (residentProofPreview.url.startsWith('blob:')) {
        URL.revokeObjectURL(residentProofPreview.url);
    }

    residentProofPreview.url = '';
    residentProofPreview.isImage = false;
    residentProofPreview.loading = false;
    residentProofPreview.error = '';
};

const residentProofLabel = (resident) => getProofImageLabel(resident?.proofOfResidency || 'Proof of residency');

const loadResidentProofPreview = async (resident) => {
    clearResidentProofPreview();

    if (!resident?._id || !resident.proofOfResidency) {
        return;
    }

    residentProofPreview.loading = true;

    try {
        const auth = getAuth();
        const headers = auth.token ? { Authorization: `Bearer ${auth.token}` } : {};
        const response = await fetch(`/api/residents/${resident._id}/proof`, { headers });

        if (!response.ok) {
            throw new Error('Unable to load proof of residency.');
        }

        const blob = await response.blob();
        residentProofPreview.url = URL.createObjectURL(blob);
        residentProofPreview.isImage = blob.type.startsWith('image/');
    } catch (error) {
        residentProofPreview.error = error.message || 'Unable to load proof of residency.';
    } finally {
        residentProofPreview.loading = false;
    }
};

const openResidentProofPreview = () => {
    if (!residentProofPreview.url) return;

    if (residentProofPreview.isImage) {
        recordPreview.type = 'image';
        recordPreview.title = 'Proof of Residency';
        recordPreview.src = residentProofPreview.url;
        recordPreview.alt = residentProofLabel(selectedItem.value);
        recordPreview.open = true;
        return;
    }

    globalThis.open(residentProofPreview.url, '_blank', 'noopener,noreferrer');
};

const openLocationPreview = (item) => {
    const src = getReportMapEmbedUrl(item);
    if (!src) return;

    recordPreview.type = 'map';
    recordPreview.title = 'Pinned Location Preview';
    recordPreview.src = src;
    recordPreview.alt = 'Pinned location map';
    recordPreview.open = true;
};

const closeRecordPreview = () => {
    recordPreview.open = false;
    recordPreview.type = '';
    recordPreview.title = '';
    recordPreview.src = '';
    recordPreview.alt = '';
};

watch(activeModal, (modal) => {
    if (modal !== 'resident') {
        clearResidentProofPreview();
    }
});

const getRequestDetails = (item) => {
    if (activeModal.value === 'document') {
        return [
            { label: 'Requester', value: getDocumentRequesterName(item) },
            { label: 'Requester Type', value: 'Resident' },
            { label: 'Contact Number', value: item.contactNumber || item.resident?.contactNumber || item.residentId?.contactNumber },
            { label: 'Email', value: item.email || item.resident?.email || item.residentId?.email },
            { label: 'Address', value: item.address || item.resident?.address || item.residentId?.address },
            { label: 'Birth Date', value: item.resident?.birthDate ? formatDate(item.resident.birthDate) : item.residentId?.birthDate ? formatDate(item.residentId.birthDate) : 'N/A' },
            { label: 'Document Type', value: (item.documentType || item.type)?.replaceAll('_', ' ') },
            { label: 'Original Purpose', value: item.purpose },
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
            { label: 'Facility', value: normalizeLabel(item.facilityName) },
            { label: 'Reservation Date', value: formatDate(item.reservationDate) },
            { label: 'Time', value: `${item.startTime || 'N/A'} - ${item.endTime || 'N/A'}` },
            { label: isInventoryReservation(item) ? 'Quantity' : 'Reservation Type', value: isInventoryReservation(item) ? (item.quantity ?? item.chairQuantity ?? item.tentQuantity ?? item.tableQuantity ?? 0) : 'Time-slot reservation' },
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
        const officialName = item.officialId?.name || item.officialName || 'Unassigned official';
        const officialPosition = item.officialId?.position || item.officialPosition || '';
        const officialLabel = officialPosition ? `${officialName} (${officialPosition})` : officialName;

        return [
            { label: 'Requester', value: getRequestorName(item) },
            { label: 'Contact Number', value: item.contactNumber || item.residentId?.contactNumber },
            { label: 'Email', value: item.email || item.residentId?.email },
            { label: 'Address', value: item.address || item.residentId?.address },
            { label: 'Official', value: officialLabel },
            { label: 'Date', value: formatDate(item.appointmentDate) },
            { label: 'Time', value: `${item.timeSlot?.startTime || 'N/A'} - ${item.timeSlot?.endTime || 'N/A'}` },
            { label: 'Purpose', value: item.purpose },
            { label: 'Remarks', value: item.remarks },
            { label: 'Rejection Reason', value: item.rejectionReason },
            { label: 'Cancellation Reason', value: item.cancellationReason },
            { label: 'Requested On', value: formatDate(item.createdAt) }
        ];
    }

    return [];
};

// Modal and form handlers
const setupResidentModal = (item) => {
    editForm.status = item.userId?.accountStatus || 'pending_approval';
    residentTab.value = 'personal';
};

const setupRecordStatusModal = async (type, item) => {
    confirmingAction.value = null;

    if (!item || !item._id) return;

    try {
        let path = '';
        if (type === 'reservation') path = `/facility-reservations/${item._id}`;
        else if (type === 'report') path = `/reports/${item._id}`;
        else if (type === 'appointment') path = `/appointments/${item._id}`;
        else return;

        const full = await apiFetch(path);
        if (full) {
            selectedItem.value = { ...(full.data || full) };
        }
    } catch (err) {
        showToast(err.message || 'Failed to load details.', true);
    }
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
        residentModalLoading.value = true;
        try {
            const fullResident = item?._id ? await apiFetch(`/residents/${item._id}`) : item;
            selectedItem.value = { ...fullResident };
            setupResidentModal(selectedItem.value);
            activeModal.value = type;
            await loadResidentProofPreview(selectedItem.value);
        } catch (error) {
            showToast(error.message || 'Failed to load resident details.', true);
        } finally {
            residentModalLoading.value = false;
        }
        return;
    }

    if (['document', 'reservation', 'report', 'appointment'].includes(type)) {
        await setupRecordStatusModal(type, item);
        if (type === 'document') {
            const activeDocument = selectedItem.value || item || {};
            formalPurposeInput.value = activeDocument.formalPurpose || activeDocument.purpose || '';
            // populate editable fields from request fields and adminEdits
            const fields = activeDocument.fields || {};
            const adminEdits = activeDocument.adminEdits || {};
            editableFields.FULL_NAME = adminEdits.FULL_NAME || fields.FULL_NAME || fields.full_name || getDocumentRequesterName(activeDocument);
            editableFields.AGE = adminEdits.AGE || fields.AGE || (
                (activeDocument?.resident?.birthDate && typeof calculateAge === 'function') ? String(calculateAge(activeDocument.resident.birthDate)) : (
                    (activeDocument?.residentId?.birthDate && typeof calculateAge === 'function') ? String(calculateAge(activeDocument.residentId.birthDate)) : ''
                )
            );
            editableFields.BARANGAY = adminEdits.BARANGAY || fields.BARANGAY || 'Irawan';
            editableFields.CITY = adminEdits.CITY || fields.CITY || 'Puerto Princesa City';
            editableFields.PURPOSE = adminEdits.PURPOSE || fields.PURPOSE || activeDocument.purpose || '';
            editableFields.DAY = adminEdits.DAY || fields.DAY || '';
            editableFields.MONTH = adminEdits.MONTH || fields.MONTH || '';
        }
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
                {
                    const response = await saveResidentStatus(selectedItem.value._id, editForm.status);
                    if (response?.resident) {
                        selectedItem.value = { ...selectedItem.value, ...response.resident };
                    }
                }
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

const saveDocumentEdits = async () => {
    if (!selectedItem.value?._id) return;
    if (!isDocumentProcessing(selectedItem.value)) {
        showToast('Move the document request to processing before saving document edits.', true);
        return;
    }
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        const payload = {
            fields: { ...editableFields },
            purpose: formalPurposeInput.value || ''
        };
        const response = await apiFetch(`/admin/documents/${selectedItem.value._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        selectedItem.value = mergeDocumentResponse({
            ...selectedItem.value,
            purpose: payload.purpose,
            adminEdits: { ...editableFields }
        }, response?.data || {});
        showToast('Document edits saved.');
        await loadAll();
    } catch (err) {
        showToast(err.message || 'Failed to save edits.', true);
    } finally {
        isSubmitting.value = false;
    }
};

const approveDocument = async (item) => {
    if (!item?._id) return;
    if (!(await showConfirm('Approve this document request?'))) return;
    try {
        isSubmitting.value = true;
        const response = await apiFetch(`/admin/documents/${item._id}/approve`, { method: 'PUT' });
        selectedItem.value = mergeDocumentResponse(selectedItem.value, { ...(response?.data || {}), status: 'approved' });
        showToast('Document approved.');
        await loadAll();
    } catch (err) {
        showToast(err.message || 'Failed to approve.', true);
    } finally { isSubmitting.value = false; }
};

const rejectDocument = async (item) => {
    if (!item?._id) return;
    const reason = prompt('Optional rejection reason (will be saved):', '');
    try {
        isSubmitting.value = true;
        await apiFetch(`/admin/documents/${item._id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
        showToast('Document rejected.');
        await loadAll();
        activeModal.value = null;
    } catch (err) {
        showToast(err.message || 'Failed to reject.', true);
    } finally { isSubmitting.value = false; }
};

const generatePreview = async (item) => {
    if (!item?._id) return;
    if (!isDocumentProcessing(item)) {
        showToast('Move the document request to processing before generating a preview.', true);
        return;
    }
    try {
        previewLoading.value = true;
        const auth = getAuth();
        const res = await fetch(`/api/admin/documents/${item._id}/generate`, {
            headers: {
                'Authorization': auth.token ? `Bearer ${auth.token}` : ''
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Failed to generate preview.');
        }
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
        } else {
            showToast('Popup blocked. Please allow popups to preview document.', true);
        }
    } catch (err) {
        showToast(err.message || 'Failed to generate preview.', true);
    } finally {
        previewLoading.value = false;
    }
};

const generateAndSavePdf = async (item) => {
    if (!item?._id) return;
    if (!isDocumentProcessing(item)) {
        showToast('Move the document request to processing before generating a PDF.', true);
        return;
    }
    try {
        // If a PDF was already generated previously, open it instead of regenerating.
        if (item.generatedFileUrl) {
            const win = window.open(item.generatedFileUrl, '_blank');
            if (!win) showToast('Popup blocked. Please allow popups to open the generated PDF.', true);
            else showToast('Opening previously generated PDF.');
            return;
        }

        // If we only have a stored filename (possibly an S3 key), ask the server
        // for a usable URL (this will return a presigned URL for S3 keys).
        if (item.generatedFileName) {
            previewLoading.value = true;
            const auth = getAuth();
            try {
                const resCached = await fetch(`/api/admin/documents/${item._id}/generate?pdf=1`, {
                    method: 'POST',
                    headers: { 'Authorization': auth.token ? `Bearer ${auth.token}` : '' }
                });
                if (!resCached.ok) {
                    const errorText = await resCached.text();
                    throw new Error(errorText || 'Failed to fetch existing generated file.');
                }
                const cachedData = await resCached.json();
                if (cachedData && cachedData.fileUrl) {
                    selectedItem.value = mergeDocumentResponse(selectedItem.value, { ...(cachedData.data || {}), status: cachedData.data?.status || 'ready_for_pickup' });
                    const win = window.open(cachedData.fileUrl, '_blank');
                    if (!win) showToast('Popup blocked. Please allow popups to open the generated PDF.', true);
                    else showToast('Opening previously generated PDF.');
                    await loadAll();
                    return;
                }
            } catch (err) {
                showToast(err.message || 'Failed to open cached PDF.', true);
            } finally {
                previewLoading.value = false;
            }
        }

        previewLoading.value = true;
        const auth = getAuth();
        const res = await fetch(`/api/admin/documents/${item._id}/generate`, {
            method: 'POST',
            headers: {
                'Authorization': auth.token ? `Bearer ${auth.token}` : ''
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Failed to generate PDF.');
        }
        const data = await res.json();
        if (data && data.fileUrl) {
            selectedItem.value = mergeDocumentResponse(selectedItem.value, { ...(data.data || {}), status: data.data?.status || 'ready_for_pickup' });
            const win = window.open(data.fileUrl, '_blank');
            if (!win) showToast('Popup blocked. Please allow popups to open the generated PDF.', true);
            else showToast('PDF generated and saved. Resident notified (if email present).');
            await loadAll();
        } else {
            showToast('Failed to generate PDF.', true);
        }
    } catch (err) {
        showToast(err.message || 'Failed to generate PDF.', true);
    } finally {
        previewLoading.value = false;
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
    if (!(await showConfirm('Delete this announcement?'))) return;
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

const getFullResidentName = (resident) => [resident?.firstName, resident?.middleName, resident?.lastName, resident?.suffix].filter(Boolean).join(' ').trim();
const getResidentInitials = (resident) => [resident?.firstName?.charAt(0), resident?.lastName?.charAt(0)].filter(Boolean).join('').toUpperCase() || 'RS';
const residentSystemId = (resident) => {
    const created = resident?.createdAt ? new Date(resident.createdAt) : new Date();
    const year = Number.isNaN(created.getTime()) ? new Date().getFullYear() : created.getFullYear();
    const suffix = String(resident?._id || '').slice(-5).toUpperCase().padStart(5, '0');
    return `RES-${year}-${suffix}`;
};
const residentVulnerabilityTags = (resident) => {
    const tags = [];
    if (resident?.isSoloParent) tags.push('Solo Parent');
    if (resident?.isPregnant) tags.push('Pregnant');
    return tags.length ? tags : ['General Resident'];
};
const residentAutoTags = (resident) => {
    const tags = [];
    if (resident?.userId?.accountStatus === 'approved') tags.push('Verified Resident');
    if (resident?.verificationPending) tags.push('Needs Verification');
    if (resident?.voterStatus === 'registered') tags.push('Active Voter');
    if (resident?.floodProneArea) tags.push('High Risk Area');
    return [...tags, ...residentVulnerabilityTags(resident)];
};
const formatVerificationStatus = (status) => {
    const map = {
        pending_review: 'Pending Review',
        under_verification: 'Under Verification',
        verified: 'Verified',
        rejected: 'Rejected',
        needs_reupload: 'Needs Re-upload'
    };
    return map[status] || 'Pending Review';
};
const formatPurokZone = (resident) => {
    const purok = resident?.purok || '';
    const zone = resident?.zone || '';
    if (purok && zone) return `${purok} / ${zone}`;
    return purok || zone || 'N/A';
};
const residentActivityTimeline = (resident) => ([
    { key: 'registered', label: 'Registered account', time: formatDate(resident?.createdAt) },
    { key: 'updated', label: 'Profile updated', time: formatDate(resident?.updatedAt || resident?.createdAt) },
    { key: 'verified', label: `Verification status: ${formatVerificationStatus(resident?.verificationStatus)}`, time: formatDate(resident?.updatedAt || resident?.createdAt) }
]);
const residentTransactions = (resident) => {
    const residentId = resident?._id;
    if (!residentId) return [];
    const reservationsEntries = reservations.value.filter((item) => item.residentId?._id === residentId || item.residentId === residentId).map((item) => ({
        key: `resv-${item._id}`, type: 'Facility Reservation', status: item.status, date: formatDate(item.createdAt), stage: item.status?.replaceAll('_', ' ')
    }));
    const reportsEntries = reports.value.filter((item) => item.residentId?._id === residentId || item.residentId === residentId).map((item) => ({
        key: `rep-${item._id}`, type: 'Complaint / Report', status: item.status, date: formatDate(item.createdAt), stage: item.status?.replaceAll('_', ' ')
    }));
    const appointmentsEntries = appointments.value.filter((item) => item.residentId?._id === residentId || item.residentId === residentId).map((item) => ({
        key: `apt-${item._id}`, type: 'Appointment', status: item.status, date: formatDate(item.createdAt), stage: item.status?.replaceAll('_', ' ')
    }));
    return [...reportsEntries, ...appointmentsEntries, ...reservationsEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
};
// Confirmation Dialog State & Functions
const showConfirmDialog = ref(false);
const confirmMessage = ref('');
const pendingConfirmCallback = ref(null);
const isConfirmSubmitting = ref(false);

const showConfirm = (message) => {
    return new Promise((resolve) => {
        confirmMessage.value = message;
        pendingConfirmCallback.value = resolve;
        showConfirmDialog.value = true;
    });
};

const confirmAction = async () => {
    isConfirmSubmitting.value = true;
    try {
        if (pendingConfirmCallback.value) {
            pendingConfirmCallback.value(true);
        }
    } finally {
        isConfirmSubmitting.value = false;
        showConfirmDialog.value = false;
        confirmMessage.value = '';
        pendingConfirmCallback.value = null;
    }
};

const cancelConfirm = () => {
    if (pendingConfirmCallback.value) {
        pendingConfirmCallback.value(false);
    }
    showConfirmDialog.value = false;
    confirmMessage.value = '';
    pendingConfirmCallback.value = null;
};

const setResidentStatusAndSave = async (status) => {
    editForm.status = status;
    await handleSave();
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

            const response = await apiFetch(`/actions/${entityType}/${selectedItem.value._id}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify({ reason: reason || '' })
            });

            if (activeModal.value === 'document') {
                selectedItem.value = mergeDocumentResponse(selectedItem.value, response?.data || {});
            }
        }

        msg(`Request ${action}ed successfully`);
        await loadAll();
        if (activeModal.value !== 'document') {
            activeModal.value = null;
        }
        confirmingAction.value = null;
    } catch (error) {
        msg(error.message || 'Action failed', true);
    } finally {
        isSubmitting.value = false;
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
    clearResidentProofPreview();
    stopNotificationPolling();
    try {
        globalThis.removeEventListener('hashchange', syncViewFromHash);
    } catch (error) {
        // ignore
    }
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
    try {
        globalThis.addEventListener('hashchange', syncViewFromHash);
    } catch (error) {
        // ignore
    }
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
    align-items: start;
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
    border-radius: var(--radius-md);
    background: white;
    box-shadow: inset 0 0 0 1px var(--accent);
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

.resident-overview-layout {
    display: grid;
    grid-template-columns: minmax(270px, 0.75fr) minmax(0, 1.35fr);
    gap: 14px;
    align-items: start;
}

.resident-identity-card {
    position: sticky;
    top: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px;
    background: linear-gradient(180deg, #ffffff, #f6faf8);
    box-shadow: var(--shadow-sm);
    display: grid;
    gap: 10px;
}

.resident-avatar {
    width: 74px;
    height: 74px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(27, 115, 71, 0.12);
    color: var(--accent);
    font-weight: 800;
    display: grid;
    place-items: center;
}

.resident-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.resident-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.resident-tag {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 700;
    background: rgba(13, 74, 42, 0.1);
    color: #0d4a2a;
    border: 1px solid rgba(13, 74, 42, 0.16);
}

.resident-meta-list {
    display: grid;
    gap: 4px;
}

.resident-quick-actions {
    display: grid;
    gap: 8px;
}

.resident-center-pane {
    display: grid;
    gap: 12px;
}

.resident-tab-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.resident-tab-nav button {
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.resident-tab-nav button.active {
    background: linear-gradient(135deg, #0d4a2a, #a1121c);
    color: #fff;
    border-color: transparent;
}

.resident-tab-content {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 20px;
    background: #fff;
    box-shadow: var(--shadow-sm);
}

.resident-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
}

.resident-info-grid p {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.6;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fbfa;
    border: 1px solid rgba(15, 31, 27, 0.06);
}

.resident-doc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
}

.resident-doc-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    display: grid;
    gap: 8px;
    background: #fcfefe;
}

.resident-doc-card h4 {
    margin: 0;
    font-size: 0.95rem;
}

.resident-doc-actions {
    display: grid;
    gap: 6px;
}

.resident-timeline {
    display: grid;
    gap: 10px;
}

.resident-timeline-item {
    display: grid;
    grid-template-columns: 14px 1fr;
    gap: 10px;
    align-items: start;
}

.resident-timeline-item .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 5px;
    background: linear-gradient(135deg, #0d4a2a, #a1121c);
}

.resident-timeline-item small {
    display: block;
    color: var(--muted);
    margin-top: 3px;
}

.resident-bottom-panels {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
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
    grid-template-columns: repeat(1, minmax(0, 1fr));
    align-items: start;
    gap: 12px;
    padding: 24px 20px 18px;
    position: relative;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 252, 251, 0.92));
    border: 1px solid rgba(15, 31, 27, 0.06);
    box-shadow: 0 4px 16px rgba(15, 31, 27, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ops-bar-chart:hover {
    border-color: rgba(15, 31, 27, 0.1);
    box-shadow: 0 8px 24px rgba(15, 31, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.ops-chart-frame {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(248, 252, 251, 0.2));
    padding: 16px;
    backdrop-filter: blur(2px);
}

/* Modern Analytics Chart Styles */
.ops-line-chart {
    width: 100%;
    min-height: 280px;
    display: block;
    overflow: visible;
    filter: drop-shadow(0 2px 8px rgba(15, 31, 27, 0.04));
    transition: filter 0.3s ease;
}

.ops-line-chart:hover {
    filter: drop-shadow(0 4px 12px rgba(15, 31, 27, 0.08));
}

/* Chart Area Gradient Fill */
.chart-area {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.9;
}

.chart-area:hover {
    opacity: 1;
}

/* Grid Lines */
.chart-grid-lines line {
    transition: stroke-opacity 0.2s ease;
}

.ops-line-chart:hover .chart-grid-lines line {
    stroke-opacity: 0.12;
}

/* Chart Line - Smooth Animated Stroke */
.chart-line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    transition: stroke-width 0.2s ease, filter 0.2s ease;
    will-change: stroke-width;
}

.ops-line-chart:hover .chart-line {
    stroke-width: 2.4;
    filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.15));
}

/* Chart Point Markers - Hidden by Default */
.chart-point {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    r: 0;
    will-change: r, filter;
}

.chart-point:hover,
.chart-point.active {
    r: 3.5;
    filter: drop-shadow(0 3px 8px rgba(16, 185, 129, 0.3));
    animation: pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) 1;
}

.chart-point:focus {
    outline: 2px solid rgba(16, 185, 129, 0.5);
    outline-offset: 2px;
}

/* Smooth Line Draw Animation */
@keyframes drawLine {
    to {
        stroke-dashoffset: 0;
    }
}

/* Pulse Animation for Hover Points */
@keyframes pulse {
    0% {
        r: 3.5;
        opacity: 1;
    }
    50% {
        r: 5.5;
        opacity: 0.8;
    }
    100% {
        r: 3.5;
        opacity: 1;
    }
}

/* Tooltip - Modern Card Style */
.ops-tooltip {
    position: absolute;
    transform: translate(-50%, calc(-100% - 12px));
    padding: 12px 14px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(15, 31, 27, 0.96), rgba(15, 31, 27, 0.92));
    backdrop-filter: blur(8px);
    color: #f8fbf9;
    font-size: 0.8rem;
    line-height: 1.4;
    box-shadow: 0 12px 28px rgba(15, 31, 27, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    pointer-events: none;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: tooltipPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes tooltipPop {
    from {
        opacity: 0;
        transform: translate(-50%, calc(-100% - 4px)) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translate(-50%, calc(-100% - 12px)) scale(1);
    }
}

.ops-tooltip .tooltip-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(248, 251, 249, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    opacity: 0.85;
}

.ops-tooltip strong {
    display: block;
    font-size: 1.1rem;
    margin-bottom: 2px;
    font-weight: 700;
    color: #10b981;
}

.ops-tooltip span {
    display: block;
    font-size: 0.75rem;
    opacity: 0.9;
    color: rgba(248, 251, 249, 0.85);
}

/* Chart Labels - Enhanced Typography */
.ops-line-labels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    gap: 8px;
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid rgba(15, 31, 27, 0.08);
}

.ops-line-label-item {
    text-align: center;
    color: #2d5f45;
    transition: all 0.2s ease;
    padding: 4px 0;
}

.ops-line-label-item small {
    display: block;
    font-size: 0.72rem;
    color: #60756d;
    margin-bottom: 4px;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.3px;
}

.ops-line-label-item span {
    display: block;
    font-weight: 700;
    color: #10b981;
    font-size: 1.15rem;
    transition: color 0.2s ease;
}

.ops-line-label-item:hover span {
    color: #059669;
}

/* Responsive Chart Design */
@media (max-width: 1024px) {
    .ops-line-chart {
        min-height: 240px;
    }
    
    .ops-line-labels {
        grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
        gap: 6px;
        margin-top: 16px;
    }
    
    .ops-line-label-item small {
        font-size: 0.65rem;
    }
    
    .ops-line-label-item span {
        font-size: 1rem;
    }
}

@media (max-width: 768px) {
    .ops-line-chart {
        min-height: 200px;
    }
    
    .ops-bar-chart {
        padding: 12px 12px 8px;
    }
    
    .ops-line-labels {
        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        gap: 4px;
        margin-top: 12px;
    }
    
    .ops-line-label-item small {
        font-size: 0.6rem;
    }
    
    .ops-line-label-item span {
        font-size: 0.9rem;
    }
    
    .chart-point:hover,
    .chart-point.active {
        r: 2.5;
    }
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
    .resident-overview-layout,
    .resident-bottom-panels,
    .resident-info-grid {
        grid-template-columns: 1fr;
    }

    .resident-identity-card {
        position: static;
    }

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
    min-width: 0;
    min-height: 100vh;
}

.app-sidebar {
    position: relative;
    align-self: start;
    height: auto;
    overflow: visible;
    display: flex;
    flex-direction: column;
}

.sidebar-header,
.sidebar-footer {
    flex-shrink: 0;
}

.sidebar-nav {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
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
    background: rgba(15, 23, 42, 0.62);
    z-index: 100000;
}
.preview-loading-box {
    background: white;
    padding: 22px 26px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 12px 40px rgba(0,0,0,0.28);
    width: 360px;
    max-width: calc(100vw - 32px);
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

/* Admin modal backdrop and container */
.admin-modal-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(15, 23, 42, 0.48);
    z-index: 9000;
    padding: 20px;
    backdrop-filter: blur(4px);
    overflow: auto;
}

.admin-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: min(1480px, 96vw);
    min-width: 1120px;
    max-width: 1480px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 9001;
}

.admin-modal-wide {
    max-width: 1480px !important;
}

.proof-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.proof-preview-card {
    border: 1px solid #dce6e1;
    border-radius: 10px;
    background: linear-gradient(180deg, #ffffff, #f8fcfa);
    padding: 10px;
    display: grid;
    gap: 8px;
}

.proof-preview-button {
    cursor: pointer;
    text-align: left;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.proof-preview-button:hover,
.proof-preview-button:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(13, 74, 42, 0.22);
    box-shadow: 0 10px 24px rgba(13, 74, 42, 0.08);
    outline: none;
}

.proof-preview-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 8px;
    background: #eef4f1;
    border: 1px solid rgba(13, 74, 42, 0.08);
}

.proof-preview-label {
    font-size: 0.88rem;
    color: #41584d;
    word-break: break-word;
}

.resident-table-avatar {
    width: 46px;
    height: 46px;
    border: 2px solid rgba(13, 74, 42, 0.12);
}

.resident-proof-panel {
    margin-top: 16px;
    padding: 14px;
    border: 1px solid #dce6e1;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff, #f8fcfa);
    display: grid;
    gap: 12px;
}

.resident-proof-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.resident-proof-head p {
    margin: 4px 0 0;
}

.resident-proof-image-button {
    padding: 0;
    border: 1px solid rgba(13, 74, 42, 0.1);
    border-radius: 10px;
    overflow: hidden;
    background: #eef4f1;
    display: block;
    width: 100%;
}

.resident-proof-image-button img {
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    display: block;
    background: #eef4f1;
}

.resident-proof-file,
.resident-proof-state {
    min-height: 120px;
    border-radius: 10px;
    background: rgba(232, 240, 237, 0.72);
    display: grid;
    place-items: center;
    gap: 8px;
    text-align: center;
    color: #41584d;
    font-weight: 700;
}

.resident-proof-file i {
    font-size: 1.8rem;
    color: #0d4a2a;
}

.resident-proof-state.is-error {
    color: #9f1d1d;
    background: #fff4f4;
}

.report-modal-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    gap: 24px;
    align-items: start;
    margin-top: 15px;
    margin-bottom: 16px;
}

.report-modal-left,
.report-modal-right {
    min-width: 0;
    display: grid;
    gap: 12px;
}

.report-details-card {
    background: linear-gradient(180deg, #fbfffc, #f7fbf8);
    padding: 15px;
    border-radius: 6px;
    border-left: 3px solid var(--accent);
    margin: 0;
    box-shadow: 0 6px 18px rgba(13, 74, 42, 0.03);
}

.report-side-card {
    padding: 12px;
    border: 1px solid #dce6e1;
    border-radius: 8px;
    background: #fcfefe;
    display: grid;
    gap: 10px;
}

.report-side-title {
    display: block;
    margin-bottom: 0;
}

.report-side-coordinates {
    margin: 0;
    color: #4f6b5d;
}

.report-map-frame {
    width: 100%;
    height: 240px;
    border: 1px solid #dce6e1;
    border-radius: 8px;
}

.report-map-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    width: fit-content;
}

.record-preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 9500;
    background: rgba(15, 23, 42, 0.72);
    display: grid;
    place-items: center;
    padding: 20px;
    backdrop-filter: blur(6px);
}

.record-preview-modal {
    position: relative;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
    width: min(980px, 96vw);
    max-height: 92vh;
    padding: 18px;
    display: grid;
    gap: 14px;
    overflow: auto;
}

.record-preview-map {
    width: min(1200px, 96vw);
}

.record-preview-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.08);
    color: #24312b;
    cursor: pointer;
    display: grid;
    place-items: center;
}

.record-preview-title {
    margin: 0;
    padding-right: 48px;
    color: #0f3f33;
}

.record-preview-image {
    width: 100%;
    max-height: 78vh;
    object-fit: contain;
    border-radius: 10px;
    background: #eef4f1;
}

.record-preview-map-frame {
    width: 100%;
    height: min(72vh, 760px);
    border: 1px solid #dce6e1;
    border-radius: 10px;
    background: #eef4f1;
}

.admin-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: rgba(0, 0, 0, 0.08);
    color: #333;
    font-size: 1.2rem;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
    z-index: 9010;
}

.admin-modal-close:hover {
    background: rgba(0, 0, 0, 0.12);
    transform: rotate(90deg);
}

/* Custom Confirmation Dialog */
.confirm-dialog-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(15, 23, 42, 0.52);
    z-index: 9100;
    padding: 20px;
    backdrop-filter: blur(4px);
}

.confirm-dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    padding: 24px;
    max-width: 400px;
    width: 100%;
    animation: slideUp 0.3s ease-out;
}

.confirm-message {
    margin: 0 0 20px 0;
    font-size: 1rem;
    color: #333;
    line-height: 1.5;
}

.confirm-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.confirm-actions button {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.confirm-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>


