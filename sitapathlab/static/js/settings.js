/**
 * ============================================================
 * SITA PATH LAB
 * PRODUCTION SETTINGS MODULE
 * ============================================================
 *
 * Connected APIs:
 *
 * GET  /api/settings/
 * POST /api/settings/update/
 * POST /api/settings/backup/
 * POST /api/settings/api-key/
 *
 * ============================================================
 */

(function () {

    "use strict";

    // =========================================================
    // CONFIG
    // =========================================================

    const API = {
        settings: "/api/settings/",
        update: "/api/settings/update/",
        backup: "/api/settings/backup/",
        apiKey: "/api/settings/api-key/",
        csrf: "/api/csrf/"
    };


    const STORAGE = {
        theme: "sita_path_lab_theme",
        primaryColor: "sita_path_lab_primary_color"
    };


    const DEFAULTS = {
        theme: "light",
        primaryColor: "#004ac6"
    };


    let currentSettings = null;
    let csrfToken = null;
    let isSaving = false;
    let isBackingUp = false;


    // =========================================================
    // DOM READY
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            try {

                initTabs();
                initSidebar();
                initTheme();
                initColorPicker();
                initForms();
                initResetButtons();
                initBackup();
                initRestore();
                initCommunication();
                initKeyboardShortcuts();

                await loadCSRF();
                await loadSettings();

                console.log(
                    "Sita Path Lab Settings initialized."
                );

            } catch (error) {

                console.error(
                    "Settings initialization failed:",
                    error
                );

                showNotification(
                    "Unable to initialize settings.",
                    "error"
                );
            }

        }
    );


    // =========================================================
    // CSRF
    // =========================================================

    async function loadCSRF() {

        try {

            const response = await fetch(
                API.csrf,
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            csrfToken =
                data.csrfToken ||
                data.csrf_token ||
                getCookie("csrftoken") ||
                null;

        } catch (error) {

            csrfToken =
                getCookie("csrftoken") ||
                null;

        }

    }


    function getCookie(name) {

        const cookies =
            document.cookie.split(";");

        for (const cookie of cookies) {

            const parts =
                cookie.trim().split("=");

            if (parts[0] === name) {

                return decodeURIComponent(
                    parts.slice(1).join("=")
                );

            }

        }

        return null;
    }


    // =========================================================
    // API REQUEST HELPER
    // =========================================================

    async function apiRequest(
        url,
        options = {}
    ) {

        const headers = {
            "Accept": "application/json",
            ...(options.headers || {})
        };


        if (
            options.body &&
            typeof options.body !== "string"
        ) {

            headers["Content-Type"] =
                "application/json";

            options.body =
                JSON.stringify(
                    options.body
                );
        }


        const token =
            csrfToken ||
            getCookie("csrftoken");


        if (token) {

            headers["X-CSRFToken"] =
                token;

        }


        const response = await fetch(
            url,
            {
                credentials: "same-origin",
                ...options,
                headers
            }
        );


        let data = null;

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


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

            throw new Error(
                data.message ||
                `Request failed (${response.status})`
            );

        }


        if (
            data.status &&
            data.status !== "success"
        ) {

            throw new Error(
                data.message ||
                "Request failed."
            );

        }


        return data;
    }


    // =========================================================
    // LOAD SETTINGS
    // =========================================================

    async function loadSettings() {

        try {

            const result =
                await apiRequest(
                    API.settings,
                    {
                        method: "GET"
                    }
                );


            currentSettings =
                result.settings ||
                {};


            populateSettings(
                currentSettings
            );


            applyTheme(
                currentSettings.systemTheme ||
                DEFAULTS.theme
            );


            applyPrimaryColor(
                currentSettings.primaryColor ||
                DEFAULTS.primaryColor
            );


        } catch (error) {

            console.error(
                "Load settings failed:",
                error
            );

            showNotification(
                error.message ||
                "Unable to load settings.",
                "error"
            );

        }

    }


    // =========================================================
    // POPULATE SETTINGS
    // =========================================================

    function populateSettings(data) {

        if (!data) return;


        // -----------------------------------------------------
        // Hospital
        // -----------------------------------------------------

        setValue(
            [
                'input[name="lab_name"]',
                "#labName",
                "#lab-name"
            ],
            data.labName
        );


        setValue(
            [
                'input[name="contact_number"]',
                "#contactNumber",
                "#contact-number"
            ],
            data.contactNumber
        );


        setValue(
            [
                'textarea[name="address"]',
                "#address",
                "#labAddress"
            ],
            data.address
        );


        // -----------------------------------------------------
        // Branding
        // -----------------------------------------------------

        setValue(
            [
                'input[name="primary_color"]',
                "#primaryColor",
                "#primary-color"
            ],
            data.primaryColor
        );


        setSelectValue(
            [
                'select[name="system_theme"]',
                "#systemTheme",
                "#themeSelect"
            ],
            data.systemTheme
        );


        // -----------------------------------------------------
        // SMTP
        // -----------------------------------------------------

        setValue(
            [
                'input[name="smtp_host"]',
                "#smtpHost"
            ],
            data.smtpHost
        );


        setValue(
            [
                'input[name="smtp_port"]',
                "#smtpPort"
            ],
            data.smtpPort
        );


        setValue(
            [
                'input[name="smtp_email"]',
                "#smtpEmail"
            ],
            data.smtpEmail
        );


        // -----------------------------------------------------
        // Backup
        // -----------------------------------------------------

        setSelectValue(
            [
                'select[name="backup_frequency"]',
                "#backupFrequency"
            ],
            data.backupFrequency
        );

    }


    // =========================================================
    // SET VALUE
    // =========================================================

    function setValue(
        selectors,
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {
            return;
        }


        for (const selector of selectors) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                element.value =
                    value;

                return;

            }

        }

    }


    function setSelectValue(
        selectors,
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {
            return;
        }


        for (const selector of selectors) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                element.value =
                    value;

                return;

            }

        }

    }


    // =========================================================
    // GET VALUE
    // =========================================================

    function getValue(
        selectors
    ) {

        for (const selector of selectors) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                return element.value.trim();

            }

        }

        return "";

    }


    // =========================================================
    // SAVE SETTINGS
    // =========================================================

    async function saveSettings(
        section = "Hospital Info"
    ) {

        if (isSaving) {
            return;
        }


        isSaving = true;


        const buttons =
            getSaveButtons();


        setButtonsLoading(
            buttons,
            true
        );


        try {

            const payload = {

                labName:
                    getValue([
                        'input[name="lab_name"]',
                        "#labName",
                        "#lab-name"
                    ]),


                contactNumber:
                    getValue([
                        'input[name="contact_number"]',
                        "#contactNumber",
                        "#contact-number"
                    ]),


                address:
                    getValue([
                        'textarea[name="address"]',
                        "#address",
                        "#labAddress"
                    ]),


                primaryColor:
                    getValue([
                        'input[name="primary_color"]',
                        "#primaryColor",
                        "#primary-color"
                    ]) ||
                    getCurrentPrimaryColor(),


                systemTheme:
                    getValue([
                        'select[name="system_theme"]',
                        "#systemTheme",
                        "#themeSelect"
                    ]) ||
                    getCurrentTheme(),


                smtpHost:
                    getValue([
                        'input[name="smtp_host"]',
                        "#smtpHost"
                    ]),


                smtpPort:
                    getValue([
                        'input[name="smtp_port"]',
                        "#smtpPort"
                    ]) || 587,


                smtpEmail:
                    getValue([
                        'input[name="smtp_email"]',
                        "#smtpEmail"
                    ]),


                backupFrequency:
                    getValue([
                        'select[name="backup_frequency"]',
                        "#backupFrequency"
                    ]) || "daily"

            };


            // -------------------------------------------------
            // Validation
            // -------------------------------------------------

            if (
                payload.labName &&
                payload.labName.length < 2
            ) {

                throw new Error(
                    "Laboratory name is too short."
                );

            }


            if (
                payload.smtpPort &&
                (
                    Number(payload.smtpPort) < 1 ||
                    Number(payload.smtpPort) > 65535
                )
            ) {

                throw new Error(
                    "SMTP port must be between 1 and 65535."
                );

            }


            // -------------------------------------------------
            // API
            // -------------------------------------------------

            const result =
                await apiRequest(
                    API.update,
                    {
                        method: "POST",
                        body: payload
                    }
                );


            currentSettings =
                result.settings ||
                {
                    ...currentSettings,
                    ...payload
                };


            // -------------------------------------------------
            // Apply immediately
            // -------------------------------------------------

            if (payload.primaryColor) {

                applyPrimaryColor(
                    payload.primaryColor
                );

            }


            if (payload.systemTheme) {

                applyTheme(
                    payload.systemTheme
                );

            }


            showNotification(
                result.message ||
                `${section} saved successfully.`,
                "success"
            );


        } catch (error) {

            console.error(
                "Save settings error:",
                error
            );


            showNotification(
                error.message ||
                "Unable to save settings.",
                "error"
            );

        } finally {

            isSaving = false;


            setButtonsLoading(
                buttons,
                false
            );

        }

    }


    window.saveSettings =
        saveSettings;


    // =========================================================
    // SAVE BUTTONS
    // =========================================================

    function getSaveButtons() {

        return Array.from(
            document.querySelectorAll(
                ".btn-primary"
            )
        ).filter(
            button =>
                /save|apply/i.test(
                    button.textContent
                )
        );

    }


    function setButtonsLoading(
        buttons,
        loading
    ) {

        buttons.forEach(
            function (button) {

                if (loading) {

                    if (
                        !button.dataset.originalHtml
                    ) {

                        button.dataset.originalHtml =
                            button.innerHTML;

                    }


                    button.disabled =
                        true;


                    button.innerHTML = `
                        <span class="material-symbols-outlined">
                            sync
                        </span>
                        Saving...
                    `;

                } else {

                    button.disabled =
                        false;


                    if (
                        button.dataset.originalHtml
                    ) {

                        button.innerHTML =
                            button.dataset.originalHtml;

                    }

                }

            }
        );

    }


    // =========================================================
    // TABS
    // =========================================================

    function initTabs() {

        const tabButtons =
            document.querySelectorAll(
                ".tab-btn"
            );


        tabButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                        const tabId =
                            button.dataset.tab;

                        if (!tabId) {
                            return;
                        }

                        switchTab(
                            tabId
                        );

                    }
                );

            }
        );


        const activeButton =
            document.querySelector(
                ".tab-btn.active"
            );


        switchTab(
            activeButton?.dataset.tab ||
            "hospital"
        );

    }


    function switchTab(tabId) {

        const buttons =
            document.querySelectorAll(
                ".tab-btn"
            );


        const panels =
            document.querySelectorAll(
                ".tab-panel"
            );


        const target =
            document.getElementById(
                "panel-" + tabId
            );


        if (!target) {

            console.warn(
                "Settings panel not found:",
                tabId
            );

            return;

        }


        // -----------------------------------------------------
        // Buttons
        // -----------------------------------------------------

        buttons.forEach(
            function (button) {

                const active =
                    button.dataset.tab ===
                    tabId;


                button.classList.toggle(
                    "active",
                    active
                );


                button.setAttribute(
                    "aria-selected",
                    active
                        ? "true"
                        : "false"
                );

            }
        );


        // -----------------------------------------------------
        // Panels
        // -----------------------------------------------------

        panels.forEach(
            function (panel) {

                panel.classList.remove(
                    "active"
                );


                // IMPORTANT:
                // Your HTML currently uses .hidden
                panel.classList.add(
                    "hidden"
                );


                panel.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );


        target.classList.remove(
            "hidden"
        );


        target.classList.add(
            "active"
        );


        target.setAttribute(
            "aria-hidden",
            "false"
        );


        // -----------------------------------------------------
        // Load section-specific data if required
        // -----------------------------------------------------

        if (
            tabId === "database"
        ) {

            loadBackupSettings();

        }


        if (
            tabId === "comm"
        ) {

            initCommunication();

        }


        // -----------------------------------------------------
        // Mobile scroll
        // -----------------------------------------------------

        const main =
            document.querySelector(
                ".main-content"
            );


        if (
            main &&
            window.innerWidth < 768
        ) {

            main.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

    }


    window.switchTab =
        switchTab;


    // =========================================================
    // THEME
    // =========================================================

    function initTheme() {

        const saved =
            localStorage.getItem(
                STORAGE.theme
            );


        if (saved) {

            applyTheme(
                saved
            );

        }

    }


    function applyTheme(theme) {

        if (
            theme !== "light" &&
            theme !== "dark"
        ) {

            theme = "light";

        }


        document.body.classList.toggle(
            "dark",
            theme === "dark"
        );


        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        localStorage.setItem(
            STORAGE.theme,
            theme
        );


        updateThemeControls(
            theme
        );

    }


    function getCurrentTheme() {

        return document.body.classList.contains(
            "dark"
        )
            ? "dark"
            : "light";

    }


    function updateThemeControls(
        theme
    ) {

        const selects =
            document.querySelectorAll(
                'select[name="system_theme"], #systemTheme, #themeSelect'
            );


        selects.forEach(
            select =>
                select.value = theme
        );

    }


    function toggleTheme() {

        const next =
            getCurrentTheme() === "dark"
                ? "light"
                : "dark";


        applyTheme(
            next
        );


        showNotification(
            `Theme changed to ${next}.`,
            "success"
        );

    }


    window.toggleTheme =
        toggleTheme;


    // =========================================================
    // PRIMARY COLOR
    // =========================================================

    function initColorPicker() {

        const inputs =
            document.querySelectorAll(
                'input[type="color"], [data-color-picker]'
            );


        inputs.forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    function () {

                        applyPrimaryColor(
                            input.value
                        );

                    }
                );

            }
        );

    }


    function applyPrimaryColor(
        color
    ) {

        if (!color) {
            return;
        }


        document.documentElement
            .style
            .setProperty(
                "--primary",
                color
            );


        document.documentElement
            .style
            .setProperty(
                "--primary-color",
                color
            );


        document.documentElement
            .style
            .setProperty(
                "--brand-primary",
                color
            );


        localStorage.setItem(
            STORAGE.primaryColor,
            color
        );


        const inputs =
            document.querySelectorAll(
                'input[type="color"], [data-color-picker]'
            );


        inputs.forEach(
            input => {

                try {
                    input.value =
                        color;
                } catch (_) {}

            }
        );

    }


    function getCurrentPrimaryColor() {

        return (
            localStorage.getItem(
                STORAGE.primaryColor
            ) ||
            DEFAULTS.primaryColor
        );

    }


    // =========================================================
    // FORMS
    // =========================================================

    function initForms() {

        // Existing inline onclick compatibility
        // saveSettings('Hospital Info') works.


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() === "s"
                ) {

                    event.preventDefault();

                    saveSettings(
                        "Current Settings"
                    );

                }

            }
        );

    }


    // =========================================================
    // RESET DEFAULTS
    // =========================================================

    function initResetButtons() {

        const buttons =
            document.querySelectorAll(
                ".btn-outline"
            );


        buttons.forEach(
            function (button) {

                if (
                    button.dataset.resetBound
                ) {
                    return;
                }


                if (
                    button.textContent
                        .trim()
                        .toLowerCase()
                        .includes("reset")
                ) {

                    button.dataset.resetBound =
                        "true";


                    button.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();

                            resetDefaults();

                        }
                    );

                }

            }
        );

    }


    function resetDefaults() {

        const confirmed =
            window.confirm(
                "Reset Theme & Branding to default settings?"
            );


        if (!confirmed) {
            return;
        }


        applyTheme(
            DEFAULTS.theme
        );


        applyPrimaryColor(
            DEFAULTS.primaryColor
        );


        showNotification(
            "Default theme and branding restored.",
            "success"
        );

    }


    // =========================================================
    // COMMUNICATION
    // =========================================================

    function initCommunication() {

        const buttons =
            document.querySelectorAll(
                "button"
            );


        buttons.forEach(
            function (button) {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        "configure"
                    ) &&
                    !button.dataset.communicationBound
                ) {

                    button.dataset.communicationBound =
                        "true";


                    button.addEventListener(
                        "click",
                        configureIntegration
                    );

                }

            }
        );

    }


    function configureIntegration() {

        const commTab =
            document.querySelector(
                '[data-tab="comm"]'
            );


        if (commTab) {

            switchTab(
                "comm"
            );

        }


        showNotification(
            "Communication settings opened.",
            "info"
        );

    }


    window.configureIntegration =
        configureIntegration;


    // =========================================================
    // BACKUP
    // =========================================================

    function initBackup() {

        const buttons =
            document.querySelectorAll(
                "button"
            );


        buttons.forEach(
            function (button) {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        "start manual backup"
                    ) &&
                    !button.dataset.backupBound
                ) {

                    button.dataset.backupBound =
                        "true";


                    button.addEventListener(
                        "click",
                        startBackup
                    );

                }

            }
        );

    }


    async function startBackup() {

        if (isBackingUp) {
            return;
        }


        const button =
            findButtonByText(
                "start manual backup"
            );


        if (!button) {

            showNotification(
                "Backup button not found.",
                "error"
            );

            return;

        }


        const originalHTML =
            button.innerHTML;


        const confirmed =
            window.confirm(
                "Create a database backup now?"
            );


        if (!confirmed) {
            return;
        }


        isBackingUp = true;


        button.disabled =
            true;


        button.innerHTML = `
            <span class="material-symbols-outlined">
                sync
            </span>
            Creating Backup...
        `;


        try {

            const result =
                await apiRequest(
                    API.backup,
                    {
                        method: "POST",
                        body: {}
                    }
                );


            showNotification(
                result.message ||
                "Backup request accepted.",
                "success"
            );


        } catch (error) {

            console.error(
                "Backup error:",
                error
            );


            showNotification(
                error.message ||
                "Backup failed.",
                "error"
            );

        } finally {

            isBackingUp =
                false;


            button.disabled =
                false;


            button.innerHTML =
                originalHTML;

        }

    }


    window.startBackup =
        startBackup;


    // =========================================================
    // LOAD BACKUP SETTINGS
    // =========================================================

    function loadBackupSettings() {

        const frequency =
            currentSettings?.backupFrequency;


        if (!frequency) {
            return;
        }


        setSelectValue(
            [
                'select[name="backup_frequency"]',
                "#backupFrequency"
            ],
            frequency
        );

    }


    // =========================================================
    // RESTORE
    // =========================================================

    function initRestore() {

        const buttons =
            document.querySelectorAll(
                "button"
            );


        buttons.forEach(
            function (button) {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();


                if (
                    (
                        text.includes(
                            "restore"
                        ) ||
                        button.classList.contains(
                            "warning-btn"
                        )
                    ) &&
                    !button.dataset.restoreBound
                ) {

                    button.dataset.restoreBound =
                        "true";


                    button.addEventListener(
                        "click",
                        restoreBackup
                    );

                }

            }
        );

    }


    async function restoreBackup() {

        const confirmed =
            window.confirm(
                "WARNING: Restoring a backup may overwrite current data. Continue?"
            );


        if (!confirmed) {
            return;
        }


        showNotification(
            "Restore requires a selected backup file.",
            "warning"
        );

    }


    window.restoreBackup =
        restoreBackup;


    // =========================================================
    // API KEY
    // =========================================================

    async function generateApiKey() {

        try {

            const result =
                await apiRequest(
                    API.apiKey,
                    {
                        method: "POST",
                        body: {
                            action: "generate"
                        }
                    }
                );


            if (
                result.api_key
            ) {

                copyToClipboard(
                    result.api_key
                );


                showNotification(
                    "API key generated and copied to clipboard.",
                    "success"
                );


                displayApiKey(
                    result.api_key
                );

            }

        } catch (error) {

            showNotification(
                error.message ||
                "Unable to generate API key.",
                "error"
            );

        }

    }


    async function revokeApiKey() {

        const confirmed =
            window.confirm(
                "Are you sure you want to revoke the API key?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const result =
                await apiRequest(
                    API.apiKey,
                    {
                        method: "POST",
                        body: {
                            action: "revoke"
                        }
                    }
                );


            displayApiKey(
                ""
            );


            showNotification(
                result.message ||
                "API key revoked.",
                "success"
            );

        } catch (error) {

            showNotification(
                error.message ||
                "Unable to revoke API key.",
                "error"
            );

        }

    }


    function displayApiKey(
        key
    ) {

        const elements =
            document.querySelectorAll(
                '[data-api-key], #apiKey, input[name="api_key"]'
            );


        elements.forEach(
            function (element) {

                element.value =
                    key || "";

            }
        );

    }


    window.generateApiKey =
        generateApiKey;


    window.revokeApiKey =
        revokeApiKey;


    // =========================================================
    // SIDEBAR
    // =========================================================

    function initSidebar() {

        const sidebar =
            document.getElementById(
                "sidebar"
            );


        const menuButton =
            document.querySelector(
                ".menu-btn"
            );


        if (
            !sidebar ||
            !menuButton
        ) {

            return;

        }


        menuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                toggleSidebar();

            }
        );


        document.addEventListener(
            "click",
            function (event) {

                if (
                    window.innerWidth >= 1024
                ) {
                    return;
                }


                if (
                    !sidebar.classList.contains(
                        "sidenav-open"
                    )
                ) {
                    return;
                }


                if (
                    !sidebar.contains(
                        event.target
                    ) &&
                    !menuButton.contains(
                        event.target
                    )
                ) {

                    closeSidebar();

                }

            }
        );


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeSidebar();

                }

            }
        );

    }


    function toggleSidebar() {

        const sidebar =
            document.getElementById(
                "sidebar"
            );


        if (!sidebar) {
            return;
        }


        sidebar.classList.toggle(
            "sidenav-open"
        );

    }


    function closeSidebar() {

        const sidebar =
            document.getElementById(
                "sidebar"
            );


        if (!sidebar) {
            return;
        }


        sidebar.classList.remove(
            "sidenav-open"
        );

    }


    window.toggleSidebar =
        toggleSidebar;


    window.closeSidebar =
        closeSidebar;


    // =========================================================
    // KEYBOARD SHORTCUTS
    // =========================================================

    function initKeyboardShortcuts() {

        document.addEventListener(
            "keydown",
            function (event) {

                // Ctrl + S
                if (
                    event.ctrlKey &&
                    event.key.toLowerCase() === "s"
                ) {

                    event.preventDefault();

                    saveSettings(
                        "Current Settings"
                    );

                }


                // Escape
                if (
                    event.key === "Escape"
                ) {

                    const notification =
                        document.querySelector(
                            ".custom-notification"
                        );


                    if (notification) {

                        notification.remove();

                    }

                }

            }
        );

    }


    // =========================================================
    // FIND BUTTON
    // =========================================================

    function findButtonByText(
        text
    ) {

        const buttons =
            document.querySelectorAll(
                "button"
            );


        const target =
            text.toLowerCase();


        for (
            const button
            of buttons
        ) {

            if (
                button.textContent
                    .trim()
                    .toLowerCase()
                    .includes(target)
            ) {

                return button;

            }

        }


        return null;

    }


    // =========================================================
    // CLIPBOARD
    // =========================================================

    async function copyToClipboard(
        text
    ) {

        if (!text) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                text
            );

        } catch (error) {

            console.warn(
                "Clipboard unavailable:",
                error
            );

        }

    }


    // =========================================================
    // NOTIFICATION
    // =========================================================

    function showNotification(
        message,
        type = "success"
    ) {

        const old =
            document.querySelector(
                ".custom-notification"
            );


        if (old) {
            old.remove();
        }


        const icons = {

            success:
                "check_circle",

            error:
                "error",

            warning:
                "warning",

            info:
                "info"

        };


        const notification =
            document.createElement(
                "div"
            );


        notification.className =
            "custom-notification";


        notification.innerHTML = `

            <span class="material-symbols-outlined">
                ${
                    icons[type] ||
                    icons.info
                }
            </span>

            <span class="notification-message">
                ${escapeHTML(message)}
            </span>

            <button
                type="button"
                class="notification-close"
                aria-label="Close"
            >
                ×
            </button>

        `;


        const background = {

            success:
                "#16a34a",

            error:
                "#dc2626",

            warning:
                "#d97706",

            info:
                "#2563eb"

        };


        notification.style.cssText = `

            position: fixed;

            top: 80px;

            right: 20px;

            z-index: 99999;

            display: flex;

            align-items: center;

            gap: 10px;

            min-width: 280px;

            max-width: 440px;

            padding: 14px 16px;

            background:
                ${background[type] || background.info};

            color: #ffffff;

            border-radius: 12px;

            box-shadow:
                0 15px 40px rgba(0,0,0,.22);

            font-size: 14px;

            font-weight: 600;

        `;


        document.body.appendChild(
            notification
        );


        const close =
            notification.querySelector(
                ".notification-close"
            );


        close.addEventListener(
            "click",
            function () {

                notification.remove();

            }
        );


        setTimeout(
            function () {

                if (
                    notification.isConnected
                ) {

                    notification.remove();

                }

            },
            5000
        );

    }


    window.showNotification =
        showNotification;


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(
                value ?? ""
            );


        return div.innerHTML;

    }


})();