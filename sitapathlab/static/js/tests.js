/**
 * ============================================================
 * SITA PATH LAB - TEST MANAGEMENT
 * Production Frontend - Django API Connected
 * ============================================================
 *
 * IMPORTANT:
 * This file DOES NOT contain fallback/demo/dummy data.
 *
 * Backend is the single source of truth.
 *
 * ============================================================
 * API CONTRACT
 * ============================================================
 *
 * GET  /api/tests/data/
 *
 * Expected:
 * {
 *   "status": "success",
 *   "tests": [
 *     {
 *       "id": 1,
 *       "name": "Glucose Fasting",
 *       "category": "Biochemistry",
 *       "sample": "Blood",
 *       "department": "Core Lab",
 *       "range": "70 - 100 mg/dL",
 *       "price": 15,
 *       "status": "active",
 *       "code": "GLU-F"
 *     }
 *   ],
 *   "packages": [
 *     {
 *       "id": 1,
 *       "name": "Executive Health Checkup",
 *       "price": 199,
 *       "tests": ["CBC", "Lipid Profile"],
 *       "tag": "Best Seller",
 *       "tagIcon": "verified",
 *       "tagColor": "secondary"
 *     }
 *   ]
 * }
 *
 *
 * POST /api/tests/manage/
 *
 * ADD:
 * {
 *   "action": "add",
 *   "test": {
 *      "name": "...",
 *      "category": "...",
 *      "sample": "...",
 *      "department": "...",
 *      "range": "...",
 *      "price": 100
 *   }
 * }
 *
 * EDIT:
 * {
 *   "action": "edit",
 *   "id": 1,
 *   "test": {
 *      "name": "...",
 *      "price": 100,
 *      "status": "active"
 *   }
 * }
 *
 * DELETE:
 * {
 *   "action": "delete",
 *   "id": 1
 * }
 *
 * Successful mutation:
 * {
 *   "status": "success",
 *   "message": "..."
 * }
 *
 * Error:
 * {
 *   "status": "error",
 *   "message": "..."
 * }
 *
 * ============================================================
 */


/* ============================================================
   CONFIGURATION
============================================================ */

const API = Object.freeze({
    data: "/api/tests/data/",
    manage: "/api/tests/manage/"
});

const ITEMS_PER_PAGE = 4;

const REQUEST_TIMEOUT = 15000;

const ALLOWED_CATEGORIES = [
    "biochemistry",
    "hematology",
    "microbiology",
    "immunology"
];

const ALLOWED_STATUS = [
    "active",
    "inactive"
];


/* ============================================================
   APPLICATION STATE
============================================================ */

const state = {
    tests: [],
    packages: [],

    filteredTests: [],

    currentPage: 1,

    loading: false,

    mutating: false,

    initialized: false
};


/* ============================================================
   DOM REFERENCES
============================================================ */

const DOM = {
    body: document.body,

    testTableBody:
        document.getElementById("testTableBody"),

    testCount:
        document.getElementById("testCount"),

    footerText:
        document.getElementById("footerText"),

    prevPage:
        document.getElementById("prevPage"),

    nextPage:
        document.getElementById("nextPage"),

    testSearch:
        document.getElementById("testSearch"),

    filterSearch:
        document.getElementById("filterSearch"),

    categoryFilter:
        document.getElementById("categoryFilter"),

    statusFilter:
        document.getElementById("statusFilter"),

    packagesList:
        document.getElementById("packagesList"),

    sidebar:
        document.getElementById("sidebar")
};


/* ============================================================
   UTILITY - COOKIE / CSRF
============================================================ */

function getCookie(name) {

    if (!document.cookie) {
        return null;
    }

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

    const token =
        getCookie("csrftoken");

    return token || "";
}


/* ============================================================
   UTILITY - SAFE TEXT
============================================================ */

/*
 * Never trust backend/user supplied strings.
 *
 * We use textContent instead of injecting raw values
 * into innerHTML.
 */

function createTextElement(
    tag,
    className,
    value
) {

    const element =
        document.createElement(tag);

    if (className) {
        element.className =
            className;
    }

    element.textContent =
        value ?? "";

    return element;
}


/* ============================================================
   UTILITY - VALIDATION
============================================================ */

function normalizeString(value) {

    return String(
        value ?? ""
    ).trim();
}


function normalizeStatus(value) {

    return normalizeString(value)
        .toLowerCase();
}


function isValidId(id) {

    return (
        Number.isInteger(
            Number(id)
        ) &&
        Number(id) > 0
    );
}


function isValidPrice(value) {

    const price =
        Number(value);

    return (
        Number.isFinite(price) &&
        price > 0
    );
}


function validateTestObject(test) {

    if (!test || typeof test !== "object") {

        return {
            valid: false,
            message:
                "Invalid test data received from server."
        };
    }


    if (!isValidId(test.id)) {

        return {
            valid: false,
            message:
                "Invalid test ID received from server."
        };
    }


    if (
        !normalizeString(test.name)
    ) {

        return {
            valid: false,
            message:
                "Test name is missing."
        };
    }


    if (!isValidPrice(test.price)) {

        return {
            valid: false,
            message:
                `Invalid price for "${test.name}".`
        };
    }


    const status =
        normalizeStatus(test.status);

    if (
        status &&
        !ALLOWED_STATUS.includes(status)
    ) {

        return {
            valid: false,
            message:
                `Invalid status for "${test.name}".`
        };
    }


    return {
        valid: true
    };
}


/* ============================================================
   UTILITY - CURRENCY
============================================================ */

const currencyFormatter =
    new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );


function formatCurrency(value) {

    const price =
        Number(value);

    if (
        !Number.isFinite(price)
    ) {
        return "₹0.00";
    }

    return currencyFormatter.format(
        price
    );
}


/* ============================================================
   UTILITY - ERROR MESSAGE
============================================================ */

function getErrorMessage(
    error,
    fallback = "Something went wrong."
) {

    if (!error) {
        return fallback;
    }


    if (
        typeof error === "string"
    ) {
        return error;
    }


    if (error.message) {
        return error.message;
    }


    return fallback;
}


/* ============================================================
   API REQUEST WRAPPER
============================================================ */

async function apiRequest(
    url,
    options = {}
) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT
        );


    const method =
        (
            options.method ||
            "GET"
        ).toUpperCase();


    const headers = {
        "Accept":
            "application/json",

        ...(
            options.headers || {}
        )
    };


    if (
        method !== "GET" &&
        method !== "HEAD"
    ) {

        headers["Content-Type"] =
            "application/json";

        headers["X-CSRFToken"] =
            getCSRFToken();
    }


    try {

        const response =
            await fetch(
                url,
                {
                    ...options,

                    method,

                    headers,

                    credentials: "same-origin",

                    signal:
                        controller.signal
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


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
                status:
                    response.ok
                        ? "success"
                        : "error",

                message:
                    text ||
                    response.statusText
            };
        }


        if (!response.ok) {

            const message =
                data?.message ||
                data?.detail ||
                `Server error (${response.status})`;

            const error =
                new Error(message);

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }


        if (
            data?.status === "error"
        ) {

            const error =
                new Error(
                    data.message ||
                    "API request failed."
                );

            error.data =
                data;

            throw error;
        }


        return data;

    } catch (error) {

        if (
            error.name === "AbortError"
        ) {

            throw new Error(
                "Request timed out. Please check your connection and try again."
            );
        }


        if (
            error instanceof TypeError
        ) {

            throw new Error(
                "Unable to connect to the server."
            );
        }


        throw error;

    } finally {

        clearTimeout(timeout);
    }
}


/* ============================================================
   PAGE LOADING STATE
============================================================ */

function showTableLoading() {

    if (
        !DOM.testTableBody
    ) {
        return;
    }


    DOM.testTableBody.innerHTML = "";


    const row =
        document.createElement("tr");


    const cell =
        document.createElement("td");

    cell.colSpan = 6;

    cell.style.textAlign =
        "center";

    cell.style.padding =
        "50px 20px";


    const icon =
        createTextElement(
            "span",
            "material-symbols-outlined",
            "progress_activity"
        );

    icon.style.fontSize =
        "42px";

    icon.style.display =
        "block";

    icon.style.marginBottom =
        "12px";


    const text =
        createTextElement(
            "p",
            "",
            "Loading tests..."
        );

    text.style.fontWeight =
        "600";


    cell.appendChild(icon);

    cell.appendChild(text);

    row.appendChild(cell);

    DOM.testTableBody.appendChild(row);
}


function showTableError(message) {

    if (
        !DOM.testTableBody
    ) {
        return;
    }


    DOM.testTableBody.innerHTML = "";


    const row =
        document.createElement("tr");


    const cell =
        document.createElement("td");

    cell.colSpan = 6;

    cell.style.textAlign =
        "center";

    cell.style.padding =
        "50px 20px";


    const icon =
        createTextElement(
            "span",
            "material-symbols-outlined",
            "error"
        );

    icon.style.fontSize =
        "42px";

    icon.style.display =
        "block";

    icon.style.marginBottom =
        "12px";


    const title =
        createTextElement(
            "p",
            "",
            "Unable to load tests"
        );

    title.style.fontWeight =
        "700";


    const description =
        createTextElement(
            "p",
            "",
            message
        );

    description.style.marginTop =
        "6px";


    const retryButton =
        document.createElement(
            "button"
        );

    retryButton.className =
        "btn btn-primary";

    retryButton.type =
        "button";

    retryButton.textContent =
        "Retry";

    retryButton.style.marginTop =
        "16px";

    retryButton.addEventListener(
        "click",
        fetchTestsAndPackages
    );


    cell.appendChild(icon);

    cell.appendChild(title);

    cell.appendChild(
        description
    );

    cell.appendChild(
        retryButton
    );

    row.appendChild(cell);

    DOM.testTableBody.appendChild(
        row
    );
}


/* ============================================================
   LOAD TESTS + PACKAGES
============================================================ */

async function fetchTestsAndPackages() {

    if (state.loading) {
        return;
    }


    state.loading = true;

    showTableLoading();


    try {

        const data =
            await apiRequest(
                API.data,
                {
                    method: "GET"
                }
            );


        if (
            data?.status !== "success"
        ) {

            throw new Error(
                data?.message ||
                "Invalid API response."
            );
        }


        const serverTests =
            Array.isArray(data.tests)
                ? data.tests
                : null;


        const serverPackages =
            Array.isArray(data.packages)
                ? data.packages
                : null;


        if (!serverTests) {

            throw new Error(
                "Invalid tests data received from backend."
            );
        }


        if (!serverPackages) {

            throw new Error(
                "Invalid packages data received from backend."
            );
        }


        const validatedTests = [];


        for (
            const test of serverTests
        ) {

            const validation =
                validateTestObject(
                    test
                );


            if (
                validation.valid
            ) {

                validatedTests.push(
                    test
                );

            } else {

                console.warn(
                    "Invalid test skipped:",
                    test,
                    validation.message
                );
            }
        }


        state.tests =
            validatedTests;

        state.packages =
            serverPackages;


        state.filteredTests =
            [...state.tests];


        state.currentPage =
            1;


        renderTests();

        renderPackages();


        state.initialized =
            true;


    } catch (error) {

        console.error(
            "[Tests API]",
            error
        );


        state.tests = [];

        state.packages = [];

        state.filteredTests = [];

        state.currentPage = 1;


        showTableError(
            getErrorMessage(
                error,
                "Unable to load test catalog."
            )
        );


        renderPackages();


        showNotification(
            getErrorMessage(
                error,
                "Unable to load test catalog."
            ),
            "error"
        );

    } finally {

        state.loading = false;
    }
}


/* ============================================================
   RENDER TEST TABLE
============================================================ */

function renderTests() {

    if (
        !DOM.testTableBody
    ) {
        return;
    }


    const total =
        state.filteredTests.length;


    const totalPages =
        Math.ceil(
            total / ITEMS_PER_PAGE
        );


    if (
        totalPages > 0 &&
        state.currentPage > totalPages
    ) {

        state.currentPage =
            totalPages;
    }


    if (
        state.currentPage < 1
    ) {

        state.currentPage = 1;
    }


    const startIndex =
        (
            state.currentPage - 1
        ) *
        ITEMS_PER_PAGE;


    const pageItems =
        state.filteredTests.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );


    DOM.testTableBody.innerHTML =
        "";


    if (
        pageItems.length === 0
    ) {

        renderEmptyState();

        updatePagination();

        updateCounts();

        return;
    }


    for (
        const test of pageItems
    ) {

        DOM.testTableBody.appendChild(
            createTestRow(test)
        );
    }


    updatePagination();

    updateCounts();
}


/* ============================================================
   CREATE TEST TABLE ROW
============================================================ */

function createTestRow(test) {

    const tr =
        document.createElement("tr");


    /* Test details */

    const detailsCell =
        document.createElement("td");


    const detailsWrapper =
        document.createElement("div");


    const testName =
        createTextElement(
            "div",
            "test-name",
            normalizeString(
                test.name
            )
        );


    const testSub =
        createTextElement(
            "div",
            "test-sub",
            [
                normalizeString(
                    test.category
                ),

                "•",

                normalizeString(
                    test.sample
                )
            ].join(" ")
        );


    detailsWrapper.appendChild(
        testName
    );

    detailsWrapper.appendChild(
        testSub
    );

    detailsCell.appendChild(
        detailsWrapper
    );


    /* Department */

    const departmentCell =
        createTextElement(
            "td",
            "",
            normalizeString(
                test.department
            ) || "—"
        );


    /* Range */

    const rangeCell =
        document.createElement("td");


    const range =
        createTextElement(
            "span",
            "",
            normalizeString(
                test.range
            ) || "—"
        );

    range.style.fontWeight =
        "500";


    rangeCell.appendChild(
        range
    );


    /* Price */

    const priceCell =
        createTextElement(
            "td",
            "test-price",
            formatCurrency(
                test.price
            )
        );


    /* Status */

    const statusCell =
        document.createElement("td");

    statusCell.className =
        "text-center";


    const status =
        normalizeStatus(
            test.status
        );


    const statusBadge =
        createTextElement(
            "span",
            `status-badge ${
                status === "active"
                    ? "status-active"
                    : "status-inactive"
            }`,
            status || "Unknown"
        );


    statusCell.appendChild(
        statusBadge
    );


    /* Actions */

    const actionCell =
        document.createElement("td");

    actionCell.className =
        "text-right";


    const actionWrapper =
        document.createElement("div");

    actionWrapper.className =
        "action-btns";


    const editButton =
        document.createElement(
            "button"
        );

    editButton.type =
        "button";

    editButton.className =
        "action-btn edit";

    editButton.title =
        "Edit Test";

    editButton.setAttribute(
        "aria-label",
        `Edit ${test.name}`
    );


    const editIcon =
        createTextElement(
            "span",
            "material-symbols-outlined",
            "edit"
        );


    editButton.appendChild(
        editIcon
    );


    editButton.addEventListener(
        "click",
        () => editTest(test.id)
    );


    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.className =
        "action-btn delete";

    deleteButton.title =
        "Delete Test";

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${test.name}`
    );


    const deleteIcon =
        createTextElement(
            "span",
            "material-symbols-outlined",
            "delete"
        );


    deleteButton.appendChild(
        deleteIcon
    );


    deleteButton.addEventListener(
        "click",
        () => deleteTest(test.id)
    );


    actionWrapper.appendChild(
        editButton
    );

    actionWrapper.appendChild(
        deleteButton
    );


    actionCell.appendChild(
        actionWrapper
    );


    /* Final row */

    tr.appendChild(
        detailsCell
    );

    tr.appendChild(
        departmentCell
    );

    tr.appendChild(
        rangeCell
    );

    tr.appendChild(
        priceCell
    );

    tr.appendChild(
        statusCell
    );

    tr.appendChild(
        actionCell
    );


    return tr;
}


/* ============================================================
   EMPTY STATE
============================================================ */

function renderEmptyState() {

    const row =
        document.createElement("tr");


    const cell =
        document.createElement("td");

    cell.colSpan = 6;

    cell.style.textAlign =
        "center";

    cell.style.padding =
        "40px 20px";


    const icon =
        createTextElement(
            "span",
            "material-symbols-outlined",
            "search_off"
        );

    icon.style.fontSize =
        "48px";

    icon.style.display =
        "block";

    icon.style.marginBottom =
        "12px";


    const title =
        createTextElement(
            "p",
            "",
            state.tests.length === 0
                ? "No tests available"
                : "No tests found"
        );

    title.style.fontSize =
        "16px";

    title.style.fontWeight =
        "600";


    const description =
        createTextElement(
            "p",
            "",
            state.tests.length === 0
                ? "No laboratory tests have been added yet."
                : "Try adjusting your search or filters."
        );

    description.style.fontSize =
        "14px";

    description.style.marginTop =
        "4px";


    cell.appendChild(icon);

    cell.appendChild(title);

    cell.appendChild(
        description
    );


    row.appendChild(cell);

    DOM.testTableBody.appendChild(
        row
    );
}


/* ============================================================
   PAGINATION
============================================================ */

function updatePagination() {

    if (
        !DOM.prevPage ||
        !DOM.nextPage
    ) {
        return;
    }


    const totalPages =
        Math.ceil(
            state.filteredTests.length /
            ITEMS_PER_PAGE
        );


    const isFirstPage =
        state.currentPage <= 1;


    const isLastPage =
        totalPages === 0 ||
        state.currentPage >= totalPages;


    DOM.prevPage.disabled =
        isFirstPage;


    DOM.nextPage.disabled =
        isLastPage;


    DOM.prevPage.style.opacity =
        isFirstPage
            ? "0.5"
            : "1";


    DOM.nextPage.style.opacity =
        isLastPage
            ? "0.5"
            : "1";


    DOM.prevPage.style.cursor =
        isFirstPage
            ? "not-allowed"
            : "pointer";


    DOM.nextPage.style.cursor =
        isLastPage
            ? "not-allowed"
            : "pointer";
}


/* ============================================================
   COUNTS
============================================================ */

function updateCounts() {

    if (
        !DOM.testCount ||
        !DOM.footerText
    ) {
        return;
    }


    const total =
        state.filteredTests.length;


    DOM.testCount.textContent =
        `${total} Total Tests`;


    if (total === 0) {

        DOM.footerText.textContent =
            "No tests found";

        return;
    }


    const start =
        (
            state.currentPage - 1
        ) *
        ITEMS_PER_PAGE + 1;


    const end =
        Math.min(
            start + ITEMS_PER_PAGE - 1,
            total
        );


    DOM.footerText.textContent =
        `Showing ${start}-${end} of ${total} tests`;
}


/* ============================================================
   SEARCH + FILTER
============================================================ */

function applyFilters() {

    const searchTerm =
        normalizeString(
            DOM.filterSearch?.value
        ).toLowerCase();


    const category =
        normalizeString(
            DOM.categoryFilter?.value
        ).toLowerCase();


    const status =
        normalizeString(
            DOM.statusFilter?.value
        ).toLowerCase();


    state.filteredTests =
        state.tests.filter(
            test => {

                const name =
                    normalizeString(
                        test.name
                    ).toLowerCase();


                const testCategory =
                    normalizeString(
                        test.category
                    ).toLowerCase();


                const department =
                    normalizeString(
                        test.department
                    ).toLowerCase();


                const code =
                    normalizeString(
                        test.code
                    ).toLowerCase();


                const testStatus =
                    normalizeString(
                        test.status
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    name.includes(
                        searchTerm
                    ) ||
                    testCategory.includes(
                        searchTerm
                    ) ||
                    department.includes(
                        searchTerm
                    ) ||
                    code.includes(
                        searchTerm
                    );


                const matchesCategory =
                    category === "all" ||
                    testCategory === category;


                const matchesStatus =
                    status === "all" ||
                    testStatus === status;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                );
            }
        );


    state.currentPage = 1;

    renderTests();
}


/* ============================================================
   ADD NEW TEST
============================================================ */

async function addNewTest() {

    if (state.mutating) {
        return;
    }


    const name =
        prompt(
            "Enter test name:"
        );


    if (
        name === null
    ) {
        return;
    }


    const cleanName =
        normalizeString(name);


    if (!cleanName) {

        showNotification(
            "Test name is required.",
            "error"
        );

        return;
    }


    if (
        cleanName.length > 150
    ) {

        showNotification(
            "Test name is too long.",
            "error"
        );

        return;
    }


    const category =
        prompt(
            "Enter category (Biochemistry / Hematology / Immunology / Microbiology):"
        );


    if (
        category === null
    ) {
        return;
    }


    const cleanCategory =
        normalizeString(
            category
        );


    if (!cleanCategory) {

        showNotification(
            "Category is required.",
            "error"
        );

        return;
    }


    const normalizedCategory =
        cleanCategory.toLowerCase();


    if (
        !ALLOWED_CATEGORIES.includes(
            normalizedCategory
        )
    ) {

        showNotification(
            "Invalid test category.",
            "error"
        );

        return;
    }


    const priceInput =
        prompt(
            "Enter test price:"
        );


    if (
        priceInput === null
    ) {
        return;
    }


    const price =
        Number(
            priceInput
        );


    if (
        !isValidPrice(price)
    ) {

        showNotification(
            "Please enter a valid positive price.",
            "error"
        );

        return;
    }


    if (
        price > 99999999
    ) {

        showNotification(
            "Price exceeds the allowed limit.",
            "error"
        );

        return;
    }


    const payload = {

        action: "add",

        test: {

            name:
                cleanName,

            category:
                cleanCategory,

            sample:
                "Blood",

            department:
                "Core Lab",

            range:
                "Variable",

            price:
                price
        }
    };


    await performMutation(
        payload,
        "Test added successfully."
    );
}


/* ============================================================
   EDIT TEST
============================================================ */

async function editTest(id) {

    if (state.mutating) {
        return;
    }


    if (
        !isValidId(id)
    ) {

        showNotification(
            "Invalid test ID.",
            "error"
        );

        return;
    }


    const test =
        state.tests.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!test) {

        showNotification(
            "Test not found. Refreshing data...",
            "error"
        );

        await fetchTestsAndPackages();

        return;
    }


    const newName =
        prompt(
            "Edit test name:",
            test.name || ""
        );


    if (
        newName === null
    ) {
        return;
    }


    const cleanName =
        normalizeString(
            newName
        );


    if (!cleanName) {

        showNotification(
            "Test name cannot be empty.",
            "error"
        );

        return;
    }


    const newPriceInput =
        prompt(
            "Edit price:",
            test.price ?? ""
        );


    if (
        newPriceInput === null
    ) {
        return;
    }


    const newPrice =
        Number(
            newPriceInput
        );


    if (
        !isValidPrice(newPrice)
    ) {

        showNotification(
            "Please enter a valid positive price.",
            "error"
        );

        return;
    }


    const currentStatus =
        normalizeStatus(
            test.status
        );


    const nextStatus =
        currentStatus === "active"
            ? "inactive"
            : "active";


    const changeStatus =
        confirm(
            `Change status from "${currentStatus}" to "${nextStatus}"?`
        );


    const updatedStatus =
        changeStatus
            ? nextStatus
            : currentStatus;


    const payload = {

        action: "edit",

        id:
            Number(test.id),

        test: {

            name:
                cleanName,

            price:
                newPrice,

            status:
                updatedStatus
        }
    };


    await performMutation(
        payload,
        "Test updated successfully."
    );
}


/* ============================================================
   DELETE TEST
============================================================ */

async function deleteTest(id) {

    if (state.mutating) {
        return;
    }


    if (
        !isValidId(id)
    ) {

        showNotification(
            "Invalid test ID.",
            "error"
        );

        return;
    }


    const test =
        state.tests.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!test) {

        showNotification(
            "Test not found.",
            "error"
        );

        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${test.name}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    const payload = {

        action:
            "delete",

        id:
            Number(test.id)
    };


    await performMutation(
        payload,
        "Test deleted successfully."
    );
}


/* ============================================================
   MUTATION HANDLER
============================================================ */

async function performMutation(
    payload,
    successMessage
) {

    if (state.mutating) {
        return;
    }


    state.mutating = true;


    try {

        const data =
            await apiRequest(
                API.manage,
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (
            data?.status !== "success"
        ) {

            throw new Error(
                data?.message ||
                "Operation failed."
            );
        }


        showNotification(
            data.message ||
            successMessage,
            "success"
        );


        await fetchTestsAndPackages();


    } catch (error) {

        console.error(
            "[Tests Mutation]",
            error
        );


        showNotification(
            getErrorMessage(
                error,
                "Operation failed."
            ),
            "error"
        );

    } finally {

        state.mutating = false;
    }
}


/* ============================================================
   PACKAGES
============================================================ */

function renderPackages() {

    if (
        !DOM.packagesList
    ) {
        return;
    }


    DOM.packagesList.innerHTML =
        "";


    if (
        !Array.isArray(
            state.packages
        ) ||
        state.packages.length === 0
    ) {

        const empty =
            createTextElement(
                "div",
                "package-empty",
                "No active packages available."
            );


        empty.style.padding =
            "24px";

        empty.style.textAlign =
            "center";

        empty.style.opacity =
            "0.7";


        DOM.packagesList.appendChild(
            empty
        );

        return;
    }


    state.packages.forEach(
        pkg => {

            const packageElement =
                createPackageElement(
                    pkg
                );


            DOM.packagesList.appendChild(
                packageElement
            );
        }
    );
}


/* ============================================================
   CREATE PACKAGE ELEMENT
============================================================ */

function createPackageElement(pkg) {

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "package-item";


    div.setAttribute(
        "role",
        "button"
    );

    div.setAttribute(
        "tabindex",
        "0"
    );


    div.addEventListener(
        "click",
        () =>
            viewPackage(pkg.id)
    );


    div.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                viewPackage(
                    pkg.id
                );
            }
        }
    );


    const header =
        document.createElement(
            "div"
        );

    header.className =
        "package-item-header";


    const name =
        createTextElement(
            "div",
            "package-item-name",
            normalizeString(
                pkg.name
            ) || "Unnamed Package"
        );


    const price =
        createTextElement(
            "div",
            "package-item-price",
            formatCurrency(
                pkg.price
            )
        );


    header.appendChild(
        name
    );

    header.appendChild(
        price
    );


    const tests =
        Array.isArray(pkg.tests)
            ? pkg.tests
                .map(
                    item =>
                        normalizeString(
                            item
                        )
                )
                .filter(Boolean)
                .join(", ")
            : normalizeString(
                pkg.tests
            );


    const description =
        createTextElement(
            "div",
            "package-item-desc",
            tests
                ? `Includes: ${tests}`
                : "No tests assigned"
        );


    div.appendChild(
        header
    );

    div.appendChild(
        description
    );


    if (
        pkg.tag
    ) {

        const tag =
            document.createElement(
                "div"
            );

        tag.className =
            "package-item-tag";


        if (
            pkg.tagColor === "muted"
        ) {

            tag.classList.add(
                "muted"
            );
        }


        const tagIcon =
            createTextElement(
                "span",
                "material-symbols-outlined",
                normalizeString(
                    pkg.tagIcon
                ) || "label"
            );


        tag.appendChild(
            tagIcon
        );


        tag.appendChild(
            document.createTextNode(
                ` ${normalizeString(pkg.tag)}`
            )
        );


        div.appendChild(
            tag
        );
    }


    return div;
}


/* ============================================================
   CREATE PACKAGE
============================================================ */

function createPackage() {

    showNotification(
        "Package Builder is not connected yet.",
        "info"
    );
}


/* ============================================================
   VIEW PACKAGE
============================================================ */

function viewPackage(id) {

    const pkg =
        state.packages.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!pkg) {

        showNotification(
            "Package not found.",
            "error"
        );

        return;
    }


    const testList =
        Array.isArray(pkg.tests)
            ? pkg.tests
                .map(
                    item =>
                        normalizeString(
                            item
                        )
                )
                .filter(Boolean)
                .join(", ")
            : normalizeString(
                pkg.tests
            );


    const details = [

        `Package: ${
            normalizeString(
                pkg.name
            )
        }`,

        `Price: ${
            formatCurrency(
                pkg.price
            )
        }`,

        `Tests: ${
            testList ||
            "No tests assigned"
        }`

    ];


    if (
        pkg.tag
    ) {

        details.push(
            `Tag: ${
                normalizeString(
                    pkg.tag
                )
            }`
        );
    }


    alert(
        details.join("\n")
    );
}


/* ============================================================
   SIDEBAR
============================================================ */

function toggleSidebar() {

    if (
        !DOM.sidebar
    ) {
        return;
    }


    DOM.sidebar.classList.toggle(
        "sidenav-open"
    );
}


document.addEventListener(
    "click",
    event => {

        if (
            window.innerWidth >= 1024
        ) {
            return;
        }


        if (
            !DOM.sidebar
        ) {
            return;
        }


        const menuButton =
            document.querySelector(
                ".menu-btn"
            );


        const isOpen =
            DOM.sidebar.classList.contains(
                "sidenav-open"
            );


        if (
            isOpen &&
            !DOM.sidebar.contains(
                event.target
            ) &&
            !menuButton?.contains(
                event.target
            )
        ) {

            DOM.sidebar.classList.remove(
                "sidenav-open"
            );
        }
    }
);


/* ============================================================
   THEME
============================================================ */

function toggleTheme() {

    const isDark =
        DOM.body.classList.toggle(
            "dark"
        );


    localStorage.setItem(
        "theme",
        isDark
            ? "dark"
            : "light"
    );


    updateThemeIcon(
        isDark
    );
}


function updateThemeIcon(
    isDark
) {

    const icon =
        document.querySelector(
            ".icon-btn .material-symbols-outlined"
        );


    if (icon) {

        icon.textContent =
            isDark
                ? "light_mode"
                : "contrast";
    }
}


function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    const isDark =
        savedTheme === "dark";


    if (isDark) {

        DOM.body.classList.add(
            "dark"
        );
    }


    updateThemeIcon(
        isDark
    );
}


/* ============================================================
   NOTIFICATION
============================================================ */

function showNotification(
    message,
    type = "success"
) {

    const existing =
        document.querySelector(
            ".custom-notification"
        );


    if (existing) {
        existing.remove();
    }


    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        "custom-notification";


    const colors = {

        success:
            "#16a34a",

        error:
            "#ba1a1a",

        warning:
            "#d97706",

        info:
            "#004ac6"
    };


    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 14px 20px;
        background: ${
            colors[type] ||
            colors.info
        };
        color: #fff;
        border-radius: 12px;
        box-shadow:
            0 8px 24px rgba(0,0,0,0.18);
        z-index: 2000;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        max-width: min(420px, calc(100vw - 40px));
        line-height: 1.5;
        animation:
            slideInRight 0.25s ease;
    `;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    if (
        !document.getElementById(
            "notificationStyles"
        )
    ) {

        const style =
            document.createElement(
                "style"
            );


        style.id =
            "notificationStyles";


        style.textContent = `

            @keyframes slideInRight {

                from {
                    opacity: 0;
                    transform:
                        translateX(30px);
                }

                to {
                    opacity: 1;
                    transform:
                        translateX(0);
                }
            }

            @keyframes slideOutRight {

                from {
                    opacity: 1;
                    transform:
                        translateX(0);
                }

                to {
                    opacity: 0;
                    transform:
                        translateX(30px);
                }
            }
        `;


        document.head.appendChild(
            style
        );
    }


    setTimeout(
        () => {

            notification.style.animation =
                "slideOutRight 0.25s ease";


            setTimeout(
                () => {

                    notification.remove();

                },
                250
            );

        },
        4000
    );
}


/* ============================================================
   SEARCH SYNCHRONIZATION
============================================================ */

function setupSearch() {

    let searchTimeout;


    const runSearch =
        () => {

            clearTimeout(
                searchTimeout
            );


            searchTimeout =
                setTimeout(
                    applyFilters,
                    250
                );
        };


    if (
        DOM.testSearch
    ) {

        DOM.testSearch.addEventListener(
            "input",
            () => {

                if (
                    DOM.filterSearch
                ) {

                    DOM.filterSearch.value =
                        DOM.testSearch.value;
                }


                runSearch();
            }
        );
    }


    if (
        DOM.filterSearch
    ) {

        DOM.filterSearch.addEventListener(
            "input",
            () => {

                if (
                    DOM.testSearch
                ) {

                    DOM.testSearch.value =
                        DOM.filterSearch.value;
                }


                runSearch();
            }
        );
    }


    if (
        DOM.categoryFilter
    ) {

        DOM.categoryFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    if (
        DOM.statusFilter
    ) {

        DOM.statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }
}


/* ============================================================
   PAGINATION EVENTS
============================================================ */

function setupPagination() {

    if (
        DOM.prevPage
    ) {

        DOM.prevPage.addEventListener(
            "click",
            () => {

                if (
                    state.currentPage > 1
                ) {

                    state.currentPage--;

                    renderTests();
                }
            }
        );
    }


    if (
        DOM.nextPage
    ) {

        DOM.nextPage.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.ceil(
                        state.filteredTests.length /
                        ITEMS_PER_PAGE
                    );


                if (
                    state.currentPage <
                    totalPages
                ) {

                    state.currentPage++;

                    renderTests();
                }
            }
        );
    }
}


/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Ctrl/Cmd + D
             */
            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                    "d"
            ) {

                event.preventDefault();

                toggleTheme();
            }


            /*
             * Ctrl/Cmd + F
             */
            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                    "f"
            ) {

                event.preventDefault();

                DOM.filterSearch?.focus();
            }


            /*
             * Escape
             */
            if (
                event.key === "Escape"
            ) {

                document.activeElement?.blur();

                DOM.sidebar?.classList.remove(
                    "sidenav-open"
                );
            }
        }
    );
}


/* ============================================================
   INITIALIZATION
============================================================ */

async function initializeTestsPage() {

    if (
        state.initialized
    ) {
        return;
    }


    initializeTheme();

    setupSearch();

    setupPagination();

    setupKeyboardShortcuts();

    await fetchTestsAndPackages();


    console.log(
        "Sita Path Lab - Test Management initialized."
    );
}


/* ============================================================
   DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeTestsPage
    );

} else {

    initializeTestsPage();
}


/* ============================================================
   OPTIONAL MODULE EXPORT
   Useful for testing environments only.
============================================================ */

if (
    typeof module !== "undefined" &&
    module.exports
) {

    module.exports = {

        fetchTestsAndPackages,

        applyFilters,

        addNewTest,

        editTest,

        deleteTest,

        createPackage,

        viewPackage,

        toggleTheme,

        toggleSidebar,

        formatCurrency,

        validateTestObject
    };
}