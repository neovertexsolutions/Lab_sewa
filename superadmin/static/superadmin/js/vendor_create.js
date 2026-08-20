/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * VENDOR CREATE
 *
 * Production-Level Controller
 *
 * Responsibilities:
 * - Form validation
 * - CSRF handling
 * - AJAX vendor creation
 * - Django JSON / redirect response support
 * - Password strength
 * - Password visibility
 * - Vendor live preview
 * - Subscription calculation
 * - Plan selection
 * - Duplicate submit prevention
 * - Server validation error handling
 * - Success modal
 * - Reset
 * - Keyboard accessibility
 * =========================================================
 */

"use strict";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       PAGE
    ===================================================== */

    const page =
        document.getElementById("vendorCreatePage");

    const form =
        document.getElementById("vendorCreateForm");

    if (!page || !form) {
        console.warn(
            "[VendorCreate] Required DOM elements not found."
        );
        return;
    }


    /* =====================================================
       DOM HELPER
    ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    /* =====================================================
       FORM ELEMENTS
    ===================================================== */

    const vendorName =
        $("vendorName");

    const ownerName =
        $("ownerName");

    const email =
        $("email");

    const phone =
        $("phone");

    const alternatePhone =
        $("alternatePhone");

    const address =
        $("address");

    const city =
        $("city");

    const state =
        $("state");

    const pincode =
        $("pincode");

    const country =
        $("country");

    const username =
        $("username");

    const password =
        $("password");

    const confirmPassword =
        $("confirmPassword");

    const accountStatus =
        $("accountStatus");

    const startDate =
        $("startDate");

    const duration =
        $("duration");

    const endDate =
        $("endDate");


    /* =====================================================
       UI
    ===================================================== */

    const formAlert =
        $("formAlert");

    const createButton =
        $("createVendorBtn");

    const resetButton =
        $("resetFormBtn");

    const previewAvatar =
        $("previewAvatar");

    const previewName =
        $("previewName");

    const previewEmail =
        $("previewEmail");

    const summaryPlan =
        $("summaryPlan");

    const summaryDuration =
        $("summaryDuration");

    const summaryStart =
        $("summaryStart");

    const summaryEnd =
        $("summaryEnd");

    const summaryStatus =
        $("summaryStatus");

    const strengthBar =
        $("strengthBar");

    const strengthText =
        $("strengthText");

    const passwordMatch =
        $("passwordMatch");


    /* =====================================================
       SUCCESS MODAL
    ===================================================== */

    const successModal =
        $("successModal");

    const closeSuccessModal =
        $("closeSuccessModal");

    const successModalMessage =
        $("successModalMessage");

    const createdCredentials =
        $("createdCredentials");

    const createdUsername =
        $("createdUsername");

    const createdLicense =
        $("createdLicense");


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        submitting: false,

        created: false,

        originalButtonHTML:
            createButton
                ? createButton.innerHTML
                : "",

        abortController: null

    };


    /* =====================================================
       GENERIC HELPERS
    ===================================================== */

    function trimValue(field) {

        if (!field) {
            return "";
        }

        return String(
            field.value || ""
        ).trim();
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

    function showAlert(
        message,
        type = "error"
    ) {

        if (!formAlert) {
            return;
        }

        const icons = {

            error:
                "fa-circle-exclamation",

            warning:
                "fa-triangle-exclamation",

            success:
                "fa-circle-check"

        };

        const icon =
            icons[type] ||
            icons.error;

        formAlert.className =
            `form-alert show ${type}`;

        formAlert.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        formAlert.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }


    function hideAlert() {

        if (!formAlert) {
            return;
        }

        formAlert.className =
            "form-alert";

        formAlert.innerHTML = "";
    }


    /* =====================================================
       FIELD ERROR
    ===================================================== */

    function getFieldWrapper(field) {

        if (!field) {
            return null;
        }

        return field.closest(
            ".input-wrapper, .select-wrapper, .textarea-wrapper"
        );
    }


    function setFieldInvalid(
        field,
        invalid = true
    ) {

        const wrapper =
            getFieldWrapper(field);

        if (!wrapper) {
            return;
        }

        wrapper.classList.toggle(
            "invalid",
            invalid
        );
    }


    function clearFieldError(field) {

        setFieldInvalid(
            field,
            false
        );
    }


    function clearAllFieldErrors() {

        form
            .querySelectorAll(
                ".invalid"
            )
            .forEach(
                element =>
                    element.classList.remove(
                        "invalid"
                    )
            );
    }


    /* =====================================================
       CSRF
    ===================================================== */

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

        return null;
    }


    function getCSRFToken() {

        const cookieToken =
            getCookie("csrftoken");

        if (cookieToken) {
            return cookieToken;
        }

        const inputToken =
            form.querySelector(
                "[name='csrfmiddlewaretoken']"
            );

        return inputToken?.value || "";
    }


    /* =====================================================
       DATE
    ===================================================== */

    function getToday() {

        const date =
            new Date();

        return formatDateInput(
            date
        );
    }


    function formatDateInput(date) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatDisplayDate(value) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(
                `${value}T00:00:00`
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
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


    function initializeStartDate() {

        if (!startDate) {
            return;
        }

        if (!startDate.value) {
            startDate.value =
                getToday();
        }

        /*
         * Prevent selecting a date
         * before today for new vendors.
         */

        startDate.min =
            getToday();
    }


    /* =====================================================
       SUBSCRIPTION CALCULATION
    ===================================================== */

    function calculateEndDate() {

        if (
            !startDate ||
            !duration ||
            !endDate
        ) {
            return;
        }

        if (!startDate.value) {

            endDate.value = "";

            updateDateSummary();

            return;
        }

        const days =
            Number(
                duration.value
            );

        if (
            !Number.isInteger(days) ||
            days <= 0
        ) {

            endDate.value = "";

            updateDateSummary();

            return;
        }

        const date =
            new Date(
                `${startDate.value}T00:00:00`
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            endDate.value = "";

            updateDateSummary();

            return;
        }

        /*
         * Duration semantics:
         *
         * 30 days starting on 01 Jan
         * expires on 30 Jan.
         *
         * Therefore subtract one day.
         */

        date.setDate(
            date.getDate() +
            days -
            1
        );

        endDate.value =
            formatDateInput(date);

        updateDateSummary();
    }


    function updateDateSummary() {

        if (summaryStart) {

            summaryStart.textContent =
                formatDisplayDate(
                    startDate?.value
                );
        }

        if (summaryEnd) {

            summaryEnd.textContent =
                formatDisplayDate(
                    endDate?.value
                );
        }
    }


    startDate?.addEventListener(
        "change",
        () => {

            if (
                startDate.value &&
                startDate.value <
                getToday()
            ) {

                setFieldInvalid(
                    startDate,
                    true
                );

                showAlert(
                    "Subscription start date cannot be before today."
                );

                startDate.value =
                    getToday();

            } else {

                clearFieldError(
                    startDate
                );
            }

            calculateEndDate();
        }
    );


    duration?.addEventListener(
        "change",
        () => {

            clearFieldError(
                duration
            );

            updateDurationSummary();

            calculateEndDate();

        }
    );


    /* =====================================================
       PLAN
    ===================================================== */

    const planInputs =
        form.querySelectorAll(
            'input[name="plan"]'
        );


    function getSelectedPlan() {

        return form.querySelector(
            'input[name="plan"]:checked'
        );
    }


    function updatePlanSummary() {

        const selected =
            getSelectedPlan();

        if (!selected) {

            if (summaryPlan) {
                summaryPlan.textContent =
                    "—";
            }

            return;
        }

        const name =
            selected.dataset.planName ||
            selected.value;

        if (summaryPlan) {
            summaryPlan.textContent =
                name;
        }
    }


    planInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                updatePlanSummary
            );

        }
    );


    /* =====================================================
       DURATION SUMMARY
    ===================================================== */

    function updateDurationSummary() {

        if (
            !duration ||
            !summaryDuration
        ) {
            return;
        }

        const option =
            duration.options[
                duration.selectedIndex
            ];

        summaryDuration.textContent =
            option?.text ||
            "—";
    }


    /* =====================================================
       STATUS SUMMARY
    ===================================================== */

    function updateStatusSummary() {

        if (
            !accountStatus ||
            !summaryStatus
        ) {
            return;
        }

        const option =
            accountStatus.options[
                accountStatus.selectedIndex
            ];

        summaryStatus.textContent =
            option?.text ||
            "—";
    }


    accountStatus?.addEventListener(
        "change",
        updateStatusSummary
    );


    /* =====================================================
       VENDOR PREVIEW
    ===================================================== */

    function updateVendorPreview() {

        const name =
            trimValue(vendorName) ||
            "New Vendor";

        const mail =
            trimValue(email) ||
            "vendor@email.com";

        if (previewName) {

            previewName.textContent =
                name;
        }

        if (previewEmail) {

            previewEmail.textContent =
                mail;
        }

        if (previewAvatar) {

            const firstCharacter =
                name
                    .charAt(0)
                    .toUpperCase();

            previewAvatar.textContent =
                firstCharacter ||
                "V";
        }
    }


    vendorName?.addEventListener(
        "input",
        updateVendorPreview
    );

    email?.addEventListener(
        "input",
        updateVendorPreview
    );


    /* =====================================================
       USERNAME SANITIZATION
    ===================================================== */

    username?.addEventListener(
        "input",
        () => {

            username.value =
                username.value
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(
                        /[^a-z0-9._-]/g,
                        ""
                    )
                    .slice(0, 50);

            clearFieldError(
                username
            );
        }
    );


    /* =====================================================
       PHONE SANITIZATION
    ===================================================== */

    function sanitizePhone(
        input
    ) {

        if (!input) {
            return;
        }

        input.value =
            input.value
                .replace(/\D/g, "")
                .slice(0, 10);

        clearFieldError(
            input
        );
    }


    phone?.addEventListener(
        "input",
        () => sanitizePhone(phone)
    );

    alternatePhone?.addEventListener(
        "input",
        () =>
            sanitizePhone(
                alternatePhone
            )
    );


    /* =====================================================
       PINCODE
    ===================================================== */

    pincode?.addEventListener(
        "input",
        () => {

            pincode.value =
                pincode.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

            clearFieldError(
                pincode
            );
        }
    );


    /* =====================================================
       PASSWORD VISIBILITY
    ===================================================== */

    document
        .querySelectorAll(
            ".password-toggle"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const targetId =
                            button.dataset.target;

                        const target =
                            document.getElementById(
                                targetId
                            );

                        if (!target) {
                            return;
                        }

                        const icon =
                            button.querySelector(
                                "i"
                            );

                        if (
                            target.type ===
                            "password"
                        ) {

                            target.type =
                                "text";

                            icon?.classList.remove(
                                "fa-eye"
                            );

                            icon?.classList.add(
                                "fa-eye-slash"
                            );

                            button.setAttribute(
                                "aria-label",
                                "Hide password"
                            );

                        } else {

                            target.type =
                                "password";

                            icon?.classList.remove(
                                "fa-eye-slash"
                            );

                            icon?.classList.add(
                                "fa-eye"
                            );

                            button.setAttribute(
                                "aria-label",
                                "Show password"
                            );
                        }
                    }
                );
            }
        );


    /* =====================================================
       PASSWORD STRENGTH
    ===================================================== */

    function getPasswordStrength(
        value
    ) {

        if (!value) {
            return 0;
        }

        let score = 0;

        if (value.length >= 8) {
            score++;
        }

        if (value.length >= 12) {
            score++;
        }

        if (/[a-z]/.test(value)) {
            score++;
        }

        if (/[A-Z]/.test(value)) {
            score++;
        }

        if (/\d/.test(value)) {
            score++;
        }

        if (
            /[^A-Za-z0-9]/.test(
                value
            )
        ) {
            score++;
        }

        return score;
    }


    function updatePasswordStrength() {

        if (
            !password ||
            !strengthBar ||
            !strengthText
        ) {
            return;
        }

        const value =
            password.value;

        const score =
            getPasswordStrength(
                value
            );

        if (!value) {

            strengthBar.style.width =
                "0%";

            strengthBar.style.background =
                "#d1d5db";

            strengthText.textContent =
                "Enter password";

            strengthText.style.color =
                "#9ca3af";

            return;
        }

        const percentage =
            Math.round(
                (score / 6) * 100
            );

        strengthBar.style.width =
            `${percentage}%`;

        if (score <= 2) {

            strengthBar.style.background =
                "#ef4444";

            strengthText.textContent =
                "Weak";

            strengthText.style.color =
                "#ef4444";

        } else if (score <= 4) {

            strengthBar.style.background =
                "#f59e0b";

            strengthText.textContent =
                "Medium";

            strengthText.style.color =
                "#f59e0b";

        } else {

            strengthBar.style.background =
                "#16a34a";

            strengthText.textContent =
                "Strong";

            strengthText.style.color =
                "#16a34a";
        }
    }


    /* =====================================================
       PASSWORD MATCH
    ===================================================== */

    function checkPasswordMatch() {

        if (
            !password ||
            !confirmPassword ||
            !passwordMatch
        ) {
            return false;
        }

        if (!confirmPassword.value) {

            passwordMatch.textContent =
                "";

            passwordMatch.className =
                "";

            return false;
        }

        if (
            password.value !==
            confirmPassword.value
        ) {

            passwordMatch.textContent =
                "Passwords do not match";

            passwordMatch.className =
                "no-match";

            return false;
        }

        passwordMatch.textContent =
            "Passwords match";

        passwordMatch.className =
            "match";

        return true;
    }


    password?.addEventListener(
        "input",
        () => {

            updatePasswordStrength();

            checkPasswordMatch();

            clearFieldError(
                password
            );
        }
    );


    confirmPassword?.addEventListener(
        "input",
        () => {

            checkPasswordMatch();

            clearFieldError(
                confirmPassword
            );
        }
    );


    /* =====================================================
       VALIDATION HELPERS
    ===================================================== */

    function requireField(
        field,
        message
    ) {

        if (!field) {
            return true;
        }

        const value =
            trimValue(field);

        if (!value) {

            setFieldInvalid(
                field,
                true
            );

            showAlert(
                message
            );

            field.focus();

            return false;
        }

        clearFieldError(field);

        return true;
    }


    function isValidEmail(
        value
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(value);
    }


    function isValidUsername(
        value
    ) {

        return /^[a-z0-9][a-z0-9._-]{3,49}$/
            .test(value);
    }


    function validateForm() {

        hideAlert();

        clearAllFieldErrors();


        /* Vendor */

        if (
            !requireField(
                vendorName,
                "Laboratory / vendor name is required."
            )
        ) {
            return false;
        }


        if (
            !requireField(
                ownerName,
                "Owner / contact person is required."
            )
        ) {
            return false;
        }


        /* Email */

        if (
            !requireField(
                email,
                "Business email is required."
            )
        ) {
            return false;
        }

        if (
            !isValidEmail(
                trimValue(email)
            )
        ) {

            setFieldInvalid(
                email,
                true
            );

            showAlert(
                "Please enter a valid business email."
            );

            email.focus();

            return false;
        }


        /* Phone */

        if (
            !phone ||
            phone.value.length !== 10
        ) {

            setFieldInvalid(
                phone,
                true
            );

            showAlert(
                "Please enter a valid 10-digit phone number."
            );

            phone?.focus();

            return false;
        }


        /* Alternate phone */

        if (
            alternatePhone &&
            alternatePhone.value &&
            alternatePhone.value.length !== 10
        ) {

            setFieldInvalid(
                alternatePhone,
                true
            );

            showAlert(
                "Alternate phone must contain exactly 10 digits."
            );

            alternatePhone.focus();

            return false;
        }


        /* Address */

        if (
            !requireField(
                address,
                "Complete laboratory address is required."
            )
        ) {
            return false;
        }


        if (
            !requireField(
                city,
                "City is required."
            )
        ) {
            return false;
        }


        if (
            !requireField(
                state,
                "State is required."
            )
        ) {
            return false;
        }


        /* PIN */

        if (
            !pincode ||
            pincode.value.length !== 6
        ) {

            setFieldInvalid(
                pincode,
                true
            );

            showAlert(
                "Please enter a valid 6-digit PIN code."
            );

            pincode?.focus();

            return false;
        }


        /* Username */

        const usernameValue =
            trimValue(username);

        if (!usernameValue) {

            setFieldInvalid(
                username,
                true
            );

            showAlert(
                "Username is required."
            );

            username?.focus();

            return false;
        }


        if (
            !isValidUsername(
                usernameValue
            )
        ) {

            setFieldInvalid(
                username,
                true
            );

            showAlert(
                "Username must be 4–50 characters and may contain only lowercase letters, numbers, dot, underscore and hyphen."
            );

            username?.focus();

            return false;
        }


        /* Password */

        if (
            !password ||
            password.value.length < 8
        ) {

            setFieldInvalid(
                password,
                true
            );

            showAlert(
                "Password must contain at least 8 characters."
            );

            password?.focus();

            return false;
        }


        if (
            !/[A-Z]/.test(
                password.value
            ) ||
            !/[a-z]/.test(
                password.value
            ) ||
            !/\d/.test(
                password.value
            )
        ) {

            setFieldInvalid(
                password,
                true
            );

            showAlert(
                "Password must contain at least one uppercase letter, one lowercase letter and one number."
            );

            password?.focus();

            return false;
        }


        /* Confirm password */

        if (
            !checkPasswordMatch()
        ) {

            setFieldInvalid(
                confirmPassword,
                true
            );

            showAlert(
                "Password confirmation does not match."
            );

            confirmPassword?.focus();

            return false;
        }


        /* Plan */

        const selectedPlan =
            getSelectedPlan();

        if (!selectedPlan) {

            showAlert(
                "Please select a subscription plan."
            );

            return false;
        }


        /* Dates */

        if (
            !startDate ||
            !startDate.value
        ) {

            setFieldInvalid(
                startDate,
                true
            );

            showAlert(
                "Subscription start date is required."
            );

            startDate?.focus();

            return false;
        }


        if (
            startDate.value <
            getToday()
        ) {

            setFieldInvalid(
                startDate,
                true
            );

            showAlert(
                "Subscription start date cannot be before today."
            );

            startDate.focus();

            return false;
        }


        if (
            !duration ||
            !duration.value
        ) {

            setFieldInvalid(
                duration,
                true
            );

            showAlert(
                "Subscription duration is required."
            );

            duration?.focus();

            return false;
        }


        if (
            !endDate ||
            !endDate.value
        ) {

            calculateEndDate();
        }


        return true;
    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function setLoading(
        loading
    ) {

        if (!createButton) {
            return;
        }

        if (loading) {

            createButton.disabled =
                true;

            createButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Creating Vendor...</span>
            `;

        } else {

            createButton.disabled =
                false;

            createButton.innerHTML =
                state.originalButtonHTML;
        }
    }


    /* =====================================================
       RESPONSE PARSER
    ===================================================== */

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

            return {
                type: "json",
                data: await response.json()
            };
        }


        return {
            type: "html",
            data: await response.text()
        };
    }


    /* =====================================================
       SERVER ERROR EXTRACTION
    ===================================================== */

    function extractServerError(
        data
    ) {

        if (!data) {
            return "Unable to create vendor.";
        }


        if (
            typeof data === "string"
        ) {

            return (
                "Server returned an unexpected response."
            );
        }


        if (data.message) {
            return data.message;
        }


        if (data.error) {
            return data.error;
        }


        if (data.detail) {
            return data.detail;
        }


        /*
         * Django validation style:
         *
         * {
         *   "email": ["Already exists"]
         * }
         */

        if (
            typeof data === "object"
        ) {

            const messages = [];

            Object.entries(data)
                .forEach(
                    ([field, errors]) => {

                        if (
                            Array.isArray(
                                errors
                            )
                        ) {

                            errors.forEach(
                                error => {

                                    messages.push(
                                        `${field}: ${error}`
                                    );

                                }
                            );

                        } else if (
                            typeof errors ===
                            "string"
                        ) {

                            messages.push(
                                `${field}: ${errors}`
                            );
                        }
                    }
                );

            if (messages.length) {
                return messages.join(
                    " | "
                );
            }
        }


        return "Unable to create vendor.";
    }


    /* =====================================================
       SUCCESS MODAL
    ===================================================== */

    function openSuccessModal(
        data = {}
    ) {

        if (!successModal) {
            return;
        }


        if (successModalMessage) {

            successModalMessage.textContent =
                data.message ||
                "The vendor account, subscription and license have been created successfully.";
        }


        /*
         * Username
         */

        const returnedUsername =
            data.username ||
            data.vendor_username ||
            data.vendor?.username ||
            trimValue(username);


        if (
            returnedUsername &&
            createdUsername
        ) {

            createdUsername.textContent =
                returnedUsername;

            createdCredentials
                ?.classList.add(
                    "show"
                );
        }


        /*
         * License
         */

        const license =
            data.license_key ||
            data.license ||
            data.vendor_license?.key ||
            data.vendor?.license_key;


        if (
            license &&
            createdLicense
        ) {

            createdLicense.textContent =
                license;

            createdCredentials
                ?.classList.add(
                    "show"
                );
        }


        successModal.classList.add(
            "show"
        );

        successModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            () => {

                closeSuccessModal
                    ?.focus();

            },
            100
        );
    }


    function closeSuccess() {

        if (!successModal) {
            return;
        }

        successModal.classList.remove(
            "show"
        );

        successModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }


    /* =====================================================
       SUCCESS MODAL EVENTS
    ===================================================== */

    closeSuccessModal?.addEventListener(
        "click",
        () => {

            closeSuccess();

            resetForm(
                false
            );
        }
    );


    successModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                successModal
            ) {

                closeSuccess();
            }
        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            if (
                successModal?.classList.contains(
                    "show"
                )
            ) {

                closeSuccess();
            }
        }
    );


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                state.submitting
            ) {
                return;
            }


            if (
                !validateForm()
            ) {
                return;
            }


            state.submitting =
                true;

            hideAlert();

            setLoading(
                true
            );


            /*
             * Recalculate immediately before
             * sending to backend.
             */

            calculateEndDate();


            const formData =
                new FormData(form);


            /*
             * Make sure calculated expiry
             * is included.
             */

            if (
                endDate &&
                endDate.value
            ) {

                formData.set(
                    "end_date",
                    endDate.value
                );
            }


            /*
             * Abort controller prevents
             * hanging requests.
             */

            state.abortController =
                new AbortController();


            /*
             * 30 second timeout.
             */

            const timeout =
                setTimeout(
                    () => {

                        state.abortController
                            ?.abort();

                    },
                    30000
                );


            try {

                const response =
                    await fetch(
                        form.action,
                        {
                            method: "POST",

                            body: formData,

                            headers: {

                                "X-CSRFToken":
                                    getCSRFToken(),

                                "X-Requested-With":
                                    "XMLHttpRequest",

                                "Accept":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            redirect:
                                "follow",

                            signal:
                                state.abortController
                                    .signal
                        }
                    );


                clearTimeout(
                    timeout
                );


                const parsed =
                    await parseResponse(
                        response
                    );


                /* =========================================
                   JSON
                ========================================= */

                if (
                    parsed.type ===
                    "json"
                ) {

                    const data =
                        parsed.data;


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            extractServerError(
                                data
                            )
                        );
                    }


                    if (
                        data.success ===
                        false
                    ) {

                        throw new Error(
                            extractServerError(
                                data
                            )
                        );
                    }


                    /*
                     * Successful backend
                     * response.
                     */

                    state.created =
                        true;


                    showAlert(
                        data.message ||
                        "Vendor created successfully.",
                        "success"
                    );


                    openSuccessModal(
                        data
                    );


                    return;
                }


                /* =========================================
                   HTML / DJANGO REDIRECT
                ========================================= */

                if (
                    !response.ok
                ) {

                    throw new Error(
                        `Server error (${response.status}).`
                    );
                }


                /*
                 * Django redirect after POST.
                 */

                if (
                    response.redirected &&
                    response.url
                ) {

                    window.location.href =
                        response.url;

                    return;
                }


                /*
                 * If HTML is returned
                 * without redirect, reload
                 * the form endpoint.
                 */

                window.location.href =
                    form.action;

            } catch (error) {

                clearTimeout(
                    timeout
                );


                console.error(
                    "[VendorCreate] Submit Error:",
                    error
                );


                if (
                    error.name ===
                    "AbortError"
                ) {

                    showAlert(
                        "Request timed out. Please check your connection and try again."
                    );

                } else {

                    showAlert(
                        error.message ||
                        "Something went wrong while creating the vendor."
                    );
                }

            } finally {

                state.submitting =
                    false;

                state.abortController =
                    null;

                setLoading(
                    false
                );
            }
        }
    );


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetForm(
        askConfirmation = true
    ) {

        if (
            askConfirmation &&
            !window.confirm(
                "Are you sure you want to reset this form?"
            )
        ) {
            return;
        }


        form.reset();

        clearAllFieldErrors();

        hideAlert();


        /*
         * Default values
         */

        initializeStartDate();


        if (duration) {

            duration.value =
                "365";
        }


        if (accountStatus) {

            accountStatus.value =
                "active";
        }


        const basicPlan =
            form.querySelector(
                'input[name="plan"][value="basic"]'
            );

        if (basicPlan) {

            basicPlan.checked =
                true;
        }


        /*
         * Clear password
         */

        if (password) {
            password.value = "";
        }

        if (confirmPassword) {
            confirmPassword.value = "";
        }


        /*
         * Recalculate
         */

        updateVendorPreview();

        updatePlanSummary();

        updateDurationSummary();

        updateStatusSummary();

        updatePasswordStrength();

        checkPasswordMatch();

        calculateEndDate();


        /*
         * Reset generated data.
         */

        createdCredentials
            ?.classList.remove(
                "show"
            );

        if (createdUsername) {
            createdUsername.textContent =
                "—";
        }

        if (createdLicense) {
            createdLicense.textContent =
                "Generated";
        }


        state.created =
            false;
    }


    resetButton?.addEventListener(
        "click",
        () => {

            resetForm(
                true
            );
        }
    );


    /* =====================================================
       LIVE VALIDATION / ALERT CLEAR
    ===================================================== */

    form
        .querySelectorAll(
            "input, textarea, select"
        )
        .forEach(
            field => {

                field.addEventListener(
                    "input",
                    () => {

                        clearFieldError(
                            field
                        );

                        if (
                            formAlert?.classList.contains(
                                "show"
                            )
                        ) {

                            hideAlert();
                        }

                    }
                );


                field.addEventListener(
                    "change",
                    () => {

                        clearFieldError(
                            field
                        );
                    }
                );
            }
        );


    /* =====================================================
       ENTER KEY PROTECTION
    ===================================================== */

    form.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Enter"
            ) {
                return;
            }


            /*
             * Allow Enter inside textarea.
             */

            if (
                event.target.tagName
                    .toLowerCase() ===
                "textarea"
            ) {
                return;
            }


            /*
             * Prevent accidental
             * duplicate submit.
             */

            if (
                state.submitting
            ) {

                event.preventDefault();
            }
        }
    );


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    initializeStartDate();

    updateVendorPreview();

    updatePlanSummary();

    updateDurationSummary();

    updateStatusSummary();

    updatePasswordStrength();

    checkPasswordMatch();

    calculateEndDate();


    console.log(
        "[VendorCreate] Production controller initialized."
    );

});