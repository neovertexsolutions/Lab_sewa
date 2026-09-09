/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * PLAN EDIT CONTROLLER
 * ============================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       DOM REFERENCES
    ======================================================== */

    const form = document.getElementById("planEditForm");
    const saveButton = document.getElementById("savePlanBtn");
    const resetButton = document.getElementById("resetForm");

    const planName = document.getElementById("planName");
    const planCode = document.getElementById("planCode");
    const planDescription = document.getElementById("planDescription");

    const currency = document.getElementById("currency");
    const price = document.getElementById("price");
    const billingCycle = document.getElementById("billingCycle");
    const durationDays = document.getElementById("durationDays");

    const setupFee = document.getElementById("setupFee");
    const taxRate = document.getElementById("taxRate");

    const userLimit = document.getElementById("userLimit");
    const patientLimit = document.getElementById("patientLimit");
    const testLimit = document.getElementById("testLimit");

    const storageLimit = document.getElementById("storageLimit");
    const storageUnit = document.getElementById("storageUnit");

    const trialEnabled = document.getElementById("trialEnabled");
    const trialDays = document.getElementById("trialDays");

    const toastContainer =
        document.getElementById("toastContainer");


    /* ========================================================
       INITIAL SNAPSHOT
    ======================================================== */

    const initialFormState =
        captureFormState();


    /* ========================================================
       DESCRIPTION COUNTER
    ======================================================== */

    function updateDescriptionCounter() {

        if (!planDescription) {
            return;
        }

        const counter =
            document.getElementById("descriptionCount");

        if (!counter) {
            return;
        }

        counter.textContent =
            planDescription.value.length;

    }

    planDescription?.addEventListener(
        "input",
        () => {

            updateDescriptionCounter();
            updatePreview();

        }
    );

    updateDescriptionCounter();


    /* ========================================================
       PLAN NAME PREVIEW
    ======================================================== */

    planName?.addEventListener(
        "input",
        updatePreview
    );


    /* ========================================================
       PRICE PREVIEW
    ======================================================== */

    [
        currency,
        price,
        billingCycle,
        userLimit,
        patientLimit,
        testLimit,
        storageLimit,
        storageUnit
    ].forEach(element => {

        element?.addEventListener(
            "input",
            updatePreview
        );

        element?.addEventListener(
            "change",
            updatePreview
        );

    });


    /* ========================================================
       BILLING CYCLE
    ======================================================== */

    billingCycle?.addEventListener(
        "change",
        handleBillingCycle
    );

    handleBillingCycle();


    function handleBillingCycle() {

        const customGroup =
            document.getElementById(
                "customDurationGroup"
            );

        if (!customGroup) {
            return;
        }

        if (billingCycle.value === "custom") {

            customGroup.style.display =
                "block";

        } else {

            customGroup.style.display =
                "block";

            updateDurationFromCycle();

        }

        updatePreview();

    }


    function updateDurationFromCycle() {

        if (!durationDays) {
            return;
        }

        const durations = {

            monthly: 30,

            quarterly: 90,

            half_yearly: 180,

            yearly: 365

        };

        const value =
            durations[billingCycle.value];

        if (value) {
            durationDays.value = value;
        }

    }


    /* ========================================================
       CURRENCY
    ======================================================== */

    currency?.addEventListener(
        "change",
        () => {

            const symbols = {

                INR: "₹",

                USD: "$",

                EUR: "€"

            };

            const symbol =
                symbols[currency.value] || "₹";

            const currencySymbol =
                document.getElementById(
                    "currencySymbol"
                );

            const setupSymbol =
                document.getElementById(
                    "setupCurrencySymbol"
                );

            const previewCurrency =
                document.getElementById(
                    "previewCurrency"
                );

            if (currencySymbol) {
                currencySymbol.textContent =
                    symbol;
            }

            if (setupSymbol) {
                setupSymbol.textContent =
                    symbol;
            }

            if (previewCurrency) {
                previewCurrency.textContent =
                    symbol;
            }

            updatePreview();

        }
    );


    /* ========================================================
       TRIAL
    ======================================================== */

    trialEnabled?.addEventListener(
        "change",
        updateTrialVisibility
    );

    updateTrialVisibility();


    function updateTrialVisibility() {

        const wrapper =
            document.getElementById(
                "trialDurationWrapper"
            );

        if (!wrapper) {
            return;
        }

        if (trialEnabled.checked) {

            wrapper.style.display =
                "block";

        } else {

            wrapper.style.display =
                "none";

        }

    }


    /* ========================================================
       PREVIEW
    ======================================================== */

    function updatePreview() {

        const previewName =
            document.getElementById(
                "previewPlanName"
            );

        const previewDescription =
            document.getElementById(
                "previewDescription"
            );

        const previewPrice =
            document.getElementById(
                "previewPrice"
            );

        const previewCycle =
            document.getElementById(
                "previewCycle"
            );

        const previewUsers =
            document.getElementById(
                "previewUsers"
            );

        const previewPatients =
            document.getElementById(
                "previewPatients"
            );

        const previewTests =
            document.getElementById(
                "previewTests"
            );

        const previewStorage =
            document.getElementById(
                "previewStorage"
            );


        if (previewName) {

            previewName.textContent =
                planName?.value.trim() ||
                "Subscription Plan";

        }


        if (previewDescription) {

            previewDescription.textContent =
                planDescription?.value.trim() ||
                "Professional laboratory management solution.";

        }


        if (previewPrice) {

            const value =
                Number(price?.value || 0);

            previewPrice.textContent =
                formatNumber(value);

        }


        if (previewCycle) {

            const cycleText = {

                monthly: "/ month",

                quarterly: "/ quarter",

                half_yearly: "/ 6 months",

                yearly: "/ year",

                custom:
                    durationDays?.value
                        ? `/ ${durationDays.value} days`
                        : "/ custom"

            };

            previewCycle.textContent =
                cycleText[billingCycle?.value] ||
                "/ month";

        }


        if (previewUsers) {

            previewUsers.textContent =
                formatLimit(
                    userLimit?.value
                );

        }


        if (previewPatients) {

            previewPatients.textContent =
                formatLimit(
                    patientLimit?.value
                );

        }


        if (previewTests) {

            previewTests.textContent =
                formatLimit(
                    testLimit?.value
                );

        }


        if (previewStorage) {

            previewStorage.textContent =
                `${formatLimit(storageLimit?.value)} ${storageUnit?.value || "GB"}`;

        }


        updateHeaderPrice();

    }


    function updateHeaderPrice() {

        const pricePreview =
            document.getElementById(
                "pricePreview"
            );

        const billingPreview =
            document.getElementById(
                "billingPreview"
            );

        if (pricePreview) {

            const value =
                Number(price?.value || 0);

            const symbols = {

                INR: "₹",

                USD: "$",

                EUR: "€"

            };

            const symbol =
                symbols[currency?.value] || "₹";

            pricePreview.textContent =
                `${symbol}${formatNumber(value)}`;

        }


        if (billingPreview) {

            const names = {

                monthly: "Monthly",

                quarterly: "Quarterly",

                half_yearly: "Half Yearly",

                yearly: "Yearly",

                custom: "Custom"

            };

            billingPreview.textContent =
                names[billingCycle?.value] ||
                "Monthly";

        }

    }


    function formatNumber(value) {

        return Number(value || 0)
            .toLocaleString("en-IN", {
                maximumFractionDigits: 2
            });

    }


    function formatLimit(value) {

        const number =
            Number(value);

        if (number === -1) {
            return "Unlimited";
        }

        if (Number.isNaN(number)) {
            return "0";
        }

        return number.toLocaleString("en-IN");

    }


    updatePreview();


    /* ========================================================
       VALIDATION
    ======================================================== */

    function validateForm() {

        clearValidationErrors();

        let valid = true;


        if (!planName?.value.trim()) {

            showFieldError(
                planName,
                "Plan name is required."
            );

            valid = false;

        }


        if (!planCode?.value.trim()) {

            showFieldError(
                planCode,
                "Plan code is required."
            );

            valid = false;

        }


        const priceValue =
            Number(price?.value);

        if (
            Number.isNaN(priceValue) ||
            priceValue < 0
        ) {

            showFieldError(
                price,
                "Enter a valid price."
            );

            valid = false;

        }


        const taxValue =
            Number(taxRate?.value);

        if (
            Number.isNaN(taxValue) ||
            taxValue < 0 ||
            taxValue > 100
        ) {

            showFieldError(
                taxRate,
                "Tax must be between 0 and 100."
            );

            valid = false;

        }


        const duration =
            Number(durationDays?.value);

        if (
            billingCycle?.value === "custom" &&
            (
                Number.isNaN(duration) ||
                duration < 1
            )
        ) {

            showFieldError(
                durationDays,
                "Enter a valid duration."
            );

            valid = false;

        }


        if (
            trialEnabled?.checked &&
            (
                Number(trialDays?.value) < 1
            )
        ) {

            showFieldError(
                trialDays,
                "Trial duration must be at least 1 day."
            );

            valid = false;

        }


        return valid;

    }


    function showFieldError(
        element,
        message
    ) {

        if (!element) {
            return;
        }

        element.classList.add(
            "field-error"
        );

        element.setAttribute(
            "aria-invalid",
            "true"
        );

        let error =
            element.parentElement.querySelector(
                ".validation-error"
            );

        if (!error) {

            error =
                document.createElement("span");

            error.className =
                "validation-error";

            element.parentElement.appendChild(
                error
            );

        }

        error.textContent =
            message;

    }


    function clearValidationErrors() {

        document
            .querySelectorAll(
                ".field-error"
            )
            .forEach(element => {

                element.classList.remove(
                    "field-error"
                );

                element.removeAttribute(
                    "aria-invalid"
                );

            });


        document
            .querySelectorAll(
                ".validation-error"
            )
            .forEach(error => {
                error.remove();
            });

    }


    /* ========================================================
       FORM SUBMIT
    ======================================================== */

    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!validateForm()) {

                showToast(
                    "Please fix the highlighted fields.",
                    "error"
                );

                return;

            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to update this subscription plan?"
                );

            if (!confirmed) {
                return;
            }


            const originalHTML =
                saveButton.innerHTML;

            saveButton.disabled = true;

            saveButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


            try {

                const payload =
                    collectFormData();


                /*
                 * =================================================
                 * PRODUCTION DJANGO API
                 *
                 * Replace the simulated request below with:
                 *
                 * const response = await fetch(
                 *     window.location.pathname,
                 *     {
                 *         method: "POST",
                 *         headers: {
                 *             "Content-Type":
                 *                 "application/json",
                 *
                 *             "X-CSRFToken":
                 *                 getCSRFToken()
                 *         },
                 *
                 *         body:
                 *             JSON.stringify(payload)
                 *     }
                 * );
                 *
                 * if (!response.ok) {
                 *     throw new Error(
                 *         "Unable to update plan."
                 *     );
                 * }
                 * =================================================
                 */

                await simulateRequest(
                    payload
                );


                showToast(
                    "Subscription plan updated successfully.",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        getPlansURL();

                }, 900);


            } catch (error) {

                console.error(
                    "Plan update error:",
                    error
                );

                showToast(
                    "Unable to update the subscription plan.",
                    "error"
                );

            } finally {

                saveButton.disabled =
                    false;

                saveButton.innerHTML =
                    originalHTML;

            }

        }
    );


    /* ========================================================
       RESET
    ======================================================== */

    resetButton?.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Discard all changes and restore the original values?"
                );

            if (!confirmed) {
                return;
            }

            restoreFormState(
                initialFormState
            );

            clearValidationErrors();

            updatePreview();

            updateDescriptionCounter();

            handleBillingCycle();

            updateTrialVisibility();

            showToast(
                "Changes have been reset.",
                "success"
            );

        }
    );


    /* ========================================================
       FORM DATA
    ======================================================== */

    function collectFormData() {

        const features =
            Array.from(
                document.querySelectorAll(
                    'input[name="features"]:checked'
                )
            ).map(
                input => input.value
            );


        const visibility =
            document.querySelector(
                'input[name="visibility"]:checked'
            );


        return {

            name:
                planName?.value.trim(),

            code:
                planCode?.value.trim(),

            description:
                planDescription?.value.trim(),

            currency:
                currency?.value,

            price:
                Number(price?.value || 0),

            billing_cycle:
                billingCycle?.value,

            duration_days:
                Number(durationDays?.value || 0),

            setup_fee:
                Number(setupFee?.value || 0),

            tax_rate:
                Number(taxRate?.value || 0),

            user_limit:
                Number(userLimit?.value || 0),

            patient_limit:
                Number(patientLimit?.value || 0),

            test_limit:
                Number(testLimit?.value || 0),

            storage_limit:
                Number(storageLimit?.value || 0),

            storage_unit:
                storageUnit?.value,

            features,

            trial_enabled:
                Boolean(
                    trialEnabled?.checked
                ),

            trial_days:
                Number(trialDays?.value || 0),

            auto_renew:
                Boolean(
                    document.getElementById(
                        "autoRenew"
                    )?.checked
                ),

            visibility:
                visibility?.value || "public",

            status:
                document.getElementById(
                    "planStatus"
                )?.value || "active"

        };

    }


    /* ========================================================
       STATE MANAGEMENT
    ======================================================== */

    function captureFormState() {

        return {

            name:
                planName?.value,

            code:
                planCode?.value,

            description:
                planDescription?.value,

            currency:
                currency?.value,

            price:
                price?.value,

            billingCycle:
                billingCycle?.value,

            durationDays:
                durationDays?.value,

            setupFee:
                setupFee?.value,

            taxRate:
                taxRate?.value,

            userLimit:
                userLimit?.value,

            patientLimit:
                patientLimit?.value,

            testLimit:
                testLimit?.value,

            storageLimit:
                storageLimit?.value,

            storageUnit:
                storageUnit?.value,

            trialEnabled:
                trialEnabled?.checked,

            trialDays:
                trialDays?.value,

            autoRenew:
                document.getElementById(
                    "autoRenew"
                )?.checked,

            visibility:
                document.querySelector(
                    'input[name="visibility"]:checked'
                )?.value,

            status:
                document.getElementById(
                    "planStatus"
                )?.value,

            features:
                Array.from(
                    document.querySelectorAll(
                        'input[name="features"]'
                    )
                ).map(input => ({
                    value: input.value,
                    checked: input.checked
                }))

        };

    }


    function restoreFormState(state) {

        if (!state) {
            return;
        }

        if (planName) {
            planName.value =
                state.name;
        }

        if (planCode) {
            planCode.value =
                state.code;
        }

        if (planDescription) {
            planDescription.value =
                state.description;
        }

        if (currency) {
            currency.value =
                state.currency;
        }

        if (price) {
            price.value =
                state.price;
        }

        if (billingCycle) {
            billingCycle.value =
                state.billingCycle;
        }

        if (durationDays) {
            durationDays.value =
                state.durationDays;
        }

        if (setupFee) {
            setupFee.value =
                state.setupFee;
        }

        if (taxRate) {
            taxRate.value =
                state.taxRate;
        }

        if (userLimit) {
            userLimit.value =
                state.userLimit;
        }

        if (patientLimit) {
            patientLimit.value =
                state.patientLimit;
        }

        if (testLimit) {
            testLimit.value =
                state.testLimit;
        }

        if (storageLimit) {
            storageLimit.value =
                state.storageLimit;
        }

        if (storageUnit) {
            storageUnit.value =
                state.storageUnit;
        }

        if (trialEnabled) {
            trialEnabled.checked =
                state.trialEnabled;
        }

        if (trialDays) {
            trialDays.value =
                state.trialDays;
        }

        const autoRenew =
            document.getElementById(
                "autoRenew"
            );

        if (autoRenew) {
            autoRenew.checked =
                state.autoRenew;
        }


        const visibility =
            document.querySelector(
                `input[name="visibility"][value="${state.visibility}"]`
            );

        if (visibility) {
            visibility.checked =
                true;
        }


        const status =
            document.getElementById(
                "planStatus"
            );

        if (status) {
            status.value =
                state.status;
        }


        if (state.features) {

            state.features.forEach(
                feature => {

                    const checkbox =
                        document.querySelector(
                            `input[name="features"][value="${feature.value}"]`
                        );

                    if (checkbox) {
                        checkbox.checked =
                            feature.checked;
                    }

                }
            );

        }

    }


    /* ========================================================
       DJANGO CSRF
    ======================================================== */

    function getCSRFToken() {

        const input =
            document.querySelector(
                '[name="csrfmiddlewaretoken"]'
            );

        if (input) {
            return input.value;
        }


        const cookie =
            document.cookie
                .split("; ")
                .find(row =>
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


    /* ========================================================
       PLANS URL
    ======================================================== */

    function getPlansURL() {

        /*
         * Django template URL is preferable.
         *
         * The HTML can define:
         *
         * data-plans-url="{% url 'superadmin:plans' %}"
         *
         * on the body/container.
         */

        const page =
            document.querySelector(
                ".plan-edit-page"
            );

        if (
            page &&
            page.dataset.plansUrl
        ) {
            return page.dataset.plansUrl;
        }


        /*
         * Fallback:
         */

        return "/superadmin/plans/";

    }


    /* ========================================================
       TOAST
    ======================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        if (!toastContainer) {
            return;
        }

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            `toast ${type}`;

        const icons = {

            success:
                "fa-circle-check",

            error:
                "fa-circle-xmark",

            warning:
                "fa-triangle-exclamation"

        };

        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.success}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        toastContainer.appendChild(
            toast
        );


        setTimeout(() => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateX(12px)";

            setTimeout(() => {

                toast.remove();

            }, 250);

        }, 3200);

    }


    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(value);

        return div.innerHTML;

    }


    /* ========================================================
       TEMPORARY REQUEST
    ======================================================== */

    function simulateRequest(data) {

        return new Promise(
            (resolve) => {

                console.debug(
                    "Plan update payload:",
                    data
                );

                setTimeout(
                    resolve,
                    700
                );

            }
        );

    }


    /* ========================================================
       PREVENT ACCIDENTAL DATA LOSS
    ======================================================== */

    let formChanged = false;

    form?.addEventListener(
        "input",
        () => {
            formChanged = true;
        }
    );


    window.addEventListener(
        "beforeunload",
        event => {

            if (!formChanged) {
                return;
            }

            event.preventDefault();
            event.returnValue = "";

        }
    );


    form?.addEventListener(
        "submit",
        () => {
            formChanged = false;
        }
    );

});