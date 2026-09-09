/**
 * =========================================================
 * SITA PATH LAB
 * INVOICE / BILLING
 * Production JavaScript
 * =========================================================
 */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const InvoiceConfig = {

    api: {

        invoice:
            "/api/payments/invoice/",

        subscription:
            "/api/subscription/"

    },

    storage: {

        theme:
            "theme"

    }

};


/* =========================================================
   STATE
========================================================= */

const InvoiceState = {

    invoice: {

        number:
            "INV-2026-082",

        date:
            "Aug 12, 2026",

        customer: {

            name:
                "Admin User",

            company:
                "Sita Path Lab",

            email:
                "admin@sitapathlab.com",

            address:
                "India"

        },

        plan:
            "Professional",

        billing:
            "Monthly",

        paymentMethod:
            "•••• 4242",

        transactionId:
            "TXN-82649172",

        subtotal:
            2499,

        tax:
            0,

        discount:
            0,

        total:
            2499,

        renewalDate:
            "Sep 12, 2026"

    }

};


/* =========================================================
   DOM
========================================================= */

const DOM = {};


function cacheDOM() {

    DOM.backBtn =
        document.getElementById(
            "backBtn"
        );


    DOM.printBtn =
        document.getElementById(
            "printBtn"
        );


    DOM.downloadBtn =
        document.getElementById(
            "downloadBtn"
        );


    DOM.invoiceNumber =
        document.getElementById(
            "invoiceNumber"
        );


    DOM.invoiceDate =
        document.getElementById(
            "invoiceDate"
        );


    DOM.customerName =
        document.getElementById(
            "customerName"
        );


    DOM.customerCompany =
        document.getElementById(
            "customerCompany"
        );


    DOM.customerEmail =
        document.getElementById(
            "customerEmail"
        );


    DOM.customerAddress =
        document.getElementById(
            "customerAddress"
        );


    DOM.paymentMethod =
        document.getElementById(
            "paymentMethod"
        );


    DOM.transactionId =
        document.getElementById(
            "transactionId"
        );


    DOM.subtotal =
        document.getElementById(
            "subtotal"
        );


    DOM.tax =
        document.getElementById(
            "tax"
        );


    DOM.discount =
        document.getElementById(
            "discount"
        );


    DOM.totalPaid =
        document.getElementById(
            "totalPaid"
        );


    DOM.renewalText =
        document.getElementById(
            "renewalText"
        );


    DOM.invoiceItems =
        document.getElementById(
            "invoiceItems"
        );


    DOM.toastContainer =
        document.getElementById(
            "toastContainer"
        );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cacheDOM();

        initializeTheme();

        loadInvoiceFromURL();

        renderInvoice();

        bindEvents();

    }
);


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    DOM.backBtn?.addEventListener(
        "click",
        goBack
    );


    DOM.printBtn?.addEventListener(
        "click",
        printInvoice
    );


    DOM.downloadBtn?.addEventListener(
        "click",
        downloadInvoice
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "p"
            ) {

                event.preventDefault();

                printInvoice();

            }

        }
    );

}


/* =========================================================
   LOAD INVOICE FROM URL
========================================================= */

function loadInvoiceFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const invoiceNumber =
        params.get("invoice");


    if (!invoiceNumber) {
        return;
    }


    InvoiceState.invoice.number =
        invoiceNumber;

}


/* =========================================================
   RENDER
========================================================= */

function renderInvoice() {

    const invoice =
        InvoiceState.invoice;


    setText(
        DOM.invoiceNumber,
        invoice.number
    );


    setText(
        DOM.invoiceDate,
        invoice.date
    );


    setText(
        DOM.customerName,
        invoice.customer.name
    );


    setText(
        DOM.customerCompany,
        invoice.customer.company
    );


    setText(
        DOM.customerEmail,
        invoice.customer.email
    );


    setText(
        DOM.customerAddress,
        invoice.customer.address
    );


    setText(
        DOM.paymentMethod,
        invoice.paymentMethod
    );


    setText(
        DOM.transactionId,
        invoice.transactionId
    );


    setText(
        DOM.subtotal,
        formatCurrency(
            invoice.subtotal
        )
    );


    setText(
        DOM.tax,
        formatCurrency(
            invoice.tax
        )
    );


    setText(
        DOM.discount,
        invoice.discount > 0
            ? `-${formatCurrency(invoice.discount)}`
            : "₹0"
    );


    setText(
        DOM.totalPaid,
        formatCurrency(
            invoice.total
        )
    );


    setText(
        DOM.renewalText,
        `Your ${invoice.plan} plan renews on ${invoice.renewalDate}.`
    );


    renderInvoiceItem();

}


/* =========================================================
   RENDER ITEM
========================================================= */

function renderInvoiceItem() {

    if (!DOM.invoiceItems) {
        return;
    }


    const invoice =
        InvoiceState.invoice;


    DOM.invoiceItems.innerHTML = `

        <tr>

            <td>

                <div class="item-title">
                    ${escapeHTML(invoice.plan)} Plan
                </div>

                <div class="item-description">
                    Advanced tools for growing pathology labs
                </div>

            </td>

            <td>
                ${escapeHTML(invoice.billing)}
            </td>

            <td class="align-right">
                1
            </td>

            <td class="align-right">
                ${formatCurrency(invoice.subtotal)}
            </td>

            <td class="align-right item-total">
                ${formatCurrency(invoice.subtotal)}
            </td>

        </tr>

    `;

}


/* =========================================================
   PRINT
========================================================= */

function printInvoice() {

    showToast(
        "Preparing invoice for printing...",
        "info"
    );


    setTimeout(
        () => {

            window.print();

        },
        250
    );

}


/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadInvoice() {

    const button =
        DOM.downloadBtn;


    if (!button) {
        return;
    }


    const originalHTML =
        button.innerHTML;


    button.disabled =
        true;


    button.innerHTML =
        "Preparing...";


    try {

        /*
         * =================================================
         * PRODUCTION DJANGO API
         * =================================================
         *
         * Backend should return:
         *
         * application/pdf
         *
         * Example:
         *
         * GET
         * /api/payments/invoice/INV-2026-082/
         *
         * =================================================
         */


        const invoiceNumber =
            InvoiceState.invoice.number;


        const url =
            `${InvoiceConfig.api.invoice}${encodeURIComponent(
                invoiceNumber
            )}/`;


        /*
         * Uncomment this block when
         * Django PDF endpoint is ready.
         *
         * const response = await fetch(
         *     url,
         *     {
         *         method: "GET",
         *         credentials: "same-origin"
         *     }
         * );
         *
         * if (!response.ok) {
         *     throw new Error(
         *         `Download failed: ${response.status}`
         *     );
         * }
         *
         * const blob =
         *     await response.blob();
         *
         * const blobURL =
         *     URL.createObjectURL(blob);
         *
         * const anchor =
         *     document.createElement("a");
         *
         * anchor.href = blobURL;
         *
         * anchor.download =
         *     `${invoiceNumber}.pdf`;
         *
         * document.body.appendChild(anchor);
         *
         * anchor.click();
         *
         * anchor.remove();
         *
         * URL.revokeObjectURL(blobURL);
         *
         */


        /*
         * Temporary production-safe fallback:
         * Opens browser print dialog where user can
         * select "Save as PDF".
         */

        showToast(
            "Use 'Save as PDF' in the print dialog to download the invoice.",
            "info"
        );


        setTimeout(
            () => {

                window.print();

            },
            500
        );


    } catch (error) {

        console.error(
            "Invoice download failed:",
            error
        );


        showToast(
            "Unable to download invoice.",
            "error"
        );

    } finally {

        setTimeout(
            () => {

                button.disabled =
                    false;

                button.innerHTML =
                    originalHTML;

            },
            700
        );

    }

}


/* =========================================================
   BACK
========================================================= */

function goBack() {

    if (
        window.history.length > 1
    ) {

        window.history.back();

        return;

    }


    window.location.href =
        "/subscription/";

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const theme =
        localStorage.getItem(
            InvoiceConfig.storage.theme
        );


    if (
        theme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return `₹${number.toLocaleString(
        "en-IN"
    )}`;

}


/* =========================================================
   SAFE TEXT
========================================================= */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
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


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info"
) {

    if (
        !DOM.toastContainer
    ) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    DOM.toastContainer.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(8px)";

            toast.style.transition =
                "200ms ease";


            setTimeout(
                () => {

                    toast.remove();

                },
                220
            );

        },
        3000
    );

}