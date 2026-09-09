/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN DASHBOARD
 *
 * Production-level dashboard controller
 * ============================================================
 */

"use strict";


/* ============================================================
   CONFIGURATION
============================================================ */

const DashboardConfig = {

    defaultRange: "7d",

    apiUrl: null,

    currency: "INR",

    locale: "en-IN",

    refreshInterval: 60000,

    requestTimeout: 15000,

    animationDuration: 650

};


/* ============================================================
   STATE
============================================================ */

const DashboardState = {

    range: DashboardConfig.defaultRange,

    revenueRange: "7d",

    isLoading: false,

    revenueChart: null,

    appointmentChart: null,

    dashboardData: null,

    abortController: null,

    refreshTimer: null

};


/* ============================================================
   DOM
============================================================ */

const DashboardDOM = {};


function cacheDOM() {

    DashboardDOM.page =
        document.getElementById("dashboardPage");

    if (!DashboardDOM.page) {
        return;
    }

    DashboardDOM.refreshButton =
        document.getElementById("refreshDashboard");

    DashboardDOM.dateRange =
        document.getElementById("dateRange");

    DashboardDOM.alert =
        document.getElementById("dashboardAlert");

    DashboardDOM.alertMessage =
        document.getElementById("dashboardAlertMessage");

    DashboardDOM.closeAlert =
        document.getElementById("closeDashboardAlert");

    DashboardDOM.lastUpdated =
        document.getElementById("lastUpdated");


    /* KPI */

    DashboardDOM.totalRevenue =
        document.getElementById("totalRevenue");

    DashboardDOM.revenueTrend =
        document.getElementById("revenueTrend");

    DashboardDOM.activeVendors =
        document.getElementById("activeVendors");

    DashboardDOM.vendorsTrend =
        document.getElementById("vendorsTrend");

    DashboardDOM.totalPatients =
        document.getElementById("totalPatients");

    DashboardDOM.patientsTrend =
        document.getElementById("patientsTrend");

    DashboardDOM.totalAppointments =
        document.getElementById("totalAppointments");

    DashboardDOM.appointmentsTrend =
        document.getElementById("appointmentsTrend");

    DashboardDOM.totalOrders =
        document.getElementById("totalOrders");

    DashboardDOM.ordersTrend =
        document.getElementById("ordersTrend");

    DashboardDOM.pendingReports =
        document.getElementById("pendingReports");


    /* Charts */

    DashboardDOM.revenueCanvas =
        document.getElementById("revenueChart");

    DashboardDOM.appointmentCanvas =
        document.getElementById("appointmentChart");

    DashboardDOM.revenueLoading =
        document.getElementById("revenueChartLoading");

    DashboardDOM.revenueEmpty =
        document.getElementById("revenueChartEmpty");

    DashboardDOM.appointmentLoading =
        document.getElementById("appointmentChartLoading");

    DashboardDOM.appointmentEmpty =
        document.getElementById("appointmentChartEmpty");


    /* Lists */

    DashboardDOM.activityList =
        document.getElementById("recentActivityList");

    DashboardDOM.vendorsList =
        document.getElementById("topVendorsList");
}


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    cacheDOM();

    if (!DashboardDOM.page) {
        return;
    }

    DashboardConfig.apiUrl =
        DashboardDOM.page.dataset.apiUrl ||
        "/api/superadmin/dashboard/";

    bindEvents();

    loadDashboard();

    startAutoRefresh();

});


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    DashboardDOM.refreshButton?.addEventListener(
        "click",
        () => loadDashboard(true)
    );


    DashboardDOM.dateRange?.addEventListener(
        "change",
        event => {

            DashboardState.range =
                event.target.value;

            loadDashboard();

        }
    );


    DashboardDOM.closeAlert?.addEventListener(
        "click",
        hideAlert
    );


    document
        .querySelectorAll("[data-chart-range='revenue']")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const range =
                        button.dataset.range;

                    if (!range) {
                        return;
                    }

                    DashboardState.revenueRange =
                        range;

                    document
                        .querySelectorAll(
                            "[data-chart-range='revenue']"
                        )
                        .forEach(item =>
                            item.classList.remove("active")
                        );

                    button.classList.add("active");

                    renderRevenueChart(
                        DashboardState.dashboardData?.revenue
                    );

                }
            );

        });


    window.addEventListener(
        "beforeunload",
        stopAutoRefresh
    );

}


/* ============================================================
   LOAD DASHBOARD
============================================================ */

async function loadDashboard(showRefreshState = false) {

    if (DashboardState.isLoading) {
        return;
    }

    DashboardState.isLoading = true;

    if (showRefreshState) {
        setRefreshing(true);
    }

    hideAlert();

    showChartLoading();


    try {

        const data =
            await fetchDashboardData(
                DashboardState.range
            );


        DashboardState.dashboardData = normalizeDashboardData(data);


        updateKPIs(
            DashboardState.dashboardData
        );


        renderRevenueChart(
            DashboardState.dashboardData.revenue
        );


        renderAppointmentChart(
            DashboardState.dashboardData.appointments
        );


        renderRecentActivity(
            DashboardState.dashboardData.activities
        );


        renderTopVendors(
            DashboardState.dashboardData.vendors
        );


        updateLastUpdated();


    } catch (error) {

        console.error(
            "[Dashboard] Load error:",
            error
        );

        showAlert(
            getErrorMessage(error)
        );

        showEmptyCharts();


    } finally {

        DashboardState.isLoading = false;

        setRefreshing(false);

    }

}


/* ============================================================
   FETCH API
============================================================ */

async function fetchDashboardData(range) {

    if (DashboardState.abortController) {

        DashboardState.abortController.abort();

    }


    DashboardState.abortController =
        new AbortController();


    const timeout =
        setTimeout(
            () =>
                DashboardState.abortController.abort(),
            DashboardConfig.requestTimeout
        );


    try {

        const url =
            new URL(
                DashboardConfig.apiUrl,
                window.location.origin
            );


        url.searchParams.set(
            "range",
            range
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    },

                    credentials: "same-origin",

                    signal:
                        DashboardState.abortController.signal
                }
            );


        if (!response.ok) {

            throw new Error(
                `Dashboard API returned ${response.status}`
            );

        }


        const contentType =
            response.headers.get("content-type") || "";


        if (!contentType.includes("application/json")) {

            throw new Error(
                "Dashboard API did not return JSON."
            );

        }


        return await response.json();


    } finally {

        clearTimeout(timeout);

    }

}


/* ============================================================
   NORMALIZE API DATA
============================================================ */

function normalizeDashboardData(data) {

    const source =
        data?.data ||
        data?.result ||
        data ||
        {};


    return {

        stats: {

            revenue:
                Number(
                    source.stats?.revenue ??
                    source.revenue ??
                    0
                ),

            revenueChange:
                Number(
                    source.stats?.revenue_change ??
                    source.revenue_change ??
                    0
                ),

            vendors:
                Number(
                    source.stats?.vendors ??
                    source.active_vendors ??
                    0
                ),

            vendorsChange:
                Number(
                    source.stats?.vendors_change ??
                    source.vendors_change ??
                    0
                ),

            patients:
                Number(
                    source.stats?.patients ??
                    source.total_patients ??
                    0
                ),

            patientsChange:
                Number(
                    source.stats?.patients_change ??
                    source.patients_change ??
                    0
                ),

            appointments:
                Number(
                    source.stats?.appointments ??
                    source.total_appointments ??
                    0
                ),

            appointmentsChange:
                Number(
                    source.stats?.appointments_change ??
                    source.appointments_change ??
                    0
                ),

            orders:
                Number(
                    source.stats?.orders ??
                    source.total_orders ??
                    0
                ),

            ordersChange:
                Number(
                    source.stats?.orders_change ??
                    source.orders_change ??
                    0
                ),

            pendingReports:
                Number(
                    source.stats?.pending_reports ??
                    source.pending_reports ??
                    0
                )

        },


        revenue:
            normalizeChartData(
                source.revenue_chart ||
                source.revenue ||
                []
            ),


        appointments:
            normalizeChartData(
                source.appointment_chart ||
                source.appointments_chart ||
                source.appointments ||
                []
            ),


        activities:
            Array.isArray(
                source.activities
            )
                ? source.activities
                : [],


        vendors:
            Array.isArray(
                source.top_vendors
            )
                ? source.top_vendors
                : []

    };

}


/* ============================================================
   CHART DATA NORMALIZATION
============================================================ */

function normalizeChartData(data) {

    if (!Array.isArray(data)) {
        return [];
    }


    return data.map(item => {

        if (typeof item === "number") {

            return {
                label: "",
                value: item
            };

        }


        return {

            label:
                item.label ??
                item.name ??
                item.month ??
                item.date ??
                "",

            value:
                Number(
                    item.value ??
                    item.total ??
                    item.amount ??
                    0
                )

        };

    });

}


/* ============================================================
   UPDATE KPI
============================================================ */

function updateKPIs(data) {

    const stats =
        data.stats;


    animateNumber(
        DashboardDOM.totalRevenue,
        stats.revenue,
        formatCurrency
    );


    animateNumber(
        DashboardDOM.activeVendors,
        stats.vendors,
        formatNumber
    );


    animateNumber(
        DashboardDOM.totalPatients,
        stats.patients,
        formatNumber
    );


    animateNumber(
        DashboardDOM.totalAppointments,
        stats.appointments,
        formatNumber
    );


    animateNumber(
        DashboardDOM.totalOrders,
        stats.orders,
        formatNumber
    );


    animateNumber(
        DashboardDOM.pendingReports,
        stats.pendingReports,
        formatNumber
    );


    updateTrend(
        DashboardDOM.revenueTrend,
        stats.revenueChange
    );


    updateTrend(
        DashboardDOM.vendorsTrend,
        stats.vendorsChange
    );


    updateTrend(
        DashboardDOM.patientsTrend,
        stats.patientsChange
    );


    updateTrend(
        DashboardDOM.appointmentsTrend,
        stats.appointmentsChange
    );


    updateTrend(
        DashboardDOM.ordersTrend,
        stats.ordersChange
    );

}


/* ============================================================
   NUMBER ANIMATION
============================================================ */

function animateNumber(
    element,
    target,
    formatter
) {

    if (!element) {
        return;
    }


    const safeTarget =
        Number.isFinite(Number(target))
            ? Number(target)
            : 0;


    const start =
        Number(element.dataset.value || 0);


    const duration =
        DashboardConfig.animationDuration;


    const startTime =
        performance.now();


    function update(currentTime) {

        const elapsed =
            currentTime - startTime;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const current =
            start +
            (safeTarget - start) * eased;


        element.textContent =
            formatter(current);


        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            element.dataset.value =
                String(safeTarget);

        }

    }


    requestAnimationFrame(update);

}


/* ============================================================
   TREND
============================================================ */

function updateTrend(
    element,
    value
) {

    if (!element) {
        return;
    }


    const percentage =
        Number(value) || 0;


    element.classList.remove(
        "trend-positive",
        "trend-negative",
        "trend-neutral"
    );


    if (percentage > 0) {

        element.classList.add(
            "trend-positive"
        );

        element.innerHTML =
            `<span class="trend-arrow">↑</span>
             ${escapeHTML(formatPercentage(percentage))}`;

    } else if (percentage < 0) {

        element.classList.add(
            "trend-negative"
        );

        element.innerHTML =
            `<span class="trend-arrow">↓</span>
             ${escapeHTML(formatPercentage(Math.abs(percentage)))}`;

    } else {

        element.classList.add(
            "trend-neutral"
        );

        element.innerHTML =
            `<span class="trend-arrow">→</span> 0%`;

    }

}


/* ============================================================
   REVENUE CHART
============================================================ */

function renderRevenueChart(data) {

    if (!DashboardDOM.revenueCanvas) {
        return;
    }


    hideElement(
        DashboardDOM.revenueLoading
    );


    if (!data?.length) {

        showElement(
            DashboardDOM.revenueEmpty
        );

        destroyChart(
            "revenueChart"
        );

        return;

    }


    hideElement(
        DashboardDOM.revenueEmpty
    );


    const canvas =
        DashboardDOM.revenueCanvas;


    const context =
        canvas.getContext("2d");


    destroyChart(
        "revenueChart"
    );


    const gradient =
        context.createLinearGradient(
            0,
            0,
            0,
            300
        );


    gradient.addColorStop(
        0,
        "rgba(37, 99, 235, 0.18)"
    );


    gradient.addColorStop(
        1,
        "rgba(37, 99, 235, 0)"
    );


    DashboardState.revenueChart =
        new SimpleLineChart(
            canvas,
            data,
            {
                lineColor: "#2563eb",
                fillGradient: gradient,
                valueFormatter: formatCompactCurrency
            }
        );

}


/* ============================================================
   APPOINTMENT CHART
============================================================ */

function renderAppointmentChart(data) {

    if (!DashboardDOM.appointmentCanvas) {
        return;
    }


    hideElement(
        DashboardDOM.appointmentLoading
    );


    if (!data?.length) {

        showElement(
            DashboardDOM.appointmentEmpty
        );

        destroyChart(
            "appointmentChart"
        );

        return;

    }


    hideElement(
        DashboardDOM.appointmentEmpty
    );


    destroyChart(
        "appointmentChart"
    );


    DashboardState.appointmentChart =
        new SimpleBarChart(
            DashboardDOM.appointmentCanvas,
            data
        );

}


/* ============================================================
   SIMPLE LINE CHART
   Dependency-free production-friendly canvas chart
============================================================ */

class SimpleLineChart {

    constructor(
        canvas,
        data,
        options = {}
    ) {

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

        this.data =
            data || [];

        this.options = options;

        this.dpr =
            window.devicePixelRatio || 1;

        this.resize();

        this.draw();

        this.resizeHandler =
            () => {

                this.resize();

                this.draw();

            };

        window.addEventListener(
            "resize",
            this.resizeHandler
        );

    }


    resize() {

        const rect =
            this.canvas.getBoundingClientRect();


        this.width =
            Math.max(
                rect.width,
                100
            );


        this.height =
            Math.max(
                rect.height,
                100
            );


        this.canvas.width =
            this.width * this.dpr;


        this.canvas.height =
            this.height * this.dpr;


        this.ctx.setTransform(
            this.dpr,
            0,
            0,
            this.dpr,
            0,
            0
        );

    }


    draw() {

        const ctx =
            this.ctx;


        const width =
            this.width;


        const height =
            this.height;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        const padding = {

            top: 15,

            right: 18,

            bottom: 32,

            left: 45

        };


        const chartWidth =
            width -
            padding.left -
            padding.right;


        const chartHeight =
            height -
            padding.top -
            padding.bottom;


        const values =
            this.data.map(
                item =>
                    Number(item.value) || 0
            );


        const max =
            Math.max(
                ...values,
                1
            );


        const min =
            Math.min(
                ...values,
                0
            );


        const range =
            max - min || 1;


        /* Grid */

        ctx.strokeStyle =
            getCSSColor(
                "--dashboard-border",
                "#e6eaf0"
            );

        ctx.lineWidth = 1;


        const gridLines = 4;


        for (
            let i = 0;
            i <= gridLines;
            i++
        ) {

            const y =
                padding.top +
                (
                    chartHeight *
                    i /
                    gridLines
                );


            ctx.beginPath();

            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width -
                padding.right,
                y
            );

            ctx.stroke();


            const labelValue =
                max -
                (
                    range *
                    i /
                    gridLines
                );


            ctx.fillStyle =
                getCSSColor(
                    "--dashboard-soft",
                    "#9aa3b2"
                );

            ctx.font =
                "10px Inter, Arial, sans-serif";

            ctx.textAlign =
                "right";

            ctx.fillText(
                this.options.valueFormatter
                    ? this.options.valueFormatter(
                        labelValue
                    )
                    : String(
                        Math.round(
                            labelValue
                        )
                    ),
                padding.left - 8,
                y + 3
            );

        }


        const points =
            this.data.map(
                (item, index) => {

                    const x =
                        padding.left +
                        (
                            this.data.length === 1
                                ? chartWidth / 2
                                : chartWidth *
                                  index /
                                  (this.data.length - 1)
                        );


                    const y =
                        padding.top +
                        chartHeight -
                        (
                            (
                                (
                                    Number(item.value) ||
                                    0
                                ) -
                                min
                            ) /
                            range
                        ) *
                        chartHeight;


                    return {
                        x,
                        y,
                        label:
                            item.label || "",
                        value:
                            Number(item.value) || 0
                    };

                }
            );


        /* Area */

        if (this.options.fillGradient) {

            ctx.beginPath();

            points.forEach(
                (point, index) => {

                    if (index === 0) {

                        ctx.moveTo(
                            point.x,
                            point.y
                        );

                    } else {

                        ctx.lineTo(
                            point.x,
                            point.y
                        );

                    }

                }
            );


            ctx.lineTo(
                points[points.length - 1].x,
                padding.top + chartHeight
            );


            ctx.lineTo(
                points[0].x,
                padding.top + chartHeight
            );


            ctx.closePath();

            ctx.fillStyle =
                this.options.fillGradient;

            ctx.fill();

        }


        /* Line */

        ctx.beginPath();


        points.forEach(
            (point, index) => {

                if (index === 0) {

                    ctx.moveTo(
                        point.x,
                        point.y
                    );

                } else {

                    ctx.lineTo(
                        point.x,
                        point.y
                    );

                }

            }
        );


        ctx.strokeStyle =
            this.options.lineColor ||
            "#2563eb";

        ctx.lineWidth = 2.2;

        ctx.lineJoin = "round";

        ctx.lineCap = "round";

        ctx.stroke();


        /* Points */

        points.forEach(
            point => {

                ctx.beginPath();

                ctx.arc(
                    point.x,
                    point.y,
                    3,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    this.options.lineColor ||
                    "#2563eb";

                ctx.fill();

            }
        );


        /* Labels */

        ctx.fillStyle =
            getCSSColor(
                "--dashboard-soft",
                "#9aa3b2"
            );

        ctx.font =
            "10px Inter, Arial, sans-serif";

        ctx.textAlign =
            "center";


        const maxLabels =
            7;


        const step =
            Math.max(
                1,
                Math.ceil(
                    points.length /
                    maxLabels
                )
            );


        points.forEach(
            (point, index) => {

                if (
                    index % step !== 0 &&
                    index !== points.length - 1
                ) {
                    return;
                }


                ctx.fillText(
                    truncate(
                        point.label,
                        10
                    ),
                    point.x,
                    height - 10
                );

            }
        );

    }


    destroy() {

        if (this.resizeHandler) {

            window.removeEventListener(
                "resize",
                this.resizeHandler
            );

        }

        this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );

    }

}


/* ============================================================
   SIMPLE BAR CHART
============================================================ */

class SimpleBarChart {

    constructor(
        canvas,
        data
    ) {

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

        this.data =
            data || [];

        this.dpr =
            window.devicePixelRatio || 1;

        this.resize();

        this.draw();

        this.resizeHandler =
            () => {

                this.resize();

                this.draw();

            };

        window.addEventListener(
            "resize",
            this.resizeHandler
        );

    }


    resize() {

        const rect =
            this.canvas.getBoundingClientRect();


        this.width =
            Math.max(
                rect.width,
                100
            );


        this.height =
            Math.max(
                rect.height,
                100
            );


        this.canvas.width =
            this.width * this.dpr;


        this.canvas.height =
            this.height * this.dpr;


        this.ctx.setTransform(
            this.dpr,
            0,
            0,
            this.dpr,
            0,
            0
        );

    }


    draw() {

        const ctx =
            this.ctx;


        const width =
            this.width;


        const height =
            this.height;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        const padding = {

            top: 15,

            right: 15,

            bottom: 34,

            left: 35

        };


        const chartWidth =
            width -
            padding.left -
            padding.right;


        const chartHeight =
            height -
            padding.top -
            padding.bottom;


        const values =
            this.data.map(
                item =>
                    Number(item.value) || 0
            );


        const max =
            Math.max(
                ...values,
                1
            );


        /* Grid */

        ctx.strokeStyle =
            getCSSColor(
                "--dashboard-border",
                "#e6eaf0"
            );

        ctx.lineWidth = 1;


        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const y =
                padding.top +
                chartHeight *
                i /
                4;


            ctx.beginPath();

            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width -
                padding.right,
                y
            );

            ctx.stroke();

        }


        const slotWidth =
            chartWidth /
            Math.max(
                this.data.length,
                1
            );


        const barWidth =
            Math.min(
                30,
                slotWidth * 0.52
            );


        this.data.forEach(
            (item, index) => {

                const value =
                    Number(item.value) || 0;


                const barHeight =
                    (
                        value /
                        max
                    ) *
                    chartHeight;


                const x =
                    padding.left +
                    slotWidth * index +
                    (
                        slotWidth -
                        barWidth
                    ) / 2;


                const y =
                    padding.top +
                    chartHeight -
                    barHeight;


                ctx.fillStyle =
                    "#2563eb";


                this.roundRect(
                    ctx,
                    x,
                    y,
                    barWidth,
                    barHeight,
                    5
                );


                ctx.fill();


                ctx.fillStyle =
                    getCSSColor(
                        "--dashboard-soft",
                        "#9aa3b2"
                    );

                ctx.font =
                    "10px Inter, Arial, sans-serif";

                ctx.textAlign =
                    "center";


                ctx.fillText(
                    truncate(
                        item.label || "",
                        8
                    ),
                    x +
                    barWidth / 2,
                    height - 10
                );

            }
        );

    }


    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    ) {

        const safeRadius =
            Math.min(
                radius,
                width / 2,
                height / 2
            );


        ctx.beginPath();

        ctx.moveTo(
            x + safeRadius,
            y
        );

        ctx.arcTo(
            x + width,
            y,
            x + width,
            y + height,
            safeRadius
        );

        ctx.arcTo(
            x + width,
            y + height,
            x,
            y + height,
            safeRadius
        );

        ctx.arcTo(
            x,
            y + height,
            x,
            y,
            safeRadius
        );

        ctx.arcTo(
            x,
            y,
            x + width,
            y,
            safeRadius
        );

        ctx.closePath();

    }


    destroy() {

        if (this.resizeHandler) {

            window.removeEventListener(
                "resize",
                this.resizeHandler
            );

        }

        this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );

    }

}


/* ============================================================
   RECENT ACTIVITY
============================================================ */

function renderRecentActivity(
    activities
) {

    if (!DashboardDOM.activityList) {
        return;
    }


    if (
        !Array.isArray(activities) ||
        activities.length === 0
    ) {

        DashboardDOM.activityList.innerHTML = `

            <div class="activity-loading">

                <span>
                    No recent activity found.
                </span>

            </div>

        `;

        return;

    }


    DashboardDOM.activityList.innerHTML =
        activities
            .slice(0, 6)
            .map(
                activity => {

                    const title =
                        activity.title ||
                        activity.action ||
                        "System activity";


                    const description =
                        activity.description ||
                        activity.message ||
                        "";


                    const time =
                        activity.time ||
                        activity.created_at ||
                        "";


                    const icon =
                        getActivityIcon(
                            activity.type ||
                            activity.action
                        );


                    return `

                        <div class="activity-item">

                            <div class="activity-icon">
                                ${icon}
                            </div>

                            <div class="activity-content">

                                <p class="activity-title">
                                    ${escapeHTML(title)}
                                </p>

                                ${
                                    description
                                        ? `
                                            <p class="activity-description">
                                                ${escapeHTML(description)}
                                            </p>
                                        `
                                        : ""
                                }

                                <div class="activity-time">
                                    ${escapeHTML(
                                        formatRelativeTime(time)
                                    )}
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ============================================================
   TOP VENDORS
============================================================ */

function renderTopVendors(
    vendors
) {

    if (!DashboardDOM.vendorsList) {
        return;
    }


    if (
        !Array.isArray(vendors) ||
        vendors.length === 0
    ) {

        DashboardDOM.vendorsList.innerHTML = `

            <div class="vendors-loading">

                <span>
                    No vendor data found.
                </span>

            </div>

        `;

        return;

    }


    DashboardDOM.vendorsList.innerHTML =
        vendors
            .slice(0, 6)
            .map(
                (vendor, index) => {

                    const name =
                        vendor.name ||
                        vendor.vendor_name ||
                        "Unknown Vendor";


                    const revenue =
                        Number(
                            vendor.revenue ||
                            vendor.total_revenue ||
                            0
                        );


                    const orders =
                        Number(
                            vendor.orders ||
                            vendor.total_orders ||
                            0
                        );


                    const initials =
                        getInitials(name);


                    return `

                        <div class="vendor-item">

                            <div class="vendor-avatar">
                                ${escapeHTML(initials)}
                            </div>

                            <div class="vendor-info">

                                <p class="vendor-name">
                                    ${escapeHTML(name)}
                                </p>

                                <div class="vendor-meta">
                                    Rank #${index + 1}
                                </div>

                            </div>

                            <div class="vendor-performance">

                                <div class="vendor-revenue">
                                    ${escapeHTML(
                                        formatCompactCurrency(revenue)
                                    )}
                                </div>

                                <div class="vendor-orders">
                                    ${formatNumber(orders)} orders
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ============================================================
   ACTIVITY ICON
============================================================ */

function getActivityIcon(
    type = ""
) {

    const normalized =
        String(type).toLowerCase();


    if (
        normalized.includes("vendor")
    ) {
        return "🏢";
    }


    if (
        normalized.includes("payment") ||
        normalized.includes("invoice")
    ) {
        return "₹";
    }


    if (
        normalized.includes("patient")
    ) {
        return "👤";
    }


    if (
        normalized.includes("appointment")
    ) {
        return "📅";
    }


    if (
        normalized.includes("report")
    ) {
        return "📄";
    }


    return "✓";

}


/* ============================================================
   LOADING
============================================================ */

function showChartLoading() {

    showElement(
        DashboardDOM.revenueLoading
    );

    showElement(
        DashboardDOM.appointmentLoading
    );

    hideElement(
        DashboardDOM.revenueEmpty
    );

    hideElement(
        DashboardDOM.appointmentEmpty
    );

}


function showEmptyCharts() {

    hideElement(
        DashboardDOM.revenueLoading
    );

    hideElement(
        DashboardDOM.appointmentLoading
    );

    showElement(
        DashboardDOM.revenueEmpty
    );

    showElement(
        DashboardDOM.appointmentEmpty
    );

}


/* ============================================================
   REFRESH STATE
============================================================ */

function setRefreshing(
    isRefreshing
) {

    if (!DashboardDOM.refreshButton) {
        return;
    }


    DashboardDOM.refreshButton.classList.toggle(
        "refreshing",
        isRefreshing
    );


    DashboardDOM.refreshButton.disabled =
        isRefreshing;

}


/* ============================================================
   AUTO REFRESH
============================================================ */

function startAutoRefresh() {

    stopAutoRefresh();


    DashboardState.refreshTimer =
        setInterval(
            () => {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    loadDashboard();

                }

            },
            DashboardConfig.refreshInterval
        );

}


function stopAutoRefresh() {

    if (
        DashboardState.refreshTimer
    ) {

        clearInterval(
            DashboardState.refreshTimer
        );

        DashboardState.refreshTimer =
            null;

    }

}


/* ============================================================
   ALERT
============================================================ */

function showAlert(
    message
) {

    if (!DashboardDOM.alert) {
        return;
    }


    DashboardDOM.alertMessage.textContent =
        message;


    DashboardDOM.alert.hidden =
        false;

}


function hideAlert() {

    if (!DashboardDOM.alert) {
        return;
    }


    DashboardDOM.alert.hidden =
        true;

}


/* ============================================================
   LAST UPDATED
============================================================ */

function updateLastUpdated() {

    if (!DashboardDOM.lastUpdated) {
        return;
    }


    const now =
        new Date();


    DashboardDOM.lastUpdated.textContent =
        now.toLocaleTimeString(
            DashboardConfig.locale,
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

}


/* ============================================================
   DESTROY CHART
============================================================ */

function destroyChart(
    type
) {

    if (
        type === "revenueChart" &&
        DashboardState.revenueChart
    ) {

        DashboardState.revenueChart.destroy();

        DashboardState.revenueChart =
            null;

    }


    if (
        type === "appointmentChart" &&
        DashboardState.appointmentChart
    ) {

        DashboardState.appointmentChart.destroy();

        DashboardState.appointmentChart =
            null;

    }

}


/* ============================================================
   FORMATTING
============================================================ */

function formatCurrency(
    value
) {

    return new Intl.NumberFormat(
        DashboardConfig.locale,
        {
            style: "currency",
            currency: DashboardConfig.currency,
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );

}


function formatCompactCurrency(
    value
) {

    const number =
        Number(value) || 0;


    if (number >= 10000000) {

        return `₹${(
            number /
            10000000
        ).toFixed(1)}Cr`;

    }


    if (number >= 100000) {

        return `₹${(
            number /
            100000
        ).toFixed(1)}L`;

    }


    if (number >= 1000) {

        return `₹${(
            number /
            1000
        ).toFixed(1)}K`;

    }


    return `₹${Math.round(number)}`;

}


function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        DashboardConfig.locale
    ).format(
        Math.round(
            Number(value) || 0
        )
    );

}


function formatPercentage(
    value
) {

    const number =
        Number(value) || 0;


    return `${Math.abs(number).toFixed(1)}%`;

}


/* ============================================================
   RELATIVE TIME
============================================================ */

function formatRelativeTime(
    value
) {

    if (!value) {
        return "Recently";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    const diff =
        Date.now() -
        date.getTime();


    const minutes =
        Math.floor(
            diff /
            60000
        );


    if (minutes < 1) {
        return "Just now";
    }


    if (minutes < 60) {
        return `${minutes} min ago`;
    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {
        return `${hours} hr ago`;
    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }


    return date.toLocaleDateString(
        DashboardConfig.locale,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ============================================================
   HELPERS
============================================================ */

function getInitials(
    name
) {

    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
        )
        .join("")
        .toUpperCase();

}


function truncate(
    value,
    length
) {

    const text =
        String(value || "");


    return text.length > length
        ? `${text.slice(0, length - 1)}…`
        : text;

}


function escapeHTML(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function getCSSColor(
    variable,
    fallback
) {

    try {

        const value =
            getComputedStyle(
                DashboardDOM.page
            )
            .getPropertyValue(
                variable
            )
            .trim();


        return value || fallback;

    } catch {

        return fallback;

    }

}


function showElement(
    element
) {

    if (element) {
        element.hidden = false;
    }

}


function hideElement(
    element
) {

    if (element) {
        element.hidden = true;
    }

}


function getErrorMessage(
    error
) {

    if (
        error?.name ===
        "AbortError"
    ) {

        return "Dashboard request timed out. Please try again.";

    }


    return (
        error?.message ||
        "Unable to load dashboard data. Please try again."
    );

}


/* ============================================================
   GLOBAL ACCESS
============================================================ */

window.SitaPathLabDashboard = {

    reload: () =>
        loadDashboard(true),

    refresh: () =>
        loadDashboard(true),

    getState: () =>
        DashboardState

};