/* =========================================================
   SUPER ADMIN ANALYTICS
   Production-ready frontend controller
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const AnalyticsState = {

    revenueChart: null,

    vendorGrowthChart: null,

    vendors: [],

    sortAscending: false,

    loading: false,

    filters: {
        range: "30days",
        vendor: "all",
        startDate: null,
        endDate: null
    }

};


/* =========================================================
   DOM
   ========================================================= */

const analyticsPage =
    document.getElementById("analyticsPage");

const refreshButton =
    document.getElementById("refreshAnalyticsBtn");

const exportButton =
    document.getElementById("exportAnalyticsBtn");

const applyFilterButton =
    document.getElementById("applyFilterBtn");

const dateRange =
    document.getElementById("dateRange");

const vendorFilter =
    document.getElementById("vendorFilter");

const customDateFields =
    document.getElementById("customDateFields");

const startDate =
    document.getElementById("startDate");

const endDate =
    document.getElementById("endDate");

const vendorTableBody =
    document.getElementById("vendorTableBody");

const vendorTableEmpty =
    document.getElementById("vendorTableEmpty");

const lastUpdated =
    document.getElementById("lastUpdated");


/* =========================================================
   API URL
   ========================================================= */

const ANALYTICS_API =
    analyticsPage?.dataset.apiUrl || "/superadmin/api/analytics/";


/* =========================================================
   CSRF
   ========================================================= */

function getCookie(name) {

    const cookies =
        document.cookie
            .split(";")
            .map(cookie => cookie.trim());

    const cookie =
        cookies.find(
            cookie => cookie.startsWith(`${name}=`)
        );

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(
        cookie.substring(name.length + 1)
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatNumber(value) {

    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        "en-IN"
    ).format(number);

}


function formatCurrency(value) {

    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getInitials(name) {

    if (!name) {
        return "V";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            word => word.charAt(0).toUpperCase()
        )
        .join("");

}


function formatDateTime(date = new Date()) {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);

}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoading(isLoading) {

    AnalyticsState.loading = isLoading;

    if (refreshButton) {

        refreshButton.disabled =
            isLoading;

        refreshButton.innerHTML =
            isLoading
                ? `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading...</span>
                  `
                : `
                    <i class="fa-solid fa-rotate"></i>
                    <span>Refresh</span>
                  `;

    }

}


/* =========================================================
   CHART LOADING
   ========================================================= */

function setChartLoading(
    chartName,
    loading
) {

    const element =
        document.getElementById(
            `${chartName}Loading`
        );

    if (element) {
        element.hidden = !loading;
    }

}


/* =========================================================
   CHART EMPTY
   ========================================================= */

function setChartEmpty(
    chartName,
    empty
) {

    const element =
        document.getElementById(
            `${chartName}Empty`
        );

    if (element) {
        element.hidden = !empty;
    }

}


/* =========================================================
   FILTER
   ========================================================= */

function collectFilters() {

    AnalyticsState.filters.range =
        dateRange.value;

    AnalyticsState.filters.vendor =
        vendorFilter.value;

    if (dateRange.value === "custom") {

        AnalyticsState.filters.startDate =
            startDate.value || null;

        AnalyticsState.filters.endDate =
            endDate.value || null;

    } else {

        AnalyticsState.filters.startDate =
            null;

        AnalyticsState.filters.endDate =
            null;

    }

}


function toggleCustomDates() {

    const custom =
        dateRange.value === "custom";

    customDateFields.hidden =
        !custom;

}


/* =========================================================
   BUILD API QUERY
   ========================================================= */

function buildQueryString() {

    const params =
        new URLSearchParams();

    params.set(
        "range",
        AnalyticsState.filters.range
    );

    if (
        AnalyticsState.filters.vendor &&
        AnalyticsState.filters.vendor !== "all"
    ) {

        params.set(
            "vendor",
            AnalyticsState.filters.vendor
        );

    }

    if (AnalyticsState.filters.startDate) {

        params.set(
            "start_date",
            AnalyticsState.filters.startDate
        );

    }

    if (AnalyticsState.filters.endDate) {

        params.set(
            "end_date",
            AnalyticsState.filters.endDate
        );

    }

    return params.toString();

}


/* =========================================================
   API REQUEST
   ========================================================= */

async function fetchAnalytics() {

    if (AnalyticsState.loading) {
        return;
    }

    setLoading(true);

    setChartLoading(
        "revenueChart",
        true
    );

    setChartLoading(
        "vendorGrowth",
        true
    );

    try {

        collectFilters();

        const query =
            buildQueryString();

        const url =
            query
                ? `${ANALYTICS_API}?${query}`
                : ANALYTICS_API;

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "X-Requested-With":
                            "XMLHttpRequest"
                    },

                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Analytics API returned ${response.status}`
            );

        }

        const data =
            await response.json();

        renderAnalytics(data);

        lastUpdated.textContent =
            formatDateTime();

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

        showErrorState();

    } finally {

        setLoading(false);

        setChartLoading(
            "revenueChart",
            false
        );

        setChartLoading(
            "vendorGrowth",
            false
        );

    }

}


/* =========================================================
   RENDER MAIN ANALYTICS
   ========================================================= */

function renderAnalytics(data) {

    const summary =
        data.summary || {};

    updateText(
        "totalVendors",
        formatNumber(
            summary.total_vendors
        )
    );

    updateText(
        "activeVendors",
        formatNumber(
            summary.active_vendors
        )
    );

    updateText(
        "totalPatients",
        formatNumber(
            summary.total_patients
        )
    );

    updateText(
        "totalRevenue",
        formatCurrency(
            summary.total_revenue
        )
    );


    updateText(
        "vendorsChange",
        formatGrowth(
            summary.vendor_growth
        )
    );

    updateText(
        "patientsChange",
        formatGrowth(
            summary.patient_growth
        )
    );

    updateText(
        "revenueChange",
        formatGrowth(
            summary.revenue_growth
        )
    );


    const activePercentage =
        summary.total_vendors
            ? (
                Number(summary.active_vendors || 0)
                /
                Number(summary.total_vendors)
                * 100
            )
            : 0;

    updateText(
        "activeVendorPercentage",
        `${Math.round(activePercentage)}%`
    );


    renderVendorFilter(
        data.vendors || []
    );

    renderRevenueChart(
        data.revenue || []
    );

    renderVendorGrowthChart(
        data.vendor_growth || []
    );

    renderVendorTable(
        data.vendors || []
    );

}


/* =========================================================
   UPDATE TEXT
   ========================================================= */

function updateText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }

}


/* =========================================================
   GROWTH FORMAT
   ========================================================= */

function formatGrowth(value) {

    const number =
        Number(value || 0);

    const sign =
        number >= 0
            ? "+"
            : "";

    return `${sign}${number.toFixed(1)}%`;

}


/* =========================================================
   VENDOR FILTER
   ========================================================= */

function renderVendorFilter(vendors) {

    const selected =
        AnalyticsState.filters.vendor;

    const options = [

        `
        <option value="all">
            All Vendors
        </option>
        `

    ];

    vendors.forEach(
        vendor => {

            options.push(
                `
                <option
                    value="${escapeHTML(vendor.id)}"
                >
                    ${escapeHTML(
                        vendor.name ||
                        "Unnamed Vendor"
                    )}
                </option>
                `
            );

        }
    );

    vendorFilter.innerHTML =
        options.join("");

    if (
        [...vendorFilter.options]
            .some(
                option =>
                    option.value === selected
            )
    ) {

        vendorFilter.value =
            selected;

    } else {

        vendorFilter.value =
            "all";

    }

}


/* =========================================================
   REVENUE CHART
   ========================================================= */

function renderRevenueChart(data) {

    const canvas =
        document.getElementById(
            "revenueChart"
        );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const labels =
        data.map(
            item =>
                item.label ||
                item.month ||
                ""
        );

    const values =
        data.map(
            item =>
                Number(
                    item.value ||
                    item.revenue ||
                    0
                )
        );

    setChartEmpty(
        "revenueChart",
        values.length === 0
    );

    if (
        AnalyticsState.revenueChart
    ) {

        AnalyticsState.revenueChart.destroy();

    }

    AnalyticsState.revenueChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [
                        {
                            label: "Revenue",

                            data: values,

                            borderColor:
                                "#2563eb",

                            backgroundColor:
                                "rgba(37, 99, 235, .10)",

                            borderWidth: 2.5,

                            fill: true,

                            tension: .4,

                            pointRadius: 3,

                            pointHoverRadius: 6,

                            pointBackgroundColor:
                                "#2563eb"
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label(context) {

                                    return (
                                        " Revenue: " +
                                        formatCurrency(
                                            context.raw
                                        )
                                    );

                                }

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {
                                color: "#94a3b8",
                                font: {
                                    size: 11
                                }
                            }

                        },

                        y: {

                            beginAtZero: true,

                            grid: {
                                color:
                                    "#eef2f7"
                            },

                            ticks: {

                                color:
                                    "#94a3b8",

                                font: {
                                    size: 11
                                },

                                callback(value) {

                                    if (
                                        value >= 100000
                                    ) {

                                        return (
                                            "₹" +
                                            (
                                                value /
                                                100000
                                            ).toFixed(1) +
                                            "L"
                                        );

                                    }

                                    if (
                                        value >= 1000
                                    ) {

                                        return (
                                            "₹" +
                                            (
                                                value /
                                                1000
                                            ).toFixed(0) +
                                            "K"
                                        );

                                    }

                                    return "₹" + value;

                                }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   VENDOR GROWTH CHART
   ========================================================= */

function renderVendorGrowthChart(data) {

    const canvas =
        document.getElementById(
            "vendorGrowthChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    const labels =
        data.map(
            item =>
                item.label ||
                item.month ||
                ""
        );

    const values =
        data.map(
            item =>
                Number(
                    item.value ||
                    item.count ||
                    0
                )
        );

    setChartEmpty(
        "vendorGrowth",
        values.length === 0
    );

    if (
        AnalyticsState.vendorGrowthChart
    ) {

        AnalyticsState.vendorGrowthChart.destroy();

    }

    AnalyticsState.vendorGrowthChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels,

                    datasets: [
                        {
                            label:
                                "New Vendors",

                            data: values,

                            backgroundColor:
                                "#2563eb",

                            borderRadius: 7,

                            maxBarThickness: 32
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {
                                color: "#94a3b8"
                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0,
                                color: "#94a3b8"
                            },

                            grid: {
                                color:
                                    "#eef2f7"
                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   VENDOR TABLE
   ========================================================= */

function renderVendorTable(vendors) {

    AnalyticsState.vendors =
        [...vendors];

    if (!vendors.length) {

        vendorTableBody.innerHTML =
            "";

        vendorTableEmpty.hidden =
            false;

        return;

    }

    vendorTableEmpty.hidden =
        true;

    const sorted =
        sortVendors(vendors);

    vendorTableBody.innerHTML =
        sorted
            .map(
                vendor =>
                    createVendorRow(vendor)
            )
            .join("");

}


/* =========================================================
   SORT
   ========================================================= */

function sortVendors(vendors) {

    return [...vendors].sort(
        (a, b) => {

            const revenueA =
                Number(
                    a.revenue || 0
                );

            const revenueB =
                Number(
                    b.revenue || 0
                );

            return AnalyticsState.sortAscending
                ? revenueA - revenueB
                : revenueB - revenueA;

        }
    );

}


/* =========================================================
   CREATE VENDOR ROW
   ========================================================= */

function createVendorRow(vendor) {

    const name =
        vendor.name ||
        "Unnamed Vendor";

    const email =
        vendor.email ||
        "";

    const status =
        String(
            vendor.status ||
            "inactive"
        ).toLowerCase();

    const patients =
        Number(
            vendor.patients || 0
        );

    const appointments =
        Number(
            vendor.appointments || 0
        );

    const revenue =
        Number(
            vendor.revenue || 0
        );

    const growth =
        Number(
            vendor.growth || 0
        );

    const performance =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    vendor.performance || 0
                )
            )
        );


    const statusClass =
        status === "active"
            ? "active"
            : status === "suspended"
                ? "suspended"
                : "inactive";


    const growthClass =
        growth >= 0
            ? "positive"
            : "negative";


    return `
        <tr>

            <td>

                <div class="vendor-cell">

                    <div class="vendor-avatar">
                        ${escapeHTML(
                            getInitials(name)
                        )}
                    </div>

                    <div>

                        <div class="vendor-name">
                            ${escapeHTML(name)}
                        </div>

                        ${
                            email
                                ? `
                                <div class="vendor-email">
                                    ${escapeHTML(email)}
                                </div>
                                `
                                : ""
                        }

                    </div>

                </div>

            </td>


            <td>

                <span
                    class="status-pill ${statusClass}"
                >

                    <i class="fa-solid fa-circle"></i>

                    ${escapeHTML(
                        status.charAt(0).toUpperCase() +
                        status.slice(1)
                    )}

                </span>

            </td>


            <td>
                ${formatNumber(patients)}
            </td>


            <td>
                ${formatNumber(appointments)}
            </td>


            <td>
                ${formatCurrency(revenue)}
            </td>


            <td>

                <span
                    class="growth ${growthClass}"
                >

                    ${
                        growth >= 0
                            ? "+"
                            : ""
                    }${growth.toFixed(1)}%

                </span>

            </td>


            <td>

                <div class="performance">

                    <div class="progress">

                        <span
                            style="width:${performance}%"
                        ></span>

                    </div>

                    <span class="performance-value">
                        ${Math.round(performance)}%
                    </span>

                </div>

            </td>

        </tr>
    `;

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showErrorState() {

    vendorTableBody.innerHTML = `
        <tr>
            <td colspan="7">

                <div class="table-loading">

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="color:#dc2626;font-size:20px;"
                    ></i>

                    <span>
                        Unable to load analytics data.
                    </span>

                </div>

            </td>
        </tr>
    `;

}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {

    const vendors =
        AnalyticsState.vendors;

    if (!vendors.length) {

        alert(
            "There is no vendor data to export."
        );

        return;

    }


    const headers = [

        "Vendor",
        "Email",
        "Status",
        "Patients",
        "Appointments",
        "Revenue",
        "Growth",
        "Performance"

    ];


    const rows =
        vendors.map(
            vendor => [

                vendor.name || "",

                vendor.email || "",

                vendor.status || "",

                vendor.patients || 0,

                vendor.appointments || 0,

                vendor.revenue || 0,

                vendor.growth || 0,

                vendor.performance || 0

            ]
        );


    const csv = [

        headers,

        ...rows

    ]
        .map(
            row =>
                row
                    .map(
                        value =>
                            `"${String(value)
                                .replaceAll('"', '""')}"`
                    )
                    .join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        `superadmin-analytics-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

}


/* =========================================================
   EVENTS
   ========================================================= */

dateRange?.addEventListener(
    "change",
    toggleCustomDates
);


applyFilterButton?.addEventListener(
    "click",
    fetchAnalytics
);


refreshButton?.addEventListener(
    "click",
    fetchAnalytics
);


exportButton?.addEventListener(
    "click",
    exportCSV
);


document
    .getElementById("sortVendorBtn")
    ?.addEventListener(
        "click",
        () => {

            AnalyticsState.sortAscending =
                !AnalyticsState.sortAscending;

            renderVendorTable(
                AnalyticsState.vendors
            );

        }
    );


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        toggleCustomDates();

        fetchAnalytics();

    }
);