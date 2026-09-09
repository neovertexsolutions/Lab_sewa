/**
 * ============================================================
 * SITA PATH LAB
 * SUPER ADMIN LOGIN
 *
 * Production Authentication UI Controller
 * ============================================================
 */

"use strict";


/* ============================================================
   STATE
============================================================ */

const LoginState = {

    isSubmitting: false,

    passwordVisible: false,

    rememberMe: false

};


/* ============================================================
   DOM
============================================================ */

const LoginDOM = {};


function cacheDOM() {

    LoginDOM.form =
        document.getElementById("loginForm");

    LoginDOM.username =
        document.getElementById("username");

    LoginDOM.password =
        document.getElementById("password");

    LoginDOM.usernameWrapper =
        document.getElementById("usernameWrapper");

    LoginDOM.passwordWrapper =
        document.getElementById("passwordWrapper");

    LoginDOM.usernameError =
        document.getElementById("usernameError");

    LoginDOM.passwordError =
        document.getElementById("passwordError");

    LoginDOM.passwordToggle =
        document.getElementById("passwordToggle");

    LoginDOM.passwordStrength =
        document.getElementById("passwordStrength");

    LoginDOM.strengthLabel =
        document.getElementById("strengthLabel");

    LoginDOM.rememberMe =
        document.getElementById("rememberMe");

    LoginDOM.submitButton =
        document.getElementById("loginSubmit");

    LoginDOM.submitContent =
        document.getElementById("submitContent");

    LoginDOM.submitLoading =
        document.getElementById("submitLoading");

    LoginDOM.forgotPassword =
        document.getElementById("forgotPassword");

    LoginDOM.forgotModal =
        document.getElementById("forgotPasswordModal");

    LoginDOM.closeForgotModal =
        document.getElementById("closeForgotModal");

    LoginDOM.forgotForm =
        document.getElementById("forgotPasswordForm");

    LoginDOM.resetEmail =
        document.getElementById("resetEmail");

}


/* ============================================================
   INIT
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeLogin
);


function initializeLogin() {

    cacheDOM();


    if (!LoginDOM.form) {
        return;
    }


    bindLoginEvents();

    restoreRememberedUsername();

    initializePasswordStrength();

}


/* ============================================================
   EVENTS
============================================================ */

function bindLoginEvents() {


    /* ---------------------------------------------
       Password toggle
    ---------------------------------------------- */

    LoginDOM.passwordToggle?.addEventListener(
        "click",
        togglePasswordVisibility
    );


    /* ---------------------------------------------
       Username validation
    ---------------------------------------------- */

    LoginDOM.username?.addEventListener(
        "input",
        () => {

            clearFieldError(
                LoginDOM.username,
                LoginDOM.usernameWrapper,
                LoginDOM.usernameError
            );

        }
    );


    /* ---------------------------------------------
       Password input
    ---------------------------------------------- */

    LoginDOM.password?.addEventListener(
        "input",
        event => {

            clearFieldError(
                LoginDOM.password,
                LoginDOM.passwordWrapper,
                LoginDOM.passwordError
            );


            updatePasswordStrength(
                event.target.value
            );

        }
    );


    /* ---------------------------------------------
       Remember me
    ---------------------------------------------- */

    LoginDOM.rememberMe?.addEventListener(
        "change",
        event => {

            LoginState.rememberMe =
                event.target.checked;

        }
    );


    /* ---------------------------------------------
       Submit
    ---------------------------------------------- */

    LoginDOM.form.addEventListener(
        "submit",
        handleSubmit
    );


    /* ---------------------------------------------
       Forgot password
    ---------------------------------------------- */

    LoginDOM.forgotPassword?.addEventListener(
        "click",
        openForgotModal
    );


    LoginDOM.closeForgotModal?.addEventListener(
        "click",
        closeForgotModal
    );


    LoginDOM.forgotModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                LoginDOM.forgotModal
            ) {

                closeForgotModal();

            }

        }
    );


    LoginDOM.forgotForm?.addEventListener(
        "submit",
        handleForgotPassword
    );


    /* ---------------------------------------------
       ESC
    ---------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !LoginDOM.forgotModal?.hidden
            ) {

                closeForgotModal();

            }

        }
    );

}


/* ============================================================
   SUBMIT
============================================================ */

function handleSubmit(event) {

    event.preventDefault();


    if (
        LoginState.isSubmitting
    ) {
        return;
    }


    clearAllErrors();


    const username =
        LoginDOM.username.value.trim();


    const password =
        LoginDOM.password.value;


    let isValid = true;


    /* Username */

    if (!username) {

        showFieldError(
            LoginDOM.username,
            LoginDOM.usernameWrapper,
            LoginDOM.usernameError,
            "Please enter your username."
        );

        isValid = false;

    } else if (
        username.length < 3
    ) {

        showFieldError(
            LoginDOM.username,
            LoginDOM.usernameWrapper,
            LoginDOM.usernameError,
            "Username must contain at least 3 characters."
        );

        isValid = false;

    }


    /* Password */

    if (!password) {

        showFieldError(
            LoginDOM.password,
            LoginDOM.passwordWrapper,
            LoginDOM.passwordError,
            "Please enter your password."
        );

        isValid = false;

    }


    if (!isValid) {

        focusFirstInvalidField();

        return;

    }


    saveRememberedUsername(
        username,
        LoginState.rememberMe
    );


    setSubmitLoading(true);


    /*
     * Important:
     *
     * We intentionally submit the native Django form
     * after client-side validation.
     *
     * This keeps Django's CSRF protection and server-side
     * authentication completely intact.
     */

    LoginDOM.form.submit();

}


/* ============================================================
   PASSWORD VISIBILITY
============================================================ */

function togglePasswordVisibility() {

    if (!LoginDOM.password) {
        return;
    }


    LoginState.passwordVisible =
        !LoginState.passwordVisible;


    LoginDOM.password.type =
        LoginState.passwordVisible
            ? "text"
            : "password";


    LoginDOM.passwordToggle.classList.toggle(
        "showing",
        LoginState.passwordVisible
    );


    LoginDOM.passwordToggle.setAttribute(
        "aria-label",
        LoginState.passwordVisible
            ? "Hide password"
            : "Show password"
    );


    LoginDOM.passwordToggle.setAttribute(
        "title",
        LoginState.passwordVisible
            ? "Hide password"
            : "Show password"
    );


    LoginDOM.password.focus();

}


/* ============================================================
   PASSWORD STRENGTH
============================================================ */

function initializePasswordStrength() {

    if (
        LoginDOM.password?.value
    ) {

        updatePasswordStrength(
            LoginDOM.password.value
        );

    }

}


function updatePasswordStrength(
    password
) {

    if (
        !LoginDOM.passwordStrength ||
        !LoginDOM.strengthLabel
    ) {
        return;
    }


    LoginDOM.passwordStrength.classList.remove(
        "weak",
        "fair",
        "good",
        "strong"
    );


    if (!password) {

        LoginDOM.strengthLabel.textContent =
            "Enter password";

        return;

    }


    const score =
        calculatePasswordScore(
            password
        );


    if (score <= 1) {

        LoginDOM.passwordStrength.classList.add(
            "weak"
        );

        LoginDOM.strengthLabel.textContent =
            "Weak password";

    } else if (score === 2) {

        LoginDOM.passwordStrength.classList.add(
            "fair"
        );

        LoginDOM.strengthLabel.textContent =
            "Fair password";

    } else if (score === 3) {

        LoginDOM.passwordStrength.classList.add(
            "good"
        );

        LoginDOM.strengthLabel.textContent =
            "Good password";

    } else {

        LoginDOM.passwordStrength.classList.add(
            "strong"
        );

        LoginDOM.strengthLabel.textContent =
            "Strong password";

    }

}


/* ============================================================
   PASSWORD SCORE
============================================================ */

function calculatePasswordScore(
    password
) {

    let score = 0;


    if (
        password.length >= 8
    ) {
        score++;
    }


    if (
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password)
    ) {
        score++;
    }


    if (
        /\d/.test(password)
    ) {
        score++;
    }


    if (
        /[^A-Za-z0-9]/.test(password)
    ) {
        score++;
    }


    return score;

}


/* ============================================================
   VALIDATION ERROR
============================================================ */

function showFieldError(
    input,
    wrapper,
    errorElement,
    message
) {

    if (wrapper) {

        wrapper.classList.add(
            "has-error"
        );

        wrapper.classList.remove(
            "has-success"
        );

    }


    if (errorElement) {

        errorElement.textContent =
            message;

    }


    if (input) {

        input.setAttribute(
            "aria-invalid",
            "true"
        );

    }

}


function clearFieldError(
    input,
    wrapper,
    errorElement
) {

    if (wrapper) {

        wrapper.classList.remove(
            "has-error"
        );

    }


    if (errorElement) {

        errorElement.textContent =
            "";

    }


    if (input) {

        input.removeAttribute(
            "aria-invalid"
        );

    }

}


function clearAllErrors() {

    clearFieldError(
        LoginDOM.username,
        LoginDOM.usernameWrapper,
        LoginDOM.usernameError
    );


    clearFieldError(
        LoginDOM.password,
        LoginDOM.passwordWrapper,
        LoginDOM.passwordError
    );

}


/* ============================================================
   FOCUS INVALID
============================================================ */

function focusFirstInvalidField() {

    if (
        LoginDOM.username?.getAttribute(
            "aria-invalid"
        ) === "true"
    ) {

        LoginDOM.username.focus();

        return;

    }


    if (
        LoginDOM.password?.getAttribute(
            "aria-invalid"
        ) === "true"
    ) {

        LoginDOM.password.focus();

    }

}


/* ============================================================
   SUBMIT LOADING
============================================================ */

function setSubmitLoading(
    loading
) {

    LoginState.isSubmitting =
        loading;


    if (!LoginDOM.submitButton) {
        return;
    }


    LoginDOM.submitButton.disabled =
        loading;


    LoginDOM.submitButton.classList.toggle(
        "loading",
        loading
    );

}


/* ============================================================
   REMEMBER USERNAME
============================================================ */

const REMEMBER_KEY =
    "sita_path_lab_admin_username";


function saveRememberedUsername(
    username,
    shouldRemember
) {

    try {

        if (shouldRemember) {

            localStorage.setItem(
                REMEMBER_KEY,
                username
            );

        } else {

            localStorage.removeItem(
                REMEMBER_KEY
            );

        }

    } catch (error) {

        console.warn(
            "Unable to save remembered username.",
            error
        );

    }

}


function restoreRememberedUsername() {

    try {

        const savedUsername =
            localStorage.getItem(
                REMEMBER_KEY
            );


        if (
            savedUsername &&
            LoginDOM.username
        ) {

            LoginDOM.username.value =
                savedUsername;


            if (LoginDOM.rememberMe) {

                LoginDOM.rememberMe.checked =
                    true;

                LoginState.rememberMe =
                    true;

            }

        }

    } catch (error) {

        console.warn(
            "Unable to restore remembered username.",
            error
        );

    }

}


/* ============================================================
   FORGOT PASSWORD
============================================================ */

function openForgotModal() {

    if (!LoginDOM.forgotModal) {
        return;
    }


    LoginDOM.forgotModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";


    setTimeout(
        () => {

            LoginDOM.resetEmail?.focus();

        },
        50
    );

}


function closeForgotModal() {

    if (!LoginDOM.forgotModal) {
        return;
    }


    LoginDOM.forgotModal.hidden =
        true;


    document.body.style.overflow =
        "";

}


/* ============================================================
   FORGOT PASSWORD SUBMIT
============================================================ */

function handleForgotPassword(
    event
) {

    const email =
        LoginDOM.resetEmail.value.trim();


    if (!email) {

        event.preventDefault();

        LoginDOM.resetEmail.focus();

        return;

    }


    if (
        !isValidEmail(email)
    ) {

        event.preventDefault();

        LoginDOM.resetEmail.setCustomValidity(
            "Please enter a valid email address."
        );

        LoginDOM.resetEmail.reportValidity();

        LoginDOM.resetEmail.setCustomValidity(
            ""
        );

        return;

    }


    const submitButton =
        LoginDOM.forgotForm.querySelector(
            ".modal-submit"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Sending...";

    }

}


/* ============================================================
   EMAIL VALIDATION
============================================================ */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* ============================================================
   AUTOFILL / BROWSER SUPPORT
============================================================ */

window.addEventListener(
    "pageshow",
    () => {

        if (
            LoginState.isSubmitting
        ) {

            setSubmitLoading(
                false
            );

        }

    }
);


/* ============================================================
   PUBLIC API
============================================================ */

window.SitaPathLabLogin = {

    togglePassword:
        togglePasswordVisibility,

    openForgotPassword:
        openForgotModal,

    closeForgotPassword:
        closeForgotModal

};