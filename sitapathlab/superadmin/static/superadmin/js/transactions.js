/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN - TRANSACTIONS
 * Production Level Frontend Controller
 * =========================================================
 */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

let transactions = [];
let filteredTransactions = [];

let currentPage = 1;
let rowsPerPage = 10;

let selectedTransaction = null;


/* =========================================================
   DEMO DATA
   =========================================================
   Backend API connect karne par is data ko API response
   se replace kar dena.
   ========================================================= */

const demoTransactions = [

    {
        id: "TXN-20260812001",
        vendor: "Aarogya Diagnostics",
        invoice: "INV-2026-00128",
        method: "Razorpay",
        methodType: "razorpay",
        amount: 14999,
        status: "success",
        date: "2026-08-12",
        reference: "pay_RZP82K9L2",
        gateway: "Razorpay"
    },

    {
        id: "TXN-20260811002",
        vendor: "LifeCare Pathology",
        invoice: "INV-2026-00127",
        method: "UPI",
        methodType: "upi",
        amount: 7999,
        status: "success",
        date: "2026-08-11",
        reference: "UPI98272182",
        gateway: "Razorpay"
    },

    {
        id: "TXN-20260811003",
        vendor: "MediPlus Lab",
        invoice: "INV-2026-00126",
        method: "Card",
        methodType: "card",
        amount: 24999,
        status: "pending",
        date: "2026-08-11",
        reference: "CARD_PENDING_182",
        gateway: "Stripe"
    },

    {
        id: "TXN-20260810004",
        vendor: "City Diagnostic Centre",
        invoice: "INV-2026-00125",
        method: "Bank Transfer",
        methodType: "bank",
        amount: 4999,
        status: "failed",
        date: "2026-08-10",
        reference: "BANK-FAILED-981",
        gateway: "Manual"
    },

    {
        id: "TXN-20260810005",
        vendor: "HealthFirst Diagnostics",
        invoice: "INV-2026-00124",
        method: "Stripe",
        methodType: "stripe",
        amount: 19999,
        status: "success",
        date: "2026-08-10",
        reference: "pi_3N92KD82",
        gateway: "Stripe"
    },

    {
        id: "TXN-20260809006",
        vendor: "Aarogya Diagnostics",
        invoice: "INV-2026-00123",
        method: "UPI",
        methodType: "upi",
        amount: 9999,
        status: "refunded",
        date: "2026-08-09",
        reference: "REF-827281",
        gateway: "Razorpay"
    },

    {
        id: "TXN-20260808007",
        vendor: "MediCare Path Lab",
        invoice: "INV-2026-00122",
        method: "Card",
        methodType: "card",
        amount: 12999,
        status: "success",
        date: "2026-08-08",
        reference: "CARD-829182",
        gateway: "Stripe"
    },

    {
        id: "TXN-20260808008",
        vendor: "LifeCare Pathology",
        invoice: "INV-2026-00121",
        method: "Razorpay",
        methodType: "razorpay",
        amount: 5999,
        status: "success",
        date: "2026-08-08",
        reference: "pay_92818KS",
        gateway: "Razorpay"
    },

    {
        id: "TXN-20260807009",
        vendor: "Nova Diagnostics",
        invoice: "INV-2026-00120",
        method: "UPI",
        methodType: "upi",
        amount: 8999,
        status: "pending",
        date: "2026-08-07",
        reference: "UPI_PENDING_992",
        gateway: "Razorpay"
    },

    {
        id: "TXN-20260806010",
        vendor: "HealthFirst Diagnostics",
        invoice: "INV-2026-00119",
        method: "Card",
        methodType: "card",
        amount: 17999,
        status: "success",
        date: "2026-08-06",
        reference: "CARD-729182",
        gateway: "Stripe"
    }

];


/* =========================================================
   DOM
   ========================================================= */

const tableBody =
    document.getElementById("transactionTableBody");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("transactionSearch");

const statusFilter =
    document.getElementById("statusFilter");

const methodFilter =
    document.getElementById("methodFilter");

const vendorFilter =
    document.getElementById("vendorFilter");

const fromDate =
    document.getElementById("fromDate");

const toDate =
    document.getElementById("toDate");

const rowsSelector =
    document.getElementById("rowsPerPage");

const transactionCount =
    document.getElementById("transactionCount");

const pagination =
    document.getElementById("pagination");

const paginationInfo =
    document.getElementById("paginationInfo");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadTransactions();

    setupEventListeners();

});


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

function loadTransactions() {

    /*
     * Future Django API:
     *
     * fetch("/superadmin/api/transactions/")
     *
     * फिलहाल demo data.
     */

    transactions = [...demoTransactions];

    populateVendorFilter();

    applyFilters();

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    searchInput?.addEventListener(
        "input",
        debounce(applyFilters, 250)
    );

    statusFilter?.addEventListener(
        "change",
        applyFilters
    );

    methodFilter?.addEventListener(
        "change",
        applyFilters
    );

    vendorFilter?.addEventListener(
        "change",
        applyFilters
    );

    fromDate?.addEventListener(
        "change",
        applyFilters
    );

    toDate?.addEventListener(
        "change",
        applyFilters
    );


    rowsSelector?.addEventListener(
        "change",
        () => {

            rowsPerPage =
                Number(rowsSelector.value);

            currentPage = 1;

            renderTransactions();

        }
    );


    document
        .getElementById("clearFilters")
        ?.addEventListener(
            "click",
            clearFilters
        );


    document
        .getElementById("emptyClearFilters")
        ?.addEventListener(
            "click",
            clearFilters
        );


    document
        .getElementById("refreshTransactions")
        ?.addEventListener(
            "click",
            refreshTransactions
        );


    document
        .getElementById("exportTransactions")
        ?.addEventListener(
            "click",
            exportTransactions
        );


    document
        .getElementById("closeTransactionModal")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("closeModalBtn")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("closeToast")
        ?.addEventListener(
            "click",
            hideToast
        );


    document
        .getElementById("downloadReceipt")
        ?.addEventListener(
            "click",
            downloadReceipt
        );


    document
        .getElementById("transactionModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "transactionModal"
                ) {
                    closeModal();
                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeModal();
            }

        }
    );

}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    const method =
        methodFilter.value;

    const vendor =
        vendorFilter.value;

    const start =
        fromDate.value;

    const end =
        toDate.value;


    filteredTransactions =
        transactions.filter(transaction => {

            const searchable =
                `${transaction.id}
                 ${transaction.vendor}
                 ${transaction.invoice}
                 ${transaction.reference}`
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(search);


            const matchesStatus =
                status === "all" ||
                transaction.status === status;


            const matchesMethod =
                method === "all" ||
                transaction.methodType === method;


            const matchesVendor =
                vendor === "all" ||
                transaction.vendor === vendor;


            const matchesStart =
                !start ||
                transaction.date >= start;


            const matchesEnd =
                !end ||
                transaction.date <= end;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesMethod &&
                matchesVendor &&
                matchesStart &&
                matchesEnd
            );

        });


    currentPage = 1;

    renderTransactions();

    updateStatistics();

}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderTransactions() {

    tableBody.innerHTML = "";

    const total =
        filteredTransactions.length;

    if (!total) {

        emptyState.classList.add("active");

        pagination.innerHTML = "";

        transactionCount.textContent =
            "0 transactions";

        paginationInfo.textContent =
            "Showing 0–0 of 0";

        return;

    }


    emptyState.classList.remove("active");


    const startIndex =
        (currentPage - 1) *
        rowsPerPage;

    const endIndex =
        Math.min(
            startIndex + rowsPerPage,
            total
        );


    const pageItems =
        filteredTransactions.slice(
            startIndex,
            endIndex
        );


    pageItems.forEach(transaction => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                <span class="transaction-id">
                    ${escapeHTML(transaction.id)}
                </span>
            </td>

            <td>
                <div class="vendor-cell">

                    <div class="vendor-avatar">
                        ${getInitials(transaction.vendor)}
                    </div>

                    <span class="vendor-name">
                        ${escapeHTML(transaction.vendor)}
                    </span>

                </div>
            </td>

            <td>
                <span class="invoice-id">
                    ${escapeHTML(transaction.invoice)}
                </span>
            </td>

            <td>
                <span class="payment-method">
                    <i class="${getPaymentIcon(transaction.methodType)}"></i>
                    ${escapeHTML(transaction.method)}
                </span>
            </td>

            <td>
                <span class="amount">
                    ${formatCurrency(transaction.amount)}
                </span>
            </td>

            <td>
                ${getStatusHTML(transaction.status)}
            </td>

            <td>
                ${formatDate(transaction.date)}
            </td>

            <td class="action-column">

                <button
                    class="action-btn"
                    title="View transaction"
                    onclick="openTransaction('${transaction.id}')"
                >
                    <i class="fa-solid fa-eye"></i>
                </button>

            </td>
        `;


        tableBody.appendChild(row);

    });


    transactionCount.textContent =
        `${total} transaction${total !== 1 ? "s" : ""}`;


    paginationInfo.textContent =
        `Showing ${startIndex + 1}–${endIndex} of ${total}`;


    renderPagination(total);

}


/* =========================================================
   PAGINATION
   ========================================================= */

function renderPagination(total) {

    pagination.innerHTML = "";

    const totalPages =
        Math.ceil(total / rowsPerPage);


    if (totalPages <= 1) {
        return;
    }


    const previous =
        document.createElement("button");

    previous.className =
        "page-btn";

    previous.innerHTML =
        '<i class="fa-solid fa-chevron-left"></i>';

    previous.disabled =
        currentPage === 1;

    previous.addEventListener(
        "click",
        () => {

            if (currentPage > 1) {

                currentPage--;

                renderTransactions();

            }

        }
    );

    pagination.appendChild(previous);


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement("button");

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

                renderTransactions();

            }
        );

        pagination.appendChild(button);

    }


    const next =
        document.createElement("button");

    next.className =
        "page-btn";

    next.innerHTML =
        '<i class="fa-solid fa-chevron-right"></i>';

    next.disabled =
        currentPage === totalPages;

    next.addEventListener(
        "click",
        () => {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderTransactions();

            }

        }
    );

    pagination.appendChild(next);

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const successful =
        transactions.filter(
            t => t.status === "success"
        );

    const pending =
        transactions.filter(
            t => t.status === "pending"
        );

    const failed =
        transactions.filter(
            t =>
                t.status === "failed" ||
                t.status === "refunded"
        );


    const revenue =
        successful.reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );


    document.getElementById(
        "totalRevenue"
    ).textContent =
        formatCurrency(revenue);


    document.getElementById(
        "successfulTransactions"
    ).textContent =
        successful.length;


    document.getElementById(
        "pendingTransactions"
    ).textContent =
        pending.length;


    document.getElementById(
        "failedTransactions"
    ).textContent =
        failed.length;

}


/* =========================================================
   VENDOR FILTER
   ========================================================= */

function populateVendorFilter() {

    const vendors =
        [
            ...new Set(
                transactions.map(
                    transaction =>
                        transaction.vendor
                )
            )
        ].sort();


    vendorFilter.innerHTML =
        '<option value="all">All Vendors</option>';


    vendors.forEach(vendor => {

        const option =
            document.createElement("option");

        option.value = vendor;

        option.textContent = vendor;

        vendorFilter.appendChild(option);

    });

}


/* =========================================================
   TRANSACTION MODAL
   ========================================================= */

function openTransaction(id) {

    selectedTransaction =
        transactions.find(
            transaction =>
                transaction.id === id
        );


    if (!selectedTransaction) {
        return;
    }


    document.getElementById(
        "modalTransactionId"
    ).textContent =
        selectedTransaction.id;


    document.getElementById(
        "modalAmount"
    ).textContent =
        formatCurrency(
            selectedTransaction.amount
        );


    document.getElementById(
        "modalVendor"
    ).textContent =
        selectedTransaction.vendor;


    document.getElementById(
        "modalMethod"
    ).textContent =
        selectedTransaction.method;


    document.getElementById(
        "detailTransactionId"
    ).textContent =
        selectedTransaction.id;


    document.getElementById(
        "detailInvoiceId"
    ).textContent =
        selectedTransaction.invoice;


    document.getElementById(
        "detailVendor"
    ).textContent =
        selectedTransaction.vendor;


    document.getElementById(
        "detailGateway"
    ).textContent =
        selectedTransaction.gateway;


    document.getElementById(
        "detailDate"
    ).textContent =
        formatDate(
            selectedTransaction.date
        );


    document.getElementById(
        "detailReference"
    ).textContent =
        selectedTransaction.reference;


    const statusElement =
        document.getElementById(
            "modalStatus"
        );


    statusElement.className =
        `modal-status ${selectedTransaction.status}`;


    statusElement.textContent =
        capitalize(
            selectedTransaction.status
        );


    document
        .getElementById("transactionModal")
        .classList.add("active");


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    document
        .getElementById("transactionModal")
        ?.classList.remove("active");

    document.body.style.overflow = "";

}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearFilters() {

    searchInput.value = "";

    statusFilter.value = "all";

    methodFilter.value = "all";

    vendorFilter.value = "all";

    fromDate.value = "";

    toDate.value = "";

    applyFilters();

}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshTransactions() {

    const button =
        document.getElementById(
            "refreshTransactions"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';

    }


    setTimeout(() => {

        transactions =
            [...demoTransactions];

        applyFilters();

        if (button) {

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-rotate"></i> Refresh';

        }

        showToast(
            "Updated",
            "Transactions refreshed successfully."
        );

    }, 600);

}


/* =========================================================
   EXPORT CSV
   ========================================================= */

function exportTransactions() {

    if (!filteredTransactions.length) {

        showToast(
            "No Data",
            "There are no transactions to export."
        );

        return;

    }


    const headers = [
        "Transaction ID",
        "Vendor",
        "Invoice",
        "Payment Method",
        "Amount",
        "Status",
        "Date",
        "Reference",
        "Gateway"
    ];


    const rows =
        filteredTransactions.map(
            transaction => [

                transaction.id,

                transaction.vendor,

                transaction.invoice,

                transaction.method,

                transaction.amount,

                transaction.status,

                transaction.date,

                transaction.reference,

                transaction.gateway

            ]
        );


    const csv = [
        headers,
        ...rows
    ]
        .map(
            row =>
                row.map(csvEscape).join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `transactions-${getDateStamp()}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast(
        "Export Complete",
        `${filteredTransactions.length} transactions exported.`
    );

}


/* =========================================================
   RECEIPT
   ========================================================= */

function downloadReceipt() {

    if (!selectedTransaction) {
        return;
    }


    const transaction =
        selectedTransaction;


    const receipt = `SITA PATH LAB
TRANSACTION RECEIPT
--------------------------------
Transaction ID: ${transaction.id}
Vendor: ${transaction.vendor}
Invoice: ${transaction.invoice}
Amount: ${formatCurrency(transaction.amount)}
Payment Method: ${transaction.method}
Status: ${transaction.status}
Date: ${transaction.date}
Reference: ${transaction.reference}
Gateway: ${transaction.gateway}
--------------------------------
Generated from Super Admin Panel
`;


    const blob =
        new Blob(
            [receipt],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `${transaction.id}-receipt.txt`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

}


/* =========================================================
   STATUS HTML
   ========================================================= */

function getStatusHTML(status) {

    const labels = {

        success: "Successful",

        pending: "Pending",

        failed: "Failed",

        refunded: "Refunded"

    };


    return `
        <span class="status ${status}">
            ${labels[status] || capitalize(status)}
        </span>
    `;

}


/* =========================================================
   PAYMENT ICON
   ========================================================= */

function getPaymentIcon(method) {

    const icons = {

        razorpay:
            "fa-solid fa-building-columns",

        stripe:
            "fa-brands fa-stripe",

        upi:
            "fa-solid fa-mobile-screen-button",

        card:
            "fa-regular fa-credit-card",

        bank:
            "fa-solid fa-building-columns"

    };


    return (
        icons[method] ||
        "fa-solid fa-wallet"
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


function formatDate(date) {

    if (!date) {
        return "-";
    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(`${date}T00:00:00`)
    );

}


function getInitials(name) {

    return name
        .split(" ")
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

}


function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);

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

    const date = new Date();

    return date
        .toISOString()
        .split("T")[0];

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function debounce(callback, delay = 250) {

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


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(
    title,
    message
) {

    const toast =
        document.getElementById(
            "transactionToast"
        );


    document.getElementById(
        "toastTitle"
    ).textContent = title;


    document.getElementById(
        "toastMessage"
    ).textContent = message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            hideToast,
            3500
        );

}


function hideToast() {

    document
        .getElementById(
            "transactionToast"
        )
        ?.classList.remove("show");

}


/* =========================================================
   GLOBAL
   ========================================================= */

window.openTransaction =
    openTransaction;