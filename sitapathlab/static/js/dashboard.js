'use strict';

/* =========================================================
   SITA PATH LAB — PRODUCTION DASHBOARD JS
   Django API Driven
   ========================================================= */

const DashboardApp = {

    apiUrl: '/api/dashboard-data/',
    refreshInterval: 60000,
    refreshTimer: null,
    currentTheme: 'light',
    isLoading: false,

    state: {
        dashboard: {},
        patients: [],
        appointments: [],
        schedules: [],
        activities: [],
        revenue: [],
        demographics: [],
        inventory: [],
        staff: []
    }

};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    initializeTheme();
    initializeMobileMenu();
    initializeSearch();
    initializeSidebarNavigation();
    initializeBottomNavigation();
    initializeStatCards();
    initializeQuickActions();
    initializeChart();
    initializeSchedule();
    initializeGrowthDetails();
    initializeFAB();
    initializeKeyboardShortcuts();
    initializeNavigationLinks();

    loadDashboardData();

    startAutoRefresh();

});


/* =========================================================
   API
   ========================================================= */

async function loadDashboardData(showLoader = true) {

    if (DashboardApp.isLoading) {
        return;
    }

    DashboardApp.isLoading = true;

    if (showLoader) {
        showDashboardLoading();
    }

    try {

        const response = await fetch(
            DashboardApp.apiUrl,
            {
                method: 'GET',

                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },

                credentials: 'same-origin',
                cache: 'no-store'
            }
        );


        if (!response.ok) {

            if (response.status === 403) {
                throw new Error(
                    'Permission denied. Please login again.'
                );
            }

            if (response.status === 404) {
                throw new Error(
                    'Dashboard API endpoint not found.'
                );
            }

            if (response.status >= 500) {
                throw new Error(
                    'Dashboard server error. Please try again.'
                );
            }

            throw new Error(
                `Dashboard API failed: ${response.status}`
            );
        }


        const data = await response.json();


        console.log(
            'Dashboard API Response:',
            data
        );


        /*
         * ==========================================
         * DASHBOARD / STATS
         * ==========================================
         */

        DashboardApp.state.dashboard =
            data.dashboard ||
            data.stats ||
            data.data?.stats ||
            data.data ||
            {};


        /*
         * ==========================================
         * PATIENTS
         * ==========================================
         */

        DashboardApp.state.patients =
            Array.isArray(data.patients)
                ? data.patients
                : [];


        /*
         * ==========================================
         * APPOINTMENTS
         * ==========================================
         */

        DashboardApp.state.appointments =
            Array.isArray(data.appointments)
                ? data.appointments
                : [];


        /*
         * ==========================================
         * SCHEDULES
         *
         * BACKEND:
         * data.schedules
         * ==========================================
         */

        DashboardApp.state.schedules =
            Array.isArray(data.schedules)
                ? data.schedules
                : [];


        /*
         * ==========================================
         * ACTIVITIES
         * ==========================================
         */

        DashboardApp.state.activities =
            Array.isArray(data.activities)
                ? data.activities
                : (
                    Array.isArray(data.recent_activity)
                        ? data.recent_activity
                        : []
                );


        /*
         * ==========================================
         * REVENUE
         * ==========================================
         */

        DashboardApp.state.revenue =
            Array.isArray(data.revenue)
                ? data.revenue
                : (
                    Array.isArray(data.revenue_data)
                        ? data.revenue_data
                        : []
                );


        /*
         * ==========================================
         * DEMOGRAPHICS
         * ==========================================
         */

        DashboardApp.state.demographics =
            Array.isArray(data.demographics)
                ? data.demographics
                : [];


        /*
         * ==========================================
         * INVENTORY
         * ==========================================
         */

        DashboardApp.state.inventory =
            Array.isArray(data.inventory)
                ? data.inventory
                : [];


        /*
         * ==========================================
         * STAFF
         * ==========================================
         */

        DashboardApp.state.staff =
            Array.isArray(data.staff)
                ? data.staff
                : [];


        /*
         * ==========================================
         * RENDER EVERYTHING
         * ==========================================
         */

        renderDashboard(data);

        hideDashboardLoading();


    } catch (error) {

        console.error(
            'Dashboard API Error:',
            error
        );

        showDashboardError(
            error.message ||
            'Unable to load dashboard data.'
        );


    } finally {

        DashboardApp.isLoading = false;

    }

}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderDashboard(data) {

    /*
     * ==========================================
     * STATS
     * ==========================================
     */

    const stats =
        data.dashboard ||
        data.stats ||
        data.data?.stats ||
        data.data ||
        data;


    /*
     * ==========================================
     * 1. TOTAL PATIENTS
     * ==========================================
     */

    setStatValue(
        0,
        getValue(
            stats,
            [
                'total_patients',
                'patients_count',
                'totalPatients'
            ],
            0
        )
    );


    /*
     * ==========================================
     * 2. TODAY PATIENTS
     * ==========================================
     */

    setStatValue(
        1,
        getValue(
            stats,
            [
                'today_patients',
                'todays_patients',
                'todayPatients'
            ],
            0
        )
    );


    /*
     * ==========================================
     * 3. REVENUE
     * ==========================================
     */

    setStatValue(
        2,
        formatCurrency(
            getValue(
                stats,
                [
                    'revenue_mtd',
                    'monthly_revenue',
                    'revenue',
                    'total_revenue'
                ],
                0
            )
        )
    );


    /*
     * ==========================================
     * 4. PENDING REPORTS
     * ==========================================
     */

    setStatValue(
        3,
        getValue(
            stats,
            [
                'pending_reports',
                'pendingReports'
            ],
            0
        )
    );


    /*
     * ==========================================
     * 5. APPOINTMENTS
     *
     * BACKEND:
     * appointments_count
     * ==========================================
     */

    const appointmentsCount =
        getValue(
            stats,
            [
                'appointments_count',
                'appointments',
                'today_appointments',
                'todayAppointments'
            ],
            0
        );


    setStatValue(
        4,
        appointmentsCount
    );


    /*
     * ==========================================
     * 6. COMPLETED REPORTS
     * ==========================================
     */

    setStatValue(
        5,
        getValue(
            stats,
            [
                'completed_reports',
                'completedReports'
            ],
            0
        )
    );


    /*
     * ==========================================
     * 7. INVENTORY ALERTS
     *
     * BACKEND:
     * inventory_alerts
     *
     * IMPORTANT:
     * Is value ko data.inventory se
     * overwrite nahi kiya jayega.
     * ==========================================
     */

    const inventoryAlerts =
        getValue(
            stats,
            [
                'inventory_alerts',
                'inventoryAlerts',
                'low_stock'
            ],
            0
        );


    setStatValue(
        6,
        String(
            inventoryAlerts
        ).padStart(2, '0')
    );


    /*
     * ==========================================
     * 8. STAFF ONLINE
     * ==========================================
     */

    const staffOnline =
        getValue(
            stats,
            [
                'staff_online',
                'online_staff',
                'staffOnline'
            ],
            null
        );


    const totalStaff =
        getValue(
            stats,
            [
                'total_staff',
                'staff_total',
                'totalStaff'
            ],
            null
        );


    if (
        staffOnline !== null &&
        totalStaff !== null
    ) {

        setStatValue(
            7,
            `${staffOnline}/${totalStaff}`
        );

    } else if (
        staffOnline !== null
    ) {

        setStatValue(
            7,
            String(staffOnline)
        );

    }


    /*
     * ==========================================
     * REVENUE CHART
     * ==========================================
     */

    renderRevenueChart(
        Array.isArray(data.revenue)
            ? data.revenue
            : (
                Array.isArray(data.revenue_data)
                    ? data.revenue_data
                    : []
            )
    );


    /*
     * ==========================================
     * RECENT ACTIVITY
     * ==========================================
     */

    renderRecentActivity(
        Array.isArray(data.activities)
            ? data.activities
            : (
                Array.isArray(data.recent_activity)
                    ? data.recent_activity
                    : []
            )
    );


    /*
     * ==========================================
     * TODAY'S SCHEDULE
     *
     * IMPORTANT:
     * Backend key = schedules
     * ==========================================
     */

    renderSchedule(
        Array.isArray(data.schedules)
            ? data.schedules
            : []
    );


    /*
     * ==========================================
     * PATIENT GROWTH
     * ==========================================
     */

    renderPatientGrowth(
        stats
    );


    /*
     * ==========================================
     * DEMOGRAPHICS
     * ==========================================
     */

    renderDemographics(
        Array.isArray(data.demographics)
            ? data.demographics
            : []
    );


    /*
     * ==========================================
     * INVENTORY
     *
     * Only calculate if backend actually
     * provides inventory array.
     * ==========================================
     */

    if (
        Array.isArray(data.inventory) &&
        data.inventory.length > 0
    ) {

        updateInventoryAlert(
            data.inventory
        );

    }


    /*
     * ==========================================
     * PATIENT CACHE
     * ==========================================
     */

    DashboardApp.state.patients =
        Array.isArray(data.patients)
            ? data.patients
            : [];

}


/* =========================================================
   STAT CARD
   ========================================================= */

function setStatValue(index, value) {

    const cards =
        document.querySelectorAll(
            '.stat-card'
        );


    if (!cards[index]) {
        return;
    }


    const valueElement =
        cards[index].querySelector(
            '.stat-value'
        );


    if (!valueElement) {
        return;
    }


    valueElement.textContent =
        value ?? 0;

}


/* =========================================================
   REVENUE CHART
   ========================================================= */

function renderRevenueChart(revenueData) {

    const chart =
        document.querySelector(
            '.chart-bars'
        );


    const labels =
        document.querySelector(
            '.chart-labels'
        );


    if (!chart) {
        return;
    }


    if (
        !Array.isArray(revenueData) ||
        revenueData.length === 0
    ) {

        chart.innerHTML = '';

        if (labels) {

            labels.innerHTML =
                '<span>No revenue data</span>';

        }

        return;
    }


    const values =
        revenueData.map(
            function (item) {

                return Number(
                    item.value ??
                    item.revenue ??
                    item.amount ??
                    0
                );

            }
        );


    const max =
        Math.max(
            ...values,
            1
        );


    chart.innerHTML = '';


    revenueData.forEach(
        function (item, index) {

            const value =
                values[index];


            const percentage =
                Math.max(
                    5,
                    Math.round(
                        (value / max) * 100
                    )
                );


            const bar =
                document.createElement(
                    'div'
                );


            bar.className =
                'bar';


            bar.style.height =
                `${percentage}%`;


            bar.title =
                formatCurrency(value);


            chart.appendChild(bar);

        }
    );


    if (labels) {

        labels.innerHTML = '';


        revenueData.forEach(
            function (item) {

                const label =
                    document.createElement(
                        'span'
                    );


                label.textContent =
                    item.label ||
                    item.date ||
                    item.month ||
                    '';


                labels.appendChild(label);

            }
        );

    }

}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

function renderRecentActivity(activities) {

    const container =
        document.querySelector(
            '.activity-list'
        );


    if (!container) {
        return;
    }


    container.innerHTML = '';


    if (
        !Array.isArray(activities) ||
        activities.length === 0
    ) {

        container.innerHTML =
            createEmptyState(
                'No recent activity'
            );

        return;
    }


    activities
        .slice(0, 10)
        .forEach(
            function (activity) {

                const item =
                    document.createElement(
                        'div'
                    );


                item.className =
                    'activity-item';


                /*
                 * Backend:
                 * activity_type
                 */

                const type =
                    String(
                        activity.activity_type ||
                        activity.type ||
                        activity.status ||
                        'info'
                    ).toLowerCase();


                const icon =
                    getActivityIcon(
                        type
                    );


                const iconClass =
                    getActivityIconClass(
                        type
                    );


                /*
                 * TITLE
                 */

                const title =
                    escapeHTML(
                        activity.title ||
                        activity.action ||
                        activity.name ||
                        activity.activity ||
                        'Activity'
                    );


                /*
                 * DESCRIPTION
                 */

                const description =
                    escapeHTML(
                        activity.description ||
                        activity.message ||
                        activity.patient_name ||
                        activity.details ||
                        ''
                    );


                /*
                 * Backend:
                 * time_ago
                 */

                const time =
                    escapeHTML(
                        activity.time_ago ||
                        activity.time ||
                        activity.created_at ||
                        activity.timestamp ||
                        ''
                    );


                /*
                 * PATIENT ID
                 */

                const patientId =
                    activity.patient_id ||
                    activity.patientId ||
                    activity.pid ||
                    '';


                const patientLine =
                    patientId
                        ? `${description} (PID: ${escapeHTML(String(patientId))})`
                        : description;


                item.innerHTML = `

                    <div class="activity-icon ${iconClass}">

                        <span class="material-symbols-outlined">
                            ${icon}
                        </span>

                    </div>


                    <div>

                        <p class="activity-title">
                            ${title}
                        </p>


                        <p class="activity-desc">
                            ${patientLine}
                        </p>


                        <p class="activity-time">
                            ${time}
                        </p>

                    </div>

                `;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   TODAY'S SCHEDULE
   ========================================================= */

function renderSchedule(schedules) {

    const container =
        document.querySelector(
            '.schedule-list'
        );


    if (!container) {
        return;
    }


    container.innerHTML = '';


    if (
        !Array.isArray(schedules) ||
        schedules.length === 0
    ) {

        container.innerHTML =
            createEmptyState(
                'No appointments scheduled today'
            );

        return;
    }


    schedules
        .slice(0, 10)
        .forEach(
            function (schedule) {

                const item =
                    document.createElement(
                        'div'
                    );


                item.className =
                    'schedule-item border-l-primary';


                /*
                 * ==================================
                 * BACKEND:
                 * time_slot
                 * ==================================
                 */

                const time =
                    escapeHTML(
                        schedule.time_slot ||
                        schedule.time ||
                        schedule.appointment_time ||
                        schedule.start_time ||
                        '--'
                    );


                /*
                 * ==================================
                 * PATIENT
                 * ==================================
                 */

                const patient =
                    escapeHTML(
                        schedule.patient_name ||
                        schedule.patient ||
                        schedule.name ||
                        'Patient'
                    );


                /*
                 * ==================================
                 * BACKEND:
                 * tests_summary
                 * ==================================
                 */

                const test =
                    escapeHTML(
                        schedule.tests_summary ||
                        schedule.test_name ||
                        schedule.tests ||
                        schedule.test ||
                        schedule.service ||
                        'Appointment'
                    );


                /*
                 * ==================================
                 * BACKEND:
                 * badge_type
                 * ==================================
                 */

                const type =
                    escapeHTML(
                        schedule.badge_type ||
                        schedule.type ||
                        schedule.appointment_type ||
                        schedule.status ||
                        'APPOINTMENT'
                    );


                /*
                 * ==================================
                 * APPOINTMENT ID
                 * ==================================
                 */

                const appointmentId =
                    schedule.id ||
                    schedule.pk ||
                    schedule.appointment_id ||
                    '';


                item.dataset.appointmentId =
                    appointmentId;


                item.innerHTML = `

                    <div>

                        <span class="schedule-time">
                            ${time}
                        </span>


                        <span class="schedule-badge blue">
                            ${type}
                        </span>

                    </div>


                    <p class="font-bold">
                        ${patient}
                    </p>


                    <p class="text-body-sm text-outline">
                        ${test}
                    </p>

                `;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   PATIENT GROWTH
   ========================================================= */

function renderPatientGrowth(stats) {

    const percentage =
        Number(
            getValue(
                stats,
                [
                    'patient_growth_percentage',
                    'growth_percentage',
                    'daily_target_percentage'
                ],
                0
            )
        );


    const today =
        Number(
            getValue(
                stats,
                [
                    'today_patients',
                    'todays_patients',
                    'todayPatients'
                ],
                0
            )
        );


    const target =
        Number(
            getValue(
                stats,
                [
                    'daily_target',
                    'patient_target'
                ],
                0
            )
        );


    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                percentage
            )
        );


    /*
     * Ring percentage
     */

    const percentageElement =
        document.querySelector(
            '.ring-label'
        );


    if (percentageElement) {

        percentageElement.textContent =
            `${safePercentage}%`;

    }


    /*
     * Ring SVG
     */

    const ring =
        document.querySelector(
            '.ring-fg'
        );


    if (ring) {

        const circumference =
            2 * Math.PI * 34;


        const offset =
            circumference -
            (
                circumference *
                safePercentage
            ) / 100;


        ring.setAttribute(
            'stroke-dasharray',
            circumference
        );


        ring.setAttribute(
            'stroke-dashoffset',
            offset
        );

    }


    /*
     * Ring stats
     */

    const ringStats =
        document.querySelector(
            '.ring-stats'
        );


    if (ringStats) {

        if (target) {

            ringStats.textContent =
                `${today} / ${target}`;

        } else {

            ringStats.textContent =
                String(today);

        }

    }


    /*
     * Ring subtitle
     */

    const ringSub =
        document.querySelector(
            '.ring-sub'
        );


    if (ringSub) {

        ringSub.textContent =
            'Patients Today';

    }


    /*
     * Growth subtitle
     */

    const growthSub =
        document.querySelector(
            '.growth-sub'
        );


    if (growthSub) {

        growthSub.textContent =
            target
                ? `You've reached ${safePercentage}% of your daily target.`
                : `${today} patients registered today.`;

    }

}


/* =========================================================
   DEMOGRAPHICS
   ========================================================= */

function renderDemographics(data) {

    const items =
        document.querySelectorAll(
            '.demo-item'
        );


    if (!items.length) {
        return;
    }


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        return;
    }


    items.forEach(
        function (item, index) {

            const dataItem =
                data[index];


            if (!dataItem) {
                return;
            }


            const percentage =
                Number(
                    dataItem.percentage ??
                    dataItem.value ??
                    0
                );


            const safePercentage =
                Math.min(
                    100,
                    Math.max(
                        0,
                        percentage
                    )
                );


            const label =
                item.querySelector(
                    '.demo-label'
                );


            const fill =
                item.querySelector(
                    '.demo-fill'
                );


            if (label) {

                const spans =
                    label.querySelectorAll(
                        'span'
                    );


                if (spans[0]) {

                    spans[0].textContent =
                        dataItem.label ||
                        dataItem.name ||
                        spans[0].textContent;

                }


                if (spans[1]) {

                    spans[1].textContent =
                        `${safePercentage}%`;

                }

            }


            if (fill) {

                fill.style.width =
                    `${safePercentage}%`;

            }

        }
    );

}


/* =========================================================
   INVENTORY ALERT
   ========================================================= */

function updateInventoryAlert(inventory) {

    const statCards =
        document.querySelectorAll(
            '.stat-card'
        );


    if (!statCards[6]) {
        return;
    }


    /*
     * Do not touch inventory alert card
     * if inventory array doesn't exist.
     */

    if (
        !Array.isArray(inventory)
    ) {
        return;
    }


    /*
     * If empty array is received,
     * don't overwrite backend count.
     */

    if (
        inventory.length === 0
    ) {
        return;
    }


    const lowStockCount =
        inventory.filter(
            function (item) {

                const quantity =
                    Number(
                        item.quantity ??
                        item.stock ??
                        item.current_stock ??
                        0
                    );


                const minimum =
                    Number(
                        item.minimum_stock ??
                        item.min_stock ??
                        item.reorder_level ??
                        0
                    );


                return (
                    quantity <= minimum
                );

            }
        ).length;


    setStatValue(
        6,
        String(
            lowStockCount
        ).padStart(2, '0')
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function initializeSearch() {

    const searchInput =
        document.querySelector(
            '.search-input'
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        'input',
        function () {

            const value =
                this.value
                    .trim()
                    .toLowerCase();


            searchDashboard(
                value
            );

        }
    );

}


function searchDashboard(value) {

    const activityItems =
        document.querySelectorAll(
            '.activity-item'
        );


    const scheduleItems =
        document.querySelectorAll(
            '.schedule-item'
        );


    /*
     * Search activities
     */

    activityItems.forEach(
        function (item) {

            const text =
                item.textContent
                    .toLowerCase();


            item.style.display =
                !value ||
                text.includes(value)
                    ? ''
                    : 'none';

        }
    );


    /*
     * Search schedules
     */

    scheduleItems.forEach(
        function (item) {

            const text =
                item.textContent
                    .toLowerCase();


            item.style.display =
                !value ||
                text.includes(value)
                    ? ''
                    : 'none';

        }
    );


    /*
     * Search patient cache
     */

    if (
        value &&
        DashboardApp.state.patients.length
    ) {

        const matches =
            DashboardApp.state.patients.filter(
                function (patient) {

                    return JSON.stringify(
                        patient
                    )
                        .toLowerCase()
                        .includes(value);

                }
            );


        if (matches.length) {

            console.log(
                'Patient search matches:',
                matches
            );

        }

    }

}


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {

    const themeButton =
        document.querySelector(
            '.theme-toggle'
        );


    const savedTheme =
        localStorage.getItem(
            'theme'
        );


    DashboardApp.currentTheme =
        savedTheme === 'dark'
            ? 'dark'
            : 'light';


    applyTheme(
        DashboardApp.currentTheme
    );


    if (!themeButton) {
        return;
    }


    themeButton.removeAttribute(
        'onclick'
    );


    themeButton.addEventListener(
        'click',
        function () {

            const isDark =
                document.documentElement
                    .classList
                    .contains('dark');


            DashboardApp.currentTheme =
                isDark
                    ? 'light'
                    : 'dark';


            applyTheme(
                DashboardApp.currentTheme
            );

        }
    );

}


function applyTheme(theme) {

    if (theme === 'dark') {

        document.documentElement
            .classList
            .add('dark');

    } else {

        document.documentElement
            .classList
            .remove('dark');

    }


    localStorage.setItem(
        'theme',
        theme
    );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.querySelector(
            '.menu-toggle'
        );


    const sidebar =
        document.querySelector(
            '.sidebar'
        );


    if (
        !menuButton ||
        !sidebar
    ) {
        return;
    }


    menuButton.addEventListener(
        'click',
        function () {

            sidebar.classList.toggle(
                'open'
            );

        }
    );


    document.addEventListener(
        'click',
        function (event) {

            if (
                window.innerWidth <= 1024 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {

                sidebar.classList.remove(
                    'open'
                );

            }

        }
    );

}


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

function initializeSidebarNavigation() {

    const navLinks =
        document.querySelectorAll(
            '.sidebar-nav .nav-link'
        );


    if (!navLinks.length) {
        return;
    }


    navLinks.forEach(
        function (link) {

            link.addEventListener(
                'click',
                function () {

                    navLinks.forEach(
                        function (item) {

                            item.classList.remove(
                                'active'
                            );

                        }
                    );


                    this.classList.add(
                        'active'
                    );

                }
            );

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function initializeBottomNavigation() {

    const items =
        document.querySelectorAll(
            '.bottom-nav-item'
        );


    if (!items.length) {
        return;
    }


    items.forEach(
        function (item) {

            item.addEventListener(
                'click',
                function () {

                    items.forEach(
                        function (element) {

                            element.classList.remove(
                                'active'
                            );

                        }
                    );


                    this.classList.add(
                        'active'
                    );

                }
            );

        }
    );

}


/* =========================================================
   DJANGO URL NAVIGATION
   ========================================================= */

function initializeNavigationLinks() {

    document
        .querySelectorAll(
            '[data-dashboard-url]'
        )
        .forEach(
            function (element) {

                element.addEventListener(
                    'click',
                    function (event) {

                        const url =
                            this.dataset
                                .dashboardUrl;


                        if (url) {

                            event.preventDefault();

                            window.location.href =
                                url;

                        }

                    }
                );

            }
        );

}


/* =========================================================
   STAT CARD HOVER
   ========================================================= */

function initializeStatCards() {

    document
        .querySelectorAll(
            '.stat-card'
        )
        .forEach(
            function (card) {

                card.addEventListener(
                    'mouseenter',
                    function () {

                        this.style.transform =
                            'translateY(-2px)';

                    }
                );


                card.addEventListener(
                    'mouseleave',
                    function () {

                        this.style.transform =
                            '';

                    }
                );

            }
        );

}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function initializeQuickActions() {

    const buttons =
        document.querySelectorAll(
            '.action-btn'
        );


    if (!buttons.length) {
        return;
    }


    buttons.forEach(
        function (button) {

            button.addEventListener(
                'click',
                function () {

                    const text =
                        this.querySelector(
                            'span:last-child'
                        );


                    if (!text) {
                        return;
                    }


                    const action =
                        text.textContent.trim();


                    const routes = {

                        'Register Patient':
                            '/register/',

                        'Add Result':
                            '/results/',

                        'Print Report':
                            '/reports/',

                        'Emergency Entry':
                            '/register/'

                    };


                    if (routes[action]) {

                        window.location.href =
                            routes[action];

                    } else {

                        showNotification(
                            `${action} selected.`,
                            'info'
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   CHART SELECT
   ========================================================= */

function initializeChart() {

    const select =
        document.querySelector(
            '.card-select'
        );


    if (!select) {
        return;
    }


    select.addEventListener(
        'change',
        function () {

            loadDashboardData();

        }
    );

}


/* =========================================================
   SCHEDULE VIEW ALL
   ========================================================= */

function initializeSchedule() {

    const viewAll =
        document.querySelector(
            '.dash-right .card .text-primary'
        );


    if (!viewAll) {
        return;
    }


    viewAll.addEventListener(
        'click',
        function () {

            window.location.href =
                '/appointments/';

        }
    );

}


/* =========================================================
   GROWTH DETAILS
   ========================================================= */

function initializeGrowthDetails() {

    const button =
        document.querySelector(
            '.growth-btn'
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        'click',
        function () {

            window.location.href =
                '/analytics/';

        }
    );

}


/* =========================================================
   FAB
   ========================================================= */

function initializeFAB() {

    const fab =
        document.querySelector(
            '.fab'
        );


    if (!fab) {
        return;
    }


    fab.addEventListener(
        'click',
        function () {

            window.location.href =
                '/register/';

        }
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        'keydown',
        function (event) {

            /*
             * Ctrl/Cmd + D
             * Theme
             */

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === 'd'
            ) {

                event.preventDefault();


                const themeButton =
                    document.querySelector(
                        '.theme-toggle'
                    );


                if (themeButton) {

                    themeButton.click();

                }

            }


            /*
             * Ctrl/Cmd + K
             * Search
             */

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === 'k'
            ) {

                event.preventDefault();


                const search =
                    document.querySelector(
                        '.search-input'
                    );


                if (search) {

                    search.focus();
                    search.select();

                }

            }


            /*
             * Escape
             */

            if (
                event.key === 'Escape'
            ) {

                if (
                    document.activeElement &&
                    typeof document.activeElement.blur ===
                    'function'
                ) {

                    document.activeElement.blur();

                }


                const sidebar =
                    document.querySelector(
                        '.sidebar'
                    );


                if (sidebar) {

                    sidebar.classList.remove(
                        'open'
                    );

                }

            }

        }
    );

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function startAutoRefresh() {

    stopAutoRefresh();


    DashboardApp.refreshTimer =
        setInterval(
            function () {

                if (
                    document.visibilityState ===
                    'visible'
                ) {

                    loadDashboardData(
                        false
                    );

                }

            },
            DashboardApp.refreshInterval
        );

}


function stopAutoRefresh() {

    if (
        DashboardApp.refreshTimer
    ) {

        clearInterval(
            DashboardApp.refreshTimer
        );


        DashboardApp.refreshTimer =
            null;

    }

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    'visibilitychange',
    function () {

        if (
            document.visibilityState ===
            'visible'
        ) {

            loadDashboardData(
                false
            );

        }

    }
);


/* =========================================================
   LOADING
   ========================================================= */

function showDashboardLoading() {

    document
        .querySelectorAll(
            '.stat-value'
        )
        .forEach(
            function (element) {

                element.classList.add(
                    'dashboard-loading'
                );

            }
        );


    if (
        !document.getElementById(
            'dashboardLoadingStyle'
        )
    ) {

        const style =
            document.createElement(
                'style'
            );


        style.id =
            'dashboardLoadingStyle';


        style.textContent = `

            .dashboard-loading {
                opacity: 0.45;
                position: relative;
            }

            .dashboard-loading::after {
                content: "";
                display: inline-block;
                width: 8px;
                height: 8px;
                margin-left: 6px;
                border-radius: 50%;
                border: 2px solid currentColor;
                border-right-color: transparent;
                animation: dashboardSpin .7s linear infinite;
            }

            @keyframes dashboardSpin {
                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes dashboardNotificationIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes dashboardNotificationOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }

                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }

        `;


        document.head.appendChild(
            style
        );

    }

}


function hideDashboardLoading() {

    document
        .querySelectorAll(
            '.dashboard-loading'
        )
        .forEach(
            function (element) {

                element.classList.remove(
                    'dashboard-loading'
                );

            }
        );

}


/* =========================================================
   ERROR
   ========================================================= */

function showDashboardError(message) {

    hideDashboardLoading();


    showNotification(
        message ||
        'Dashboard data load failed.',
        'error'
    );

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function createEmptyState(message) {

    return `

        <div
            class="dashboard-empty-state"
            style="
                padding: 20px;
                text-align: center;
                opacity: .65;
            "
        >

            ${escapeHTML(message)}

        </div>

    `;

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = 'success'
) {

    const old =
        document.querySelector(
            '.custom-notification'
        );


    if (old) {
        old.remove();
    }


    const colors = {

        success: '#16a34a',
        error: '#ba1a1a',
        warning: '#d97706',
        info: '#004ac6'

    };


    const notification =
        document.createElement(
            'div'
        );


    notification.className =
        'custom-notification';


    notification.style.cssText = `

        position: fixed;
        top: 80px;
        right: 20px;

        padding: 16px 24px;

        background:
            ${colors[type] || colors.success};

        color: white;

        border-radius: 12px;

        box-shadow:
            0 4px 12px rgba(0,0,0,.15);

        z-index: 99999;

        font-weight: 600;

        font-family:
            Inter,
            sans-serif;

        max-width: 400px;

        line-height: 1.6;

        animation:
            dashboardNotificationIn
            .3s ease;

    `;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(
        function () {

            if (
                notification.parentNode
            ) {

                notification.style.animation =
                    'dashboardNotificationOut .3s ease';


                setTimeout(
                    function () {

                        if (
                            notification.parentNode
                        ) {

                            notification.remove();

                        }

                    },
                    300
                );

            }

        },
        3000
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function getValue(
    object,
    keys,
    fallback = null
) {

    if (
        !object ||
        typeof object !== 'object'
    ) {

        return fallback;

    }


    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const key =
            keys[i];


        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            return object[key];

        }

    }


    return fallback;

}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        'en-IN',
        {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }
    ).format(number);

}


/* =========================================================
   ACTIVITY ICON
   ========================================================= */

function getActivityIcon(type) {

    type =
        String(
            type || ''
        ).toLowerCase();


    /*
     * Completed / Reports
     */

    if (
        type.includes('complete') ||
        type.includes('completed') ||
        type.includes('success') ||
        type.includes('report')
    ) {

        return 'check_circle';

    }


    /*
     * Patients
     */

    if (
        type.includes('patient') ||
        type.includes('register') ||
        type.includes('registration')
    ) {

        return 'person_add';

    }


    /*
     * Inventory
     */

    if (
        type.includes('warning') ||
        type.includes('inventory') ||
        type.includes('stock') ||
        type.includes('low')
    ) {

        return 'warning';

    }


    /*
     * Payment
     */

    if (
        type.includes('payment') ||
        type.includes('billing') ||
        type.includes('invoice')
    ) {

        return 'payments';

    }


    /*
     * Appointment
     */

    if (
        type.includes('appointment') ||
        type.includes('schedule')
    ) {

        return 'event';

    }


    return 'info';

}


/* =========================================================
   ACTIVITY ICON CLASS
   ========================================================= */

function getActivityIconClass(type) {

    type =
        String(
            type || ''
        ).toLowerCase();


    /*
     * Completed / Reports
     */

    if (
        type.includes('complete') ||
        type.includes('completed') ||
        type.includes('success') ||
        type.includes('report')
    ) {

        return 'bg-green-100 text-green-700';

    }


    /*
     * Patients
     */

    if (
        type.includes('patient') ||
        type.includes('register') ||
        type.includes('registration')
    ) {

        return 'bg-blue-100 text-blue-700';

    }


    /*
     * Inventory
     */

    if (
        type.includes('warning') ||
        type.includes('inventory') ||
        type.includes('stock') ||
        type.includes('low')
    ) {

        return 'bg-orange-100 text-orange-700';

    }


    /*
     * Payments
     */

    if (
        type.includes('payment') ||
        type.includes('billing') ||
        type.includes('invoice')
    ) {

        return 'bg-green-100 text-green-700';

    }


    /*
     * Appointments
     */

    if (
        type.includes('appointment') ||
        type.includes('schedule')
    ) {

        return 'bg-purple-100 text-purple-700';

    }


    return 'bg-gray-100 text-gray-700';

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


/* =========================================================
   CSRF HELPER
   ========================================================= */

function getCSRFToken() {

    const cookie =
        document.cookie
            .split('; ')
            .find(
                row =>
                    row.startsWith(
                        'csrftoken='
                    )
            );


    if (!cookie) {
        return '';
    }


    return decodeURIComponent(
        cookie.split('=')[1]
    );

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.DashboardApp =
    DashboardApp;


window.loadDashboardData =
    loadDashboardData;


window.showNotification =
    showNotification;


window.getCSRFToken =
    getCSRFToken;