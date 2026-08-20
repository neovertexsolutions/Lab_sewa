/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN — PAYMENT SETTINGS
 * Production Frontend Controller
 * ============================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       DOM
       ======================================================== */

    const tabs = document.querySelectorAll(".settings-tab");
    const sections = document.querySelectorAll(".settings-section");

    const gatewayProvider = document.getElementById("gatewayProvider");
    const gatewayMode = document.getElementById("gatewayMode");

    const primaryGateway = document.getElementById("primaryGateway");
    const gatewayEnvironment = document.getElementById("gatewayEnvironment");

    const currency = document.getElementById("currency");
    const currencyDisplay = document.getElementById("currencyDisplay");

    const taxRate = document.getElementById("taxRate");
    const taxDisplay = document.getElementById("taxDisplay");

    const secretKey = document.getElementById("secretKey");
    const toggleSecret = document.getElementById("toggleSecret");

    const toastContainer = document.getElementById("toastContainer");


    /* ========================================================
       TAB SYSTEM
       ======================================================== */

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target = tab.dataset.section;

            if (!target) {
                return;
            }

            tabs.forEach(item => {
                item.classList.remove("active");
            });

            sections.forEach(section => {
                section.classList.remove("active");
            });

            tab.classList.add("active");

            const targetSection = document.getElementById(target);

            if (targetSection) {
                targetSection.classList.add("active");
            }

            updateUrlSection(target);
        });

    });


    /* ========================================================
       URL STATE
       ======================================================== */

    function updateUrlSection(section) {

        try {

            const url = new URL(window.location.href);

            url.searchParams.set("section", section);

            window.history.replaceState(
                {},
                "",
                url.toString()
            );

        } catch (error) {

            console.warn(
                "Unable to update URL section:",
                error
            );

        }

    }


    function loadUrlSection() {

        try {

            const params = new URLSearchParams(
                window.location.search
            );

            const section = params.get("section");

            if (!section) {
                return;
            }

            const targetTab = document.querySelector(
                `.settings-tab[data-section="${section}"]`
            );

            if (targetTab) {
                targetTab.click();
            }

        } catch (error) {

            console.warn(
                "Unable to read settings section:",
                error
            );

        }

    }

    loadUrlSection();


    /* ========================================================
       GATEWAY DISPLAY
       ======================================================== */

    if (gatewayProvider) {

        gatewayProvider.addEventListener("change", () => {

            const selected =
                gatewayProvider.options[
                    gatewayProvider.selectedIndex
                ];

            if (primaryGateway) {
                primaryGateway.textContent =
                    selected.textContent.trim();
            }

        });

    }


    if (gatewayMode) {

        gatewayMode.addEventListener("change", () => {

            if (!gatewayEnvironment) {
                return;
            }

            gatewayEnvironment.textContent =
                gatewayMode.value === "live"
                    ? "Live Environment"
                    : "Test / Sandbox Environment";

        });

    }


    /* ========================================================
       CURRENCY DISPLAY
       ======================================================== */

    if (currency) {

        currency.addEventListener("change", () => {

            const selected =
                currency.options[
                    currency.selectedIndex
                ];

            const text =
                selected.textContent
                    .replace(/\s+/g, " ")
                    .trim();

            const parts = text.split("—");

            if (currencyDisplay) {

                currencyDisplay.textContent =
                    parts.length > 1
                        ? `${parts[0].trim()}`
                        : currency.value;

            }

        });

    }


    /* ========================================================
       TAX DISPLAY
       ======================================================== */

    if (taxRate) {

        taxRate.addEventListener("input", () => {

            let value = Number(taxRate.value);

            if (Number.isNaN(value)) {
                value = 0;
            }

            value = Math.max(
                0,
                Math.min(100, value)
            );

            taxRate.value = value;

            if (taxDisplay) {
                taxDisplay.textContent = `${value}%`;
            }

        });

    }


    /* ========================================================
       SHOW / HIDE SECRET
       ======================================================== */

    if (toggleSecret && secretKey) {

        toggleSecret.addEventListener("click", () => {

            const isPassword =
                secretKey.type === "password";

            secretKey.type =
                isPassword
                    ? "text"
                    : "password";

            toggleSecret.innerHTML =
                isPassword
                    ? '<i class="fa-regular fa-eye-slash"></i>'
                    : '<i class="fa-regular fa-eye"></i>';

        });

    }


    /* ========================================================
       COPY BUTTONS
       ======================================================== */

    document.querySelectorAll(
        "[data-copy]"
    ).forEach(button => {

        button.addEventListener("click", async () => {

            const targetId =
                button.dataset.copy;

            const target =
                document.getElementById(targetId);

            if (!target) {
                return;
            }

            let value = "";

            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement
            ) {

                value = target.value;

            } else {

                value = target.textContent.trim();

            }

            if (!value) {

                showToast(
                    "Nothing to copy.",
                    "warning"
                );

                return;
            }

            try {

                await navigator.clipboard.writeText(
                    value
                );

                showToast(
                    "Copied to clipboard.",
                    "success"
                );

            } catch (error) {

                showToast(
                    "Unable to copy content.",
                    "error"
                );

            }

        });

    });


    /* ========================================================
       SAVE BUTTONS
       ======================================================== */

    document.querySelectorAll(
        "[data-save]"
    ).forEach(button => {

        button.addEventListener("click", async () => {

            const section =
                button.dataset.save;

            const originalHTML =
                button.innerHTML;

            button.disabled = true;

            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {

                const payload =
                    collectSectionData(section);

                /*
                 * Production:
                 *
                 * Replace this simulated request with:
                 *
                 * fetch("/superadmin/api/payment-settings/", {
                 *     method: "POST",
                 *     headers: {
                 *         "Content-Type": "application/json",
                 *         "X-CSRFToken": getCSRFToken()
                 *     },
                 *     body: JSON.stringify(payload)
                 * })
                 */

                await simulateRequest(payload);

                showToast(
                    `${formatSectionName(section)} settings saved successfully.`,
                    "success"
                );

            } catch (error) {

                console.error(
                    "Payment settings save error:",
                    error
                );

                showToast(
                    "Unable to save settings.",
                    "error"
                );

            } finally {

                button.disabled = false;

                button.innerHTML =
                    originalHTML;

            }

        });

    });


    /* ========================================================
       TEST GATEWAY
       ======================================================== */

    const testGateway =
        document.getElementById("testGateway");

    if (testGateway) {

        testGateway.addEventListener(
            "click",
            async () => {

                const originalHTML =
                    testGateway.innerHTML;

                testGateway.disabled = true;

                testGateway.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';

                try {

                    /*
                     * Production API example:
                     *
                     * await fetch(
                     *     "/superadmin/api/payment-settings/test-gateway/",
                     *     {
                     *         method: "POST",
                     *         headers: {
                     *             "X-CSRFToken": getCSRFToken()
                     *         }
                     *     }
                     * );
                     */

                    await simulateRequest();

                    showToast(
                        "Gateway connection test successful.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        "Gateway connection test failed.",
                        "error"
                    );

                } finally {

                    testGateway.disabled = false;

                    testGateway.innerHTML =
                        originalHTML;

                }

            }
        );

    }


    /* ========================================================
       TEST WEBHOOK
       ======================================================== */

    const testWebhook =
        document.getElementById("testWebhook");

    if (testWebhook) {

        testWebhook.addEventListener(
            "click",
            async () => {

                const originalHTML =
                    testWebhook.innerHTML;

                testWebhook.disabled = true;

                testWebhook.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

                try {

                    /*
                     * Production:
                     *
                     * POST /superadmin/api/payment-settings/test-webhook/
                     */

                    await simulateRequest();

                    showToast(
                        "Test webhook event sent successfully.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        "Unable to send webhook event.",
                        "error"
                    );

                } finally {

                    testWebhook.disabled = false;

                    testWebhook.innerHTML =
                        originalHTML;

                }

            }
        );

    }


    /* ========================================================
       RESET
       ======================================================== */

    document.querySelectorAll(
        "[data-reset]"
    ).forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.dataset.reset;

            const confirmed =
                window.confirm(
                    "Reset this section to its default values?"
                );

            if (!confirmed) {
                return;
            }

            resetSection(section);

            showToast(
                "Settings reset successfully.",
                "success"
            );

        });

    });


    /* ========================================================
       COLLECT DATA
       ======================================================== */

    function collectSectionData(section) {

        switch (section) {

            case "gateway":

                return {
                    provider:
                        gatewayProvider?.value || null,

                    mode:
                        gatewayMode?.value || null,

                    public_key:
                        document.getElementById(
                            "publicKey"
                        )?.value || "",

                    /*
                     * IMPORTANT:
                     * Never send/store secret keys
                     * in localStorage.
                     *
                     * Send them only through
                     * HTTPS to the backend.
                     */

                    secret_key:
                        secretKey?.value || ""
                };


            case "currency":

                return {

                    currency:
                        currency?.value || "INR",

                    tax_type:
                        document.getElementById(
                            "taxType"
                        )?.value || "gst",

                    tax_rate:
                        Number(
                            taxRate?.value || 0
                        ),

                    tax_number:
                        document.getElementById(
                            "taxNumber"
                        )?.value || ""

                };


            case "methods":

                return {

                    upi:
                        getChecked("methodUpi"),

                    card:
                        getChecked("methodCard"),

                    bank:
                        getChecked("methodBank"),

                    wallet:
                        getChecked("methodWallet"),

                    cash:
                        getChecked("methodCash")

                };


            case "invoice":

                return {

                    prefix:
                        document.getElementById(
                            "invoicePrefix"
                        )?.value || "",

                    starting_number:
                        Number(
                            document.getElementById(
                                "invoiceStart"
                            )?.value || 1
                        ),

                    footer_note:
                        document.getElementById(
                            "invoiceNote"
                        )?.value || "",

                    auto_invoice:
                        getChecked("autoInvoice"),

                    email_invoice:
                        getChecked("invoiceEmail")

                };


            case "webhook":

                return {

                    enabled: true,

                    endpoint:
                        document.getElementById(
                            "webhookUrl"
                        )?.textContent.trim() || ""

                };


            default:

                return {};

        }

    }


    /* ========================================================
       RESET SECTION
       ======================================================== */

    function resetSection(section) {

        if (section === "currency") {

            if (currency) {
                currency.value = "INR";
                currency.dispatchEvent(
                    new Event("change")
                );
            }

            if (taxRate) {
                taxRate.value = 18;
                taxRate.dispatchEvent(
                    new Event("input")
                );
            }

            const taxNumber =
                document.getElementById(
                    "taxNumber"
                );

            if (taxNumber) {
                taxNumber.value = "";
            }

        }

    }


    /* ========================================================
       HELPERS
       ======================================================== */

    function getChecked(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.checked
            : false;

    }


    function formatSectionName(section) {

        return section
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    function showToast(
        message,
        type = "success"
    ) {

        if (!toastContainer) {
            return;
        }

        const toast =
            document.createElement("div");

        toast.className =
            `toast ${type}`;

        const iconMap = {

            success:
                "fa-circle-check",

            error:
                "fa-circle-xmark",

            warning:
                "fa-triangle-exclamation"

        };

        const icon =
            iconMap[type] ||
            iconMap.success;

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${escapeHTML(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform =
                "translateX(15px)";

            setTimeout(() => {
                toast.remove();
            }, 250);

        }, 3000);

    }


    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value);

        return div.innerHTML;

    }


    function simulateRequest(data = {}) {

        return new Promise(resolve => {

            console.debug(
                "Payment settings payload:",
                data
            );

            setTimeout(
                resolve,
                650
            );

        });

    }

});