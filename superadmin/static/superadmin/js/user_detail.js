/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN - USER DETAIL
 * Production Level Django Frontend Controller
 * =========================================================
 */

(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const page =
        document.querySelector("[data-user-detail]");


    const USER_ID =
        page?.dataset.userId ||
        window.USER_ID ||
        "";


    /*
     * Django API endpoints
     *
     * Best practice:
     * HTML se data attributes ke through URLs pass karo.
     *
     * Example:
     *
     * <div
     *   data-user-detail
     *   data-user-id="{{ selected_user.id }}"
     *   data-update-url="..."
     * >
     *
     */

    const API = {

        update:
            page?.dataset.updateUrl ||
            "",

        status:
            page?.dataset.statusUrl ||
            "",

        password:
            page?.dataset.passwordUrl ||
            "",

        twoFactor:
            page?.dataset.twoFactorUrl ||
            "",

        delete:
            page?.dataset.deleteUrl ||
            "",

        verify:
            page?.dataset.verifyUrl ||
            "",

        email:
            page?.dataset.emailUrl ||
            "",

        audit:
            page?.dataset.auditUrl ||
            "",

        loginLogs:
            page?.dataset.loginLogsUrl ||
            "",

        vendor:
            page?.dataset.vendorUrl ||
            ""

    };


    /* =========================================================
       STATE
    ========================================================= */

    let userActive =
        page?.dataset.userActive !== "false";

    let twoFactorEnabled =
        page?.dataset.twoFactorEnabled === "true";

    let toastTimer;


    /* =========================================================
       DOM
    ========================================================= */

    const moreActionsBtn =
        document.getElementById(
            "moreActionsBtn"
        );

    const moreMenu =
        document.getElementById(
            "moreMenu"
        );

    const toggleUserStatus =
        document.getElementById(
            "toggleUserStatus"
        );

    const passwordModal =
        document.getElementById(
            "passwordModal"
        );

    const editUserModal =
        document.getElementById(
            "editUserModal"
        );

    const twoFactorToggle =
        document.getElementById(
            "twoFactorToggle"
        );


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    function init() {

        setupMoreMenu();

        setupStatusToggle();

        setupPasswordModal();

        setupEditModal();

        setupTwoFactor();

        setupQuickActions();

        setupDeleteAction();

        setupVendorAction();

        updateUserStatus();

        updateTwoFactorUI();

    }


    /* =========================================================
       MORE MENU
    ========================================================= */

    function setupMoreMenu() {

        if (
            !moreActionsBtn ||
            !moreMenu
        ) {
            return;
        }


        moreActionsBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                moreMenu.classList.toggle(
                    "active"
                );

            }
        );


        document.addEventListener(
            "click",
            function (event) {

                if (
                    !moreMenu.contains(
                        event.target
                    ) &&
                    !moreActionsBtn.contains(
                        event.target
                    )
                ) {

                    moreMenu.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =========================================================
       USER STATUS
    ========================================================= */

    function setupStatusToggle() {

        toggleUserStatus?.addEventListener(
            "click",
            async function () {

                const newStatus =
                    !userActive;


                const oldStatus =
                    userActive;


                /*
                 * Optimistic UI
                 */

                userActive =
                    newStatus;

                updateUserStatus();


                try {

                    if (API.status) {

                        await apiRequest(
                            API.status,
                            "POST",
                            {
                                user_id: USER_ID,
                                is_active: newStatus
                            }
                        );

                    }


                    showToast(
                        newStatus
                            ? "User Activated"
                            : "User Suspended",

                        newStatus
                            ? "The user has been activated successfully."
                            : "The user has been suspended successfully.",

                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Status update failed:",
                        error
                    );


                    /*
                     * Rollback UI
                     */

                    userActive =
                        oldStatus;

                    updateUserStatus();


                    showToast(
                        "Update Failed",
                        error.message ||
                        "Unable to update user status.",
                        "error"
                    );

                }

            }
        );

    }


    function updateUserStatus() {

        const headerStatus =
            document.getElementById(
                "headerStatus"
            );

        const accountStatus =
            document.getElementById(
                "accountStatus"
            );

        const statusDescription =
            document.getElementById(
                "statusDescription"
            );


        if (
            headerStatus &&
            accountStatus &&
            statusDescription &&
            toggleUserStatus
        ) {

            if (userActive) {

                headerStatus.className =
                    "status-badge active";

                headerStatus.innerHTML =
                    "<span></span> Active";


                accountStatus.textContent =
                    "Active";


                if (accountStatus.parentElement) {

                    accountStatus.parentElement.className =
                        "status-large active";

                }


                statusDescription.textContent =
                    "User currently has full access according to assigned permissions.";


                toggleUserStatus.innerHTML =
                    '<i class="fa-solid fa-ban"></i> Suspend User';

            } else {

                headerStatus.className =
                    "status-badge suspended";

                headerStatus.innerHTML =
                    "<span></span> Suspended";


                accountStatus.textContent =
                    "Suspended";


                if (accountStatus.parentElement) {

                    accountStatus.parentElement.className =
                        "status-large suspended";

                }


                statusDescription.textContent =
                    "User access has been suspended by the Super Administrator.";


                toggleUserStatus.innerHTML =
                    '<i class="fa-solid fa-circle-check"></i> Activate User';

            }

        }

    }


    /* =========================================================
       PASSWORD MODAL
    ========================================================= */

    function setupPasswordModal() {

        const openButtons = [

            document.getElementById(
                "resetPasswordBtn"
            ),

            document.getElementById(
                "changePasswordBtn"
            ),

            document.getElementById(
                "quickResetPassword"
            )

        ];


        openButtons.forEach(
            function (button) {

                button?.addEventListener(
                    "click",
                    openPasswordModal
                );

            }
        );


        document
            .getElementById(
                "closePasswordModal"
            )
            ?.addEventListener(
                "click",
                closePasswordModal
            );


        document
            .getElementById(
                "cancelPassword"
            )
            ?.addEventListener(
                "click",
                closePasswordModal
            );


        document
            .getElementById(
                "confirmPasswordReset"
            )
            ?.addEventListener(
                "click",
                resetPassword
            );


        document
            .getElementById(
                "togglePassword"
            )
            ?.addEventListener(
                "click",
                togglePasswordVisibility
            );


        document
            .getElementById(
                "newPassword"
            )
            ?.addEventListener(
                "input",
                checkPasswordStrength
            );

    }


    function openPasswordModal() {

        moreMenu?.classList.remove(
            "active"
        );


        passwordModal?.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";


        const password =
            document.getElementById(
                "newPassword"
            );


        if (password) {
            password.value = "";
        }

    }


    function closePasswordModal() {

        passwordModal?.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }


    function togglePasswordVisibility() {

        const input =
            document.getElementById(
                "newPassword"
            );

        const icon =
            document.querySelector(
                "#togglePassword i"
            );


        if (!input) {
            return;
        }


        if (input.type === "password") {

            input.type =
                "text";


            if (icon) {

                icon.className =
                    "fa-solid fa-eye-slash";

            }

        } else {

            input.type =
                "password";


            if (icon) {

                icon.className =
                    "fa-solid fa-eye";

            }

        }

    }


    function checkPasswordStrength(event) {

        const password =
            event.target.value;


        const bar =
            document.getElementById(
                "strengthBar"
            );

        const text =
            document.getElementById(
                "strengthText"
            );


        if (!bar || !text) {
            return;
        }


        let score = 0;


        if (password.length >= 8) {
            score++;
        }

        if (/[A-Z]/.test(password)) {
            score++;
        }

        if (/[0-9]/.test(password)) {
            score++;
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            score++;
        }


        const widths = [
            "0%",
            "25%",
            "50%",
            "75%",
            "100%"
        ];


        const labels = [
            "Password strength",
            "Very weak",
            "Weak",
            "Good",
            "Strong"
        ];


        bar.style.width =
            widths[score];


        text.textContent =
            labels[score];

    }


    async function resetPassword() {

        const passwordInput =
            document.getElementById(
                "newPassword"
            );


        const confirmInput =
            document.getElementById(
                "confirmPassword"
            );


        const button =
            document.getElementById(
                "confirmPasswordReset"
            );


        const password =
            passwordInput?.value.trim() ||
            "";


        const confirmPassword =
            confirmInput?.value.trim() ||
            "";


        if (password.length < 8) {

            showToast(
                "Invalid Password",
                "Password must contain at least 8 characters.",
                "error"
            );

            return;

        }


        if (
            confirmInput &&
            password !== confirmPassword
        ) {

            showToast(
                "Password Mismatch",
                "New password and confirmation password do not match.",
                "error"
            );

            return;

        }


        try {

            setButtonLoading(
                button,
                true,
                "Resetting..."
            );


            if (!API.password) {

                throw new Error(
                    "Password API endpoint is not configured."
                );

            }


            await apiRequest(
                API.password,
                "POST",
                {
                    user_id: USER_ID,
                    password: password
                }
            );


            closePasswordModal();


            showToast(
                "Password Reset",
                "User password has been updated successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Password reset failed:",
                error
            );


            showToast(
                "Password Reset Failed",
                error.message ||
                "Unable to reset password.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false,
                '<i class="fa-solid fa-check"></i> Reset Password'
            );

        }

    }


    /* =========================================================
       EDIT USER
    ========================================================= */

    function setupEditModal() {

        document
            .getElementById(
                "editUserBtn"
            )
            ?.addEventListener(
                "click",
                openEditModal
            );


        document
            .getElementById(
                "editProfileBtn"
            )
            ?.addEventListener(
                "click",
                openEditModal
            );


        document
            .getElementById(
                "closeEditModal"
            )
            ?.addEventListener(
                "click",
                closeEditModal
            );


        document
            .getElementById(
                "cancelEdit"
            )
            ?.addEventListener(
                "click",
                closeEditModal
            );


        document
            .getElementById(
                "saveUserChanges"
            )
            ?.addEventListener(
                "click",
                saveUserChanges
            );

    }


    function openEditModal() {

        moreMenu?.classList.remove(
            "active"
        );


        editUserModal?.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeEditModal() {

        editUserModal?.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }


    async function saveUserChanges() {

        const name =
            getInputValue("editName");

        const username =
            getInputValue("editUsername");

        const email =
            getInputValue("editEmail");

        const phone =
            getInputValue("editPhone");

        const role =
            getInputValue("editRole");

        const department =
            getInputValue("editDepartment");


        if (
            !name ||
            !username ||
            !email
        ) {

            showToast(
                "Validation Error",
                "Name, username and email are required.",
                "error"
            );

            return;

        }


        const button =
            document.getElementById(
                "saveUserChanges"
            );


        try {

            setButtonLoading(
                button,
                true,
                "Saving..."
            );


            if (!API.update) {

                throw new Error(
                    "User update API endpoint is not configured."
                );

            }


            await apiRequest(
                API.update,
                "PATCH",
                {
                    user_id: USER_ID,
                    name: name,
                    username: username,
                    email: email,
                    phone: phone,
                    role: role,
                    department: department
                }
            );


            updateUserDOM({
                name,
                username,
                email,
                phone,
                role,
                department
            });


            closeEditModal();


            showToast(
                "User Updated",
                "User information has been updated successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "User update failed:",
                error
            );


            showToast(
                "Update Failed",
                error.message ||
                "Unable to update user information.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false,
                '<i class="fa-solid fa-floppy-disk"></i> Save Changes'
            );

        }

    }


    function updateUserDOM(data) {

        setText(
            "headerName",
            data.name
        );

        setText(
            "headerEmail",
            data.email
        );

        setText(
            "profileName",
            data.name
        );

        setText(
            "profileUsername",
            data.username
        );

        setText(
            "profileEmail",
            data.email
        );

        setText(
            "profilePhone",
            data.phone || "-"
        );

        setText(
            "profileDepartment",
            data.department || "-"
        );

        setText(
            "assignedRole",
            data.role
        );

        setText(
            "roleName",
            data.role
        );


        const avatar =
            document.getElementById(
                "headerAvatar"
            );


        if (avatar) {

            avatar.textContent =
                getInitials(data.name);

        }

    }


    /* =========================================================
       TWO FACTOR AUTHENTICATION
    ========================================================= */

    function setupTwoFactor() {

        twoFactorToggle?.addEventListener(
            "click",
            toggleTwoFactor
        );

    }


    async function toggleTwoFactor() {

        const oldState =
            twoFactorEnabled;


        const newState =
            !oldState;


        twoFactorEnabled =
            newState;


        updateTwoFactorUI();


        try {

            if (!API.twoFactor) {

                throw new Error(
                    "2FA API endpoint is not configured."
                );

            }


            await apiRequest(
                API.twoFactor,
                "POST",
                {
                    user_id: USER_ID,
                    enabled: newState
                }
            );


            showToast(
                newState
                    ? "2FA Enabled"
                    : "2FA Disabled",

                newState
                    ? "Two-factor authentication has been enabled."
                    : "Two-factor authentication has been disabled.",

                "success"
            );


        } catch (error) {

            console.error(
                "2FA update failed:",
                error
            );


            twoFactorEnabled =
                oldState;


            updateTwoFactorUI();


            showToast(
                "2FA Update Failed",
                error.message ||
                "Unable to update two-factor authentication.",
                "error"
            );

        }

    }


    function updateTwoFactorUI() {

        if (!twoFactorToggle) {
            return;
        }


        twoFactorToggle.classList.toggle(
            "active",
            twoFactorEnabled
        );


        twoFactorToggle.setAttribute(
            "aria-pressed",
            String(twoFactorEnabled)
        );


        const status =
            document.getElementById(
                "twoFactorStatus"
            );


        if (status) {

            status.textContent =
                twoFactorEnabled
                    ? "Enabled"
                    : "Disabled";

        }

    }


    /* =========================================================
       QUICK ACTIONS
    ========================================================= */

    function setupQuickActions() {

        document
            .getElementById(
                "quickSendEmail"
            )
            ?.addEventListener(
                "click",
                sendUserEmail
            );


        document
            .getElementById(
                "quickAuditLog"
            )
            ?.addEventListener(
                "click",
                openAuditLogs
            );


        document
            .getElementById(
                "sendVerificationBtn"
            )
            ?.addEventListener(
                "click",
                sendVerification
            );


        document
            .getElementById(
                "viewLoginLogs"
            )
            ?.addEventListener(
                "click",
                openLoginLogs
            );

    }


    async function sendUserEmail() {

        try {

            if (!API.email) {

                throw new Error(
                    "Email API endpoint is not configured."
                );

            }


            await apiRequest(
                API.email,
                "POST",
                {
                    user_id: USER_ID
                }
            );


            showToast(
                "Email Sent",
                "Email has been queued for delivery.",
                "success"
            );


        } catch (error) {

            console.error(
                "Email failed:",
                error
            );


            showToast(
                "Email Failed",
                error.message ||
                "Unable to send email.",
                "error"
            );

        }

    }


    function openAuditLogs() {

        moreMenu?.classList.remove(
            "active"
        );


        if (API.audit) {

            window.location.href =
                appendUserId(API.audit);

            return;

        }


        showToast(
            "Audit Logs",
            "Audit log URL is not configured.",
            "error"
        );

    }


    async function sendVerification() {

        moreMenu?.classList.remove(
            "active"
        );


        try {

            if (!API.verify) {

                throw new Error(
                    "Verification API endpoint is not configured."
                );

            }


            await apiRequest(
                API.verify,
                "POST",
                {
                    user_id: USER_ID
                }
            );


            showToast(
                "Verification Sent",
                "Verification email has been sent successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Verification failed:",
                error
            );


            showToast(
                "Verification Failed",
                error.message ||
                "Unable to send verification email.",
                "error"
            );

        }

    }


    function openLoginLogs() {

        if (API.loginLogs) {

            window.location.href =
                appendUserId(
                    API.loginLogs
                );

            return;

        }


        showToast(
            "Login Activity",
            "Login activity URL is not configured.",
            "error"
        );

    }


    /* =========================================================
       VENDOR
    ========================================================= */

    function setupVendorAction() {

        document
            .getElementById(
                "viewVendorBtn"
            )
            ?.addEventListener(
                "click",
                openVendor
            );

    }


    function openVendor() {

        if (API.vendor) {

            window.location.href =
                appendUserId(
                    API.vendor
                );

            return;

        }


        showToast(
            "Vendor",
            "Vendor URL is not configured.",
            "error"
        );

    }


    /* =========================================================
       DELETE USER
    ========================================================= */

    function setupDeleteAction() {

        document
            .getElementById(
                "deleteUserBtn"
            )
            ?.addEventListener(
                "click",
                deleteUser
            );

    }


    async function deleteUser() {

        moreMenu?.classList.remove(
            "active"
        );


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this user? This action cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        try {

            if (!API.delete) {

                throw new Error(
                    "Delete API endpoint is not configured."
                );

            }


            await apiRequest(
                API.delete,
                "DELETE",
                {
                    user_id: USER_ID
                }
            );


            showToast(
                "User Deleted",
                "User account has been deleted successfully.",
                "success"
            );


            /*
             * Redirect after successful deletion
             */

            setTimeout(
                function () {

                    if (
                        page?.dataset.usersUrl
                    ) {

                        window.location.href =
                            page.dataset.usersUrl;

                    } else {

                        window.history.back();

                    }

                },
                1000
            );


        } catch (error) {

            console.error(
                "Delete user failed:",
                error
            );


            showToast(
                "Delete Failed",
                error.message ||
                "Unable to delete user.",
                "error"
            );

        }

    }


    /* =========================================================
       MODAL BACKDROP
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target === passwordModal
            ) {

                closePasswordModal();

            }


            if (
                event.target === editUserModal
            ) {

                closeEditModal();

            }

        }
    );


    /* =========================================================
       ESCAPE
    ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            closePasswordModal();

            closeEditModal();

            moreMenu?.classList.remove(
                "active"
            );

        }
    );


    /* =========================================================
       TOAST
    ========================================================= */

    function showToast(
        title,
        message,
        type = "success"
    ) {

        const toast =
            document.getElementById(
                "userToast"
            );


        if (!toast) {
            return;
        }


        const toastTitle =
            document.getElementById(
                "toastTitle"
            );

        const toastMessage =
            document.getElementById(
                "toastMessage"
            );


        if (toastTitle) {

            toastTitle.textContent =
                title;

        }


        if (toastMessage) {

            toastMessage.textContent =
                message;

        }


        toast.classList.remove(
            "success",
            "error",
            "warning"
        );


        toast.classList.add(
            type
        );


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                hideToast,
                3500
            );

    }


    function hideToast() {

        document
            .getElementById(
                "userToast"
            )
            ?.classList.remove(
                "show"
            );

    }


    document
        .getElementById(
            "closeToast"
        )
        ?.addEventListener(
            "click",
            hideToast
        );


    /* =========================================================
       API REQUEST
    ========================================================= */

    async function apiRequest(
        url,
        method = "GET",
        data = null
    ) {

        const options = {

            method: method,

            headers: {

                "Accept":
                    "application/json",

                "X-CSRFToken":
                    getCSRFToken()

            },

            credentials:
                "same-origin"

        };


        if (
            data &&
            method !== "GET"
        ) {

            options.headers[
                "Content-Type"
            ] =
                "application/json";


            options.body =
                JSON.stringify(data);

        }


        const response =
            await fetch(
                url,
                options
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch (error) {

            result = null;

        }


        if (!response.ok) {

            let message =
                "Server request failed.";


            if (
                result &&
                result.message
            ) {

                message =
                    result.message;

            }


            if (
                result &&
                result.error
            ) {

                message =
                    result.error;

            }


            if (
                result &&
                result.detail
            ) {

                message =
                    result.detail;

            }


            throw new Error(
                message
            );

        }


        return result;

    }


    /* =========================================================
       CSRF TOKEN
    ========================================================= */

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


        return cookie
            ? decodeURIComponent(
                cookie.split("=")[1]
            )
            : "";

    }


    /*
     * Global helper
     */

    window.getCSRFToken =
        getCSRFToken;


    /* =========================================================
       HELPERS
    ========================================================= */

    function getInputValue(id) {

        const element =
            document.getElementById(id);


        return element
            ? element.value.trim()
            : "";

    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value ?? "-";

        }

    }


    function getInitials(name) {

        if (!name) {
            return "U";
        }


        return name
            .trim()
            .split(/\s+/)
            .map(
                word =>
                    word.charAt(0)
            )
            .slice(0, 2)
            .join("")
            .toUpperCase();

    }


    function setButtonLoading(
        button,
        loading,
        loadingText
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            button.dataset.originalHtml =
                button.innerHTML;


            button.disabled =
                true;


            button.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    ${loadingText}
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


    function appendUserId(url) {

        if (!url) {
            return "";
        }


        const separator =
            url.includes("?")
                ? "&"
                : "?";


        return (
            url +
            separator +
            "user=" +
            encodeURIComponent(USER_ID)
        );

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