/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * NOTIFICATION CENTER
 *
 * Production-oriented frontend controller
 * ============================================================
 */

(function () {

    "use strict";


    /* ========================================================
       CONFIGURATION
    ======================================================== */

    const CONFIG = {

        ITEMS_PER_PAGE: 8,

        API_ENDPOINTS: {

            LIST: "/superadmin/api/notifications/",

            MARK_READ: "/superadmin/api/notifications/mark-read/",

            MARK_UNREAD: "/superadmin/api/notifications/mark-unread/",

            MARK_ALL_READ: "/superadmin/api/notifications/mark-all-read/",

            DELETE: "/superadmin/api/notifications/delete/",

            BULK_DELETE: "/superadmin/api/notifications/bulk-delete/"

        }

    };


    /* ========================================================
       STATE
    ======================================================== */

    const state = {

        notifications: [],

        filteredNotifications: [],

        selectedIds: new Set(),

        currentPage: 1,

        activeTab: "all",

        search: "",

        type: "",

        priority: "",

        date: "",

        loading: false,

        activeNotificationId: null

    };


    /* ========================================================
       DOM
    ======================================================== */

    const DOM = {};


    function cacheDOM() {

        DOM.list =
            document.getElementById(
                "notificationList"
            );

        DOM.loading =
            document.getElementById(
                "notificationLoading"
            );

        DOM.empty =
            document.getElementById(
                "notificationEmpty"
            );

        DOM.search =
            document.getElementById(
                "notificationSearch"
            );

        DOM.typeFilter =
            document.getElementById(
                "notificationTypeFilter"
            );

        DOM.priorityFilter =
            document.getElementById(
                "notificationPriorityFilter"
            );

        DOM.dateFilter =
            document.getElementById(
                "notificationDateFilter"
            );

        DOM.pagination =
            document.getElementById(
                "notificationPagination"
            );

        DOM.selectAll =
            document.getElementById(
                "selectAllNotifications"
            );

        DOM.bulkBar =
            document.getElementById(
                "notificationBulkBar"
            );

        DOM.selectedCount =
            document.getElementById(
                "selectedNotificationCount"
            );

        DOM.modal =
            document.getElementById(
                "notificationDetailModal"
            );

        DOM.modalTitle =
            document.getElementById(
                "modalNotificationTitle"
            );

        DOM.modalBody =
            document.getElementById(
                "notificationModalBody"
            );

        DOM.confirmModal =
            document.getElementById(
                "notificationConfirmModal"
            );

        DOM.toastContainer =
            document.getElementById(
                "notificationToastContainer"
            );

    }


    /* ========================================================
       DEMO DATA
    ======================================================== */

    function getDemoNotifications() {

        const now = Date.now();

        return [

            {
                id: 1,
                title: "New Vendor Registered",
                message:
                    "A new laboratory vendor has successfully completed registration and is waiting for account activation.",
                type: "vendor",
                priority: "normal",
                vendor: "MediCare Diagnostics",
                user: "admin@medicare.com",
                read: false,
                resolved: false,
                createdAt: new Date(
                    now - 15 * 60 * 1000
                ).toISOString()
            },


            {
                id: 2,
                title: "License Expiring Soon",
                message:
                    "License for CityCare Pathology will expire within the next 7 days. Please review the subscription.",
                type: "license",
                priority: "high",
                vendor: "CityCare Pathology",
                user: "citycare_admin",
                read: false,
                resolved: false,
                createdAt: new Date(
                    now - 45 * 60 * 1000
                ).toISOString()
            },


            {
                id: 3,
                title: "Payment Received",
                message:
                    "A subscription payment has been successfully received from Apex Diagnostics.",
                type: "billing",
                priority: "normal",
                vendor: "Apex Diagnostics",
                user: "billing@apex.com",
                read: true,
                resolved: true,
                createdAt: new Date(
                    now - 2 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 4,
                title: "Subscription Expired",
                message:
                    "The subscription of Sunrise Pathology has expired. Vendor access has been automatically restricted.",
                type: "subscription",
                priority: "critical",
                vendor: "Sunrise Pathology",
                user: "sunrise_admin",
                read: false,
                resolved: false,
                createdAt: new Date(
                    now - 4 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 5,
                title: "Security Alert",
                message:
                    "Multiple failed login attempts were detected for a super administrator account.",
                type: "security",
                priority: "critical",
                vendor: "System",
                user: "Security Monitor",
                read: false,
                resolved: false,
                createdAt: new Date(
                    now - 6 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 6,
                title: "System Backup Completed",
                message:
                    "Scheduled database backup completed successfully without errors.",
                type: "system",
                priority: "low",
                vendor: "System",
                user: "Backup Service",
                read: true,
                resolved: true,
                createdAt: new Date(
                    now - 9 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 7,
                title: "Support Ticket Created",
                message:
                    "A new support ticket has been created by a vendor regarding report generation.",
                type: "support",
                priority: "normal",
                vendor: "Prime Lab",
                user: "prime_admin",
                read: false,
                resolved: false,
                createdAt: new Date(
                    now - 12 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 8,
                title: "License Activated",
                message:
                    "A new annual license has been activated successfully.",
                type: "license",
                priority: "normal",
                vendor: "HealthPlus Diagnostics",
                user: "healthplus_admin",
                read: true,
                resolved: true,
                createdAt: new Date(
                    now - 18 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 9,
                title: "Vendor Account Suspended",
                message:
                    "Vendor account has been temporarily suspended by the super administrator.",
                type: "vendor",
                priority: "high",
                vendor: "Global Path Lab",
                user: "global_admin",
                read: true,
                resolved: false,
                createdAt: new Date(
                    now - 2 * 24 * 60 * 60 * 1000
                ).toISOString()
            },


            {
                id: 10,
                title: "Invoice Generated",
                message:
                    "Monthly subscription invoice has been generated successfully.",
                type: "billing",
                priority: "low",
                vendor: "LifeCare Diagnostics",
                user: "billing@lifecare.com",
                read: true,
                resolved: true,
                createdAt: new Date(
                    now - 3 * 24 * 60 * 60 * 1000
                ).toISOString()
            }

        ];

    }


    /* ========================================================
       ICON MAP
    ======================================================== */

    function getIcon(type) {

        const icons = {

            system:
                "fa-server",

            vendor:
                "fa-building",

            billing:
                "fa-credit-card",

            subscription:
                "fa-arrows-rotate",

            license:
                "fa-key",

            security:
                "fa-shield-halved",

            support:
                "fa-headset"

        };

        return icons[type] || "fa-bell";

    }


    /* ========================================================
       INITIALIZATION
    ======================================================== */

    async function init() {

        cacheDOM();

        bindEvents();

        await loadNotifications();

    }


    /* ========================================================
       LOAD
    ======================================================== */

    async function loadNotifications() {

        setLoading(true);

        try {

            /*
             * Production:
             *
             * const response = await fetch(
             *     CONFIG.API_ENDPOINTS.LIST
             * );
             *
             * const data = await response.json();
             *
             * state.notifications = data.results;
             */

            await wait(300);

            state.notifications =
                getDemoNotifications();

            state.currentPage = 1;

            applyFilters();

            updateStats();

        }

        catch (error) {

            console.error(
                "Notification loading failed:",
                error
            );

            showToast(
                "Unable to load notifications.",
                "error"
            );

        }

        finally {

            setLoading(false);

        }

    }


    /* ========================================================
       FILTER
    ======================================================== */

    function applyFilters() {

        let result =
            [...state.notifications];


        /* TAB */

        if (state.activeTab === "unread") {

            result =
                result.filter(
                    notification =>
                        !notification.read
                );

        }


        if (state.activeTab === "important") {

            result =
                result.filter(
                    notification =>
                        notification.priority === "high" ||
                        notification.priority === "critical"
                );

        }


        if (
            state.activeTab === "system" ||
            state.activeTab === "vendor" ||
            state.activeTab === "billing"
        ) {

            result =
                result.filter(
                    notification =>
                        notification.type ===
                        state.activeTab
                );

        }


        /* SEARCH */

        if (state.search) {

            const query =
                state.search.toLowerCase();

            result =
                result.filter(notification => {

                    return (

                        notification.title
                            .toLowerCase()
                            .includes(query)

                        ||

                        notification.message
                            .toLowerCase()
                            .includes(query)

                        ||

                        notification.vendor
                            .toLowerCase()
                            .includes(query)

                        ||

                        notification.user
                            .toLowerCase()
                            .includes(query)

                    );

                });

        }


        /* TYPE */

        if (state.type) {

            result =
                result.filter(
                    notification =>
                        notification.type ===
                        state.type
                );

        }


        /* PRIORITY */

        if (state.priority) {

            result =
                result.filter(
                    notification =>
                        notification.priority ===
                        state.priority
                );

        }


        /* DATE */

        if (state.date) {

            result =
                result.filter(
                    notification =>
                        matchesDate(
                            notification.createdAt,
                            state.date
                        )
                );

        }


        state.filteredNotifications =
            result;


        render();

    }


    /* ========================================================
       DATE FILTER
    ======================================================== */

    function matchesDate(dateString, filter) {

        const date =
            new Date(dateString);

        const now =
            new Date();


        if (filter === "today") {

            return (
                date.toDateString() ===
                now.toDateString()
            );

        }


        if (filter === "week") {

            const weekAgo =
                new Date();

            weekAgo.setDate(
                now.getDate() - 7
            );

            return date >= weekAgo;

        }


        if (filter === "month") {

            return (
                date.getMonth() ===
                    now.getMonth()
                &&
                date.getFullYear() ===
                    now.getFullYear()
            );

        }


        return true;

    }


    /* ========================================================
       RENDER
    ======================================================== */

    function render() {

        const start =
            (state.currentPage - 1) *
            CONFIG.ITEMS_PER_PAGE;

        const end =
            start +
            CONFIG.ITEMS_PER_PAGE;

        const items =
            state.filteredNotifications
                .slice(start, end);


        DOM.list.innerHTML = "";


        if (!items.length) {

            DOM.empty.hidden = false;

        }
        else {

            DOM.empty.hidden = true;

            items.forEach(
                notification =>
                    DOM.list.appendChild(
                        createNotificationElement(
                            notification
                        )
                    )
            );

        }


        updateResultText();

        renderPagination();

        updateBulkSelection();

    }


    /* ========================================================
       CREATE ITEM
    ======================================================== */

    function createNotificationElement(
        notification
    ) {

        const item =
            document.createElement("article");

        item.className =
            "notification-item" +
            (
                notification.read
                    ? ""
                    : " unread"
            );

        item.dataset.id =
            notification.id;


        item.innerHTML = `

            <div class="notification-checkbox">

                <input
                    type="checkbox"
                    class="notification-check"
                    data-id="${notification.id}"
                    ${state.selectedIds.has(notification.id)
                        ? "checked"
                        : ""}
                >

            </div>


            <div class="
                notification-item-icon
                ${escapeHTML(notification.type)}
            ">

                <i class="fa-solid ${getIcon(notification.type)}"></i>

            </div>


            <div class="notification-content">

                <div class="notification-title-row">

                    <span class="notification-title">

                        ${escapeHTML(notification.title)}

                    </span>

                    <span class="
                        notification-priority
                        ${escapeHTML(notification.priority)}
                    ">

                        ${escapeHTML(notification.priority)}

                    </span>

                </div>


                <div class="notification-description">

                    ${escapeHTML(notification.message)}

                </div>


                <div class="notification-meta">

                    <span>

                        <i class="fa-solid fa-building"></i>

                        ${escapeHTML(notification.vendor)}

                    </span>


                    <span>

                        <i class="fa-solid fa-user"></i>

                        ${escapeHTML(notification.user)}

                    </span>

                </div>

            </div>


            <div class="notification-time">

                ${formatRelativeTime(
                    notification.createdAt
                )}

            </div>


            <button
                type="button"
                class="notification-more"
                data-notification-menu="${notification.id}"
                aria-label="Notification actions"
            >

                <i class="fa-solid fa-ellipsis-vertical"></i>

            </button>

        `;


        item.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.closest(
                        ".notification-check"
                    )
                ) {

                    return;

                }


                if (
                    event.target.closest(
                        ".notification-more"
                    )
                ) {

                    return;

                }


                openNotification(
                    notification.id
                );

            }
        );


        const checkbox =
            item.querySelector(
                ".notification-check"
            );


        checkbox.addEventListener(
            "change",
            function () {

                if (this.checked) {

                    state.selectedIds.add(
                        notification.id
                    );

                }
                else {

                    state.selectedIds.delete(
                        notification.id
                    );

                }

                updateBulkSelection();

            }
        );


        const moreButton =
            item.querySelector(
                ".notification-more"
            );


        moreButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                showNotificationMenu(
                    notification.id,
                    moreButton
                );

            }
        );


        return item;

    }


    /* ========================================================
       NOTIFICATION MENU
    ======================================================== */

    function showNotificationMenu(
        id,
        button
    ) {

        removeActionMenu();


        const notification =
            state.notifications.find(
                item => item.id === id
            );


        if (!notification) {
            return;
        }


        const menu =
            document.createElement("div");

        menu.className =
            "notification-action-menu";


        menu.innerHTML = `

            <button data-menu-action="view">
                <i class="fa-solid fa-eye"></i>
                View Details
            </button>

            <button data-menu-action="read">
                <i class="fa-solid fa-envelope-open"></i>
                ${notification.read
                    ? "Mark Unread"
                    : "Mark Read"}
            </button>

            <button
                class="danger"
                data-menu-action="delete"
            >
                <i class="fa-solid fa-trash"></i>
                Delete
            </button>

        `;


        document.body.appendChild(menu);


        const rect =
            button.getBoundingClientRect();


        menu.style.top =
            `${rect.bottom + 5}px`;

        menu.style.left =
            `${Math.max(
                10,
                rect.right -
                menu.offsetWidth
            )}px`;


        menu.querySelectorAll("button")
            .forEach(actionButton => {

                actionButton.addEventListener(
                    "click",
                    function () {

                        const action =
                            this.dataset.menuAction;


                        removeActionMenu();


                        if (action === "view") {

                            openNotification(id);

                        }


                        if (action === "read") {

                            toggleRead(id);

                        }


                        if (action === "delete") {

                            openDeleteConfirmation(
                                [id]
                            );

                        }

                    }
                );

            });

    }


    function removeActionMenu() {

        const existing =
            document.querySelector(
                ".notification-action-menu"
            );

        if (existing) {

            existing.remove();

        }

    }


    /* ========================================================
       OPEN DETAIL
    ======================================================== */

    function openNotification(id) {

        const notification =
            state.notifications.find(
                item => item.id === id
            );


        if (!notification) {
            return;
        }


        state.activeNotificationId =
            id;


        DOM.modalTitle.textContent =
            notification.title;


        DOM.modalBody.innerHTML = `

            <div class="notification-detail-type">

                <div class="
                    notification-detail-icon
                    ${escapeHTML(notification.type)}
                ">

                    <i class="
                        fa-solid
                        ${getIcon(notification.type)}
                    "></i>

                </div>


                <div>

                    <div class="notification-detail-title">

                        ${escapeHTML(notification.title)}

                    </div>

                    <div class="notification-detail-subtitle">

                        ${formatFullDate(
                            notification.createdAt
                        )}

                    </div>

                </div>

            </div>


            <div class="notification-detail-message">

                ${escapeHTML(notification.message)}

            </div>


            <div class="notification-detail-grid">

                <div class="notification-detail-item">

                    <span>
                        Notification Type
                    </span>

                    <strong>
                        ${escapeHTML(
                            capitalize(
                                notification.type
                            )
                        )}
                    </strong>

                </div>


                <div class="notification-detail-item">

                    <span>
                        Priority
                    </span>

                    <strong>
                        ${escapeHTML(
                            capitalize(
                                notification.priority
                            )
                        )}
                    </strong>

                </div>


                <div class="notification-detail-item">

                    <span>
                        Vendor
                    </span>

                    <strong>
                        ${escapeHTML(
                            notification.vendor
                        )}
                    </strong>

                </div>


                <div class="notification-detail-item">

                    <span>
                        User / Source
                    </span>

                    <strong>
                        ${escapeHTML(
                            notification.user
                        )}
                    </strong>

                </div>


                <div class="notification-detail-item">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${notification.resolved
                            ? "Resolved"
                            : "Pending"}
                    </strong>

                </div>


                <div class="notification-detail-item">

                    <span>
                        Read Status
                    </span>

                    <strong>
                        ${notification.read
                            ? "Read"
                            : "Unread"}
                    </strong>

                </div>

            </div>

        `;


        openModal(DOM.modal);


        if (!notification.read) {

            markAsRead(id);

        }

    }


    /* ========================================================
       READ / UNREAD
    ======================================================== */

    async function toggleRead(id) {

        const notification =
            state.notifications.find(
                item => item.id === id
            );


        if (!notification) {
            return;
        }


        if (notification.read) {

            notification.read = false;

            showToast(
                "Notification marked as unread.",
                "info"
            );

        }
        else {

            notification.read = true;

            showToast(
                "Notification marked as read.",
                "success"
            );

        }


        applyFilters();

        updateStats();

    }


    async function markAsRead(id) {

        const notification =
            state.notifications.find(
                item => item.id === id
            );


        if (!notification) {
            return;
        }


        if (notification.read) {
            return;
        }


        notification.read = true;


        applyFilters();

        updateStats();

    }


    /* ========================================================
       MARK ALL READ
    ======================================================== */

    async function markAllRead() {

        const unread =
            state.notifications.filter(
                notification =>
                    !notification.read
            );


        if (!unread.length) {

            showToast(
                "All notifications are already read.",
                "info"
            );

            return;

        }


        unread.forEach(
            notification => {
                notification.read = true;
            }
        );


        state.selectedIds.clear();


        applyFilters();

        updateStats();


        showToast(
            `${unread.length} notifications marked as read.`,
            "success"
        );

    }


    /* ========================================================
       BULK ACTIONS
    ======================================================== */

    function bulkMarkRead() {

        if (!state.selectedIds.size) {
            return;
        }


        state.notifications.forEach(
            notification => {

                if (
                    state.selectedIds.has(
                        notification.id
                    )
                ) {

                    notification.read = true;

                }

            }
        );


        const count =
            state.selectedIds.size;


        state.selectedIds.clear();


        applyFilters();

        updateStats();


        showToast(
            `${count} notifications marked as read.`,
            "success"
        );

    }


    function bulkMarkUnread() {

        if (!state.selectedIds.size) {
            return;
        }


        state.notifications.forEach(
            notification => {

                if (
                    state.selectedIds.has(
                        notification.id
                    )
                ) {

                    notification.read = false;

                }

            }
        );


        const count =
            state.selectedIds.size;


        state.selectedIds.clear();


        applyFilters();

        updateStats();


        showToast(
            `${count} notifications marked as unread.`,
            "info"
        );

    }


    /* ========================================================
       DELETE
    ======================================================== */

    function openDeleteConfirmation(
        ids
    ) {

        state.deleteIds = ids;


        const message =
            document.getElementById(
                "confirmDeleteMessage"
            );


        if (message) {

            message.textContent =
                ids.length === 1

                    ? "This notification will be permanently removed."

                    : `${ids.length} notifications will be permanently removed.`;

        }


        openModal(
            DOM.confirmModal
        );

    }


    function confirmDelete() {

        if (
            !state.deleteIds ||
            !state.deleteIds.length
        ) {
            return;
        }


        const ids =
            new Set(
                state.deleteIds
            );


        state.notifications =
            state.notifications.filter(
                notification =>
                    !ids.has(
                        notification.id
                    )
            );


        state.selectedIds.clear();


        closeAllModals();

        applyFilters();

        updateStats();


        showToast(
            "Notification deleted successfully.",
            "success"
        );


        state.deleteIds = [];

    }


    function bulkDelete() {

        if (!state.selectedIds.size) {
            return;
        }


        openDeleteConfirmation(
            Array.from(
                state.selectedIds
            )
        );

    }


    /* ========================================================
       STATS
    ======================================================== */

    function updateStats() {

        const total =
            state.notifications.length;


        const unread =
            state.notifications.filter(
                notification =>
                    !notification.read
            ).length;


        const important =
            state.notifications.filter(
                notification =>
                    notification.priority === "high" ||
                    notification.priority === "critical"
            ).length;


        const resolved =
            state.notifications.filter(
                notification =>
                    notification.resolved
            ).length;


        setText(
            "totalNotifications",
            total
        );

        setText(
            "unreadNotifications",
            unread
        );

        setText(
            "importantNotifications",
            important
        );

        setText(
            "resolvedNotifications",
            resolved
        );


        setText(
            "allCount",
            total
        );

        setText(
            "unreadTabCount",
            unread
        );

        setText(
            "importantTabCount",
            important
        );

    }


    /* ========================================================
       PAGINATION
    ======================================================== */

    function renderPagination() {

        const total =
            Math.ceil(
                state.filteredNotifications.length /
                CONFIG.ITEMS_PER_PAGE
            );


        DOM.pagination.innerHTML = "";


        if (total <= 1) {
            return;
        }


        const previous =
            createPageButton(
                "fa-chevron-left",
                state.currentPage > 1
            );


        previous.addEventListener(
            "click",
            function () {

                if (
                    state.currentPage > 1
                ) {

                    state.currentPage--;

                    render();

                }

            }
        );


        DOM.pagination.appendChild(
            previous
        );


        for (
            let page = 1;
            page <= total;
            page++
        ) {

            const button =
                document.createElement("button");


            button.type =
                "button";


            button.className =
                "notification-page-btn" +
                (
                    page === state.currentPage
                        ? " active"
                        : ""
                );


            button.textContent =
                page;


            button.addEventListener(
                "click",
                function () {

                    state.currentPage =
                        page;

                    render();

                }
            );


            DOM.pagination.appendChild(
                button
            );

        }


        const next =
            createPageButton(
                "fa-chevron-right",
                state.currentPage < total
            );


        next.addEventListener(
            "click",
            function () {

                if (
                    state.currentPage < total
                ) {

                    state.currentPage++;

                    render();

                }

            }
        );


        DOM.pagination.appendChild(
            next
        );

    }


    function createPageButton(
        icon,
        enabled
    ) {

        const button =
            document.createElement("button");


        button.type =
            "button";


        button.className =
            "notification-page-btn";


        button.disabled =
            !enabled;


        button.innerHTML =
            `<i class="fa-solid ${icon}"></i>`;


        return button;

    }


    /* ========================================================
       BULK SELECTION
    ======================================================== */

    function updateBulkSelection() {

        const count =
            state.selectedIds.size;


        DOM.selectedCount.textContent =
            count;


        if (count > 0) {

            DOM.bulkBar.classList.add(
                "active"
            );

        }
        else {

            DOM.bulkBar.classList.remove(
                "active"
            );

        }


        const visible =
            state.filteredNotifications;


        DOM.selectAll.checked =
            visible.length > 0 &&
            visible.every(
                notification =>
                    state.selectedIds.has(
                        notification.id
                    )
            );

    }


    /* ========================================================
       RESULT TEXT
    ======================================================== */

    function updateResultText() {

        const total =
            state.filteredNotifications.length;


        const start =
            total === 0
                ? 0
                : (
                    (state.currentPage - 1) *
                    CONFIG.ITEMS_PER_PAGE
                ) + 1;


        const end =
            Math.min(
                state.currentPage *
                CONFIG.ITEMS_PER_PAGE,
                total
            );


        setText(
            "notificationShowing",
            total
                ? `${start}-${end} of ${total}`
                : "0"
        );


        setText(
            "notificationResultText",
            `${total} notification${total === 1 ? "" : "s"}`
        );

    }


    /* ========================================================
       EVENTS
    ======================================================== */

    function bindEvents() {

        /* SEARCH */

        DOM.search.addEventListener(
            "input",
            debounce(
                function () {

                    state.search =
                        this.value.trim();

                    state.currentPage = 1;

                    applyFilters();

                },
                250
            )
        );


        /* TYPE */

        DOM.typeFilter.addEventListener(
            "change",
            function () {

                state.type =
                    this.value;

                state.currentPage = 1;

                applyFilters();

            }
        );


        /* PRIORITY */

        DOM.priorityFilter.addEventListener(
            "change",
            function () {

                state.priority =
                    this.value;

                state.currentPage = 1;

                applyFilters();

            }
        );


        /* DATE */

        DOM.dateFilter.addEventListener(
            "change",
            function () {

                state.date =
                    this.value;

                state.currentPage = 1;

                applyFilters();

            }
        );


        /* TABS */

        document
            .querySelectorAll(
                ".notification-tab"
            )
            .forEach(tab => {

                tab.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                ".notification-tab"
                            )
                            .forEach(item =>
                                item.classList.remove(
                                    "active"
                                )
                            );


                        this.classList.add(
                            "active"
                        );


                        state.activeTab =
                            this.dataset.tab;

                        state.currentPage = 1;

                        applyFilters();

                    }
                );

            });


        /* SELECT ALL */

        DOM.selectAll.addEventListener(
            "change",
            function () {

                const visible =
                    state.filteredNotifications;


                if (this.checked) {

                    visible.forEach(
                        notification =>
                            state.selectedIds.add(
                                notification.id
                            )
                    );

                }
                else {

                    visible.forEach(
                        notification =>
                            state.selectedIds.delete(
                                notification.id
                            )
                    );

                }


                render();

            }
        );


        /* MARK ALL */

        document
            .getElementById(
                "markAllReadBtn"
            )
            .addEventListener(
                "click",
                markAllRead
            );


        /* REFRESH */

        document
            .getElementById(
                "refreshNotifications"
            )
            .addEventListener(
                "click",
                loadNotifications
            );


        /* BULK READ */

        document
            .getElementById(
                "bulkReadBtn"
            )
            .addEventListener(
                "click",
                bulkMarkRead
            );


        /* BULK UNREAD */

        document
            .getElementById(
                "bulkUnreadBtn"
            )
            .addEventListener(
                "click",
                bulkMarkUnread
            );


        /* BULK DELETE */

        document
            .getElementById(
                "bulkDeleteBtn"
            )
            .addEventListener(
                "click",
                bulkDelete
            );


        /* CLEAR FILTERS */

        document
            .getElementById(
                "clearNotificationFilters"
            )
            .addEventListener(
                "click",
                clearFilters
            );


        /* CONFIRM DELETE */

        document
            .getElementById(
                "confirmDeleteBtn"
            )
            .addEventListener(
                "click",
                confirmDelete
            );


        /* MODAL CLOSE */

        document
            .querySelectorAll(
                "[data-close-notification-modal]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    closeAllModals
                );

            });


        document
            .querySelectorAll(
                ".notification-modal-backdrop"
            )
            .forEach(backdrop => {

                backdrop.addEventListener(
                    "click",
                    closeAllModals
                );

            });


        /* MODAL MARK READ */

        document
            .getElementById(
                "modalMarkReadBtn"
            )
            .addEventListener(
                "click",
                function () {

                    if (
                        state.activeNotificationId
                    ) {

                        markAsRead(
                            state.activeNotificationId
                        );

                        closeAllModals();

                    }

                }
            );


        /* KEYBOARD */

        document.addEventListener(
            "keydown",
            handleKeyboard
        );


        /* OUTSIDE MENU */

        document.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.closest(
                        ".notification-action-menu"
                    )
                    &&
                    !event.target.closest(
                        ".notification-more"
                    )
                ) {

                    removeActionMenu();

                }

            }
        );

    }


    /* ========================================================
       CLEAR FILTERS
    ======================================================== */

    function clearFilters() {

        state.search = "";

        state.type = "";

        state.priority = "";

        state.date = "";

        state.activeTab = "all";

        state.currentPage = 1;


        DOM.search.value = "";

        DOM.typeFilter.value = "";

        DOM.priorityFilter.value = "";

        DOM.dateFilter.value = "";


        document
            .querySelectorAll(
                ".notification-tab"
            )
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.tab === "all"
                );

            });


        applyFilters();

    }


    /* ========================================================
       MODAL
    ======================================================== */

    function openModal(modal) {

        if (!modal) {
            return;
        }


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function closeAllModals() {

        document
            .querySelectorAll(
                ".notification-modal.open"
            )
            .forEach(modal => {

                modal.classList.remove(
                    "open"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );

            });


        document.body.classList.remove(
            "modal-open"
        );


        state.activeNotificationId =
            null;

    }


    /* ========================================================
       KEYBOARD
    ======================================================== */

    function handleKeyboard(event) {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            DOM.search.focus();

        }


        if (event.key === "Escape") {

            closeAllModals();

            removeActionMenu();

        }

    }


    /* ========================================================
       LOADING
    ======================================================== */

    function setLoading(value) {

        state.loading =
            value;


        if (value) {

            DOM.loading.classList.add(
                "active"
            );

            DOM.list.style.display =
                "none";

            DOM.empty.hidden =
                true;

        }
        else {

            DOM.loading.classList.remove(
                "active"
            );

            DOM.list.style.display =
                "";

        }

    }


    /* ========================================================
       TOAST
    ======================================================== */

    function showToast(
        message,
        type = "info"
    ) {

        if (!DOM.toastContainer) {
            return;
        }


        const toast =
            document.createElement("div");


        toast.className =
            `notification-toast ${type}`;


        const iconMap = {

            success:
                "fa-circle-check",

            error:
                "fa-circle-exclamation",

            info:
                "fa-circle-info"

        };


        toast.innerHTML = `

            <div class="notification-toast-icon">

                <i class="
                    fa-solid
                    ${iconMap[type] || iconMap.info}
                "></i>

            </div>


            <div class="notification-toast-message">

                ${escapeHTML(message)}

            </div>


            <button
                type="button"
                class="notification-toast-close"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;


        DOM.toastContainer.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );

            }
        );


        const close =
            () => {

                toast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => toast.remove(),
                    250
                );

            };


        toast
            .querySelector(
                ".notification-toast-close"
            )
            .addEventListener(
                "click",
                close
            );


        setTimeout(
            close,
            3500
        );

    }


    /* ========================================================
       HELPERS
    ======================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    function capitalize(value) {

        if (!value) {
            return "";
        }


        return value
            .charAt(0)
            .toUpperCase() +
            value.slice(1);

    }


    function formatRelativeTime(
        dateString
    ) {

        const date =
            new Date(dateString);

        const seconds =
            Math.floor(
                (Date.now() - date.getTime()) /
                1000
            );


        if (seconds < 60) {

            return "Just now";

        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        if (minutes < 60) {

            return `${minutes}m ago`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return `${hours}h ago`;

        }


        const days =
            Math.floor(
                hours / 24
            );


        if (days < 7) {

            return `${days}d ago`;

        }


        return formatFullDate(
            dateString
        );

    }


    function formatFullDate(
        dateString
    ) {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(dateString)
        );

    }


    function debounce(
        callback,
        delay
    ) {

        let timer;


        return function (...args) {

            clearTimeout(timer);


            timer = setTimeout(
                () => callback.apply(
                    this,
                    args
                ),
                delay
            );

        };

    }


    function wait(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );

    }


    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;

    }


    /* ========================================================
       PUBLIC API
    ======================================================== */

    window.NotificationManager = {

        init,

        loadNotifications,

        markAllRead,

        clearFilters,

        getState: () =>
            ({ ...state })

    };


    /* ========================================================
       START
    ======================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


})();