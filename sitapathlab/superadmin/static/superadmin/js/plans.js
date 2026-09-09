/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN — SUBSCRIPTION PLANS
 * Production / Industry Level JavaScript
 * ============================================================
 */

"use strict";


/* ============================================================
   CONFIG
============================================================ */

const PLAN_CONFIG = {

    API: {

        LIST: "/api/superadmin/plans/",

        CREATE: "/api/superadmin/plans/",

        UPDATE: "/api/superadmin/plans/",

        DELETE: "/api/superadmin/plans/",

        TOGGLE: "/api/superadmin/plans/"

    },

    PAGINATION: {

        PER_PAGE: 10

    },

    SEARCH_DELAY: 300

};


/* ============================================================
   STATE
============================================================ */

const planState = {

    plans: [],

    filteredPlans: [],

    currentPage: 1,

    perPage: PLAN_CONFIG.PAGINATION.PER_PAGE,

    search: "",

    status: "all",

    billing: "all",

    editingId: null,

    deletingId: null,

    loading: false

};


/* ============================================================
   DOM
============================================================ */

const DOM = {};


/* ============================================================
   INIT
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializePlans
);


function initializePlans() {

    cacheDOM();

    bindEvents();

    loadPlans();

}


/* ============================================================
   CACHE DOM
============================================================ */

function cacheDOM() {

    DOM.table =
        document.getElementById(
            "plansTableBody"
        );

    DOM.search =
        document.getElementById(
            "planSearch"
        );

    DOM.clearSearch =
        document.getElementById(
            "clearPlanSearch"
        );

    DOM.status =
        document.getElementById(
            "planStatusFilter"
        );

    DOM.billing =
        document.getElementById(
            "billingCycleFilter"
        );

    DOM.refresh =
        document.getElementById(
            "refreshPlans"
        );

    DOM.retry =
        document.getElementById(
            "retryPlans"
        );

    DOM.export =
        document.getElementById(
            "exportPlans"
        );

    DOM.create =
        document.getElementById(
            "createPlanBtn"
        );

    DOM.emptyCreate =
        document.getElementById(
            "emptyCreatePlan"
        );

    DOM.loading =
        document.getElementById(
            "plansLoading"
        );

    DOM.empty =
        document.getElementById(
            "plansEmpty"
        );

    DOM.error =
        document.getElementById(
            "plansError"
        );

    DOM.pagination =
        document.getElementById(
            "plansPagination"
        );

    DOM.resultCount =
        document.getElementById(
            "plansResultCount"
        );

    DOM.paginationFrom =
        document.getElementById(
            "paginationFrom"
        );

    DOM.paginationTo =
        document.getElementById(
            "paginationTo"
        );

    DOM.paginationTotal =
        document.getElementById(
            "paginationTotal"
        );


    /* Stats */

    DOM.totalPlans =
        document.getElementById(
            "totalPlans"
        );

    DOM.activePlans =
        document.getElementById(
            "activePlans"
        );

    DOM.inactivePlans =
        document.getElementById(
            "inactivePlans"
        );

    DOM.totalSubscribers =
        document.getElementById(
            "totalSubscribers"
        );

    DOM.monthlyRevenue =
        document.getElementById(
            "monthlyRevenue"
        );


    /* Plan Modal */

    DOM.planModal =
        document.getElementById(
            "planModal"
        );

    DOM.planModalTitle =
        document.getElementById(
            "planModalTitle"
        );

    DOM.closePlanModal =
        document.getElementById(
            "closePlanModal"
        );

    DOM.cancelPlan =
        document.getElementById(
            "cancelPlan"
        );

    DOM.form =
        document.getElementById(
            "planForm"
        );

    DOM.planId =
        document.getElementById(
            "planId"
        );

    DOM.planName =
        document.getElementById(
            "planName"
        );

    DOM.planDescription =
        document.getElementById(
            "planDescription"
        );

    DOM.descriptionCount =
        document.getElementById(
            "descriptionCount"
        );

    DOM.planPrice =
        document.getElementById(
            "planPrice"
        );

    DOM.planBilling =
        document.getElementById(
            "planBilling"
        );

    DOM.trialDays =
        document.getElementById(
            "trialDays"
        );

    DOM.maxSubscribers =
        document.getElementById(
            "maxSubscribers"
        );

    DOM.planStatus =
        document.getElementById(
            "planStatus"
        );

    DOM.planFeatured =
        document.getElementById(
            "planFeatured"
        );

    DOM.featuresList =
        document.getElementById(
            "featuresList"
        );

    DOM.addFeature =
        document.getElementById(
            "addFeature"
        );

    DOM.savePlan =
        document.getElementById(
            "savePlan"
        );


    /* Delete */

    DOM.deleteModal =
        document.getElementById(
            "deleteModal"
        );

    DOM.cancelDelete =
        document.getElementById(
            "cancelDelete"
        );

    DOM.confirmDelete =
        document.getElementById(
            "confirmDelete"
        );


    DOM.toastContainer =
        document.getElementById(
            "toastContainer"
        );

}


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

    DOM.create?.addEventListener(
        "click",
        () => openCreateModal()
    );


    DOM.emptyCreate?.addEventListener(
        "click",
        () => openCreateModal()
    );


    DOM.refresh?.addEventListener(
        "click",
        loadPlans
    );


    DOM.retry?.addEventListener(
        "click",
        loadPlans
    );


    DOM.search?.addEventListener(
        "input",
        debounce(
            handleSearch,
            PLAN_CONFIG.SEARCH_DELAY
        )
    );


    DOM.clearSearch?.addEventListener(
        "click",
        clearSearch
    );


    DOM.status?.addEventListener(
        "change",
        applyCurrentFilters
    );


    DOM.billing?.addEventListener(
        "change",
        applyCurrentFilters
    );


    DOM.export?.addEventListener(
        "click",
        exportCSV
    );


    DOM.table?.addEventListener(
        "click",
        handleTableAction
    );


    DOM.closePlanModal?.addEventListener(
        "click",
        closePlanModal
    );


    DOM.cancelPlan?.addEventListener(
        "click",
        closePlanModal
    );


    DOM.form?.addEventListener(
        "submit",
        handleFormSubmit
    );


    DOM.addFeature?.addEventListener(
        "click",
        addFeature
    );


    DOM.featuresList?.addEventListener(
        "click",
        handleFeatureAction
    );


    DOM.planDescription?.addEventListener(
        "input",
        updateDescriptionCount
    );


    DOM.cancelDelete?.addEventListener(
        "click",
        closeDeleteModal
    );


    DOM.confirmDelete?.addEventListener(
        "click",
        confirmDelete
    );


    DOM.planModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.planModal
            ) {

                closePlanModal();

            }

        }
    );


    DOM.deleteModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                DOM.deleteModal
            ) {

                closeDeleteModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );

}


/* ============================================================
   LOAD PLANS
============================================================ */

async function loadPlans() {

    setLoading(true);

    hideError();

    try {

        const response =
            await fetch(
                PLAN_CONFIG.API.LIST,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "X-Requested-With":
                            "XMLHttpRequest"
                    },

                    credentials:
                        "same-origin"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Unable to load plans (${response.status})`
            );

        }


        const data =
            await response.json();


        planState.plans =
            extractPlans(data);


        planState.currentPage = 1;


        updateStatistics();

        applyCurrentFilters();


    } catch (error) {

        console.error(
            "Plans API Error:",
            error
        );


        showError(
            error.message ||
            "Unable to load subscription plans."
        );


    } finally {

        setLoading(false);

    }

}


/* ============================================================
   EXTRACT API DATA
============================================================ */

function extractPlans(data) {

    if (Array.isArray(data)) {

        return data;

    }


    if (Array.isArray(data.results)) {

        return data.results;

    }


    if (Array.isArray(data.plans)) {

        return data.plans;

    }


    return [];

}


/* ============================================================
   FILTER
============================================================ */

function applyCurrentFilters() {

    planState.search =
        DOM.search?.value
            .trim()
            .toLowerCase() || "";


    planState.status =
        DOM.status?.value ||
        "all";


    planState.billing =
        DOM.billing?.value ||
        "all";


    let result =
        [...planState.plans];


    /* Search */

    if (planState.search) {

        result =
            result.filter(
                plan => {

                    const text = [

                        plan.name,

                        plan.description,

                        plan.billing_cycle,

                        plan.billingCycle,

                        ...(Array.isArray(plan.features)
                            ? plan.features
                            : [])

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        planState.search
                    );

                }
            );

    }


    /* Status */

    if (
        planState.status !==
        "all"
    ) {

        result =
            result.filter(
                plan => {

                    const active =
                        getBoolean(
                            plan.is_active ??
                            plan.isActive ??
                            plan.active
                        );


                    return (
                        planState.status ===
                        "active"
                            ? active
                            : !active
                    );

                }
            );

    }


    /* Billing */

    if (
        planState.billing !==
        "all"
    ) {

        result =
            result.filter(
                plan => {

                    const billing =
                        String(
                            plan.billing_cycle ??
                            plan.billingCycle ??
                            ""
                        ).toLowerCase();


                    return billing ===
                        planState.billing;

                }
            );

    }


    planState.filteredPlans =
        result;


    planState.currentPage = Math.min(
        planState.currentPage,
        Math.max(
            1,
            Math.ceil(
                result.length /
                planState.perPage
            )
        )
    );


    renderPlans();

}


/* ============================================================
   RENDER
============================================================ */

function renderPlans() {

    const total =
        planState.filteredPlans.length;


    if (DOM.resultCount) {

        DOM.resultCount.textContent =
            total;

    }


    if (!total) {

        DOM.table.innerHTML = "";

        DOM.empty.hidden = false;

        renderPagination(0);

        return;

    }


    DOM.empty.hidden = true;


    const start =
        (planState.currentPage - 1) *
        planState.perPage;


    const end =
        Math.min(
            start +
            planState.perPage,
            total
        );


    const current =
        planState.filteredPlans.slice(
            start,
            end
        );


    DOM.table.innerHTML =
        current
            .map(createPlanRow)
            .join("");


    updatePaginationInfo(
        start,
        end,
        total
    );


    renderPagination(total);

}


/* ============================================================
   PLAN ROW
============================================================ */

function createPlanRow(plan) {

    const id =
        plan.id ??
        plan.pk;


    const name =
        plan.name ||
        "Unnamed Plan";


    const description =
        plan.description ||
        "No description";


    const price =
        Number(
            plan.price ??
            plan.amount ??
            0
        );


    const billing =
        plan.billing_cycle ??
        plan.billingCycle ??
        "monthly";


    const active =
        getBoolean(
            plan.is_active ??
            plan.isActive ??
            plan.active
        );


    const featured =
        getBoolean(
            plan.is_featured ??
            plan.isFeatured ??
            plan.featured
        );


    const subscribers =
        Number(
            plan.subscribers_count ??
            plan.subscriber_count ??
            plan.subscribers ??
            0
        );


    const features =
        Array.isArray(plan.features)
            ? plan.features
            : [];


    const created =
        formatDate(
            plan.created_at ??
            plan.createdAt ??
            plan.created
        );


    return `

        <tr data-plan-id="${escapeHTML(id)}">

            <td>

                <div class="plan-name-cell">

                    <div class="plan-avatar">
                        ${escapeHTML(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>

                        <div class="plan-name">

                            ${escapeHTML(name)}

                            ${
                                featured
                                ? `
                                    <span
                                        class="featured-badge"
                                        title="Featured"
                                    >
                                        <i
                                            class="fas fa-star"
                                        ></i>
                                    </span>
                                `
                                : ""
                            }

                        </div>

                        <div class="plan-description">
                            ${escapeHTML(
                                description
                            )}
                        </div>

                    </div>

                </div>

            </td>


            <td>

                <span class="price">
                    ${formatCurrency(price)}
                    <small>
                        / ${escapeHTML(
                            billing
                        )}
                    </small>
                </span>

            </td>


            <td>

                <span class="billing-badge">
                    ${escapeHTML(
                        capitalize(
                            billing
                        )
                    )}
                </span>

            </td>


            <td>

                <span class="feature-count">

                    <i class="fas fa-list-check"></i>

                    ${features.length}

                    ${
                        features.length === 1
                            ? "feature"
                            : "features"
                    }

                </span>

            </td>


            <td>

                <span class="subscriber-count">

                    ${formatNumber(
                        subscribers
                    )}

                </span>

            </td>


            <td>

                ${createStatusBadge(
                    active
                )}

            </td>


            <td>

                ${created}

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="table-action"
                        data-action="edit"
                        data-id="${escapeHTML(id)}"
                        title="Edit Plan"
                    >
                        <i class="fas fa-pen"></i>
                    </button>


                    <button
                        type="button"
                        class="table-action"
                        data-action="toggle"
                        data-id="${escapeHTML(id)}"
                        title="${
                            active
                                ? "Deactivate"
                                : "Activate"
                        }"
                    >
                        <i class="fas ${
                            active
                                ? "fa-toggle-on"
                                : "fa-toggle-off"
                        }"></i>
                    </button>


                    <button
                        type="button"
                        class="table-action"
                        data-action="duplicate"
                        data-id="${escapeHTML(id)}"
                        title="Duplicate Plan"
                    >
                        <i class="fas fa-copy"></i>
                    </button>


                    <button
                        type="button"
                        class="table-action danger"
                        data-action="delete"
                        data-id="${escapeHTML(id)}"
                        title="Delete Plan"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* ============================================================
   STATUS
============================================================ */

function createStatusBadge(active) {

    return `

        <span class="status-badge ${
            active
                ? "active"
                : "inactive"
        }">

            <span class="status-dot"></span>

            ${
                active
                    ? "Active"
                    : "Inactive"
            }

        </span>

    `;

}


/* ============================================================
   TABLE ACTION
============================================================ */

function handleTableAction(event) {

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


    switch (action) {

        case "edit":

            openEditModal(id);

            break;


        case "toggle":

            togglePlan(id);

            break;


        case "duplicate":

            duplicatePlan(id);

            break;


        case "delete":

            openDeleteModal(id);

            break;

    }

}


/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    planState.editingId =
        null;


    resetForm();


    DOM.planModalTitle.textContent =
        "Create Subscription Plan";


    DOM.savePlan.innerHTML = `
        <i class="fas fa-check"></i>
        <span>Create Plan</span>
    `;


    DOM.planModal.hidden =
        false;


    DOM.planName.focus();


    lockBody();

}


/* ============================================================
   EDIT MODAL
============================================================ */

function openEditModal(id) {

    const plan =
        findPlan(id);


    if (!plan) {

        showToast(
            "Plan not found.",
            "error"
        );

        return;

    }


    planState.editingId =
        id;


    populateForm(plan);


    DOM.planModalTitle.textContent =
        "Edit Subscription Plan";


    DOM.savePlan.innerHTML = `
        <i class="fas fa-save"></i>
        <span>Update Plan</span>
    `;


    DOM.planModal.hidden =
        false;


    DOM.planName.focus();


    lockBody();

}


/* ============================================================
   POPULATE FORM
============================================================ */

function populateForm(plan) {

    DOM.planId.value =
        plan.id ??
        plan.pk ??
        "";


    DOM.planName.value =
        plan.name ||
        "";


    DOM.planDescription.value =
        plan.description ||
        "";


    DOM.planPrice.value =
        plan.price ??
        "";


    DOM.planBilling.value =
        plan.billing_cycle ??
        plan.billingCycle ??
        "monthly";


    DOM.trialDays.value =
        plan.trial_days ??
        plan.trialDays ??
        0;


    DOM.maxSubscribers.value =
        plan.max_subscribers ??
        plan.maxSubscribers ??
        "";


    DOM.planStatus.value =
        getBoolean(
            plan.is_active ??
            plan.isActive ??
            plan.active
        )
            ? "true"
            : "false";


    DOM.planFeatured.checked =
        getBoolean(
            plan.is_featured ??
            plan.isFeatured ??
            plan.featured
        );


    DOM.featuresList.innerHTML =
        "";


    const features =
        Array.isArray(plan.features)
            ? plan.features
            : [];


    if (!features.length) {

        addFeatureRow();

    } else {

        features.forEach(
            feature =>
                addFeatureRow(
                    feature
                )
        );

    }


    updateDescriptionCount();

}


/* ============================================================
   RESET FORM
============================================================ */

function resetForm() {

    DOM.form.reset();

    DOM.planId.value = "";

    DOM.trialDays.value = 0;

    DOM.planStatus.value =
        "true";

    DOM.planFeatured.checked =
        false;


    DOM.featuresList.innerHTML =
        "";


    addFeatureRow();

    updateDescriptionCount();


    clearFormErrors();

}


/* ============================================================
   CLOSE PLAN MODAL
============================================================ */

function closePlanModal() {

    DOM.planModal.hidden =
        true;


    planState.editingId =
        null;


    unlockBody();

}


/* ============================================================
   FORM SUBMIT
============================================================ */

async function handleFormSubmit(event) {

    event.preventDefault();


    clearFormErrors();


    const data =
        getFormData();


    if (!validateForm(data)) {

        return;

    }


    const editing =
        Boolean(
            planState.editingId
        );


    setSaveLoading(true);


    try {

        const url =
            editing
                ? `${PLAN_CONFIG.API.UPDATE}${encodeURIComponent(
                    planState.editingId
                )}/`
                : PLAN_CONFIG.API.CREATE;


        const method =
            editing
                ? "PUT"
                : "POST";


        const response =
            await fetch(
                url,
                {
                    method,

                    headers: {
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken(),

                        "X-Requested-With":
                            "XMLHttpRequest"
                    },

                    credentials:
                        "same-origin",

                    body:
                        JSON.stringify(data)
                }
            );


        if (!response.ok) {

            throw new Error(
                await parseAPIError(
                    response
                )
            );

        }


        closePlanModal();


        showToast(
            editing
                ? "Plan updated successfully."
                : "Plan created successfully.",
            "success"
        );


        await loadPlans();


    } catch (error) {

        console.error(
            "Save Plan Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save plan.",
            "error"
        );


    } finally {

        setSaveLoading(false);

    }

}


/* ============================================================
   FORM DATA
============================================================ */

function getFormData() {

    const features =
        [
            ...document.querySelectorAll(
                ".feature-input"
            )
        ]
            .map(input =>
                input.value.trim()
            )
            .filter(Boolean);


    return {

        name:
            DOM.planName.value.trim(),

        description:
            DOM.planDescription.value.trim(),

        price:
            Number(
                DOM.planPrice.value
            ),

        billing_cycle:
            DOM.planBilling.value,

        trial_days:
            Number(
                DOM.trialDays.value ||
                0
            ),

        max_subscribers:
            DOM.maxSubscribers.value
                ? Number(
                    DOM.maxSubscribers.value
                )
                : null,

        is_active:
            DOM.planStatus.value ===
            "true",

        is_featured:
            DOM.planFeatured.checked,

        features

    };

}


/* ============================================================
   VALIDATION
============================================================ */

function validateForm(data) {

    let valid = true;


    if (!data.name) {

        setFieldError(
            DOM.planName,
            "Plan name is required."
        );

        valid = false;

    }


    if (
        Number.isNaN(
            data.price
        ) ||
        data.price < 0
    ) {

        setFieldError(
            DOM.planPrice,
            "Enter a valid price."
        );

        valid = false;

    }


    if (!data.billing_cycle) {

        setFieldError(
            DOM.planBilling,
            "Select billing cycle."
        );

        valid = false;

    }


    if (
        data.trial_days < 0 ||
        data.trial_days > 365
    ) {

        setFieldError(
            DOM.trialDays,
            "Trial period must be between 0 and 365 days."
        );

        valid = false;

    }


    return valid;

}


/* ============================================================
   FEATURE MANAGEMENT
============================================================ */

function addFeature(
    value = ""
) {

    addFeatureRow(value);

}


function addFeatureRow(
    value = ""
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "feature-row";


    row.innerHTML = `

        <input
            type="text"
            class="feature-input"
            placeholder="e.g. Unlimited reports"
            maxlength="150"
            value="${escapeHTML(value)}"
        >

        <button
            type="button"
            class="remove-feature"
            title="Remove feature"
        >
            <i class="fas fa-trash"></i>
        </button>

    `;


    DOM.featuresList.appendChild(
        row
    );

}


function handleFeatureAction(event) {

    const removeButton =
        event.target.closest(
            ".remove-feature"
        );


    if (!removeButton) {
        return;
    }


    const rows =
        DOM.featuresList.querySelectorAll(
            ".feature-row"
        );


    if (rows.length === 1) {

        rows[0]
            .querySelector(
                ".feature-input"
            )
            .value = "";

        return;

    }


    removeButton
        .closest(".feature-row")
        .remove();

}


/* ============================================================
   DESCRIPTION COUNT
============================================================ */

function updateDescriptionCount() {

    if (!DOM.planDescription) {
        return;
    }


    DOM.descriptionCount.textContent =
        DOM.planDescription.value.length;

}


/* ============================================================
   TOGGLE PLAN
============================================================ */

async function togglePlan(id) {

    const plan =
        findPlan(id);


    if (!plan) {
        return;
    }


    const active =
        getBoolean(
            plan.is_active ??
            plan.isActive ??
            plan.active
        );


    try {

        const response =
            await fetch(
                `${PLAN_CONFIG.API.TOGGLE}${encodeURIComponent(id)}/toggle/`,
                {
                    method: "POST",

                    headers: {

                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken(),

                        "X-Requested-With":
                            "XMLHttpRequest"

                    },

                    credentials:
                        "same-origin",

                    body:
                        JSON.stringify({
                            is_active:
                                !active
                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                await parseAPIError(
                    response
                )
            );

        }


        showToast(
            !active
                ? "Plan activated."
                : "Plan deactivated.",
            "success"
        );


        await loadPlans();


    } catch (error) {

        console.error(
            "Toggle Plan Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to update plan status.",
            "error"
        );

    }

}


/* ============================================================
   DUPLICATE
============================================================ */

function duplicatePlan(id) {

    const plan =
        findPlan(id);


    if (!plan) {
        return;
    }


    openCreateModal();


    DOM.planName.value =
        `${plan.name || "Plan"} Copy`;


    DOM.planDescription.value =
        plan.description || "";


    DOM.planPrice.value =
        plan.price ?? "";


    DOM.planBilling.value =
        plan.billing_cycle ??
        plan.billingCycle ??
        "monthly";


    DOM.trialDays.value =
        plan.trial_days ??
        plan.trialDays ??
        0;


    DOM.maxSubscribers.value =
        plan.max_subscribers ??
        plan.maxSubscribers ??
        "";


    DOM.planStatus.value =
        "false";


    DOM.planFeatured.checked =
        false;


    DOM.featuresList.innerHTML =
        "";


    const features =
        Array.isArray(plan.features)
            ? plan.features
            : [];


    if (features.length) {

        features.forEach(
            feature =>
                addFeatureRow(
                    feature
                )
        );

    } else {

        addFeatureRow();

    }


    updateDescriptionCount();

}


/* ============================================================
   DELETE
============================================================ */

function openDeleteModal(id) {

    planState.deletingId =
        id;


    DOM.deleteModal.hidden =
        false;


    lockBody();

}


function closeDeleteModal() {

    DOM.deleteModal.hidden =
        true;


    planState.deletingId =
        null;


    unlockBody();

}


async function confirmDelete() {

    const id =
        planState.deletingId;


    if (!id) {
        return;
    }


    DOM.confirmDelete.disabled =
        true;


    try {

        const response =
            await fetch(
                `${PLAN_CONFIG.API.DELETE}${encodeURIComponent(id)}/`,
                {
                    method: "DELETE",

                    headers: {

                        "Accept":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken(),

                        "X-Requested-With":
                            "XMLHttpRequest"

                    },

                    credentials:
                        "same-origin"
                }
            );


        if (!response.ok) {

            throw new Error(
                await parseAPIError(
                    response
                )
            );

        }


        closeDeleteModal();


        showToast(
            "Plan deleted successfully.",
            "success"
        );


        await loadPlans();


    } catch (error) {

        console.error(
            "Delete Plan Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete plan.",
            "error"
        );


    } finally {

        DOM.confirmDelete.disabled =
            false;

    }

}


/* ============================================================
   STATISTICS
============================================================ */

function updateStatistics() {

    const plans =
        planState.plans;


    const active =
        plans.filter(
            plan =>
                getBoolean(
                    plan.is_active ??
                    plan.isActive ??
                    plan.active
                )
        );


    const inactive =
        plans.length -
        active.length;


    const subscribers =
        plans.reduce(
            (
                total,
                plan
            ) =>
                total +
                Number(
                    plan.subscribers_count ??
                    plan.subscriber_count ??
                    plan.subscribers ??
                    0
                ),
            0
        );


    const monthlyRevenue =
        active.reduce(
            (
                total,
                plan
            ) => {

                const price =
                    Number(
                        plan.price ??
                        plan.amount ??
                        0
                    );


                const billing =
                    String(
                        plan.billing_cycle ??
                        plan.billingCycle ??
                        "monthly"
                    ).toLowerCase();


                if (
                    billing ===
                    "yearly"
                ) {

                    return total +
                        price / 12;

                }


                if (
                    billing ===
                    "quarterly"
                ) {

                    return total +
                        price / 3;

                }


                return total + price;

            },
            0
        );


    setText(
        DOM.totalPlans,
        formatNumber(
            plans.length
        )
    );


    setText(
        DOM.activePlans,
        formatNumber(
            active.length
        )
    );


    setText(
        DOM.inactivePlans,
        formatNumber(
            inactive
        )
    );


    setText(
        DOM.totalSubscribers,
        formatNumber(
            subscribers
        )
    );


    setText(
        DOM.monthlyRevenue,
        formatCurrency(
            monthlyRevenue
        )
    );

}


/* ============================================================
   PAGINATION
============================================================ */

function renderPagination(
    total
) {

    const pages =
        Math.ceil(
            total /
            planState.perPage
        );


    if (
        pages <= 1
    ) {

        DOM.pagination.innerHTML =
            "";

        return;

    }


    let html = "";


    html += paginationButton(
        planState.currentPage - 1,
        `<i class="fas fa-chevron-left"></i>`,
        planState.currentPage === 1
    );


    for (
        let i = 1;
        i <= pages;
        i++
    ) {

        if (
            i === 1 ||
            i === pages ||
            Math.abs(
                i -
                planState.currentPage
            ) <= 2
        ) {

            html +=
                paginationButton(
                    i,
                    i,
                    false,
                    i ===
                    planState.currentPage
                );

        }

    }


    html += paginationButton(
        planState.currentPage + 1,
        `<i class="fas fa-chevron-right"></i>`,
        planState.currentPage === pages
    );


    DOM.pagination.innerHTML =
        html;


    DOM.pagination
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            Number(
                                button.dataset.page
                            );


                        if (
                            page < 1 ||
                            page > pages
                        ) {
                            return;
                        }


                        planState.currentPage =
                            page;


                        renderPlans();

                    }
                );

            }
        );

}


function paginationButton(
    page,
    content,
    disabled = false,
    active = false
) {

    return `

        <button
            type="button"
            class="pagination-btn ${
                active
                    ? "active"
                    : ""
            }"
            data-page="${page}"
            ${disabled ? "disabled" : ""}
        >
            ${content}
        </button>

    `;

}


/* ============================================================
   PAGINATION INFO
============================================================ */

function updatePaginationInfo(
    start,
    end,
    total
) {

    setText(
        DOM.paginationFrom,
        total
            ? start + 1
            : 0
    );


    setText(
        DOM.paginationTo,
        end
    );


    setText(
        DOM.paginationTotal,
        total
    );

}


/* ============================================================
   SEARCH
============================================================ */

function handleSearch() {

    planState.currentPage =
        1;


    if (
        DOM.clearSearch
    ) {

        DOM.clearSearch.style.display =
            DOM.search.value
                ? "block"
                : "none";

    }


    applyCurrentFilters();

}


function clearSearch() {

    DOM.search.value =
        "";


    DOM.clearSearch.style.display =
        "none";


    planState.currentPage =
        1;


    applyCurrentFilters();

}


/* ============================================================
   EXPORT
============================================================ */

function exportCSV() {

    const plans =
        planState.filteredPlans;


    if (!plans.length) {

        showToast(
            "No plans available for export.",
            "warning"
        );

        return;

    }


    const headers = [

        "ID",

        "Plan Name",

        "Description",

        "Price",

        "Billing Cycle",

        "Subscribers",

        "Status",

        "Featured",

        "Created"

    ];


    const rows =
        plans.map(
            plan => [

                plan.id ??
                plan.pk ??
                "",

                plan.name ??
                "",

                plan.description ??
                "",

                plan.price ??
                0,

                plan.billing_cycle ??
                plan.billingCycle ??
                "",

                plan.subscribers_count ??
                plan.subscribers ??
                0,

                getBoolean(
                    plan.is_active ??
                    plan.isActive ??
                    plan.active
                )
                    ? "Active"
                    : "Inactive",

                getBoolean(
                    plan.is_featured ??
                    plan.isFeatured ??
                    plan.featured
                )
                    ? "Yes"
                    : "No",

                plan.created_at ??
                plan.createdAt ??
                ""

            ]
        );


    const csv = [

        headers,

        ...rows

    ]
        .map(
            row =>
                row
                    .map(csvEscape)
                    .join(",")
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
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `subscription-plans-${dateStamp()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Plans exported successfully.",
        "success"
    );

}


/* ============================================================
   LOADING
============================================================ */

function setLoading(
    loading
) {

    planState.loading =
        loading;


    DOM.loading.hidden =
        !loading;


    if (DOM.refresh) {

        DOM.refresh.disabled =
            loading;

    }

}


/* ============================================================
   SAVE LOADING
============================================================ */

function setSaveLoading(
    loading
) {

    DOM.savePlan.disabled =
        loading;


    DOM.savePlan.innerHTML =
        loading

            ? `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Saving...</span>
              `

            : `
                <i class="fas fa-check"></i>
                <span>Save Plan</span>
              `;

}


/* ============================================================
   ERROR
============================================================ */

function showError(
    message
) {

    DOM.error.hidden =
        false;


    const messageElement =
        DOM.error.querySelector(
            "[data-error-message]"
        );


    if (messageElement) {

        messageElement.textContent =
            message;

    }

}


function hideError() {

    DOM.error.hidden =
        true;

}


/* ============================================================
   FORM ERRORS
============================================================ */

function setFieldError(
    field,
    message
) {

    const group =
        field.closest(
            ".form-group"
        );


    if (!group) {
        return;
    }


    const error =
        group.querySelector(
            ".field-error"
        );


    if (error) {

        error.textContent =
            message;

    }


    field.classList.add(
        "input-error"
    );

}


function clearFormErrors() {

    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(
            error =>
                error.textContent =
                    ""
        );


    document
        .querySelectorAll(
            ".input-error"
        )
        .forEach(
            field =>
                field.classList.remove(
                    "input-error"
                )
        );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
    message,
    type = "info"
) {

    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const icons = {

        success:
            "fa-circle-check",

        error:
            "fa-circle-exclamation",

        warning:
            "fa-triangle-exclamation",

        info:
            "fa-circle-info"

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
            aria-label="Close"
        >
            <i class="fas fa-times"></i>
        </button>

    `;


    DOM.toastContainer.appendChild(
        toast
    );


    const close =
        () => {

            toast.remove();

        };


    toast
        .querySelector("button")
        .addEventListener(
            "click",
            close
        );


    setTimeout(
        close,
        4000
    );

}


/* ============================================================
   API ERROR
============================================================ */

async function parseAPIError(
    response
) {

    try {

        const data =
            await response.json();


        if (data.detail) {

            return data.detail;

        }


        if (data.message) {

            return data.message;

        }


        if (data.error) {

            return data.error;

        }


        if (
            typeof data ===
            "object"
        ) {

            const first =
                Object.values(
                    data
                )[0];


            if (
                Array.isArray(first)
            ) {

                return first[0];

            }

        }


    } catch {

        /* ignore */

    }


    return `Request failed (${response.status}).`;

}


/* ============================================================
   HELPERS
============================================================ */

function findPlan(id) {

    return planState.plans.find(
        plan =>
            String(
                plan.id ??
                plan.pk
            ) ===
            String(id)
    );

}


function getBoolean(value) {

    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    ) {

        return true;

    }


    return false;

}


function formatCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",

            currency: "INR",

            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );

}


function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "en-IN"
    ).format(
        Number(value) || 0
    );

}


function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",

            month: "short",

            year: "numeric"
        }
    ).format(date);

}


function capitalize(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            value;

    }

}


function escapeHTML(
    value
) {

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


function csvEscape(
    value
) {

    const string =
        String(
            value ?? ""
        );


    if (
        string.includes(",") ||
        string.includes('"') ||
        string.includes("\n")
    ) {

        return `"${string.replace(
            /"/g,
            '""'
        )}"`;

    }


    return string;

}


function dateStamp() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


function getCSRFToken() {

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
        cookie.split("=")[1]
    );

}


function debounce(
    callback,
    delay
) {

    let timer;


    return (...args) => {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () =>
                    callback(
                        ...args
                    ),
                delay
            );

    };

}


function lockBody() {

    document.body.style.overflow =
        "hidden";

}


function unlockBody() {

    if (
        DOM.planModal.hidden &&
        DOM.deleteModal.hidden
    ) {

        document.body.style.overflow =
            "";

    }

}


function handleKeyboard(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        if (
            !DOM.planModal.hidden
        ) {

            closePlanModal();

        }


        if (
            !DOM.deleteModal.hidden
        ) {

            closeDeleteModal();

        }

    }

}


/* ============================================================
   PUBLIC API
============================================================ */

window.PlansManager = {

    refresh:
        loadPlans,

    create:
        openCreateModal,

    edit:
        openEditModal,

    delete:
        openDeleteModal,

    exportCSV:
        exportCSV,

    getState:
        () => ({
            ...planState
        })

};


/* ============================================================
   END
============================================================ */