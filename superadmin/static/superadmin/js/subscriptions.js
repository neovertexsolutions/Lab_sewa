/**
 * =========================================================
 * SITA PATH LAB
 * SUPER ADMIN
 * SUBSCRIPTION / BILLING
 *
 * Production JavaScript
 * Django Compatible
 * =========================================================
 */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const SubscriptionConfig = {

    api: {
        subscription: "/api/subscription/",
        changePlan: "/api/subscription/change-plan/",
        cancel: "/api/subscription/cancel/",
        payments: "/api/payments/",
        invoice: "/api/payments/invoice/"
    },

    storage: {
        billingCycle: "sitapathlab_billing_cycle",
        subscription: "sitapathlab_subscription"
    }

};


/* =========================================================
   STATE
========================================================= */

const SubscriptionState = {

    billingCycle: "monthly",

    currentPlan: "professional",

    selectedPlan: null,

    subscription: {

        plan: "professional",

        billingCycle: "monthly",

        amount: 2499,

        nextBillingDate: "Sep 12, 2026",

        status: "active"

    }

};


/* =========================================================
   PLAN DATA
========================================================= */

const PLAN_DATA = {

    basic: {
        name: "Basic",
        description:
            "Essential features for small laboratories."
    },

    professional: {
        name: "Professional",
        description:
            "Advanced tools for growing pathology labs."
    },

    enterprise: {
        name: "Enterprise",
        description:
            "Complete infrastructure for large organizations."
    }

};


/* =========================================================
   DOM CACHE
========================================================= */

const DOM = {};


function cacheDOM() {

    DOM.billingToggle =
        document.getElementById("billingToggle");

    DOM.monthlyLabel =
        document.getElementById("monthlyLabel");

    DOM.yearlyLabel =
        document.getElementById("yearlyLabel");


    /* Plan modal */

    DOM.planModal =
        document.getElementById("planModal");

    DOM.closePlanModal =
        document.getElementById("closePlanModal");

    DOM.cancelPlanModal =
        document.getElementById("cancelPlanModal");

    DOM.confirmPlanBtn =
        document.getElementById("confirmPlanBtn");


    DOM.planModalTitle =
        document.getElementById("planModalTitle");

    DOM.planModalDescription =
        document.getElementById("planModalDescription");

    DOM.modalPlanName =
        document.getElementById("modalPlanName");

    DOM.modalBilling =
        document.getElementById("modalBilling");

    DOM.modalPrice =
        document.getElementById("modalPrice");


    /* Cancel modal */

    DOM.cancelModal =
        document.getElementById("cancelModal");

    DOM.closeCancelModal =
        document.getElementById("closeCancelModal");

    DOM.cancelSubscriptionBtn =
        document.getElementById("cancelSubscriptionBtn");

    DOM.keepSubscriptionBtn =
        document.getElementById("keepSubscriptionBtn");

    DOM.confirmCancelBtn =
        document.getElementById("confirmCancelBtn");


    /* Current subscription */

    DOM.currentPlanName =
        document.getElementById("currentPlanName");

    DOM.currentPlanDescription =
        document.getElementById("currentPlanDescription");

    DOM.currentBilling =
        document.getElementById("currentBilling");

    DOM.currentAmount =
        document.getElementById("currentAmount");

    DOM.nextBillingDate =
        document.getElementById("nextBillingDate");

    DOM.cancelEndDate =
        document.getElementById("cancelEndDate");


    /* Other */

    DOM.manageBillingBtn =
        document.getElementById("manageBillingBtn");

    DOM.viewAllPaymentsBtn =
        document.getElementById("viewAllPaymentsBtn");

    DOM.notificationBtn =
        document.getElementById("notificationBtn");

    DOM.toastContainer =
        document.getElementById("toastContainer");

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeSubscription
);


function initializeSubscription() {

    cacheDOM();

    loadState();

    initializeBillingCycle();

    bindEvents();

    renderSubscription();

    initializeModals();

    initializeTheme();

    validateDOM();

}


/* =========================================================
   DOM VALIDATION
========================================================= */

function validateDOM() {

    const requiredElements = {

        billingToggle: DOM.billingToggle,

        cancelSubscriptionBtn:
            DOM.cancelSubscriptionBtn,

        cancelModal:
            DOM.cancelModal,

        closeCancelModal:
            DOM.closeCancelModal,

        keepSubscriptionBtn:
            DOM.keepSubscriptionBtn,

        confirmCancelBtn:
            DOM.confirmCancelBtn

    };


    Object.entries(requiredElements)
        .forEach(([name, element]) => {

            if (!element) {

                console.warn(
                    `[Subscription] Missing element: #${name}`
                );

            }

        });

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    /* -----------------------------------------
       Billing toggle
    ----------------------------------------- */

    DOM.billingToggle?.addEventListener(
        "change",
        handleBillingToggle
    );


    /* -----------------------------------------
       Plan buttons
    ----------------------------------------- */

    document
        .querySelectorAll(".plan-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                handlePlanButton
            );

        });


    /* -----------------------------------------
       Plan modal
    ----------------------------------------- */

    DOM.closePlanModal?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closePlanModal();

        }
    );


    DOM.cancelPlanModal?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closePlanModal();

        }
    );


    DOM.confirmPlanBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            confirmPlanChange();

        }
    );


    /* -----------------------------------------
       Cancel subscription
    ----------------------------------------- */

    DOM.cancelSubscriptionBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openCancelModal();

        }
    );


    DOM.closeCancelModal?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeCancelModal();

        }
    );


    DOM.keepSubscriptionBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeCancelModal();

            showToast(
                "Your subscription has been kept active.",
                "success"
            );

        }
    );


    DOM.confirmCancelBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            confirmCancellation();

        }
    );


    /* -----------------------------------------
       Billing management
    ----------------------------------------- */

    DOM.manageBillingBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            handleManageBilling();

        }
    );


    /* -----------------------------------------
       Payments
    ----------------------------------------- */

    DOM.viewAllPaymentsBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            handleViewAllPayments();

        }
    );


    /* -----------------------------------------
       Notifications
    ----------------------------------------- */

    DOM.notificationBtn?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            handleNotifications();

        }
    );


    /* -----------------------------------------
       Invoice buttons
    ----------------------------------------- */

    document
        .querySelectorAll(".invoice-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                handleInvoiceDownload
            );

        });


    /* -----------------------------------------
       Modal backdrop
    ----------------------------------------- */

    DOM.planModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === DOM.planModal
            ) {

                closePlanModal();

            }

        }
    );


    DOM.cancelModal?.addEventListener(
        "click",
        event => {

            if (
                event.target === DOM.cancelModal
            ) {

                closeCancelModal();

            }

        }
    );


    /* -----------------------------------------
       Keyboard
    ----------------------------------------- */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );

}


/* =========================================================
   MODAL INITIALIZATION
========================================================= */

function initializeModals() {

    if (DOM.planModal) {

        DOM.planModal.hidden = true;

        DOM.planModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (DOM.cancelModal) {

        DOM.cancelModal.hidden = true;

        DOM.cancelModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   BILLING CYCLE
========================================================= */

function initializeBillingCycle() {

    const savedCycle =
        localStorage.getItem(
            SubscriptionConfig.storage.billingCycle
        );


    if (
        savedCycle === "monthly" ||
        savedCycle === "yearly"
    ) {

        SubscriptionState.billingCycle =
            savedCycle;

    }


    if (DOM.billingToggle) {

        DOM.billingToggle.checked =
            SubscriptionState.billingCycle ===
            "yearly";

    }


    SubscriptionState.subscription.billingCycle =
        SubscriptionState.billingCycle;

}


/* =========================================================
   BILLING TOGGLE
========================================================= */

function handleBillingToggle(event) {

    const cycle =
        event.target.checked
            ? "yearly"
            : "monthly";


    SubscriptionState.billingCycle =
        cycle;


    SubscriptionState.subscription.billingCycle =
        cycle;


    updateCurrentSubscriptionAmount();

    updatePlanPrices();

    saveState();


    showToast(
        `Billing cycle changed to ${capitalize(cycle)}.`,
        "success"
    );

}


/* =========================================================
   PLAN PRICES
========================================================= */

function updatePlanPrices() {

    const yearly =
        SubscriptionState.billingCycle ===
        "yearly";


    /* Price values */

    document
        .querySelectorAll(".price-value")
        .forEach(priceElement => {

            const monthly =
                Number(
                    priceElement.dataset.monthly || 0
                );


            const yearlyPrice =
                Number(
                    priceElement.dataset.yearly || 0
                );


            const amount =
                yearly
                    ? yearlyPrice
                    : monthly;


            priceElement.textContent =
                formatCurrency(amount);

        });


    /* Billing notes */

    document
        .querySelectorAll(".plan-card")
        .forEach(card => {

            const yearlyTotal =
                Number(
                    card.dataset.yearly || 0
                );


            const note =
                card.querySelector(
                    ".yearly-note"
                );


            if (!note) return;


            note.textContent =
                yearly
                    ? `Billed ₹${formatCurrency(yearlyTotal)} yearly`
                    : "Billed monthly";

        });


    updateCurrentSubscriptionAmount();

}


/* =========================================================
   CURRENT SUBSCRIPTION AMOUNT
========================================================= */

function updateCurrentSubscriptionAmount() {

    const card =
        document.querySelector(
            `.plan-card[data-plan="${SubscriptionState.currentPlan}"]`
        );


    if (!card) return;


    const amount =
        SubscriptionState.billingCycle === "yearly"
            ? Number(card.dataset.yearly || 0)
            : Number(card.dataset.monthly || 0);


    SubscriptionState.subscription.amount =
        amount;


    SubscriptionState.subscription.billingCycle =
        SubscriptionState.billingCycle;


    if (DOM.currentAmount) {

        DOM.currentAmount.textContent =
            SubscriptionState.billingCycle === "yearly"
                ? `₹${formatCurrency(amount)} / year`
                : `₹${formatCurrency(amount)} / month`;

    }

}


/* =========================================================
   PLAN SELECTION
========================================================= */

function handlePlanButton(event) {

    event.preventDefault();


    const button =
        event.currentTarget;


    const card =
        button.closest(".plan-card");


    if (!card) return;


    const plan =
        card.dataset.plan;


    if (!plan) return;


    if (
        plan ===
        SubscriptionState.currentPlan
    ) {

        showToast(
            "This is already your current plan.",
            "info"
        );

        return;

    }


    SubscriptionState.selectedPlan =
        plan;


    openPlanModal(plan);

}


/* =========================================================
   OPEN PLAN MODAL
========================================================= */

function openPlanModal(plan) {

    const card =
        document.querySelector(
            `.plan-card[data-plan="${plan}"]`
        );


    if (!card || !DOM.planModal) {

        console.error(
            "[Subscription] Plan modal/card not found."
        );

        return;

    }


    const yearly =
        SubscriptionState.billingCycle ===
        "yearly";


    const monthlyPrice =
        Number(
            card.dataset.monthly || 0
        );


    const yearlyPrice =
        Number(
            card.dataset.yearly || 0
        );


    const amount =
        yearly
            ? yearlyPrice
            : monthlyPrice;


    const planData =
        PLAN_DATA[plan];


    if (DOM.planModalTitle) {

        if (plan === "enterprise") {

            DOM.planModalTitle.textContent =
                "Upgrade to Enterprise?";

        } else if (plan === "basic") {

            DOM.planModalTitle.textContent =
                "Switch to Basic?";

        } else {

            DOM.planModalTitle.textContent =
                "Change your subscription?";

        }

    }


    if (DOM.planModalDescription) {

        DOM.planModalDescription.textContent =
            yearly
                ? "Your subscription will be billed annually after confirmation."
                : "Your subscription will be billed monthly after confirmation.";

    }


    if (DOM.modalPlanName) {

        DOM.modalPlanName.textContent =
            planData?.name ||
            capitalize(plan);

    }


    if (DOM.modalBilling) {

        DOM.modalBilling.textContent =
            yearly
                ? "Yearly"
                : "Monthly";

    }


    if (DOM.modalPrice) {

        DOM.modalPrice.textContent =
            yearly
                ? `₹${formatCurrency(amount)} / year`
                : `₹${formatCurrency(amount)} / month`;

    }


    DOM.planModal.hidden =
        false;


    DOM.planModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    DOM.confirmPlanBtn?.focus();

}


/* =========================================================
   CLOSE PLAN MODAL
========================================================= */

function closePlanModal() {

    if (!DOM.planModal) return;


    DOM.planModal.hidden =
        true;


    DOM.planModal.setAttribute(
        "aria-hidden",
        "true"
    );


    SubscriptionState.selectedPlan =
        null;


    checkModalBodyState();

}


/* =========================================================
   CONFIRM PLAN CHANGE
========================================================= */

async function confirmPlanChange() {

    const plan =
        SubscriptionState.selectedPlan;


    if (!plan) {

        showToast(
            "Please select a subscription plan.",
            "error"
        );

        return;

    }


    const button =
        DOM.confirmPlanBtn;


    if (!button) {

        console.error(
            "[Subscription] confirmPlanBtn not found."
        );

        return;

    }


    if (button.disabled) return;


    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        "Processing...";


    try {

        const response =
            await apiRequest(
                SubscriptionConfig.api.changePlan,
                {
                    method: "POST",

                    body: {
                        plan: plan,

                        billing_cycle:
                            SubscriptionState.billingCycle
                    }
                }
            );


        if (response?.subscription) {

            SubscriptionState.subscription =
                {
                    ...SubscriptionState.subscription,

                    ...response.subscription
                };

        }


        SubscriptionState.currentPlan =
            plan;


        SubscriptionState.subscription.plan =
            plan;


        updateCurrentSubscriptionAmount();

        saveState();

        renderSubscription();

        closePlanModal();


        showToast(
            `Subscription changed to ${capitalize(plan)}.`,
            "success"
        );

    } catch (error) {

        console.error(
            "[Subscription] Plan change failed:",
            error
        );


        showToast(
            getErrorMessage(
                error,
                "Unable to change subscription."
            ),
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            originalText;

    }

}


/* =========================================================
   RENDER SUBSCRIPTION
========================================================= */

function renderSubscription() {

    const plan =
        SubscriptionState.currentPlan;


    const current =
        PLAN_DATA[plan];


    if (!current) return;


    if (DOM.currentPlanName) {

        DOM.currentPlanName.textContent =
            current.name;

    }


    if (DOM.currentPlanDescription) {

        DOM.currentPlanDescription.textContent =
            current.description;

    }


    if (DOM.currentBilling) {

        DOM.currentBilling.textContent =
            capitalize(
                SubscriptionState.billingCycle
            );

    }


    if (DOM.nextBillingDate) {

        DOM.nextBillingDate.textContent =
            SubscriptionState
                .subscription
                .nextBillingDate;

    }


    if (DOM.cancelEndDate) {

        DOM.cancelEndDate.textContent =
            SubscriptionState
                .subscription
                .nextBillingDate;

    }


    updateCurrentSubscriptionAmount();

    updatePlanButtons();

    updatePlanPrices();

    updateSubscriptionStatus();

}


/* =========================================================
   PLAN BUTTON STATES
========================================================= */

function updatePlanButtons() {

    document
        .querySelectorAll(".plan-card")
        .forEach(card => {

            const plan =
                card.dataset.plan;


            const button =
                card.querySelector(
                    ".plan-btn"
                );


            if (!button) return;


            if (
                plan ===
                SubscriptionState.currentPlan
            ) {

                button.textContent =
                    "Current Plan";

                button.dataset.action =
                    "current";

                button.classList.add(
                    "primary"
                );

                button.disabled =
                    false;

            } else {

                if (plan === "basic") {

                    button.textContent =
                        "Choose Basic";

                } else if (
                    plan === "professional"
                ) {

                    button.textContent =
                        "Choose Professional";

                } else if (
                    plan === "enterprise"
                ) {

                    button.textContent =
                        "Choose Enterprise";

                } else {

                    button.textContent =
                        "Choose Plan";

                }


                button.dataset.action =
                    "change";

                button.classList.remove(
                    "primary"
                );

                button.disabled =
                    false;

            }

        });

}


/* =========================================================
   SUBSCRIPTION STATUS
========================================================= */

function updateSubscriptionStatus() {

    const button =
        DOM.cancelSubscriptionBtn;


    if (!button) return;


    const status =
        SubscriptionState
            .subscription
            .status;


    if (
        status === "cancelled" ||
        status === "cancellation_scheduled"
    ) {

        button.disabled =
            true;

        button.textContent =
            "Cancellation Scheduled";

        button.classList.add(
            "disabled"
        );

    } else {

        button.disabled =
            false;

        button.textContent =
            "Cancel Plan";

        button.classList.remove(
            "disabled"
        );

    }

}


/* =========================================================
   OPEN CANCEL MODAL
========================================================= */

function openCancelModal() {

    if (
        SubscriptionState
            .subscription
            .status === "cancelled"
    ) {

        showToast(
            "Your subscription is already scheduled for cancellation.",
            "info"
        );

        return;

    }


    if (!DOM.cancelModal) {

        console.error(
            "[Subscription] #cancelModal not found."
        );

        return;

    }


    /* Update date every time modal opens */

    if (DOM.cancelEndDate) {

        DOM.cancelEndDate.textContent =
            SubscriptionState
                .subscription
                .nextBillingDate;

    }


    DOM.cancelModal.hidden =
        false;


    DOM.cancelModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    /*
     * IMPORTANT:
     * Confirm button must be visible.
     */

    if (DOM.confirmCancelBtn) {

        DOM.confirmCancelBtn.hidden =
            false;

        DOM.confirmCancelBtn.disabled =
            false;

    } else {

        console.error(
            "[Subscription] #confirmCancelBtn is missing from HTML."
        );

    }


    DOM.keepSubscriptionBtn?.focus();

}


/* =========================================================
   CLOSE CANCEL MODAL
========================================================= */

function closeCancelModal() {

    if (!DOM.cancelModal) return;


    DOM.cancelModal.hidden =
        true;


    DOM.cancelModal.setAttribute(
        "aria-hidden",
        "true"
    );


    checkModalBodyState();

}


/* =========================================================
   CONFIRM CANCELLATION
========================================================= */

async function confirmCancellation() {

    const button =
        DOM.confirmCancelBtn;


    if (!button) {

        showToast(
            "Cancel confirmation button is missing.",
            "error"
        );

        console.error(
            "[Subscription] #confirmCancelBtn not found."
        );

        return;

    }


    if (button.disabled) return;


    if (
        SubscriptionState
            .subscription
            .status === "cancelled"
    ) {

        closeCancelModal();

        showToast(
            "Cancellation is already scheduled.",
            "info"
        );

        return;

    }


    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        "Cancelling...";


    try {

        const response =
            await apiRequest(
                SubscriptionConfig.api.cancel,
                {
                    method: "POST",

                    body: {
                        plan:
                            SubscriptionState.currentPlan
                    }
                }
            );


        /*
         * Use backend response if available.
         */

        if (response?.subscription) {

            SubscriptionState.subscription =
                {
                    ...SubscriptionState.subscription,

                    ...response.subscription
                };

        } else {

            SubscriptionState.subscription.status =
                "cancellation_scheduled";

        }


        saveState();

        renderSubscription();

        closeCancelModal();


        showToast(
            "Your subscription has been scheduled for cancellation.",
            "success"
        );


    } catch (error) {

        console.error(
            "[Subscription] Cancellation failed:",
            error
        );


        showToast(
            getErrorMessage(
                error,
                "Unable to cancel subscription."
            ),
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            originalText;

    }

}


/* =========================================================
   MANAGE BILLING
========================================================= */

function handleManageBilling() {

    window.location.href =
        "/superadmin/payments/";

}


/* =========================================================
   ALL PAYMENTS
========================================================= */

function handleViewAllPayments() {

    window.location.href =
        "/superadmin/payments/";

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function handleNotifications() {

    if (
        window.SuperAdmin &&
        typeof window.SuperAdmin.showToast ===
        "function"
    ) {

        window.SuperAdmin.showToast(
            "No new billing notifications.",
            "info"
        );

        return;

    }


    showToast(
        "No new billing notifications.",
        "info"
    );

}


/* =========================================================
   INVOICE DOWNLOAD
========================================================= */

async function handleInvoiceDownload(event) {

    event.preventDefault();


    const button =
        event.currentTarget;


    const invoice =
        button.dataset.invoice;


    if (!invoice) {

        showToast(
            "Invoice number is missing.",
            "error"
        );

        return;

    }


    if (button.disabled) return;


    const originalText =
        button.textContent;


    button.disabled =
        true;

    button.textContent =
        "Preparing...";


    try {

        showToast(
            `Preparing ${invoice}...`,
            "info"
        );


        const response =
            await fetch(
                `${SubscriptionConfig.api.invoice}${encodeURIComponent(invoice)}/`,
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "X-Requested-With":
                            "XMLHttpRequest"
                    }
                }
            );


        if (!response.ok) {

            let message =
                `Invoice request failed: ${response.status}`;


            try {

                const data =
                    await response.json();


                message =
                    data?.message ||
                    message;

            } catch {

                /* Response is not JSON */

            }


            throw new Error(message);

        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType.includes(
                "application/pdf"
            )
        ) {

            throw new Error(
                "Server did not return a PDF invoice."
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;

        link.download =
            `${invoice}.pdf`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.setTimeout(
            () => {
                URL.revokeObjectURL(url);
            },
            1000
        );


        showToast(
            `${invoice} downloaded successfully.`,
            "success"
        );


    } catch (error) {

        console.error(
            "[Subscription] Invoice download failed:",
            error
        );


        showToast(
            error.message ||
            "Unable to download invoice.",
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            originalText;

    }

}


/* =========================================================
   STATE LOAD
========================================================= */

function loadState() {

    const stored =
        localStorage.getItem(
            SubscriptionConfig.storage.subscription
        );


    if (!stored) return;


    try {

        const data =
            JSON.parse(stored);


        if (
            [
                "basic",
                "professional",
                "enterprise"
            ].includes(
                data.currentPlan
            )
        ) {

            SubscriptionState.currentPlan =
                data.currentPlan;

        }


        if (
            data.billingCycle === "monthly" ||
            data.billingCycle === "yearly"
        ) {

            SubscriptionState.billingCycle =
                data.billingCycle;

        }


        if (
            data.subscription &&
            typeof data.subscription ===
            "object"
        ) {

            SubscriptionState.subscription =
                {
                    ...SubscriptionState.subscription,

                    ...data.subscription
                };

        }


        /*
         * Keep state internally consistent.
         */

        SubscriptionState.subscription.plan =
            SubscriptionState.currentPlan;

        SubscriptionState.subscription.billingCycle =
            SubscriptionState.billingCycle;


    } catch (error) {

        console.warn(
            "[Subscription] Invalid stored state.",
            error
        );


        localStorage.removeItem(
            SubscriptionConfig.storage.subscription
        );

    }

}


/* =========================================================
   STATE SAVE
========================================================= */

function saveState() {

    const data = {

        currentPlan:
            SubscriptionState.currentPlan,

        billingCycle:
            SubscriptionState.billingCycle,

        subscription:
            SubscriptionState.subscription

    };


    localStorage.setItem(
        SubscriptionConfig.storage.subscription,
        JSON.stringify(data)
    );


    localStorage.setItem(
        SubscriptionConfig.storage.billingCycle,
        SubscriptionState.billingCycle
    );

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const theme =
        localStorage.getItem("theme");


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKeyboard(event) {

    if (
        event.key !== "Escape"
    ) {

        return;

    }


    if (
        DOM.planModal &&
        !DOM.planModal.hidden
    ) {

        closePlanModal();

        return;

    }


    if (
        DOM.cancelModal &&
        !DOM.cancelModal.hidden
    ) {

        closeCancelModal();

    }

}


/* =========================================================
   MODAL BODY STATE
========================================================= */

function checkModalBodyState() {

    const planOpen =
        DOM.planModal &&
        !DOM.planModal.hidden;


    const cancelOpen =
        DOM.cancelModal &&
        !DOM.cancelModal.hidden;


    if (
        planOpen ||
        cancelOpen
    ) {

        document.body.classList.add(
            "modal-open"
        );

    } else {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    /*
     * Use global SuperAdmin API
     * if base.js provides it.
     */

    if (
        window.SuperAdmin &&
        typeof window.SuperAdmin.apiRequest ===
        "function"
    ) {

        return window.SuperAdmin.apiRequest(
            url,
            options
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

        ...(options.headers || {})

    };


    let body =
        options.body;


    /*
     * JSON body
     */

    if (
        body &&
        typeof body === "object" &&
        !(body instanceof FormData) &&
        !(body instanceof Blob)
    ) {

        headers["Content-Type"] =
            "application/json";


        body =
            JSON.stringify(body);

    }


    /*
     * CSRF for Django
     */

    if (
        method !== "GET" &&
        method !== "HEAD" &&
        method !== "OPTIONS"
    ) {

        const csrf =
            getCSRFToken();


        if (csrf) {

            headers["X-CSRFToken"] =
                csrf;

        }

    }


    const response =
        await fetch(
            url,
            {
                ...options,

                method,

                body,

                credentials:
                    "same-origin",

                headers

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

        data =
            await response.json();

    } else {

        data =
            await response.text();

    }


    if (!response.ok) {

        const message =
            data?.message ||
            data?.detail ||
            data?.error ||
            (
                typeof data === "string" &&
                data
                    ? data
                    : `Request failed with status ${response.status}`
            );


        const error =
            new Error(message);


        error.status =
            response.status;


        error.data =
            data;


        throw error;

    }


    return data;

}


/* =========================================================
   CSRF TOKEN
========================================================= */

function getCSRFToken() {

    /*
     * Django hidden input
     */

    const input =
        document.querySelector(
            "[name=csrfmiddlewaretoken]"
        );


    if (input?.value) {

        return input.value;

    }


    /*
     * Meta tag
     */

    const meta =
        document.querySelector(
            'meta[name="csrf-token"]'
        );


    if (meta?.content) {

        return meta.content;

    }


    /*
     * Django cookie
     */

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


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info",
    duration = 3500
) {

    /*
     * Use global base.js toast first.
     */

    if (
        window.SuperAdmin &&
        typeof window.SuperAdmin.showToast ===
        "function"
    ) {

        window.SuperAdmin.showToast(
            message,
            type,
            duration
        );

        return;

    }


    if (!DOM.toastContainer) {

        console.warn(
            "[Subscription Toast]",
            message
        );

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


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    window.setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            window.setTimeout(
                () => toast.remove(),
                250
            );

        },
        duration
    );

}


/* =========================================================
   HELPERS
========================================================= */

function capitalize(value) {

    if (!value) return "";


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function formatCurrency(value) {

    return Number(value || 0)
        .toLocaleString("en-IN");

}


function getErrorMessage(
    error,
    fallback
) {

    if (
        error?.data?.message
    ) {

        return error.data.message;

    }


    if (
        error?.data?.detail
    ) {

        return error.data.detail;

    }


    if (
        error?.message
    ) {

        return error.message;

    }


    return fallback;

}


/* =========================================================
   GLOBAL API
========================================================= */

window.Subscription = {

    state:
        SubscriptionState,

    refresh:
        renderSubscription,

    openCancelModal,

    closeCancelModal,

    confirmCancellation,

    openPlanModal,

    closePlanModal,

    changePlan:
        confirmPlanChange,

    showToast,

    apiRequest

};