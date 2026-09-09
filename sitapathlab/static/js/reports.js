/**
 * Sita Path Lab - Reports & Analytics
 * REAL Django Backend Connected
 */

let revenueChartInstance = null;
let deptVolumeChartInstance = null;

// ======================================================
// CSRF
// ======================================================

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (
                cookie.substring(0, name.length + 1) ===
                name + '='
            ) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}

// ======================================================
// API HELPER
// ======================================================

async function apiRequest(url, options = {}) {

    const response = await fetch(url, {
        credentials: 'same-origin',

        ...options,

        headers: {
            'Accept': 'application/json',
            ...(options.headers || {})
        }
    });

    const contentType =
        response.headers.get('content-type') || '';

    let data;

    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();

        throw new Error(
            `Server returned ${response.status}: ${text.substring(0, 200)}`
        );
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            `Server returned ${response.status}`
        );
    }

    return data;
}

// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const savedTheme =
            localStorage.getItem('theme');

        if (savedTheme === 'dark') {

            document.body.classList.add('dark');

            const icon =
                document.querySelector(
                    '.icon-btn .material-symbols-outlined'
                );

            if (icon) {
                icon.textContent = 'light_mode';
            }
        }

        fetchAnalyticsData();
    }
);

// ======================================================
// THEME
// ======================================================

function toggleTheme() {

    document.body.classList.toggle('dark');

    const isDark =
        document.body.classList.contains('dark');

    localStorage.setItem(
        'theme',
        isDark ? 'dark' : 'light'
    );

    const icon =
        document.querySelector(
            '.icon-btn .material-symbols-outlined'
        );

    if (icon) {

        icon.textContent =
            isDark
                ? 'light_mode'
                : 'contrast';
    }

    updateChartColors(isDark);
}

// ======================================================
// FETCH REAL ANALYTICS
// ======================================================

async function fetchAnalyticsData() {

    try {

        const data =
            await apiRequest(
                '/api/analytics/data/'
            );

        if (data.status !== 'success') {

            throw new Error(
                data.message ||
                'Analytics data could not be loaded.'
            );
        }

        updateStatistics(data);

        initCharts(
            normalizeRevenueData(data.revenue),
            normalizeDepartmentData(data.department)
        );

        updateTAT(data);

    } catch (error) {

        console.error(
            'Analytics API Error:',
            error
        );

        showNotification(
            error.message ||
            'Unable to load analytics data.',
            'error'
        );
    }
}

// ======================================================
// NORMALIZE REVENUE
// ======================================================

function normalizeRevenueData(data) {

    if (!data) {
        return {
            labels: [],
            data: []
        };
    }

    if (
        Array.isArray(data.labels) &&
        Array.isArray(data.data)
    ) {

        return {
            labels: data.labels,
            data: data.data.map(Number)
        };
    }

    if (Array.isArray(data)) {

        return {
            labels: data.map(
                item =>
                    item.label ||
                    item.month ||
                    item.date ||
                    ''
            ),

            data: data.map(
                item =>
                    Number(
                        item.value ||
                        item.revenue ||
                        item.amount ||
                        0
                    )
            )
        };
    }

    return {
        labels: [],
        data: []
    };
}

// ======================================================
// NORMALIZE DEPARTMENT
// ======================================================

function normalizeDepartmentData(data) {

    if (!data) {

        return {
            labels: [],
            data: []
        };
    }

    if (
        Array.isArray(data.labels) &&
        Array.isArray(data.data)
    ) {

        return {
            labels: data.labels,
            data: data.data.map(Number)
        };
    }

    if (Array.isArray(data)) {

        return {

            labels: data.map(
                item =>
                    item.department ||
                    item.name ||
                    item.label ||
                    'Unknown'
            ),

            data: data.map(
                item =>
                    Number(
                        item.volume ||
                        item.count ||
                        item.value ||
                        0
                    )
            )
        };
    }

    return {
        labels: [],
        data: []
    };
}

// ======================================================
// REAL STATISTICS
// ======================================================

function updateStatistics(data) {

    // FIX: the Django endpoint (/api/analytics/data/ -> get_analytics_data)
    // nests every number inside a "summary" object, e.g.
    // { status, summary: { total_patients, monthly_revenue, ... }, revenue: {...}, department: {...} }
    // This function used to look ONLY for flat top-level keys like
    // data.total_revenue / data.patient_count, which never existed in
    // the actual response. Because of that the `!== undefined` guard
    // below always failed, the stat-card <span> text was never
    // touched, and the page kept showing whatever placeholder text
    // ("Loading...") was already in the HTML - forever. Falling back
    // to data.summary.* fixes that, while still supporting flat keys
    // if a future/different endpoint ever sends them directly.

    const summary =
        data.summary || {};

    const revenueElement =
        document.querySelector(
            '.stat-card:nth-child(1) .stat-value'
        );

    const patientElement =
        document.querySelector(
            '.stat-card:nth-child(2) .stat-value'
        );

    const revenueTrend =
        document.querySelector(
            '.stat-card:nth-child(1) .stat-trend'
        );

    const patientTrend =
        document.querySelector(
            '.stat-card:nth-child(2) .stat-trend'
        );

    // Revenue

    const revenue =
        data.total_revenue ??
        data.revenue_total ??
        data.totalRevenue ??
        summary.monthly_revenue ??
        summary.monthly_report_revenue;

    if (
        revenue !== undefined &&
        revenueElement
    ) {

        revenueElement.textContent =
            formatCurrency(revenue);
    }

    // Patient count

    const patients =
        data.patient_volume ??
        data.patient_count ??
        data.total_patients ??
        data.patients ??
        summary.total_patients;

    if (
        patients !== undefined &&
        patientElement
    ) {

        patientElement.textContent =
            Number(patients).toLocaleString('en-IN');
    }

    // Revenue trend
    // Note: get_analytics_data doesn't currently calculate a
    // growth/trend percentage (unlike the dashboard endpoint, which
    // has patients_trend). So this stays untouched until the backend
    // adds one - it's a missing feature, not a bug.

    const revenueGrowth =
        data.revenue_growth ??
        data.revenue_change ??
        data.revenue_percentage ??
        summary.revenue_growth;

    if (
        revenueGrowth !== undefined &&
        revenueTrend
    ) {

        setTrend(
            revenueTrend,
            revenueGrowth
        );
    }

    // Patient trend

    const patientGrowth =
        data.patient_growth ??
        data.patient_change ??
        data.patient_percentage ??
        summary.patient_growth;

    if (
        patientGrowth !== undefined &&
        patientTrend
    ) {

        setTrend(
            patientTrend,
            patientGrowth
        );
    }
}

// ======================================================
// CURRENCY FORMAT
// ======================================================

function formatCurrency(value) {

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return '₹0';
    }

    if (number >= 10000000) {

        return (
            '₹' +
            (number / 10000000)
                .toFixed(2) +
            'Cr'
        );
    }

    if (number >= 100000) {

        return (
            '₹' +
            (number / 100000)
                .toFixed(2) +
            'L'
        );
    }

    if (number >= 1000) {

        return (
            '₹' +
            (number / 1000)
                .toFixed(2) +
            'K'
        );
    }

    return (
        '₹' +
        number.toLocaleString('en-IN')
    );
}

// ======================================================
// TREND
// ======================================================

function setTrend(element, value) {

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return;
    }

    const sign =
        number >= 0 ? '+' : '';

    element.innerHTML = `
        <span class="material-symbols-outlined">
            ${number >= 0 ? 'trending_up' : 'trending_down'}
        </span>
        ${sign}${number.toFixed(1)}% from previous period
    `;

    element.classList.remove(
        'up',
        'down'
    );

    element.classList.add(
        number >= 0 ? 'up' : 'down'
    );
}

// ======================================================
// TAT
// ======================================================

function updateTAT(data) {

    const tat =
        data.tat ||
        data.tat_performance ||
        data.turnaround_time;

    if (!Array.isArray(tat)) {
        return;
    }

    const list =
        document.querySelector('.tat-list');

    if (!list) {
        return;
    }

    list.innerHTML = '';

    tat.forEach(
        (item, index) => {

            const name =
                item.name ||
                item.test ||
                item.department ||
                'Test';

            const hours =
                Number(
                    item.hours ||
                    item.average_hours ||
                    item.avg_hours ||
                    0
                );

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            item.percentage ||
                            item.performance ||
                            0
                        )
                    )
                );

            const colors = [
                'green',
                'purple',
                'blue',
                'red'
            ];

            const color =
                colors[index % colors.length];

            const element =
                document.createElement('div');

            element.className =
                'tat-item';

            element.innerHTML = `
                <div class="tat-header">
                    <span class="tat-name">
                        ${escapeHtml(name)}
                    </span>

                    <span class="tat-time">
                        Avg: ${hours} Hrs
                    </span>
                </div>

                <div class="tat-bar">
                    <div
                        class="tat-fill ${color}"
                        style="width:${percentage}%"
                    ></div>
                </div>
            `;

            list.appendChild(element);
        }
    );
}

// ======================================================
// CHARTS
// ======================================================

function initCharts(
    revenueData,
    deptData
) {

    if (typeof Chart === 'undefined') {

        showNotification(
            'Chart.js is not loaded.',
            'error'
        );

        return;
    }

    const revenueCanvas =
        document.getElementById(
            'revenueChart'
        );

    const departmentCanvas =
        document.getElementById(
            'deptVolumeChart'
        );

    if (
        !revenueCanvas ||
        !departmentCanvas
    ) {
        return;
    }

    const isDark =
        document.body.classList.contains('dark');

    const textColor =
        isDark
            ? '#e8e8f0'
            : '#191b23';

    const gridColor =
        isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.05)';

    // Revenue

    const ctxRevenue =
        revenueCanvas.getContext('2d');

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    revenueChartInstance =
        new Chart(
            ctxRevenue,
            {
                type: 'line',

                data: {

                    labels:
                        revenueData.labels,

                    datasets: [
                        {
                            label:
                                'Revenue',

                            data:
                                revenueData.data,

                            borderColor:
                                '#004ac6',

                            backgroundColor:
                                isDark
                                    ? 'rgba(100,94,251,0.15)'
                                    : 'rgba(0,74,198,0.10)',

                            tension: 0.4,

                            fill: true,

                            pointRadius: 4,

                            pointHoverRadius: 6,

                            pointBackgroundColor:
                                '#004ac6',

                            pointBorderColor:
                                '#ffffff',

                            pointBorderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            '₹' +
                                            Number(
                                                context.parsed.y
                                            ).toLocaleString(
                                                'en-IN'
                                            )
                                        );
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            grid: {
                                color:
                                    gridColor
                            },

                            ticks: {

                                color:
                                    textColor,

                                callback:
                                    function (
                                        value
                                    ) {

                                        return (
                                            '₹' +
                                            Number(
                                                value
                                            ).toLocaleString(
                                                'en-IN'
                                            )
                                        );
                                    }
                            }
                        },

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {
                                color:
                                    textColor
                            }
                        }
                    }
                }
            }
        );

    // Department

    const ctxDept =
        departmentCanvas.getContext('2d');

    if (deptVolumeChartInstance) {
        deptVolumeChartInstance.destroy();
    }

    deptVolumeChartInstance =
        new Chart(
            ctxDept,
            {
                type: 'doughnut',

                data: {

                    labels:
                        deptData.labels,

                    datasets: [
                        {
                            data:
                                deptData.data,

                            backgroundColor: [
                                '#004ac6',
                                '#645efb',
                                '#bc4800',
                                '#ba1a1a',
                                '#00897b',
                                '#7b1fa2'
                            ],

                            hoverOffset: 8,

                            borderColor:
                                isDark
                                    ? '#1a1c26'
                                    : '#ffffff',

                            borderWidth: 3
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: '70%',

                    plugins: {

                        legend: {

                            position: 'bottom',

                            labels: {

                                usePointStyle:
                                    true,

                                padding: 20,

                                font: {
                                    size: 12,
                                    family: 'Inter',
                                    weight: '500'
                                },

                                color:
                                    textColor
                            }
                        }
                    }
                }
            }
        );
}

// ======================================================
// UPDATE CHART COLORS
// ======================================================

function updateChartColors(isDark) {

    const textColor =
        isDark
            ? '#e8e8f0'
            : '#191b23';

    const gridColor =
        isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.05)';

    const bgColor =
        isDark
            ? 'rgba(100,94,251,0.15)'
            : 'rgba(0,74,198,0.1)';

    if (revenueChartInstance) {

        revenueChartInstance
            .data
            .datasets[0]
            .backgroundColor =
                bgColor;

        revenueChartInstance
            .options
            .scales
            .y
            .grid
            .color =
                gridColor;

        revenueChartInstance
            .options
            .scales
            .y
            .ticks
            .color =
                textColor;

        revenueChartInstance
            .options
            .scales
            .x
            .ticks
            .color =
                textColor;

        revenueChartInstance.update();
    }

    if (deptVolumeChartInstance) {

        deptVolumeChartInstance
            .options
            .plugins
            .legend
            .labels
            .color =
                textColor;

        deptVolumeChartInstance
            .data
            .datasets[0]
            .borderColor =
                isDark
                    ? '#1a1c26'
                    : '#ffffff';

        deptVolumeChartInstance.update();
    }
}

// ======================================================
// FILTERS
// ======================================================

async function applyFilters() {

    const dateRange =
        document.getElementById(
            'dateRange'
        )?.value || '';

    const department =
        document.getElementById(
            'department'
        )?.value || '';

    const status =
        document.getElementById(
            'status'
        )?.value || '';

    showNotification(
        'Loading filtered data...',
        'info'
    );

    try {

        const params =
            new URLSearchParams({
                range: dateRange,
                dept: department,
                status: status
            });

        const data =
            await apiRequest(
                `/api/analytics/data/?${params.toString()}`
            );

        if (data.status !== 'success') {

            throw new Error(
                data.message ||
                'Filter request failed.'
            );
        }

        updateStatistics(data);

        initCharts(
            normalizeRevenueData(
                data.revenue
            ),
            normalizeDepartmentData(
                data.department
            )
        );

        updateTAT(data);

        showNotification(
            'Filters applied successfully.',
            'success'
        );

    } catch (error) {

        console.error(
            'Filter error:',
            error
        );

        showNotification(
            error.message ||
            'Failed to load filtered data.',
            'error'
        );
    }
}

// ======================================================
// REPORT REQUEST
// ======================================================

async function sendReportRequest(
    reportName,
    actionType
) {

    const csrftoken =
        getCookie('csrftoken');

    try {

        const data =
            await apiRequest(
                '/api/analytics/report/',
                {
                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'X-CSRFToken':
                            csrftoken || ''
                    },

                    body:
                        JSON.stringify({

                            reportName:
                                reportName,

                            actionType:
                                actionType
                        })
                }
            );

        if (data.status !== 'success') {

            throw new Error(
                data.message ||
                'Report processing failed.'
            );
        }

        showNotification(
            `${reportName} processed successfully.`,
            'success'
        );

        if (data.download_url) {

            window.location.href =
                data.download_url;
        }

    } catch (error) {

        console.error(
            'Report request error:',
            error
        );

        showNotification(
            error.message ||
            'Server communication error.',
            'error'
        );
    }
}

// ======================================================
// REPORT ACTIONS
// ======================================================

function generateReport(reportName) {

    showNotification(
        `Generating ${reportName}...`,
        'info'
    );

    sendReportRequest(
        reportName,
        'generate'
    );
}

function downloadReport(reportName) {

    showNotification(
        `Preparing ${reportName}...`,
        'info'
    );

    sendReportRequest(
        reportName,
        'download'
    );
}

function exportExcel() {

    showNotification(
        'Preparing Excel export...',
        'info'
    );

    sendReportRequest(
        'Excel Sheet Report',
        'excel'
    );
}

function exportPDF() {

    showNotification(
        'Preparing PDF export...',
        'info'
    );

    sendReportRequest(
        'PDF Document Report',
        'pdf'
    );
}

// ======================================================
// NOTIFICATION
// ======================================================

function showNotification(
    message,
    type = 'success'
) {

    const existing =
        document.querySelector(
            '.custom-notification'
        );

    if (existing) {
        existing.remove();
    }

    const notification =
        document.createElement('div');

    notification.className =
        'custom-notification';

    const colors = {

        success: '#16a34a',

        error: '#ba1a1a',

        warning: '#d97706',

        info: '#004ac6'
    };

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${colors[type] || colors.success};
        color: white;
        border-radius: 12px;
        z-index: 99999;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        max-width: 420px;
        line-height: 1.6;
        box-shadow: 0 10px 30px rgba(0,0,0,.20);
    `;

    notification.textContent =
        message;

    document.body.appendChild(
        notification
    );

    setTimeout(
        function () {

            if (
                notification &&
                notification.parentNode
            ) {

                notification.remove();
            }

        },
        4000
    );
}

// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ======================================================
// KEYBOARD SHORTCUTS
// ======================================================

document.addEventListener(
    'keydown',
    function (e) {

        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === 'd'
        ) {

            e.preventDefault();

            toggleTheme();
        }

        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === 'f'
        ) {

            e.preventDefault();

            const filter =
                document.querySelector(
                    '.filter-select'
                );

            if (filter) {
                filter.focus();
            }
        }
    }
);

// ======================================================
// RESIZE
// ======================================================

let resizeTimeout;

window.addEventListener(
    'resize',
    function () {

        clearTimeout(
            resizeTimeout
        );

        resizeTimeout =
            setTimeout(
                function () {

                    if (
                        revenueChartInstance
                    ) {
                        revenueChartInstance.resize();
                    }

                    if (
                        deptVolumeChartInstance
                    ) {
                        deptVolumeChartInstance.resize();
                    }

                },
                250
            );
    }
);

// ======================================================
// CONSOLE
// ======================================================

console.log(
    '📊 Sita Path Lab Reports & Analytics - Django Connected'
);

// ======================================================
// MODULE EXPORT
// ======================================================

if (
    typeof module !== 'undefined' &&
    module.exports
) {

    module.exports = {

        toggleTheme,

        applyFilters,

        generateReport,

        downloadReport,

        exportExcel,

        exportPDF
    };
}