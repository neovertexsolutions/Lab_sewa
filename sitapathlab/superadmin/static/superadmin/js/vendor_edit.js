/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * VENDOR EDIT
 *
 * Production Controller
 *
 * IMPORTANT:
 * - No dummy data
 * - Uses actual Django form endpoint
 * - Uses CSRF
 * - Uses real database response
 * - Handles JSON + Django redirects
 * - Handles validation errors
 * - Prevents duplicate submissions
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ROOT
    ===================================================== */

    const page =
        document.getElementById("vendorEditPage");

    const form =
        document.getElementById("vendorEditForm");

    if (!page || !form) {
        console.error(
            "[VendorEdit] Required DOM elements not found."
        );
        return;
    }


    /* =====================================================
       DOM HELPER
    ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


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

    const username =
        $("username");

    const status =
        $("status");

    const password =
        $("password");

    const confirmPassword =
        $("confirmPassword");

    const passwordMatch =
        $("passwordMatch");

    const formAlert =
        $("formAlert");

    const saveButton =
        $("saveVendorBtn");

    const modal =
        $("saveConfirmModal");

    const confirmSaveButton =
        $("confirmSave");

    const cancelSaveButton =
        $("cancelSave");

    const previewName =
        $("previewName");

    const previewEmail =
        $("previewEmail");

    const previewUsername =
        $("previewUsername");

    const previewStatus =
        $("previewStatus");

    const vendorAvatar =
        $("vendorAvatar");


    /* =====================================================
       STATE
    ===================================================== */

    const stateManager = {

        submitting: false,

        dirty: false,

        initialData: null

    };


    /* =====================================================
       URLS
    ===================================================== */

    const urls = {

        update:
            page.dataset.updateUrl || form.action,

        detail:
            page.dataset.detailUrl || "",

        list:
            page.dataset.listUrl || ""

    };


    /* =====================================================
       CSRF
    ===================================================== */

    function getCookie(name) {

        const cookies =
            document.cookie.split(";");

        for (const cookie of cookies) {

            const item =
                cookie.trim();

            if (
                item.startsWith(
                    `${name}=`
                )
            ) {

                return decodeURIComponent(
                    item.substring(
                        name.length + 1
                    )
                );
            }
        }

        return "";
    }


    function getCSRFToken() {

        const cookieToken =
            getCookie("csrftoken");

        if (cookieToken) {
            return cookieToken;
        }

        return (
            form.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            )?.value || ""
        );
    }


    /* =====================================================
       ESCAPE
    ===================================================== */

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

            success:
                "fa-circle-check",

            warning:
                "fa-triangle-exclamation"

        };

        formAlert.className =
            `form-alert show ${type}`;

        formAlert.innerHTML = `
            <i class="fa-solid ${
                icons[type] ||
                icons.error
            }"></i>

            <span>
                ${escapeHTML(message)}
            </span>
        `;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
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

    function setInvalid(
        field,
        invalid = true
    ) {

        if (!field) {
            return;
        }

        const wrapper =
            field.closest(
                ".input-wrapper, .textarea-wrapper, .select-wrapper"
            );

        if (!wrapper) {
            return;
        }

        wrapper.classList.toggle(
            "invalid",
            invalid
        );
    }


    function clearInvalid(field) {

        setInvalid(
            field,
            false
        );
    }


    /* =====================================================
       PREVIEW
    ===================================================== */

    function updatePreview() {

        const name =
            vendorName?.value.trim() ||
            "Vendor";

        const mail =
            email?.value.trim() ||
            "—";

        const user =
            username?.value.trim() ||
            "—";

        const accountStatus =
            status?.value ||
            "—";

        if (previewName) {

            previewName.textContent =
                name;
        }

        if (previewEmail) {

            previewEmail.textContent =
                mail;
        }

        if (previewUsername) {

            previewUsername.textContent =
                user;
        }

        if (previewStatus) {

            previewStatus.textContent =
                accountStatus
                    .charAt(0)
                    .toUpperCase() +
                accountStatus.slice(1);
        }

        if (vendorAvatar) {

            vendorAvatar.textContent =
                name
                    .charAt(0)
                    .toUpperCase() ||
                "V";
        }
    }


    vendorName?.addEventListener(
        "input",
        () => {

            stateManager.dirty =
                true;

            updatePreview();
        }
    );


    email?.addEventListener(
        "input",
        () => {

            stateManager.dirty =
                true;

            updatePreview();
        }
    );


    username?.addEventListener(
        "input",
        updatePreview
    );


    status?.addEventListener(
        "change",
        () => {

            stateManager.dirty =
                true;

            updatePreview();
        }
    );


    /* =====================================================
       INPUT SANITIZATION
    ===================================================== */

    function sanitizePhone(field) {

        if (!field) {
            return;
        }

        field.value =
            field.value
                .replace(/\D/g, "")
                .slice(0, 10);
    }


    phone?.addEventListener(
        "input",
        () => {

            sanitizePhone(phone);

            stateManager.dirty =
                true;
        }
    );


    alternatePhone?.addEventListener(
        "input",
        () => {

            sanitizePhone(
                alternatePhone
            );

            stateManager.dirty =
                true;
        }
    );


    pincode?.addEventListener(
        "input",
        () => {

            pincode.value =
                pincode.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

            stateManager.dirty =
                true;
        }
    );


    /* =====================================================
       PASSWORD VISIBILITY
    ===================================================== */

    document
        .querySelectorAll(
            ".password-toggle"
        )
        .forEach(button => {

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
                        button.querySelector("i");

                    const visible =
                        target.type ===
                        "text";

                    target.type =
                        visible
                            ? "password"
                            : "text";

                    if (icon) {

                        icon.classList.toggle(
                            "fa-eye",
                            visible
                        );

                        icon.classList.toggle(
                            "fa-eye-slash",
                            !visible
                        );
                    }

                    button.setAttribute(
                        "aria-label",
                        visible
                            ? "Show password"
                            : "Hide password"
                    );
                }
            );

        });


    /* =====================================================
       PASSWORD MATCH
    ===================================================== */

    function checkPasswordMatch() {

        if (
            !password ||
            !confirmPassword
        ) {
            return true;
        }

        const newPassword =
            password.value;

        const confirm =
            confirmPassword.value;

        if (
            !newPassword &&
            !confirm
        ) {

            if (passwordMatch) {

                passwordMatch.textContent =
                    "";
            }

            return true;
        }

        if (
            newPassword !==
            confirm
        ) {

            if (passwordMatch) {

                passwordMatch.textContent =
                    "Passwords do not match";

                passwordMatch.style.color =
                    "#ef4444";
            }

            setInvalid(
                confirmPassword,
                true
            );

            return false;
        }

        if (passwordMatch) {

            passwordMatch.textContent =
                "Passwords match";

            passwordMatch.style.color =
                "#16a34a";
        }

        clearInvalid(
            confirmPassword
        );

        return true;
    }


    password?.addEventListener(
        "input",
        () => {

            stateManager.dirty =
                true;

            checkPasswordMatch();

        }
    );


    confirmPassword?.addEventListener(
        "input",
        () => {

            stateManager.dirty =
                true;

            checkPasswordMatch();

        }
    );


    /* =====================================================
       VALIDATION HELPERS
    ===================================================== */

    function isValidEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(value);
    }


    function requireField(
        field,
        message
    ) {

        if (!field) {
            return true;
        }

        if (!field.value.trim()) {

            setInvalid(
                field,
                true
            );

            showAlert(message);

            field.focus();

            return false;
        }

        clearInvalid(field);

        return true;
    }


    /* =====================================================
       FORM VALIDATION
    ===================================================== */

    function validateForm() {

        hideAlert();

        if (
            !requireField(
                vendorName,
                "Laboratory name is required."
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
                email.value.trim()
            )
        ) {

            setInvalid(
                email,
                true
            );

            showAlert(
                "Please enter a valid business email."
            );

            email.focus();

            return false;
        }


        if (
            !phone ||
            phone.value.length !== 10
        ) {

            setInvalid(
                phone,
                true
            );

            showAlert(
                "Phone number must contain exactly 10 digits."
            );

            phone?.focus();

            return false;
        }


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


        if (
            !pincode ||
            pincode.value.length !== 6
        ) {

            setInvalid(
                pincode,
                true
            );

            showAlert(
                "PIN code must contain exactly 6 digits."
            );

            pincode?.focus();

            return false;
        }


        /*
         * Password is optional during edit.
         */

        if (
            password &&
            password.value &&
            password.value.length < 8
        ) {

            setInvalid(
                password,
                true
            );

            showAlert(
                "New password must contain at least 8 characters."
            );

            password.focus();

            return false;
        }


        if (
            !checkPasswordMatch()
        ) {

            showAlert(
                "New password and confirmation do not match."
            );

            confirmPassword?.focus();

            return false;
        }


        if (
            !status ||
            !status.value
        ) {

            setInvalid(
                status,
                true
            );

            showAlert(
                "Account status is required."
            );

            status?.focus();

            return false;
        }


        return true;
    }


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    function setLoading(
        loading
    ) {

        if (!saveButton) {
            return;
        }

        if (loading) {

            saveButton.disabled =
                true;

            saveButton.dataset
                .originalHtml =
                saveButton.innerHTML;

            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving Changes...
            `;

        } else {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                saveButton.dataset
                    .originalHtml ||
                `
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save Changes
                `;
        }
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal() {

        if (!modal) {
            submitChanges();
            return;
        }

        modal.classList.add(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(() => {

            confirmSaveButton?.focus();

        }, 50);
    }


    function closeModal() {

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }


    cancelSaveButton?.addEventListener(
        "click",
        closeModal
    );


    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {
                closeModal();
            }
        }
    );


    /* =====================================================
       ERROR NORMALIZER
    ===================================================== */

    function extractServerMessage(
        data
    ) {

        if (!data) {

            return "Unable to update vendor.";
        }


        if (
            typeof data.message ===
            "string"
        ) {

            return data.message;
        }


        if (
            typeof data.error ===
            "string"
        ) {

            return data.error;
        }


        if (
            typeof data.detail ===
            "string"
        ) {

            return data.detail;
        }


        if (
            typeof data.errors ===
            "object"
        ) {

            const messages = [];

            Object.entries(
                data.errors
            ).forEach(
                ([field, errors]) => {

                    if (
                        Array.isArray(errors)
                    ) {

                        errors.forEach(
                            error => {

                                messages.push(
                                    `${field}: ${error}`
                                );
                            }
                        );

                    } else {

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


        return "Unable to update vendor.";
    }


    /* =====================================================
       APPLY SERVER FIELD ERRORS
    ===================================================== */

    function applyServerErrors(
        data
    ) {

        if (
            !data ||
            !data.errors
        ) {
            return;
        }

        Object.entries(
            data.errors
        ).forEach(
            ([fieldName]) => {

                const field =
                    form.querySelector(
                        `[name="${fieldName}"]`
                    );

                if (field) {

                    setInvalid(
                        field,
                        true
                    );
                }
            }
        );
    }


    /* =====================================================
       SUBMIT REAL DJANGO REQUEST
    ===================================================== */

    async function submitChanges() {

        if (
            stateManager.submitting
        ) {
            return;
        }


        if (
            !validateForm()
        ) {
            return;
        }


        stateManager.submitting =
            true;

        setLoading(true);

        hideAlert();


        /*
         * FormData contains the actual
         * values entered by admin.
         */

        const formData =
            new FormData(form);


        try {

            const response =
                await fetch(
                    urls.update,
                    {
                        method: "POST",

                        body: formData,

                        credentials:
                            "same-origin",

                        redirect:
                            "follow",

                        headers: {

                            "X-CSRFToken":
                                getCSRFToken(),

                            "X-Requested-With":
                                "XMLHttpRequest",

                            "Accept":
                                "application/json"

                        }
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            /* =================================================
               JSON RESPONSE
            ================================================= */

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                const data =
                    await response.json();


                if (!response.ok) {

                    applyServerErrors(
                        data
                    );

                    throw new Error(
                        extractServerMessage(
                            data
                        )
                    );
                }


                if (
                    data.success === false
                ) {

                    applyServerErrors(
                        data
                    );

                    throw new Error(
                        extractServerMessage(
                            data
                        )
                    );
                }


                /*
                 * Real Django backend
                 * confirmed successful update.
                 */

                stateManager.dirty =
                    false;

                showAlert(
                    data.message ||
                    "Vendor updated successfully.",
                    "success"
                );


                /*
                 * Backend can return
                 * redirect_url.
                 */

                if (
                    data.redirect_url
                ) {

                    window.location.href =
                        data.redirect_url;

                    return;
                }


                /*
                 * Otherwise go to
                 * vendor detail page.
                 */

                if (urls.detail) {

                    window.location.href =
                        urls.detail;

                    return;
                }

                return;
            }


            /* =================================================
               DJANGO REDIRECT / HTML
            ================================================= */

            if (!response.ok) {

                throw new Error(
                    `Server returned HTTP ${response.status}.`
                );
            }


            /*
             * Standard Django POST -> redirect
             */

            if (
                response.redirected &&
                response.url
            ) {

                stateManager.dirty =
                    false;

                window.location.href =
                    response.url;

                return;
            }


            /*
             * If backend returned HTML
             * without redirect, reload the
             * detail page instead of inventing
             * a success response.
             */

            if (urls.detail) {

                stateManager.dirty =
                    false;

                window.location.href =
                    urls.detail;

                return;
            }


            showAlert(
                "Vendor was processed successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "[VendorEdit] Update error:",
                error
            );

            showAlert(
                error.message ||
                "Unable to update vendor. Please try again.",
                "error"
            );

        } finally {

            stateManager.submitting =
                false;

            setLoading(false);

            closeModal();
        }
    }


    /* =====================================================
       SAVE CLICK
    ===================================================== */

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (
                stateManager.submitting
            ) {
                return;
            }

            if (
                !validateForm()
            ) {
                return;
            }

            openModal();
        }
    );


    confirmSaveButton?.addEventListener(
        "click",
        submitChanges
    );


    /* =====================================================
       INPUT TRACKING
    ===================================================== */

    form
        .querySelectorAll(
            "input, textarea, select"
        )
        .forEach(field => {

            field.addEventListener(
                "input",
                () => {

                    stateManager.dirty =
                        true;

                    clearInvalid(
                        field
                    );

                    if (
                        formAlert?.classList
                            .contains("show")
                    ) {
                        hideAlert();
                    }
                }
            );


            field.addEventListener(
                "change",
                () => {

                    stateManager.dirty =
                        true;

                    clearInvalid(
                        field
                    );
                }
            );

        });


    /* =====================================================
       UNSAVED CHANGES PROTECTION
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        event => {

            if (
                stateManager.dirty &&
                !stateManager.submitting
            ) {

                event.preventDefault();

                event.returnValue = "";
            }
        }
    );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            if (
                modal?.classList
                    .contains("show")
            ) {

                closeModal();
            }
        }
    );


    /* =====================================================
       INITIAL DATA SNAPSHOT
    ===================================================== */

    function captureInitialData() {

        stateManager.initialData =
            new FormData(form);
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updatePreview();

    checkPasswordMatch();

    captureInitialData();

    console.log(
        "[VendorEdit] Production controller initialized.",
        {
            vendorId:
                page.dataset.vendorId,

            updateUrl:
                urls.update
        }
    );

});