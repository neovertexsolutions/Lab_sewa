/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN — LICENSE CREATE
 * Production License Provisioning
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       DOM
       ===================================================== */

    const form = document.getElementById("licenseCreateForm");

    const vendor = document.getElementById("vendor");
    const subscription = document.getElementById("subscription");
    const plan = document.getElementById("plan");

    const licenseKey = document.getElementById("licenseKey");
    const generateKeyBtn = document.getElementById("generateKeyBtn");
    const copyKeyBtn = document.getElementById("copyKeyBtn");

    const licenseType = document.getElementById("licenseType");
    const status = document.getElementById("status");

    const startDate = document.getElementById("startDate");
    const duration = document.getElementById("duration");
    const expiryDate = document.getElementById("expiryDate");

    const customDurationBox =
        document.getElementById("customDurationBox");

    const customExpiryDate =
        document.getElementById("customExpiryDate");

    const maxUsers =
        document.getElementById("maxUsers");

    const notes =
        document.getElementById("notes");

    const noteCounter =
        document.getElementById("noteCounter");

    const previewBtn =
        document.getElementById("previewBtn");

    const previewModal =
        document.getElementById("previewModal");

    const closePreviewModal =
        document.getElementById("closePreviewModal");

    const cancelPreview =
        document.getElementById("cancelPreview");

    const confirmPreview =
        document.getElementById("confirmPreview");

    const createLicenseBtn =
        document.getElementById("createLicenseBtn");

    const alertBox =
        document.getElementById("licenseAlert");

    const alertMessage =
        document.getElementById("licenseAlertMessage");

    const closeAlert =
        document.getElementById("closeAlert");


    /* =====================================================
       PREVIEW DOM
       ===================================================== */

    const previewKey =
        document.getElementById("previewKey");

    const previewVendor =
        document.getElementById("previewVendor");

    const previewPlan =
        document.getElementById("previewPlan");

    const previewStart =
        document.getElementById("previewStart");

    const previewExpiry =
        document.getElementById("previewExpiry");

    const previewUsers =
        document.getElementById("previewUsers");

    const previewStatus =
        document.getElementById("previewStatus");

    const moduleTags =
        document.getElementById("moduleTags");

    const moduleCount =
        document.getElementById("moduleCount");

    /* Checklist */

    const checkVendor =
        document.getElementById("checkVendor");

    const checkKey =
        document.getElementById("checkKey");

    const checkValidity =
        document.getElementById("checkValidity");

    const checkModules =
        document.getElementById("checkModules");


    /* Modal */

    const modalLicenseKey =
        document.getElementById("modalLicenseKey");

    const modalVendor =
        document.getElementById("modalVendor");

    const modalSubscription =
        document.getElementById("modalSubscription");

    const modalPlan =
        document.getElementById("modalPlan");

    const modalStatus =
        document.getElementById("modalStatus");

    const modalStart =
        document.getElementById("modalStart");

    const modalExpiry =
        document.getElementById("modalExpiry");


    /* =====================================================
       HELPERS
       ===================================================== */

    function pad(value) {
        return String(value).padStart(2, "0");
    }


    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }

        const date = new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function todayISO() {

        const date = new Date();

        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join("-");
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       ALERT
       ===================================================== */

    function showAlert(message) {

        if (!alertBox || !alertMessage) {
            return;
        }

        alertMessage.textContent = message;

        alertBox.classList.add("show");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function hideAlert() {

        if (!alertBox) {
            return;
        }

        alertBox.classList.remove("show");
    }


    if (closeAlert) {

        closeAlert.addEventListener("click", hideAlert);

    }


    /* =====================================================
       DEFAULT START DATE
       ===================================================== */

    if (startDate && !startDate.value) {
        startDate.value = todayISO();
    }


    /* =====================================================
       LICENSE KEY GENERATOR
       ===================================================== */

    function randomCharacters(length) {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        let result = "";

        const randomArray =
            new Uint32Array(length);

        crypto.getRandomValues(randomArray);

        for (let i = 0; i < length; i++) {

            result +=
                characters[
                    randomArray[i] % characters.length
                ];

        }

        return result;
    }


    function generateLicenseKey() {

        /*
         * This is only a UI-side identifier generator.
         *
         * Production security:
         * Generate the authoritative license key/token
         * on Django backend using secrets/token generation.
         */

        return [
            "SPL",
            randomCharacters(5),
            randomCharacters(5),
            randomCharacters(5),
            randomCharacters(5)
        ].join("-");
    }


    function generateKey() {

        if (!licenseKey) {
            return;
        }

        licenseKey.value =
            generateLicenseKey();

        updatePreview();
        updateChecklist();
    }


    if (generateKeyBtn) {

        generateKeyBtn.addEventListener(
            "click",
            generateKey
        );

    }


    /* =====================================================
       COPY KEY
       ===================================================== */

    if (copyKeyBtn) {

        copyKeyBtn.addEventListener(
            "click",
            async () => {

                const value =
                    licenseKey?.value?.trim();

                if (!value) {

                    showAlert(
                        "Generate a license key before copying."
                    );

                    return;
                }

                try {

                    await navigator.clipboard.writeText(value);

                    const original =
                        copyKeyBtn.innerHTML;

                    copyKeyBtn.innerHTML =
                        '<i class="fa-solid fa-check"></i>';

                    copyKeyBtn.title =
                        "Copied";

                    setTimeout(() => {

                        copyKeyBtn.innerHTML =
                            original;

                        copyKeyBtn.title =
                            "Copy license key";

                    }, 1400);

                } catch (error) {

                    showAlert(
                        "Unable to copy the license key."
                    );

                }

            }
        );

    }


    /* =====================================================
       PLAN AUTO CONFIGURATION
       ===================================================== */

    if (plan) {

        plan.addEventListener("change", () => {

            const selected =
                plan.options[plan.selectedIndex];

            if (!selected) {
                return;
            }

            const planDuration =
                selected.dataset.duration;

            const planUsers =
                selected.dataset.users;

            if (
                planDuration &&
                duration &&
                [...duration.options].some(
                    option => option.value === planDuration
                )
            ) {

                duration.value =
                    planDuration;

            }

            if (
                planUsers &&
                maxUsers &&
                Number(planUsers) > 0
            ) {

                maxUsers.value =
                    planUsers;

            }

            calculateExpiry();

            updatePreview();
            updateChecklist();

        });

    }


    /* =====================================================
       EXPIRY CALCULATION
       ===================================================== */

    function calculateExpiry() {

        if (
            !startDate ||
            !duration ||
            !expiryDate
        ) {
            return;
        }

        const startValue =
            startDate.value;

        const selectedDuration =
            duration.value;

        if (!startValue) {

            expiryDate.value = "";

            return;
        }

        if (
            selectedDuration === "custom"
        ) {

            customDurationBox.hidden = false;

            expiryDate.value =
                customExpiryDate?.value || "";

            return;
        }

        customDurationBox.hidden = true;

        if (
            selectedDuration === "lifetime"
        ) {

            expiryDate.value = "";

            return;
        }

        const days =
            Number(selectedDuration);

        if (!Number.isFinite(days)) {
            expiryDate.value = "";
            return;
        }

        const date =
            new Date(`${startValue}T00:00:00`);

        date.setDate(
            date.getDate() + days
        );

        expiryDate.value = [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join("-");
    }


    if (startDate) {

        startDate.addEventListener(
            "change",
            () => {

                calculateExpiry();
                updatePreview();
                updateChecklist();

            }
        );

    }


    if (duration) {

        duration.addEventListener(
            "change",
            () => {

                calculateExpiry();
                updatePreview();
                updateChecklist();

            }
        );

    }


    if (customExpiryDate) {

        customExpiryDate.addEventListener(
            "change",
            () => {

                if (
                    duration.value === "custom"
                ) {

                    expiryDate.value =
                        customExpiryDate.value;

                }

                updatePreview();
                updateChecklist();

            }
        );

    }


    /* =====================================================
       STATUS
       ===================================================== */

    function updateStatusPreview() {

        if (!status || !previewStatus) {
            return;
        }

        const selected =
            status.options[
                status.selectedIndex
            ];

        const value =
            selected?.value || "active";

        previewStatus.textContent =
            value.toUpperCase();

        previewStatus.className =
            "preview-status";

        if (value === "active") {

            previewStatus.style.color =
                "#159447";

            previewStatus.style.background =
                "#eaf8f0";

        } else if (value === "pending") {

            previewStatus.style.color =
                "#b45309";

            previewStatus.style.background =
                "#fff7e8";

        } else {

            previewStatus.style.color =
                "#dc2626";

            previewStatus.style.background =
                "#fff0f0";
        }

    }


    if (status) {

        status.addEventListener(
            "change",
            updateStatusPreview
        );

    }


    /* =====================================================
       MODULES
       ===================================================== */

    function getSelectedModules() {

        return Array.from(
            document.querySelectorAll(
                'input[name="modules"]:checked'
            )
        );

    }


    function updateModules() {

        const selected =
            getSelectedModules();

        if (moduleCount) {

            moduleCount.textContent =
                selected.length;

        }

        if (!moduleTags) {
            return;
        }

        if (!selected.length) {

            moduleTags.innerHTML =
                '<span class="empty-module">' +
                'No modules selected' +
                '</span>';

            return;
        }

        moduleTags.innerHTML =
            selected.map(input => {

                const label =
                    input
                        .closest(".module-option")
                        ?.querySelector(
                            ".module-content strong"
                        )
                        ?.textContent
                        ?.trim() ||
                    input.value;

                return `
                    <span class="module-tag">
                        ${escapeHTML(label)}
                    </span>
                `;

            }).join("");

    }


    document
        .querySelectorAll(
            'input[name="modules"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    updateModules();
                    updateChecklist();

                }
            );

        });


    /* =====================================================
       NOTES COUNTER
       ===================================================== */

    if (notes && noteCounter) {

        function updateNoteCounter() {

            noteCounter.textContent =
                notes.value.length;

        }

        notes.addEventListener(
            "input",
            updateNoteCounter
        );

        updateNoteCounter();

    }


    /* =====================================================
       PREVIEW
       ===================================================== */

    function getSelectedText(select) {

        if (!select) {
            return "—";
        }

        const option =
            select.options[
                select.selectedIndex
            ];

        if (
            !option ||
            !option.value
        ) {
            return "Not selected";
        }

        return option.textContent.trim();

    }


    function updatePreview() {

        if (previewKey) {

            previewKey.textContent =
                licenseKey?.value ||
                "Not generated";

        }

        if (previewVendor) {

            previewVendor.textContent =
                getSelectedText(vendor);

        }

        if (previewPlan) {

            previewPlan.textContent =
                getSelectedText(plan);

        }

        if (previewStart) {

            previewStart.textContent =
                formatDate(
                    startDate?.value
                );

        }

        if (previewExpiry) {

            if (
                duration?.value === "lifetime"
            ) {

                previewExpiry.textContent =
                    "Lifetime";

            } else {

                previewExpiry.textContent =
                    formatDate(
                        expiryDate?.value
                    );

            }

        }

        if (previewUsers) {

            previewUsers.textContent =
                maxUsers?.value || "0";

        }

        updateModules();
        updateStatusPreview();

    }


    [
        vendor,
        subscription,
        plan,
        maxUsers
    ]
        .filter(Boolean)
        .forEach(element => {

            element.addEventListener(
                "change",
                updatePreview
            );

            element.addEventListener(
                "input",
                updatePreview
            );

        });


    /* =====================================================
       CHECKLIST
       ===================================================== */

    function markComplete(element, complete) {

        if (!element) {
            return;
        }

        element.classList.toggle(
            "complete",
            complete
        );

        const icon =
            element.querySelector(
                "span i"
            );

        if (!icon) {
            return;
        }

        icon.className =
            complete
                ? "fa-solid fa-circle-check"
                : "fa-solid fa-circle";

    }


    function updateChecklist() {

        const vendorValid =
            Boolean(vendor?.value);

        const keyValid =
            Boolean(
                licenseKey?.value?.trim()
            );

        let validityValid =
            Boolean(startDate?.value);

        if (
            duration?.value === "custom"
        ) {

            validityValid =
                validityValid &&
                Boolean(
                    customExpiryDate?.value
                );

        } else if (
            duration?.value !== "lifetime"
        ) {

            validityValid =
                validityValid &&
                Boolean(
                    expiryDate?.value
                );

        }

        const modulesValid =
            getSelectedModules().length > 0;

        markComplete(
            checkVendor,
            vendorValid
        );

        markComplete(
            checkKey,
            keyValid
        );

        markComplete(
            checkValidity,
            validityValid
        );

        markComplete(
            checkModules,
            modulesValid
        );

    }


    /* =====================================================
       MODAL
       ===================================================== */

    function openPreview() {

        updatePreview();

        if (modalLicenseKey) {

            modalLicenseKey.textContent =
                licenseKey?.value ||
                "Not generated";

        }

        if (modalVendor) {

            modalVendor.textContent =
                getSelectedText(vendor);

        }

        if (modalSubscription) {

            modalSubscription.textContent =
                getSelectedText(subscription);

        }

        if (modalPlan) {

            modalPlan.textContent =
                getSelectedText(plan);

        }

        if (modalStatus) {

            modalStatus.textContent =
                getSelectedText(status);

        }

        if (modalStart) {

            modalStart.textContent =
                formatDate(
                    startDate?.value
                );

        }

        if (modalExpiry) {

            modalExpiry.textContent =
                duration?.value === "lifetime"
                    ? "Lifetime"
                    : formatDate(
                        expiryDate?.value
                    );

        }

        previewModal.hidden = false;

        document.body.style.overflow =
            "hidden";

    }


    function closePreview() {

        previewModal.hidden = true;

        document.body.style.overflow =
            "";

    }


    if (previewBtn) {

        previewBtn.addEventListener(
            "click",
            openPreview
        );

    }


    if (closePreviewModal) {

        closePreviewModal.addEventListener(
            "click",
            closePreview
        );

    }


    if (cancelPreview) {

        cancelPreview.addEventListener(
            "click",
            closePreview
        );

    }


    if (confirmPreview) {

        confirmPreview.addEventListener(
            "click",
            closePreview
        );

    }


    if (previewModal) {

        previewModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === previewModal
                ) {

                    closePreview();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                previewModal &&
                !previewModal.hidden
            ) {

                closePreview();

            }

        }
    );


    /* =====================================================
       FORM VALIDATION
       ===================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            event => {

                hideAlert();

                const vendorValue =
                    vendor?.value;

                const keyValue =
                    licenseKey?.value?.trim();

                const startValue =
                    startDate?.value;

                const durationValue =
                    duration?.value;

                if (!vendorValue) {

                    event.preventDefault();

                    showAlert(
                        "Please select a vendor."
                    );

                    vendor?.focus();

                    return;
                }


                if (!keyValue) {

                    event.preventDefault();

                    showAlert(
                        "Please generate a license key."
                    );

                    generateKeyBtn?.focus();

                    return;
                }


                if (!startValue) {

                    event.preventDefault();

                    showAlert(
                        "Please select a license start date."
                    );

                    startDate?.focus();

                    return;
                }


                if (
                    durationValue === "custom" &&
                    !customExpiryDate?.value
                ) {

                    event.preventDefault();

                    showAlert(
                        "Please select a custom expiry date."
                    );

                    customExpiryDate?.focus();

                    return;
                }


                const selectedModules =
                    getSelectedModules();

                if (!selectedModules.length) {

                    event.preventDefault();

                    showAlert(
                        "Please enable at least one module."
                    );

                    return;
                }


                if (
                    maxUsers &&
                    (
                        Number(maxUsers.value) < 1 ||
                        Number(maxUsers.value) > 10000
                    )
                ) {

                    event.preventDefault();

                    showAlert(
                        "Maximum users must be between 1 and 10,000."
                    );

                    maxUsers.focus();

                    return;
                }


                /*
                 * Prevent accidental double submission.
                 */

                if (createLicenseBtn) {

                    createLicenseBtn.disabled =
                        true;

                    createLicenseBtn.innerHTML =
                        `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Creating License...
                        `;

                }

            }
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    calculateExpiry();
    updatePreview();
    updateChecklist();
    updateStatusPreview();

});