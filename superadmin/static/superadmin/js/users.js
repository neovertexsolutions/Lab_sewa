"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       PAGE / API CONFIG
    ======================================================== */

    const page = document.getElementById("usersPage");

    if (!page) {
        console.error("Users page container not found.");
        return;
    }


    const API = {

        LIST:
            page.dataset.listUrl,

        DETAIL:
            id =>
                page.dataset.detailUrl.replace(
                    "/0/",
                    `/${id}/`
                ),

        ACTIVATE:
            id =>
                page.dataset.activateUrl.replace(
                    "/0/",
                    `/${id}/`
                ),

        DEACTIVATE:
            id =>
                page.dataset.deactivateUrl.replace(
                    "/0/",
                    `/${id}/`
                )

    };


    /* ========================================================
       STATE
    ======================================================== */

    let users = [];

    let filteredUsers = [];

    let selectedUsers = new Set();

    let currentPage = 1;

    let rowsPerPage = 10;

    let pendingAction = null;

    let isLoading = false;


    /* ========================================================
       DOM
    ======================================================== */

    const tableBody =
        document.getElementById("usersTableBody");

    const emptyState =
        document.getElementById("emptyState");

    const userSearch =
        document.getElementById("userSearch");

    const clearSearch =
        document.getElementById("clearSearch");

    const roleFilter =
        document.getElementById("roleFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    const vendorFilter =
        document.getElementById("vendorFilter");

    const filterToggle =
        document.getElementById("filterToggle");

    const filtersPanel =
        document.getElementById("filtersPanel");

    const filterCount =
        document.getElementById("filterCount");

    const resetFilters =
        document.getElementById("resetFilters");

    const emptyReset =
        document.getElementById("emptyReset");

    const selectAll =
        document.getElementById("selectAll");

    const bulkToolbar =
        document.getElementById("bulkToolbar");

    const selectedCount =
        document.getElementById("selectedCount");

    const totalUsers =
        document.getElementById("totalUsers");

    const activeUsers =
        document.getElementById("activeUsers");

    const pendingUsers =
        document.getElementById("pendingUsers");

    const suspendedUsers =
        document.getElementById("suspendedUsers");

    const resultSummary =
        document.getElementById("resultSummary");

    const paginationInfo =
        document.getElementById("paginationInfo");

    const pageNumbers =
        document.getElementById("pageNumbers");

    const prevPage =
        document.getElementById("prevPage");

    const nextPage =
        document.getElementById("nextPage");

    const rowsSelect =
        document.getElementById("rowsPerPage");

    const addUserBtn =
        document.getElementById("addUserBtn");

    const exportUsersBtn =
        document.getElementById("exportUsersBtn");

    const userModal =
        document.getElementById("userModal");

    const confirmModal =
        document.getElementById("confirmModal");

    const closeUserModal =
        document.getElementById("closeUserModal");

    const cancelUser =
        document.getElementById("cancelUser");

    const userForm =
        document.getElementById("userForm");

    const modalTitle =
        document.getElementById("modalTitle");

    const saveUser =
        document.getElementById("saveUser");

    const togglePassword =
        document.getElementById("togglePassword");

    const confirmTitle =
        document.getElementById("confirmTitle");

    const confirmMessage =
        document.getElementById("confirmMessage");

    const confirmCancel =
        document.getElementById("confirmCancel");

    const confirmProceed =
        document.getElementById("confirmProceed");

    const toastContainer =
        document.getElementById("toastContainer");


    /* ========================================================
       INIT
    ======================================================== */

    init();


    async function init() {

        bindEvents();

        await loadUsers();

    }


    /* ========================================================
       EVENTS
    ======================================================== */

    function bindEvents() {

        userSearch?.addEventListener(
            "input",
            () => {

                currentPage = 1;

                applyFilters();

            }
        );


        clearSearch?.addEventListener(
            "click",
            () => {

                if (userSearch) {
                    userSearch.value = "";
                }

                currentPage = 1;

                applyFilters();

                userSearch?.focus();

            }
        );


        roleFilter?.addEventListener(
            "change",
            applyFilters
        );


        statusFilter?.addEventListener(
            "change",
            applyFilters
        );


        vendorFilter?.addEventListener(
            "change",
            applyFilters
        );


        filterToggle?.addEventListener(
            "click",
            () => {

                filtersPanel?.classList.toggle(
                    "show"
                );

            }
        );


        resetFilters?.addEventListener(
            "click",
            resetAllFilters
        );


        emptyReset?.addEventListener(
            "click",
            resetAllFilters
        );


        rowsSelect?.addEventListener(
            "change",
            () => {

                rowsPerPage =
                    Number(rowsSelect.value) || 10;

                currentPage = 1;

                renderTable();

            }
        );


        prevPage?.addEventListener(
            "click",
            () => {

                if (currentPage > 1) {

                    currentPage--;

                    renderTable();

                }

            }
        );


        nextPage?.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            filteredUsers.length /
                            rowsPerPage
                        )
                    );

                if (currentPage < totalPages) {

                    currentPage++;

                    renderTable();

                }

            }
        );


        selectAll?.addEventListener(
            "change",
            handleSelectAll
        );


        addUserBtn?.addEventListener(
            "click",
            () => {

                showToast(
                    "User creation API is not connected yet.",
                    "error"
                );

                /*
                 * Modal is intentionally not submitted
                 * until backend create API is available.
                 */

                openUserModal();

            }
        );


        closeUserModal?.addEventListener(
            "click",
            closeUserForm
        );


        cancelUser?.addEventListener(
            "click",
            closeUserForm
        );


        userModal?.addEventListener(
            "click",
            event => {

                if (
                    event.target === userModal
                ) {

                    closeUserForm();

                }

            }
        );


        userForm?.addEventListener(
            "submit",
            handleUserSubmit
        );


        togglePassword?.addEventListener(
            "click",
            togglePasswordVisibility
        );


        confirmCancel?.addEventListener(
            "click",
            closeConfirm
        );


        confirmProceed?.addEventListener(
            "click",
            executePendingAction
        );


        confirmModal?.addEventListener(
            "click",
            event => {

                if (
                    event.target === confirmModal
                ) {

                    closeConfirm();

                }

            }
        );


        exportUsersBtn?.addEventListener(
            "click",
            exportUsers
        );


        document
            .getElementById("bulkActivate")
            ?.addEventListener(
                "click",
                () => {

                    showToast(
                        "Bulk API is not connected yet.",
                        "error"
                    );

                }
            );


        document
            .getElementById("bulkSuspend")
            ?.addEventListener(
                "click",
                () => {

                    showToast(
                        "Bulk API is not connected yet.",
                        "error"
                    );

                }
            );


        document
            .getElementById("bulkDelete")
            ?.addEventListener(
                "click",
                () => {

                    showToast(
                        "Bulk API is not connected yet.",
                        "error"
                    );

                }
            );

    }


    /* ========================================================
       LOAD USERS
    ======================================================== */

    async function loadUsers() {

        setLoading(true);

        try {

            const response =
                await fetch(
                    API.LIST,
                    {
                        method: "GET",

                        credentials:
                            "same-origin",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getAPIError(
                        data,
                        "Unable to load users."
                    )
                );

            }


            users =
                normalizeUsers(data);


            selectedUsers.clear();

            renderStats();

            populateVendorFilter();

            applyFilters();

        }
        catch (error) {

            console.error(
                "User loading error:",
                error
            );

            users = [];

            filteredUsers = [];

            renderStats();

            renderTable();

            showToast(
                error.message ||
                "Unable to load users.",
                "error"
            );

        }
        finally {

            setLoading(false);

        }

    }


    /* ========================================================
       NORMALIZE
    ======================================================== */

    function normalizeUsers(data) {

        let list = [];


        if (Array.isArray(data)) {

            list = data;

        }
        else if (
            Array.isArray(data.users)
        ) {

            list = data.users;

        }
        else if (
            data.data &&
            Array.isArray(
                data.data.users
            )
        ) {

            list = data.data.users;

        }
        else if (
            Array.isArray(data.results)
        ) {

            list = data.results;

        }


        return list.map(
            normalizeUser
        );

    }


    function normalizeUser(user) {

        const firstName =
            user.firstName ??
            user.first_name ??
            "";


        const lastName =
            user.lastName ??
            user.last_name ??
            "";


        let status =
            user.status;


        if (!status) {

            status =
                user.is_active === false
                    ? "suspended"
                    : "active";

        }


        let role = "";

        if (user.role) {

            role =
                typeof user.role === "object"
                    ? (
                        user.role.code ??
                        user.role.name ??
                        ""
                    )
                    : user.role;

        }


        let vendor = "";

        let vendorName = "";

        if (user.vendor) {

            if (
                typeof user.vendor ===
                "object"
            ) {

                vendor =
                    user.vendor.id ??
                    user.vendor.code ??
                    "";

                vendorName =
                    user.vendor.name ??
                    user.vendor.business_name ??
                    "";

            }
            else {

                vendor =
                    user.vendor;

                vendorName =
                    user.vendor_name ??
                    user.vendorName ??
                    user.vendor;

            }

        }


        return {

            id:
                Number(user.id),

            firstName,

            lastName,

            username:
                user.username ?? "",

            email:
                user.email ?? "",

            vendor,

            vendorName,

            role,

            roleName:
                user.role_name ??
                user.roleName ??
                role,

            status,

            isActive:
                user.is_active !== undefined
                    ? Boolean(user.is_active)
                    : status === "active",

            lastLogin:
                user.last_login ??
                user.lastLogin ??
                "Never",

            created:
                user.created_at ??
                user.created ??
                user.date_joined ??
                ""

        };

    }


    /* ========================================================
       FILTERS
    ======================================================== */

    function applyFilters() {

        const search =
            userSearch?.value
                ?.trim()
                .toLowerCase() ||
            "";


        const role =
            roleFilter?.value || "";


        const status =
            statusFilter?.value || "";


        const vendor =
            vendorFilter?.value || "";


        filteredUsers =
            users.filter(
                user => {

                    const fullName =
                        `${user.firstName} ${user.lastName}`
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        fullName.includes(search) ||
                        user.username
                            .toLowerCase()
                            .includes(search) ||
                        user.email
                            .toLowerCase()
                            .includes(search);


                    const matchesRole =
                        !role ||
                        user.role === role;


                    const matchesStatus =
                        !status ||
                        user.status === status;


                    const matchesVendor =
                        !vendor ||
                        String(user.vendor) ===
                        String(vendor);


                    return (
                        matchesSearch &&
                        matchesRole &&
                        matchesStatus &&
                        matchesVendor
                    );

                }
            );


        currentPage = Math.min(
            currentPage,
            Math.max(
                1,
                Math.ceil(
                    filteredUsers.length /
                    rowsPerPage
                )
            )
        );


        updateFilterCount();

        renderTable();

    }


    function resetAllFilters() {

        if (userSearch)
            userSearch.value = "";

        if (roleFilter)
            roleFilter.value = "";

        if (statusFilter)
            statusFilter.value = "";

        if (vendorFilter)
            vendorFilter.value = "";


        currentPage = 1;

        applyFilters();

    }


    function updateFilterCount() {

        let count = 0;


        if (userSearch?.value.trim())
            count++;

        if (roleFilter?.value)
            count++;

        if (statusFilter?.value)
            count++;

        if (vendorFilter?.value)
            count++;


        if (filterCount) {

            filterCount.textContent =
                count;

        }

    }


    /* ========================================================
       VENDOR FILTER
    ======================================================== */

    function populateVendorFilter() {

        if (!vendorFilter) return;


        const current =
            vendorFilter.value;


        const vendors =
            new Map();


        users.forEach(
            user => {

                if (
                    user.vendor
                ) {

                    vendors.set(
                        String(user.vendor),
                        user.vendorName ||
                        user.vendor
                    );

                }

            }
        );


        vendorFilter.innerHTML =
            `
            <option value="">
                All Vendors
            </option>
            `;


        vendors.forEach(
            (name, id) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = id;

                option.textContent = name;

                vendorFilter.appendChild(
                    option
                );

            }
        );


        vendorFilter.value =
            current;

    }


    /* ========================================================
       STATS
    ======================================================== */

    function renderStats() {

        if (totalUsers)
            totalUsers.textContent =
                users.length;


        if (activeUsers)
            activeUsers.textContent =
                users.filter(
                    user =>
                        user.status ===
                        "active"
                ).length;


        if (pendingUsers)
            pendingUsers.textContent =
                users.filter(
                    user =>
                        user.status ===
                        "pending"
                ).length;


        if (suspendedUsers)
            suspendedUsers.textContent =
                users.filter(
                    user =>
                        user.status ===
                        "suspended"
                ).length;

    }


    /* ========================================================
       TABLE
    ======================================================== */

    function renderTable() {

        if (!tableBody)
            return;


        const total =
            filteredUsers.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                    rowsPerPage
                )
            );


        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;

        }


        const start =
            (currentPage - 1) *
            rowsPerPage;


        const end =
            Math.min(
                start +
                rowsPerPage,
                total
            );


        const pageUsers =
            filteredUsers.slice(
                start,
                end
            );


        tableBody.innerHTML =
            "";


        if (!pageUsers.length) {

            emptyState?.classList.add(
                "show"
            );

        }
        else {

            emptyState?.classList.remove(
                "show"
            );


            pageUsers.forEach(
                user => {

                    tableBody.appendChild(
                        createUserRow(user)
                    );

                }
            );

        }


        if (resultSummary) {

            resultSummary.textContent =
                `Showing ${total} users`;

        }


        if (paginationInfo) {

            paginationInfo.textContent =
                total === 0
                    ? "Showing 0–0 of 0"
                    : `Showing ${start + 1}–${end} of ${total}`;

        }


        renderPagination(
            totalPages
        );


        updateBulkToolbar();

        updateSelectAll();

    }


    /* ========================================================
       ROW
    ======================================================== */

    function createUserRow(user) {

        const tr =
            document.createElement(
                "tr"
            );


        const initials =
            `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
                .toUpperCase();


        const safeStatus =
            escapeHTML(
                user.status
            );


        tr.innerHTML = `

            <td>

                <input
                    type="checkbox"
                    class="user-checkbox"
                    data-id="${user.id}"
                    ${
                        selectedUsers.has(user.id)
                            ? "checked"
                            : ""
                    }
                >

            </td>


            <td>

                <div class="user-cell">

                    <div class="user-avatar">

                        ${escapeHTML(
                            initials || "U"
                        )}

                    </div>


                    <div>

                        <span class="user-name">

                            ${escapeHTML(
                                `${user.firstName} ${user.lastName}`.trim() ||
                                user.username
                            )}

                        </span>


                        <span class="user-email">

                            ${escapeHTML(
                                user.email
                            )}

                        </span>

                    </div>

                </div>

            </td>


            <td>

                ${escapeHTML(
                    user.vendorName ||
                    user.vendor ||
                    "-"
                )}

            </td>


            <td>

                <span class="role-badge">

                    ${escapeHTML(
                        user.roleName ||
                        user.role ||
                        "-"
                    )}

                </span>

            </td>


            <td>

                <span
                    class="status-badge status-${safeStatus}"
                >

                    ${escapeHTML(
                        capitalize(
                            user.status
                        )
                    )}

                </span>

            </td>


            <td>

                ${escapeHTML(
                    formatDate(
                        user.lastLogin
                    )
                )}

            </td>


            <td>

                ${escapeHTML(
                    formatDate(
                        user.created
                    )
                )}

            </td>


            <td>

                <div class="row-actions">


                    <button
                        type="button"
                        class="row-action"
                        title="View"
                        data-action="view"
                        data-id="${user.id}"
                    >

                        <i class="fa-regular fa-eye"></i>

                    </button>


                    <button
                        type="button"
                        class="row-action"
                        title="Edit"
                        data-action="edit"
                        data-id="${user.id}"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        type="button"
                        class="row-action"
                        title="${
                            user.status === "active"
                                ? "Suspend"
                                : "Activate"
                        }"
                        data-action="${
                            user.status === "active"
                                ? "suspend"
                                : "activate"
                        }"
                        data-id="${user.id}"
                    >

                        <i class="fa-solid ${
                            user.status === "active"
                                ? "fa-user-slash"
                                : "fa-user-check"
                        }"></i>

                    </button>


                </div>

            </td>

        `;


        tr.querySelector(
            ".user-checkbox"
        )?.addEventListener(
            "change",
            event => {

                const id =
                    Number(
                        event.target.dataset.id
                    );


                if (
                    event.target.checked
                ) {

                    selectedUsers.add(id);

                }
                else {

                    selectedUsers.delete(id);

                }


                updateBulkToolbar();

                updateSelectAll();

            }
        );


        tr.querySelectorAll(
            ".row-action"
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    handleRowAction
                );

            }
        );


        return tr;

    }


    /* ========================================================
       ROW ACTIONS
    ======================================================== */

    function handleRowAction(event) {

        const button =
            event.currentTarget;


        const action =
            button.dataset.action;


        const id =
            Number(
                button.dataset.id
            );


        const user =
            users.find(
                item =>
                    item.id === id
            );


        if (!user)
            return;


        if (action === "view") {

            window.location.href =
                API.DETAIL(id);

            return;

        }


        if (action === "edit") {

            showToast(
                "Edit API is not connected yet.",
                "error"
            );

            return;

        }


        if (action === "activate") {

            confirmAction(
                "Activate User",
                `Are you sure you want to activate ${user.username}?`,
                () =>
                    changeStatus(
                        id,
                        true
                    )
            );

            return;

        }


        if (action === "suspend") {

            confirmAction(
                "Suspend User",
                `Are you sure you want to suspend ${user.username}?`,
                () =>
                    changeStatus(
                        id,
                        false
                    )
            );

        }

    }


    /* ========================================================
       STATUS
    ======================================================== */

    async function changeStatus(
        id,
        activate
    ) {

        if (isLoading)
            return;


        setLoading(true);


        try {

            const url =
                activate
                    ? API.ACTIVATE(id)
                    : API.DEACTIVATE(id);


            const response =
                await fetch(
                    url,
                    {
                        method: "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                getCSRFToken()

                        }
                    }
                );


            /*
             * Current Django view redirects after
             * activating/deactivating. Because fetch
             * follows redirects, don't blindly expect
             * JSON here.
             */

            if (
                !response.ok
            ) {

                const data =
                    await parseResponse(
                        response
                    );

                throw new Error(
                    getAPIError(
                        data,
                        "Unable to update user status."
                    )
                );

            }


            selectedUsers.delete(id);


            showToast(
                activate
                    ? "User activated successfully."
                    : "User suspended successfully.",
                "success"
            );


            await loadUsers();

        }
        catch (error) {

            console.error(
                "Status update error:",
                error
            );


            showToast(
                error.message ||
                "Unable to update user status.",
                "error"
            );

        }
        finally {

            setLoading(false);

        }

    }


    /* ========================================================
       MODAL
    ======================================================== */

    function openUserModal() {

        userModal?.classList.add(
            "show"
        );

        document.body.style.overflow =
            "hidden";

    }


    function closeUserForm() {

        userModal?.classList.remove(
            "show"
        );

        document.body.style.overflow =
            "";

        userForm?.reset();

    }


    async function handleUserSubmit(
        event
    ) {

        event.preventDefault();

        showToast(
            "User creation/update API is not connected yet. First connect the CRUD views in views.py.",
            "error"
        );

    }


    function togglePasswordVisibility() {

        const password =
            document.getElementById(
                "password"
            );


        if (!password)
            return;


        const icon =
            togglePassword?.querySelector(
                "i"
            );


        if (
            password.type ===
            "password"
        ) {

            password.type =
                "text";

            if (icon) {

                icon.className =
                    "fa-regular fa-eye-slash";

            }

        }
        else {

            password.type =
                "password";

            if (icon) {

                icon.className =
                    "fa-regular fa-eye";

            }

        }

    }


    /* ========================================================
       SELECTION
    ======================================================== */

    function handleSelectAll(event) {

        const checked =
            event.target.checked;


        const start =
            (currentPage - 1) *
            rowsPerPage;


        const pageUsers =
            filteredUsers.slice(
                start,
                start + rowsPerPage
            );


        pageUsers.forEach(
            user => {

                if (checked) {

                    selectedUsers.add(
                        user.id
                    );

                }
                else {

                    selectedUsers.delete(
                        user.id
                    );

                }

            }
        );


        renderTable();

    }


    function updateSelectAll() {

        if (!selectAll)
            return;


        const start =
            (currentPage - 1) *
            rowsPerPage;


        const pageUsers =
            filteredUsers.slice(
                start,
                start + rowsPerPage
            );


        selectAll.checked =
            pageUsers.length > 0 &&
            pageUsers.every(
                user =>
                    selectedUsers.has(
                        user.id
                    )
            );

    }


    function updateBulkToolbar() {

        const count =
            selectedUsers.size;


        if (selectedCount) {

            selectedCount.textContent =
                count;

        }


        bulkToolbar?.classList.toggle(
            "show",
            count > 0
        );

    }


    /* ========================================================
       PAGINATION
    ======================================================== */

    function renderPagination(
        totalPages
    ) {

        if (!pageNumbers)
            return;


        pageNumbers.innerHTML =
            "";


        const maxVisible = 5;


        let start =
            Math.max(
                1,
                currentPage - 2
            );


        let end =
            Math.min(
                totalPages,
                start +
                maxVisible -
                1
            );


        if (
            end -
            start +
            1 <
            maxVisible
        ) {

            start =
                Math.max(
                    1,
                    end -
                    maxVisible +
                    1
                );

        }


        for (
            let pageNo = start;
            pageNo <= end;
            pageNo++
        ) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "page-number";


            if (
                pageNo ===
                currentPage
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                pageNo;


            button.addEventListener(
                "click",
                () => {

                    currentPage =
                        pageNo;

                    renderTable();

                }
            );


            pageNumbers.appendChild(
                button
            );

        }


        if (prevPage) {

            prevPage.disabled =
                currentPage === 1;

        }


        if (nextPage) {

            nextPage.disabled =
                currentPage >=
                totalPages;

        }

    }


    /* ========================================================
       CONFIRM
    ======================================================== */

    function confirmAction(
        title,
        message,
        callback
    ) {

        if (confirmTitle)
            confirmTitle.textContent =
                title;


        if (confirmMessage)
            confirmMessage.textContent =
                message;


        pendingAction =
            callback;


        confirmModal?.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";

    }


    function executePendingAction() {

        if (
            typeof pendingAction ===
            "function"
        ) {

            const action =
                pendingAction;


            closeConfirm();

            action();

        }

    }


    function closeConfirm() {

        confirmModal?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";


        pendingAction =
            null;

    }


    /* ========================================================
       EXPORT
    ======================================================== */

    function exportUsers() {

        if (
            !filteredUsers.length
        ) {

            showToast(
                "No users available to export.",
                "error"
            );

            return;

        }


        const headers = [
            "Name",
            "Username",
            "Email",
            "Vendor",
            "Role",
            "Status",
            "Last Login",
            "Created"
        ];


        const rows =
            filteredUsers.map(
                user => [

                    `${user.firstName} ${user.lastName}`.trim(),

                    user.username,

                    user.email,

                    user.vendorName ||
                    user.vendor,

                    user.roleName ||
                    user.role,

                    user.status,

                    user.lastLogin,

                    user.created

                ]
            );


        const csv =
            [
                headers,
                ...rows
            ]
                .map(
                    row =>
                        row
                            .map(
                                value =>
                                    `"${String(
                                        value ?? ""
                                    ).replace(
                                        /"/g,
                                        '""'
                                    )}"`
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
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `sita-path-lab-users-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;


        document.body.appendChild(
            link
        );


        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );


        showToast(
            "User data exported successfully.",
            "success"
        );

    }


    /* ========================================================
       CSRF
    ======================================================== */

    function getCSRFToken() {

        const cookie =
            document.cookie
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


        return document.querySelector(
            "[name=csrfmiddlewaretoken]"
        )?.value || "";

    }


    /* ========================================================
       RESPONSE
    ======================================================== */

    async function parseResponse(
        response
    ) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return response.json();

        }


        const text =
            await response.text();


        return {

            success:
                response.ok,

            message:
                text ||
                response.statusText

        };

    }


    function getAPIError(
        data,
        fallback
    ) {

        if (!data)
            return fallback;


        if (
            typeof data.message ===
            "string"
        )
            return data.message;


        if (
            typeof data.detail ===
            "string"
        )
            return data.detail;


        return fallback;

    }


    /* ========================================================
       LOADING
    ======================================================== */

    function setLoading(
        loading,
        button = null
    ) {

        isLoading =
            loading;


        if (button) {

            button.disabled =
                loading;

        }


        document
            .querySelectorAll(
                ".row-action, #addUserBtn, #exportUsersBtn"
            )
            .forEach(
                element => {

                    element.disabled =
                        loading;

                }
            );

    }


    /* ========================================================
       DATE
    ======================================================== */

    function formatDate(
        value
    ) {

        if (
            !value ||
            value === "Never"
        ) {

            return "Never";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

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


    /* ========================================================
       TOAST
    ======================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        if (!toastContainer) {

            alert(message);

            return;

        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `toast ${type}`;


        toast.innerHTML = `

            <i class="fa-solid ${
                type === "success"
                    ? "fa-circle-check"
                    : "fa-circle-exclamation"
            }"></i>

            <span>
                ${escapeHTML(message)}
            </span>

        `;


        toastContainer.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(10px)";

                setTimeout(
                    () =>
                        toast.remove(),
                    250
                );

            },
            3500
        );

    }


    /* ========================================================
       HELPERS
    ======================================================== */

    function capitalize(
        value
    ) {

        if (!value)
            return "";

        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );

    }


    function escapeHTML(
        value
    ) {

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

});