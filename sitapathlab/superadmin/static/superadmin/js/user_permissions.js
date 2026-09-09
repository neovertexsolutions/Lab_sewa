/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * USER PERMISSIONS MANAGEMENT
 *
 * Production-ready Django API controller
 * ============================================================
 */

(function () {

    "use strict";


    /* ============================================================
       CONFIGURATION
    ============================================================ */

    const CONFIG = {

        endpoints: {

            /*
             * User ID page ke HTML se:
             *
             * <body data-user-id="15">
             *
             * ya
             *
             * <div id="permissionPage" data-user-id="15">
             */

            getPermissions:
                "/superadmin/api/users/{user_id}/permissions/",

            savePermissions:
                "/superadmin/api/users/{user_id}/permissions/",

        },

        requestTimeout: 15000

    };


    /* ============================================================
       DOM
    ============================================================ */

    const permissionSearch =
        document.getElementById("permissionSearch");

    const permissionCheckboxes =
        Array.from(
            document.querySelectorAll(
                ".permission-checkbox"
            )
        );

    const moduleCheckboxes =
        Array.from(
            document.querySelectorAll(
                ".module-checkbox"
            )
        );

    const roleInputs =
        Array.from(
            document.querySelectorAll(
                'input[name="userRole"]'
            )
        );

    const selectAllBtn =
        document.getElementById(
            "selectAllBtn"
        );

    const clearAllBtn =
        document.getElementById(
            "clearAllBtn"
        );

    const saveBtn =
        document.getElementById(
            "savePermissionsBtn"
        );

    const bottomSaveBtn =
        document.getElementById(
            "bottomSaveBtn"
        );

    const resetBtn =
        document.getElementById(
            "resetPermissionsBtn"
        );

    const cancelBtn =
        document.getElementById(
            "cancelBtn"
        );

    const modal =
        document.getElementById(
            "permissionModal"
        );

    const modalClose =
        document.getElementById(
            "modalClose"
        );

    const modalCancel =
        document.getElementById(
            "modalCancel"
        );

    const modalConfirm =
        document.getElementById(
            "modalConfirm"
        );

    const totalPermissions =
        document.getElementById(
            "totalPermissions"
        );

    const grantedPermissions =
        document.getElementById(
            "grantedPermissions"
        );

    const deniedPermissions =
        document.getElementById(
            "deniedPermissions"
        );

    const permissionCount =
        document.getElementById(
            "permissionCount"
        );

    const currentRole =
        document.getElementById(
            "currentRole"
        );

    const modalRole =
        document.getElementById(
            "modalRole"
        );

    const modalPermissionCount =
        document.getElementById(
            "modalPermissionCount"
        );

    const changesIndicator =
        document.getElementById(
            "changesIndicator"
        );

    const changesText =
        document.getElementById(
            "changesText"
        );

    const lastUpdated =
        document.getElementById(
            "lastUpdated"
        );


    /* ============================================================
       PAGE / USER ID
    ============================================================ */

    const permissionPage =
        document.getElementById(
            "permissionPage"
        );

    const userId =
        permissionPage?.dataset.userId ||
        document.body.dataset.userId ||
        document.documentElement.dataset.userId ||
        null;


    /* ============================================================
       STATE
    ============================================================ */

    let initialState = null;

    let hasUnsavedChanges = false;

    let isLoading = false;

    let isSaving = false;


    /* ============================================================
       INIT
    ============================================================ */

    async function init() {

        bindEvents();

        updateAllModuleStates();

        updateStatistics();

        updateChangesState(false);

        /*
         * Backend user ID available ho
         * toh database se permissions load karo.
         */

        if (userId) {

            await loadPermissions();

        } else {

            /*
             * Existing HTML state ko initial state maan lo.
             * Development fallback.
             */

            captureInitialState();

        }

    }


    /* ============================================================
       EVENTS
    ============================================================ */

    function bindEvents() {

        permissionCheckboxes.forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    handlePermissionChange
                );

            }
        );


        moduleCheckboxes.forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    handleModuleSelect
                );

            }
        );


        roleInputs.forEach(
            input => {

                input.addEventListener(
                    "change",
                    handleRoleChange
                );

            }
        );


        permissionSearch?.addEventListener(
            "input",
            filterPermissions
        );


        selectAllBtn?.addEventListener(
            "click",
            selectAllPermissions
        );


        clearAllBtn?.addEventListener(
            "click",
            clearAllPermissions
        );


        saveBtn?.addEventListener(
            "click",
            openSaveModal
        );


        bottomSaveBtn?.addEventListener(
            "click",
            openSaveModal
        );


        resetBtn?.addEventListener(
            "click",
            resetPermissions
        );


        cancelBtn?.addEventListener(
            "click",
            handleCancel
        );


        modalClose?.addEventListener(
            "click",
            closeModal
        );


        modalCancel?.addEventListener(
            "click",
            closeModal
        );


        modalConfirm?.addEventListener(
            "click",
            savePermissions
        );


        modal?.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );


        document.addEventListener(
            "keydown",
            handleKeyboard
        );


        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

    }


    /* ============================================================
       GET CURRENT STATE
    ============================================================ */

    function getCurrentState() {

        const permissions = {};


        permissionCheckboxes.forEach(
            checkbox => {

                const module =
                    checkbox.dataset.module;

                const permission =
                    checkbox.dataset.permission;

                if (!module || !permission) {
                    return;
                }


                if (
                    !permissions[module]
                ) {

                    permissions[module] = {};

                }


                permissions[module][permission] =
                    checkbox.checked;

            }
        );


        const selectedRole =
            roleInputs.find(
                input => input.checked
            );


        return {

            user_id: userId,

            role:
                selectedRole
                    ? selectedRole.value
                    : null,

            permissions

        };

    }


    /* ============================================================
       CAPTURE INITIAL STATE
    ============================================================ */

    function captureInitialState() {

        initialState =
            JSON.stringify(
                getCurrentState()
            );

    }


    /* ============================================================
       LOAD PERMISSIONS FROM DJANGO
    ============================================================ */

    async function loadPermissions() {

        if (!userId) {

            console.warn(
                "Permission page user ID not found."
            );

            captureInitialState();

            return;

        }


        setLoadingState(true);


        try {

            const url =
                buildEndpoint(
                    CONFIG.endpoints.getPermissions,
                    userId
                );


            const response =
                await fetchWithTimeout(
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


            const data =
                await parseJSON(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to load permissions."
                );

            }


            applyBackendState(data);


            captureInitialState();

            hasUnsavedChanges = false;

            updateChangesState(false);


        } catch (error) {

            console.error(
                "Permission load error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load permissions.",
                "error"
            );


            /*
             * Current HTML state ko preserve.
             */

            captureInitialState();

        } finally {

            setLoadingState(false);

        }

    }


    /* ============================================================
       APPLY BACKEND STATE
    ============================================================ */

    function applyBackendState(data) {

        /*
         * Expected backend response:
         *
         * {
         *   "user_id": 15,
         *   "role": "manager",
         *   "permissions": {
         *      "patients": {
         *          "view": true,
         *          "create": true,
         *          "edit": false,
         *          "delete": false
         *      }
         *   }
         * }
         */


        const backendRole =
            data.role ||
            data.user_role ||
            null;


        if (backendRole) {

            const roleInput =
                roleInputs.find(
                    input =>
                        input.value ===
                        backendRole
                );


            if (roleInput) {

                roleInput.checked =
                    true;

            }

        }


        const backendPermissions =
            data.permissions ||
            {};


        permissionCheckboxes.forEach(
            checkbox => {

                const module =
                    checkbox.dataset.module;

                const permission =
                    checkbox.dataset.permission;


                const moduleData =
                    backendPermissions[
                        module
                    ];


                checkbox.checked =
                    Boolean(
                        moduleData &&
                        moduleData[
                            permission
                        ]
                    );

            }
        );


        updateCurrentRole();

        updateAllModuleStates();

        updateStatistics();

    }


    /* ============================================================
       PERMISSION CHANGE
    ============================================================ */

    function handlePermissionChange(event) {

        const checkbox =
            event.target;


        updateModuleState(
            checkbox.dataset.module
        );


        updateStatistics();

        detectChanges();

    }


    /* ============================================================
       MODULE SELECT
    ============================================================ */

    function handleModuleSelect(event) {

        const module =
            event.target.dataset.module;

        const checked =
            event.target.checked;


        permissionCheckboxes
            .filter(
                checkbox =>
                    checkbox.dataset.module ===
                    module
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        checked;

                }
            );


        updateStatistics();

        detectChanges();

    }


    /* ============================================================
       MODULE STATE
    ============================================================ */

    function updateModuleState(module) {

        if (!module) {
            return;
        }


        const moduleCheckbox =
            moduleCheckboxes.find(
                checkbox =>
                    checkbox.dataset.module ===
                    module
            );


        if (!moduleCheckbox) {
            return;
        }


        const modulePermissions =
            permissionCheckboxes.filter(
                checkbox =>
                    checkbox.dataset.module ===
                    module
            );


        const checkedCount =
            modulePermissions.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        moduleCheckbox.checked =
            modulePermissions.length > 0 &&
            checkedCount ===
            modulePermissions.length;


        moduleCheckbox.indeterminate =
            checkedCount > 0 &&
            checkedCount <
            modulePermissions.length;

    }


    function updateAllModuleStates() {

        const modules =
            new Set(
                permissionCheckboxes.map(
                    checkbox =>
                        checkbox.dataset.module
                )
            );


        modules.forEach(
            module =>
                updateModuleState(module)
        );

    }


    /* ============================================================
       SELECT ALL
    ============================================================ */

    function selectAllPermissions() {

        permissionCheckboxes.forEach(
            checkbox =>
                checkbox.checked = true
        );


        updateAllModuleStates();

        updateStatistics();

        detectChanges();

    }


    /* ============================================================
       CLEAR ALL
    ============================================================ */

    function clearAllPermissions() {

        permissionCheckboxes.forEach(
            checkbox =>
                checkbox.checked = false
        );


        updateAllModuleStates();

        updateStatistics();

        detectChanges();

    }


    /* ============================================================
       ROLE CHANGE
    ============================================================ */

    async function handleRoleChange(event) {

        const role =
            event.target.value;


        updateCurrentRole();


        /*
         * Agar unsaved changes hain toh role switch
         * karne se pehle current state lose ho sakta hai.
         */

        if (hasUnsavedChanges) {

            const proceed =
                window.confirm(
                    "You have unsaved permission changes. " +
                    "Changing role will discard those changes. Continue?"
                );


            if (!proceed) {

                event.target.checked =
                    false;

                restoreSelectedRole();

                return;

            }

        }


        /*
         * Role-specific permissions backend se load.
         */

        if (userId && role) {

            await loadRolePermissions(
                role
            );

        } else {

            detectChanges();

        }

    }


    function updateCurrentRole() {

        const selectedRole =
            roleInputs.find(
                input =>
                    input.checked
            );


        if (currentRole) {

            currentRole.textContent =
                selectedRole
                    ? (
                        selectedRole.dataset.role ||
                        selectedRole.value
                    )
                    : "No Role";

        }

    }


    function restoreSelectedRole() {

        if (!initialState) {
            return;
        }


        try {

            const state =
                JSON.parse(
                    initialState
                );


            roleInputs.forEach(
                input => {

                    input.checked =
                        input.value ===
                        state.role;

                }
            );


            updateCurrentRole();

        } catch (error) {

            console.error(
                "Role restore error:",
                error
            );

        }

    }


    /* ============================================================
       LOAD ROLE PERMISSIONS
    ============================================================ */

    async function loadRolePermissions(role) {

        setLoadingState(true);


        try {

            const url =
                buildEndpoint(
                    CONFIG.endpoints.getPermissions,
                    userId
                ) +
                `?role=${encodeURIComponent(role)}`;


            const response =
                await fetchWithTimeout(
                    url,
                    {
                        method: "GET",
                        headers: {

                            "Accept":
                                "application/json",

                            "X-Requested-With":
                                "XMLHttpRequest"

                        },

                        credentials:
                            "same-origin"

                    }
                );


            const data =
                await parseJSON(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to load role permissions."
                );

            }


            applyBackendState(data);


            captureInitialState();

            hasUnsavedChanges = false;

            updateChangesState(false);


        } catch (error) {

            console.error(
                "Role permission load error:",
                error
            );


            showToast(
                error.message ||
                "Unable to load role permissions.",
                "error"
            );


        } finally {

            setLoadingState(false);

        }

    }


    /* ============================================================
       SEARCH
    ============================================================ */

    function filterPermissions() {

        const query =
            permissionSearch?.value
                .trim()
                .toLowerCase() ||
            "";


        document
            .querySelectorAll(
                ".permission-module"
            )
            .forEach(
                module => {

                    let visibleCount = 0;


                    module
                        .querySelectorAll(
                            ".permission-item"
                        )
                        .forEach(
                            item => {

                                const text =
                                    item.textContent
                                        .toLowerCase();


                                const visible =
                                    !query ||
                                    text.includes(
                                        query
                                    );


                                item.style.display =
                                    visible
                                        ? ""
                                        : "flex";


                                if (visible) {
                                    visibleCount++;
                                }

                            }
                        );


                    module.style.display =
                        visibleCount > 0
                            ? ""
                            : "none";

                }
            );

    }


    /* ============================================================
       STATISTICS
    ============================================================ */

    function updateStatistics() {

        const total =
            permissionCheckboxes.length;


        const granted =
            permissionCheckboxes.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        const denied =
            total -
            granted;


        if (totalPermissions) {

            totalPermissions.textContent =
                total;

        }


        if (grantedPermissions) {

            grantedPermissions.textContent =
                granted;

        }


        if (deniedPermissions) {

            deniedPermissions.textContent =
                denied;

        }


        if (permissionCount) {

            permissionCount.textContent =
                granted;

        }

    }


    /* ============================================================
       CHANGE DETECTION
    ============================================================ */

    function detectChanges() {

        const currentState =
            JSON.stringify(
                getCurrentState()
            );


        hasUnsavedChanges =
            currentState !==
            initialState;


        updateChangesState(
            hasUnsavedChanges
        );

    }


    function updateChangesState(
        unsaved
    ) {

        if (
            !changesIndicator ||
            !changesText
        ) {
            return;
        }


        if (unsaved) {

            changesIndicator.classList.add(
                "unsaved"
            );


            changesText.textContent =
                "You have unsaved changes";


        } else {

            changesIndicator.classList.remove(
                "unsaved"
            );


            changesText.textContent =
                "No unsaved changes";

        }

    }


    /* ============================================================
       RESET
    ============================================================ */

    function resetPermissions() {

        if (!initialState) {
            return;
        }


        try {

            const state =
                JSON.parse(
                    initialState
                );


            roleInputs.forEach(
                input => {

                    input.checked =
                        input.value ===
                        state.role;

                }
            );


            permissionCheckboxes.forEach(
                checkbox => {

                    const module =
                        checkbox.dataset.module;

                    const permission =
                        checkbox.dataset.permission;


                    checkbox.checked =
                        Boolean(
                            state.permissions
                                ?.[
                                    module
                                ]
                                ?.[
                                    permission
                                ]
                        );

                }
            );


            updateCurrentRole();

            updateAllModuleStates();

            updateStatistics();

            detectChanges();


            showToast(
                "Permission changes reset.",
                "info"
            );


        } catch (error) {

            console.error(
                "Reset permission error:",
                error
            );


            showToast(
                "Unable to reset permissions.",
                "error"
            );

        }

    }


    /* ============================================================
       CANCEL
    ============================================================ */

    function handleCancel() {

        if (!hasUnsavedChanges) {
            return;
        }


        resetPermissions();

    }


    /* ============================================================
       SAVE MODAL
    ============================================================ */

    function openSaveModal() {

        if (isSaving) {
            return;
        }


        const selectedRole =
            roleInputs.find(
                input =>
                    input.checked
            );


        const roleText =
            selectedRole
                ? (
                    selectedRole.dataset.role ||
                    selectedRole.value
                )
                : "No Role";


        const granted =
            permissionCheckboxes.filter(
                checkbox =>
                    checkbox.checked
            ).length;


        if (modalRole) {

            modalRole.textContent =
                roleText;

        }


        if (modalPermissionCount) {

            modalPermissionCount.textContent =
                granted;

        }


        if (modal) {

            modal.classList.add(
                "show"
            );

        }


        document.body.style.overflow =
            "hidden";

    }


    /* ============================================================
       CLOSE MODAL
    ============================================================ */

    function closeModal() {

        modal?.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


    /* ============================================================
       SAVE PERMISSIONS
    ============================================================ */

    async function savePermissions() {

        if (isSaving) {
            return;
        }


        if (!userId) {

            showToast(
                "User ID is missing.",
                "error"
            );

            return;

        }


        const state =
            getCurrentState();


        if (!state.role) {

            showToast(
                "Please select a user role.",
                "error"
            );

            return;

        }


        isSaving = true;


        const originalButton =
            modalConfirm?.innerHTML;


        if (modalConfirm) {

            modalConfirm.disabled =
                true;


            modalConfirm.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Saving...
                `;

        }


        try {

            const url =
                buildEndpoint(
                    CONFIG.endpoints.savePermissions,
                    userId
                );


            const response =
                await fetchWithTimeout(
                    url,
                    {
                        method: "POST",

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

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify({
                                role:
                                    state.role,

                                permissions:
                                    state.permissions
                            })

                    }
                );


            const data =
                await parseJSON(response);


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to save permissions."
                );

            }


            /*
             * Backend successfully saved.
             */

            initialState =
                JSON.stringify(
                    state
                );


            hasUnsavedChanges =
                false;


            updateChangesState(
                false
            );


            updateLastUpdated(
                data.updated_at
            );


            closeModal();


            showToast(
                data.message ||
                "Permissions updated successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Permission save failed:",
                error
            );


            showToast(
                error.message ||
                "Unable to save permissions.",
                "error"
            );


        } finally {

            isSaving = false;


            if (modalConfirm) {

                modalConfirm.disabled =
                    false;


                modalConfirm.innerHTML =
                    originalButton ||
                    `
                        <i class="fa-solid fa-check"></i>
                        Confirm & Save
                    `;

            }

        }

    }


    /* ============================================================
       LAST UPDATED
    ============================================================ */

    function updateLastUpdated(
        backendDate = null
    ) {

        if (!lastUpdated) {
            return;
        }


        let date;


        if (backendDate) {

            date =
                new Date(
                    backendDate
                );

        } else {

            date =
                new Date();

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return;

        }


        lastUpdated.textContent =
            date.toLocaleString(
                "en-IN",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit"

                }
            );

    }


    /* ============================================================
       LOADING STATE
    ============================================================ */

    function setLoadingState(
        loading
    ) {

        isLoading =
            loading;


        document.body.classList.toggle(
            "permissions-loading",
            loading
        );


        permissionCheckboxes.forEach(
            checkbox => {

                checkbox.disabled =
                    loading;

            }
        );


        moduleCheckboxes.forEach(
            checkbox => {

                checkbox.disabled =
                    loading;

            }
        );


        roleInputs.forEach(
            input => {

                input.disabled =
                    loading;

            }
        );


        if (saveBtn) {

            saveBtn.disabled =
                loading ||
                isSaving;

        }


        if (bottomSaveBtn) {

            bottomSaveBtn.disabled =
                loading ||
                isSaving;

        }

    }


    /* ============================================================
       KEYBOARD
    ============================================================ */

    function handleKeyboard(event) {

        if (
            event.key === "Escape" &&
            modal?.classList.contains(
                "show"
            )
        ) {

            closeModal();

        }


        /*
         * Ctrl + S
         */

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();


            if (hasUnsavedChanges) {

                openSaveModal();

            }

        }

    }


    /* ============================================================
       BEFORE UNLOAD
    ============================================================ */

    function handleBeforeUnload(
        event
    ) {

        if (!hasUnsavedChanges) {
            return;
        }


        event.preventDefault();

        event.returnValue = "";

    }


    /* ============================================================
       API HELPERS
    ============================================================ */

    function buildEndpoint(
        template,
        id
    ) {

        return template.replace(
            "{user_id}",
            encodeURIComponent(id)
        );

    }


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
                CONFIG.requestTimeout
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
                    "Request timed out. Please try again."
                );

            }


            if (
                !navigator.onLine
            ) {

                throw new Error(
                    "No internet connection."
                );

            }


            throw error;

        } finally {

            clearTimeout(
                timeout
            );

        }

    }


    async function parseJSON(
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
                `Request failed with status ${response.status}.`
        };

    }


    /* ============================================================
       CSRF
    ============================================================ */

    window.getCSRFToken =
        function () {

            const name =
                "csrftoken=";


            const cookies =
                document.cookie.split(";");


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
             * Django cookie available na ho
             * toh hidden input fallback.
             */

            const csrfInput =
                document.querySelector(
                    "[name=csrfmiddlewaretoken]"
                );


            return (
                csrfInput?.value ||
                ""
            );

        };


    /* ============================================================
       TOAST
    ============================================================ */

    function showToast(
        message,
        type = "success"
    ) {

        document
            .querySelectorAll(
                ".permission-toast"
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
            `permission-toast ${type}`;


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
                    ${escapeHTML(message)}
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
                () => removeToast(toast)
            );


        setTimeout(
            () =>
                removeToast(toast),
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


    /* ============================================================
       HTML ESCAPE
    ============================================================ */

    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value;


        return div.innerHTML;

    }


    /* ============================================================
       START APPLICATION
    ============================================================ */

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