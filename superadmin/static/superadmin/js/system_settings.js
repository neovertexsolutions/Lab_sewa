/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * SYSTEM SETTINGS CONTROLLER
 * ============================================================
 */

"use strict";


/* ============================================================
   STATE
============================================================ */

let originalSettings = {};
let hasUnsavedChanges = false;


/* ============================================================
   DOM
============================================================ */

const saveButton =
    document.getElementById("saveSettingsBtn");

const resetButton =
    document.getElementById("resetSettingsBtn");

const bottomSaveButton =
    document.getElementById("bottomSaveBtn");

const bottomResetButton =
    document.getElementById("bottomResetBtn");

const saveState =
    document.getElementById("saveState");

const confirmModal =
    document.getElementById("confirmModal");


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();

    setupChangeTracking();

    setupMaintenanceMode();

    setupResetActions();

    captureInitialSettings();

    updateSaveState(false);

});


/* ============================================================
   SETTINGS NAVIGATION
============================================================ */

function setupNavigation() {

    const navigationItems =
        document.querySelectorAll(
            ".settings-nav-item"
        );


    navigationItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const section =
                    item.dataset.section;

                if (!section) return;

                switchSection(
                    section
                );

            }
        );

    });

}


function switchSection(sectionName) {

    document
        .querySelectorAll(".settings-nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section === sectionName
            );

        });


    document
        .querySelectorAll(".settings-section")
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id ===
                `section-${sectionName}`
            );

        });


    /*
     * Update URL hash without reload.
     */

    if (
        window.history &&
        window.history.replaceState
    ) {

        window.history.replaceState(
            null,
            "",
            `#${sectionName}`
        );

    }

}


/* ============================================================
   CHANGE TRACKING
============================================================ */

function setupChangeTracking() {

    const fields =
        document.querySelectorAll(
            "input, select, textarea"
        );


    fields.forEach(field => {

        field.addEventListener(
            "input",
            markAsChanged
        );

        field.addEventListener(
            "change",
            markAsChanged
        );

    });

}


function markAsChanged() {

    hasUnsavedChanges = true;

    updateSaveState(true);

}


function updateSaveState(unsaved) {

    if (!saveState) return;


    if (unsaved) {

        saveState.classList.add(
            "unsaved"
        );

        saveState.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i>
            Unsaved changes
        `;

        const bottomText =
            document.getElementById(
                "bottomSaveText"
            );

        if (bottomText) {

            bottomText.textContent =
                "You have unsaved configuration changes.";

        }

    } else {

        saveState.classList.remove(
            "unsaved"
        );

        saveState.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            All changes saved
        `;

        const bottomText =
            document.getElementById(
                "bottomSaveText"
            );

        if (bottomText) {

            bottomText.textContent =
                "Configuration is up to date.";

        }

    }

}


/* ============================================================
   CAPTURE SETTINGS
============================================================ */

function captureInitialSettings() {

    originalSettings =
        collectSettings();

}


function collectSettings() {

    return {

        systemName:
            valueOf("systemName"),

        systemShortName:
            valueOf("systemShortName"),

        systemDescription:
            valueOf("systemDescription"),

        applicationUrl:
            valueOf("applicationUrl"),

        supportEmail:
            valueOf("supportEmail"),

        supportPhone:
            valueOf("supportPhone"),

        labCode:
            valueOf("labCode"),

        invoicePrefix:
            valueOf("invoicePrefix"),

        patientPrefix:
            valueOf("patientPrefix"),

        samplePrefix:
            valueOf("samplePrefix"),

        openingTime:
            valueOf("openingTime"),

        closingTime:
            valueOf("closingTime"),

        timezone:
            valueOf("timezone"),

        language:
            valueOf("language"),

        currency:
            valueOf("currency"),

        dateFormat:
            valueOf("dateFormat"),

        allowVendorRegistration:
            checkedOf(
                "allowVendorRegistration"
            ),

        requireEmailVerification:
            checkedOf(
                "requireEmailVerification"
            ),

        autoInvoice:
            checkedOf("autoInvoice"),

        forceHttps:
            checkedOf("forceHttps"),

        emailNotifications:
            checkedOf(
                "emailNotifications"
            ),

        paymentAlerts:
            checkedOf(
                "paymentAlerts"
            ),

        licenseExpiryAlerts:
            checkedOf(
                "licenseExpiryAlerts"
            ),

        supportAlerts:
            checkedOf(
                "supportAlerts"
            ),

        auditRetention:
            valueOf("auditRetention"),

        activityRetention:
            valueOf("activityRetention"),

        backupRetention:
            valueOf("backupRetention"),

        autoBackup:
            valueOf("autoBackup"),

        maintenanceMode:
            checkedOf(
                "maintenanceMode"
            ),

        maintenanceMessage:
            valueOf(
                "maintenanceMessage"
            )

    };

}


/* ============================================================
   SAVE
============================================================ */

async function saveSettings() {

    const settings =
        collectSettings();


    if (!validateSettings(settings)) {
        return;
    }


    setSaveButtonsLoading(true);


    try {

        /*
         * =====================================================
         * PRODUCTION API
         *
         * Replace this simulated section with:
         *
         * fetch("/superadmin/api/settings/", {
         *     method: "PATCH",
         *     headers: {
         *         "Content-Type": "application/json",
         *         "X-CSRFToken": getCSRFToken()
         *     },
         *     body: JSON.stringify(settings)
         * })
         *
         * =====================================================
         */


        await fakeRequest();


        originalSettings =
            JSON.parse(
                JSON.stringify(settings)
            );


        hasUnsavedChanges = false;

        updateSaveState(false);


        showToast(
            "System configuration saved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Settings save error:",
            error
        );


        showToast(
            "Unable to save settings. Please try again.",
            "error"
        );

    } finally {

        setSaveButtonsLoading(false);

    }

}


/* ============================================================
   VALIDATION
============================================================ */

function validateSettings(settings) {

    if (
        !settings.systemName ||
        settings.systemName.length < 2
    ) {

        showToast(
            "Please enter a valid system name.",
            "warning"
        );

        focusField(
            "systemName"
        );

        return false;

    }


    if (
        settings.supportEmail &&
        !isValidEmail(
            settings.supportEmail
        )
    ) {

        showToast(
            "Please enter a valid support email.",
            "warning"
        );

        focusField(
            "supportEmail"
        );

        return false;

    }


    if (
        settings.openingTime &&
        settings.closingTime &&
        settings.openingTime >=
        settings.closingTime
    ) {

        showToast(
            "Closing time must be later than opening time.",
            "warning"
        );

        focusField(
            "closingTime"
        );

        return false;

    }


    if (
        settings.applicationUrl &&
        !isValidURL(
            settings.applicationUrl
        )
    ) {

        showToast(
            "Please enter a valid application URL.",
            "warning"
        );

        focusField(
            "applicationUrl"
        );

        return false;

    }


    return true;

}


/* ============================================================
   RESET
============================================================ */

function setupResetActions() {

    resetButton?.addEventListener(
        "click",
        requestReset
    );

    bottomResetButton?.addEventListener(
        "click",
        requestReset
    );


    document
        .getElementById("cancelResetBtn")
        ?.addEventListener(
            "click",
            closeResetModal
        );


    document
        .getElementById("confirmResetBtn")
        ?.addEventListener(
            "click",
            resetSettings
        );


    saveButton?.addEventListener(
        "click",
        saveSettings
    );


    bottomSaveButton?.addEventListener(
        "click",
        saveSettings
    );

}


function requestReset() {

    if (!hasUnsavedChanges) {

        showToast(
            "There are no unsaved changes.",
            "info"
        );

        return;

    }


    confirmModal?.classList.add(
        "active"
    );

}


function closeResetModal() {

    confirmModal?.classList.remove(
        "active"
    );

}


function resetSettings() {

    applySettings(
        originalSettings
    );


    hasUnsavedChanges = false;

    updateSaveState(false);

    closeResetModal();


    showToast(
        "Unsaved changes discarded.",
        "success"
    );

}


/* ============================================================
   APPLY SETTINGS
============================================================ */

function applySettings(settings) {

    setValue(
        "systemName",
        settings.systemName
    );

    setValue(
        "systemShortName",
        settings.systemShortName
    );

    setValue(
        "systemDescription",
        settings.systemDescription
    );

    setValue(
        "applicationUrl",
        settings.applicationUrl
    );

    setValue(
        "supportEmail",
        settings.supportEmail
    );

    setValue(
        "supportPhone",
        settings.supportPhone
    );

    setValue(
        "labCode",
        settings.labCode
    );

    setValue(
        "invoicePrefix",
        settings.invoicePrefix
    );

    setValue(
        "patientPrefix",
        settings.patientPrefix
    );

    setValue(
        "samplePrefix",
        settings.samplePrefix
    );

    setValue(
        "openingTime",
        settings.openingTime
    );

    setValue(
        "closingTime",
        settings.closingTime
    );

    setValue(
        "timezone",
        settings.timezone
    );

    setValue(
        "language",
        settings.language
    );

    setValue(
        "currency",
        settings.currency
    );

    setValue(
        "dateFormat",
        settings.dateFormat
    );


    setChecked(
        "allowVendorRegistration",
        settings.allowVendorRegistration
    );

    setChecked(
        "requireEmailVerification",
        settings.requireEmailVerification
    );

    setChecked(
        "autoInvoice",
        settings.autoInvoice
    );

    setChecked(
        "forceHttps",
        settings.forceHttps
    );

    setChecked(
        "emailNotifications",
        settings.emailNotifications
    );

    setChecked(
        "paymentAlerts",
        settings.paymentAlerts
    );

    setChecked(
        "licenseExpiryAlerts",
        settings.licenseExpiryAlerts
    );

    setChecked(
        "supportAlerts",
        settings.supportAlerts
    );


    setValue(
        "auditRetention",
        settings.auditRetention
    );

    setValue(
        "activityRetention",
        settings.activityRetention
    );

    setValue(
        "backupRetention",
        settings.backupRetention
    );

    setValue(
        "autoBackup",
        settings.autoBackup
    );


    setChecked(
        "maintenanceMode",
        settings.maintenanceMode
    );

    setValue(
        "maintenanceMessage",
        settings.maintenanceMessage
    );


    updateMaintenanceUI(
        settings.maintenanceMode
    );

}


/* ============================================================
   MAINTENANCE MODE
============================================================ */

function setupMaintenanceMode() {

    const maintenanceToggle =
        document.getElementById(
            "maintenanceMode"
        );


    maintenanceToggle?.addEventListener(
        "change",
        event => {

            updateMaintenanceUI(
                event.target.checked
            );

            markAsChanged();

        }
    );

}


function updateMaintenanceUI(enabled) {

    const status =
        document.getElementById(
            "maintenanceStatus"
        );

    const icon =
        document.querySelector(
            ".maintenance-icon"
        );


    if (!status) return;


    if (enabled) {

        status.textContent =
            "Maintenance Mode Active";

        status.style.color =
            "#dc2626";


        if (icon) {

            icon.style.background =
                "#fef2f2";

            icon.style.color =
                "#dc2626";

        }

    } else {

        status.textContent =
            "System Online";

        status.style.color =
            "#15803d";


        if (icon) {

            icon.style.background =
                "#f0fdf4";

            icon.style.color =
                "#16a34a";

        }

    }

}


/* ============================================================
   BUTTON LOADING
============================================================ */

function setSaveButtonsLoading(loading) {

    const buttons = [
        saveButton,
        bottomSaveButton
    ];


    buttons.forEach(button => {

        if (!button) return;


        if (loading) {

            button.disabled = true;

            button.dataset.originalHTML =
                button.innerHTML;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

        } else {

            button.disabled = false;

            if (
                button.dataset.originalHTML
            ) {

                button.innerHTML =
                    button.dataset.originalHTML;

            }

        }

    });

}


/* ============================================================
   BEFORE UNLOAD
============================================================ */

window.addEventListener(
    "beforeunload",
    event => {

        if (!hasUnsavedChanges) {
            return;
        }

        event.preventDefault();

        event.returnValue = "";

    }
);


/* ============================================================
   HELPERS
============================================================ */

function valueOf(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value
        : "";

}


function checkedOf(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.checked
        : false;

}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value ?? "";

    }

}


function setChecked(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.checked =
            Boolean(value);

    }

}


function focusField(id) {

    const element =
        document.getElementById(id);

    element?.focus();

}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function isValidURL(url) {

    try {

        new URL(url);

        return true;

    } catch {

        return false;

    }

}


/* ============================================================
   CSRF
============================================================ */

function getCSRFToken() {

    const cookie =
        document.cookie
            .split("; ")
            .find(row =>
                row.startsWith("csrftoken=")
            );


    if (!cookie) return "";


    return decodeURIComponent(
        cookie.split("=")[1]
    );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "settingsToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "settingsToastContainer";

        container.style.position =
            "fixed";

        container.style.right =
            "22px";

        container.style.bottom =
            "22px";

        container.style.zIndex =
            "11000";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "9px";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");


    const borderColor =
        type === "error"
            ? "#ef4444"
            : type === "warning"
                ? "#f59e0b"
                : type === "info"
                    ? "#3b82f6"
                    : "#22c55e";


    toast.style.minWidth =
        "290px";

    toast.style.padding =
        "13px 16px";

    toast.style.borderRadius =
        "10px";

    toast.style.background =
        "#0f172a";

    toast.style.color =
        "#ffffff";

    toast.style.borderLeft =
        `4px solid ${borderColor}`;

    toast.style.fontSize =
        "12px";

    toast.style.fontWeight =
        "700";

    toast.style.boxShadow =
        "0 12px 30px rgba(0,0,0,.18)";

    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateY(8px)";

        toast.style.transition =
            "all .2s ease";


        setTimeout(
            () => toast.remove(),
            220
        );

    }, 3000);

}


/* ============================================================
   SIMULATED REQUEST
   Remove when Django API is connected.
============================================================ */

function fakeRequest() {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                650
            );

        }
    );

}