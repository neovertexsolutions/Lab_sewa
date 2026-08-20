/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN — PAYMENTS MANAGEMENT
 * Production / Industry Level JavaScript
 * ============================================================
 *
 * Responsibilities:
 * - Fetch payments from Django API
 * - Search / Filter / Pagination
 * - Payment details
 * - Refund
 * - Delete
 * - Export CSV
 * - Toast notifications
 * - Loading / Empty / Error states
 * - CSRF protection
 * ============================================================
 */

"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const PAYMENT_CONFIG = {
    API: {
        LIST: "/api/superadmin/payments/",
        DETAIL: "/api/superadmin/payments/",
        REFUND: "/api/superadmin/payments/",
        DELETE: "/api/superadmin/payments/"
    },

    PAGINATION: {
        PER_PAGE: 10
    },

    SEARCH: {
        DEBOUNCE_TIME: 350
    }
};


/* ============================================================
   APPLICATION STATE
   ============================================================ */

const paymentState = {
    payments: [],

    filteredPayments: [],

    currentPage: 1,

    perPage: PAYMENT_CONFIG.PAGINATION.PER_PAGE,

    searchQuery: "",

    statusFilter: "all",

    dateFilter: "all",

    selectedPayment: null,

    isLoading: false
};


/* ============================================================
   DOM CACHE
   ============================================================ */

const paymentDOM = {};


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    initializePaymentDOM();

    initializePaymentEvents();

    loadPayments();

});


/* ============================================================
   DOM INITIALIZATION
   ============================================================ */

function initializePaymentDOM() {

    paymentDOM.tableBody =
        document.getElementById("paymentsTableBody");

    paymentDOM.searchInput =
        document.getElementById("paymentSearch");

    paymentDOM.statusFilter =
        document.getElementById("paymentStatusFilter");

    paymentDOM.dateFilter =
        document.getElementById("paymentDateFilter");

    paymentDOM.refreshButton =
        document.getElementById("refreshPayments");

    paymentDOM.exportButton =
        document.getElementById("exportPayments");

    paymentDOM.pagination =
        document.getElementById("paymentsPagination");

    paymentDOM.loading =
        document.getElementById("paymentsLoading");

    paymentDOM.emptyState =
        document.getElementById("paymentsEmpty");

    paymentDOM.errorState =
        document.getElementById("paymentsError");

    paymentDOM.totalPayments =
        document.getElementById("totalPayments");

    paymentDOM.successPayments =
        document.getElementById("successfulPayments");

    paymentDOM.pendingPayments =
        document.getElementById("pendingPayments");

    paymentDOM.failedPayments =
        document.getElementById("failedPayments");

    paymentDOM.totalRevenue =
        document.getElementById("totalRevenue");

}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function initializePaymentEvents() {

    /* --------------------------------------------
       SEARCH
    -------------------------------------------- */

    if (paymentDOM.searchInput) {

        paymentDOM.searchInput.addEventListener(
            "input",
            debounce((event) => {

                paymentState.searchQuery =
                    event.target.value.trim().toLowerCase();

                paymentState.currentPage = 1;

                applyFilters();

            }, PAYMENT_CONFIG.SEARCH.DEBOUNCE_TIME)
        );

    }


    /* --------------------------------------------
       STATUS FILTER
    -------------------------------------------- */

    if (paymentDOM.statusFilter) {

        paymentDOM.statusFilter.addEventListener(
            "change",
            (event) => {

                paymentState.statusFilter =
                    event.target.value;

                paymentState.currentPage = 1;

                applyFilters();

            }
        );

    }


    /* --------------------------------------------
       DATE FILTER
    -------------------------------------------- */

    if (paymentDOM.dateFilter) {

        paymentDOM.dateFilter.addEventListener(
            "change",
            (event) => {

                paymentState.dateFilter =
                    event.target.value;

                paymentState.currentPage = 1;

                applyFilters();

            }
        );

    }


    /* --------------------------------------------
       REFRESH
    -------------------------------------------- */

    if (paymentDOM.refreshButton) {

        paymentDOM.refreshButton.addEventListener(
            "click",
            () => {

                loadPayments();

            }
        );

    }


    /* --------------------------------------------
       EXPORT
    -------------------------------------------- */

    if (paymentDOM.exportButton) {

        paymentDOM.exportButton.addEventListener(
            "click",
            exportPaymentsCSV
        );

    }


    /* --------------------------------------------
       TABLE ACTIONS
    -------------------------------------------- */

    if (paymentDOM.tableBody) {

        paymentDOM.tableBody.addEventListener(
            "click",
            handlePaymentAction
        );

    }

}


/* ============================================================
   LOAD PAYMENTS
   ============================================================ */

async function loadPayments() {

    setLoadingState(true);

    hideError();

    try {

        const response = await fetch(
            PAYMENT_CONFIG.API.LIST,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },

                credentials: "same-origin"
            }
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();


        /*
         * Supports different Django API formats:
         *
         * []
         *
         * {
         *    results: []
         * }
         *
         * {
         *    payments: []
         * }
         */

        if (Array.isArray(data)) {

            paymentState.payments = data;

        } else if (Array.isArray(data.results)) {

            paymentState.payments = data.results;

        } else if (Array.isArray(data.payments)) {

            paymentState.payments = data.payments;

        } else {

            paymentState.payments = [];

        }


        paymentState.currentPage = 1;


        applyFilters();

        updateStatistics();


    } catch (error) {

        console.error(
            "Payment API Error:",
            error
        );

        showError(
            "Unable to load payment records. Please try again."
        );

    } finally {

        setLoadingState(false);

    }

}


/* ============================================================
   FILTER PAYMENTS
   ============================================================ */

function applyFilters() {

    let result = [...paymentState.payments];


    /* --------------------------------------------
       SEARCH
    -------------------------------------------- */

    if (paymentState.searchQuery) {

        const query =
            paymentState.searchQuery;

        result = result.filter(payment => {

            const searchableText = [

                payment.id,

                payment.payment_id,

                payment.transaction_id,

                payment.transactionId,

                payment.patient_name,

                payment.patientName,

                payment.customer_name,

                payment.customerName,

                payment.invoice_number,

                payment.invoiceNumber,

                payment.method,

                payment.payment_method,

                payment.status

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchableText.includes(query);

        });

    }


    /* --------------------------------------------
       STATUS FILTER
    -------------------------------------------- */

    if (
        paymentState.statusFilter &&
        paymentState.statusFilter !== "all"
    ) {

        result = result.filter(payment => {

            const status =
                String(
                    payment.status ||
                    ""
                ).toLowerCase();

            return status ===
                paymentState.statusFilter.toLowerCase();

        });

    }


    /* --------------------------------------------
       DATE FILTER
    -------------------------------------------- */

    if (
        paymentState.dateFilter &&
        paymentState.dateFilter !== "all"
    ) {

        result = result.filter(payment => {

            return isPaymentInDateRange(
                payment,
                paymentState.dateFilter
            );

        });

    }


    paymentState.filteredPayments = result;

    renderPayments();

}


/* ============================================================
   DATE FILTER
   ============================================================ */

function isPaymentInDateRange(
    payment,
    range
) {

    const rawDate =
        payment.created_at ||
        payment.createdAt ||
        payment.date ||
        payment.payment_date;


    if (!rawDate) {
        return true;
    }


    const paymentDate =
        new Date(rawDate);


    if (Number.isNaN(paymentDate.getTime())) {
        return true;
    }


    const now = new Date();


    if (range === "today") {

        return (
            paymentDate.toDateString() ===
            now.toDateString()
        );

    }


    if (range === "week") {

        const weekAgo =
            new Date();

        weekAgo.setDate(
            now.getDate() - 7
        );

        return paymentDate >= weekAgo;

    }


    if (range === "month") {

        const monthAgo =
            new Date();

        monthAgo.setMonth(
            now.getMonth() - 1
        );

        return paymentDate >= monthAgo;

    }


    if (range === "year") {

        return (
            paymentDate.getFullYear() ===
            now.getFullYear()
        );

    }


    return true;

}


/* ============================================================
   RENDER PAYMENTS
   ============================================================ */

function renderPayments() {

    if (!paymentDOM.tableBody) {
        return;
    }


    const total =
        paymentState.filteredPayments.length;


    if (total === 0) {

        paymentDOM.tableBody.innerHTML = "";

        showEmptyState();

        renderPagination(0);

        return;

    }


    hideEmptyState();


    const start =
        (paymentState.currentPage - 1) *
        paymentState.perPage;


    const end =
        start +
        paymentState.perPage;


    const pagePayments =
        paymentState.filteredPayments.slice(
            start,
            end
        );


    paymentDOM.tableBody.innerHTML =
        pagePayments
            .map(payment => createPaymentRow(payment))
            .join("");


    renderPagination(total);

}


/* ============================================================
   CREATE PAYMENT ROW
   ============================================================ */

function createPaymentRow(payment) {

    const id =
        payment.id ??
        payment.payment_id ??
        "—";


    const transactionId =
        payment.transaction_id ??
        payment.transactionId ??
        "—";


    const patient =
        payment.patient_name ??
        payment.patientName ??
        payment.customer_name ??
        payment.customerName ??
        "Unknown";


    const amount =
        payment.amount ??
        payment.total ??
        0;


    const method =
        payment.payment_method ??
        payment.method ??
        "Unknown";


    const status =
        normalizeStatus(
            payment.status
        );


    const date =
        formatDate(
            payment.created_at ||
            payment.createdAt ||
            payment.date
        );


    return `
        <tr data-payment-id="${escapeHTML(id)}">

            <td>
                <span class="payment-id">
                    #${escapeHTML(id)}
                </span>
            </td>

            <td>
                <div class="patient-cell">
                    <strong>
                        ${escapeHTML(patient)}
                    </strong>
                </div>
            </td>

            <td>
                <span class="transaction-id">
                    ${escapeHTML(transactionId)}
                </span>
            </td>

            <td>
                <strong>
                    ${formatCurrency(amount)}
                </strong>
            </td>

            <td>
                <span class="payment-method">
                    ${escapeHTML(
                        formatPaymentMethod(method)
                    )}
                </span>
            </td>

            <td>
                ${createStatusBadge(status)}
            </td>

            <td>
                <span class="payment-date">
                    ${date}
                </span>
            </td>

            <td>
                <div class="payment-actions">

                    <button
                        type="button"
                        class="action-btn view-payment"
                        data-action="view"
                        data-id="${escapeHTML(id)}"
                        title="View Payment"
                    >
                        <i class="fas fa-eye"></i>
                    </button>

                    ${
                        status === "pending"
                        ? `
                        <button
                            type="button"
                            class="action-btn refund-payment"
                            data-action="refund"
                            data-id="${escapeHTML(id)}"
                            title="Refund Payment"
                        >
                            <i class="fas fa-rotate-left"></i>
                        </button>
                        `
                        : ""
                    }

                    <button
                        type="button"
                        class="action-btn delete-payment"
                        data-action="delete"
                        data-id="${escapeHTML(id)}"
                        title="Delete Payment"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </div>
            </td>

        </tr>
    `;

}


/* ============================================================
   STATUS BADGE
   ============================================================ */

function createStatusBadge(status) {

    const statusMap = {

        success: {
            label: "Successful",
            className: "success"
        },

        completed: {
            label: "Completed",
            className: "success"
        },

        paid: {
            label: "Paid",
            className: "success"
        },

        pending: {
            label: "Pending",
            className: "pending"
        },

        failed: {
            label: "Failed",
            className: "failed"
        },

        cancelled: {
            label: "Cancelled",
            className: "cancelled"
        },

        refunded: {
            label: "Refunded",
            className: "refunded"
        }

    };


    const item =
        statusMap[status] || {
            label: capitalize(status),
            className: "unknown"
        };


    return `
        <span class="status-badge ${item.className}">
            <span class="status-dot"></span>
            ${escapeHTML(item.label)}
        </span>
    `;

}


/* ============================================================
   HANDLE TABLE ACTION
   ============================================================ */

function handlePaymentAction(event) {

    const button =
        event.target.closest(
            "[data-action]"
        );


    if (!button) {
        return;
    }


    const action =
        button.dataset.action;


    const id =
        button.dataset.id;


    if (!id) {
        return;
    }


    switch (action) {

        case "view":

            viewPayment(id);

            break;


        case "refund":

            refundPayment(id);

            break;


        case "delete":

            deletePayment(id);

            break;

    }

}


/* ============================================================
   VIEW PAYMENT
   ============================================================ */

function viewPayment(id) {

    const payment =
        findPayment(id);


    if (!payment) {

        showToast(
            "Payment record not found.",
            "error"
        );

        return;

    }


    paymentState.selectedPayment =
        payment;


    openPaymentModal(payment);

}


/* ============================================================
   PAYMENT MODAL
   ============================================================ */

function openPaymentModal(payment) {

    let modal =
        document.getElementById(
            "paymentDetailsModal"
        );


    if (!modal) {

        modal =
            createPaymentModal();

        document.body.appendChild(modal);

    }


    const content =
        modal.querySelector(
            ".payment-modal-content"
        );


    content.innerHTML =
        createPaymentDetails(payment);


    modal.classList.add("active");

    document.body.classList.add(
        "modal-open"
    );


    const closeButton =
        modal.querySelector(
            "[data-close-modal]"
        );


    if (closeButton) {

        closeButton.onclick =
            closePaymentModal;

    }

}


/* ============================================================
   CREATE PAYMENT MODAL
   ============================================================ */

function createPaymentModal() {

    const modal =
        document.createElement("div");


    modal.id =
        "paymentDetailsModal";


    modal.className =
        "payment-modal";


    modal.innerHTML = `

        <div class="payment-modal-overlay"
             data-close-modal></div>

        <div class="payment-modal-box">

            <div class="payment-modal-header">

                <h3>
                    Payment Details
                </h3>

                <button
                    type="button"
                    data-close-modal
                    class="modal-close"
                >
                    <i class="fas fa-times"></i>
                </button>

            </div>

            <div class="payment-modal-content"></div>

        </div>

    `;


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.dataset.closeModal !==
                undefined
            ) {

                closePaymentModal();

            }

        }
    );


    return modal;

}


/* ============================================================
   PAYMENT DETAILS
   ============================================================ */

function createPaymentDetails(payment) {

    const status =
        normalizeStatus(
            payment.status
        );


    return `

        <div class="payment-detail-grid">

            <div class="detail-item">
                <span>Payment ID</span>
                <strong>
                    #${escapeHTML(
                        payment.id ??
                        payment.payment_id ??
                        "—"
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Transaction ID</span>
                <strong>
                    ${escapeHTML(
                        payment.transaction_id ??
                        payment.transactionId ??
                        "—"
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Patient</span>
                <strong>
                    ${escapeHTML(
                        payment.patient_name ??
                        payment.patientName ??
                        payment.customer_name ??
                        "—"
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Amount</span>
                <strong class="amount-highlight">
                    ${formatCurrency(
                        payment.amount ??
                        payment.total ??
                        0
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Payment Method</span>
                <strong>
                    ${escapeHTML(
                        formatPaymentMethod(
                            payment.payment_method ??
                            payment.method
                        )
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Status</span>
                <strong>
                    ${createStatusBadge(status)}
                </strong>
            </div>

            <div class="detail-item">
                <span>Date</span>
                <strong>
                    ${formatDate(
                        payment.created_at ||
                        payment.createdAt ||
                        payment.date
                    )}
                </strong>
            </div>

            <div class="detail-item">
                <span>Invoice</span>
                <strong>
                    ${escapeHTML(
                        payment.invoice_number ??
                        payment.invoiceNumber ??
                        "—"
                    )}
                </strong>
            </div>

        </div>

        <div class="payment-modal-footer">

            <button
                type="button"
                class="btn-secondary"
                data-close-modal
            >
                Close
            </button>

        </div>

    `;

}


/* ============================================================
   CLOSE MODAL
   ============================================================ */

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentDetailsModal"
        );


    if (modal) {

        modal.classList.remove("active");

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* ============================================================
   REFUND PAYMENT
   ============================================================ */

async function refundPayment(id) {

    const payment =
        findPayment(id);


    if (!payment) {

        showToast(
            "Payment not found.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to refund payment #${id}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        showToast(
            "Processing refund...",
            "info"
        );


        const response =
            await fetch(
                `${PAYMENT_CONFIG.API.REFUND}${encodeURIComponent(id)}/refund/`,
                {
                    method: "POST",

                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken(),
                        "X-Requested-With": "XMLHttpRequest"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({})
                }
            );


        if (!response.ok) {

            const error =
                await parseAPIError(response);

            throw new Error(error);

        }


        showToast(
            "Payment refunded successfully.",
            "success"
        );


        await loadPayments();


    } catch (error) {

        console.error(
            "Refund Error:",
            error
        );

        showToast(
            error.message ||
            "Refund failed.",
            "error"
        );

    }

}


/* ============================================================
   DELETE PAYMENT
   ============================================================ */

async function deletePayment(id) {

    const confirmed =
        window.confirm(
            `Delete payment #${id}? This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${PAYMENT_CONFIG.API.DELETE}${encodeURIComponent(id)}/`,
                {
                    method: "DELETE",

                    headers: {
                        "Accept": "application/json",
                        "X-CSRFToken": getCSRFToken(),
                        "X-Requested-With": "XMLHttpRequest"
                    },

                    credentials: "same-origin"
                }
            );


        if (!response.ok) {

            const error =
                await parseAPIError(response);

            throw new Error(error);

        }


        paymentState.payments =
            paymentState.payments.filter(
                payment =>
                    String(
                        payment.id ??
                        payment.payment_id
                    ) !== String(id)
            );


        applyFilters();

        updateStatistics();


        showToast(
            "Payment deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete Payment Error:",
            error
        );

        showToast(
            error.message ||
            "Unable to delete payment.",
            "error"
        );

    }

}


/* ============================================================
   UPDATE STATISTICS
   ============================================================ */

function updateStatistics() {

    const payments =
        paymentState.payments;


    const total =
        payments.length;


    const successful =
        payments.filter(payment => {

            const status =
                normalizeStatus(
                    payment.status
                );

            return [
                "success",
                "completed",
                "paid"
            ].includes(status);

        }).length;


    const pending =
        payments.filter(payment => {

            return normalizeStatus(
                payment.status
            ) === "pending";

        }).length;


    const failed =
        payments.filter(payment => {

            return normalizeStatus(
                payment.status
            ) === "failed";

        }).length;


    const revenue =
        payments
            .filter(payment => {

                const status =
                    normalizeStatus(
                        payment.status
                    );

                return [
                    "success",
                    "completed",
                    "paid"
                ].includes(status);

            })
            .reduce(
                (sum, payment) => {

                    return sum +
                        Number(
                            payment.amount ??
                            payment.total ??
                            0
                        );

                },
                0
            );


    updateElement(
        paymentDOM.totalPayments,
        total
    );

    updateElement(
        paymentDOM.successPayments,
        successful
    );

    updateElement(
        paymentDOM.pendingPayments,
        pending
    );

    updateElement(
        paymentDOM.failedPayments,
        failed
    );

    updateElement(
        paymentDOM.totalRevenue,
        formatCurrency(revenue)
    );

}


/* ============================================================
   PAGINATION
   ============================================================ */

function renderPagination(totalItems) {

    if (!paymentDOM.pagination) {
        return;
    }


    const totalPages =
        Math.ceil(
            totalItems /
            paymentState.perPage
        );


    if (totalPages <= 1) {

        paymentDOM.pagination.innerHTML = "";

        return;

    }


    let html = "";


    html += `
        <button
            type="button"
            class="pagination-btn"
            data-page="${paymentState.currentPage - 1}"
            ${paymentState.currentPage === 1 ? "disabled" : ""}
        >
            <i class="fas fa-chevron-left"></i>
        </button>
    `;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        if (
            page === 1 ||
            page === totalPages ||
            Math.abs(
                page -
                paymentState.currentPage
            ) <= 2
        ) {

            html += `
                <button
                    type="button"
                    class="pagination-btn ${
                        page === paymentState.currentPage
                            ? "active"
                            : ""
                    }"
                    data-page="${page}"
                >
                    ${page}
                </button>
            `;

        }

    }


    html += `
        <button
            type="button"
            class="pagination-btn"
            data-page="${paymentState.currentPage + 1}"
            ${
                paymentState.currentPage === totalPages
                    ? "disabled"
                    : ""
            }
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    `;


    paymentDOM.pagination.innerHTML =
        html;


    paymentDOM.pagination
        .querySelectorAll("[data-page]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        Number(
                            button.dataset.page
                        );


                    if (
                        page < 1 ||
                        page > totalPages
                    ) {
                        return;
                    }


                    paymentState.currentPage =
                        page;


                    renderPayments();


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        });

}


/* ============================================================
   EXPORT CSV
   ============================================================ */

function exportPaymentsCSV() {

    const payments =
        paymentState.filteredPayments;


    if (!payments.length) {

        showToast(
            "No payment records to export.",
            "warning"
        );

        return;

    }


    const headers = [
        "Payment ID",
        "Transaction ID",
        "Patient",
        "Amount",
        "Payment Method",
        "Status",
        "Date"
    ];


    const rows =
        payments.map(payment => [

            payment.id ??
            payment.payment_id ??
            "",

            payment.transaction_id ??
            payment.transactionId ??
            "",

            payment.patient_name ??
            payment.patientName ??
            payment.customer_name ??
            "",

            payment.amount ??
            payment.total ??
            0,

            payment.payment_method ??
            payment.method ??
            "",

            payment.status ??
            "",

            payment.created_at ??
            payment.createdAt ??
            payment.date ??
            ""

        ]);


    const csv = [

        headers,

        ...rows

    ]
        .map(row =>
            row.map(csvEscape).join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `payments-${getDateStamp()}.csv`;


    document.body.appendChild(link);

    link.click();

    link.remove();


    URL.revokeObjectURL(url);


    showToast(
        "Payment report exported successfully.",
        "success"
    );

}


/* ============================================================
   CSRF TOKEN
   ============================================================ */

function getCSRFToken() {

    const cookie =
        document.cookie
            .split("; ")
            .find(row =>
                row.startsWith("csrftoken=")
            );


    if (!cookie) {
        return "";
    }


    return decodeURIComponent(
        cookie.split("=")[1]
    );

}


/* ============================================================
   API ERROR PARSER
   ============================================================ */

async function parseAPIError(response) {

    try {

        const data =
            await response.json();


        if (data.detail) {
            return data.detail;
        }


        if (data.error) {
            return data.error;
        }


        if (data.message) {
            return data.message;
        }


        return "Request failed.";

    } catch {

        return `Request failed with status ${response.status}.`;

    }

}


/* ============================================================
   LOADING STATE
   ============================================================ */

function setLoadingState(isLoading) {

    paymentState.isLoading =
        isLoading;


    if (paymentDOM.loading) {

        paymentDOM.loading.style.display =
            isLoading
                ? "flex"
                : "none";

    }


    if (paymentDOM.refreshButton) {

        paymentDOM.refreshButton.disabled =
            isLoading;

    }

}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function showEmptyState() {

    if (paymentDOM.emptyState) {

        paymentDOM.emptyState.style.display =
            "flex";

    }

}


function hideEmptyState() {

    if (paymentDOM.emptyState) {

        paymentDOM.emptyState.style.display =
            "none";

    }

}


/* ============================================================
   ERROR STATE
   ============================================================ */

function showError(message) {

    if (!paymentDOM.errorState) {

        showToast(
            message,
            "error"
        );

        return;

    }


    paymentDOM.errorState.style.display =
        "flex";


    const messageElement =
        paymentDOM.errorState.querySelector(
            "[data-error-message]"
        );


    if (messageElement) {

        messageElement.textContent =
            message;

    }

}


function hideError() {

    if (paymentDOM.errorState) {

        paymentDOM.errorState.style.display =
            "none";

    }

}


/* ============================================================
   TOAST SYSTEM
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "paymentToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "paymentToastContainer";

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");


    toast.className =
        `payment-toast ${type}`;


    const icons = {

        success: "fa-check-circle",

        error: "fa-circle-exclamation",

        warning: "fa-triangle-exclamation",

        info: "fa-circle-info"

    };


    toast.innerHTML = `

        <i class="fas ${
            icons[type] ||
            icons.info
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

        <button
            type="button"
            class="toast-close"
        >
            <i class="fas fa-times"></i>
        </button>

    `;


    container.appendChild(toast);


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


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


    toast.querySelector(
        ".toast-close"
    ).addEventListener(
        "click",
        close
    );


    setTimeout(
        close,
        4000
    );

}


/* ============================================================
   HELPERS
   ============================================================ */

function findPayment(id) {

    return paymentState.payments.find(
        payment =>
            String(
                payment.id ??
                payment.payment_id
            ) === String(id)
    );

}


function normalizeStatus(status) {

    return String(
        status ||
        "unknown"
    )
        .trim()
        .toLowerCase();

}


function formatCurrency(amount) {

    const value =
        Number(amount) || 0;


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(value);

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "—";
    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


function formatPaymentMethod(method) {

    if (!method) {
        return "Unknown";
    }


    return String(method)
        .replace(/_/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


function capitalize(value) {

    if (!value) {
        return "";
    }


    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


function updateElement(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;

    }

}


function csvEscape(value) {

    const stringValue =
        String(value ?? "");


    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;

    }


    return stringValue;

}


function getDateStamp() {

    const date =
        new Date();


    return date
        .toISOString()
        .split("T")[0];

}


function debounce(
    callback,
    delay
) {

    let timeout;


    return (...args) => {

        clearTimeout(timeout);


        timeout =
            setTimeout(
                () => callback(...args),
                delay
            );

    };

}


/* ============================================================
   SECURITY
   ============================================================ */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   GLOBAL API
   ============================================================ */

window.PaymentManager = {

    refresh: loadPayments,

    exportCSV: exportPaymentsCSV,

    view: viewPayment,

    refund: refundPayment,

    delete: deletePayment,

    getState: () => ({
        ...paymentState
    })

};


/* ============================================================
   END OF PAYMENTS.JS
   ============================================================ */