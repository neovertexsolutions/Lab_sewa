/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * SECURITY SETTINGS
 * Production JavaScript
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const saveButton =
        document.getElementById("saveSecurityBtn");

    const securityProgress =
        document.getElementById("securityProgress");

    const securityScore =
        document.getElementById("securityScore");

    const lastUpdated =
        document.getElementById("lastUpdated");

    const modal =
        document.getElementById("securityModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalMessage =
        document.getElementById("modalMessage");

    const modalConfirm =
        document.getElementById("modalConfirm");

    const modalCancel =
        document.getElementById("modalCancel");

    const modalClose =
        document.getElementById("modalClose");

    const modalBackdrop =
        modal.querySelector(".modal-backdrop");

    const logoutAllSessions =
        document.getElementById("logoutAllSessions");

    const rotateApiKeys =
        document.getElementById("rotateApiKeys");

    const viewAuditLogs =
        document.getElementById("viewAuditLogs");

    const toast =
        document.getElementById("securityToast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");

    const toastClose =
        document.getElementById("toastClose");


    /* =====================================================
       SECURITY SCORE
    ===================================================== */

    function updateSecurityScore() {

        const switches =
            document.querySelectorAll(
                '.settings-card input[type="checkbox"]'
            );

        let enabled = 0;
        let total = 0;

        switches.forEach(input => {

            total++;

            if (input.checked) {
                enabled++;
            }

        });

        /*
         * Base score.
         * Backend should ultimately calculate the real
         * security score.
         */

        const score = total
            ? Math.round((enabled / total) * 100)
            : 0;

        securityScore.textContent = score;

        const circumference = 326.7;

        const offset =
            circumference -
            (circumference * score / 100);

        securityProgress.style.strokeDashoffset =
            offset;

    }


    document
        .querySelectorAll(
            '.settings-card input[type="checkbox"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                updateSecurityScore
            );

        });


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;

    function showToast(
        title,
        message,
        type = "success"
    ) {

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        const icon =
            toast.querySelector(".toast-icon i");

        if (type === "error") {

            icon.className =
                "fa-solid fa-circle-exclamation";

        } else {

            icon.className =
                "fa-solid fa-check";

        }

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 4000);

    }


    toastClose.addEventListener(
        "click",
        () => toast.classList.remove("show")
    );


    /* =====================================================
       MODAL
    ===================================================== */

    let modalAction = null;

    function openModal(
        title,
        message,
        action
    ) {

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        modalAction = action;

        modal.classList.add("active");

        document.body.style.overflow = "hidden";

    }


    function closeModal() {

        modal.classList.remove("active");

        document.body.style.overflow = "";

        modalAction = null;

    }


    modalClose.addEventListener(
        "click",
        closeModal
    );

    modalCancel.addEventListener(
        "click",
        closeModal
    );

    modalBackdrop.addEventListener(
        "click",
        closeModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains("active")
            ) {

                closeModal();

            }

        }
    );


    modalConfirm.addEventListener(
        "click",
        async () => {

            if (!modalAction) {
                closeModal();
                return;
            }

            modalConfirm.disabled = true;

            modalConfirm.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Processing...
            `;

            try {

                await modalAction();

            } finally {

                modalConfirm.disabled = false;

                modalConfirm.innerHTML =
                    "Confirm";

                closeModal();

            }

        }
    );


    /* =====================================================
       SAVE SECURITY SETTINGS
    ===================================================== */

    saveButton.addEventListener(
        "click",
        async () => {

            saveButton.disabled = true;

            const originalHTML =
                saveButton.innerHTML;

            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;


            /*
             * Collect settings.
             *
             * In production this object should be sent
             * to your Django API using fetch().
             */

            const settings = {};

            const fields =
                document.querySelectorAll(
                    "input[name], select[name]"
                );

            fields.forEach(field => {

                if (field.type === "checkbox") {

                    settings[field.name] =
                        field.checked;

                } else {

                    settings[field.name] =
                        field.value;

                }

            });


            console.log(
                "Security Settings:",
                settings
            );


            /*
             * Example production API:
             *
             * const response = await fetch(
             *     "/superadmin/api/security-settings/",
             *     {
             *         method: "POST",
             *         headers: {
             *             "Content-Type": "application/json",
             *             "X-CSRFToken": getCSRFToken()
             *         },
             *         body: JSON.stringify(settings)
             *     }
             * );
             */


            await new Promise(
                resolve => setTimeout(resolve, 700)
            );


            saveButton.disabled = false;

            saveButton.innerHTML =
                originalHTML;

            lastUpdated.textContent =
                "Just now";

            showToast(
                "Security Settings Saved",
                "Your security configuration has been updated."
            );

        }
    );


    /* =====================================================
       LOGOUT ALL SESSIONS
    ===================================================== */

    logoutAllSessions.addEventListener(
        "click",
        () => {

            openModal(
                "Logout All Sessions?",
                "This will invalidate active sessions for users across the platform. Users will need to sign in again.",
                async () => {

                    /*
                     * Production API example:
                     *
                     * await fetch(
                     *     "/superadmin/api/logout-all-sessions/",
                     *     {
                     *         method: "POST",
                     *         headers: {
                     *             "X-CSRFToken":
                     *                 getCSRFToken()
                     *         }
                     *     }
                     * );
                     */

                    await new Promise(
                        resolve => setTimeout(resolve, 700)
                    );

                    showToast(
                        "Sessions Invalidated",
                        "All active sessions have been invalidated."
                    );

                }
            );

        }
    );


    /* =====================================================
       ROTATE API KEYS
    ===================================================== */

    rotateApiKeys.addEventListener(
        "click",
        () => {

            openModal(
                "Rotate API Keys?",
                "Existing system API keys may stop working after rotation. Make sure connected applications are ready.",
                async () => {

                    /*
                     * Production API:
                     *
                     * POST
                     * /superadmin/api/rotate-api-keys/
                     */

                    await new Promise(
                        resolve => setTimeout(resolve, 700)
                    );

                    showToast(
                        "API Keys Rotated",
                        "System API credentials have been rotated."
                    );

                }
            );

        }
    );


    /* =====================================================
       VIEW AUDIT LOGS
    ===================================================== */

    viewAuditLogs.addEventListener(
        "click",
        () => {

            /*
             * Recommended Django URL:
             *
             * /superadmin/audit-logs/
             */

            window.location.href =
                "/superadmin/audit-logs/";

        }
    );


    /* =====================================================
       PASSWORD LENGTH VALIDATION
    ===================================================== */

    const passwordLength =
        document.getElementById(
            "minPasswordLength"
        );

    if (passwordLength) {

        passwordLength.addEventListener(
            "input",
            () => {

                let value =
                    parseInt(passwordLength.value, 10);

                if (Number.isNaN(value)) {
                    return;
                }

                if (value < 6) {
                    passwordLength.value = 6;
                }

                if (value > 32) {
                    passwordLength.value = 32;
                }

            }
        );

    }


    /* =====================================================
       LOGIN ATTEMPTS VALIDATION
    ===================================================== */

    const maxAttempts =
        document.getElementById(
            "maxAttempts"
        );

    if (maxAttempts) {

        maxAttempts.addEventListener(
            "input",
            () => {

                let value =
                    parseInt(maxAttempts.value, 10);

                if (Number.isNaN(value)) {
                    return;
                }

                if (value < 3) {
                    maxAttempts.value = 3;
                }

                if (value > 20) {
                    maxAttempts.value = 20;
                }

            }
        );

    }


    /* =====================================================
       API RATE LIMIT
    ===================================================== */

    const apiRequests =
        document.getElementById(
            "apiRequests"
        );

    if (apiRequests) {

        apiRequests.addEventListener(
            "input",
            () => {

                let value =
                    parseInt(apiRequests.value, 10);

                if (Number.isNaN(value)) {
                    return;
                }

                if (value < 10) {
                    apiRequests.value = 10;
                }

                if (value > 10000) {
                    apiRequests.value = 10000;
                }

            }
        );

    }


    /* =====================================================
       CSRF HELPER
    ===================================================== */

    function getCSRFToken() {

        const cookie =
            document.cookie
                .split("; ")
                .find(row =>
                    row.startsWith("csrftoken=")
                );

        return cookie
            ? decodeURIComponent(
                cookie.split("=")[1]
            )
            : "";

    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    updateSecurityScore();

});