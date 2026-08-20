/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * VENDOR DETAIL
 * Production-Level Controller
 * FIXED VERSION
 * =========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ROOT
    ===================================================== */

    const page = document.getElementById("vendorDetailPage");

    if (!page) {
        console.warn("[VendorDetail] Root element not found.");
        return;
    }


    /* =====================================================
       CONFIG
    ===================================================== */

    const vendorId =
        page.dataset.vendorId || "";

    const apiUrl =
        page.dataset.apiUrl || "";

    const vendorsUrl =
        page.dataset.vendorsUrl || "/superadmin/vendors/";

    const editUrl =
        page.dataset.editUrl || "#";


    if (!vendorId) {
        console.error("[VendorDetail] Vendor ID missing.");
    }

    console.log("[VendorDetail] Config:", { vendorId, apiUrl, vendorsUrl, editUrl });


    /* =====================================================
       DOM HELPER
    ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    const pageLoading =
        $("pageLoading");

    const detailContent =
        $("detailContent");

    const detailAlert =
        $("detailAlert");

    const deleteModal =
        $("deleteModal");

    const statusModal =
        $("statusModal");


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        vendor: null,

        loading: false,

        deleting: false,

        updatingStatus: false,

        pendingStatus: null

    };


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

        return (
            getCookie("csrftoken") ||
            document.querySelector(
                "[name='csrfmiddlewaretoken']"
            )?.value ||
            ""
        );
    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(
        message,
        type = "error"
    ) {

        if (!detailAlert) {
            return;
        }

        const icons = {

            success:
                "fa-circle-check",

            warning:
                "fa-triangle-exclamation",

            error:
                "fa-circle-exclamation"

        };

        detailAlert.className =
            `detail-alert show ${type}`;

        detailAlert.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.error}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function hideAlert() {

        if (!detailAlert) {
            return;
        }

        detailAlert.className =
            "detail-alert";

        detailAlert.innerHTML =
            "";
    }


    /* =====================================================
       SECURITY ESCAPE
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
       VALUE HELPERS
    ===================================================== */

    function firstValue(
        object,
        keys,
        fallback = "—"
    ) {

        if (!object) {
            return fallback;
        }

        for (const key of keys) {

            const value =
                key.split(".")
                    .reduce(
                        (current, part) =>
                            current?.[part],
                        object
                    );

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;
            }
        }

        return fallback;
    }


    function setText(
        id,
        value,
        fallback = "—"
    ) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? fallback
                : String(value);
    }


    /* =====================================================
       DATE HELPERS
    ===================================================== */

    function parseDate(value) {

        if (!value) {
            return null;
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date;
    }


    function formatDate(
        value,
        fallback = "—"
    ) {

        const date =
            parseDate(value);

        if (!date) {
            return fallback;
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


    function formatDateTime(
        value,
        fallback = "—"
    ) {

        const date =
            parseDate(value);

        if (!date) {
            return fallback;
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function calculateDaysRemaining(value) {

        const date =
            parseDate(value);

        if (!date) {
            return null;
        }

        const now =
            new Date();

        const today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

        const expiry =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );

        return Math.ceil(
            (
                expiry.getTime() -
                today.getTime()
            ) /
            86400000
        );
    }


    /* =====================================================
       NORMALIZE API DATA
    ===================================================== */

    function normalizeVendor(raw) {

        if (!raw) {
            return {};
        }

        const data =
            raw.vendor ||
            raw.data ||
            raw.result ||
            raw;

        const subscription =
            data.subscription ||
            data.current_subscription ||
            data.vendor_subscription ||
            {};

        const plan =
            subscription.plan ||
            data.plan ||
            {};

        const license =
            data.license ||
            data.current_license ||
            data.vendor_license ||
            {};

        const user =
            data.user ||
            data.vendor_user ||
            data.admin ||
            {};

        const stats =
            data.stats ||
            data.statistics ||
            {};

        return {

            id:
                firstValue(
                    data,
                    ["id", "vendor_id"]
                ),

            name:
                firstValue(
                    data,
                    [
                        "name",
                        "vendor_name",
                        "business_name",
                        "laboratory_name"
                    ]
                ),

            ownerName:
                firstValue(
                    data,
                    [
                        "owner_name",
                        "owner",
                        "contact_person"
                    ]
                ),

            email:
                firstValue(
                    data,
                    [
                        "email",
                        "business_email"
                    ]
                ),

            phone:
                firstValue(
                    data,
                    [
                        "phone",
                        "phone_number",
                        "mobile"
                    ]
                ),

            alternatePhone:
                firstValue(
                    data,
                    [
                        "alternate_phone",
                        "alternatePhone"
                    ]
                ),

            username:
                firstValue(
                    data,
                    [
                        "username",
                        "owner_username",
                        "user.username"
                    ]
                ),

            address:
                firstValue(
                    data,
                    [
                        "address",
                        "full_address"
                    ]
                ),

            city:
                firstValue(
                    data,
                    ["city"]
                ),

            state:
                firstValue(
                    data,
                    ["state"]
                ),

            pincode:
                firstValue(
                    data,
                    [
                        "pincode",
                        "pin_code",
                        "postal_code"
                    ]
                ),

            country:
                firstValue(
                    data,
                    ["country"],
                    "India"
                ),

            status:
                String(
                    firstValue(
                        data,
                        [
                            "status",
                            "account_status"
                        ],
                        "active"
                    )
                ).toLowerCase(),

            createdAt:
                firstValue(
                    data,
                    [
                        "created_at",
                        "created",
                        "date_joined"
                    ],
                    null
                ),

            lastLogin:
                firstValue(
                    data,
                    [
                        "last_login_at",
                        "last_login",
                        "user.last_login"
                    ],
                    null
                ),

            subscription: {

                status:
                    String(
                        firstValue(
                            subscription,
                            ["status"],
                            "active"
                        )
                    ).toLowerCase(),

                planName:
                    firstValue(
                        subscription,
                        [
                            "plan_name",
                            "plan.name",
                            "name"
                        ]
                    ) !== "—"
                        ? firstValue(
                            subscription,
                            [
                                "plan_name",
                                "plan.name",
                                "name"
                            ]
                        )
                        : firstValue(
                            plan,
                            [
                                "name",
                                "title"
                            ]
                        ),

                price:
                    firstValue(
                        subscription,
                        [
                            "amount",
                            "price",
                            "plan.price"
                        ],
                        null
                    ),

                start:
                    firstValue(
                        subscription,
                        [
                            "current_period_start",
                            "started_at",
                            "start_date",
                            "starts_at",
                            "start"
                        ],
                        null
                    ),

                end:
                    firstValue(
                        subscription,
                        [
                            "current_period_end",
                            "end_date",
                            "expires_at",
                            "expiry_date",
                            "end"
                        ],
                        null
                    ),

                duration:
                    firstValue(
                        subscription,
                        [
                            "duration",
                            "duration_days",
                            "days"
                        ],
                        null
                    )

            },

            license: {

                key:
                    firstValue(
                        license,
                        [
                            "key_prefix",
                            "license_key",
                            "key",
                            "license"
                        ]
                    ),

                status:
                    String(
                        firstValue(
                            license,
                            ["status"],
                            "active"
                        )
                    ).toLowerCase(),

                issued:
                    firstValue(
                        license,
                        [
                            "issued_at",
                            "created_at",
                            "issued"
                        ],
                        null
                    ),

                expires:
                    firstValue(
                        license,
                        [
                            "expires_at",
                            "expiry_date",
                            "end_date"
                        ],
                        null
                    )

            },

            stats: {

                users:
                    firstValue(
                        stats,
                        [
                            "users",
                            "users_count",
                            "total_users"
                        ],
                        0
                    ),

                reports:
                    firstValue(
                        stats,
                        [
                            "reports",
                            "reports_count",
                            "total_reports"
                        ],
                        0
                    ),

                appointments:
                    firstValue(
                        stats,
                        [
                            "appointments",
                            "appointments_count",
                            "total_appointments"
                        ],
                        0
                    ),

                revenue:
                    firstValue(
                        stats,
                        [
                            "revenue",
                            "total_revenue"
                        ],
                        0
                    )

            }

        };
    }


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function request(
        url,
        options = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    credentials:
                        "same-origin",

                    ...options,

                    headers: {

                        "Accept":
                            "application/json",

                        "X-Requested-With":
                            "XMLHttpRequest",

                        ...(options.headers || {})

                    }

                }
            );


        const contentType =
            response.headers
                .get("content-type") || "";


        let data = null;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            data = {
                message:
                    text ||
                    `Server returned ${response.status}`
            };

        }


        if (!response.ok) {

            const error =
                new Error(
                    data?.message ||
                    data?.error ||
                    `Request failed with status ${response.status}`
                );

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }


        return data;
    }


    /* =====================================================
       LOAD VENDOR
       (FIXED: render errors can no longer leave the
       loading spinner stuck forever. Any failure -
       network, parsing, or render - now always
       reaches hideLoading().)
    ===================================================== */

    async function loadVendor() {

        if (!apiUrl) {

            console.error("[VendorDetail] apiUrl is empty - check data-api-url on #vendorDetailPage.");

            showAlert(
                "Vendor API URL is not configured.",
                "error"
            );

            hideLoading();

            return;
        }

        state.loading =
            true;

        showLoading();

        try {

            hideAlert();

            const response =
                await request(
                    apiUrl
                );

            console.log("[VendorDetail] Raw API response:", response);

            state.vendor =
                normalizeVendor(
                    response
                );

            console.log("[VendorDetail] Normalized vendor:", state.vendor);

            /*
             * Rendering is wrapped separately so that a
             * problem in the DOM-writing code (missing
             * element, bad data shape, etc.) cannot
             * prevent hideLoading() below from running.
             */

            try {

                renderVendor(
                    state.vendor
                );

            } catch (renderError) {

                console.error(
                    "[VendorDetail] Render error:",
                    renderError
                );

                showAlert(
                    "Vendor data was loaded but could not be fully displayed. Check the browser console for details.",
                    "warning"
                );
            }

        } catch (error) {

            console.error(
                "[VendorDetail] Load error:",
                error
            );

            showAlert(
                error.message ||
                "Unable to load vendor details.",
                "error"
            );

        } finally {

            /*
             * This ALWAYS runs, no matter what happened
             * above - network failure, JSON error, or
             * render error. The spinner can never get
             * stuck again.
             */

            hideLoading();

            state.loading =
                false;
        }
    }


    /* =====================================================
       LOADING UI
    ===================================================== */

    function showLoading() {

        if (pageLoading) {
            pageLoading.hidden =
                false;
        }

        if (detailContent) {
            detailContent.hidden =
                true;
        }
    }


    function hideLoading() {

        if (pageLoading) {
            pageLoading.hidden =
                true;
        }

        if (detailContent) {
            detailContent.hidden =
                false;
        }
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderVendor(vendor) {

        if (!vendor) {
            return;
        }


        /* ================================================
           HEADER
        ================================================= */

        const name =
            vendor.name || "Vendor";

        setText(
            "vendorName",
            name
        );

        setText(
            "vendorMeta",
            `Vendor ID: ${vendor.id || vendorId}`
        );


        const avatar =
            $("headerAvatar");

        if (avatar) {

            avatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "V";
        }


        renderStatus(
            vendor.status
        );


        /* ================================================
           BASIC INFO
        ================================================= */

        setText(
            "infoVendorName",
            vendor.name
        );

        setText(
            "infoOwnerName",
            vendor.ownerName
        );

        setText(
            "infoEmail",
            vendor.email
        );

        setText(
            "infoPhone",
            vendor.phone
        );

        setText(
            "infoAlternatePhone",
            vendor.alternatePhone
        );

        setText(
            "infoUsername",
            vendor.username
        );

        setText(
            "accountUsername",
            vendor.username
        );


        /* ================================================
           ADDRESS
        ================================================= */

        setText(
            "addressText",
            vendor.address
        );

        setText(
            "cityText",
            vendor.city
        );

        setText(
            "stateText",
            vendor.state
        );

        setText(
            "pincodeText",
            vendor.pincode
        );

        setText(
            "countryText",
            vendor.country,
            "India"
        );


        /* ================================================
           SUBSCRIPTION
        ================================================= */

        renderSubscription(
            vendor.subscription
        );


        /* ================================================
           LICENSE
        ================================================= */

        renderLicense(
            vendor.license
        );


        /* ================================================
           ACCOUNT
        ================================================= */

        renderAccount(
            vendor
        );


        /* ================================================
           STATS
        ================================================= */

        renderStats(
            vendor.stats
        );


        /* ================================================
           TIMELINE
        ================================================= */

        renderTimeline(
            vendor
        );


        /* ================================================
           DELETE MODAL
        ================================================= */

        setText(
            "deleteVendorName",
            vendor.name
        );


        /* ================================================
           EDIT LINKS
        ================================================= */

        const editButton =
            $("editVendorBtn");

        const sidebarEdit =
            $("sidebarEditBtn");

        if (editButton) {
            editButton.href =
                editUrl;
        }

        if (sidebarEdit) {
            sidebarEdit.href =
                editUrl;
        }
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function renderStatus(status) {

        const normalized =
            String(
                status || "active"
            ).toLowerCase();


        const allowed = [
            "active",
            "pending",
            "suspended",
            "inactive"
        ];


        const finalStatus =
            allowed.includes(
                normalized
            )
                ? normalized
                : "inactive";


        const badge =
            $("vendorStatus");

        if (badge) {

            badge.className =
                `status-badge ${finalStatus}`;
        }


        setText(
            "vendorStatusText",
            capitalize(
                finalStatus
            )
        );


        setText(
            "sidebarStatus",
            capitalize(
                finalStatus
            )
        );


        const dot =
            $("bigStatusDot");

        if (dot) {

            dot.className =
                `big-status-dot ${finalStatus}`;
        }


        const accountStatus =
            $("accountStatus");

        if (accountStatus) {

            accountStatus.textContent =
                capitalize(
                    finalStatus
                );

            accountStatus.className =
                `account-status ${finalStatus}`;
        }


        document
            .querySelectorAll(
                ".status-action"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.status ===
                    finalStatus
                );

            });
    }


    function capitalize(value) {

        if (!value) {
            return "—";
        }

        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value)
                .slice(1);
    }


    /* =====================================================
       SUBSCRIPTION
    ===================================================== */

    function renderSubscription(
        subscription
    ) {

        if (!subscription) {
            return;
        }


        setText(
            "planName",
            subscription.planName
        );


        const price =
            Number(
                subscription.price
            );


        setText(
            "planPrice",
            Number.isFinite(price)
                ? `₹${price.toLocaleString("en-IN")}`
                : "₹0"
        );


        setText(
            "subscriptionStart",
            formatDate(
                subscription.start
            )
        );


        setText(
            "subscriptionEnd",
            formatDate(
                subscription.end
            )
        );


        const duration =
            subscription.duration;


        setText(
            "subscriptionDuration",
            duration
                ? `${duration} Days`
                : "—"
        );


        const remaining =
            calculateDaysRemaining(
                subscription.end
            );


        if (remaining === null) {

            setText(
                "daysRemaining",
                "—"
            );

        } else if (remaining < 0) {

            setText(
                "daysRemaining",
                "Expired"
            );

        } else {

            setText(
                "daysRemaining",
                `${remaining} Days`
            );
        }


        const status =
            $("subscriptionStatus");


        if (status) {

            const normalized =
                String(
                    subscription.status ||
                    "active"
                ).toLowerCase();

            status.textContent =
                capitalize(
                    normalized
                );

            status.className =
                `small-status ${normalized}`;
        }
    }


    /* =====================================================
       LICENSE
    ===================================================== */

    function renderLicense(
        license
    ) {

        if (!license) {
            return;
        }


        setText(
            "licenseKey",
            license.key
        );


        setText(
            "licenseIssued",
            formatDate(
                license.issued
            )
        );


        setText(
            "licenseExpires",
            formatDate(
                license.expires
            )
        );


        const badge =
            $("licenseStatus");


        if (badge) {

            const status =
                String(
                    license.status ||
                    "active"
                ).toLowerCase();

            badge.textContent =
                capitalize(
                    status
                );

            badge.className =
                `license-status-badge ${status}`;
        }
    }


    /* =====================================================
       ACCOUNT
    ===================================================== */

    function renderAccount(
        vendor
    ) {

        setText(
            "createdAt",
            formatDateTime(
                vendor.createdAt
            )
        );


        setText(
            "lastLogin",
            formatDateTime(
                vendor.lastLogin,
                "Never"
            )
        );
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats(
        stats
    ) {

        if (!stats) {
            return;
        }


        setText(
            "usersCount",
            Number(
                stats.users || 0
            ).toLocaleString(
                "en-IN"
            )
        );


        setText(
            "reportsCount",
            Number(
                stats.reports || 0
            ).toLocaleString(
                "en-IN"
            )
        );


        setText(
            "appointmentsCount",
            Number(
                stats.appointments || 0
            ).toLocaleString(
                "en-IN"
            )
        );


        const revenue =
            Number(
                stats.revenue || 0
            );


        setText(
            "revenueCount",
            `₹${Number.isFinite(revenue)
                ? revenue.toLocaleString("en-IN")
                : "0"}`
        );
    }


    /* =====================================================
       TIMELINE
    ===================================================== */

    function renderTimeline(
        vendor
    ) {

        setText(
            "timelineCreated",
            formatDateTime(
                vendor.createdAt
            )
        );


        setText(
            "timelineSubscription",
            formatDate(
                vendor.subscription?.start
            )
        );


        setText(
            "timelineLicense",
            formatDate(
                vendor.license?.issued
            )
        );
    }


    /* =====================================================
       COPY
    ===================================================== */

    async function copyText(
        value,
        button = null
    ) {

        if (
            !value ||
            value === "—"
        ) {

            showAlert(
                "Nothing available to copy.",
                "warning"
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                value
            );


            if (button) {

                const original =
                    button.innerHTML;

                button.innerHTML =
                    `<i class="fa-solid fa-check"></i>`;

                setTimeout(() => {

                    button.innerHTML =
                        original;

                }, 1200);
            }


            showAlert(
                "Copied successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "[VendorDetail] Copy failed:",
                error
            );

            showAlert(
                "Unable to copy. Please copy manually.",
                "error"
            );
        }
    }


    document
        .querySelectorAll(
            "[data-copy-target]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.copyTarget;

                    const target =
                        $(targetId);

                    copyText(
                        target?.textContent.trim(),
                        button
                    );
                }
            );

        });


    $("copyLicenseBtn")
        ?.addEventListener(
            "click",
            () => {

                copyText(
                    $("licenseKey")
                        ?.textContent
                        .trim(),
                    $("copyLicenseBtn")
                );

            }
        );


    /* =====================================================
       DELETE
    ===================================================== */

    function openDeleteModal() {

        if (!deleteModal) {
            return;
        }

        setText(
            "deleteVendorName",
            state.vendor?.name ||
            "This vendor"
        );

        deleteModal.classList.add(
            "show"
        );

        deleteModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        $("confirmDeleteBtn")
            ?.focus();
    }


    function closeDeleteModal() {

        deleteModal?.classList.remove(
            "show"
        );

        deleteModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }


    async function deleteVendor() {

        if (
            state.deleting ||
            !apiUrl
        ) {
            return;
        }


        state.deleting =
            true;


        const button =
            $("confirmDeleteBtn");


        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Deleting...
            `;
        }


        try {

            const response =
                await request(
                    apiUrl,
                    {
                        method:
                            "DELETE",

                        headers: {
                            "X-CSRFToken":
                                getCSRFToken()
                        }
                    }
                );


            showAlert(
                response?.message ||
                "Vendor deleted successfully.",
                "success"
            );


            closeDeleteModal();


            setTimeout(() => {

                window.location.href =
                    vendorsUrl;

            }, 700);


        } catch (error) {

            console.error(
                "[VendorDetail] Delete error:",
                error
            );


            showAlert(
                error.message ||
                "Unable to delete vendor.",
                "error"
            );


        } finally {

            state.deleting =
                false;


            if (button) {

                button.disabled =
                    false;

                button.innerHTML = `
                    <i class="fa-solid fa-trash"></i>
                    Delete Vendor
                `;
            }
        }
    }


    $("deleteVendorBtn")
        ?.addEventListener(
            "click",
            openDeleteModal
        );


    $("sidebarDeleteBtn")
        ?.addEventListener(
            "click",
            openDeleteModal
        );


    $("cancelDeleteBtn")
        ?.addEventListener(
            "click",
            closeDeleteModal
        );


    $("confirmDeleteBtn")
        ?.addEventListener(
            "click",
            deleteVendor
        );


    deleteModal
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    deleteModal
                ) {
                    closeDeleteModal();
                }

            }
        );


    /* =====================================================
       STATUS UPDATE
    ===================================================== */

    document
        .querySelectorAll(
            ".status-action"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const newStatus =
                        button.dataset.status;

                    if (
                        !newStatus ||
                        newStatus ===
                        state.vendor?.status
                    ) {
                        return;
                    }

                    state.pendingStatus =
                        newStatus;

                    setText(
                        "statusModalText",
                        `Are you sure you want to change this vendor's status to "${capitalize(newStatus)}"?`
                    );

                    statusModal
                        ?.classList
                        .add("show");

                    statusModal
                        ?.setAttribute(
                            "aria-hidden",
                            "false"
                        );

                    document.body
                        .classList
                        .add(
                            "modal-open"
                        );
                }
            );

        });


    function closeStatusModal() {

        statusModal?.classList.remove(
            "show"
        );

        statusModal?.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        state.pendingStatus =
            null;
    }


    async function updateStatus() {

        const newStatus =
            state.pendingStatus;


        if (
            !newStatus ||
            state.updatingStatus ||
            !apiUrl
        ) {
            return;
        }


        state.updatingStatus =
            true;


        const button =
            $("confirmStatusBtn");


        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Updating...
            `;
        }


        try {

            const formData =
                new FormData();

            formData.append(
                "status",
                newStatus
            );


            const response =
                await request(
                    apiUrl,
                    {
                        method:
                            "PATCH",

                        body:
                            formData,

                        headers: {
                            "X-CSRFToken":
                                getCSRFToken()
                        }
                    }
                );


            const updatedVendor =
                normalizeVendor(
                    response
                );


            if (
                updatedVendor.status &&
                updatedVendor.status !==
                    "—"
            ) {

                state.vendor.status =
                    updatedVendor.status;

            } else {

                state.vendor.status =
                    newStatus;
            }


            renderStatus(
                state.vendor.status
            );


            closeStatusModal();


            showAlert(
                response?.message ||
                "Vendor status updated successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "[VendorDetail] Status update error:",
                error
            );


            showAlert(
                error.message ||
                "Unable to update vendor status.",
                "error"
            );

        } finally {

            state.updatingStatus =
                false;


            if (button) {

                button.disabled =
                    false;

                button.innerHTML =
                    "Confirm";
            }
        }
    }


    $("cancelStatusBtn")
        ?.addEventListener(
            "click",
            closeStatusModal
        );


    $("confirmStatusBtn")
        ?.addEventListener(
            "click",
            updateStatus
        );


    statusModal
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    statusModal
                ) {
                    closeStatusModal();
                }

            }
        );


    /* =====================================================
       REFRESH
    ===================================================== */

    $("refreshVendorBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (state.loading) {
                    return;
                }

                await loadVendor();

                showAlert(
                    "Vendor details refreshed.",
                    "success"
                );

            }
        );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }


            if (
                deleteModal
                    ?.classList
                    .contains("show")
            ) {

                closeDeleteModal();

                return;
            }


            if (
                statusModal
                    ?.classList
                    .contains("show")
            ) {

                closeStatusModal();
            }
        }
    );


    /* =====================================================
       INIT
    ===================================================== */

    loadVendor();


    console.log(
        "[VendorDetail] Initialized successfully.",
        {
            vendorId,
            apiUrl
        }
    );

});