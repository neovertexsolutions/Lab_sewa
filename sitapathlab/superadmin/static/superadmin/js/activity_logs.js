/* ============================================================
   SUPER ADMIN
   ACTIVITY LOGS
============================================================ */

(() => {
    "use strict";


    /* ========================================================
       CONFIGURATION
    ======================================================== */

    const CONFIG = {

        API_URL: "/superadmin/api/activity-logs/",

        EXPORT_URL: "/superadmin/api/activity-logs/export/",

        PAGE_SIZE: 10,

        DEBOUNCE_DELAY: 350

    };


    /* ========================================================
       STATE
    ======================================================== */

    const state = {

        logs: [],

        filteredLogs: [],

        currentPage: 1,

        totalPages: 1,

        loading: false,

        selectedIds: new Set(),

        vendors: []

    };


    /* ========================================================
       DOM
    ======================================================== */

    const DOM = {};


    function cacheDOM() {

        DOM.tableBody =
            document.getElementById("activityTableBody");

        DOM.emptyState =
            document.getElementById("emptyState");

        DOM.search =
            document.getElementById("searchLogs");

        DOM.vendor =
            document.getElementById("vendorFilter");

        DOM.action =
            document.getElementById("actionFilter");

        DOM.severity =
            document.getElementById("severityFilter");

        DOM.dateFrom =
            document.getElementById("dateFrom");

        DOM.dateTo =
            document.getElementById("dateTo");

        DOM.pagination =
            document.getElementById("pagination");

        DOM.visibleRecords =
            document.getElementById("visibleRecords");

        DOM.paginationStart =
            document.getElementById("paginationStart");

        DOM.paginationEnd =
            document.getElementById("paginationEnd");

        DOM.paginationTotal =
            document.getElementById("paginationTotal");

        DOM.totalActivities =
            document.getElementById("totalActivities");

        DOM.successfulActivities =
            document.getElementById("successfulActivities");

        DOM.warningActivities =
            document.getElementById("warningActivities");

        DOM.securityActivities =
            document.getElementById("securityActivities");

        DOM.activityGrowth =
            document.getElementById("activityGrowth");

        DOM.successRate =
            document.getElementById("successRate");

        DOM.selectAll =
            document.getElementById("selectAllLogs");

        DOM.activityModal =
            document.getElementById("activityModal");

        DOM.closeModal =
            document.getElementById("closeActivityModal");

        DOM.closeModalBtn =
            document.getElementById("closeActivityModalBtn");

    }


    /* ========================================================
       INIT
    ======================================================== */

    async function init() {

        cacheDOM();

        bindEvents();

        await loadLogs();

    }


    /* ========================================================
       EVENTS
    ======================================================== */

    function bindEvents() {

        DOM.search?.addEventListener(
            "input",
            debounce(applyFilters, CONFIG.DEBOUNCE_DELAY)
        );

        DOM.vendor?.addEventListener(
            "change",
            applyFilters
        );

        DOM.action?.addEventListener(
            "change",
            applyFilters
        );

        DOM.severity?.addEventListener(
            "change",
            applyFilters
        );

        DOM.dateFrom?.addEventListener(
            "change",
            applyFilters
        );

        DOM.dateTo?.addEventListener(
            "change",
            applyFilters
        );


        document
            .getElementById("clearFiltersBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        document
            .getElementById("emptyClearBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        document
            .getElementById("refreshLogsBtn")
            ?.addEventListener(
                "click",
                loadLogs
            );


        document
            .getElementById("tableRefreshBtn")
            ?.addEventListener(
                "click",
                loadLogs
            );


        document
            .getElementById("exportLogsBtn")
            ?.addEventListener(
                "click",
                exportLogs
            );


        DOM.selectAll?.addEventListener(
            "change",
            toggleSelectAll
        );


        DOM.closeModal?.addEventListener(
            "click",
            closeModal
        );


        DOM.closeModalBtn?.addEventListener(
            "click",
            closeModal
        );


        DOM.activityModal?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    DOM.activityModal
                ) {
                    closeModal();
                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    !DOM.activityModal.hidden
                ) {
                    closeModal();
                }

            }
        );

    }


    /* ========================================================
       LOAD LOGS
    ======================================================== */

    async function loadLogs() {

        if (state.loading) {
            return;
        }

        state.loading = true;

        showLoading();

        try {

            const response =
                await fetch(
                    CONFIG.API_URL,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        credentials: "same-origin"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const payload =
                await response.json();


            state.logs =
                normalizeLogs(payload);


            state.filteredLogs =
                [...state.logs];


            state.currentPage = 1;


            populateVendors();

            updateStatistics();

            renderTable();

        } catch (error) {

            console.error(
                "Activity logs error:",
                error
            );

            showError(
                "Unable to load activity logs."
            );

        } finally {

            state.loading = false;

        }

    }


    /* ========================================================
       NORMALIZE API RESPONSE
    ======================================================== */

    function normalizeLogs(payload) {

        if (Array.isArray(payload)) {
            return payload;
        }


        if (
            payload &&
            Array.isArray(payload.results)
        ) {
            return payload.results;
        }


        if (
            payload &&
            Array.isArray(payload.data)
        ) {
            return payload.data;
        }


        if (
            payload &&
            Array.isArray(payload.logs)
        ) {
            return payload.logs;
        }


        return [];

    }


    /* ========================================================
       NORMALIZE SINGLE LOG
    ======================================================== */

    function normalizeLog(log) {

        return {

            id:
                log.id ??
                log.pk ??
                "",

            title:
                log.title ??
                log.description ??
                log.action ??
                "Activity",

            description:
                log.description ??
                "",

            vendor:
                log.vendor_name ??
                log.vendor ??
                log.laboratory_name ??
                "—",

            user:
                log.user_name ??
                log.username ??
                log.user ??
                "System",

            action:
                log.action ??
                log.action_type ??
                "info",

            severity:
                log.severity ??
                log.level ??
                "info",

            ip:
                log.ip_address ??
                log.ip ??
                "—",

            createdAt:
                log.created_at ??
                log.timestamp ??
                log.date ??
                null,

            status:
                log.status ??
                "success"

        };

    }


    /* ========================================================
       FILTERS
    ======================================================== */

    function applyFilters() {

        const search =
            DOM.search?.value
                ?.trim()
                .toLowerCase() || "";


        const vendor =
            DOM.vendor?.value || "";


        const action =
            DOM.action?.value || "";


        const severity =
            DOM.severity?.value || "";


        const dateFrom =
            DOM.dateFrom?.value || "";


        const dateTo =
            DOM.dateTo?.value || "";


        state.filteredLogs =
            state.logs.filter(rawLog => {

                const log =
                    normalizeLog(rawLog);


                if (search) {

                    const haystack =
                        [
                            log.title,
                            log.description,
                            log.vendor,
                            log.user,
                            log.action,
                            log.ip
                        ]
                            .join(" ")
                            .toLowerCase();


                    if (
                        !haystack.includes(search)
                    ) {
                        return false;
                    }

                }


                if (
                    vendor &&
                    String(log.vendor) !==
                    String(vendor)
                ) {
                    return false;
                }


                if (
                    action &&
                    String(log.action).toLowerCase() !==
                    String(action).toLowerCase()
                ) {
                    return false;
                }


                if (
                    severity &&
                    String(log.severity).toLowerCase() !==
                    String(severity).toLowerCase()
                ) {
                    return false;
                }


                if (dateFrom || dateTo) {

                    if (!log.createdAt) {
                        return false;
                    }


                    const logDate =
                        new Date(log.createdAt);


                    if (Number.isNaN(logDate.getTime())) {
                        return false;
                    }


                    const date =
                        formatDateForComparison(
                            logDate
                        );


                    if (
                        dateFrom &&
                        date < dateFrom
                    ) {
                        return false;
                    }


                    if (
                        dateTo &&
                        date > dateTo
                    ) {
                        return false;
                    }

                }


                return true;

            });


        state.currentPage = 1;

        renderTable();

    }


    /* ========================================================
       CLEAR FILTERS
    ======================================================== */

    function clearFilters() {

        if (DOM.search) {
            DOM.search.value = "";
        }

        if (DOM.vendor) {
            DOM.vendor.value = "";
        }

        if (DOM.action) {
            DOM.action.value = "";
        }

        if (DOM.severity) {
            DOM.severity.value = "";
        }

        if (DOM.dateFrom) {
            DOM.dateFrom.value = "";
        }

        if (DOM.dateTo) {
            DOM.dateTo.value = "";
        }


        state.filteredLogs =
            [...state.logs];

        state.currentPage = 1;

        renderTable();

    }


    /* ========================================================
       VENDORS
    ======================================================== */

    function populateVendors() {

        if (!DOM.vendor) {
            return;
        }


        const vendors =
            [
                ...new Set(
                    state.logs
                        .map(log =>
                            normalizeLog(log).vendor
                        )
                        .filter(
                            vendor =>
                                vendor &&
                                vendor !== "—"
                        )
                )
            ]
            .sort();


        DOM.vendor.innerHTML = `
            <option value="">
                All Vendors
            </option>
        `;


        vendors.forEach(vendor => {

            const option =
                document.createElement("option");

            option.value = vendor;

            option.textContent = vendor;

            DOM.vendor.appendChild(option);

        });

    }


    /* ========================================================
       STATISTICS
    ======================================================== */

    function updateStatistics() {

        const logs =
            state.logs.map(normalizeLog);


        const total =
            logs.length;


        const successful =
            logs.filter(
                log =>
                    log.status === "success" ||
                    log.severity === "success"
            ).length;


        const warnings =
            logs.filter(
                log =>
                    log.severity === "warning" ||
                    log.status === "warning"
            ).length;


        const security =
            logs.filter(log => {

                const action =
                    String(log.action)
                        .toLowerCase();

                return [
                    "login",
                    "logout",
                    "restore",
                    "backup",
                    "permission"
                ].some(value =>
                    action.includes(value)
                );

            }).length;


        setText(
            DOM.totalActivities,
            total
        );


        setText(
            DOM.successfulActivities,
            successful
        );


        setText(
            DOM.warningActivities,
            warnings
        );


        setText(
            DOM.securityActivities,
            security
        );


        const successRate =
            total
                ? Math.round(
                    (successful / total) * 100
                )
                : 0;


        setText(
            DOM.successRate,
            `${successRate}%`
        );


        setText(
            DOM.activityGrowth,
            "Live"
        );

    }


    /* ========================================================
       TABLE
    ======================================================== */

    function renderTable() {

        if (!DOM.tableBody) {
            return;
        }


        const total =
            state.filteredLogs.length;


        if (!total) {

            DOM.tableBody.innerHTML = "";

            DOM.emptyState.hidden = false;

            updatePagination();

            return;

        }


        DOM.emptyState.hidden = true;


        const start =
            (state.currentPage - 1) *
            CONFIG.PAGE_SIZE;


        const end =
            Math.min(
                start + CONFIG.PAGE_SIZE,
                total
            );


        const pageItems =
            state.filteredLogs.slice(
                start,
                end
            );


        DOM.tableBody.innerHTML =
            pageItems
                .map(renderRow)
                .join("");


        bindRowActions();

        updatePagination();

    }


    /* ========================================================
       TABLE ROW
    ======================================================== */

    function renderRow(rawLog) {

        const log =
            normalizeLog(rawLog);


        const initials =
            getInitials(log.user);


        const statusClass =
            getStatusClass(
                log.status,
                log.severity
            );


        const actionClass =
            "action-badge";


        return `

            <tr data-id="${escapeHtml(log.id)}">

                <td>

                    <input
                        type="checkbox"
                        class="log-checkbox"
                        data-id="${escapeHtml(log.id)}"
                        ${
                            state.selectedIds.has(
                                String(log.id)
                            )
                            ? "checked"
                            : ""
                        }
                    >

                </td>


                <td>

                    <div class="activity-cell">

                        <div class="activity-avatar">

                            <i class="fa-solid ${getActivityIcon(log.action)}"></i>

                        </div>

                        <div class="activity-main">

                            <strong>
                                ${escapeHtml(log.title)}
                            </strong>

                            <span>
                                ${escapeHtml(log.description)}
                            </span>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHtml(log.vendor)}
                </td>


                <td>

                    <div class="user-cell">

                        <div class="user-avatar">
                            ${escapeHtml(initials)}
                        </div>

                        <span>
                            ${escapeHtml(log.user)}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="${actionClass}">
                        ${escapeHtml(
                            formatAction(log.action)
                        )}
                    </span>

                </td>


                <td>
                    ${escapeHtml(log.ip)}
                </td>


                <td>
                    ${escapeHtml(
                        formatDateTime(
                            log.createdAt
                        )
                    )}
                </td>


                <td>

                    <span
                        class="status-badge ${statusClass}"
                    >

                        <i class="fa-solid fa-circle"></i>

                        ${escapeHtml(
                            formatStatus(
                                log.status
                            )
                        )}

                    </span>

                </td>


                <td>

                    <div class="row-actions">

                        <button
                            type="button"
                            class="row-action view-log"
                            data-id="${escapeHtml(log.id)}"
                            title="View Details"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    /* ========================================================
       ROW EVENTS
    ======================================================== */

    function bindRowActions() {

        document
            .querySelectorAll(".view-log")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        openLogModal(id);

                    }
                );

            });


        document
            .querySelectorAll(".log-checkbox")
            .forEach(checkbox => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        const id =
                            String(
                                checkbox.dataset.id
                            );


                        if (checkbox.checked) {

                            state.selectedIds.add(id);

                        } else {

                            state.selectedIds.delete(id);

                        }


                        updateSelectAllState();

                    }
                );

            });


        updateSelectAllState();

    }


    /* ========================================================
       SELECT ALL
    ======================================================== */

    function toggleSelectAll() {

        const checked =
            Boolean(
                DOM.selectAll.checked
            );


        const start =
            (state.currentPage - 1) *
            CONFIG.PAGE_SIZE;


        const end =
            Math.min(
                start + CONFIG.PAGE_SIZE,
                state.filteredLogs.length
            );


        state.filteredLogs
            .slice(start, end)
            .forEach(rawLog => {

                const log =
                    normalizeLog(rawLog);


                const id =
                    String(log.id);


                if (checked) {

                    state.selectedIds.add(id);

                } else {

                    state.selectedIds.delete(id);

                }

            });


        renderTable();

    }


    function updateSelectAllState() {

        if (!DOM.selectAll) {
            return;
        }


        const checkboxes =
            [
                ...document.querySelectorAll(
                    ".log-checkbox"
                )
            ];


        if (!checkboxes.length) {

            DOM.selectAll.checked = false;

            DOM.selectAll.indeterminate = false;

            return;

        }


        const checked =
            checkboxes.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        DOM.selectAll.checked =
            checked === checkboxes.length;


        DOM.selectAll.indeterminate =
            checked > 0 &&
            checked < checkboxes.length;

    }


    /* ========================================================
       PAGINATION
    ======================================================== */

    function updatePagination() {

        const total =
            state.filteredLogs.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total / CONFIG.PAGE_SIZE
                )
            );


        state.totalPages =
            totalPages;


        const start =
            total === 0
                ? 0
                : (
                    (state.currentPage - 1) *
                    CONFIG.PAGE_SIZE
                ) + 1;


        const end =
            Math.min(
                state.currentPage *
                CONFIG.PAGE_SIZE,
                total
            );


        setText(
            DOM.paginationStart,
            start
        );


        setText(
            DOM.paginationEnd,
            end
        );


        setText(
            DOM.paginationTotal,
            total
        );


        setText(
            DOM.visibleRecords,
            total
        );


        renderPagination();

    }


    function renderPagination() {

        if (!DOM.pagination) {
            return;
        }


        const totalPages =
            state.totalPages;


        let html = "";


        html += `
            <button
                type="button"
                class="page-btn"
                data-page="prev"
                ${state.currentPage === 1 ? "disabled" : ""}
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;


        const pages =
            getPageNumbers(
                state.currentPage,
                totalPages
            );


        pages.forEach(page => {

            if (page === "...") {

                html += `
                    <span class="page-btn">
                        ...
                    </span>
                `;

                return;

            }


            html += `
                <button
                    type="button"
                    class="page-btn ${
                        page === state.currentPage
                            ? "active"
                            : ""
                    }"
                    data-page="${page}"
                >
                    ${page}
                </button>
            `;

        });


        html += `
            <button
                type="button"
                class="page-btn"
                data-page="next"
                ${
                    state.currentPage === totalPages
                        ? "disabled"
                        : ""
                }
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;


        DOM.pagination.innerHTML = html;


        DOM.pagination
            .querySelectorAll("[data-page]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;


                        if (page === "prev") {

                            state.currentPage--;

                        } else if (page === "next") {

                            state.currentPage++;

                        } else {

                            state.currentPage =
                                Number(page);

                        }


                        renderTable();

                    }
                );

            });

    }


    /* ========================================================
       MODAL
    ======================================================== */

    function openLogModal(id) {

        const rawLog =
            state.logs.find(
                item =>
                    String(
                        normalizeLog(item).id
                    ) === String(id)
            );


        if (!rawLog) {
            return;
        }


        const log =
            normalizeLog(rawLog);


        setText(
            document.getElementById(
                "modalActivityTitle"
            ),
            log.title
        );


        setText(
            document.getElementById(
                "detailId"
            ),
            log.id
        );


        setText(
            document.getElementById(
                "detailVendor"
            ),
            log.vendor
        );


        setText(
            document.getElementById(
                "detailUser"
            ),
            log.user
        );


        setText(
            document.getElementById(
                "detailAction"
            ),
            formatAction(log.action)
        );


        setText(
            document.getElementById(
                "detailIp"
            ),
            log.ip
        );


        setText(
            document.getElementById(
                "detailDate"
            ),
            formatDateTime(log.createdAt)
        );


        setText(
            document.getElementById(
                "detailDescription"
            ),
            log.description || "No description available."
        );


        DOM.activityModal.hidden = false;

        document.body.style.overflow = "hidden";

    }


    function closeModal() {

        if (!DOM.activityModal) {
            return;
        }


        DOM.activityModal.hidden = true;

        document.body.style.overflow = "";

    }


    /* ========================================================
       EXPORT
    ======================================================== */

    async function exportLogs() {

        try {

            const ids =
                [...state.selectedIds];


            const url =
                ids.length
                    ? `${CONFIG.EXPORT_URL}?ids=${encodeURIComponent(
                        ids.join(",")
                    )}`
                    : CONFIG.EXPORT_URL;


            window.location.href = url;

        } catch (error) {

            console.error(
                "Export error:",
                error
            );

        }

    }


    /* ========================================================
       UI STATES
    ======================================================== */

    function showLoading() {

        if (!DOM.tableBody) {
            return;
        }


        DOM.emptyState.hidden = true;


        DOM.tableBody.innerHTML = `

            <tr class="loading-row">

                <td colspan="9">

                    <div class="table-loader">

                        <span class="spinner"></span>

                        <span>
                            Loading activity logs...
                        </span>

                    </div>

                </td>

            </tr>

        `;

    }


    function showError(message) {

        DOM.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:45px;
                        color:#dc2626;
                    "
                >

                    <i
                        class="fa-solid fa-circle-exclamation"
                    ></i>

                    <div style="margin-top:8px;">
                        ${escapeHtml(message)}
                    </div>

                </td>

            </tr>

        `;

    }


    /* ========================================================
       HELPERS
    ======================================================== */

    function formatAction(action) {

        if (!action) {
            return "Unknown";
        }


        return String(action)
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    function formatStatus(status) {

        if (!status) {
            return "Success";
        }


        return String(status)
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    function getStatusClass(
        status,
        severity
    ) {

        const value =
            String(
                severity || status || "info"
            ).toLowerCase();


        if (
            value === "danger" ||
            value === "error" ||
            value === "failed"
        ) {
            return "status-danger";
        }


        if (
            value === "warning" ||
            value === "warn"
        ) {
            return "status-warning";
        }


        if (
            value === "success" ||
            value === "completed"
        ) {
            return "status-success";
        }


        return "status-info";

    }


    function getActivityIcon(action) {

        const value =
            String(action)
                .toLowerCase();


        if (value.includes("login")) {
            return "fa-right-to-bracket";
        }

        if (value.includes("logout")) {
            return "fa-right-from-bracket";
        }

        if (value.includes("create")) {
            return "fa-plus";
        }

        if (value.includes("update")) {
            return "fa-pen";
        }

        if (value.includes("delete")) {
            return "fa-trash";
        }

        if (value.includes("backup")) {
            return "fa-database";
        }

        if (value.includes("restore")) {
            return "fa-rotate-left";
        }

        if (value.includes("permission")) {
            return "fa-key";
        }


        return "fa-clock-rotate-left";

    }


    function formatDateTime(value) {

        if (!value) {
            return "—";
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


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatDateForComparison(date) {

        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;

    }


    function getInitials(name) {

        if (!name) {
            return "SA";
        }


        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                part =>
                    part.charAt(0)
                        .toUpperCase()
            )
            .join("");

    }


    function setText(
        element,
        value
    ) {

        if (element) {
            element.textContent =
                value ?? "—";
        }

    }


    function escapeHtml(value) {

        return String(
            value ?? ""
        )
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


    function debounce(
        callback,
        delay
    ) {

        let timer;


        return (...args) => {

            clearTimeout(timer);


            timer =
                setTimeout(
                    () =>
                        callback(...args),
                    delay
                );

        };

    }


    function getPageNumbers(
        current,
        total
    ) {

        if (total <= 7) {

            return Array.from(
                {
                    length: total
                },
                (_, index) =>
                    index + 1
            );

        }


        const pages = [1];


        if (current > 4) {
            pages.push("...");
        }


        const start =
            Math.max(
                2,
                current - 1
            );


        const end =
            Math.min(
                total - 1,
                current + 1
            );


        for (
            let i = start;
            i <= end;
            i++
        ) {
            pages.push(i);
        }


        if (current < total - 3) {
            pages.push("...");
        }


        pages.push(total);


        return pages;

    }


    /* ========================================================
       START
    ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();