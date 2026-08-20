/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN PORTAL
 * BASE JAVASCRIPT
 * ============================================================
 */

"use strict";


/* ============================================================
   CONFIGURATION
============================================================ */

const CONFIG = {

    themeKey: "sita_path_lab_superadmin_theme",

    mobileBreakpoint: 1024,

    logoutFallback: "/superadmin/logout/",

    toastDuration: 3500,

    animationDuration: 220

};


/* ============================================================
   DOM REFERENCES
============================================================ */

const DOM = {

    html: document.documentElement,

    body: document.body,

    sidebar: document.getElementById("sidebar"),

    sidebarOpen: document.getElementById("sidebarOpen"),

    sidebarClose: document.getElementById("sidebarClose"),

    sidebarOverlay: document.getElementById("sidebarOverlay"),

    sidebarUserMenu: document.getElementById("sidebarUserMenu"),

    themeToggle: document.getElementById("themeToggle"),

    notificationBtn: document.getElementById("notificationBtn"),

    notificationDropdown:
        document.getElementById("notificationDropdown"),

    notificationCount:
        document.getElementById("notificationCount"),

    markNotificationsRead:
        document.getElementById("markNotificationsRead"),

    notificationList:
        document.querySelector(".notification-list"),

    topbarUser:
        document.getElementById("topbarUser"),

    userDropdown:
        document.getElementById("userDropdown"),

    logoutBtn:
        document.getElementById("logoutBtn"),

    globalSearch:
        document.getElementById("globalSearch"),

    globalLoader:
        document.getElementById("globalLoader"),

    toastContainer:
        document.getElementById("toastContainer")

};


/* ============================================================
   STATE
============================================================ */

const STATE = {

    sidebarOpen: false,

    notificationOpen: false,

    userDropdownOpen: false,

    isLoading: false,

    toastCount: 0

};


/* ============================================================
   SUPER ADMIN SIDEBAR MENU
============================================================ */

const SUPER_ADMIN_MENU = [

    {
        section: "OVERVIEW",

        items: [
            {
                name: "Dashboard",
                icon: "fa-solid fa-chart-pie",
                url: "/superadmin/dashboard/"
            }
        ]
    },


    {
        section: "TENANT MANAGEMENT",

        items: [

            {
                name: "Vendors",
                icon: "fa-solid fa-building",
                url: "/superadmin/vendors/"
            },

            {
                name: "Users",
                icon: "fa-solid fa-users",
                url: "/superadmin/users/"
            },

            {
                name: "Roles & Permissions",
                icon: "fa-solid fa-user-shield",
                url: "/superadmin/roles-permissions/"
            }

        ]
    },


    {
        section: "SUBSCRIPTION & BILLING",

        items: [

            {
                name: "Subscription Plans",
                icon: "fa-solid fa-layer-group",
                url: "/superadmin/subscription-plans/"
            },

            {
                name: "Subscriptions",
                icon: "fa-solid fa-arrows-rotate",
                url: "/superadmin/subscriptions/"
            },

            {
                name: "Licenses",
                icon: "fa-solid fa-id-card",
                url: "/superadmin/licenses/"
            },

            {
                name: "Payments",
                icon: "fa-solid fa-credit-card",
                url: "/superadmin/payments/"
            },

            {
                name: "Invoices",
                icon: "fa-solid fa-file-invoice",
                url: "/superadmin/invoices/"
            },

            {
                name: "Transactions",
                icon: "fa-solid fa-money-bill-transfer",
                url: "/superadmin/transactions/"
            }

        ]
    },


    {
        section: "ANALYTICS",

        items: [

            {
                name: "Analytics",
                icon: "fa-solid fa-chart-line",
                url: "/superadmin/analytics/"
            }

        ]
    },


    {
        section: "SECURITY & ACTIVITY",

        items: [

            {
                name: "Activity Logs",
                icon: "fa-solid fa-clock-rotate-left",
                url: "/superadmin/activity-logs/"
            },

            {
                name: "Audit Logs",
                icon: "fa-solid fa-list-check",
                url: "/superadmin/audit-logs/"
            },

            {
                name: "Security",
                icon: "fa-solid fa-shield-halved",
                url: "/superadmin/security/"
            }

        ]
    },


    {
        section: "CONFIGURATION",

        items: [

            {
                name: "System Settings",
                icon: "fa-solid fa-gear",
                url: "/superadmin/settings/"
            },

            {
                name: "Payment Settings",
                icon: "fa-solid fa-sliders",
                url: "/superadmin/payment-settings/"
            }

        ]
    },


    {
        section: "SUPPORT",

        items: [

            {
                name: "Notifications",
                icon: "fa-solid fa-bell",
                url: "/superadmin/notifications/"
            },

            {
                name: "Support",
                icon: "fa-solid fa-headset",
                url: "/superadmin/support/"
            }

        ]
    }

];


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


function initializeApplication() {

    initializeSidebarNavigation();

    initializeTheme();

    initializeSidebar();

    initializeDropdowns();

    initializeNotifications();

    initializeLogout();

    initializeNavigation();

    initializeGlobalSearch();

    initializeKeyboardShortcuts();

    initializeAccessibility();

    initializeResponsiveState();

}


/* ============================================================
   SIDEBAR NAVIGATION RENDERER
============================================================ */

function initializeSidebarNavigation() {

    if (!DOM.sidebar) {
        return;
    }


    /*
     * Find existing navigation container.
     *
     * Supported:
     * .sidebar-nav
     * .sidebar-navigation
     * nav.sidebar-menu
     */

    const navigation =
        DOM.sidebar.querySelector(
            ".sidebar-nav, .sidebar-navigation, .sidebar-menu, nav"
        );


    if (!navigation) {

        console.warn(
            "[Sidebar] Navigation container not found."
        );

        return;

    }


    /*
     * Clear old menu.
     */

    navigation.innerHTML = "";


    /*
     * Build complete menu.
     */

    SUPER_ADMIN_MENU.forEach(
        group => {

            const section =
                document.createElement("div");

            section.className =
                "nav-section";


            /*
             * Section title
             */

            const title =
                document.createElement("div");

            title.className =
                "nav-section-title";

            title.textContent =
                group.section;


            section.appendChild(
                title
            );


            /*
             * Items container
             */

            const items =
                document.createElement("div");

            items.className =
                "nav-section-items";


            group.items.forEach(
                item => {

                    const link =
                        document.createElement("a");


                    link.className =
                        "nav-item";


                    link.href =
                        item.url;


                    link.dataset.page =
                        item.name;


                    link.setAttribute(
                        "aria-label",
                        item.name
                    );


                    link.innerHTML = `

                        <span class="nav-icon">

                            <i class="${item.icon}"></i>

                        </span>

                        <span class="nav-label">

                            ${escapeHTML(item.name)}

                        </span>

                    `;


                    items.appendChild(
                        link
                    );

                }
            );


            section.appendChild(
                items
            );


            navigation.appendChild(
                section
            );

        }
    );


    /*
     * Reinitialize mobile click handling
     */

    navigation
        .querySelectorAll(".nav-item")
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        if (
                            window.innerWidth <=
                            CONFIG.mobileBreakpoint
                        ) {

                            closeSidebar();

                        }

                    }
                );

            }
        );


    /*
     * Highlight current page.
     */

    initializeNavigation();

}


/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;

}


/* ============================================================
   THEME
============================================================ */

function initializeTheme() {

    let theme =
        localStorage.getItem(
            CONFIG.themeKey
        );


    if (
        theme !== "light" &&
        theme !== "dark"
    ) {

        theme = null;

    }


    if (!theme) {

        theme =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";

    }


    applyTheme(
        theme,
        false
    );


    DOM.themeToggle?.addEventListener(
        "click",
        toggleTheme
    );


    if (window.matchMedia) {

        const mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );


        mediaQuery.addEventListener?.(
            "change",
            event => {

                if (
                    localStorage.getItem(
                        CONFIG.themeKey
                    )
                ) {

                    return;

                }


                applyTheme(
                    event.matches
                        ? "dark"
                        : "light",
                    false
                );

            }
        );

    }

}


function toggleTheme() {

    const current =
        DOM.html.getAttribute(
            "data-theme"
        ) || "light";


    const next =
        current === "dark"
            ? "light"
            : "dark";


    applyTheme(
        next,
        true
    );


    showToast(
        next === "dark"
            ? "Dark mode enabled."
            : "Light mode enabled.",
        "success"
    );

}


function applyTheme(
    theme,
    save = true
) {

    if (
        theme !== "light" &&
        theme !== "dark"
    ) {

        theme = "light";

    }


    DOM.html.setAttribute(
        "data-theme",
        theme
    );


    if (save) {

        localStorage.setItem(
            CONFIG.themeKey,
            theme
        );

    }


    updateThemeIcon();

}


function updateThemeIcon() {

    if (!DOM.themeToggle) {
        return;
    }


    const icon =
        DOM.themeToggle.querySelector("i");


    if (!icon) {
        return;
    }


    const dark =
        DOM.html.getAttribute(
            "data-theme"
        ) === "dark";


    icon.className =
        dark
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";


    DOM.themeToggle.setAttribute(
        "aria-label",
        dark
            ? "Switch to light theme"
            : "Switch to dark theme"
    );

}


/* ============================================================
   SIDEBAR
============================================================ */

function initializeSidebar() {

    DOM.sidebarOpen?.addEventListener(
        "click",
        openSidebar
    );


    DOM.sidebarClose?.addEventListener(
        "click",
        closeSidebar
    );


    DOM.sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                isMobileSidebarOpen()
            ) {

                closeSidebar();

            }

        }
    );


    window.addEventListener(
        "resize",
        handleResize
    );

}


function openSidebar() {

    if (!DOM.sidebar) {
        return;
    }


    DOM.sidebar.classList.add(
        "mobile-open"
    );


    DOM.sidebarOverlay?.classList.add(
        "active"
    );


    DOM.sidebarOverlay?.setAttribute(
        "aria-hidden",
        "false"
    );


    DOM.sidebarOpen?.setAttribute(
        "aria-expanded",
        "true"
    );


    STATE.sidebarOpen =
        true;


    if (
        window.innerWidth <=
        CONFIG.mobileBreakpoint
    ) {

        document.body.style.overflow =
            "hidden";

    }

}


function closeSidebar() {

    DOM.sidebar?.classList.remove(
        "mobile-open"
    );


    DOM.sidebarOverlay?.classList.remove(
        "active"
    );


    DOM.sidebarOverlay?.setAttribute(
        "aria-hidden",
        "true"
    );


    DOM.sidebarOpen?.setAttribute(
        "aria-expanded",
        "false"
    );


    STATE.sidebarOpen =
        false;


    document.body.style.overflow =
        "";

}


function isMobileSidebarOpen() {

    return Boolean(
        DOM.sidebar?.classList.contains(
            "mobile-open"
        )
    );

}


function handleResize() {

    if (
        window.innerWidth >
        CONFIG.mobileBreakpoint
    ) {

        closeSidebar();

    }

}


function initializeResponsiveState() {

    DOM.sidebarOverlay?.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ============================================================
   DROPDOWNS
============================================================ */

function initializeDropdowns() {

    DOM.notificationBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            closeUserDropdown();

            toggleNotificationDropdown();

        }
    );


    DOM.topbarUser?.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();

            closeNotificationDropdown();

            toggleUserDropdown();

        }
    );


    document.addEventListener(
        "click",
        event => {

            const target =
                event.target;


            if (
                DOM.notificationDropdown &&
                !DOM.notificationDropdown.contains(
                    target
                ) &&
                !DOM.notificationBtn?.contains(
                    target
                )
            ) {

                closeNotificationDropdown();

            }


            if (
                DOM.userDropdown &&
                !DOM.userDropdown.contains(
                    target
                ) &&
                !DOM.topbarUser?.contains(
                    target
                )
            ) {

                closeUserDropdown();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeAllDropdowns();

            }

        }
    );

}


function toggleNotificationDropdown() {

    if (!DOM.notificationDropdown) {
        return;
    }


    DOM.notificationDropdown.classList.toggle(
        "open"
    );


    STATE.notificationOpen =
        DOM.notificationDropdown.classList.contains(
            "open"
        );


    DOM.notificationBtn?.setAttribute(
        "aria-expanded",
        String(
            STATE.notificationOpen
        )
    );

}


function openNotificationDropdown() {

    DOM.notificationDropdown?.classList.add(
        "open"
    );

    STATE.notificationOpen =
        true;

}


function closeNotificationDropdown() {

    DOM.notificationDropdown?.classList.remove(
        "open"
    );

    STATE.notificationOpen =
        false;


    DOM.notificationBtn?.setAttribute(
        "aria-expanded",
        "false"
    );

}


function toggleUserDropdown() {

    if (!DOM.userDropdown) {
        return;
    }


    DOM.userDropdown.classList.toggle(
        "open"
    );


    STATE.userDropdownOpen =
        DOM.userDropdown.classList.contains(
            "open"
        );


    DOM.topbarUser?.setAttribute(
        "aria-expanded",
        String(
            STATE.userDropdownOpen
        )
    );

}


function openUserDropdown() {

    DOM.userDropdown?.classList.add(
        "open"
    );

}


function closeUserDropdown() {

    DOM.userDropdown?.classList.remove(
        "open"
    );


    STATE.userDropdownOpen =
        false;


    DOM.topbarUser?.setAttribute(
        "aria-expanded",
        "false"
    );

}


function closeAllDropdowns() {

    closeNotificationDropdown();

    closeUserDropdown();

}


/* ============================================================
   NOTIFICATIONS
============================================================ */

function initializeNotifications() {

    DOM.markNotificationsRead?.addEventListener(
        "click",
        markNotificationsAsRead
    );


    updateNotificationCount();

}


function updateNotificationCount() {

    if (!DOM.notificationCount) {
        return;
    }


    const count =
        parseInt(
            DOM.notificationCount.textContent,
            10
        ) || 0;


    DOM.notificationCount.hidden =
        count <= 0;

}


function markNotificationsAsRead() {

    if (!DOM.notificationCount) {
        return;
    }


    DOM.notificationCount.textContent =
        "0";


    DOM.notificationCount.hidden =
        true;


    if (DOM.markNotificationsRead) {

        DOM.markNotificationsRead.textContent =
            "All read";

    }


    showToast(
        "All notifications marked as read.",
        "success"
    );

}


/* ============================================================
   NAVIGATION ACTIVE STATE
============================================================ */

function initializeNavigation() {

    const currentPath =
        normalizePath(
            window.location.pathname
        );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                const href =
                    item.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href === "#"
                ) {

                    return;

                }


                try {

                    const url =
                        new URL(
                            href,
                            window.location.origin
                        );


                    const linkPath =
                        normalizePath(
                            url.pathname
                        );


                    if (
                        currentPath ===
                        linkPath
                    ) {

                        item.classList.add(
                            "active"
                        );

                    } else if (
                        linkPath !== "/" &&
                        currentPath.startsWith(
                            linkPath + "/"
                        )
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                } catch (error) {

                    console.warn(
                        "[Navigation]",
                        error
                    );

                }

            }
        );

}


function normalizePath(path) {

    if (!path) {
        return "/";
    }


    let value =
        String(path).trim();


    if (
        !value.startsWith("/")
    ) {

        value =
            "/" + value;

    }


    value =
        value.replace(
            /\/+/g,
            "/"
        );


    if (
        value.length > 1
    ) {

        value =
            value.replace(
                /\/$/,
                ""
            );

    }


    return value;

}


/* ============================================================
   GLOBAL SEARCH
============================================================ */

function initializeGlobalSearch() {

    DOM.globalSearch?.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Enter"
            ) {

                return;

            }


            const query =
                DOM.globalSearch.value.trim();


            if (!query) {

                showToast(
                    "Enter something to search.",
                    "warning"
                );

                return;

            }


            console.info(
                "[SuperAdmin Search]",
                query
            );


            showToast(
                `Searching for "${query}"...`,
                "info"
            );

        }
    );

}


/* ============================================================
   LOGOUT
============================================================ */

function initializeLogout() {

    DOM.logoutBtn?.addEventListener(
        "click",
        handleLogout
    );


    document
        .querySelectorAll(
            '[data-logout-url]'
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        handleLogout(
                            element.dataset.logoutUrl
                        );

                    }
                );

            }
        );

}


function handleLogout(
    customURL = null
) {

    const logoutURL =
        customURL ||
        DOM.logoutBtn?.dataset.logoutUrl ||
        CONFIG.logoutFallback;


    if (
        !window.confirm(
            "Are you sure you want to logout?"
        )
    ) {

        return;

    }


    showLoader(
        "Signing you out..."
    );


    setTimeout(
        () => {

            window.location.href =
                logoutURL;

        },
        80
    );

}


/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            const isMac =
                navigator.platform
                    .toUpperCase()
                    .includes("MAC");


            const modifier =
                isMac
                    ? event.metaKey
                    : event.ctrlKey;


            /*
             * CTRL + K
             */

            if (
                modifier &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                DOM.globalSearch?.focus();

                DOM.globalSearch?.select();

            }


            /*
             * CTRL + B
             */

            if (
                modifier &&
                event.key.toLowerCase() === "b"
            ) {

                if (
                    window.innerWidth <=
                    CONFIG.mobileBreakpoint
                ) {

                    event.preventDefault();


                    if (
                        isMobileSidebarOpen()
                    ) {

                        closeSidebar();

                    } else {

                        openSidebar();

                    }

                }

            }


            /*
             * ESC
             */

            if (
                event.key === "Escape"
            ) {

                closeAllDropdowns();

            }

        }
    );

}


/* ============================================================
   ACCESSIBILITY
============================================================ */

function initializeAccessibility() {

    DOM.sidebarOpen?.setAttribute(
        "aria-expanded",
        "false"
    );


    DOM.notificationBtn?.setAttribute(
        "aria-expanded",
        "false"
    );


    DOM.topbarUser?.setAttribute(
        "aria-expanded",
        "false"
    );


    DOM.sidebarOverlay?.setAttribute(
        "aria-hidden",
        "true"
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            const modal =
                document.querySelector(
                    ".modal-overlay:not([hidden])"
                );


            if (modal) {

                modal.querySelector(
                    ".modal-close, [data-modal-close]"
                )?.click();

            }

        }
    );

}


/* ============================================================
   GLOBAL LOADER
============================================================ */

function showLoader(
    message = "Loading..."
) {

    if (!DOM.globalLoader) {
        return;
    }


    const text =
        DOM.globalLoader.querySelector(
            "span"
        );


    if (text) {

        text.textContent =
            message;

    }


    DOM.globalLoader.hidden =
        false;


    STATE.isLoading =
        true;


    DOM.body.classList.add(
        "is-loading"
    );

}


function hideLoader() {

    if (!DOM.globalLoader) {
        return;
    }


    DOM.globalLoader.hidden =
        true;


    STATE.isLoading =
        false;


    DOM.body.classList.remove(
        "is-loading"
    );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
    message,
    type = "info",
    duration = CONFIG.toastDuration
) {

    if (!DOM.toastContainer) {

        console.warn(
            "[Toast]",
            message
        );

        return null;

    }


    const allowed =
        [
            "success",
            "error",
            "warning",
            "info"
        ];


    if (
        !allowed.includes(type)
    ) {

        type = "info";

    }


    const icons = {

        success:
            "fa-solid fa-circle-check",

        error:
            "fa-solid fa-circle-exclamation",

        warning:
            "fa-solid fa-triangle-exclamation",

        info:
            "fa-solid fa-circle-info"

    };


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.setAttribute(
        "role",
        "status"
    );


    toast.innerHTML = `

        <div class="toast-icon">

            <i class="${icons[type]}"></i>

        </div>

        <div class="toast-content">

            <span class="toast-message"></span>

        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Close notification"
        >

            <i class="fa-solid fa-xmark"></i>

        </button>

    `;


    toast.querySelector(
        ".toast-message"
    ).textContent =
        String(message);


    const closeButton =
        toast.querySelector(
            ".toast-close"
        );


    closeButton?.addEventListener(
        "click",
        () => removeToast(toast)
    );


    DOM.toastContainer.appendChild(
        toast
    );


    STATE.toastCount++;


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    const timeout =
        setTimeout(
            () => {

                removeToast(
                    toast
                );

            },
            duration
        );


    toast.dataset.timeoutId =
        String(timeout);


    return toast;

}


function removeToast(
    toast
) {

    if (
        !toast ||
        !toast.isConnected
    ) {

        return;

    }


    if (
        toast.dataset.timeoutId
    ) {

        clearTimeout(
            Number(
                toast.dataset.timeoutId
            )
        );

    }


    toast.classList.remove(
        "show"
    );


    toast.classList.add(
        "removing"
    );


    setTimeout(
        () => {

            toast.remove();

            STATE.toastCount =
                Math.max(
                    0,
                    STATE.toastCount - 1
                );

        },
        220
    );

}


/* ============================================================
   CSRF
============================================================ */

function getCSRFToken() {

    const input =
        document.querySelector(
            '[name="csrfmiddlewaretoken"]'
        );


    if (input?.value) {

        return input.value;

    }


    const meta =
        document.querySelector(
            'meta[name="csrf-token"]'
        );


    if (meta?.content) {

        return meta.content;

    }


    const cookie =
        document.cookie
            .split("; ")
            .find(
                row =>
                    row.startsWith(
                        "csrftoken="
                    )
            );


    if (!cookie) {

        return "";

    }


    return decodeURIComponent(
        cookie.substring(
            "csrftoken=".length
        )
    );

}


/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
    url,
    options = {}
) {

    if (!url) {

        throw new Error(
            "API URL is required."
        );

    }


    const method =
        (
            options.method ||
            "GET"
        ).toUpperCase();


    const headers = {

        "X-Requested-With":
            "XMLHttpRequest",

        "Accept":
            "application/json",

        ...(options.headers || {})

    };


    if (
        ![
            "GET",
            "HEAD",
            "OPTIONS"
        ].includes(method)
    ) {

        const csrf =
            getCSRFToken();


        if (csrf) {

            headers["X-CSRFToken"] =
                csrf;

        }

    }


    let body =
        options.body;


    if (
        body &&
        typeof body === "object" &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof URLSearchParams)
    ) {

        headers["Content-Type"] =
            "application/json";


        body =
            JSON.stringify(
                body
            );

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                method,
                headers,
                body
            }
        );


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            data =
                await response.json();

        } catch {

            data = null;

        }

    } else {

        data =
            await response.text();

    }


    if (!response.ok) {

        const message =
            data &&
            typeof data === "object"
                ? (
                    data.message ||
                    data.error ||
                    data.detail
                )
                : null;


        const error =
            new Error(
                message ||
                `Request failed with status ${response.status}`
            );


        error.status =
            response.status;


        error.data =
            data;


        error.response =
            response;


        throw error;

    }


    return data;

}


/* ============================================================
   API + LOADER
============================================================ */

async function apiRequestWithLoader(
    url,
    options = {},
    message = "Loading..."
) {

    showLoader(
        message
    );


    try {

        return await apiRequest(
            url,
            options
        );

    } finally {

        hideLoader();

    }

}


/* ============================================================
   HELPERS
============================================================ */

function safeJSONParse(
    value,
    fallback = null
) {

    try {

        return JSON.parse(
            value
        );

    } catch {

        return fallback;

    }

}


function serializeForm(
    form
) {

    if (!form) {

        throw new Error(
            "Form element is required."
        );

    }


    const formData =
        new FormData(
            form
        );


    const data = {};


    formData.forEach(
        (value, key) => {

            if (
                Object.prototype.hasOwnProperty.call(
                    data,
                    key
                )
            ) {

                if (
                    !Array.isArray(
                        data[key]
                    )
                ) {

                    data[key] =
                        [data[key]];

                }


                data[key].push(
                    value
                );

            } else {

                data[key] =
                    value;

            }

        }
    );


    return data;

}


function buildURL(
    baseURL,
    params = {}
) {

    const url =
        new URL(
            baseURL,
            window.location.origin
        );


    Object.entries(
        params
    ).forEach(
        ([key, value]) => {

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                url.searchParams.set(
                    key,
                    value
                );

            }

        }
    );


    return url.toString();

}


function debounce(
    callback,
    delay = 300
) {

    let timeout;


    return function (...args) {

        clearTimeout(
            timeout
        );


        timeout =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


async function copyToClipboard(
    text
) {

    if (!text) {

        showToast(
            "Nothing to copy.",
            "warning"
        );

        return false;

    }


    try {

        await navigator.clipboard.writeText(
            String(text)
        );


        showToast(
            "Copied to clipboard.",
            "success"
        );


        return true;

    } catch {

        showToast(
            "Unable to copy.",
            "error"
        );


        return false;

    }

}


function confirmAction(
    message,
    callback
) {

    if (
        !window.confirm(
            message
        )
    ) {

        return false;

    }


    if (
        typeof callback ===
        "function"
    ) {

        callback();

    }


    return true;

}


/* ============================================================
   VISIBILITY
============================================================ */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            closeAllDropdowns();

        }

    }
);


/* ============================================================
   GLOBAL ERROR HANDLERS
============================================================ */

window.addEventListener(
    "error",
    event => {

        console.error(
            "[SuperAdmin Error]",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "[SuperAdmin Promise Error]",
            event.reason
        );

    }
);


/* ============================================================
   PUBLIC API
============================================================ */

window.SuperAdmin = {

    toggleTheme,

    applyTheme,

    openSidebar,

    closeSidebar,

    isMobileSidebarOpen,

    toggleNotificationDropdown,

    closeNotificationDropdown,

    toggleUserDropdown,

    closeUserDropdown,

    closeAllDropdowns,

    markNotificationsAsRead,

    updateNotificationCount,

    showToast,

    removeToast,

    showLoader,

    hideLoader,

    apiRequest,

    apiRequestWithLoader,

    getCSRFToken,

    serializeForm,

    buildURL,

    safeJSONParse,

    debounce,

    copyToClipboard,

    confirmAction,

    normalizePath

};


/* ============================================================
   DEVELOPMENT INFO
============================================================ */

if (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
) {

    console.info(
        "%c SITA PATH LAB SUPER ADMIN ",
        "background:#2563eb;color:#fff;font-weight:700;padding:5px 10px;border-radius:5px;"
    );

    console.info(
        "Super Admin Base JS initialized successfully."
    );

}