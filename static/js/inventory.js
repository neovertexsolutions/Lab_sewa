/**
 * Sita Path Lab - Inventory Management
 * Django Backend Connected
 */

let inventoryItems = [];
let orders = [];

let currentPage = 1;
const itemsPerPage = 4;
let filteredItems = [];

// ===============================
// DOM REFERENCES
// ===============================

const inventoryBody = document.getElementById("inventoryBody");
const ordersList = document.getElementById("ordersList");
const footerText = document.getElementById("footerText");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const inventorySearch = document.getElementById("inventorySearch");

const totalItemsElement = document.getElementById("totalItems");
const lowStockElement = document.getElementById("lowStock");
const expiringElement = document.getElementById("expiring");


// ===============================
// THEME
// ===============================

function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );

    updateThemeIcon();
}

function updateThemeIcon() {
    const icon =
        document.querySelector(".icon-btn .material-symbols-outlined") ||
        document.querySelector(".theme-toggle .material-symbols-outlined");

    if (!icon) return;

    icon.textContent =
        document.body.classList.contains("dark")
            ? "light_mode"
            : "contrast";
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    updateThemeIcon();
}


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener("DOMContentLoaded", function () {
    loadTheme();
    setupEventListeners();
    fetchInventoryData();
});


// ===============================
// FETCH INVENTORY
// ===============================

function fetchInventoryData() {
    fetch("/api/inventory/list/", {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "HTTP error: " + response.status
                );
            }

            return response.json();
        })
        .then(function (data) {

            if (data.status !== "success") {
                throw new Error(
                    data.message || "Failed to load inventory"
                );
            }

            inventoryItems = Array.isArray(data.inventory)
                ? data.inventory
                : [];

            orders = Array.isArray(data.orders)
                ? data.orders
                : [];

            filteredItems = [...inventoryItems];

            currentPage = 1;

            renderInventory();
            renderOrders();
            updateInventoryStats();
        })
        .catch(function (error) {

            console.error(
                "Inventory fetch error:",
                error
            );

            inventoryItems = [];
            orders = [];
            filteredItems = [];

            renderInventory();
            renderOrders();
            updateInventoryStats();

            showNotification(
                "Unable to load inventory data",
                "error"
            );
        });
}


// ===============================
// SIDEBAR
// ===============================

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    if (!sidebar) return;

    const isOpen =
        sidebar.classList.contains("sidebar-open");

    if (isOpen) {

        sidebar.classList.remove("sidebar-open");

        sidebar.style.display = "";

        sidebar.style.position = "";
        sidebar.style.inset = "";
        sidebar.style.top = "";
        sidebar.style.backgroundColor = "";
        sidebar.style.zIndex = "";

    } else {

        sidebar.classList.add("sidebar-open");

        sidebar.style.display = "flex";
        sidebar.style.position = "fixed";
        sidebar.style.inset = "0";
        sidebar.style.top = "64px";
        sidebar.style.backgroundColor = "#f3f3fe";
        sidebar.style.zIndex = "40";
    }
}


// ===============================
// CLOSE MOBILE SIDEBAR
// ===============================

document.addEventListener("click", function (e) {

    if (window.innerWidth >= 1024) return;

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.querySelector(".menu-btn");

    if (!sidebar) return;

    const isOpen =
        sidebar.classList.contains("sidebar-open");

    if (
        isOpen &&
        !sidebar.contains(e.target) &&
        !menuBtn?.contains(e.target)
    ) {

        sidebar.classList.remove("sidebar-open");

        sidebar.style.display = "";
        sidebar.style.position = "";
        sidebar.style.inset = "";
        sidebar.style.top = "";
        sidebar.style.backgroundColor = "";
        sidebar.style.zIndex = "";
    }
});


// ===============================
// RENDER INVENTORY
// ===============================

function renderInventory() {

    if (!inventoryBody) return;

    const totalPages =
        Math.ceil(
            filteredItems.length / itemsPerPage
        );

    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {
        currentPage = totalPages;
    }

    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const endIndex =
        startIndex + itemsPerPage;

    const pageItems =
        filteredItems.slice(
            startIndex,
            endIndex
        );

    inventoryBody.innerHTML = "";

    // NO DATA
    if (pageItems.length === 0) {

        inventoryBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:40px 20px;
                        color:#737686;
                    "
                >
                    <span
                        class="material-symbols-outlined"
                        style="
                            font-size:48px;
                            display:block;
                            margin-bottom:12px;
                        "
                    >
                        search_off
                    </span>

                    <p
                        style="
                            font-size:16px;
                            font-weight:600;
                        "
                    >
                        No items found
                    </p>

                    <p
                        style="
                            font-size:14px;
                            margin-top:4px;
                        "
                    >
                        Try adjusting your search or filters
                    </p>
                </td>
            </tr>
        `;

        updatePagination();
        updateCounts();

        return;
    }


    // DATA
    pageItems.forEach(function (item) {

        const tr =
            document.createElement("tr");

        const alertType =
            item.alert || "";

        const isExpiring =
            alertType === "expiring";

        const isCritical =
            alertType === "critical";

        const stockClass =
            isCritical
                ? "stock-value critical"
                : "stock-value";

        const expiryClass =
            isExpiring
                ? "expiry-date expiring"
                : "expiry-date";


        let alertHtml = "";

        if (
            item.alert &&
            item.alert_text
        ) {

            alertHtml = `
                <span class="alert-tag ${escapeHtml(
                    item.alert
                )}">
                    ${escapeHtml(item.alert_text)}
                </span>
            `;

        } else if (item.alert) {

            alertHtml = `
                <span class="alert-tag ${escapeHtml(
                    item.alert
                )}">
                    ${escapeHtml(item.alert)}
                </span>
            `;
        }


        const iconClass =
            item.icon_class ||
            item.iconClass ||
            "";

        const categoryClass =
            item.category_class ||
            item.categoryClass ||
            "";


        const stock =
            Number(item.stock) || 0;


        tr.innerHTML = `
            <td>
                <div class="item-cell">

                    <div class="item-icon ${escapeHtml(
                        iconClass
                    )}">
                        <span class="material-symbols-outlined">
                            ${escapeHtml(
                                item.icon || "inventory_2"
                            )}
                        </span>
                    </div>

                    <div>

                        <div class="item-name">
                            ${escapeHtml(
                                item.name || "Unnamed Item"
                            )}
                        </div>

                        ${alertHtml}

                    </div>
                </div>
            </td>

            <td>
                <span class="category-tag ${escapeHtml(
                    categoryClass
                )}">
                    ${escapeHtml(
                        item.category || "N/A"
                    )}
                </span>
            </td>

            <td class="text-right">
                <span class="${stockClass}">
                    ${stock.toLocaleString()}
                </span>
            </td>

            <td>
                ${escapeHtml(item.unit || "N/A")}
            </td>

            <td>
                ${escapeHtml(item.supplier || "N/A")}
            </td>

            <td class="${expiryClass}">
                ${formatDate(item.expiry)}
            </td>

            <td>
                <button
                    class="more-btn"
                    type="button"
                    onclick="showItemOptions(${Number(item.id)})"
                >
                    <span class="material-symbols-outlined">
                        more_vert
                    </span>
                </button>
            </td>
        `;

        inventoryBody.appendChild(tr);
    });


    updatePagination();
    updateCounts();
}


// ===============================
// RENDER ORDERS
// ===============================

function renderOrders() {

    if (!ordersList) return;

    ordersList.innerHTML = "";

    if (!orders.length) {

        ordersList.innerHTML = `
            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#737686;
                "
            >
                No pending orders
            </div>
        `;

        return;
    }


    orders.forEach(function (order) {

        const div =
            document.createElement("div");

        div.className = "order-item";

        div.innerHTML = `
            <div class="order-info">

                <div class="order-id">
                    ${escapeHtml(
                        order.id || "N/A"
                    )}
                </div>

                <div class="order-supplier">
                    ${escapeHtml(
                        order.supplier || "N/A"
                    )}
                </div>

            </div>

            <span class="order-status ${escapeHtml(
                order.status || ""
            )}">
                ${escapeHtml(
                    order.status || "pending"
                )}
            </span>
        `;

        ordersList.appendChild(div);
    });
}


// ===============================
// INVENTORY STATS
// ===============================

function updateInventoryStats() {

    if (totalItemsElement) {

        totalItemsElement.textContent =
            inventoryItems.length.toLocaleString();
    }


    if (lowStockElement) {

        const lowStock =
            inventoryItems.filter(function (item) {

                return (
                    item.alert === "critical" ||
                    Number(item.stock) <= 10
                );

            }).length;

        lowStockElement.textContent =
            lowStock.toLocaleString();
    }


    if (expiringElement) {

        const today = new Date();

        const thirtyDays =
            new Date(today);

        thirtyDays.setDate(
            today.getDate() + 30
        );

        const expiring =
            inventoryItems.filter(function (item) {

                if (!item.expiry) return false;

                const expiry =
                    new Date(item.expiry);

                return (
                    expiry >= today &&
                    expiry <= thirtyDays
                );
            }).length;

        expiringElement.textContent =
            expiring.toLocaleString();
    }
}


// ===============================
// PAGINATION
// ===============================

function updatePagination() {

    const totalPages =
        Math.ceil(
            filteredItems.length / itemsPerPage
        );


    if (prevPage) {

        prevPage.disabled =
            currentPage <= 1;

        prevPage.style.opacity =
            currentPage <= 1
                ? "0.5"
                : "1";

        prevPage.style.cursor =
            currentPage <= 1
                ? "not-allowed"
                : "pointer";
    }


    if (nextPage) {

        const disabled =
            totalPages === 0 ||
            currentPage >= totalPages;

        nextPage.disabled = disabled;

        nextPage.style.opacity =
            disabled ? "0.5" : "1";

        nextPage.style.cursor =
            disabled
                ? "not-allowed"
                : "pointer";
    }
}


// ===============================
// COUNTS
// ===============================

function updateCounts() {

    if (!footerText) return;

    const total =
        filteredItems.length;


    if (total === 0) {

        footerText.textContent =
            "No items found";

        return;
    }


    const start =
        (currentPage - 1) *
        itemsPerPage + 1;

    const end =
        Math.min(
            start + itemsPerPage - 1,
            total
        );


    footerText.textContent =
        `Showing ${start}-${end} of ${total} entries`;
}


// ===============================
// SEARCH / FILTER
// ===============================

function filterInventory() {

    const searchTerm =
        inventorySearch
            ? inventorySearch.value
                .toLowerCase()
                .trim()
            : "";


    filteredItems =
        inventoryItems.filter(function (item) {

            const name =
                String(item.name || "")
                    .toLowerCase();

            const category =
                String(item.category || "")
                    .toLowerCase();

            const supplier =
                String(item.supplier || "")
                    .toLowerCase();

            const id =
                String(item.id || "")
                    .toLowerCase();


            return (
                !searchTerm ||
                name.includes(searchTerm) ||
                category.includes(searchTerm) ||
                supplier.includes(searchTerm) ||
                id.includes(searchTerm)
            );
        });


    currentPage = 1;

    renderInventory();
}


// ===============================
// ITEM OPTIONS
// ===============================

function showItemOptions(id) {

    const item =
        inventoryItems.find(function (i) {

            return Number(i.id) === Number(id);

        });


    if (!item) {

        showNotification(
            "Item not found",
            "error"
        );

        return;
    }


    const action =
        prompt(
            `Options for ${item.name}:\n\n` +
            `1. View Details\n` +
            `2. Edit Stock\n` +
            `3. Update Status\n` +
            `4. Delete Item`
        );


    if (action === "1") {

        alert(
            `📦 Item Details\n\n` +
            `Name: ${item.name}\n` +
            `Category: ${item.category}\n` +
            `Stock: ${item.stock} ${item.unit}\n` +
            `Supplier: ${item.supplier}\n` +
            `Expiry: ${formatDate(item.expiry)}`
        );

    }

    else if (action === "2") {

        const newStock =
            prompt(
                "Enter new stock quantity:",
                item.stock
            );


        if (
            newStock !== null &&
            newStock.trim() !== "" &&
            !isNaN(Number(newStock)) &&
            Number(newStock) >= 0
        ) {

            updateBackendItem(
                id,
                {
                    stock: Number(newStock)
                }
            );

        } else {

            showNotification(
                "Invalid stock quantity",
                "error"
            );
        }
    }

    else if (action === "3") {

        const shouldUpdate =
            confirm(
                `Toggle alert status for "${item.name}"?`
            );


        if (shouldUpdate) {

            const alertVal =
                item.alert === "critical"
                    ? null
                    : "critical";

            const alertTxt =
                alertVal
                    ? "Critical Low"
                    : null;


            updateBackendItem(
                id,
                {
                    alert: alertVal,
                    alertText: alertTxt
                }
            );
        }
    }

    else if (action === "4") {

        const confirmed =
            confirm(
                `Are you sure you want to delete "${item.name}"?`
            );


        if (confirmed) {

            deleteBackendItem(id);
        }
    }
}


// ===============================
// UPDATE ITEM
// ===============================

function updateBackendItem(id, payload) {

    fetch(
        `/api/inventory/update/${id}/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(payload)
        }
    )
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "HTTP error: " +
                    response.status
                );
            }

            return response.json();
        })
        .then(function (data) {

            if (data.status === "success") {

                showNotification(
                    data.message ||
                    "Inventory updated successfully",
                    "success"
                );

                fetchInventoryData();

            } else {

                showNotification(
                    data.message ||
                    "Failed to update item",
                    "error"
                );
            }
        })
        .catch(function (error) {

            console.error(
                "Update error:",
                error
            );

            showNotification(
                "Server error while updating item",
                "error"
            );
        });
}


// ===============================
// DELETE ITEM
// ===============================

function deleteBackendItem(id) {

    fetch(
        `/api/inventory/delete/${id}/`,
        {
            method: "POST",

            headers: {
                "Accept": "application/json"
            }
        }
    )
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "HTTP error: " +
                    response.status
                );
            }

            return response.json();
        })
        .then(function (data) {

            if (data.status === "success") {

                showNotification(
                    data.message ||
                    "Item deleted successfully",
                    "warning"
                );

                fetchInventoryData();

            } else {

                showNotification(
                    data.message ||
                    "Failed to delete item",
                    "error"
                );
            }
        })
        .catch(function (error) {

            console.error(
                "Delete error:",
                error
            );

            showNotification(
                "Server error while deleting item",
                "error"
            );
        });
}


// ===============================
// ADD NEW SKU
// ===============================

function addNewSKU() {

    const name =
        prompt("Enter item name:");

    if (!name || !name.trim()) return;


    const category =
        prompt(
            "Enter category (Reagents/Tubes/Swabs):"
        );

    if (!category || !category.trim()) return;


    const stockInput =
        prompt("Enter stock quantity:");

    if (
        stockInput === null ||
        stockInput.trim() === ""
    ) {
        return;
    }


    const stock =
        Number(stockInput);


    if (
        !Number.isFinite(stock) ||
        stock < 0
    ) {

        showNotification(
            "Invalid stock quantity",
            "error"
        );

        return;
    }


    const unit =
        prompt(
            "Enter unit (e.g., Vials, Units, Boxes):"
        );

    if (!unit || !unit.trim()) return;


    const supplier =
        prompt("Enter supplier name:");

    if (!supplier || !supplier.trim()) return;


    const expiry =
        prompt(
            "Enter expiry date (YYYY-MM-DD):"
        );

    if (!expiry || !expiry.trim()) return;


    // Existing category mapping
    const categoryMap = {

        reagents: {
            icon: "science",
            iconClass: "reagents",
            categoryClass: "reagents"
        },

        tubes: {
            icon: "bloodtype",
            iconClass: "tubes",
            categoryClass: "tubes"
        },

        swabs: {
            icon: "sanitizer",
            iconClass: "swabs",
            categoryClass: "swabs"
        }
    };


    const catKey =
        category.trim().toLowerCase();


    const catConfig =
        categoryMap[catKey] ||
        categoryMap.reagents;


    const payload = {

        name: name.trim(),

        category: category.trim(),

        stock: stock,

        unit: unit.trim(),

        supplier: supplier.trim(),

        expiry: expiry.trim(),

        icon: catConfig.icon,

        iconClass: catConfig.iconClass,

        categoryClass:
            catConfig.categoryClass
    };


    fetch(
        "/api/inventory/add/",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(payload)
        }
    )
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "HTTP error: " +
                    response.status
                );
            }

            return response.json();
        })
        .then(function (data) {

            if (data.status === "success") {

                showNotification(
                    data.message ||
                    "Inventory item added successfully",
                    "success"
                );

                fetchInventoryData();

            } else {

                showNotification(
                    data.message ||
                    "Failed to add item",
                    "error"
                );
            }
        })
        .catch(function (error) {

            console.error(
                "Add SKU error:",
                error
            );

            showNotification(
                "Server connection error",
                "error"
            );
        });
}


// ===============================
// BARCODE SCANNER
// ===============================

function scanBarcode() {

    showNotification(
        "📷 Barcode scanner activated",
        "info"
    );


    setTimeout(function () {

        const randomSku =
            "SKU-" +
            String(
                Math.floor(
                    Math.random() * 90000
                ) + 10000
            );


        showNotification(
            `Scanned: ${randomSku}`,
            "success"
        );


        if (inventorySearch) {

            inventorySearch.value =
                randomSku;

            filterInventory();
        }

    }, 1500);
}


// ===============================
// EXPORT INVENTORY
// ===============================

function exportInventory() {

    if (!filteredItems.length) {

        showNotification(
            "No items to export",
            "warning"
        );

        return;
    }


    const headers = [
        "ID",
        "Name",
        "Category",
        "Stock",
        "Unit",
        "Supplier",
        "Expiry Date"
    ];


    const rows =
        filteredItems.map(function (item) {

            return [
                item.id,
                item.name,
                item.category,
                item.stock,
                item.unit,
                item.supplier,
                item.expiry
            ];
        });


    const csvRows = [

        headers.map(csvEscape).join(","),

        ...rows.map(function (row) {

            return row
                .map(csvEscape)
                .join(",");
        })
    ];


    const csv =
        csvRows.join("\n");


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


    const a =
        document.createElement("a");


    a.href = url;

    a.download =
        `inventory_${
            new Date()
                .toISOString()
                .split("T")[0]
        }.csv`;


    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);


    showNotification(
        "Inventory exported successfully!",
        "success"
    );
}


// ===============================
// CSV ESCAPE
// ===============================

function csvEscape(value) {

    if (value === null ||
        value === undefined) {
        return "";
    }


    const stringValue =
        String(value);


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


// ===============================
// DATE FORMAT
// ===============================

function formatDate(dateString) {

    if (!dateString) {
        return "N/A";
    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ===============================
// NOTIFICATION
// ===============================

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
        document.createElement("div");


    const colors = {

        success: "#16a34a",

        error: "#ba1a1a",

        warning: "#d97706",

        info: "#004ac6"
    };


    notification.className =
        "custom-notification";


    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${
            colors[type] || colors.success
        };
        color: white;
        border-radius: 12px;
        box-shadow:
            0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
        max-width: 400px;
        line-height: 1.6;
    `;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(function () {

        notification.style.opacity =
            "0";

        notification.style.transform =
            "translateX(100px)";

        notification.style.transition =
            "all 0.3s ease";


        setTimeout(function () {

            if (notification.parentNode) {

                notification.remove();
            }

        }, 300);

    }, 4000);
}


// ===============================
// EVENT LISTENERS
// ===============================

function setupEventListeners() {

    // Search
    if (inventorySearch) {

        let searchTimeout;


        inventorySearch.addEventListener(
            "input",
            function () {

                clearTimeout(
                    searchTimeout
                );


                searchTimeout =
                    setTimeout(
                        filterInventory,
                        300
                    );
            }
        );


        inventorySearch.addEventListener(
            "keydown",
            function (e) {

                if (e.key === "Enter") {

                    e.preventDefault();

                    filterInventory();
                }
            }
        );
    }


    // Previous
    if (prevPage) {

        prevPage.addEventListener(
            "click",
            function () {

                if (currentPage > 1) {

                    currentPage--;

                    renderInventory();
                }
            }
        );
    }


    // Next
    if (nextPage) {

        nextPage.addEventListener(
            "click",
            function () {

                const totalPages =
                    Math.ceil(
                        filteredItems.length /
                        itemsPerPage
                    );


                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderInventory();
                }
            }
        );
    }


    // Trend selector
    const trendSelect =
        document.getElementById(
            "trendPeriod"
        );


    if (trendSelect) {

        trendSelect.addEventListener(
            "change",
            function () {

                showNotification(
                    `Viewing ${this.value} data`,
                    "info"
                );
            }
        );
    }
}


// ===============================
// KEYBOARD SHORTCUTS
// ===============================

document.addEventListener(
    "keydown",
    function (e) {

        // Ctrl + D
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === "d"
        ) {

            e.preventDefault();

            toggleTheme();
        }


        // Ctrl + F
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === "f"
        ) {

            e.preventDefault();

            if (inventorySearch) {

                inventorySearch.focus();
            }
        }


        // Ctrl + N
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key.toLowerCase() === "n"
        ) {

            e.preventDefault();

            addNewSKU();
        }
    }
);


// ===============================
// HTML ESCAPE
// ===============================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// CONSOLE
// ===============================

console.log(
    "📦 Sita Path Lab - Inventory Management Connected with Django"
);


// ===============================
// MODULE EXPORT
// ===============================

if (
    typeof module !== "undefined" &&
    module.exports
) {

    module.exports = {

        toggleTheme,

        toggleSidebar,

        addNewSKU,

        scanBarcode,

        exportInventory,

        filterInventory,

        showItemOptions,

        updateBackendItem,

        deleteBackendItem,

        renderInventory,

        renderOrders,

        fetchInventoryData
    };
}