/**
 * =========================================================
 * SITA PATH LAB
 * PROFILE PAGE
 * Production JavaScript
 * =========================================================
 */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const ProfileConfig = {

    api: {
        profile: "/api/profile/",
        password: "/api/profile/change-password/",
        preferences: "/api/profile/preferences/",
        avatar: "/api/profile/avatar/"
    },

    storage: {
        profile: "sitapathlab_profile",
        preferences: "sitapathlab_preferences",
        theme: "theme"
    }

};


/* =========================================================
   STATE
========================================================= */

const ProfileState = {

    editing: false,

    originalData: {},

    profile: {
        firstName: "Admin",
        lastName: "User",
        email: "admin@sitapathlab.com",
        phone: "",
        address: "",
        role: "Administrator",
        accountId: "SP-ADMIN-001"
    }

};


/* =========================================================
   DOM
========================================================= */

const DOM = {};

function cacheDOM() {

    DOM.profileForm =
        document.getElementById("profileForm");

    DOM.editProfileBtn =
        document.getElementById("editProfileBtn");

    DOM.cancelProfileBtn =
        document.getElementById("cancelProfileBtn");

    DOM.profileFormActions =
        document.getElementById("profileFormActions");

    DOM.saveProfileBtn =
        document.getElementById("saveProfileBtn");

    DOM.avatarEditBtn =
        document.getElementById("avatarEditBtn");

    DOM.avatarInput =
        document.getElementById("avatarInput");

    DOM.profileAvatar =
        document.getElementById("profileAvatar");

    DOM.profileAvatarText =
        document.getElementById("profileAvatarText");

    DOM.headerAvatar =
        document.getElementById("headerAvatar");

    DOM.headerAvatarText =
        document.getElementById("headerAvatarText");

    DOM.passwordModal =
        document.getElementById("passwordModal");

    DOM.changePasswordBtn =
        document.getElementById("changePasswordBtn");

    DOM.closePasswordModal =
        document.getElementById("closePasswordModal");

    DOM.cancelPasswordBtn =
        document.getElementById("cancelPasswordBtn");

    DOM.passwordForm =
        document.getElementById("passwordForm");

    DOM.newPassword =
        document.getElementById("newPassword");

    DOM.confirmPassword =
        document.getElementById("confirmPassword");

    DOM.passwordStrengthBar =
        document.getElementById("passwordStrengthBar");

    DOM.passwordStrengthText =
        document.getElementById("passwordStrengthText");

    DOM.twoFactorToggle =
        document.getElementById("twoFactorToggle");

    DOM.emailNotificationToggle =
        document.getElementById("emailNotificationToggle");

    DOM.activityAlertToggle =
        document.getElementById("activityAlertToggle");

    DOM.darkModeToggle =
        document.getElementById("darkModeToggle");

    DOM.loginActivityBtn =
        document.getElementById("loginActivityBtn");

    DOM.notificationBtn =
        document.getElementById("notificationBtn");

    DOM.toastContainer =
        document.getElementById("toastContainer");

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    cacheDOM();

    loadStoredProfile();

    loadPreferences();

    initializeTheme();

    bindEvents();

    renderProfile();

});


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    DOM.editProfileBtn?.addEventListener(
        "click",
        enableProfileEditing
    );


    DOM.cancelProfileBtn?.addEventListener(
        "click",
        cancelProfileEditing
    );


    DOM.profileForm?.addEventListener(
        "submit",
        handleProfileSubmit
    );


    DOM.avatarEditBtn?.addEventListener(
        "click",
        () => DOM.avatarInput?.click()
    );


    DOM.avatarInput?.addEventListener(
        "change",
        handleAvatarUpload
    );


    DOM.changePasswordBtn?.addEventListener(
        "click",
        openPasswordModal
    );


    DOM.closePasswordModal?.addEventListener(
        "click",
        closePasswordModal
    );


    DOM.cancelPasswordBtn?.addEventListener(
        "click",
        closePasswordModal
    );


    DOM.passwordForm?.addEventListener(
        "submit",
        handlePasswordChange
    );


    DOM.newPassword?.addEventListener(
        "input",
        updatePasswordStrength
    );


    DOM.twoFactorToggle?.addEventListener(
        "change",
        handlePreferenceChange
    );


    DOM.emailNotificationToggle?.addEventListener(
        "change",
        handlePreferenceChange
    );


    DOM.activityAlertToggle?.addEventListener(
        "change",
        handlePreferenceChange
    );


    DOM.darkModeToggle?.addEventListener(
        "change",
        handleThemeToggle
    );


    DOM.loginActivityBtn?.addEventListener(
        "click",
        showLoginActivity
    );


    DOM.notificationBtn?.addEventListener(
        "click",
        () => {
            showToast(
                "You have no new notifications.",
                "info"
            );
        }
    );


    document
        .querySelectorAll(".copy-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                handleCopy
            );

        });


    DOM.passwordModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === DOM.passwordModal
            ) {
                closePasswordModal();
            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !DOM.passwordModal?.hidden
            ) {
                closePasswordModal();
            }

        }
    );

}


/* =========================================================
   PROFILE RENDER
========================================================= */

function renderProfile() {

    const profile =
        ProfileState.profile;


    setValue(
        "firstName",
        profile.firstName
    );


    setValue(
        "lastName",
        profile.lastName
    );


    setValue(
        "email",
        profile.email
    );


    setValue(
        "phone",
        profile.phone
    );


    setValue(
        "address",
        profile.address
    );


    const fullName =
        `${profile.firstName} ${profile.lastName}`.trim();


    const initials =
        getInitials(fullName);


    setText(
        "profileName",
        fullName || "Admin User"
    );


    setText(
        "profileEmail",
        profile.email
    );


    setText(
        "profileRole",
        profile.role
    );


    setText(
        "headerUserName",
        fullName
    );


    setText(
        "headerUserRole",
        profile.role
    );


    setText(
        "accountId",
        profile.accountId
    );


    setText(
        "profileAvatarText",
        initials
    );


    setText(
        "headerAvatarText",
        initials
    );

}


/* =========================================================
   EDIT PROFILE
========================================================= */

function enableProfileEditing() {

    ProfileState.originalData = getFormData();

    ProfileState.editing = true;


    document
        .querySelectorAll(
            "#profileForm input, #profileForm textarea"
        )
        .forEach(field => {

            field.disabled = false;

        });


    DOM.profileFormActions.hidden = false;

    DOM.editProfileBtn.hidden = true;

    document
        .getElementById("firstName")
        ?.focus();

}


function cancelProfileEditing() {

    restoreFormData(
        ProfileState.originalData
    );

    disableProfileEditing();

    clearValidationErrors();

}


function disableProfileEditing() {

    ProfileState.editing = false;


    document
        .querySelectorAll(
            "#profileForm input, #profileForm textarea"
        )
        .forEach(field => {

            field.disabled = true;

        });


    DOM.profileFormActions.hidden = true;

    DOM.editProfileBtn.hidden = false;

}


/* =========================================================
   PROFILE SUBMIT
========================================================= */

async function handleProfileSubmit(event) {

    event.preventDefault();


    if (!validateProfileForm()) {

        showToast(
            "Please correct the highlighted fields.",
            "error"
        );

        return;
    }


    const data = getFormData();


    setButtonLoading(
        DOM.saveProfileBtn,
        true
    );


    try {

        /*
         * Production:
         * Replace this local simulation with:
         *
         * await apiRequest(
         *     ProfileConfig.api.profile,
         *     {
         *         method: "PATCH",
         *         body: JSON.stringify(data)
         *     }
         * );
         */


        await simulateRequest();


        ProfileState.profile = {
            ...ProfileState.profile,
            ...data
        };


        saveStoredProfile();

        renderProfile();

        disableProfileEditing();


        showToast(
            "Profile updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Profile update failed:",
            error
        );


        showToast(
            "Unable to update profile. Please try again.",
            "error"
        );


    } finally {

        setButtonLoading(
            DOM.saveProfileBtn,
            false
        );

    }

}


/* =========================================================
   VALIDATION
========================================================= */

function validateProfileForm() {

    clearValidationErrors();

    let valid = true;


    const firstName =
        document.getElementById("firstName");


    const lastName =
        document.getElementById("lastName");


    const email =
        document.getElementById("email");


    if (!firstName.value.trim()) {

        setFieldError(
            firstName,
            "First name is required."
        );

        valid = false;

    }


    if (!lastName.value.trim()) {

        setFieldError(
            lastName,
            "Last name is required."
        );

        valid = false;

    }


    if (
        !email.value.trim() ||
        !isValidEmail(email.value)
    ) {

        setFieldError(
            email,
            "Enter a valid email address."
        );

        valid = false;

    }


    return valid;

}


function setFieldError(
    input,
    message
) {

    input.setAttribute(
        "aria-invalid",
        "true"
    );


    const group =
        input.closest(".form-group");


    const error =
        group?.querySelector(
            ".field-error"
        );


    if (error) {
        error.textContent = message;
    }


    input.style.borderColor =
        "var(--danger)";

}


function clearValidationErrors() {

    document
        .querySelectorAll(".field-error")
        .forEach(error => {

            error.textContent = "";

        });


    document
        .querySelectorAll(
            "#profileForm input, #profileForm textarea"
        )
        .forEach(input => {

            input.removeAttribute(
                "aria-invalid"
            );

            input.style.borderColor = "";

        });

}


/* =========================================================
   FORM DATA
========================================================= */

function getFormData() {

    return {

        firstName:
            document
                .getElementById("firstName")
                .value
                .trim(),

        lastName:
            document
                .getElementById("lastName")
                .value
                .trim(),

        email:
            document
                .getElementById("email")
                .value
                .trim(),

        phone:
            document
                .getElementById("phone")
                .value
                .trim(),

        address:
            document
                .getElementById("address")
                .value
                .trim()

    };

}


function restoreFormData(data) {

    if (!data) return;


    Object.entries(data)
        .forEach(([key, value]) => {

            const element =
                document.getElementById(
                    key
                );

            if (element) {
                element.value = value || "";
            }

        });

}


/* =========================================================
   AVATAR
========================================================= */

function handleAvatarUpload(event) {

    const file =
        event.target.files?.[0];


    if (!file) return;


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        showToast(
            "Please select a JPG, PNG or WebP image.",
            "error"
        );

        return;

    }


    const maxSize =
        2 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast(
            "Profile image must be under 2 MB.",
            "error"
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload = event => {

        const image =
            document.createElement("img");


        image.src =
            event.target.result;


        DOM.profileAvatar
            .replaceChildren(image);


        localStorage.setItem(
            "sitapathlab_avatar",
            event.target.result
        );


        showToast(
            "Profile photo updated.",
            "success"
        );

    };


    reader.readAsDataURL(file);

}


/* =========================================================
   PASSWORD
========================================================= */

function openPasswordModal() {

    DOM.passwordModal.hidden = false;

    document
        .getElementById("currentPassword")
        ?.focus();

}


function closePasswordModal() {

    DOM.passwordModal.hidden = true;

    DOM.passwordForm?.reset();

    if (DOM.passwordStrengthBar) {

        DOM.passwordStrengthBar.style.width =
            "0%";

    }

    if (DOM.passwordStrengthText) {

        DOM.passwordStrengthText.textContent =
            "Minimum 8 characters";

    }

}


function updatePasswordStrength() {

    const password =
        DOM.newPassword.value;


    let score = 0;


    if (password.length >= 8) {
        score++;
    }


    if (password.length >= 12) {
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


    const percentage =
        Math.min(
            100,
            score * 20
        );


    DOM.passwordStrengthBar.style.width =
        `${percentage}%`;


    const labels = [
        "Very weak",
        "Weak",
        "Fair",
        "Good",
        "Strong",
        "Very strong"
    ];


    DOM.passwordStrengthText.textContent =
        labels[score];

}


async function handlePasswordChange(event) {

    event.preventDefault();


    const current =
        document.getElementById(
            "currentPassword"
        ).value;


    const newPassword =
        DOM.newPassword.value;


    const confirm =
        DOM.confirmPassword.value;


    if (!current) {

        showToast(
            "Enter your current password.",
            "error"
        );

        return;

    }


    if (newPassword.length < 8) {

        showToast(
            "New password must contain at least 8 characters.",
            "error"
        );

        return;

    }


    if (newPassword !== confirm) {

        showToast(
            "Passwords do not match.",
            "error"
        );

        return;

    }


    try {

        await simulateRequest();


        closePasswordModal();


        showToast(
            "Password changed successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);


        showToast(
            "Unable to change password.",
            "error"
        );

    }

}


/* =========================================================
   PREFERENCES
========================================================= */

function loadPreferences() {

    const stored =
        localStorage.getItem(
            ProfileConfig.storage.preferences
        );


    if (!stored) return;


    try {

        const preferences =
            JSON.parse(stored);


        if (
            DOM.twoFactorToggle &&
            typeof preferences.twoFactor === "boolean"
        ) {
            DOM.twoFactorToggle.checked =
                preferences.twoFactor;
        }


        if (
            DOM.emailNotificationToggle &&
            typeof preferences.emailNotifications === "boolean"
        ) {
            DOM.emailNotificationToggle.checked =
                preferences.emailNotifications;
        }


        if (
            DOM.activityAlertToggle &&
            typeof preferences.activityAlerts === "boolean"
        ) {
            DOM.activityAlertToggle.checked =
                preferences.activityAlerts;
        }

    } catch (error) {

        console.warn(
            "Invalid preference data.",
            error
        );

    }

}


function savePreferences() {

    const preferences = {

        twoFactor:
            DOM.twoFactorToggle?.checked ?? false,

        emailNotifications:
            DOM.emailNotificationToggle?.checked ?? false,

        activityAlerts:
            DOM.activityAlertToggle?.checked ?? false

    };


    localStorage.setItem(
        ProfileConfig.storage.preferences,
        JSON.stringify(preferences)
    );

}


function handlePreferenceChange(event) {

    savePreferences();


    const name =
        event.target.id;


    const labelMap = {

        twoFactorToggle:
            "Two-factor authentication",

        emailNotificationToggle:
            "Email notifications",

        activityAlertToggle:
            "Activity alerts"

    };


    showToast(
        `${labelMap[name] || "Preference"} ${
            event.target.checked
                ? "enabled"
                : "disabled"
        }.`,
        "success"
    );


    /*
     * Production API:
     *
     * apiRequest(
     *     ProfileConfig.api.preferences,
     *     {
     *         method: "PATCH",
     *         body: JSON.stringify(...)
     *     }
     * );
     */

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const theme =
        localStorage.getItem(
            ProfileConfig.storage.theme
        );


    if (theme === "dark") {

        document.body.classList.add("dark");

        if (DOM.darkModeToggle) {
            DOM.darkModeToggle.checked = true;
        }

    }

}


function handleThemeToggle(event) {

    const dark =
        event.target.checked;


    document.body.classList.toggle(
        "dark",
        dark
    );


    localStorage.setItem(
        ProfileConfig.storage.theme,
        dark ? "dark" : "light"
    );


    showToast(
        `${dark ? "Dark" : "Light"} mode enabled.`,
        "success"
    );

}


/* =========================================================
   LOGIN ACTIVITY
========================================================= */

function showLoginActivity() {

    showToast(
        "Opening recent login activity...",
        "info"
    );


    /*
     * Production:
     *
     * window.location.href =
     *     "/superadmin/activity-logs/";
     */

}


/* =========================================================
   COPY
========================================================= */

async function handleCopy(event) {

    const targetId =
        event.currentTarget.dataset.copyTarget;


    const target =
        document.getElementById(targetId);


    if (!target) return;


    try {

        await navigator.clipboard.writeText(
            target.textContent.trim()
        );


        showToast(
            "Copied to clipboard.",
            "success"
        );

    } catch (error) {

        console.error(error);


        showToast(
            "Unable to copy.",
            "error"
        );

    }

}


/* =========================================================
   STORAGE
========================================================= */

function loadStoredProfile() {

    const stored =
        localStorage.getItem(
            ProfileConfig.storage.profile
        );


    if (!stored) return;


    try {

        const data =
            JSON.parse(stored);


        ProfileState.profile = {
            ...ProfileState.profile,
            ...data
        };

    } catch (error) {

        console.warn(
            "Invalid stored profile.",
            error
        );

    }


    const avatar =
        localStorage.getItem(
            "sitapathlab_avatar"
        );


    if (avatar) {

        const image =
            document.createElement("img");


        image.src = avatar;


        DOM.profileAvatar
            ?.replaceChildren(image);

    }

}


function saveStoredProfile() {

    localStorage.setItem(
        ProfileConfig.storage.profile,
        JSON.stringify(
            ProfileState.profile
        )
    );

}


/* =========================================================
   HELPERS
========================================================= */

function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.value = value || "";
    }

}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent = value || "";
    }

}


function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0).toUpperCase()
        )
        .join("");

}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function setButtonLoading(
    button,
    loading
) {

    if (!button) return;


    const text =
        button.querySelector(
            ".btn-text"
        );


    const loader =
        button.querySelector(
            ".btn-loader"
        );


    button.disabled = loading;


    if (text) {
        text.hidden = loading;
    }


    if (loader) {
        loader.hidden = !loading;
    }


    if (
        loading &&
        !loader
    ) {
        button.textContent =
            "Saving...";
    }

}


function showToast(
    message,
    type = "info"
) {

    if (!DOM.toastContainer) return;


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    DOM.toastContainer
        .appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateY(8px)";

        toast.style.transition =
            "200ms ease";

        setTimeout(
            () => toast.remove(),
            220
        );

    }, 3000);

}


function simulateRequest() {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            700
        );

    });

}


/* =========================================================
   API HELPER
   Django CSRF compatible
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const csrfToken =
        getCSRFToken();


    const defaultHeaders = {

        "Content-Type":
            "application/json",

        "X-CSRFToken":
            csrfToken

    };


    const response =
        await fetch(
            url,
            {
                credentials: "same-origin",

                ...options,

                headers: {
                    ...defaultHeaders,
                    ...(options.headers || {})
                }
            }
        );


    if (!response.ok) {

        let errorData = null;

        try {
            errorData =
                await response.json();
        } catch {
            // Ignore invalid JSON.
        }


        throw new Error(
            errorData?.message ||
            `Request failed: ${response.status}`
        );

    }


    const contentType =
        response.headers.get(
            "content-type"
        );


    if (
        contentType?.includes(
            "application/json"
        )
    ) {

        return response.json();

    }


    return response.text();

}


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