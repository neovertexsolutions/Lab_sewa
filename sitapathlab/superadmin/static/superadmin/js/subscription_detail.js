/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * Subscription Details
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       DOM
       ===================================================== */

    const modal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const confirmModalBtn = document.getElementById("confirmModalBtn");

    const modalClose = document.getElementById("modalClose");
    const cancelModal = document.getElementById("cancelModal");

    const copyLicenseBtn = document.getElementById("copyLicenseBtn");
    const licenseKey = document.getElementById("licenseKey");

    let pendingAction = null;


    /* =====================================================
       MODAL
       ===================================================== */

    function openConfirmModal(title, message, callback) {

        if (!modal) return;

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        pendingAction = callback;

        modal.classList.add("show");

        document.body.style.overflow = "hidden";
    }


    function closeConfirmModal() {

        if (!modal) return;

        modal.classList.remove("show");

        document.body.style.overflow = "";

        pendingAction = null;
    }


    modalClose?.addEventListener("click", closeConfirmModal);

    cancelModal?.addEventListener("click", closeConfirmModal);


    modal?.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeConfirmModal();
        }

    });


    confirmModalBtn?.addEventListener("click", async () => {

        if (typeof pendingAction === "function") {

            await pendingAction();

        }

        closeConfirmModal();

    });


    /* =====================================================
       BACK
       ===================================================== */

    document.getElementById("backBtn")?.addEventListener(
        "click",
        () => {

            if (document.referrer) {

                window.history.back();

            } else {

                window.location.href =
                    "/superadmin/subscriptions/";

            }

        }
    );


    /* =====================================================
       COPY LICENSE
       ===================================================== */

    copyLicenseBtn?.addEventListener("click", async () => {

        const key = licenseKey?.textContent?.trim();

        if (!key) return;

        try {

            await navigator.clipboard.writeText(key);

            showToast(
                "License key copied successfully.",
                "success"
            );

            copyLicenseBtn.innerHTML =
                '<i class="fa-solid fa-check"></i>';

            setTimeout(() => {

                copyLicenseBtn.innerHTML =
                    '<i class="fa-regular fa-copy"></i>';

            }, 1800);

        } catch (error) {

            showToast(
                "Unable to copy license key.",
                "error"
            );

        }

    });


    /* =====================================================
       SUSPEND SUBSCRIPTION
       ===================================================== */

    document.getElementById("suspendBtn")
        ?.addEventListener("click", () => {

            openConfirmModal(
                "Suspend Subscription?",
                "The vendor will immediately lose access to the application.",
                async () => {

                    await suspendSubscription();

                }
            );

        });


    async function suspendSubscription() {

        /*
         * Production:
         * Replace this section with Django API request.
         *
         * Example:
         *
         * fetch("/api/superadmin/subscriptions/124/suspend/", {
         *     method: "POST",
         *     headers: {
         *         "X-CSRFToken": getCSRFToken()
         *     }
         * });
         */

        const status =
            document.getElementById("subscriptionStatus");

        if (status) {

            status.textContent = "Suspended";
            status.style.color = "#dc2626";

        }

        showToast(
            "Subscription suspended successfully.",
            "success"
        );

    }


    /* =====================================================
       RENEW
       ===================================================== */

    const renewButtons = [
        document.getElementById("renewBtn"),
        document.getElementById("renewBtnSide")
    ];

    renewButtons.forEach((button) => {

        button?.addEventListener("click", () => {

            openConfirmModal(
                "Renew Subscription?",
                "This will extend the vendor subscription period.",
                async () => {

                    await renewSubscription();

                }
            );

        });

    });


    async function renewSubscription() {

        /*
         * Django API integration goes here.
         */

        showToast(
            "Subscription renewal initiated.",
            "success"
        );

    }


    /* =====================================================
       CHANGE PLAN
       ===================================================== */

    document.getElementById("changePlanBtn")
        ?.addEventListener("click", () => {

            window.location.href =
                "/superadmin/subscriptions/change-plan/";

        });


    /* =====================================================
       VENDOR
       ===================================================== */

    document.getElementById("vendorBtn")
        ?.addEventListener("click", () => {

            window.location.href =
                "/superadmin/vendors/124/";

        });


    /* =====================================================
       PAYMENTS
       ===================================================== */

    document.getElementById("viewPaymentsBtn")
        ?.addEventListener("click", () => {

            window.location.href =
                "/superadmin/payments/?subscription=SUB-2026-00124";

        });


    /* =====================================================
       EDIT SUBSCRIPTION
       ===================================================== */

    document.getElementById("editSubscriptionBtn")
        ?.addEventListener("click", () => {

            window.location.href =
                "/superadmin/subscriptions/124/edit/";

        });


    /* =====================================================
       REGENERATE LICENSE
       ===================================================== */

    document.getElementById("resetLicenseBtn")
        ?.addEventListener("click", () => {

            openConfirmModal(
                "Regenerate License?",
                "The current license key will immediately become invalid and a new key will be generated.",
                async () => {

                    await regenerateLicense();

                }
            );

        });


    async function regenerateLicense() {

        /*
         * Production API:
         *
         * POST
         * /api/superadmin/licenses/regenerate/
         */

        const newKey =
            generateDemoLicenseKey();

        if (licenseKey) {

            licenseKey.textContent = newKey;

        }

        showToast(
            "New license generated successfully.",
            "success"
        );

    }


    /* =====================================================
       DEMO LICENSE GENERATOR
       ===================================================== */

    function generateDemoLicenseKey() {

        const randomPart = () => {

            return Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();

        };

        return `SPL-PRO-${randomPart()}-${randomPart()}-${randomPart()}`;

    }


    /* =====================================================
       INVOICE
       ===================================================== */

    document.getElementById("invoiceBtn")
        ?.addEventListener("click", () => {

            showToast(
                "Invoice generation started.",
                "success"
            );

            /*
             * Production:
             *
             * window.location.href =
             * "/superadmin/invoices/create/?subscription=124";
             */

        });


    /* =====================================================
       LOGIN AS VENDOR
       ===================================================== */

    document.getElementById("loginAsVendorBtn")
        ?.addEventListener("click", () => {

            openConfirmModal(
                "Login as Vendor?",
                "You will enter the vendor dashboard in impersonation mode. This action will be logged.",
                () => {

                    /*
                     * Production:
                     *
                     * window.location.href =
                     * "/superadmin/vendors/124/impersonate/";
                     */

                    showToast(
                        "Vendor access session created.",
                        "success"
                    );

                }
            );

        });


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message, type = "success") {

        let container =
            document.getElementById("toastContainer");

        if (!container) {

            container = document.createElement("div");

            container.id = "toastContainer";

            container.style.position = "fixed";
            container.style.right = "20px";
            container.style.bottom = "20px";
            container.style.zIndex = "10000";

            document.body.appendChild(container);

        }


        const toast =
            document.createElement("div");

        toast.style.minWidth = "260px";
        toast.style.maxWidth = "360px";
        toast.style.padding = "13px 15px";
        toast.style.marginTop = "10px";
        toast.style.borderRadius = "10px";
        toast.style.background =
            type === "error"
                ? "#dc2626"
                : "#16a34a";

        toast.style.color = "#fff";
        toast.style.fontSize = "12px";
        toast.style.fontWeight = "700";
        toast.style.boxShadow =
            "0 12px 30px rgba(0,0,0,.15)";

        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        toast.style.transition = "all .2s ease";

        toast.textContent = message;

        container.appendChild(toast);


        requestAnimationFrame(() => {

            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";

        });


        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";

            setTimeout(() => {

                toast.remove();

            }, 200);

        }, 2800);

    }


    /* =====================================================
       CSRF TOKEN
       ===================================================== */

    function getCSRFToken() {

        const cookieValue =
            document.cookie
                .split("; ")
                .find(row =>
                    row.startsWith("csrftoken=")
                );

        return cookieValue
            ? decodeURIComponent(
                cookieValue.split("=")[1]
            )
            : "";

    }


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeConfirmModal();

        }

    });

});