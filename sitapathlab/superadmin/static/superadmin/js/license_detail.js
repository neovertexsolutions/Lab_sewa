/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * LICENSE DETAIL
 * Production JavaScript
 * ============================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       DOM
    ======================================================== */

    const licenseKey = document.getElementById("licenseKey");

    const toggleKeyBtn =
        document.getElementById("toggleKeyBtn");

    const copyLicenseBtn =
        document.getElementById("copyLicenseBtn");

    const copyKeyIconBtn =
        document.getElementById("copyKeyIconBtn");

    const renewLicenseBtn =
        document.getElementById("renewLicenseBtn");

    const quickRenewBtn =
        document.getElementById("quickRenewBtn");

    const suspendBtn =
        document.getElementById("suspendBtn");

    const revokeBtn =
        document.getElementById("revokeBtn");

    const expiryDate =
        document.getElementById("expiryDate");

    const daysRemaining =
        document.getElementById("daysRemaining");

    const licenseProgress =
        document.getElementById("licenseProgress");

    const licenseProgressText =
        document.getElementById("licenseProgressText");


    /* ========================================================
       MODAL
    ======================================================== */

    const actionModal =
        document.getElementById("actionModal");

    const modalClose =
        document.getElementById("modalClose");

    const cancelAction =
        document.getElementById("cancelAction");

    const confirmAction =
        document.getElementById("confirmAction");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalMessage =
        document.getElementById("modalMessage");

    const modalIcon =
        document.getElementById("modalIcon");


    let pendingAction = null;


    /* ========================================================
       TOAST
    ======================================================== */

    const toastContainer =
        document.getElementById("toastContainer");


    function showToast(message, type = "success") {

        if (!toastContainer) return;

        const toast =
            document.createElement("div");

        toast.className = "toast";

        let icon = "fa-circle-check";

        if (type === "error") {
            icon = "fa-circle-xmark";
        }

        if (type === "warning") {
            icon = "fa-triangle-exclamation";
        }

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform =
                "translateY(10px)";

            setTimeout(() => {
                toast.remove();
            }, 250);

        }, 3000);
    }


    /* ========================================================
       ESCAPE HTML
    ======================================================== */

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent = value;

        return div.innerHTML;
    }


    /* ========================================================
       LICENSE KEY VISIBILITY
    ======================================================== */

    if (toggleKeyBtn && licenseKey) {

        toggleKeyBtn.addEventListener("click", () => {

            const icon =
                toggleKeyBtn.querySelector("i");

            if (licenseKey.type === "password") {

                licenseKey.type = "text";

                if (icon) {
                    icon.classList.remove(
                        "fa-eye"
                    );

                    icon.classList.add(
                        "fa-eye-slash"
                    );
                }

            } else {

                licenseKey.type = "password";

                if (icon) {
                    icon.classList.remove(
                        "fa-eye-slash"
                    );

                    icon.classList.add(
                        "fa-eye"
                    );
                }

            }

        });

    }


    /* ========================================================
       COPY LICENSE KEY
    ======================================================== */

    async function copyLicenseKey() {

        if (!licenseKey) return;

        const value =
            licenseKey.value.trim();

        if (!value) {

            showToast(
                "License key is not available.",
                "error"
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                value
            );

            showToast(
                "License key copied successfully."
            );

        } catch (error) {

            /*
             * Fallback for older browsers
             */

            licenseKey.type = "text";

            licenseKey.select();

            document.execCommand("copy");

            licenseKey.setSelectionRange(0, 0);

            licenseKey.type = "password";

            showToast(
                "License key copied successfully."
            );
        }

    }


    if (copyLicenseBtn) {

        copyLicenseBtn.addEventListener(
            "click",
            copyLicenseKey
        );

    }


    if (copyKeyIconBtn) {

        copyKeyIconBtn.addEventListener(
            "click",
            copyLicenseKey
        );

    }


    /* ========================================================
       MODAL
    ======================================================== */

    function openModal(
        action,
        title,
        message,
        icon
    ) {

        pendingAction = action;

        modalTitle.textContent = title;

        modalMessage.textContent = message;

        modalIcon.innerHTML =
            `<i class="fa-solid ${icon}"></i>`;

        actionModal.classList.add("show");

        actionModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";

    }


    function closeModal() {

        actionModal.classList.remove("show");

        actionModal.setAttribute(
            "aria-hidden",
            "true"
        );

        pendingAction = null;

        document.body.style.overflow = "";

    }


    if (modalClose) {
        modalClose.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelAction) {
        cancelAction.addEventListener(
            "click",
            closeModal
        );
    }


    if (actionModal) {

        actionModal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === actionModal
                ) {
                    closeModal();
                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {
                closeModal();
            }

        }
    );


    /* ========================================================
       RENEW
    ======================================================== */

    function requestRenew() {

        openModal(
            "renew",
            "Renew License",
            "Are you sure you want to renew this vendor license?",
            "fa-rotate"
        );

    }


    if (renewLicenseBtn) {

        renewLicenseBtn.addEventListener(
            "click",
            requestRenew
        );

    }


    if (quickRenewBtn) {

        quickRenewBtn.addEventListener(
            "click",
            requestRenew
        );

    }


    /* ========================================================
       SUSPEND
    ======================================================== */

    if (suspendBtn) {

        suspendBtn.addEventListener(
            "click",
            () => {

                openModal(
                    "suspend",
                    "Suspend License",
                    "The vendor will immediately lose access to the laboratory management system.",
                    "fa-pause"
                );

            }
        );

    }


    /* ========================================================
       REVOKE
    ======================================================== */

    if (revokeBtn) {

        revokeBtn.addEventListener(
            "click",
            () => {

                openModal(
                    "revoke",
                    "Revoke License",
                    "This action will permanently invalidate the current license key.",
                    "fa-ban"
                );

            }
        );

    }


    /* ========================================================
       CONFIRM ACTION
    ======================================================== */

    if (confirmAction) {

        confirmAction.addEventListener(
            "click",
            async () => {

                if (!pendingAction) {
                    return;
                }

                const action =
                    pendingAction;

                confirmAction.disabled = true;

                confirmAction.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Processing...
                `;


                /*
                 * =================================================
                 * PRODUCTION NOTE
                 * =================================================
                 *
                 * Yahan Django API endpoint connect karna hai.
                 *
                 * Example:
                 *
                 * fetch("/superadmin/api/licenses/123/renew/", {
                 *     method: "POST",
                 *     headers: {
                 *         "X-CSRFToken": getCsrfToken()
                 *     }
                 * })
                 *
                 * =================================================
                 */


                try {

                    /*
                     * Demo delay.
                     * Replace this with Django fetch().
                     */

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                700
                            )
                    );


                    if (action === "renew") {

                        showToast(
                            "License renewal request completed."
                        );

                    }

                    if (action === "suspend") {

                        showToast(
                            "License has been suspended.",
                            "warning"
                        );

                    }

                    if (action === "revoke") {

                        showToast(
                            "License has been revoked.",
                            "error"
                        );

                    }

                    closeModal();

                } catch (error) {

                    console.error(
                        "License action error:",
                        error
                    );

                    showToast(
                        "Unable to process the request.",
                        "error"
                    );

                } finally {

                    confirmAction.disabled = false;

                    confirmAction.innerHTML =
                        "Confirm";

                }

            }
        );

    }


    /* ========================================================
       LICENSE COUNTDOWN
    ======================================================== */

    function calculateLicenseStatus() {

        if (!expiryDate || !daysRemaining) {
            return;
        }

        const rawDate =
            expiryDate.textContent.trim();

        if (!rawDate || rawDate === "-") {

            daysRemaining.textContent =
                "Not available";

            return;
        }


        const expiry =
            new Date(rawDate);


        if (Number.isNaN(expiry.getTime())) {

            daysRemaining.textContent =
                "Active";

            return;
        }


        const now =
            new Date();


        const difference =
            expiry.getTime() -
            now.getTime();


        const day =
            1000 *
            60 *
            60 *
            24;


        const remaining =
            Math.ceil(
                difference / day
            );


        if (remaining <= 0) {

            daysRemaining.textContent =
                "Expired";

            if (licenseProgress) {
                licenseProgress.style.width =
                    "100%";
            }

            if (licenseProgressText) {
                licenseProgressText.textContent =
                    "Expired";
            }

            return;
        }


        daysRemaining.textContent =
            `${remaining} day${remaining === 1 ? "" : "s"}`;


        if (remaining <= 7) {

            daysRemaining.style.color =
                "#dc2626";

        } else if (remaining <= 30) {

            daysRemaining.style.color =
                "#d97706";

        }

    }


    calculateLicenseStatus();


    /* ========================================================
       PERIODIC CHECK
    ======================================================== */

    setInterval(
        calculateLicenseStatus,
        60 * 60 * 1000
    );


    /* ========================================================
       PREVENT DOUBLE SUBMISSION
    ======================================================== */

    document
        .querySelectorAll(
            "button[type='submit']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.form &&
                        !button.form.checkValidity()
                    ) {
                        return;
                    }

                    button.disabled = true;

                    setTimeout(() => {

                        button.disabled =
                            false;

                    }, 5000);

                }
            );

        });


    /* ========================================================
       CONSOLE
    ======================================================== */

    console.info(
        "Sita Path Lab | License Detail initialized"
    );

});