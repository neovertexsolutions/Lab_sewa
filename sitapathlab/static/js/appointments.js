/* =========================================================
SITA PATH LAB - APPOINTMENT MANAGEMENT
Django Backend Connected
Matches actual appointments.html structure
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initAppointments();
});

/* =========================================================
CONFIG
========================================================= */

const API = {
    appointments: "/api/appointments/",
    doctors: "/api/doctors/",
    patients: "/api/patients/",
    csrf: "/api/csrf/"
};

/* Map dropdown slug values to readable test names sent to backend */
const TEST_TYPE_LABELS = {
    "full-body": "Full Body Checkup",
    "diabetes": "Diabetes Profile",
    "cardiology": "Cardiology Panel",
    "thyroid": "Thyroid Profile",
    "cbc": "Complete Blood Count"
};

/* =========================================================
STATE
========================================================= */

let appointments = [];
let doctors = [];

/* =========================================================
DOM HELPERS
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

/* =========================================================
CSRF
========================================================= */

function getCookie(name) {
    const match = document.cookie.match(
        new RegExp('(^| )' + name + '=([^;]+)')
    );

    return match ? decodeURIComponent(match[2]) : null;
}

async function initializeCSRF() {
    try {
        await fetch(API.csrf, {
            method: "GET",
            credentials: "same-origin"
        });
    } catch (error) {
        console.warn("CSRF initialization failed:", error);
    }
}

/* =========================================================
API HELPER
========================================================= */

async function apiRequest(url, options = {}) {
    const config = {
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
            ...(options.headers || {})
        },
        ...options
    };

    const response = await fetch(url, config);

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            (data && data.message) ||
            (data && data.error) ||
            `Request failed: ${response.status}`;

        throw new Error(message);
    }

    return data;
}

/* =========================================================
INITIALIZATION
========================================================= */

async function initAppointments() {
    try {
        await initializeCSRF();

        await Promise.all([
            loadAppointments(),
            loadDoctors()
        ]);

        setupEventListeners();
        setupDateDefault();
        renderAppointmentsTable();
        renderSpecialists();

    } catch (error) {
        console.error(
            "Appointment initialization failed:",
            error
        );

        showNotification(
            error.message ||
            "Unable to load appointment data.",
            "error"
        );
    }
}

/* =========================================================
LOAD APPOINTMENTS
========================================================= */

async function loadAppointments() {
    const response = await apiRequest(
        API.appointments,
        { method: "GET" }
    );

    appointments = response.appointments || [];

    return appointments;
}

/* =========================================================
LOAD DOCTORS
========================================================= */

async function loadDoctors() {
    const response = await apiRequest(
        API.doctors,
        { method: "GET" }
    );

    doctors = response.doctors || [];

    return doctors;
}

/* =========================================================
EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const form = $("#bookingForm");

    if (form) {
        form.addEventListener(
            "submit",
            handleBookingSubmit
        );
    } else {
        console.warn("#bookingForm not found in DOM.");
    }
}

/* =========================================================
DEFAULT DATE
========================================================= */

function setupDateDefault() {
    const dateInput = $("#appointmentDate");

    if (dateInput && !dateInput.value) {
        dateInput.value =
            new Date().toISOString().split("T")[0];
    }
}

/* =========================================================
SUBMIT BOOKING
========================================================= */

async function handleBookingSubmit(event) {
    event.preventDefault();

    const patientInput = $("#patientName");
    const dateInput = $("#appointmentDate");
    const timeInput = $("#appointmentTime");
    const testSelect = $("#testType");

    const patientName =
        (patientInput?.value || "").trim();

    const date = dateInput?.value || "";
    const time = timeInput?.value || "";

    const testSlug = testSelect?.value || "";
    const testType =
        TEST_TYPE_LABELS[testSlug] || testSlug || "General";

    if (!patientName) {
        showNotification(
            "Please enter a patient name.",
            "error"
        );
        patientInput?.focus();
        return;
    }

    if (!date) {
        showNotification(
            "Please select appointment date.",
            "error"
        );
        dateInput?.focus();
        return;
    }

    if (!time) {
        showNotification(
            "Please select appointment time.",
            "error"
        );
        timeInput?.focus();
        return;
    }

    const payload = {
        patientName: patientName,
        appointmentDate: date,
        appointmentTime: time,
        testType: testType,
        status: "scheduled"
    };

    const submitBtn = $(".btn-book");

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "BOOKING...";
        }

        const response = await apiRequest(
            API.appointments,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );

        if (response.status !== "success") {
            throw new Error(
                response.message ||
                "Unable to book appointment."
            );
        }

        showNotification(
            response.message ||
            "Appointment booked successfully!",
            "success"
        );

        $("#bookingForm").reset();
        setupDateDefault();

        await loadAppointments();
        renderAppointmentsTable();

    } catch (error) {
        showNotification(
            error.message ||
            "Failed to book appointment.",
            "error"
        );

    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "CONFIRM BOOKING";
        }
    }
}

/* =========================================================
RENDER APPOINTMENTS TABLE (Today's Queue)
========================================================= */

function renderAppointmentsTable() {
    const tbody = $("#appointmentsBody");

    if (!tbody) {
        return;
    }

    const today =
        new Date().toISOString().split("T")[0];

    const todaysAppointments =
        appointments.filter(
            appointment => appointment.date === today
        );

    if (!todaysAppointments.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:32px;">
                    No appointments for today.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = todaysAppointments
        .map(appointmentRow)
        .join("");

    attachRowActions();
}

function appointmentRow(appointment) {
    const status = appointment.status || "scheduled";

    return `
        <tr data-id="${appointment.id}">
            <td>${escapeHTML(appointment.patientName || "-")}</td>
            <td>${formatTime(appointment.time)}</td>
            <td>${escapeHTML(appointment.testType || "General")}</td>
            <td>${escapeHTML(appointment.doctorName || "Not Assigned")}</td>
            <td>
                <span class="status-badge status-${status}">
                    ${formatStatus(status)}
                </span>
            </td>
            <td>
                <button
                    type="button"
                    class="btn-delete-appointment"
                    data-id="${appointment.id}"
                    title="Cancel"
                >
                    Cancel
                </button>
            </td>
        </tr>
    `;
}

function attachRowActions() {
    $all(".btn-delete-appointment").forEach(button => {
        button.addEventListener("click", () => {
            deleteAppointment(button.dataset.id);
        });
    });
}

/* =========================================================
DELETE / CANCEL APPOINTMENT
========================================================= */

async function deleteAppointment(id) {
    const appointment = appointments.find(
        item => String(item.id) === String(id)
    );

    if (!appointment) {
        return;
    }

    const confirmed = window.confirm(
        `Cancel appointment for ${appointment.patientName}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await apiRequest(
            `${API.appointments}${id}/`,
            { method: "DELETE" }
        );

        if (response.status !== "success") {
            throw new Error(
                response.message ||
                "Unable to cancel appointment."
            );
        }

        showNotification(
            response.message ||
            "Appointment cancelled successfully!",
            "success"
        );

        await loadAppointments();
        renderAppointmentsTable();

    } catch (error) {
        showNotification(
            error.message ||
            "Failed to cancel appointment.",
            "error"
        );
    }
}

/* =========================================================
RENDER SPECIALISTS (Doctors)
========================================================= */

function renderSpecialists() {
    const container = $("#specialistsList");

    if (!container) {
        return;
    }

    if (!doctors.length) {
        container.innerHTML = `
            <p style="padding:12px;color:#888;">
                No specialists found.
            </p>
        `;
        return;
    }

    container.innerHTML = doctors
        .map(doctor => `
            <div class="specialist-item">
                <div class="specialist-info">
                    <strong>${escapeHTML(doctor.name)}</strong>
                    <span>${escapeHTML(doctor.role || "")}</span>
                </div>
                <span class="specialist-status ${doctor.status || "offline"}">
                    ${escapeHTML(doctor.status || "offline")}
                </span>
            </div>
        `)
        .join("");
}

/* =========================================================
STATUS / TIME FORMATTING
========================================================= */

function formatStatus(status) {
    if (!status) {
        return "Scheduled";
    }

    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function formatTime(time) {
    if (!time) {
        return "-";
    }

    const parts = String(time).split(":");

    if (parts.length < 2) {
        return time;
    }

    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

/* =========================================================
NOTIFICATION
========================================================= */

function showNotification(message, type = "success") {
    const existing = $(".appointment-notification");

    if (existing) {
        existing.remove();
    }

    const notification = document.createElement("div");

    notification.className =
        `appointment-notification ${type}`;

    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        padding: 14px 20px;
        border-radius: 10px;
        background: ${type === "error" ? "#dc2626" : "#16a34a"};
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,.15);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity .3s";

        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/* =========================================================
HTML ESCAPE
========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
GLOBAL FUNCTIONS
========================================================= */

window.loadAppointments = loadAppointments;
window.renderAppointmentsTable = renderAppointmentsTable;
window.deleteAppointment = deleteAppointment;