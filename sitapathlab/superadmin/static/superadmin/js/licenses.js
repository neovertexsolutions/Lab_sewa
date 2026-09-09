/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN PORTAL
 * LICENSE MANAGEMENT
 * Production-Level Frontend Controller
 * ============================================================
 *
 * Features:
 * - License listing
 * - Search
 * - Status filter
 * - Vendor filter
 * - Plan filter
 * - Date filter
 * - Pagination
 * - Create license
 * - Edit license
 * - View details
 * - Activate
 * - Suspend
 * - Revoke
 * - Renew
 * - Bulk selection
 * - Copy license key
 * - CSRF protection
 * - API error handling
 * - Toast notifications
 * - Modal management
 * - Action menu
 * - Loading states
 * - Expiry calculation
 * - XSS protection
 * - Django compatible
 *
 * ============================================================
 */

"use strict";


/* ============================================================
   LICENSE MANAGER
============================================================ */

const LicenseManager = (() => {


    /* ========================================================
       CONFIGURATION
    ======================================================== */

    const CONFIG = {

        endpoints: {

            list:
                "/superadmin/api/licenses/",

            create:
                "/superadmin/api/licenses/create/",

            detail:
                id => `/superadmin/api/licenses/${id}/`,

            update:
                id => `/superadmin/api/licenses/${id}/update/`,

            delete:
                id => `/superadmin/api/licenses/${id}/delete/`,

            activate:
                id => `/superadmin/api/licenses/${id}/activate/`,

            suspend:
                id => `/superadmin/api/licenses/${id}/suspend/`,

            revoke:
                id => `/superadmin/api/licenses/${id}/revoke/`,

            renew:
                id => `/superadmin/api/licenses/${id}/renew/`
        },


        pagination: {

            page: 1,

            limit: 10

        },


        selectors: {

            table:
                "#licenseTableBody",

            search:
                "#licenseSearch",

            status:
                "#statusFilter",

            vendor:
                "#vendorFilter",

            plan:
                "#planFilter",

            date:
                "#dateFilter",

            selectAll:
                "#selectAllLicenses",

            loading:
                "#licenseLoading",

            empty:
                "#licenseEmpty",

            pagination:
                "#licensePagination",

            total:
                "#licenseTotalCount",

            createForm:
                "#licenseCreateForm",

            editForm:
                "#licenseEditForm",

            modal:
                "#licenseModal",

            detailModal:
                "#licenseDetailModal",

            confirmModal:
                "#confirmModal",

            toast:
                "#toastContainer",

            bulkActions:
                "[data-bulk-actions]",

            selectedCount:
                "[data-selected-count]"

        },


        requestTimeout:
            30000,

        toastDuration:
            4000

    };


    /* ========================================================
       STATE
    ======================================================== */

    const state = {

        licenses: [],

        filteredLicenses: [],

        selectedLicenses: new Set(),

        currentLicense: null,

        currentAction: null,

        loading: false,

        initialized: false,

        requestController: null

    };


    /* ========================================================
       DOM HELPERS
    ======================================================== */

    const $ = (
        selector,
        parent = document
    ) => {

        return parent.querySelector(selector);

    };


    const $$ = (
        selector,
        parent = document
    ) => {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    };


    /* ========================================================
       CSRF
    ======================================================== */

    function getCSRFToken() {

        const cookie = document.cookie
            .split("; ")
            .find(
                row =>
                    row.startsWith(
                        "csrftoken="
                    )
            );


        if (cookie) {

            return decodeURIComponent(
                cookie.split("=")[1]
            );

        }


        const input =
            $('input[name="csrfmiddlewaretoken"]');


        if (input) {

            return input.value;

        }


        const meta =
            $('meta[name="csrf-token"]');


        if (meta) {

            return meta.content;

        }


        return "";

    }


    /* ========================================================
       API REQUEST
    ======================================================== */

    async function request(
        url,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () =>
                    controller.abort(),
                CONFIG.requestTimeout
            );


        const method =
            (
                options.method ||
                "GET"
            ).toUpperCase();


        const headers = {

            "Accept":
                "application/json",

            "X-Requested-With":
                "XMLHttpRequest",

            ...(options.headers || {})

        };


        if (
            method !== "GET" &&
            method !== "HEAD"
        ) {

            headers["X-CSRFToken"] =
                getCSRFToken();

        }


        const requestOptions = {

            ...options,

            method,

            headers,

            credentials:
                "same-origin",

            signal:
                controller.signal

        };


        if (
            requestOptions.body &&
            typeof requestOptions.body !== "string" &&
            !(requestOptions.body instanceof FormData)
        ) {

            requestOptions.body =
                JSON.stringify(
                    requestOptions.body
                );


            headers["Content-Type"] =
                "application/json";

        }


        try {

            const response =
                await fetch(
                    url,
                    requestOptions
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data = null;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            } else {

                const text =
                    await response.text();

                data =
                    text
                        ? { message: text }
                        : {};

            }


            if (!response.ok) {

                throw createAPIError(
                    response,
                    data
                );

            }


            return data;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new Error(
                    "Request timed out. Please try again."
                );

            }


            console.error(
                "[LicenseManager]",
                error
            );


            throw error;

        } finally {

            clearTimeout(timeout);

        }

    }


    /* ========================================================
       API ERROR
    ======================================================== */

    function createAPIError(
        response,
        data
    ) {

        let message =
            "Something went wrong.";


        if (data) {

            if (
                typeof data.message ===
                "string"
            ) {

                message =
                    data.message;

            } else if (
                typeof data.detail ===
                "string"
            ) {

                message =
                    data.detail;

            } else if (
                typeof data.error ===
                "string"
            ) {

                message =
                    data.error;

            } else if (
                typeof data ===
                "object"
            ) {

                const values =
                    Object.values(data)
                        .flat()
                        .filter(Boolean);


                if (values.length) {

                    message =
                        values.join(" ");

                }

            }

        }


        if (
            response.status === 401
        ) {

            message =
                "Your session has expired. Please login again.";

        }


        if (
            response.status === 403
        ) {

            message =
                "You do not have permission to perform this action.";

        }


        if (
            response.status === 404
        ) {

            message =
                "License resource was not found.";

        }


        if (
            response.status >= 500
        ) {

            message =
                "Server error. Please try again later.";

        }


        const error =
            new Error(message);


        error.status =
            response.status;


        error.data =
            data;


        return error;

    }


    /* ========================================================
       LOAD LICENSES
    ======================================================== */

    async function loadLicenses() {

        setLoading(true);


        try {

            const response =
                await request(
                    CONFIG.endpoints.list
                );


            state.licenses =
                normalizeLicenseResponse(
                    response
                );


            removeInvalidSelections();


            applyFilters(
                false
            );


        } catch (error) {

            state.licenses = [];

            state.filteredLicenses = [];


            renderEmptyState(
                "Unable to load licenses",
                error.message ||
                "Please try again."
            );


            updateTotalCount();


            showToast(
                error.message ||
                "Unable to load licenses.",
                "error"
            );


        } finally {

            setLoading(false);

        }

    }


    /* ========================================================
       NORMALIZE RESPONSE
    ======================================================== */

    function normalizeLicenseResponse(
        response
    ) {

        if (
            Array.isArray(response)
        ) {

            return response;

        }


        if (
            Array.isArray(
                response?.results
            )
        ) {

            return response.results;

        }


        if (
            Array.isArray(
                response?.licenses
            )
        ) {

            return response.licenses;

        }


        if (
            Array.isArray(
                response?.data
            )
        ) {

            return response.data;

        }


        return [];

    }


    /* ========================================================
       FILTERS
    ======================================================== */

    function applyFilters(
        resetPage = true
    ) {

        const search =
            (
                $(CONFIG.selectors.search)
                    ?.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            (
                $(CONFIG.selectors.status)
                    ?.value || ""
            )
                .trim()
                .toLowerCase();


        const vendor =
            (
                $(CONFIG.selectors.vendor)
                    ?.value || ""
            )
                .trim()
                .toLowerCase();


        const plan =
            (
                $(CONFIG.selectors.plan)
                    ?.value || ""
            )
                .trim()
                .toLowerCase();


        const dateFilter =
            (
                $(CONFIG.selectors.date)
                    ?.value || ""
            )
                .trim()
                .toLowerCase();


        state.filteredLicenses =
            state.licenses.filter(
                license => {

                    const searchable =
                        [

                            license.license_key,

                            license.key,

                            license.vendor_name,

                            license.vendor?.name,

                            license.email,

                            license.username,

                            license.plan_name,

                            license.plan?.name

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    const licenseStatus =
                        getLicenseStatus(
                            license
                        );


                    const vendorName =
                        (
                            license.vendor_name ||
                            license.vendor?.name ||
                            ""
                        )
                            .toLowerCase();


                    const planName =
                        (
                            license.plan_name ||
                            license.plan?.name ||
                            ""
                        )
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        searchable.includes(
                            search
                        );


                    const matchesStatus =
                        !status ||
                        licenseStatus ===
                        normalizeStatus(
                            status
                        );


                    const matchesVendor =
                        !vendor ||
                        vendorName === vendor;


                    const matchesPlan =
                        !plan ||
                        planName === plan;


                    const matchesDate =
                        matchesDateFilter(
                            license,
                            dateFilter
                        );


                    return (

                        matchesSearch &&

                        matchesStatus &&

                        matchesVendor &&

                        matchesPlan &&

                        matchesDate

                    );

                }
            );


        if (resetPage) {

            state.pagination = {

                page: 1,

                limit:
                    CONFIG.pagination.limit

            };

        }


        renderTable();

        updateTotalCount();

        updateBulkActions();

    }


    /* ========================================================
       DATE FILTER
    ======================================================== */

    function matchesDateFilter(
        license,
        filter
    ) {

        if (!filter) {
            return true;
        }


        const dateValue =
            license.created_at ||
            license.start_date;


        if (!dateValue) {
            return false;
        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return false;

        }


        const now =
            new Date();


        if (
            filter === "today"
        ) {

            return (
                date.toDateString() ===
                now.toDateString()
            );

        }


        if (
            filter === "week"
        ) {

            const weekAgo =
                new Date();

            weekAgo.setDate(
                now.getDate() - 7
            );


            return date >= weekAgo;

        }


        if (
            filter === "month"
        ) {

            const monthAgo =
                new Date();

            monthAgo.setMonth(
                now.getMonth() - 1
            );


            return date >= monthAgo;

        }


        if (
            filter === "year"
        ) {

            return (
                date.getFullYear() ===
                now.getFullYear()
            );

        }


        return true;

    }


    /* ========================================================
       STATUS
    ======================================================== */

    function normalizeStatus(
        status
    ) {

        return String(
            status || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_"
            );

    }


    function getLicenseStatus(
        license
    ) {

        const rawStatus =
            normalizeStatus(
                license.status
            );


        if (
            [
                "revoked",
                "suspended",
                "inactive",
                "pending"
            ].includes(
                rawStatus
            )
        ) {

            return rawStatus;

        }


        const expiry =
            license.expires_at ||
            license.expiry_date ||
            license.end_date;


        if (expiry) {

            const expiryDate =
                new Date(expiry);


            if (
                !Number.isNaN(
                    expiryDate.getTime()
                ) &&
                expiryDate.getTime() <
                Date.now()
            ) {

                return "expired";

            }

        }


        return rawStatus ||
            "active";

    }


    /* ========================================================
       STATUS BADGE
    ======================================================== */

    function statusBadge(
        status
    ) {

        const normalized =
            normalizeStatus(
                status
            );


        const labels = {

            active:
                "Active",

            expired:
                "Expired",

            suspended:
                "Suspended",

            revoked:
                "Revoked",

            pending:
                "Pending",

            inactive:
                "Inactive"

        };


        return `

            <span
                class="status-badge status-${escapeHTML(normalized)}"
            >

                <span class="status-dot"></span>

                ${escapeHTML(
                    labels[normalized] ||
                    capitalize(normalized)
                )}

            </span>

        `;

    }


    /* ========================================================
       TABLE
    ======================================================== */

    function renderTable() {

        const table =
            $(CONFIG.selectors.table);


        if (!table) {
            return;
        }


        const page =
            state.pagination.page;


        const limit =
            state.pagination.limit;


        const start =
            (page - 1) *
            limit;


        const items =
            state.filteredLicenses.slice(
                start,
                start + limit
            );


        if (!items.length) {

            renderEmptyState();

            renderPagination();

            updateSelectAllState();

            return;

        }


        table.innerHTML =
            items
                .map(
                    createLicenseRow
                )
                .join("");


        renderPagination();

        updateSelectAllState();

    }


    /* ========================================================
       TABLE ROW
    ======================================================== */

    function createLicenseRow(
        license
    ) {

        const id =
            license.id;


        const key =
            license.license_key ||
            license.key ||
            "";


        const vendor =
            license.vendor_name ||
            license.vendor?.name ||
            "Unknown Vendor";


        const username =
            license.username ||
            license.user?.username ||
            "—";


        const plan =
            license.plan_name ||
            license.plan?.name ||
            "—";


        const expiry =
            license.expires_at ||
            license.expiry_date ||
            license.end_date;


        const status =
            getLicenseStatus(
                license
            );


        const selected =
            state.selectedLicenses.has(
                String(id)
            );


        return `

            <tr
                class="license-row"
                data-license-id="${escapeHTML(id)}"
            >

                <td class="selection-cell">

                    <input
                        type="checkbox"
                        class="license-checkbox"
                        data-id="${escapeHTML(id)}"
                        ${selected ? "checked" : ""}
                        aria-label="Select license"
                    >

                </td>


                <td>

                    <div class="license-key-wrapper">

                        <span class="license-key">
                            ${escapeHTML(
                                maskLicenseKey(key)
                            )}
                        </span>

                        <button
                            type="button"
                            class="copy-license-btn"
                            data-copy="${escapeHTML(key)}"
                            title="Copy license key"
                            aria-label="Copy license key"
                        >

                            <i
                                class="fa-regular fa-copy"
                            ></i>

                        </button>

                    </div>

                </td>


                <td>

                    <div class="vendor-cell">

                        <div class="vendor-avatar">

                            ${escapeHTML(
                                getInitials(
                                    vendor
                                )
                            )}

                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(vendor)}
                            </strong>

                            <small>
                                ${escapeHTML(username)}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="plan-name">
                        ${escapeHTML(plan)}
                    </span>

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(
                            license.created_at
                        )
                    )}

                </td>


                <td>

                    <div class="expiry-cell">

                        <strong>
                            ${escapeHTML(
                                formatDate(
                                    expiry
                                )
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                getExpiryText(
                                    expiry,
                                    status
                                )
                            )}
                        </small>

                    </div>

                </td>


                <td>

                    ${statusBadge(status)}

                </td>


                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="action-btn view-license"
                            data-id="${escapeHTML(id)}"
                            title="View license"
                        >

                            <i
                                class="fa-regular fa-eye"
                            ></i>

                        </button>


                        <button
                            type="button"
                            class="action-btn edit-license"
                            data-id="${escapeHTML(id)}"
                            title="Edit license"
                        >

                            <i
                                class="fa-solid fa-pen"
                            ></i>

                        </button>


                        <button
                            type="button"
                            class="action-btn more-license"
                            data-id="${escapeHTML(id)}"
                            title="More actions"
                            aria-haspopup="true"
                        >

                            <i
                                class="fa-solid fa-ellipsis-vertical"
                            ></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    /* ========================================================
       EVENT DELEGATION
    ======================================================== */

    function bindTableEvents() {

        const table =
            $(CONFIG.selectors.table);


        if (!table) {
            return;
        }


        table.addEventListener(
            "click",
            event => {

                const copyButton =
                    event.target.closest(
                        ".copy-license-btn"
                    );


                if (copyButton) {

                    copyToClipboard(
                        copyButton.dataset.copy
                    );

                    return;

                }


                const viewButton =
                    event.target.closest(
                        ".view-license"
                    );


                if (viewButton) {

                    openLicenseDetail(
                        viewButton.dataset.id
                    );

                    return;

                }


                const editButton =
                    event.target.closest(
                        ".edit-license"
                    );


                if (editButton) {

                    editLicense(
                        editButton.dataset.id
                    );

                    return;

                }


                const moreButton =
                    event.target.closest(
                        ".more-license"
                    );


                if (moreButton) {

                    showActionMenu(
                        event,
                        moreButton.dataset.id
                    );

                }

            }
        );


        table.addEventListener(
            "change",
            event => {

                const checkbox =
                    event.target.closest(
                        ".license-checkbox"
                    );


                if (!checkbox) {
                    return;
                }


                const id =
                    String(
                        checkbox.dataset.id
                    );


                if (
                    checkbox.checked
                ) {

                    state.selectedLicenses.add(
                        id
                    );

                } else {

                    state.selectedLicenses.delete(
                        id
                    );

                }


                updateSelectAllState();

                updateBulkActions();

            }
        );

    }


    /* ========================================================
       ACTION MENU
    ======================================================== */

    function showActionMenu(
        event,
        id
    ) {

        closeActionMenus();


        const license =
            findLicense(id);


        if (!license) {
            return;
        }


        const status =
            getLicenseStatus(
                license
            );


        const menu =
            document.createElement(
                "div"
            );


        menu.className =
            "license-action-menu";


        menu.innerHTML = `

            <button data-action="view">
                <i class="fa-regular fa-eye"></i>
                View License
            </button>

            <button data-action="edit">
                <i class="fa-solid fa-pen"></i>
                Edit License
            </button>

            <button data-action="copy">
                <i class="fa-regular fa-copy"></i>
                Copy License Key
            </button>

            <button data-action="renew">
                <i class="fa-solid fa-rotate"></i>
                Renew License
            </button>

            ${
                status === "active"
                    ? `

                        <button data-action="suspend">
                            <i class="fa-solid fa-pause"></i>
                            Suspend
                        </button>

                        <button
                            data-action="revoke"
                            class="danger"
                        >
                            <i class="fa-solid fa-ban"></i>
                            Revoke
                        </button>

                    `
                    : `

                        <button data-action="activate">
                            <i class="fa-solid fa-check"></i>
                            Activate
                        </button>

                    `
            }

        `;


        document.body.appendChild(
            menu
        );


        const button =
            event.currentTarget;


        const rect =
            button.getBoundingClientRect();


        const menuWidth =
            menu.offsetWidth;


        let left =
            rect.right -
            menuWidth;


        let top =
            rect.bottom +
            6;


        if (
            left < 8
        ) {

            left = 8;

        }


        if (
            left + menuWidth >
            window.innerWidth - 8
        ) {

            left =
                window.innerWidth -
                menuWidth -
                8;

        }


        menu.style.position =
            "fixed";


        menu.style.top =
            `${top}px`;


        menu.style.left =
            `${left}px`;


        menu.querySelectorAll(
            "button"
        )
            .forEach(
                menuButton => {

                    menuButton.addEventListener(
                        "click",
                        () => {

                            const action =
                                menuButton.dataset.action;


                            closeActionMenus();


                            handleAction(
                                action,
                                id
                            );

                        }
                    );

                }
            );


        setTimeout(
            () => {

                document.addEventListener(
                    "click",
                    outsideActionMenu,
                    {
                        once: true
                    }
                );

            },
            0
        );

    }


    function outsideActionMenu(
        event
    ) {

        if (
            !event.target.closest(
                ".license-action-menu"
            ) &&
            !event.target.closest(
                ".more-license"
            )
        ) {

            closeActionMenus();

        }

    }


    function closeActionMenus() {

        $$(".license-action-menu")
            .forEach(
                menu =>
                    menu.remove()
            );

    }


    /* ========================================================
       ACTION HANDLER
    ======================================================== */

    async function handleAction(
        action,
        id
    ) {

        const license =
            findLicense(id);


        if (!license) {

            showToast(
                "License not found.",
                "error"
            );

            return;

        }


        switch (action) {

            case "view":

                await openLicenseDetail(id);

                break;


            case "edit":

                await editLicense(id);

                break;


            case "copy":

                await copyToClipboard(
                    license.license_key ||
                    license.key
                );

                break;


            case "activate":

                confirmAction(
                    id,
                    "activate",
                    "Activate License?",
                    "This license will become active immediately."
                );

                break;


            case "suspend":

                confirmAction(
                    id,
                    "suspend",
                    "Suspend License?",
                    "The vendor will temporarily lose access."
                );

                break;


            case "revoke":

                confirmAction(
                    id,
                    "revoke",
                    "Revoke License?",
                    "This action permanently disables the license."
                );

                break;


            case "renew":

                confirmAction(
                    id,
                    "renew",
                    "Renew License?",
                    "The license validity period will be extended."
                );

                break;

        }

    }


    /* ========================================================
       FIND LICENSE
    ======================================================== */

    function findLicense(
        id
    ) {

        return state.licenses.find(
            license =>
                String(license.id) ===
                String(id)
        );

    }


    /* ========================================================
       DETAIL
    ======================================================== */

    async function openLicenseDetail(
        id
    ) {

        try {

            const response =
                await request(
                    CONFIG.endpoints.detail(id)
                );


            const license =
                response?.license ||
                response?.data ||
                response;


            state.currentLicense =
                license;


            renderLicenseDetail(
                license
            );


            const modal =
                $(CONFIG.selectors.detailModal);


            if (modal) {

                openModal(modal);

            }

        } catch (error) {

            showToast(
                error.message ||
                "Unable to load license details.",
                "error"
            );

        }

    }


    /* ========================================================
       DETAIL RENDER
    ======================================================== */

    function renderLicenseDetail(
        license
    ) {

        const container =
            $("[data-license-detail]");


        if (!container) {
            return;
        }


        const key =
            license.license_key ||
            license.key ||
            "—";


        const vendor =
            license.vendor_name ||
            license.vendor?.name ||
            "—";


        const plan =
            license.plan_name ||
            license.plan?.name ||
            "—";


        const status =
            getLicenseStatus(
                license
            );


        container.innerHTML = `

            <div class="license-detail-header">

                <div>

                    <span class="detail-label">
                        LICENSE KEY
                    </span>

                    <div class="detail-license-key">

                        <strong>
                            ${escapeHTML(key)}
                        </strong>

                        <button
                            type="button"
                            class="copy-license-btn"
                            data-copy="${escapeHTML(key)}"
                            title="Copy license key"
                        >

                            <i
                                class="fa-regular fa-copy"
                            ></i>

                        </button>

                    </div>

                </div>


                ${statusBadge(status)}

            </div>


            <div class="license-detail-grid">

                ${detailItem(
                    "Vendor",
                    vendor
                )}

                ${detailItem(
                    "Plan",
                    plan
                )}

                ${detailItem(
                    "Username",
                    license.username
                )}

                ${detailItem(
                    "Email",
                    license.email
                )}

                ${detailItem(
                    "Created",
                    formatDate(
                        license.created_at
                    )
                )}

                ${detailItem(
                    "Start Date",
                    formatDate(
                        license.start_date
                    )
                )}

                ${detailItem(
                    "Expiry Date",
                    formatDate(
                        license.expires_at ||
                        license.expiry_date
                    )
                )}

                ${detailItem(
                    "Status",
                    capitalize(status)
                )}

            </div>

        `;


        const copyButton =
            container.querySelector(
                ".copy-license-btn"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                () =>
                    copyToClipboard(
                        copyButton.dataset.copy
                    )
            );

        }

    }


    function detailItem(
        label,
        value
    ) {

        return `

            <div class="detail-item">

                <span>
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${escapeHTML(
                        value || "—"
                    )}
                </strong>

            </div>

        `;

    }


    /* ========================================================
       EDIT
    ======================================================== */

    async function editLicense(
        id
    ) {

        try {

            const response =
                await request(
                    CONFIG.endpoints.detail(id)
                );


            const license =
                response?.license ||
                response?.data ||
                response;


            state.currentLicense =
                license;


            populateEditForm(
                license
            );


            const form =
                $(CONFIG.selectors.editForm);


            if (form) {

                form.dataset.id =
                    license.id;

            }


            const modal =
                $(CONFIG.selectors.modal);


            if (modal) {

                openModal(modal);

            }

        } catch (error) {

            showToast(
                error.message ||
                "Unable to load license.",
                "error"
            );

        }

    }


    /* ========================================================
       POPULATE FORM
    ======================================================== */

    function populateEditForm(
        license
    ) {

        const form =
            $(CONFIG.selectors.editForm);


        if (!form) {
            return;
        }


        Object.entries(
            license
        )
            .forEach(
                ([key, value]) => {

                    const field =
                        form.querySelector(
                            `[name="${CSS.escape(key)}"]`
                        );


                    if (!field) {
                        return;
                    }


                    if (
                        field.type ===
                        "checkbox"
                    ) {

                        field.checked =
                            Boolean(value);

                    } else {

                        field.value =
                            value ?? "";

                    }

                }
            );

    }


    /* ========================================================
       CREATE
    ======================================================== */

    async function createLicense(
        form
    ) {

        if (!form) {
            return;
        }


        const button =
            form.querySelector(
                '[type="submit"]'
            );


        const payload =
            serializeForm(
                form
            );


        setButtonLoading(
            button,
            true
        );


        try {

            await request(
                CONFIG.endpoints.create,
                {
                    method: "POST",
                    body: payload
                }
            );


            showToast(
                "License created successfully.",
                "success"
            );


            form.reset();

            closeAllModals();

            await loadLicenses();


        } catch (error) {

            showToast(
                error.message ||
                "Unable to create license.",
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
       UPDATE
    ======================================================== */

    async function updateLicense(
        form
    ) {

        if (!form) {
            return;
        }


        const id =
            form.dataset.id ||
            state.currentLicense?.id;


        if (!id) {

            showToast(
                "License ID is missing.",
                "error"
            );

            return;

        }


        const button =
            form.querySelector(
                '[type="submit"]'
            );


        const payload =
            serializeForm(
                form
            );


        setButtonLoading(
            button,
            true
        );


        try {

            await request(
                CONFIG.endpoints.update(id),
                {
                    method: "PATCH",
                    body: payload
                }
            );


            showToast(
                "License updated successfully.",
                "success"
            );


            closeAllModals();

            await loadLicenses();


        } catch (error) {

            showToast(
                error.message ||
                "Unable to update license.",
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
       FORM SERIALIZER
    ======================================================== */

    function serializeForm(
        form
    ) {

        const formData =
            new FormData(form);


        const payload = {};


        for (
            const [key, value]
            of formData.entries()
        ) {

            if (
                Object.prototype.hasOwnProperty
                    .call(
                        payload,
                        key
                    )
            ) {

                if (
                    !Array.isArray(
                        payload[key]
                    )
                ) {

                    payload[key] =
                        [
                            payload[key]
                        ];

                }


                payload[key].push(
                    value
                );

            } else {

                payload[key] =
                    value;

            }

        }


        form.querySelectorAll(
            'input[type="checkbox"]'
        )
            .forEach(
                checkbox => {

                    if (
                        checkbox.name &&
                        !formData.has(
                            checkbox.name
                        )
                    ) {

                        payload[
                            checkbox.name
                        ] =
                            false;

                    }

                }
            );


        return payload;

    }


    /* ========================================================
       ACTION API
    ======================================================== */

    async function executeAction(
        id,
        action
    ) {

        const endpoint =
            CONFIG.endpoints[action];


        if (
            typeof endpoint !==
            "function"
        ) {

            showToast(
                "Unsupported license action.",
                "error"
            );

            return;

        }


        try {

            await request(
                endpoint(id),
                {
                    method: "POST",
                    body: {}
                }
            );


            const messages = {

                activate:
                    "License activated successfully.",

                suspend:
                    "License suspended successfully.",

                revoke:
                    "License revoked successfully.",

                renew:
                    "License renewed successfully."

            };


            showToast(
                messages[action] ||
                "License updated successfully.",
                "success"
            );


            closeAllModals();

            await loadLicenses();


        } catch (error) {

            showToast(
                error.message ||
                `Unable to ${action} license.`,
                "error"
            );

        }

    }


    /* ========================================================
       CONFIRM ACTION
    ======================================================== */

    function confirmAction(
        id,
        action,
        title,
        message
    ) {

        const modal =
            $(CONFIG.selectors.confirmModal);


        if (!modal) {

            if (
                window.confirm(
                    `${title}\n\n${message}`
                )
            ) {

                executeAction(
                    id,
                    action
                );

            }

            return;

        }


        state.currentAction = {

            id,

            action

        };


        const titleElement =
            modal.querySelector(
                "[data-confirm-title]"
            );


        const messageElement =
            modal.querySelector(
                "[data-confirm-message]"
            );


        if (titleElement) {

            titleElement.textContent =
                title;

        }


        if (messageElement) {

            messageElement.textContent =
                message;

        }


        openModal(
            modal
        );

    }


    function handleConfirm() {

        if (
            !state.currentAction
        ) {
            return;
        }


        const {
            id,
            action
        } =
            state.currentAction;


        state.currentAction =
            null;


        executeAction(
            id,
            action
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
                    () =>
                        applyFilters(),
                    300
                )
            );

        }


        [
            CONFIG.selectors.status,
            CONFIG.selectors.vendor,
            CONFIG.selectors.plan,
            CONFIG.selectors.date

        ]
            .forEach(
                selector => {

                    const element =
                        $(selector);


                    if (element) {

                        element.addEventListener(
                            "change",
                            () =>
                                applyFilters()
                        );

                    }

                }
            );

    }


    /* ========================================================
       SELECT ALL
    ======================================================== */

    function bindSelectAll() {

        const selectAll =
            $(CONFIG.selectors.selectAll);


        if (!selectAll) {
            return;
        }


        selectAll.addEventListener(
            "change",
            () => {

                const checkboxes =
                    $$(".license-checkbox");


                checkboxes.forEach(
                    checkbox => {

                        const id =
                            String(
                                checkbox.dataset.id
                            );


                        checkbox.checked =
                            selectAll.checked;


                        if (
                            selectAll.checked
                        ) {

                            state.selectedLicenses.add(
                                id
                            );

                        } else {

                            state.selectedLicenses.delete(
                                id
                            );

                        }

                    }
                );


                updateBulkActions();

                updateSelectAllState();

            }
        );

    }


    /* ========================================================
       SELECT ALL STATE
    ======================================================== */

    function updateSelectAllState() {

        const selectAll =
            $(CONFIG.selectors.selectAll);


        if (!selectAll) {
            return;
        }


        const checkboxes =
            $$(".license-checkbox");


        if (!checkboxes.length) {

            selectAll.checked =
                false;

            selectAll.indeterminate =
                false;

            return;

        }


        const checked =
            checkboxes.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        selectAll.checked =
            checked ===
            checkboxes.length;


        selectAll.indeterminate =
            checked > 0 &&
            checked <
            checkboxes.length;

    }


    /* ========================================================
       BULK ACTIONS
    ======================================================== */

    function updateBulkActions() {

        const bar =
            $(CONFIG.selectors.bulkActions);


        if (!bar) {
            return;
        }


        const count =
            state.selectedLicenses.size;


        bar.classList.toggle(
            "active",
            count > 0
        );


        const countElement =
            $(CONFIG.selectors.selectedCount, bar);


        if (countElement) {

            countElement.textContent =
                count;

        }

    }


    function removeInvalidSelections() {

        const validIds =
            new Set(
                state.licenses.map(
                    license =>
                        String(
                            license.id
                        )
                )
            );


        state.selectedLicenses =
            new Set(
                [...state.selectedLicenses]
                    .filter(
                        id =>
                            validIds.has(id)
                    )
            );

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


        const total =
            state.filteredLicenses.length;


        const limit =
            state.pagination.limit;


        const totalPages =
            Math.ceil(
                total / limit
            );


        if (
            totalPages <= 1
        ) {

            container.innerHTML =
                "";

            return;

        }


        const current =
            state.pagination.page;


        const pages =
            getPaginationPages(
                current,
                totalPages
            );


        let html = `

            <button
                type="button"
                class="pagination-btn"
                data-page="${current - 1}"
                ${current === 1 ? "disabled" : ""}
                aria-label="Previous page"
            >

                <i
                    class="fa-solid fa-chevron-left"
                ></i>

            </button>

        `;


        pages.forEach(
            page => {

                if (
                    page === "..."
                ) {

                    html += `

                        <span
                            class="pagination-dots"
                        >
                            ...
                        </span>

                    `;

                    return;

                }


                html += `

                    <button
                        type="button"
                        class="pagination-btn ${
                            page === current
                                ? "active"
                                : ""
                        }"
                        data-page="${page}"
                        aria-current="${
                            page === current
                                ? "page"
                                : "false"
                        }"
                    >
                        ${page}
                    </button>

                `;

            }
        );


        html += `

            <button
                type="button"
                class="pagination-btn"
                data-page="${current + 1}"
                ${current === totalPages ? "disabled" : ""}
                aria-label="Next page"
            >

                <i
                    class="fa-solid fa-chevron-right"
                ></i>

            </button>

        `;


        container.innerHTML =
            html;


        container.onclick =
            event => {

                const button =
                    event.target.closest(
                        "[data-page]"
                    );


                if (!button) {
                    return;
                }


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


                state.pagination.page =
                    page;


                renderTable();


                const table =
                    $(CONFIG.selectors.table);


                if (table) {

                    table.closest(
                        ".table-wrapper"
                    )?.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "start"
                    });

                }

            };

    }


    function getPaginationPages(
        current,
        total
    ) {

        if (
            total <= 7
        ) {

            return Array.from(
                {
                    length: total
                },
                (_, index) =>
                    index + 1
            );

        }


        const pages = [

            1

        ];


        if (
            current > 3
        ) {

            pages.push("...");

        }


        for (
            let page =
                Math.max(
                    2,
                    current - 1
                );

            page <=
                Math.min(
                    total - 1,
                    current + 1
                );

            page++
        ) {

            pages.push(page);

        }


        if (
            current <
            total - 2
        ) {

            pages.push("...");

        }


        pages.push(
            total
        );


        return pages;

    }


    /* ========================================================
       TOTAL COUNT
    ======================================================== */

    function updateTotalCount() {

        const element =
            $(CONFIG.selectors.total);


        if (element) {

            element.textContent =
                state.filteredLicenses.length;

        }

    }


    /* ========================================================
       EMPTY STATE
    ======================================================== */

    function renderEmptyState(
        title =
            "No licenses found",
        message =
            "There are no licenses matching your current filters."
    ) {

        const table =
            $(CONFIG.selectors.table);


        if (!table) {
            return;
        }


        table.innerHTML = `

            <tr>

                <td
                    colspan="100%"
                    class="empty-table-state"
                >

                    <div class="empty-state">

                        <div class="empty-icon">

                            <i
                                class="fa-solid fa-key"
                            ></i>

                        </div>


                        <h3>
                            ${escapeHTML(title)}
                        </h3>


                        <p>
                            ${escapeHTML(message)}
                        </p>


                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-clear-filters
                        >
                            Clear Filters
                        </button>

                    </div>

                </td>

            </tr>

        `;


        const clearButton =
            table.querySelector(
                "[data-clear-filters]"
            );


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearFilters
            );

        }

    }


    /* ========================================================
       CLEAR FILTERS
    ======================================================== */

    function clearFilters() {

        [
            CONFIG.selectors.search,
            CONFIG.selectors.status,
            CONFIG.selectors.vendor,
            CONFIG.selectors.plan,
            CONFIG.selectors.date

        ]
            .forEach(
                selector => {

                    const element =
                        $(selector);


                    if (element) {

                        element.value =
                            "";

                    }

                }
            );


        state.pagination.page =
            1;


        applyFilters();

    }


    /* ========================================================
       MODALS
    ======================================================== */

    function openModal(
        modal
    ) {

        if (!modal) {
            return;
        }


        modal.classList.add(
            "is-open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function closeModal(
        modal
    ) {

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
            !$(".modal.is-open")
        ) {

            document.body.classList.remove(
                "modal-open"
            );

        }

    }


    function closeAllModals() {

        $$(".modal.is-open")
            .forEach(
                modal =>
                    closeModal(
                        modal
                    )
            );

    }


    function bindModals() {

        document.addEventListener(
            "click",
            event => {

                const closeButton =
                    event.target.closest(
                        "[data-modal-close]"
                    );


                if (closeButton) {

                    closeModal(
                        closeButton.closest(
                            ".modal"
                        )
                    );

                    return;

                }


                const modal =
                    event.target.classList.contains(
                        "modal"
                    )
                        ? event.target
                        : null;


                if (modal) {

                    closeModal(
                        modal
                    );

                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeActionMenus();

                    closeAllModals();

                }

            }
        );

    }


    /* ========================================================
       FORMS
    ======================================================== */

    function bindForms() {

        const createForm =
            $(CONFIG.selectors.createForm);


        if (createForm) {

            createForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    createLicense(
                        createForm
                    );

                }
            );

        }


        const editForm =
            $(CONFIG.selectors.editForm);


        if (editForm) {

            editForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    updateLicense(
                        editForm
                    );

                }
            );

        }

    }


    /* ========================================================
       CONFIRM BUTTON
    ======================================================== */

    function bindConfirmButton() {

        const button =
            $(
                "[data-confirm-action]"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            handleConfirm
        );

    }


    /* ========================================================
       CLIPBOARD
    ======================================================== */

    async function copyToClipboard(
        value
    ) {

        if (!value) {

            showToast(
                "Nothing to copy.",
                "warning"
            );

            return;

        }


        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    String(value)
                );

            } else {

                fallbackCopy(
                    String(value)
                );

            }


            showToast(
                "Copied to clipboard.",
                "success"
            );


        } catch (error) {

            console.error(
                error
            );


            showToast(
                "Unable to copy.",
                "error"
            );

        }

    }


    function fallbackCopy(
        value
    ) {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            value;


        textarea.style.position =
            "fixed";


        textarea.style.left =
            "-9999px";


        textarea.style.top =
            "0";


        textarea.setAttribute(
            "readonly",
            ""
        );


        document.body.appendChild(
            textarea
        );


        textarea.select();


        const success =
            document.execCommand(
                "copy"
            );


        textarea.remove();


        if (!success) {

            throw new Error(
                "Clipboard copy failed."
            );

        }

    }


    /* ========================================================
       TOAST
    ======================================================== */

    function showToast(
        message,
        type = "info"
    ) {

        let container =
            $(CONFIG.selectors.toast);


        if (!container) {

            container =
                document.createElement(
                    "div"
                );


            container.id =
                "toastContainer";


            container.className =
                "toast-container";


            document.body.appendChild(
                container
            );

        }


        const icons = {

            success:
                "fa-circle-check",

            error:
                "fa-circle-xmark",

            warning:
                "fa-triangle-exclamation",

            info:
                "fa-circle-info"

        };


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `toast toast-${type}`;


        toast.setAttribute(
            "role",
            "alert"
        );


        toast.innerHTML = `

            <div class="toast-icon">

                <i
                    class="fa-solid ${
                        icons[type] ||
                        icons.info
                    }"
                ></i>

            </div>


            <div class="toast-content">

                ${escapeHTML(message)}

            </div>


            <button
                type="button"
                class="toast-close"
                aria-label="Close notification"
            >

                <i
                    class="fa-solid fa-xmark"
                ></i>

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
                    300
                );

            };


        toast.querySelector(
            ".toast-close"
        )
            ?.addEventListener(
                "click",
                remove
            );


        setTimeout(
            remove,
            CONFIG.toastDuration
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

            loader.classList.toggle(
                "active",
                loading
            );

            loader.setAttribute(
                "aria-hidden",
                loading
                    ? "false"
                    : "true"
            );

        }


        const table =
            $(CONFIG.selectors.table);


        if (table) {

            table.classList.toggle(
                "is-loading",
                loading
            );

        }

    }


    /* ========================================================
       BUTTON LOADING
    ======================================================== */

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


            button.classList.add(
                "is-loading"
            );


            button.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                Processing...

            `;

        } else {

            button.disabled =
                false;


            button.classList.remove(
                "is-loading"
            );


            if (
                button.dataset.originalHtml
            ) {

                button.innerHTML =
                    button.dataset.originalHtml;

            }

        }

    }


    /* ========================================================
       EXPIRY
    ======================================================== */

    function getExpiryText(
        expiry,
        status
    ) {

        if (!expiry) {

            return "No expiry date";

        }


        if (
            status === "expired"
        ) {

            return "Expired";

        }


        const expiryDate =
            new Date(expiry);


        if (
            Number.isNaN(
                expiryDate.getTime()
            )
        ) {

            return "Invalid date";

        }


        const difference =
            expiryDate.getTime() -
            Date.now();


        const days =
            Math.ceil(
                difference /
                86400000
            );


        if (
            days <= 0
        ) {

            return "Expires today";

        }


        if (
            days === 1
        ) {

            return "1 day remaining";

        }


        if (
            days <= 30
        ) {

            return `${days} days remaining`;

        }


        const months =
            Math.floor(
                days / 30
            );


        return `${months} month${
            months > 1
                ? "s"
                : ""
        } remaining`;

    }


    /* ========================================================
       DATE FORMAT
    ======================================================== */

    function formatDate(
        date
    ) {

        if (!date) {
            return "—";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "—";

        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        )
            .format(parsed);

    }


    /* ========================================================
       INITIALS
    ======================================================== */

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


    /* ========================================================
       CAPITALIZE
    ======================================================== */

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


    /* ========================================================
       HTML ESCAPE
    ======================================================== */

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


    /* ========================================================
       DEBOUNCE
    ======================================================== */

    function debounce(
        callback,
        delay = 300
    ) {

        let timeout;


        return (
            ...args
        ) => {

            clearTimeout(
                timeout
            );


            timeout =
                setTimeout(
                    () =>
                        callback(
                            ...args
                        ),
                    delay
                );

        };

    }


    /* ========================================================
       INITIALIZATION
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

        bindSelectAll();

        bindTableEvents();

        bindModals();

        bindForms();

        bindConfirmButton();


        await loadLicenses();

    }


    /* ========================================================
       PUBLIC API
    ======================================================== */

    return {

        init,

        loadLicenses,

        applyFilters,

        clearFilters,

        createLicense,

        updateLicense,

        editLicense,

        openLicenseDetail,

        executeAction,

        copyToClipboard,

        showToast,

        getState:
            () => ({
                ...state,

                selectedLicenses:
                    new Set(
                        state.selectedLicenses
                    )
            })

    };


})();


/* ============================================================
   DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            LicenseManager.init();

        },
        {
            once: true
        }
    );

} else {

    LicenseManager.init();

}