/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * CREATE PLAN
 * Production JavaScript
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const form = document.getElementById("planCreateForm");

    const planName = document.getElementById("planName");
    const planCode = document.getElementById("planCode");
    const planType = document.getElementById("planType");

    const price = document.getElementById("price");
    const billingCycle = document.getElementById("billingCycle");

    const description = document.getElementById("description");
    const descriptionCount = document.getElementById("descriptionCount");

    const previewName = document.getElementById("previewName");
    const previewDescription =
        document.getElementById("previewDescription");

    const previewPrice = document.getElementById("previewPrice");
    const previewCycle = document.getElementById("previewCycle");

    const createButton = document.getElementById("createPlanBtn");

    const confirmModal = document.getElementById("confirmModal");
    const confirmCreate = document.getElementById("confirmCreate");

    const closeConfirmModal =
        document.getElementById("closeConfirmModal");

    const cancelCreate =
        document.getElementById("cancelCreate");

    const saveDraftButton =
        document.getElementById("saveDraftBtn");


    /* =====================================================
       HELPERS
       ===================================================== */

    function escapeHTML(value) {

        const div = document.createElement("div");

        div.textContent = value;

        return div.innerHTML;
    }


    function formatCurrency(value) {

        const number = parseFloat(value);

        if (Number.isNaN(number)) {
            return "0";
        }

        return number.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }


    /* =====================================================
       PLAN NAME PREVIEW
       ===================================================== */

    function updatePlanName() {

        const value = planName.value.trim();

        previewName.textContent =
            value || "Professional";
    }


    planName.addEventListener("input", updatePlanName);


    /* =====================================================
       DESCRIPTION PREVIEW
       ===================================================== */

    function updateDescription() {

        const value = description.value.trim();

        previewDescription.textContent =
            value || "Your plan description will appear here.";

        descriptionCount.textContent =
            `${description.value.length} / 500`;
    }


    description.addEventListener(
        "input",
        updateDescription
    );


    /* =====================================================
       PRICE PREVIEW
       ===================================================== */

    function updatePrice() {

        previewPrice.textContent =
            formatCurrency(price.value);
    }


    price.addEventListener("input", updatePrice);


    /* =====================================================
       BILLING CYCLE
       ===================================================== */

    function updateBillingCycle() {

        const cycle = billingCycle.value;

        const labels = {

            one_time: "one time",

            monthly: "/ month",

            quarterly: "/ quarter",

            yearly: "/ year",

            custom: "/ custom"

        };

        previewCycle.textContent =
            labels[cycle] || "/ month";
    }


    billingCycle.addEventListener(
        "change",
        updateBillingCycle
    );


    /* =====================================================
       PLAN CODE
       ===================================================== */

    planCode.addEventListener("input", () => {

        planCode.value = planCode.value
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/[^A-Z0-9_-]/g, "");

    });


    /* =====================================================
       UNLIMITED PATIENTS
       ===================================================== */

    const unlimitedPatients =
        document.getElementById("unlimitedPatients");

    const unlimitedReports =
        document.getElementById("unlimitedReports");

    const maxPatients =
        document.querySelector('[name="max_patients"]');

    const maxReports =
        document.querySelector('[name="max_reports"]');


    unlimitedPatients.addEventListener("change", () => {

        maxPatients.disabled =
            unlimitedPatients.checked;

        if (unlimitedPatients.checked) {
            maxPatients.value = "";
            maxPatients.placeholder = "Unlimited";
        } else {
            maxPatients.placeholder = "Maximum patients";
        }

    });


    unlimitedReports.addEventListener("change", () => {

        maxReports.disabled =
            unlimitedReports.checked;

        if (unlimitedReports.checked) {
            maxReports.value = "";
            maxReports.placeholder = "Unlimited";
        } else {
            maxReports.placeholder = "Maximum reports";
        }

    });


    /* =====================================================
       FEATURE PREVIEW
       ===================================================== */

    const featureInputs =
        document.querySelectorAll(
            '.feature-item input[type="checkbox"]'
        );


    featureInputs.forEach(input => {

        input.addEventListener("change", () => {

            const checkedFeatures =
                [...featureInputs]
                    .filter(item => item.checked);

            const previewList =
                document.querySelector(
                    ".preview-features"
                );

            if (!previewList) {
                return;
            }

            previewList.innerHTML = "";

            const featureNames = {

                patients: "Patient Management",

                billing: "Billing & Invoices",

                reports: "Lab Reports",

                inventory: "Inventory",

                analytics: "Analytics",

                notifications: "Notifications",

                api: "API Access",

                backup: "Automated Backup"

            };


            checkedFeatures
                .slice(0, 6)
                .forEach(item => {

                    const li =
                        document.createElement("li");

                    li.innerHTML = `
                        <i class="fa-solid fa-check"></i>
                        ${escapeHTML(
                            featureNames[item.value] ||
                            item.value
                        )}
                    `;

                    previewList.appendChild(li);

                });


            if (!checkedFeatures.length) {

                const li =
                    document.createElement("li");

                li.textContent =
                    "No features selected";

                previewList.appendChild(li);
            }

        });

    });


    /* =====================================================
       VALIDATION
       ===================================================== */

    function showError(input, errorId, message) {

        input.classList.add("input-error");

        const error =
            document.getElementById(errorId);

        if (error) {

            error.textContent = message;
            error.style.display = "block";

        }

    }


    function clearError(input, errorId) {

        input.classList.remove("input-error");

        const error =
            document.getElementById(errorId);

        if (error) {

            error.textContent = "";
            error.style.display = "none";

        }

    }


    function validateForm() {

        let valid = true;


        /* PLAN NAME */

        if (!planName.value.trim()) {

            showError(
                planName,
                "planNameError",
                "Plan name is required."
            );

            valid = false;

        } else {

            clearError(
                planName,
                "planNameError"
            );

        }


        /* PLAN CODE */

        if (!planCode.value.trim()) {

            showError(
                planCode,
                "planCodeError",
                "Plan code is required."
            );

            valid = false;

        } else {

            clearError(
                planCode,
                "planCodeError"
            );

        }


        /* PLAN TYPE */

        if (!planType.value) {

            showError(
                planType,
                "planTypeError",
                "Please select a plan type."
            );

            valid = false;

        } else {

            clearError(
                planType,
                "planTypeError"
            );

        }


        /* PRICE */

        const priceError =
            document.getElementById("priceError");

        if (
            price.value === "" ||
            Number(price.value) < 0
        ) {

            price.classList.add("input-error");

            priceError.textContent =
                "Please enter a valid price.";

            priceError.style.display = "block";

            valid = false;

        } else {

            price.classList.remove("input-error");

            priceError.textContent = "";

            priceError.style.display = "none";
        }


        return valid;
    }


    /* =====================================================
       REAL TIME VALIDATION
       ===================================================== */

    [planName, planCode, planType, price]
        .forEach(input => {

            input.addEventListener("blur", validateForm);

        });


    /* =====================================================
       OPEN CONFIRM MODAL
       ===================================================== */

    form.addEventListener("submit", event => {

        event.preventDefault();

        if (!validateForm()) {

            const firstError =
                form.querySelector(".input-error");

            if (firstError) {
                firstError.focus();
            }

            return;
        }

        confirmModal.classList.add("active");

        document.body.style.overflow = "hidden";

    });


    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    function closeModal() {

        confirmModal.classList.remove("active");

        document.body.style.overflow = "";

    }


    closeConfirmModal.addEventListener(
        "click",
        closeModal
    );

    cancelCreate.addEventListener(
        "click",
        closeModal
    );


    confirmModal
        .querySelector(".modal-backdrop")
        .addEventListener(
            "click",
            closeModal
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                confirmModal.classList.contains("active")
            ) {
                closeModal();
            }

        }
    );


    /* =====================================================
       CONFIRM CREATE
       ===================================================== */

    confirmCreate.addEventListener("click", () => {

        confirmCreate.disabled = true;

        confirmCreate.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating...
        `;


        /*
         * IMPORTANT:
         *
         * Actual Django form submission happens here.
         *
         * The browser sends:
         * POST /your-plan-create-url/
         *
         * along with CSRF token.
         */

        form.submit();

    });


    /* =====================================================
       SAVE DRAFT
       ===================================================== */

    saveDraftButton.addEventListener(
        "click",
        () => {

            const statusInput =
                document.querySelector(
                    'input[name="status"]'
                );

            if (statusInput) {
                statusInput.checked = false;
            }


            /*
             * Draft behavior:
             *
             * Backend should detect:
             * status = false
             * is_active = false
             * is_visible = false
             *
             * and save plan as draft.
             */

            if (!validateForm()) {
                return;
            }


            saveDraftButton.disabled = true;

            saveDraftButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;


            form.submit();

        }
    );


    /* =====================================================
       INITIAL PREVIEW
       ===================================================== */

    updatePlanName();
    updateDescription();
    updatePrice();
    updateBillingCycle();

});