/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN - SUPPORT MANAGEMENT
 * Production-level frontend controller
 * ============================================================
 */

"use strict";


/* ============================================================
   STATE
============================================================ */

let tickets = [];
let filteredTickets = [];
let currentPage = 1;

const ITEMS_PER_PAGE = 8;

let selectedTicket = null;


/* ============================================================
   DEMO DATA
   Replace API endpoint when backend is ready
============================================================ */

const demoTickets = [
    {
        id: "TKT-1048",
        vendor: "Sita Diagnostics",
        subject: "Unable to generate patient invoice",
        category: "billing",
        priority: "high",
        status: "open",
        created: "12 Aug 2026, 08:10 AM",
        assigned: "Billing Team",
        description:
            "Vendor is unable to generate the final invoice after completing the payment process."
    },

    {
        id: "TKT-1047",
        vendor: "Apollo Lab",
        subject: "License activation issue",
        category: "license",
        priority: "critical",
        status: "in_progress",
        created: "12 Aug 2026, 07:45 AM",
        assigned: "Technical Team",
        description:
            "The vendor reports that the newly generated license key is not being accepted."
    },

    {
        id: "TKT-1046",
        vendor: "MediCare Pathology",
        subject: "Subscription renewal query",
        category: "subscription",
        priority: "medium",
        status: "pending",
        created: "11 Aug 2026, 05:32 PM",
        assigned: "Super Admin",
        description:
            "Vendor wants clarification regarding the upcoming subscription renewal."
    },

    {
        id: "TKT-1045",
        vendor: "City Health Lab",
        subject: "Dashboard loading slowly",
        category: "technical",
        priority: "high",
        status: "in_progress",
        created: "11 Aug 2026, 03:18 PM",
        assigned: "Technical Team",
        description:
            "Dashboard response time is significantly higher during peak working hours."
    },

    {
        id: "TKT-1044",
        vendor: "Prime Diagnostics",
        subject: "User account access",
        category: "account",
        priority: "low",
        status: "resolved",
        created: "10 Aug 2026, 01:20 PM",
        assigned: "Support Team",
        description:
            "Vendor requested assistance with resetting a staff account password."
    },

    {
        id: "TKT-1043",
        vendor: "HealthCare Lab",
        subject: "Report printing issue",
        category: "technical",
        priority: "medium",
        status: "open",
        created: "10 Aug 2026, 10:15 AM",
        assigned: "Technical Team",
        description:
            "Patient reports are not printing correctly from the report module."
    },

    {
        id: "TKT-1042",
        vendor: "MediPlus Lab",
        subject: "Payment verification pending",
        category: "billing",
        priority: "high",
        status: "pending",
        created: "09 Aug 2026, 06:30 PM",
        assigned: "Billing Team",
        description:
            "Payment has been completed but transaction verification is still pending."
    },

    {
        id: "TKT-1041",
        vendor: "Sita Diagnostics",
        subject: "Staff role permission issue",
        category: "account",
        priority: "medium",
        status: "closed",
        created: "09 Aug 2026, 11:45 AM",
        assigned: "Super Admin",
        description:
            "Staff member was unable to access the assigned report permissions."
    }
];


/* ============================================================
   DOM
============================================================ */

const tableBody = document.getElementById("ticketTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("ticketSearch");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const categoryFilter = document.getElementById("categoryFilter");

const pagination = document.getElementById("pagination");
const resultCount = document.getElementById("resultCount");


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    tickets = [...demoTickets];

    bindEvents();

    applyFilters();

});


/* ============================================================
   EVENT BINDINGS
============================================================ */

function bindEvents() {

    searchInput?.addEventListener(
        "input",
        debounce(applyFilters, 250)
    );

    statusFilter?.addEventListener(
        "change",
        applyFilters
    );

    priorityFilter?.addEventListener(
        "change",
        applyFilters
    );

    categoryFilter?.addEventListener(
        "change",
        applyFilters
    );


    document
        .getElementById("createTicketBtn")
        ?.addEventListener(
            "click",
            openCreateModal
        );


    document
        .getElementById("closeTicketModal")
        ?.addEventListener(
            "click",
            closeTicketModal
        );


    document
        .getElementById("cancelTicketBtn")
        ?.addEventListener(
            "click",
            closeTicketModal
        );


    document
        .getElementById("sendReplyBtn")
        ?.addEventListener(
            "click",
            sendReply
        );


    document
        .getElementById("closeCreateModal")
        ?.addEventListener(
            "click",
            closeCreateModal
        );


    document
        .getElementById("cancelCreateBtn")
        ?.addEventListener(
            "click",
            closeCreateModal
        );


    document
        .getElementById("createTicketForm")
        ?.addEventListener(
            "submit",
            createTicket
        );


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeTicketModal();

            closeCreateModal();

        }

    });

}


/* ============================================================
   FILTER
============================================================ */

function applyFilters() {

    const search =
        searchInput?.value
            .trim()
            .toLowerCase() || "";

    const status =
        statusFilter?.value || "all";

    const priority =
        priorityFilter?.value || "all";

    const category =
        categoryFilter?.value || "all";


    filteredTickets = tickets.filter(ticket => {

        const searchableText = [
            ticket.id,
            ticket.vendor,
            ticket.subject,
            ticket.category
        ]
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !search ||
            searchableText.includes(search);


        const matchesStatus =
            status === "all" ||
            ticket.status === status;


        const matchesPriority =
            priority === "all" ||
            ticket.priority === priority;


        const matchesCategory =
            category === "all" ||
            ticket.category === category;


        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesCategory
        );

    });


    currentPage = 1;

    renderTickets();

    renderPagination();

    updateStatistics();

}


/* ============================================================
   RENDER TABLE
============================================================ */

function renderTickets() {

    if (!tableBody) return;

    tableBody.innerHTML = "";


    const start =
        (currentPage - 1) * ITEMS_PER_PAGE;

    const end =
        start + ITEMS_PER_PAGE;

    const pageTickets =
        filteredTickets.slice(start, end);


    if (!pageTickets.length) {

        emptyState.style.display = "block";

        resultCount.textContent =
            "Showing 0 tickets";

        return;

    }


    emptyState.style.display = "none";


    pageTickets.forEach(ticket => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <span
                    class="ticket-number"
                    data-id="${escapeHTML(ticket.id)}"
                >
                    ${escapeHTML(ticket.id)}
                </span>
            </td>

            <td>
                <span class="vendor-name">
                    ${escapeHTML(ticket.vendor)}
                </span>
            </td>

            <td>
                <span class="ticket-subject">
                    ${escapeHTML(ticket.subject)}
                </span>
            </td>

            <td>
                <span class="category-badge">
                    ${formatCategory(ticket.category)}
                </span>
            </td>

            <td>
                <span class="
                    priority-badge
                    priority-${escapeHTML(ticket.priority)}
                ">
                    ${formatStatus(ticket.priority)}
                </span>
            </td>

            <td>
                <span class="
                    status-badge
                    ${getStatusClass(ticket.status)}
                ">
                    ${formatStatus(ticket.status)}
                </span>
            </td>

            <td>
                ${escapeHTML(ticket.created)}
            </td>

            <td>
                ${escapeHTML(ticket.assigned)}
            </td>

            <td>
                <button
                    class="action-btn"
                    type="button"
                    title="View ticket"
                    data-action="view"
                    data-id="${escapeHTML(ticket.id)}"
                >
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>

        `;


        tableBody.appendChild(row);

    });


    tableBody
        .querySelectorAll("[data-action='view']")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openTicket(button.dataset.id)
            );

        });


    tableBody
        .querySelectorAll(".ticket-number")
        .forEach(ticketNumber => {

            ticketNumber.addEventListener(
                "click",
                () => openTicket(ticketNumber.dataset.id)
            );

        });


    const startNumber =
        start + 1;

    const endNumber =
        Math.min(
            end,
            filteredTickets.length
        );


    resultCount.textContent =
        `Showing ${startNumber}-${endNumber} of ${filteredTickets.length} tickets`;

}


/* ============================================================
   STATISTICS
============================================================ */

function updateStatistics() {

    const total =
        tickets.length;

    const open =
        tickets.filter(ticket =>
            ["open", "pending", "in_progress"]
                .includes(ticket.status)
        ).length;

    const highPriority =
        tickets.filter(ticket =>
            ["high", "critical"]
                .includes(ticket.priority)
        ).length;

    const resolved =
        tickets.filter(ticket =>
            ["resolved", "closed"]
                .includes(ticket.status)
        ).length;


    setText("totalTickets", total);
    setText("openTickets", open);
    setText("highPriorityTickets", highPriority);
    setText("resolvedTickets", resolved);

}


/* ============================================================
   PAGINATION
============================================================ */

function renderPagination() {

    if (!pagination) return;

    pagination.innerHTML = "";


    const totalPages =
        Math.ceil(
            filteredTickets.length /
            ITEMS_PER_PAGE
        );


    if (totalPages <= 1) return;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            `page-btn ${
                page === currentPage
                    ? "active"
                    : ""
            }`;

        button.textContent = page;


        button.addEventListener(
            "click",
            () => {

                currentPage = page;

                renderTickets();

                renderPagination();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


        pagination.appendChild(button);

    }

}


/* ============================================================
   OPEN TICKET
============================================================ */

function openTicket(ticketId) {

    selectedTicket =
        tickets.find(
            ticket => ticket.id === ticketId
        );


    if (!selectedTicket) return;


    setText(
        "modalTicketTitle",
        selectedTicket.subject
    );

    setText(
        "modalTicketId",
        selectedTicket.id
    );

    setText(
        "modalTicketStatus",
        formatStatus(selectedTicket.status)
    );

    setText(
        "modalTicketPriority",
        formatStatus(selectedTicket.priority)
    );

    setText(
        "modalVendor",
        selectedTicket.vendor
    );

    setText(
        "modalCategory",
        formatCategory(selectedTicket.category)
    );

    setText(
        "modalCreated",
        selectedTicket.created
    );

    setText(
        "modalAssigned",
        selectedTicket.assigned
    );

    setText(
        "modalDescription",
        selectedTicket.description
    );


    const reply =
        document.getElementById("ticketReply");

    if (reply) {
        reply.value = "";
    }


    document
        .getElementById("ticketModal")
        ?.classList.add("active");

}


/* ============================================================
   CLOSE TICKET MODAL
============================================================ */

function closeTicketModal() {

    document
        .getElementById("ticketModal")
        ?.classList.remove("active");

    selectedTicket = null;

}


/* ============================================================
   SEND REPLY
============================================================ */

function sendReply() {

    if (!selectedTicket) return;


    const reply =
        document
            .getElementById("ticketReply")
            ?.value
            .trim();


    if (!reply) {

        showToast(
            "Please enter a response.",
            "warning"
        );

        return;

    }


    /*
     * Production:
     * Replace this section with POST API.
     */


    selectedTicket.status =
        "resolved";


    const index =
        tickets.findIndex(
            ticket =>
                ticket.id === selectedTicket.id
        );


    if (index !== -1) {

        tickets[index] =
            selectedTicket;

    }


    closeTicketModal();

    applyFilters();


    showToast(
        "Response sent successfully.",
        "success"
    );

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    document
        .getElementById("createModal")
        ?.classList.add("active");

}


function closeCreateModal() {

    document
        .getElementById("createModal")
        ?.classList.remove("active");

}


/* ============================================================
   CREATE TICKET
============================================================ */

function createTicket(event) {

    event.preventDefault();


    const vendor =
        document.getElementById("vendorName").value;

    const category =
        document.getElementById("ticketCategory").value;

    const priority =
        document.getElementById("ticketPriority").value;

    const assigned =
        document.getElementById("ticketAssignee").value;

    const subject =
        document
            .getElementById("ticketSubject")
            .value
            .trim();

    const description =
        document
            .getElementById("ticketDescription")
            .value
            .trim();


    if (
        !vendor ||
        !category ||
        !subject ||
        !description
    ) {

        showToast(
            "Please complete all required fields.",
            "warning"
        );

        return;

    }


    const ticketNumber =
        `TKT-${1049 + tickets.length}`;


    const newTicket = {

        id: ticketNumber,

        vendor,

        subject,

        category,

        priority,

        status: "open",

        created:
            new Date().toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),

        assigned:
            assigned === "admin"
                ? "Super Admin"
                : assigned === "technical"
                    ? "Technical Team"
                    : assigned === "billing"
                        ? "Billing Team"
                        : "Support Team",

        description

    };


    tickets.unshift(newTicket);


    document
        .getElementById("createTicketForm")
        .reset();


    closeCreateModal();

    applyFilters();


    showToast(
        `${ticketNumber} created successfully.`,
        "success"
    );

}


/* ============================================================
   HELPERS
============================================================ */

function formatStatus(value) {

    if (!value) return "—";

    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


function formatCategory(value) {

    return formatStatus(value);

}


function getStatusClass(status) {

    const map = {

        open: "status-open",

        pending: "status-pending",

        in_progress: "status-progress",

        resolved: "status-resolved",

        closed: "status-closed"

    };

    return map[status] || "status-closed";

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "—";

    }

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function debounce(callback, delay = 250) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(
            () => callback(...args),
            delay
        );

    };

}


/* ============================================================
   TOAST
============================================================ */

function showToast(message, type = "success") {

    let container =
        document.getElementById(
            "supportToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "supportToastContainer";

        container.style.position =
            "fixed";

        container.style.right =
            "22px";

        container.style.bottom =
            "22px";

        container.style.zIndex =
            "10000";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "10px";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");


    toast.style.minWidth =
        "280px";

    toast.style.padding =
        "13px 16px";

    toast.style.borderRadius =
        "10px";

    toast.style.background =
        "#0f172a";

    toast.style.color =
        "#ffffff";

    toast.style.fontSize =
        "12px";

    toast.style.fontWeight =
        "700";

    toast.style.boxShadow =
        "0 12px 30px rgba(0,0,0,.18)";

    toast.style.borderLeft =
        type === "warning"
            ? "4px solid #f59e0b"
            : "4px solid #22c55e";

    toast.textContent =
        message;


    container.appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateY(8px)";

        toast.style.transition =
            "all .2s ease";


        setTimeout(
            () => toast.remove(),
            220
        );

    }, 3000);

}