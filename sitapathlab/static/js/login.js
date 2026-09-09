
// ===============================
// DOM REFERENCES
// ===============================

const themeToggle = document.getElementById('themeToggle');
const themeToggleIcon = document.getElementById('themeToggleIcon');
const loginForm = document.getElementById('loginForm');
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');


// ===============================
// CSRF TOKEN HELPER
// ===============================

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}


// ===============================
// THEME TOGGLE
// ===============================

function toggleTheme() {
    document.body.classList.toggle('dark');

    const isDark = document.body.classList.contains('dark');

    localStorage.setItem(
        'theme',
        isDark ? 'dark' : 'light'
    );

    if (themeToggleIcon) {
        themeToggleIcon.textContent =
            isDark ? 'dark_mode' : 'light_mode';
    }
}


// ===============================
// LOAD SAVED THEME
// ===============================

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark');

        if (themeToggleIcon) {
            themeToggleIcon.textContent = 'dark_mode';
        }
    } else {
        document.body.classList.remove('dark');

        if (themeToggleIcon) {
            themeToggleIcon.textContent = 'light_mode';
        }
    }
}


// ===============================
// PASSWORD VISIBILITY
// ===============================

function togglePassword() {
    if (!passwordToggle || !passwordInput) {
        return;
    }

    const isPassword =
        passwordInput.type === 'password';

    passwordInput.type =
        isPassword ? 'text' : 'password';

    const icon =
        passwordToggle.querySelector(
            '.material-symbols-outlined'
        );

    if (icon) {
        icon.textContent =
            isPassword
                ? 'visibility'
                : 'visibility_off';
    }
}


// ===============================
// LOGIN
// ===============================

function handleLogin(event) {
    event.preventDefault();

    const emailInput =
        document.getElementById('email');

    const passwordInputEl =
        document.getElementById('password');

    if (!emailInput || !passwordInputEl) {
        return;
    }

    const email =
        emailInput.value.trim();

    const password =
        passwordInputEl.value.trim();


    // Email validation
    if (!email) {
        showNotification(
            'Please enter your email address',
            'error'
        );

        emailInput.focus();
        return;
    }


    // Password validation
    if (!password) {
        showNotification(
            'Please enter your password',
            'error'
        );

        passwordInputEl.focus();
        return;
    }


    const csrftoken =
        getCookie('csrftoken');


    // Send login request to Django
    fetch('/api/auth/login/', {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },

        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    .then(response => {

        if (!response.ok) {
            throw new Error(
                'Server returned an error'
            );
        }

        return response.json();
    })

    .then(data => {

        if (data.status === 'success') {

            showNotification(
                data.message || 'Login successful',
                'success'
            );

            setTimeout(() => {
                window.location.href =
                    '/dashboard/';
            }, 800);

        } else {

            showNotification(
                data.message || 'Login failed',
                'error'
            );
        }
    })

    .catch(error => {

        console.error(
            'Login error:',
            error
        );

        showNotification(
            'Server connection error. Please try again.',
            'error'
        );
    });
}


// ===============================
// BIOMETRIC LOGIN
// ===============================

function handleBiometric() {

    showNotification(
        'Biometric authentication initiated...',
        'info'
    );

    /*
     * Actual biometric authentication
     * should be connected here later
     * using WebAuthn / browser API.
     */
}


// ===============================
// SSO LOGIN
// ===============================

function handleSSO() {

    showNotification(
        'Redirecting to Single Sign-On...',
        'info'
    );

    /*
     * Actual SSO URL can be connected
     * here when the Django SSO endpoint
     * is available.
     */
}


// ===============================
// NOTIFICATION
// ===============================

function showNotification(
    message,
    type = 'success'
) {

    const existing =
        document.querySelector(
            '.custom-notification'
        );

    if (existing) {
        existing.remove();
    }

    const notification =
        document.createElement('div');

    notification.className =
        'custom-notification';

    notification.textContent =
        message;

    notification.dataset.type =
        type;

    document.body.appendChild(
        notification
    );

    setTimeout(() => {

        if (notification) {
            notification.remove();
        }

    }, 4000);
}


// ===============================
// FORM INPUT EVENTS
// ===============================

function setupInputEvents() {

    const inputs =
        document.querySelectorAll(
            '.form-input'
        );

    inputs.forEach(input => {

        input.addEventListener(
            'keydown',
            function(event) {

                if (event.key === 'Enter') {

                    const form =
                        this.closest('form');

                    if (form) {
                        form.requestSubmit();
                    }
                }
            }
        );
    });
}


// ===============================
// EVENT LISTENERS
// ===============================

function setupEventListeners() {

    // Theme
    if (themeToggle) {
        themeToggle.addEventListener(
            'click',
            toggleTheme
        );
    }


    // Password visibility
    if (passwordToggle) {
        passwordToggle.addEventListener(
            'click',
            togglePassword
        );
    }


    // Login form
    if (loginForm) {
        loginForm.addEventListener(
            'submit',
            handleLogin
        );
    }


    // Input events
    setupInputEvents();
}


// ===============================
// KEYBOARD SHORTCUTS
// ===============================

function setupKeyboardShortcuts() {

    document.addEventListener(
        'keydown',
        function(event) {

            // Ctrl + D / Cmd + D
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'd'
            ) {
                event.preventDefault();
                toggleTheme();
            }


            // Escape
            if (event.key === 'Escape') {

                if (
                    document.activeElement &&
                    typeof document.activeElement.blur ===
                    'function'
                ) {
                    document.activeElement.blur();
                }
            }
        }
    );
}


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener(
    'DOMContentLoaded',
    function() {

        loadSavedTheme();

        setupEventListeners();

        setupKeyboardShortcuts();

        console.log(
            'Sita Path Lab - Login Page Connected with Django'
        );
    }
);


// ===============================
// MODULE EXPORT
// ===============================

if (
    typeof module !== 'undefined' &&
    module.exports
) {
    module.exports = {
        getCookie,
        toggleTheme,
        loadSavedTheme,
        togglePassword,
        handleLogin,
        handleBiometric,
        handleSSO,
        showNotification
    };
}

