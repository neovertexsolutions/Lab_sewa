/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * USER ROLES & PERMISSIONS
 *
 * Production Database-Driven Frontend Controller
 * Django Backend Integration
 * ============================================================
 */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const CONFIG = {

        /*
         * IMPORTANT:
         * These URLs match the existing Django superadmin
         * settings API routes.
         *
         * If your superadmin/urls.py is included under another
         * prefix, change only these values.
         */

        API: {

            LIST:
                "/superadmin/api/settings/roles/",

            CREATE:
                "/superadmin/api/settings/roles/",

            DETAIL:
                function (id) {
                    return `/superadmin/api/settings/roles/${id}/`;
                },

            PERMISSIONS:
                function (id) {
                    return `/superadmin/api/settings/roles/${id}/permissions/`;
                },

            ALL_PERMISSIONS:
                "/superadmin/api/settings/permissions/"

        },

        REQUEST_TIMEOUT:
            15000

    };


    /* =========================================================
       STATE
    ========================================================= */

    const state = {

        roles: [],

        filteredRoles: [],

        selectedRole: null,

        currentView: "grid",

        loading: false,

        saving: false,

        deleting: false

    };


    /* =========================================================
       DOM
    ========================================================= */

    let searchInput;
    let statusFilter;

    let rolesGrid;
    let tableWrapper;
    let emptyState;

    let viewButtons;

    let createRoleBtn;
    let emptyCreateBtn;
    let refreshBtn;

    let roleModal;
    let deleteModal;

    let closeRoleModal;
    let cancelRoleBtn;

    let roleForm;

    let roleName;
    let roleDescription;
    let descriptionCount;

    let roleStatus;

    let deleteRoleName;

    let cancelDeleteBtn;
    let confirmDeleteBtn;

    let totalRoles;
    let activeRoles;
    let assignedUsers;
    let totalPermissions;

    let saveRoleBtn;


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    function init() {

        cacheDOM();

        if (!rolesGrid && !roleForm) {

            console.warn(
                "Sita Path Lab: User Roles page not found."
            );

            return;

        }


        bindEvents();

        loadRoles();

    }


    /* =========================================================
       DOM CACHE
    ========================================================= */

    function cacheDOM() {

        searchInput =
            document.getElementById(
                "roleSearch"
            );

        statusFilter =
            document.getElementById(
                "statusFilter"
            );

        rolesGrid =
            document.getElementById(
                "rolesGrid"
            );

        tableWrapper =
            document.getElementById(
                "rolesTableWrapper"
            );

        emptyState =
            document.getElementById(
                "emptyState"
            );

        viewButtons =
            document.querySelectorAll(
                ".view-btn"
            );

        createRoleBtn =
            document.getElementById(
                "createRoleBtn"
            );

        emptyCreateBtn =
            document.getElementById(
                "emptyCreateBtn"
            );

        refreshBtn =
            document.getElementById(
                "refreshRolesBtn"
            );

        roleModal =
            document.getElementById(
                "roleModal"
            );

        deleteModal =
            document.getElementById(
                "deleteModal"
            );

        closeRoleModal =
            document.getElementById(
                "closeRoleModal"
            );

        cancelRoleBtn =
            document.getElementById(
                "cancelRoleBtn"
            );

        roleForm =
            document.getElementById(
                "roleForm"
            );

        roleName =
            document.getElementById(
                "roleName"
            );

        roleDescription =
            document.getElementById(
                "roleDescription"
            );

        descriptionCount =
            document.getElementById(
                "descriptionCount"
            );

        roleStatus =
            document.getElementById(
                "roleStatus"
            );

        deleteRoleName =
            document.getElementById(
                "deleteRoleName"
            );

        cancelDeleteBtn =
            document.getElementById(
                "cancelDeleteBtn"
            );

        confirmDeleteBtn =
            document.getElementById(
                "confirmDeleteBtn"
            );

        totalRoles =
            document.getElementById(
                "totalRoles"
            );

        activeRoles =
            document.getElementById(
                "activeRoles"
            );

        assignedUsers =
            document.getElementById(
                "assignedUsers"
            );

        totalPermissions =
            document.getElementById(
                "totalPermissions"
            );

        saveRoleBtn =
            document.getElementById(
                "saveRoleBtn"
            );

    }


    /* =========================================================
       EVENTS
    ========================================================= */

    function bindEvents() {

        searchInput?.addEventListener(
            "input",
            applyFilters
        );


        statusFilter?.addEventListener(
            "change",
            applyFilters
        );


        createRoleBtn?.addEventListener(
            "click",
            () => openCreateModal()
        );


        emptyCreateBtn?.addEventListener(
            "click",
            () => openCreateModal()
        );


        refreshBtn?.addEventListener(
            "click",
            loadRoles
        );


        closeRoleModal?.addEventListener(
            "click",
            closeCreateModal
        );


        cancelRoleBtn?.addEventListener(
            "click",
            closeCreateModal
        );


        roleForm?.addEventListener(
            "submit",
            handleCreateRole
        );


        cancelDeleteBtn?.addEventListener(
            "click",
            closeDeleteModal
        );


        confirmDeleteBtn?.addEventListener(
            "click",
            handleDeleteRole
        );


        roleDescription?.addEventListener(
            "input",
            updateDescriptionCount
        );


        viewButtons?.forEach(button => {

            button.addEventListener(
                "click",
                handleViewSwitch
            );

        });


        document.addEventListener(
            "click",
            handleDocumentClick
        );


        document.addEventListener(
            "keydown",
            handleKeyboard
        );


        updateDescriptionCount();

    }


    /* =========================================================
       LOAD ROLES FROM DJANGO
    ========================================================= */

    async function loadRoles() {

        if (state.loading) {
            return;
        }


        state.loading = true;


        setRefreshLoading(true);

        showPageLoading();


        try {

            const response =
                await fetchWithTimeout(
                    CONFIG.API.LIST,
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


            const payload =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getAPIMessage(
                        payload,
                        "Unable to load roles."
                    )
                );

            }


            const roles =
                normalizeRoleResponse(
                    payload
                );


            state.roles =
                roles;


            state.filteredRoles =
                [...roles];


            renderRoles();

            updateStatistics();

            applyFilters();


            showToast(
                "Roles loaded successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Load roles error:",
                error
            );


            state.roles = [];

            state.filteredRoles = [];


            renderRoles();

            updateStatistics();


            showToast(
                error.message ||
                "Unable to load roles from server.",
                "error"
            );


        } finally {

            state.loading = false;

            setRefreshLoading(false);

            hidePageLoading();

        }

    }


    /* =========================================================
       NORMALIZE API RESPONSE
    ========================================================= */

    function normalizeRoleResponse(payload) {

        if (!payload) {
            return [];
        }


        let source = [];


        if (Array.isArray(payload)) {

            source = payload;

        } else if (
            Array.isArray(payload.roles)
        ) {

            source = payload.roles;

        } else if (
            payload.data &&
            Array.isArray(payload.data.roles)
        ) {

            source =
                payload.data.roles;

        } else if (
            payload.data &&
            Array.isArray(payload.data)
        ) {

            source =
                payload.data;

        }


        return source.map(
            normalizeRole
        );

    }


    function normalizeRole(role) {

        const id =
            role.id ??
            role.pk ??
            role.role_id;


        const name =
            role.name ??
            role.role_name ??
            "Unnamed Role";


        const description =
            role.description ??
            "";


        let active;


        if (
            typeof role.is_active !==
            "undefined"
        ) {

            active =
                Boolean(
                    role.is_active
                );

        } else if (
            typeof role.active !==
            "undefined"
        ) {

            active =
                Boolean(
                    role.active
                );

        } else if (
            typeof role.status !==
            "undefined"
        ) {

            active =
                String(
                    role.status
                ).toLowerCase() ===
                "active";

        } else {

            active = true;

        }


        const users =
            Number(
                role.assigned_users ??
                role.users_count ??
                role.user_count ??
                role.users ??
                0
            ) || 0;


        const permissions =
            Number(
                role.permissions_count ??
                role.permission_count ??
                role.permissions ??
                0
            ) || 0;


        return {

            id,

            name: String(name),

            description:
                String(description),

            active,

            status:
                active
                    ? "active"
                    : "inactive",

            users,

            permissions,

            createdAt:
                role.created_at ??
                role.created ??
                null,

            updatedAt:
                role.updated_at ??
                role.updated ??
                null,

            raw:
                role

        };

    }


    /* =========================================================
       RENDER ROLES
    ========================================================= */

    function renderRoles() {

        if (!rolesGrid) {
            return;
        }


        rolesGrid.innerHTML = "";


        if (
            !state.filteredRoles.length
        ) {

            showEmptyState();

            return;

        }


        hideEmptyState();


        state.filteredRoles.forEach(
            role => {

                const card =
                    createRoleCard(
                        role
                    );


                rolesGrid.appendChild(
                    card
                );

            }
        );


        bindDynamicRoleEvents();


        renderTableView();

    }


    /* =========================================================
       ROLE CARD
    ========================================================= */

    function createRoleCard(role) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "role-card";


        card.dataset.role =
            role.name
                .toLowerCase();


        card.dataset.status =
            role.status;


        card.dataset.id =
            role.id;


        const initials =
            getInitials(
                role.name
            );


        card.innerHTML = `

            <div class="role-card-header">

                <div class="role-avatar">
                    ${escapeHTML(initials)}
                </div>

                <div class="role-title-row">

                    <div>

                        <h3>
                            ${escapeHTML(
                                role.name
                            )}
                        </h3>

                        <span class="role-status ${
                            role.active
                                ? "active"
                                : "inactive"
                        }">

                            <span
                                class="status-dot"
                            ></span>

                            ${
                                role.active
                                    ? "Active"
                                    : "Inactive"
                            }

                        </span>

                    </div>

                    <div class="role-menu">

                        <button
                            type="button"
                            class="role-menu-btn"
                            aria-label="Role actions"
                        >
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        <div
                            class="role-dropdown"
                        >

                            <button
                                type="button"
                                data-action="view"
                            >
                                <i class="fa-regular fa-eye"></i>
                                View
                            </button>

                            <button
                                type="button"
                                data-action="edit"
                            >
                                <i class="fa-solid fa-pen"></i>
                                Edit
                            </button>

                            <button
                                type="button"
                                data-action="permissions"
                            >
                                <i class="fa-solid fa-shield-halved"></i>
                                Permissions
                            </button>

                            <button
                                type="button"
                                data-action="duplicate"
                            >
                                <i class="fa-regular fa-copy"></i>
                                Duplicate
                            </button>

                            <button
                                type="button"
                                data-action="delete"
                                class="danger"
                            >
                                <i class="fa-solid fa-trash"></i>
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            <div class="role-card-body">

                <p>
                    ${
                        escapeHTML(
                            role.description ||
                            "No description available."
                        )
                    }
                </p>

            </div>


            <div class="role-meta">

                <div>

                    <span>
                        Users
                    </span>

                    <strong>
                        ${role.users}
                    </strong>

                </div>


                <div>

                    <span>
                        Permissions
                    </span>

                    <strong>
                        ${role.permissions}
                    </strong>

                </div>

            </div>


            <div class="role-card-footer">

                <button
                    type="button"
                    class="view-role-btn"
                    data-action="view"
                >
                    View Details
                    <i class="fa-solid fa-arrow-right"></i>
                </button>

            </div>

        `;


        return card;

    }


    /* =========================================================
       TABLE VIEW
    ========================================================= */

    function renderTableView() {

        if (!tableWrapper) {
            return;
        }


        const table =
            tableWrapper.querySelector(
                "tbody"
            );


        if (!table) {
            return;
        }


        table.innerHTML = "";


        state.filteredRoles.forEach(
            role => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        <strong>
                            ${escapeHTML(
                                role.name
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            role.description ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${role.users}
                    </td>

                    <td>
                        ${role.permissions}
                    </td>

                    <td>
                        <span class="status-badge ${
                            role.active
                                ? "active"
                                : "inactive"
                        }">
                            ${
                                role.active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>
                    </td>

                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                data-action="view"
                                data-role-id="${role.id}"
                            >
                                <i class="fa-regular fa-eye"></i>
                            </button>

                            <button
                                type="button"
                                data-action="edit"
                                data-role-id="${role.id}"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                data-action="delete"
                                data-role-id="${role.id}"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>

                    </td>

                `;


                table.appendChild(
                    tr
                );

            }
        );


        bindTableActions();

    }


    /* =========================================================
       DYNAMIC EVENTS
    ========================================================= */

    function bindDynamicRoleEvents() {

        document
            .querySelectorAll(
                "#rolesGrid .role-menu-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    handleRoleMenu
                );

            });


        document
            .querySelectorAll(
                "#rolesGrid .role-dropdown button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    handleRoleMenuAction
                );

            });


        document
            .querySelectorAll(
                "#rolesGrid .view-role-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const card =
                            button.closest(
                                ".role-card"
                            );


                        handleRoleAction(
                            "view",
                            getRoleFromCard(
                                card
                            )
                        );

                    }
                );

            });

    }


    function bindTableActions() {

        tableWrapper
            ?.querySelectorAll(
                "[data-action]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.roleId;


                        const role =
                            state.roles.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(id)
                            );


                        handleRoleAction(
                            button.dataset.action,
                            role
                        );

                    }
                );

            });

    }


    function handleRoleMenu(event) {

        event.stopPropagation();


        const menu =
            event.currentTarget
                .closest(".role-menu")
                ?.querySelector(
                    ".role-dropdown"
                );


        document
            .querySelectorAll(
                ".role-dropdown.show"
            )
            .forEach(dropdown => {

                if (
                    dropdown !== menu
                ) {

                    dropdown.classList.remove(
                        "show"
                    );

                }

            });


        menu?.classList.toggle(
            "show"
        );

    }


    function handleRoleMenuAction(event) {

        event.stopPropagation();


        const action =
            event.currentTarget.dataset.action;


        const card =
            event.currentTarget.closest(
                ".role-card"
            );


        const role =
            getRoleFromCard(
                card
            );


        event.currentTarget
            .closest(
                ".role-dropdown"
            )
            ?.classList.remove(
                "show"
            );


        handleRoleAction(
            action,
            role
        );

    }


    function getRoleFromCard(card) {

        if (!card) {
            return null;
        }


        const id =
            card.dataset.id;


        return state.roles.find(
            role =>
                String(role.id) ===
                String(id)
        ) || null;

    }


    /* =========================================================
       ROLE ACTIONS
    ========================================================= */

    function handleRoleAction(
        action,
        role
    ) {

        if (!role) {

            showToast(
                "Role information is unavailable.",
                "error"
            );

            return;

        }


        state.selectedRole =
            role;


        switch (action) {

            case "view":

                viewRole(
                    role
                );

                break;


            case "edit":

                editRole(
                    role
                );

                break;


            case "permissions":

                managePermissions(
                    role
                );

                break;


            case "duplicate":

                duplicateRole(
                    role
                );

                break;


            case "delete":

                openDeleteModal(
                    role
                );

                break;

        }

    }


    /* =========================================================
       VIEW ROLE
    ========================================================= */

    function viewRole(role) {

        /*
         * If you have a separate role detail URL,
         * replace this with:
         *
         * window.location.href =
         * `/superadmin/roles/${role.id}/`;
         */

        showToast(
            `${role.name} selected.`,
            "info"
        );

    }


    /* =========================================================
       EDIT ROLE
    ========================================================= */

    function editRole(role) {

        /*
         * Existing modal is currently designed for CREATE.
         *
         * If backend role_detail_api supports PUT/PATCH,
         * this function can use the same modal.
         */

        openCreateModal(
            role
        );

    }


    /* =========================================================
       DUPLICATE ROLE
    ========================================================= */

    function duplicateRole(role) {

        openCreateModal();


        if (roleName) {

            roleName.value =
                `${role.name} Copy`;

        }


        if (roleDescription) {

            roleDescription.value =
                role.description || "";

            updateDescriptionCount();

        }


        if (roleStatus) {

            roleStatus.checked =
                role.active;

        }


        showToast(
            "Role details copied. Review and create the new role.",
            "info"
        );

    }


    /* =========================================================
       CREATE / EDIT MODAL
    ========================================================= */

    function openCreateModal(
        role = null
    ) {

        roleModal?.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";


        if (roleForm) {

            roleForm.reset();

        }


        if (role) {

            roleForm.dataset.mode =
                "edit";

            roleForm.dataset.roleId =
                role.id;


            if (roleName) {

                roleName.value =
                    role.name;

            }


            if (roleDescription) {

                roleDescription.value =
                    role.description || "";

            }


            if (roleStatus) {

                roleStatus.checked =
                    role.active;

            }


            if (saveRoleBtn) {

                saveRoleBtn.innerHTML =
                    `
                        <i class="fa-solid fa-floppy-disk"></i>
                        Save Changes
                    `;

            }

        } else {

            roleForm.dataset.mode =
                "create";

            roleForm.removeAttribute(
                "data-role-id"
            );


            if (roleStatus) {

                roleStatus.checked =
                    true;

            }


            if (saveRoleBtn) {

                saveRoleBtn.innerHTML =
                    `
                        <i class="fa-solid fa-check"></i>
                        Create Role
                    `;

            }

        }


        updateDescriptionCount();


        setTimeout(
            () => roleName?.focus(),
            100
        );

    }


    function closeCreateModal() {

        roleModal?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";


        roleForm?.reset();


        roleForm?.removeAttribute(
            "data-mode"
        );


        roleForm?.removeAttribute(
            "data-role-id"
        );


        updateDescriptionCount();


        if (saveRoleBtn) {

            saveRoleBtn.disabled =
                false;

            saveRoleBtn.innerHTML =
                `
                    <i class="fa-solid fa-check"></i>
                    Create Role
                `;

        }

    }


    /* =========================================================
       DESCRIPTION COUNTER
    ========================================================= */

    function updateDescriptionCount() {

        if (
            !roleDescription ||
            !descriptionCount
        ) {

            return;

        }


        descriptionCount.textContent =
            roleDescription.value.length;

    }


    /* =========================================================
       CREATE ROLE
    ========================================================= */

    async function handleCreateRole(
        event
    ) {

        event.preventDefault();


        if (state.saving) {
            return;
        }


        const name =
            roleName?.value.trim();


        const description =
            roleDescription?.value.trim() ||
            "";


        const active =
            roleStatus
                ? Boolean(
                    roleStatus.checked
                )
                : true;


        if (!name) {

            showToast(
                "Role name is required.",
                "error"
            );


            roleName?.focus();

            return;

        }


        if (name.length < 2) {

            showToast(
                "Role name must contain at least 2 characters.",
                "error"
            );

            return;

        }


        const duplicate =
            state.roles.some(
                role =>
                    role.name
                        .trim()
                        .toLowerCase() ===
                    name.toLowerCase() &&
                    (
                        roleForm.dataset.mode !==
                        "edit" ||
                        String(role.id) !==
                        String(
                            roleForm.dataset.roleId
                        )
                    )
            );


        if (duplicate) {

            showToast(
                "A role with this name already exists.",
                "error"
            );

            return;

        }


        state.saving = true;

        setSaveLoading(true);


        try {

            const mode =
                roleForm.dataset.mode ||
                "create";


            const roleId =
                roleForm.dataset.roleId;


            let url =
                CONFIG.API.CREATE;


            let method =
                "POST";


            if (
                mode === "edit" &&
                roleId
            ) {

                url =
                    CONFIG.API.DETAIL(
                        roleId
                    );

                method =
                    "PUT";

            }


            const response =
                await fetchWithTimeout(
                    url,
                    {
                        method,

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

                        body:
                            JSON.stringify({

                                name,

                                description,

                                is_active:
                                    active,

                                active

                            })

                    }
                );


            const payload =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getAPIMessage(
                        payload,
                        mode === "edit"
                            ? "Unable to update role."
                            : "Unable to create role."
                    )
                );

            }


            closeCreateModal();


            showToast(
                mode === "edit"
                    ? "Role updated successfully."
                    : "Role created successfully.",
                "success"
            );


            await loadRoles();

        } catch (error) {

            console.error(
                "Save role error:",
                error
            );


            showToast(
                error.message ||
                "Unable to save role.",
                "error"
            );

        } finally {

            state.saving = false;

            setSaveLoading(false);

        }

    }


    /* =========================================================
       DELETE MODAL
    ========================================================= */

    function openDeleteModal(role) {

        state.selectedRole =
            role;


        if (deleteRoleName) {

            deleteRoleName.textContent =
                role.name;

        }


        deleteModal?.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeDeleteModal() {

        deleteModal?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";


        state.selectedRole =
            null;


        if (confirmDeleteBtn) {

            confirmDeleteBtn.disabled =
                false;

            confirmDeleteBtn.innerHTML =
                `
                    <i class="fa-solid fa-trash"></i>
                    Delete Role
                `;

        }

    }


    /* =========================================================
       DELETE ROLE
    ========================================================= */

    async function handleDeleteRole() {

        if (
            state.deleting ||
            !state.selectedRole
        ) {

            return;

        }


        const role =
            state.selectedRole;


        if (
            role.id === null ||
            typeof role.id ===
            "undefined"
        ) {

            showToast(
                "Invalid role ID.",
                "error"
            );

            return;

        }


        state.deleting = true;


        setDeleteLoading(true);


        try {

            const response =
                await fetchWithTimeout(
                    CONFIG.API.DETAIL(
                        role.id
                    ),
                    {
                        method:
                            "DELETE",

                        credentials:
                            "same-origin",

                        headers: {

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                getCSRFToken(),

                            "X-Requested-With":
                                "XMLHttpRequest"

                        }

                    }
                );


            const payload =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getAPIMessage(
                        payload,
                        "Unable to delete role."
                    )
                );

            }


            closeDeleteModal();


            showToast(
                `${role.name} deleted successfully.`,
                "success"
            );


            await loadRoles();

        } catch (error) {

            console.error(
                "Delete role error:",
                error
            );


            showToast(
                error.message ||
                "Unable to delete role.",
                "error"
            );

        } finally {

            state.deleting = false;

            setDeleteLoading(false);

        }

    }


    /* =========================================================
       PERMISSIONS
    ========================================================= */

    async function managePermissions(
        role
    ) {

        if (!role?.id) {

            showToast(
                "Invalid role.",
                "error"
            );

            return;

        }


        /*
         * Existing Django endpoint:
         *
         * /superadmin/api/settings/roles/<role_id>/permissions/
         *
         * Currently we load the permission data so this
         * action is backend-connected.
         */

        try {

            const response =
                await fetchWithTimeout(
                    CONFIG.API.PERMISSIONS(
                        role.id
                    ),
                    {
                        method: "GET",

                        credentials:
                            "same-origin",

                        headers: {

                            "Accept":
                                "application/json",

                            "X-Requested-With":
                                "XMLHttpRequest"

                        }

                    }
                );


            const payload =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getAPIMessage(
                        payload,
                        "Unable to load role permissions."
                    )
                );

            }


            showToast(
                `Permissions loaded for ${role.name}.`,
                "success"
            );


            /*
             * If you have a dedicated permissions page,
             * redirect here:
             *
             * window.location.href =
             * `/superadmin/roles/${role.id}/permissions/`;
             */

            console.log(
                "Role permissions:",
                payload
            );

        } catch (error) {

            console.error(
                "Permissions error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load permissions.",
                "error"
            );

        }

    }


    /* =========================================================
       SEARCH + FILTER
    ========================================================= */

    function applyFilters() {

        const query =
            searchInput?.value
                .trim()
                .toLowerCase() ||
            "";


        const status =
            statusFilter?.value ||
            "all";


        state.filteredRoles =
            state.roles.filter(
                role => {

                    const searchable =
                        `
                            ${role.name}
                            ${role.description}
                        `
                        .toLowerCase();


                    const matchesSearch =
                        !query ||
                        searchable.includes(
                            query
                        );


                    const matchesStatus =
                        status === "all" ||
                        role.status === status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderRoles();

    }


    /* =========================================================
       STATISTICS
    ========================================================= */

    function updateStatistics() {

        const total =
            state.roles.length;


        const active =
            state.roles.filter(
                role =>
                    role.active
            ).length;


        const users =
            state.roles.reduce(
                (
                    total,
                    role
                ) =>
                    total +
                    (
                        Number(
                            role.users
                        ) || 0
                    ),
                0
            );


        const permissions =
            state.roles.reduce(
                (
                    total,
                    role
                ) =>
                    total +
                    (
                        Number(
                            role.permissions
                        ) || 0
                    ),
                0
            );


        if (totalRoles) {

            totalRoles.textContent =
                total;

        }


        if (activeRoles) {

            activeRoles.textContent =
                active;

        }


        if (assignedUsers) {

            assignedUsers.textContent =
                users;

        }


        if (totalPermissions) {

            totalPermissions.textContent =
                permissions;

        }

    }


    /* =========================================================
       VIEW SWITCH
    ========================================================= */

    function handleViewSwitch(
        event
    ) {

        const button =
            event.currentTarget;


        const view =
            button.dataset.view;


        if (!view) {
            return;
        }


        state.currentView =
            view;


        viewButtons.forEach(
            btn => {

                btn.classList.toggle(
                    "active",
                    btn === button
                );

            }
        );


        if (view === "table") {

            if (rolesGrid) {

                rolesGrid.style.display =
                    "none";

            }


            tableWrapper?.classList.add(
                "show"
            );

        } else {

            if (rolesGrid) {

                rolesGrid.style.display =
                    "";

            }


            tableWrapper?.classList.remove(
                "show"
            );

        }

    }


    /* =========================================================
       PAGE LOADING
    ========================================================= */

    function showPageLoading() {

        rolesGrid?.classList.add(
            "is-loading"
        );

    }


    function hidePageLoading() {

        rolesGrid?.classList.remove(
            "is-loading"
        );

    }


    /* =========================================================
       EMPTY STATE
    ========================================================= */

    function showEmptyState() {

        emptyState?.classList.add(
            "show"
        );


        if (rolesGrid) {

            rolesGrid.style.display =
                state.currentView ===
                "table"
                    ? "none"
                    : "";

        }

    }


    function hideEmptyState() {

        emptyState?.classList.remove(
            "show"
        );

    }


    /* =========================================================
       REFRESH BUTTON
    ========================================================= */

    function setRefreshLoading(
        loading
    ) {

        if (!refreshBtn) {
            return;
        }


        if (loading) {

            refreshBtn.disabled =
                true;


            refreshBtn.dataset.originalHTML =
                refreshBtn.innerHTML;


            refreshBtn.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Refreshing
                `;

        } else {

            refreshBtn.disabled =
                false;


            refreshBtn.innerHTML =
                refreshBtn.dataset.originalHTML ||
                `
                    <i class="fa-solid fa-rotate"></i>
                    Refresh
                `;

        }

    }


    /* =========================================================
       SAVE BUTTON
    ========================================================= */

    function setSaveLoading(
        loading
    ) {

        if (!saveRoleBtn) {
            return;
        }


        if (loading) {

            saveRoleBtn.disabled =
                true;


            saveRoleBtn.dataset.originalHTML =
                saveRoleBtn.innerHTML;


            saveRoleBtn.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Saving...
                `;

        } else {

            saveRoleBtn.disabled =
                false;


            saveRoleBtn.innerHTML =
                saveRoleBtn.dataset.originalHTML ||
                `
                    <i class="fa-solid fa-check"></i>
                    Create Role
                `;

        }

    }


    /* =========================================================
       DELETE BUTTON
    ========================================================= */

    function setDeleteLoading(
        loading
    ) {

        if (!confirmDeleteBtn) {
            return;
        }


        if (loading) {

            confirmDeleteBtn.disabled =
                true;


            confirmDeleteBtn.dataset.originalHTML =
                confirmDeleteBtn.innerHTML;


            confirmDeleteBtn.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Deleting...
                `;

        } else {

            confirmDeleteBtn.disabled =
                false;


            confirmDeleteBtn.innerHTML =
                confirmDeleteBtn.dataset.originalHTML ||
                `
                    <i class="fa-solid fa-trash"></i>
                    Delete Role
                `;

        }

    }


    /* =========================================================
       DOCUMENT CLICK
    ========================================================= */

    function handleDocumentClick(
        event
    ) {

        if (
            !event.target.closest(
                ".role-menu"
            )
        ) {

            document
                .querySelectorAll(
                    ".role-dropdown.show"
                )
                .forEach(
                    dropdown =>
                        dropdown.classList.remove(
                            "show"
                        )
                );

        }


        if (
            event.target === roleModal
        ) {

            closeCreateModal();

        }


        if (
            event.target === deleteModal
        ) {

            closeDeleteModal();

        }

    }


    /* =========================================================
       KEYBOARD
    ========================================================= */

    function handleKeyboard(
        event
    ) {

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() ===
            "k"
        ) {

            event.preventDefault();

            searchInput?.focus();

        }


        if (
            event.key ===
            "Escape"
        ) {

            closeCreateModal();

            closeDeleteModal();

        }

    }


    /* =========================================================
       API REQUEST HELPER
    ========================================================= */

    async function fetchWithTimeout(
        url,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () =>
                    controller.abort(),
                CONFIG.REQUEST_TIMEOUT
            );


        try {

            return await fetch(
                url,
                {
                    ...options,

                    signal:
                        controller.signal
                }
            );

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new Error(
                    "Server request timed out. Please try again."
                );

            }


            throw error;

        } finally {

            clearTimeout(
                timeout
            );

        }

    }


    /* =========================================================
       API RESPONSE PARSER
    ========================================================= */

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

            return await response.json();

        }


        const text =
            await response.text();


        return {
            message:
                text ||
                "Unexpected server response."
        };

    }


    /* =========================================================
       API ERROR MESSAGE
    ========================================================= */

    function getAPIMessage(
        payload,
        fallback
    ) {

        if (!payload) {
            return fallback;
        }


        if (
            typeof payload.message ===
            "string"
        ) {

            return payload.message;

        }


        if (
            typeof payload.detail ===
            "string"
        ) {

            return payload.detail;

        }


        if (
            typeof payload.error ===
            "string"
        ) {

            return payload.error;

        }


        if (
            payload.errors &&
            typeof payload.errors ===
            "object"
        ) {

            return Object
                .values(
                    payload.errors
                )
                .flat()
                .join(" ");

        }


        return fallback;

    }


    /* =========================================================
       CSRF
    ========================================================= */

    function getCSRFToken() {

        const name =
            "csrftoken=";


        const cookies =
            document.cookie.split(
                ";"
            );


        for (
            let cookie of cookies
        ) {

            cookie =
                cookie.trim();


            if (
                cookie.startsWith(
                    name
                )
            ) {

                return decodeURIComponent(
                    cookie.substring(
                        name.length
                    )
                );

            }

        }


        /*
         * Django sometimes exposes the
         * token through hidden input.
         */

        const input =
            document.querySelector(
                "[name=csrfmiddlewaretoken]"
            );


        if (input) {

            return input.value;

        }


        /*
         * Meta fallback
         */

        const meta =
            document.querySelector(
                'meta[name="csrf-token"]'
            );


        return meta?.content || "";

    }


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        message,
        type = "success"
    ) {

        document
            .querySelectorAll(
                ".role-toast"
            )
            .forEach(
                toast =>
                    toast.remove()
            );


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `role-toast ${type}`;


        const icon =
            type === "success"
                ? "fa-circle-check"
                : type === "error"
                    ? "fa-circle-exclamation"
                    : "fa-circle-info";


        toast.innerHTML =
            `

                <span class="toast-icon">

                    <i class="fa-solid ${icon}"></i>

                </span>


                <span class="toast-message">
                    ${escapeHTML(
                        message
                    )}
                </span>


                <button
                    type="button"
                    class="toast-close"
                    aria-label="Close notification"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            `;


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );

            }
        );


        toast
            .querySelector(
                ".toast-close"
            )
            ?.addEventListener(
                "click",
                () =>
                    removeToast(
                        toast
                    )
            );


        setTimeout(
            () =>
                removeToast(
                    toast
                ),
            3500
        );

    }


    function removeToast(
        toast
    ) {

        if (!toast) {
            return;
        }


        toast.classList.remove(
            "show"
        );


        setTimeout(
            () =>
                toast.remove(),
            200
        );

    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function getInitials(
        value
    ) {

        return String(
            value || "R"
        )
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                part =>
                    part.charAt(0)
            )
            .join("")
            .toUpperCase();

    }


    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(
                value ?? ""
            );


        return div.innerHTML;

    }


    /* =========================================================
       START
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }


})();