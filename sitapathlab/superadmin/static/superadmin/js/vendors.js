/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * VENDOR MANAGEMENT
 *
 * Production-Level Vendor Controller
 *
 * REAL API ONLY
 * No dummy data
 * =========================================================
 */

"use strict";


document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       ROOT
    ===================================================== */

    const page =
        document.getElementById("vendorsPage");

    if (!page) {
        return;
    }


    /* =====================================================
       CONFIG
    ===================================================== */

    const API_URL =
        page.dataset.apiUrl || "";

    const CREATE_URL =
        page.dataset.createUrl || "";


    const DETAIL_URL_TEMPLATE =
        page.dataset.detailUrlTemplate || "";

    const EDIT_URL_TEMPLATE =
        page.dataset.editUrlTemplate || "";


    if (!API_URL) {

        console.error(
            "[Vendors] API URL missing."
        );

    }


    /* =====================================================
       DOM
    ===================================================== */

    const tableBody =
        document.getElementById(
            "vendorsTableBody"
        );

    const loadingState =
        document.getElementById(
            "vendorsLoading"
        );

    const emptyState =
        document.getElementById(
            "vendorsEmpty"
        );

    const errorState =
        document.getElementById(
            "vendorsError"
        );

    const errorMessage =
        document.getElementById(
            "vendorsErrorMessage"
        );


    const searchInput =
        document.getElementById(
            "vendorSearch"
        );

    const clearSearchBtn =
        document.getElementById(
            "clearSearch"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const planFilter =
        document.getElementById(
            "planFilter"
        );

    const resetFiltersBtn =
        document.getElementById(
            "resetFiltersBtn"
        );

    const emptyResetBtn =
        document.getElementById(
            "emptyResetBtn"
        );

    const retryBtn =
        document.getElementById(
            "retryVendorsBtn"
        );

    const refreshBtn =
        document.getElementById(
            "refreshVendorsBtn"
        );

    const tableRefreshBtn =
        document.getElementById(
            "tableRefreshBtn"
        );

    const selectAll =
        document.getElementById(
            "selectAllVendors"
        );

    const bulkActions =
        document.getElementById(
            "bulkActions"
        );

    const selectedCount =
        document.getElementById(
            "selectedCount"
        );

    const bulkDeleteBtn =
        document.getElementById(
            "bulkDeleteBtn"
        );

    const resultsInfo =
        document.getElementById(
            "resultsInfo"
        );

    const pagination =
        document.getElementById(
            "pagination"
        );

    const paginationInfo =
        document.getElementById(
            "paginationInfo"
        );


    /* Stats */

    const totalVendors =
        document.getElementById(
            "totalVendors"
        );

    const activeVendors =
        document.getElementById(
            "activeVendors"
        );

    const pendingVendors =
        document.getElementById(
            "pendingVendors"
        );

    const suspendedVendors =
        document.getElementById(
            "suspendedVendors"
        );


    /* Alert */

    const alertBox =
        document.getElementById(
            "vendorsAlert"
        );


    /* Delete modal */

    const deleteModal =
        document.getElementById(
            "deleteModal"
        );

    const deleteModalMessage =
        document.getElementById(
            "deleteModalMessage"
        );

    const cancelDeleteBtn =
        document.getElementById(
            "cancelDeleteBtn"
        );

    const confirmDeleteBtn =
        document.getElementById(
            "confirmDeleteBtn"
        );


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        vendors: [],

        filteredVendors: [],

        selectedIds: new Set(),

        page: 1,

        pageSize: 10,

        totalPages: 1,

        loading: false,

        deleting: false,

        deleteMode: null,

        deleteIds: [],

        searchTimer: null

    };


    /* =====================================================
       UTILITIES
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function debounce(callback, delay = 350) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(
                () => callback(...args),
                delay
            );

        };
    }


    function normalizeValue(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase();

    }


    function getCookie(name) {

        const cookies =
            document.cookie.split(";");

        for (const cookie of cookies) {

            const trimmed =
                cookie.trim();

            if (
                trimmed.startsWith(
                    `${name}=`
                )
            ) {

                return decodeURIComponent(
                    trimmed.substring(
                        name.length + 1
                    )
                );

            }

        }

        return "";

    }


    function getCSRFToken() {

        const input =
            document.querySelector(
                "[name='csrfmiddlewaretoken']"
            );

        return (
            getCookie("csrftoken") ||
            input?.value ||
            ""
        );

    }


    function formatDate(value) {

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

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    function capitalize(value) {

        const text =
            String(value || "");

        if (!text) {
            return "—";
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );

    }


    function getVendorId(vendor) {

        return (
            vendor.id ??
            vendor.uuid ??
            vendor.vendor_id ??
            vendor.pk ??
            ""
        );

    }


    /* =====================================================
       URL BUILDER
    ===================================================== */

    function buildVendorUrl(
        template,
        id
    ) {

        if (!template || !id) {
            return "#";
        }

        return template.replace(
            "00000000-0000-0000-0000-000000000000",
            encodeURIComponent(id)
        );

    }


    function getDetailUrl(vendor) {

        return buildVendorUrl(
            DETAIL_URL_TEMPLATE,
            getVendorId(vendor)
        );

    }


    function getEditUrl(vendor) {

        return buildVendorUrl(
            EDIT_URL_TEMPLATE,
            getVendorId(vendor)
        );

    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(
        message,
        type = "error"
    ) {

        if (!alertBox) {
            return;
        }

        let icon =
            "fa-circle-exclamation";

        if (type === "success") {
            icon =
                "fa-circle-check";
        }

        if (type === "warning") {
            icon =
                "fa-triangle-exclamation";
        }

        alertBox.className =
            `vendors-alert show ${type}`;

        alertBox.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        setTimeout(() => {

            alertBox.className =
                "vendors-alert";

            alertBox.innerHTML =
                "";

        }, 5000);

    }


    /* =====================================================
       STATE VISIBILITY
    ===================================================== */

    function hideAllTableStates() {

        loadingState.hidden = true;

        emptyState.hidden = true;

        errorState.hidden = true;

        tableBody.innerHTML = "";

    }


    function showLoading() {

        hideAllTableStates();

        loadingState.hidden =
            false;

    }


    function showEmpty() {

        hideAllTableStates();

        emptyState.hidden =
            false;

    }


    function showError(
        message
    ) {

        hideAllTableStates();

        errorState.hidden =
            false;

        if (errorMessage) {

            errorMessage.textContent =
                message ||
                "Unable to load vendors.";

        }

    }


    /* =====================================================
       API ERROR
    ===================================================== */

    async function parseResponse(
        response
    ) {

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

            try {

                data =
                    await response.json();

            } catch {

                data = null;

            }

        } else {

            try {

                const text =
                    await response.text();

                data = {
                    message:
                        text
                            ?.replace(
                                /<[^>]*>/g,
                                " "
                            )
                            .trim()
                            .slice(0, 500)
                };

            } catch {

                data = null;

            }

        }


        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                data?.detail ||
                `Request failed with status ${response.status}.`;

            const error =
                new Error(message);

            error.status =
                response.status;

            error.data =
                data;

            throw error;

        }

        return data;

    }


    /* =====================================================
       NORMALIZE API RESPONSE
    ===================================================== */

    function normalizeApiData(data) {

        /*
         Supported backend structures:

         [
            {...},
            {...}
         ]

         {
            results: [...]
            count: 100
         }

         {
            vendors: [...]
            total: 100
         }

         {
            data: [...]
         }
        */

        if (Array.isArray(data)) {

            return {
                items: data,
                count: data.length,
                next: null,
                previous: null
            };

        }


        if (!data || typeof data !== "object") {

            return {
                items: [],
                count: 0,
                next: null,
                previous: null
            };

        }


        const items =
            data.results ??
            data.vendors ??
            data.data ??
            data.items ??
            [];


        return {

            items:
                Array.isArray(items)
                    ? items
                    : [],

            count:
                Number(
                    data.count ??
                    data.total ??
                    data.total_count ??
                    items.length
                ),

            next:
                data.next ?? null,

            previous:
                data.previous ?? null

        };

    }


    /* =====================================================
       FETCH VENDORS
    ===================================================== */

    async function fetchVendors() {

        if (state.loading) {
            return;
        }

        if (!API_URL) {

            showError(
                "Vendor API URL is not configured."
            );

            return;

        }

        state.loading = true;

        showLoading();


        try {

            const url =
                new URL(
                    API_URL,
                    window.location.origin
                );


            /*
             * We request all data from the backend
             * and perform search/filter/pagination
             * client-side.

             * If your Django API already returns
             * pagination, this code also supports
             * results/count.
             */

            url.searchParams.set(
                "page_size",
                "1000"
            );


            const response =
                await fetch(
                    url.toString(),
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json",

                            "X-Requested-With":
                                "XMLHttpRequest"
                        },

                        credentials:
                            "same-origin",

                        cache:
                            "no-store"
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            const normalized =
                normalizeApiData(
                    data
                );


            state.vendors =
                normalized.items;


            state.page =
                1;


            state.selectedIds.clear();


            updateStatistics();


            applyFilters();


            console.info(
                `[Vendors] Loaded ${state.vendors.length} vendors.`
            );


        } catch (error) {

            console.error(
                "[Vendors] Load error:",
                error
            );

            showError(
                error.message ||
                "Unable to load vendors."
            );

            showAlert(
                error.message ||
                "Unable to load vendors.",
                "error"
            );

        } finally {

            state.loading =
                false;

        }

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function applyFilters() {

        const search =
            normalizeValue(
                searchInput?.value
            );

        const status =
            normalizeValue(
                statusFilter?.value
            );

        const plan =
            normalizeValue(
                planFilter?.value
            );


        state.filteredVendors =
            state.vendors.filter(
                vendor => {

                    const vendorName =
                        normalizeValue(
                            vendor.name ??
                            vendor.vendor_name ??
                            vendor.lab_name ??
                            vendor.laboratory_name
                        );

                    const vendorCode =
                        normalizeValue(
                            vendor.vendor_code ??
                            vendor.code
                        );

                    const email =
                        normalizeValue(
                            vendor.email ??
                            vendor.business_email
                        );

                    const phone =
                        normalizeValue(
                            vendor.phone ??
                            vendor.mobile
                        );

                    const owner =
                        normalizeValue(
                            vendor.owner_name ??
                            vendor.owner ??
                            vendor.contact_person
                        );

                    const city =
                        normalizeValue(
                            vendor.city
                        );

                    const stateName =
                        normalizeValue(
                            vendor.state
                        );

                    const vendorStatus =
                        normalizeValue(
                            vendor.status
                        );

                    const vendorPlan =
                        normalizeValue(
                            vendor.plan ??
                            vendor.plan_name ??
                            vendor.subscription_plan
                        );


                    const searchable =
                        [
                            vendorName,
                            vendorCode,
                            email,
                            phone,
                            owner,
                            city,
                            stateName,
                            vendorStatus,
                            vendorPlan
                        ]
                            .join(" ");


                    const matchesSearch =
                        !search ||
                        searchable.includes(
                            search
                        );


                    const matchesStatus =
                        !status ||
                        vendorStatus ===
                            status;


                    const matchesPlan =
                        !plan ||
                        vendorPlan ===
                            plan;


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesPlan
                    );

                }
            );


        state.page =
            Math.min(
                state.page,
                Math.max(
                    1,
                    Math.ceil(
                        state.filteredVendors.length /
                        state.pageSize
                    )
                )
            );


        renderTable();

        renderPagination();

        updateBulkSelectionUI();

        updateResultsInfo();

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const debouncedSearch =
        debounce(
            () => {

                state.page = 1;

                applyFilters();

            },
            250
        );


    searchInput?.addEventListener(
        "input",
        () => {

            if (clearSearchBtn) {

                clearSearchBtn.classList.toggle(
                    "show",
                    Boolean(
                        searchInput.value.trim()
                    )
                );

            }

            debouncedSearch();

        }
    );


    clearSearchBtn?.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            clearSearchBtn.classList.remove(
                "show"
            );

            state.page = 1;

            applyFilters();

            searchInput.focus();

        }
    );


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    statusFilter?.addEventListener(
        "change",
        () => {

            state.page = 1;

            applyFilters();

        }
    );


    planFilter?.addEventListener(
        "change",
        () => {

            state.page = 1;

            applyFilters();

        }
    );


    function resetFilters() {

        if (searchInput) {
            searchInput.value = "";
        }

        if (statusFilter) {
            statusFilter.value = "";
        }

        if (planFilter) {
            planFilter.value = "";
        }

        clearSearchBtn?.classList.remove(
            "show"
        );

        state.page = 1;

        applyFilters();

    }


    resetFiltersBtn?.addEventListener(
        "click",
        resetFilters
    );


    emptyResetBtn?.addEventListener(
        "click",
        resetFilters
    );


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateStatistics() {

        const vendors =
            state.vendors;


        const active =
            vendors.filter(
                vendor =>
                    normalizeValue(
                        vendor.status
                    ) === "active"
            ).length;


        const pending =
            vendors.filter(
                vendor =>
                    normalizeValue(
                        vendor.status
                    ) === "pending"
            ).length;


        const suspended =
            vendors.filter(
                vendor => {

                    const status =
                        normalizeValue(
                            vendor.status
                        );

                    return (
                        status ===
                            "suspended" ||
                        status ===
                            "inactive"
                    );

                }
            ).length;


        if (totalVendors) {
            totalVendors.textContent =
                vendors.length;
        }

        if (activeVendors) {
            activeVendors.textContent =
                active;
        }

        if (pendingVendors) {
            pendingVendors.textContent =
                pending;
        }

        if (suspendedVendors) {
            suspendedVendors.textContent =
                suspended;
        }

    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderTable() {

        if (!tableBody) {
            return;
        }


        const total =
            state.filteredVendors.length;


        if (!total) {

            showEmpty();

            updateResultsInfo();

            return;

        }


        hideAllTableStates();


        const start =
            (state.page - 1) *
            state.pageSize;


        const end =
            start +
            state.pageSize;


        const pageItems =
            state.filteredVendors.slice(
                start,
                end
            );


        const rows =
            pageItems.map(
                vendor =>
                    renderVendorRow(
                        vendor
                    )
            ).join("");


        tableBody.innerHTML =
            rows;


        bindRowActions();

    }


    /* =====================================================
       RENDER ROW
    ===================================================== */

    function renderVendorRow(
        vendor
    ) {

        const id =
            getVendorId(
                vendor
            );


        const name =
            vendor.name ??
            vendor.vendor_name ??
            vendor.lab_name ??
            vendor.laboratory_name ??
            "Unnamed Vendor";


        const owner =
            vendor.owner_name ??
            vendor.owner ??
            vendor.contact_person ??
            "—";


        const code =
            vendor.vendor_code ??
            vendor.code ??
            "—";


        const email =
            vendor.email ??
            vendor.business_email ??
            "—";


        const phone =
            vendor.phone ??
            vendor.mobile ??
            "—";


        const city =
            vendor.city ??
            "—";


        const stateName =
            vendor.state ??
            "—";


        const country =
            vendor.country ??
            "";


        const plan =
            vendor.plan ??
            vendor.plan_name ??
            vendor.subscription_plan ??
            "—";


        const status =
            normalizeValue(
                vendor.status
            ) || "inactive";


        const startDate =
            vendor.start_date ??
            vendor.subscription_start ??
            vendor.subscription?.start_date ??
            null;


        const endDate =
            vendor.end_date ??
            vendor.expiry_date ??
            vendor.subscription_end ??
            vendor.subscription?.end_date ??
            null;


        const checked =
            state.selectedIds.has(
                String(id)
            );


        const avatar =
            String(name)
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "V";


        const detailUrl =
            getDetailUrl(
                vendor
            );


        const editUrl =
            getEditUrl(
                vendor
            );


        return `

            <tr
                data-vendor-id="${escapeHTML(id)}"
            >

                <td class="checkbox-column">

                    <input
                        type="checkbox"
                        class="vendor-checkbox"
                        data-id="${escapeHTML(id)}"
                        ${checked ? "checked" : ""}
                        aria-label="Select ${escapeHTML(name)}"
                    >

                </td>


                <td>

                    <div class="vendor-cell">

                        <div class="vendor-avatar">
                            ${escapeHTML(avatar)}
                        </div>

                        <div class="vendor-main">

                            <span class="vendor-name"
                                  title="${escapeHTML(name)}">
                                ${escapeHTML(name)}
                            </span>

                            <span class="vendor-code">
                                ${escapeHTML(code)}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <div class="contact-cell">

                        <span
                            class="contact-email"
                            title="${escapeHTML(email)}"
                        >
                            ${escapeHTML(email)}
                        </span>

                        <span class="contact-phone">
                            ${escapeHTML(phone)}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="location-cell">

                        <strong>
                            ${escapeHTML(city)}
                        </strong>

                        <span>
                            ${escapeHTML(stateName)}
                            ${country ? `, ${escapeHTML(country)}` : ""}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="plan-badge">

                        ${escapeHTML(
                            capitalize(plan)
                        )}

                    </span>

                </td>


                <td>

                    <div class="subscription-cell">

                        <strong>
                            ${escapeHTML(
                                formatDate(
                                    startDate
                                )
                            )}
                        </strong>

                        <span>
                            Expires:
                            ${escapeHTML(
                                formatDate(
                                    endDate
                                )
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <span
                        class="status-badge status-${escapeHTML(status)}"
                    >
                        ${escapeHTML(
                            capitalize(status)
                        )}
                    </span>

                </td>


                <td class="actions-column">

                    <div class="row-actions">


                        <a
                            href="${escapeHTML(detailUrl)}"
                            class="row-action view"
                            title="View vendor"
                            aria-label="View vendor"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </a>


                        <a
                            href="${escapeHTML(editUrl)}"
                            class="row-action edit"
                            title="Edit vendor"
                            aria-label="Edit vendor"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </a>


                        <button
                            type="button"
                            class="row-action delete"
                            data-action="delete"
                            data-id="${escapeHTML(id)}"
                            data-name="${escapeHTML(name)}"
                            title="Delete vendor"
                            aria-label="Delete vendor"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>


                    </div>

                </td>

            </tr>

        `;

    }


    /* =====================================================
       ROW ACTIONS
    ===================================================== */

    function bindRowActions() {

        document
            .querySelectorAll(
                ".vendor-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            const id =
                                String(
                                    checkbox.dataset.id
                                );


                            if (
                                checkbox.checked
                            ) {

                                state.selectedIds.add(
                                    id
                                );

                            } else {

                                state.selectedIds.delete(
                                    id
                                );

                            }


                            updateBulkSelectionUI();

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                '[data-action="delete"]'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openDeleteModal(
                                [
                                    button.dataset.id
                                ],
                                button.dataset.name
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       SELECT ALL
    ===================================================== */

    selectAll?.addEventListener(
        "change",
        () => {

            const start =
                (state.page - 1) *
                state.pageSize;

            const pageItems =
                state.filteredVendors.slice(
                    start,
                    start +
                        state.pageSize
                );


            pageItems.forEach(
                vendor => {

                    const id =
                        String(
                            getVendorId(
                                vendor
                            )
                        );


                    if (
                        selectAll.checked
                    ) {

                        state.selectedIds.add(
                            id
                        );

                    } else {

                        state.selectedIds.delete(
                            id
                        );

                    }

                }
            );


            renderTable();

            updateBulkSelectionUI();

        }
    );


    /* =====================================================
       BULK UI
    ===================================================== */

    function updateBulkSelectionUI() {

        const count =
            state.selectedIds.size;


        if (selectedCount) {

            selectedCount.textContent =
                `${count} selected`;

        }


        if (bulkActions) {

            bulkActions.hidden =
                count === 0;

        }


        if (selectAll) {

            const start =
                (state.page - 1) *
                state.pageSize;

            const pageItems =
                state.filteredVendors.slice(
                    start,
                    start +
                        state.pageSize
                );


            selectAll.checked =
                pageItems.length > 0 &&
                pageItems.every(
                    vendor =>
                        state.selectedIds.has(
                            String(
                                getVendorId(
                                    vendor
                                )
                            )
                        )
                );

        }

    }


    /* =====================================================
       DELETE MODAL
    ===================================================== */

    function openDeleteModal(
        ids,
        name = ""
    ) {

        state.deleteIds =
            ids.map(
                id => String(id)
            );


        state.deleteMode =
            ids.length > 1
                ? "bulk"
                : "single";


        if (deleteModalMessage) {

            if (
                state.deleteMode ===
                "bulk"
            ) {

                deleteModalMessage.textContent =
                    `You are about to delete ${ids.length} vendors. This action cannot be undone.`;

            } else {

                deleteModalMessage.textContent =
                    `Vendor "${name || "this vendor"}" will be permanently deleted. This action cannot be undone.`;

            }

        }


        deleteModal?.classList.add(
            "show"
        );

        deleteModal?.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            () =>
                confirmDeleteBtn?.focus(),
            50
        );

    }


    function closeDeleteModal() {

        deleteModal?.classList.remove(
            "show"
        );

        deleteModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );


        state.deleteIds = [];

        state.deleteMode = null;

    }


    cancelDeleteBtn?.addEventListener(
        "click",
        closeDeleteModal
    );


    deleteModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                deleteModal
            ) {

                closeDeleteModal();

            }

        }
    );


    /* =====================================================
       DELETE API
    ===================================================== */

    async function deleteVendor(
        id
    ) {

        /*
         * DELETE endpoint convention:

         GET:
             /superadmin/api/vendors/

         DELETE:
             /superadmin/api/vendors/<uuid>/

         The same base API URL is used.
        */


        const url =
            API_URL.endsWith("/")
                ? `${API_URL}${encodeURIComponent(id)}/`
                : `${API_URL}/${encodeURIComponent(id)}/`;


        const response =
            await fetch(
                url,
                {
                    method: "DELETE",

                    headers: {

                        "Accept":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken(),

                        "X-Requested-With":
                            "XMLHttpRequest"

                    },

                    credentials:
                        "same-origin"
                }
            );


        return parseResponse(
            response
        );

    }


    async function performDelete() {

        if (
            state.deleting ||
            !state.deleteIds.length
        ) {

            return;

        }


        state.deleting =
            true;


        if (confirmDeleteBtn) {

            confirmDeleteBtn.disabled =
                true;

            confirmDeleteBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Deleting...
            `;

        }


        const ids =
            [...state.deleteIds];


        try {

            /*
             * Delete one-by-one.
             *
             * This works with a standard
             * Django REST-style DELETE endpoint.
             */

            const results =
                await Promise.allSettled(
                    ids.map(
                        id =>
                            deleteVendor(
                                id
                            )
                    )
                );


            const failed =
                results.filter(
                    result =>
                        result.status ===
                        "rejected"
                );


            if (failed.length) {

                const firstError =
                    failed[0].reason;


                throw new Error(
                    firstError?.message ||
                    `${failed.length} vendor(s) could not be deleted.`
                );

            }


            ids.forEach(
                id => {

                    state.selectedIds.delete(
                        String(id)
                    );

                }
            );


            closeDeleteModal();


            showAlert(
                ids.length === 1
                    ? "Vendor deleted successfully."
                    : `${ids.length} vendors deleted successfully.`,
                "success"
            );


            /*
             * Reload REAL database data.
             */

            await fetchVendors();


        } catch (error) {

            console.error(
                "[Vendors] Delete error:",
                error
            );


            showAlert(
                error.message ||
                "Unable to delete vendor.",
                "error"
            );


        } finally {

            state.deleting =
                false;


            if (confirmDeleteBtn) {

                confirmDeleteBtn.disabled =
                    false;

                confirmDeleteBtn.innerHTML = `
                    <i class="fa-solid fa-trash"></i>
                    Delete
                `;

            }

        }

    }


    confirmDeleteBtn?.addEventListener(
        "click",
        performDelete
    );


    /* =====================================================
       BULK DELETE
    ===================================================== */

    bulkDeleteBtn?.addEventListener(
        "click",
        () => {

            const ids =
                [...state.selectedIds];


            if (!ids.length) {

                showAlert(
                    "Please select at least one vendor.",
                    "warning"
                );

                return;

            }


            openDeleteModal(
                ids,
                ""
            );

        }
    );


    /* =====================================================
       REFRESH
    ===================================================== */

    async function refreshVendors() {

        if (refreshBtn) {

            refreshBtn.disabled =
                true;

        }

        if (tableRefreshBtn) {

            tableRefreshBtn.disabled =
                true;

        }


        try {

            await fetchVendors();

        } finally {

            if (refreshBtn) {

                refreshBtn.disabled =
                    false;

            }

            if (tableRefreshBtn) {

                tableRefreshBtn.disabled =
                    false;

            }

        }

    }


    refreshBtn?.addEventListener(
        "click",
        refreshVendors
    );


    tableRefreshBtn?.addEventListener(
        "click",
        refreshVendors
    );


    retryBtn?.addEventListener(
        "click",
        refreshVendors
    );


    /* =====================================================
       PAGINATION
    ===================================================== */

    function renderPagination() {

        if (!pagination) {
            return;
        }


        pagination.innerHTML =
            "";


        const total =
            state.filteredVendors.length;


        const pages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    state.pageSize
                )
            );


        state.totalPages =
            pages;


        if (pages <= 1) {

            return;

        }


        /* Previous */

        const previous =
            createPageButton(
                "‹",
                state.page - 1,
                state.page === 1
            );


        pagination.appendChild(
            previous
        );


        /* Pages */

        const pageNumbers =
            getPaginationPages(
                state.page,
                pages
            );


        pageNumbers.forEach(
            pageNumber => {

                if (
                    pageNumber === "..."
                ) {

                    const dots =
                        document.createElement(
                            "span"
                        );

                    dots.className =
                        "page-dots";

                    dots.textContent =
                        "...";

                    pagination.appendChild(
                        dots
                    );

                    return;

                }


                const button =
                    createPageButton(
                        String(pageNumber),
                        pageNumber,
                        false
                    );


                if (
                    pageNumber ===
                    state.page
                ) {

                    button.classList.add(
                        "active"
                    );

                }


                pagination.appendChild(
                    button
                );

            }
        );


        /* Next */

        const next =
            createPageButton(
                "›",
                state.page + 1,
                state.page === pages
            );


        pagination.appendChild(
            next
        );

    }


    function createPageButton(
        label,
        pageNumber,
        disabled
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";

        button.className =
            "page-btn";

        button.textContent =
            label;

        button.disabled =
            disabled;


        button.addEventListener(
            "click",
            () => {

                if (
                    pageNumber < 1 ||
                    pageNumber >
                        state.totalPages
                ) {

                    return;

                }


                state.page =
                    pageNumber;


                renderTable();

                renderPagination();

                updateResultsInfo();

                updateBulkSelectionUI();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


        return button;

    }


    function getPaginationPages(
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


        const pages = [
            1
        ];


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


    /* =====================================================
       RESULTS INFO
    ===================================================== */

    function updateResultsInfo() {

        const total =
            state.filteredVendors.length;


        if (!total) {

            if (resultsInfo) {

                resultsInfo.textContent =
                    "No vendors found.";

            }

            if (paginationInfo) {

                paginationInfo.textContent =
                    "Showing 0 of 0";

            }

            return;

        }


        const start =
            (state.page - 1) *
            state.pageSize +
            1;


        const end =
            Math.min(
                state.page *
                    state.pageSize,
                total
            );


        if (resultsInfo) {

            resultsInfo.textContent =
                `Showing ${start}-${end} of ${total} vendors`;

        }


        if (paginationInfo) {

            paginationInfo.textContent =
                `Showing ${start}-${end} of ${total}`;

        }

    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                if (
                    deleteModal?.classList.contains(
                        "show"
                    )
                ) {

                    closeDeleteModal();

                }

            }

        }
    );


    /* =====================================================
       PAGE VISIBILITY
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            /*
             * Do not continuously hit the database.
             *
             * Refresh happens when user explicitly
             * clicks Refresh.
             */

        }
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    fetchVendors();


    console.log(
        "[Vendors] Production controller initialized."
    );

});