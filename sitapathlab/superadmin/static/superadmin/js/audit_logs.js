/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN — AUDIT LOGS
 * Production-Level Frontend Controller
 * ============================================================
 */

"use strict";


const AuditLogManager = (() => {

    /* ========================================================
       CONFIG
    ======================================================== */

    const CONFIG = {

        endpoints: {

            list:
                "/superadmin/api/audit-logs/",

            detail:
                id =>
                    `/superadmin/api/audit-logs/${id}/`,

            export:
                "/superadmin/api/audit-logs/export/"

        },

        pagination: {

            page: 1,

            limit: 10

        },

        selectors: {

            page:
                "#auditPage",

            tableBody:
                "#auditTableBody",

            loading:
                "#auditLoading",

            empty:
                "#auditEmpty",

            search:
                "#auditSearch",

            actionFilter:
                "#auditActionFilter",

            severityFilter:
                "#auditSeverityFilter",

            userFilter:
                "#auditUserFilter",

            dateFrom:
                "#auditDateFrom",

            dateTo:
                "#auditDateTo",

            ipFilter:
                "#auditIpFilter",

            pagination:
                "#auditPagination",

            visibleCount:
                "#auditVisibleCount",

            totalCount:
                "#auditTotalCount",

            total:
                "#totalAuditLogs",

            security:
                "#securityAuditLogs",

            warning:
                "#warningAuditLogs",

            failed:
                "#failedAuditLogs",

            detailModal:
                "#auditDetailModal",

            detailContent:
                "#auditDetailContent",

            toast:
                "#auditToastContainer"

        }

    };


    /* ========================================================
       STATE
    ======================================================== */

    const state = {

        logs: [],

        filteredLogs: [],

        currentLog: null,

        loading: false,

        initialized: false,

        filters: {

            search: "",

            action: "",

            severity: "",

            user: "",

            dateFrom: "",

            dateTo: "",

            ip: ""

        }

    };


    /* ========================================================
       DOM
    ======================================================== */

    const $ = selector =>
        document.querySelector(selector);


    const $$ = selector =>
        [...document.querySelectorAll(selector)];


    /* ========================================================
       CSRF
    ======================================================== */

    function getCSRFToken() {

        const cookie = document.cookie
            .split("; ")
            .find(
                row =>
                    row.startsWith("csrftoken=")
            );

        if (cookie) {

            return decodeURIComponent(
                cookie.split("=")[1]
            );

        }


        const input =
            document.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            );


        return input
            ? input.value
            : "";

    }


    /* ========================================================
       API REQUEST
    ======================================================== */

    async function request(
        url,
        options = {}
    ) {

        const config = {

            credentials:
                "same-origin",

            headers: {

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json",

                "X-CSRFToken":
                    getCSRFToken(),

                "X-Requested-With":
                    "XMLHttpRequest"

            },

            ...options

        };


        config.headers = {

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            "X-CSRFToken":
                getCSRFToken(),

            "X-Requested-With":
                "XMLHttpRequest",

            ...(options.headers || {})

        };


        const response =
            await fetch(
                url,
                config
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch {

            data = {};

        }


        if (!response.ok) {

            throw new Error(

                data.message ||
                data.detail ||
                data.error ||
                `Request failed: ${response.status}`

            );

        }


        return data;

    }


    /* ========================================================
       LOAD LOGS
    ======================================================== */

    async function loadLogs() {

        setLoading(true);


        try {

            const response =
                await request(
                    CONFIG.endpoints.list
                );


            state.logs =

                Array.isArray(response)

                    ? response

                    : (
                        response.results ||
                        response.logs ||
                        response.audit_logs ||
                        []
                    );


            populateUserFilter();

            updateStatistics();

            applyFilters();

        } catch (error) {

            console.error(
                "Audit Log Error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load audit logs.",
                "error"
            );


            state.logs = [];

            state.filteredLogs = [];

            renderTable();

        } finally {

            setLoading(false);

        }

    }


    /* ========================================================
       FILTER
    ======================================================== */

    function applyFilters() {

        const search =
            ($("#auditSearch")?.value || "")
                .trim()
                .toLowerCase();


        const action =
            $("#auditActionFilter")?.value || "";


        const severity =
            $("#auditSeverityFilter")?.value || "";


        const user =
            $("#auditUserFilter")?.value || "";


        const dateFrom =
            $("#auditDateFrom")?.value || "";


        const dateTo =
            $("#auditDateTo")?.value || "";


        const ip =
            $("#auditIpFilter")?.value || ""
                .trim()
                .toLowerCase();


        state.filters = {

            search,

            action,

            severity,

            user,

            dateFrom,

            dateTo,

            ip

        };


        state.filteredLogs =
            state.logs.filter(
                log => {

                    const searchable = [

                        log.username,

                        log.user_name,

                        log.user?.username,

                        log.action,

                        log.description,

                        log.message,

                        log.ip_address,

                        log.ip,

                        log.object_name,

                        log.module

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    const matchesSearch =
                        !search ||
                        searchable.includes(search);


                    const logAction =
                        normalize(
                            log.action
                        );


                    const matchesAction =
                        !action ||
                        logAction ===
                        normalize(action);


                    const logSeverity =
                        normalize(
                            log.severity ||
                            log.level ||
                            "info"
                        );


                    const matchesSeverity =
                        !severity ||
                        logSeverity ===
                        normalize(severity);


                    const username =
                        log.username ||
                        log.user_name ||
                        log.user?.username ||
                        "";


                    const matchesUser =
                        !user ||
                        username === user;


                    const logIP =
                        String(
                            log.ip_address ||
                            log.ip ||
                            ""
                        )
                            .toLowerCase();


                    const matchesIP =
                        !ip ||
                        logIP.includes(ip);


                    const created =
                        log.created_at ||
                        log.timestamp ||
                        log.created;


                    const logDate =
                        created
                            ? new Date(created)
                            : null;


                    let matchesDate =
                        true;


                    if (
                        dateFrom &&
                        logDate &&
                        !Number.isNaN(
                            logDate.getTime()
                        )
                    ) {

                        const from =
                            new Date(
                                `${dateFrom}T00:00:00`
                            );


                        matchesDate =
                            logDate >= from;

                    }


                    if (
                        matchesDate &&
                        dateTo &&
                        logDate &&
                        !Number.isNaN(
                            logDate.getTime()
                        )
                    ) {

                        const to =
                            new Date(
                                `${dateTo}T23:59:59`
                            );


                        matchesDate =
                            logDate <= to;

                    }


                    return (

                        matchesSearch &&
                        matchesAction &&
                        matchesSeverity &&
                        matchesUser &&
                        matchesIP &&
                        matchesDate

                    );

                }
            );


        CONFIG.pagination.page = 1;


        renderTable();

    }


    /* ========================================================
       NORMALIZE
    ======================================================== */

    function normalize(value) {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");

    }


    /* ========================================================
       STATISTICS
    ======================================================== */

    function updateStatistics() {

        const total =
            state.logs.length;


        const security =
            state.logs.filter(
                log => {

                    const action =
                        normalize(
                            log.action
                        );


                    return [

                        "login",
                        "logout",
                        "activate",
                        "suspend",
                        "revoke",
                        "permission_change",
                        "password_change"

                    ].includes(action);

                }
            ).length;


        const warnings =
            state.logs.filter(
                log =>
                    normalize(
                        log.severity ||
                        log.level
                    ) === "warning"
            ).length;


        const failed =
            state.logs.filter(
                log => {

                    const severity =
                        normalize(
                            log.severity ||
                            log.level
                        );


                    const status =
                        normalize(
                            log.status ||
                            log.result
                        );


                    return (

                        severity === "danger" ||
                        severity === "critical" ||
                        status === "failed" ||
                        status === "failure"

                    );

                }
            ).length;


        setText(
            CONFIG.selectors.total,
            total
        );


        setText(
            CONFIG.selectors.security,
            security
        );


        setText(
            CONFIG.selectors.warning,
            warnings
        );


        setText(
            CONFIG.selectors.failed,
            failed
        );


        setText(
            CONFIG.selectors.totalCount,
            total
        );

    }


    /* ========================================================
       USER FILTER
    ======================================================== */

    function populateUserFilter() {

        const select =
            $(CONFIG.selectors.userFilter);


        if (!select) {
            return;
        }


        const current =
            select.value;


        const users =
            new Set();


        state.logs.forEach(
            log => {

                const username =
                    log.username ||
                    log.user_name ||
                    log.user?.username;


                if (username) {

                    users.add(
                        String(username)
                    );

                }

            }
        );


        select.innerHTML = `

            <option value="">
                All Users
            </option>

        `;


        [...users]
            .sort()
            .forEach(
                username => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        username;


                    option.textContent =
                        username;


                    select.appendChild(
                        option
                    );

                }
            );


        if (
            [...users].includes(current)
        ) {

            select.value =
                current;

        }

    }


    /* ========================================================
       RENDER TABLE
    ======================================================== */

    function renderTable() {

        const body =
            $(CONFIG.selectors.tableBody);


        if (!body) {
            return;
        }


        const page =
            CONFIG.pagination.page;


        const limit =
            CONFIG.pagination.limit;


        const start =
            (page - 1) * limit;


        const pageItems =
            state.filteredLogs.slice(
                start,
                start + limit
            );


        body.innerHTML = "";


        if (!pageItems.length) {

            renderEmpty();

            renderPagination();

            updateVisibleCount();

            return;

        }


        hideEmpty();


        pageItems.forEach(
            (log, index) => {

                body.insertAdjacentHTML(
                    "beforeend",
                    createRow(
                        log,
                        start + index + 1
                    )
                );

            }
        );


        bindRowActions();

        renderPagination();

        updateVisibleCount();

    }


    /* ========================================================
       CREATE ROW
    ======================================================== */

    function createRow(
        log,
        number
    ) {

        const id =
            log.id;


        const username =
            log.username ||
            log.user_name ||
            log.user?.username ||
            "System";


        const action =
            normalize(
                log.action ||
                "unknown"
            );


        const description =
            log.description ||
            log.message ||
            log.details ||
            "No description";


        const ip =
            log.ip_address ||
            log.ip ||
            "—";


        const created =
            log.created_at ||
            log.timestamp ||
            log.created;


        const severity =
            normalize(
                log.severity ||
                log.level ||
                "info"
            );


        return `

            <tr
                class="audit-row"
                data-audit-id="${escapeHTML(id)}"
            >

                <td>
                    ${number}
                </td>


                <td>

                    <div class="audit-user-cell">

                        <div class="audit-user-avatar">

                            ${escapeHTML(
                                getInitials(username)
                            )}

                        </div>

                        <div class="audit-user-info">

                            <strong>
                                ${escapeHTML(username)}
                            </strong>

                            <small>
                                ${
                                    escapeHTML(
                                        log.user?.email ||
                                        log.email ||
                                        "Administrator"
                                    )
                                }
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="audit-action-badge ${escapeHTML(action)}"
                    >

                        <i class="fa-solid ${getActionIcon(action)}"></i>

                        ${escapeHTML(
                            capitalize(action)
                        )}

                    </span>

                </td>


                <td>

                    <div
                        class="audit-description"
                        title="${escapeHTML(description)}"
                    >
                        ${escapeHTML(description)}
                    </div>

                </td>


                <td>

                    <span class="audit-ip">
                        ${escapeHTML(ip)}
                    </span>

                </td>


                <td>

                    <div class="audit-date">

                        <strong>
                            ${escapeHTML(
                                formatDate(created)
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                formatTime(created)
                            )}
                        </small>

                    </div>

                </td>


                <td>

                    ${severityBadge(severity)}

                </td>


                <td>

                    <div class="audit-row-actions">

                        <button
                            type="button"
                            class="audit-row-btn view-audit"
                            data-id="${escapeHTML(id)}"
                            title="View Details"
                        >

                            <i class="fa-regular fa-eye"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    /* ========================================================
       ACTION ICON
    ======================================================== */

    function getActionIcon(action) {

        const icons = {

            login:
                "fa-right-to-bracket",

            logout:
                "fa-right-from-bracket",

            create:
                "fa-plus",

            update:
                "fa-pen",

            delete:
                "fa-trash",

            activate:
                "fa-check",

            suspend:
                "fa-pause",

            revoke:
                "fa-ban"

        };


        return (
            icons[action] ||
            "fa-circle-info"
        );

    }


    /* ========================================================
       SEVERITY BADGE
    ======================================================== */

    function severityBadge(
        severity
    ) {

        const labels = {

            info:
                "Info",

            success:
                "Success",

            warning:
                "Warning",

            danger:
                "Critical"

        };


        return `

            <span
                class="audit-severity ${escapeHTML(severity)}"
            >

                <span
                    class="audit-severity-dot"
                ></span>

                ${
                    escapeHTML(
                        labels[severity] ||
                        capitalize(severity)
                    )
                }

            </span>

        `;

    }


    /* ========================================================
       ROW EVENTS
    ======================================================== */

    function bindRowActions() {

        $$(".view-audit")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openDetail(
                                button.dataset.id
                            );

                        }
                    );

                }
            );

    }


    /* ========================================================
       DETAIL
    ======================================================== */

    async function openDetail(id) {

        const modal =
            $(CONFIG.selectors.detailModal);


        const container =
            $(CONFIG.selectors.detailContent);


        if (!modal || !container) {
            return;
        }


        const localLog =
            state.logs.find(
                log =>
                    String(log.id) ===
                    String(id)
            );


        if (localLog) {

            renderDetail(
                localLog
            );

        } else {

            container.innerHTML = `

                <div class="audit-detail-loading">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Loading...

                </div>

            `;

        }


        openModal(modal);


        try {

            const response =
                await request(
                    CONFIG.endpoints.detail(id)
                );


            const log =
                response.log ||
                response.audit_log ||
                response;


            state.currentLog =
                log;


            renderDetail(log);

        } catch (error) {

            if (!localLog) {

                showToast(
                    error.message ||
                    "Unable to load audit details.",
                    "error"
                );

            }

        }

    }


    /* ========================================================
       DETAIL RENDER
    ======================================================== */

    function renderDetail(log) {

        const container =
            $(CONFIG.selectors.detailContent);


        if (!container) {
            return;
        }


        const username =
            log.username ||
            log.user_name ||
            log.user?.username ||
            "System";


        const action =
            normalize(
                log.action
            );


        const severity =
            normalize(
                log.severity ||
                log.level ||
                "info"
            );


        const description =
            log.description ||
            log.message ||
            log.details ||
            "No description available.";


        container.innerHTML = `

            <div class="audit-detail-grid">

                <div class="audit-detail-item">

                    <span>
                        User
                    </span>

                    <strong>
                        ${escapeHTML(username)}
                    </strong>

                </div>


                <div class="audit-detail-item">

                    <span>
                        Action
                    </span>

                    <strong>
                        ${escapeHTML(
                            capitalize(action)
                        )}
                    </strong>

                </div>


                <div class="audit-detail-item">

                    <span>
                        Severity
                    </span>

                    <strong>
                        ${escapeHTML(
                            capitalize(severity)
                        )}
                    </strong>

                </div>


                <div class="audit-detail-item">

                    <span>
                        IP Address
                    </span>

                    <strong class="audit-ip">
                        ${escapeHTML(
                            log.ip_address ||
                            log.ip ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="audit-detail-item">

                    <span>
                        Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(
                                log.created_at ||
                                log.timestamp
                            )
                        )}
                    </strong>

                </div>


                <div class="audit-detail-item">

                    <span>
                        Time
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatTime(
                                log.created_at ||
                                log.timestamp
                            )
                        )}
                    </strong>

                </div>


                <div class="audit-detail-item full">

                    <span>
                        Description
                    </span>

                    <div class="audit-detail-description">
                        ${escapeHTML(description)}
                    </div>

                </div>


                ${
                    log.object_name ||
                    log.module
                        ? `

                        <div class="audit-detail-item">

                            <span>
                                Module
                            </span>

                            <strong>
                                ${escapeHTML(
                                    log.module ||
                                    "—"
                                )}
                            </strong>

                        </div>

                        <div class="audit-detail-item">

                            <span>
                                Object
                            </span>

                            <strong>
                                ${escapeHTML(
                                    log.object_name ||
                                    "—"
                                )}
                            </strong>

                        </div>

                        `
                        : ""
                }

            </div>

        `;

    }


    /* ========================================================
       PAGINATION
    ======================================================== */

    function renderPagination() {

        const container =
            $(CONFIG.selectors.pagination);


        if (!container) {
            return;
        }


        const totalPages =
            Math.ceil(
                state.filteredLogs.length /
                CONFIG.pagination.limit
            );


        if (totalPages <= 1) {

            container.innerHTML = "";

            return;

        }


        const current =
            CONFIG.pagination.page;


        let html = `

            <button
                type="button"
                class="audit-pagination-btn"
                data-page="${current - 1}"
                ${current === 1 ? "disabled" : ""}
            >

                <i class="fa-solid fa-chevron-left"></i>

            </button>

        `;


        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            if (

                page === 1 ||
                page === totalPages ||
                Math.abs(
                    page - current
                ) <= 1

            ) {

                html += `

                    <button
                        type="button"
                        class="audit-pagination-btn ${
                            page === current
                                ? "active"
                                : ""
                        }"
                        data-page="${page}"
                    >
                        ${page}
                    </button>

                `;

            } else if (

                page === 2 ||
                page === totalPages - 1

            ) {

                html += `

                    <span
                        class="audit-pagination-dots"
                    >
                        ...
                    </span>

                `;

            }

        }


        html += `

            <button
                type="button"
                class="audit-pagination-btn"
                data-page="${current + 1}"
                ${
                    current === totalPages
                        ? "disabled"
                        : ""
                }
            >

                <i class="fa-solid fa-chevron-right"></i>

            </button>

        `;


        container.innerHTML =
            html;


        container
            .querySelectorAll(
                ".audit-pagination-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const page =
                                Number(
                                    button.dataset.page
                                );


                            if (
                                page < 1 ||
                                page > totalPages
                            ) {
                                return;
                            }


                            CONFIG.pagination.page =
                                page;


                            renderTable();

                        }
                    );

                }
            );

    }


    /* ========================================================
       MODAL
    ======================================================== */

    function openModal(modal) {

        modal.classList.add(
            "is-open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "audit-modal-open"
        );

    }


    function closeModal(modal) {

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "is-open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        if (
            !document.querySelector(
                ".audit-modal.is-open"
            )
        ) {

            document.body.classList.remove(
                "audit-modal-open"
            );

        }

    }


    function bindModals() {

        $$("[data-audit-modal-close]")
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        () => {

                            closeModal(
                                element.closest(
                                    ".audit-modal"
                                )
                            );

                        }
                    );

                }
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    $$(".audit-modal.is-open")
                        .forEach(
                            closeModal
                        );

                }

            }
        );

    }


    /* ========================================================
       FILTER EVENTS
    ======================================================== */

    function bindFilters() {

        const search =
            $(CONFIG.selectors.search);


        if (search) {

            search.addEventListener(
                "input",
                debounce(
                    applyFilters,
                    250
                )
            );

        }


        [

            CONFIG.selectors.actionFilter,
            CONFIG.selectors.severityFilter,
            CONFIG.selectors.userFilter

        ].forEach(
            selector => {

                const element =
                    $(selector);


                if (element) {

                    element.addEventListener(
                        "change",
                        applyFilters
                    );

                }

            }
        );


        const apply =
            $("#applyAuditFilters");


        if (apply) {

            apply.addEventListener(
                "click",
                () => {

                    applyFilters();

                    toggleAdvancedFilters(
                        false
                    );

                }
            );

        }


        const clear =
            $("#clearAuditFilters");


        if (clear) {

            clear.addEventListener(
                "click",
                clearFilters
            );

        }


        const clearEmpty =
            $("#clearEmptyFilters");


        if (clearEmpty) {

            clearEmpty.addEventListener(
                "click",
                clearFilters
            );

        }

    }


    /* ========================================================
       ADVANCED FILTER
    ======================================================== */

    function bindAdvancedFilter() {

        const button =
            $("#auditAdvancedFilterBtn");


        const close =
            $("#closeAuditFilters");


        if (button) {

            button.addEventListener(
                "click",
                () => {

                    const panel =
                        $("#auditAdvancedPanel");


                    toggleAdvancedFilters(
                        panel?.hidden
                    );

                }
            );

        }


        if (close) {

            close.addEventListener(
                "click",
                () => {

                    toggleAdvancedFilters(
                        false
                    );

                }
            );

        }

    }


    function toggleAdvancedFilters(
        show
    ) {

        const panel =
            $("#auditAdvancedPanel");


        if (!panel) {
            return;
        }


        panel.hidden =
            !show;

    }


    /* ========================================================
       CLEAR FILTERS
    ======================================================== */

    function clearFilters() {

        [

            CONFIG.selectors.search,
            CONFIG.selectors.actionFilter,
            CONFIG.selectors.severityFilter,
            CONFIG.selectors.userFilter,
            CONFIG.selectors.dateFrom,
            CONFIG.selectors.dateTo,
            CONFIG.selectors.ipFilter

        ].forEach(
            selector => {

                const element =
                    $(selector);


                if (element) {

                    element.value = "";

                }

            }
        );


        applyFilters();

        showToast(
            "Filters cleared.",
            "info"
        );

    }


    /* ========================================================
       REFRESH
    ======================================================== */

    function bindRefresh() {

        const button =
            $("#refreshAuditLogs");


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async () => {

                setButtonLoading(
                    button,
                    true
                );


                try {

                    await loadLogs();

                    showToast(
                        "Audit logs refreshed.",
                        "success"
                    );

                } finally {

                    setButtonLoading(
                        button,
                        false
                    );

                }

            }
        );

    }


    /* ========================================================
       EXPORT
    ======================================================== */

    function bindExport() {

        const button =
            $("#exportAuditLogs");


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            exportLogs
        );

    }


    async function exportLogs() {

        const button =
            $("#exportAuditLogs");


        setButtonLoading(
            button,
            true
        );


        try {

            const params =
                new URLSearchParams();


            Object.entries(
                state.filters
            ).forEach(
                ([key, value]) => {

                    if (value) {

                        params.set(
                            key,
                            value
                        );

                    }

                }
            );


            const url =
                `${CONFIG.endpoints.export}?${params.toString()}`;


            const response =
                await fetch(
                    url,
                    {
                        credentials:
                            "same-origin",

                        headers: {

                            "X-CSRFToken":
                                getCSRFToken(),

                            "X-Requested-With":
                                "XMLHttpRequest"

                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Export failed."
                );

            }


            const blob =
                await response.blob();


            const downloadUrl =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                downloadUrl;


            link.download =
                `audit-logs-${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`;


            document.body.appendChild(
                link
            );


            link.click();

            link.remove();


            URL.revokeObjectURL(
                downloadUrl
            );


            showToast(
                "Audit logs exported successfully.",
                "success"
            );

        } catch (error) {

            showToast(
                error.message ||
                "Unable to export audit logs.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );

        }

    }


    /* ========================================================
       SEARCH SHORTCUT
    ======================================================== */

    function bindKeyboard() {

        document.addEventListener(
            "keydown",
            event => {

                if (

                    (event.ctrlKey ||
                    event.metaKey) &&

                    event.key.toLowerCase() === "k"

                ) {

                    event.preventDefault();


                    const search =
                        $(CONFIG.selectors.search);


                    if (search) {

                        search.focus();

                    }

                }

            }
        );

    }


    /* ========================================================
       LOADING
    ======================================================== */

    function setLoading(
        loading
    ) {

        state.loading =
            loading;


        const loader =
            $(CONFIG.selectors.loading);


        if (loader) {

            loader.style.display =
                loading
                    ? "flex"
                    : "none";

        }

    }


    function setButtonLoading(
        button,
        loading
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            if (
                !button.dataset.originalHtml
            ) {

                button.dataset.originalHtml =
                    button.innerHTML;

            }


            button.disabled =
                true;


            button.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Processing...
                </span>

            `;

        } else {

            button.disabled =
                false;


            if (
                button.dataset.originalHtml
            ) {

                button.innerHTML =
                    button.dataset.originalHtml;

            }

        }

    }


    /* ========================================================
       EMPTY
    ======================================================== */

    function renderEmpty() {

        const empty =
            $(CONFIG.selectors.empty);


        if (empty) {

            empty.hidden =
                false;

        }

    }


    function hideEmpty() {

        const empty =
            $(CONFIG.selectors.empty);


        if (empty) {

            empty.hidden =
                true;

        }

    }


    /* ========================================================
       VISIBLE COUNT
    ======================================================== */

    function updateVisibleCount() {

        const element =
            $(CONFIG.selectors.visibleCount);


        if (!element) {
            return;
        }


        const page =
            CONFIG.pagination.page;


        const limit =
            CONFIG.pagination.limit;


        const start =
            (page - 1) * limit;


        const count =
            Math.min(
                limit,
                Math.max(
                    0,
                    state.filteredLogs.length -
                    start
                )
            );


        element.textContent =
            count;

    }


    /* ========================================================
       TOAST
    ======================================================== */

    function showToast(
        message,
        type = "info"
    ) {

        const container =
            $(CONFIG.selectors.toast);


        if (!container) {
            return;
        }


        const icons = {

            success:
                "fa-circle-check",

            error:
                "fa-circle-xmark",

            info:
                "fa-circle-info"

        };


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `audit-toast audit-toast-${type}`;


        toast.innerHTML = `

            <div class="audit-toast-icon">

                <i class="fa-solid ${
                    icons[type] ||
                    icons.info
                }"></i>

            </div>


            <div class="audit-toast-message">

                ${escapeHTML(message)}

            </div>


            <button
                type="button"
                class="audit-toast-close"
                aria-label="Close notification"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;


        container.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );

            }
        );


        const remove =
            () => {

                toast.classList.remove(
                    "show"
                );


                setTimeout(
                    () =>
                        toast.remove(),
                    250
                );

            };


        toast.querySelector(
            ".audit-toast-close"
        ).addEventListener(
            "click",
            remove
        );


        setTimeout(
            remove,
            4000
        );

    }


    /* ========================================================
       HELPERS
    ======================================================== */

    function setText(
        selector,
        value
    ) {

        const element =
            $(selector);


        if (element) {

            element.textContent =
                value;

        }

    }


    function getInitials(
        name
    ) {

        if (!name) {
            return "?";
        }


        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(
                word =>
                    word.charAt(0)
            )
            .join("")
            .toUpperCase();

    }


    function capitalize(
        value
    ) {

        if (!value) {
            return "";
        }


        return String(value)
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );

    }


    function formatDate(
        value
    ) {

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

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).format(date);

    }


    function formatTime(
        value
    ) {

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

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }
        ).format(date);

    }


    function escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

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
        delay = 300
    ) {

        let timeout;


        return (...args) => {

            clearTimeout(
                timeout
            );


            timeout =
                setTimeout(
                    () =>
                        callback(...args),
                    delay
                );

        };

    }


    /* ========================================================
       INITIALIZE
    ======================================================== */

    async function init() {

        if (
            state.initialized
        ) {

            return;

        }


        state.initialized =
            true;


        bindFilters();

        bindAdvancedFilter();

        bindRefresh();

        bindExport();

        bindModals();

        bindKeyboard();


        await loadLogs();

    }


    /* ========================================================
       PUBLIC API
    ======================================================== */

    return {

        init,

        loadLogs,

        applyFilters,

        clearFilters,

        exportLogs,

        openDetail,

        showToast

    };

})();


/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        AuditLogManager.init();

    }
);