/**
 * Sita Path Lab - Patient Management System
 * Django Backend Connected
 */

'use strict';

// ============================================================
// STATE
// ============================================================

let patients = [];
let filteredPatients = [];

let currentPage = 1;
const itemsPerPage = 6;

let selectedPatients = new Set();


// ============================================================
// DOM REFERENCES
// ============================================================

const tableBody = document.getElementById('patientTableBody');

const searchInput = document.getElementById('patientSearch');
const statusFilter = document.getElementById('statusFilter');
const genderFilter = document.getElementById('genderFilter');
const sortFilter = document.getElementById('sortFilter');

const resultsCount = document.getElementById('resultsCount');

const selectAll = document.getElementById('selectAll');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');

const addPatientBtn = document.getElementById('addPatientBtn');
const fabAddPatient = document.getElementById('fabAddPatient');

const modal = document.getElementById('addPatientModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

const patientForm = document.getElementById('patientForm');

const totalPatientsEl = document.getElementById('totalPatients');
const newPatientsEl = document.getElementById('newPatients');
const pendingReportsEl = document.getElementById('pendingReports');
const completedTestsEl = document.getElementById('completedTests');


// ============================================================
// CSRF
// ============================================================

function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {

        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {

            const cookie = cookies[i].trim();

            if (
                cookie.substring(0, name.length + 1) ===
                name + '='
            ) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    console.log('🏥 Patient Management System Initialized');

    loadThemePreference();

    setupEventListeners();

    fetchPatients();

});


// ============================================================
// FETCH PATIENTS
// ============================================================

async function fetchPatients() {

    try {

        console.log('📡 Loading patients from Django...');

        const response = await fetch('/api/patients/', {

            method: 'GET',

            headers: {
                'Accept': 'application/json'
            },

            credentials: 'same-origin'

        });


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();

        console.log('📦 API Response:', data);


        // ----------------------------------------------------
        // Handle every response shape the backend might use
        // ----------------------------------------------------

        let apiPatients = [];

        if (Array.isArray(data)) {

            apiPatients = data;

        } else if (
            data &&
            Array.isArray(data.patients)
        ) {

            // Sita Path Lab backend shape:
            // { "status": "success", "patients": [...] }
            apiPatients = data.patients;

        } else if (
            data &&
            Array.isArray(data.results)
        ) {

            apiPatients = data.results;

        } else if (
            data &&
            Array.isArray(data.data)
        ) {

            apiPatients = data.data;

        } else {

            console.warn(
                '⚠️ Unknown API response structure:',
                data
            );

            apiPatients = [];

        }


        // ----------------------------------------------------
        // Convert backend objects to frontend objects
        //
        // Backend (patient_to_dict) sends camelCase:
        // { id, databaseId, patientId, firstName, lastName,
        //   fullName, gender, age, phone, contact, email,
        //   address, status, lastVisit, createdAt, updatedAt }
        //
        // "id" from the backend IS the display patient_id
        // (e.g. "SPL-2026-1001"), NOT the numeric row id.
        // The numeric row id comes in "databaseId".
        // ----------------------------------------------------

        patients = apiPatients.map(function (p) {

            return {

                // Numeric database row id (used internally if needed)
                dbId:
                    p.databaseId ??
                    p.id ??
                    p.pk,

                // Display / lookup Patient ID (e.g. "SPL-2026-1001")
                // This is what the backend expects for update/delete.
                id:
                    p.patientId ??
                    p.patient_id ??
                    p.id ??
                    p.pk,

                firstName:
                    p.firstName ??
                    p.first_name ??
                    '',

                lastName:
                    p.lastName ??
                    p.last_name ??
                    '',

                gender:
                    p.gender ??
                    '',

                age:
                    p.age ?? '',

                phone:
                    p.phone ??
                    p.contact ??
                    '',

                email:
                    p.email ??
                    '',

                address:
                    p.address ??
                    '',

                status:
                    p.status ??
                    'active',

                lastVisit:
                    p.lastVisit ??
                    p.last_visit ??
                    p.createdAt ??
                    p.created_at ??
                    null

            };

        });


        console.log(
            `✅ ${patients.length} patients loaded`
        );


        // ----------------------------------------------------
        // Refresh UI
        // ----------------------------------------------------

        updateStats();

        applyFilters();


    } catch (error) {

        console.error(
            '❌ Fetch Patients Error:',
            error
        );

        patients = [];

        filteredPatients = [];

        updateStats();

        renderTable();

        showNotification(
            'Failed to load patients from server',
            'error'
        );

    }

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderTable() {

    if (!tableBody) {

        console.error(
            '❌ patientTableBody not found'
        );

        return;
    }


    const totalPages =
        Math.ceil(
            filteredPatients.length /
            itemsPerPage
        );


    // Fix invalid page
    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {

        currentPage = totalPages;

    }


    const startIndex =
        (currentPage - 1) *
        itemsPerPage;


    const endIndex =
        startIndex +
        itemsPerPage;


    const pageItems =
        filteredPatients.slice(
            startIndex,
            endIndex
        );


    tableBody.innerHTML = '';


    // --------------------------------------------------------
    // EMPTY STATE
    // --------------------------------------------------------

    if (pageItems.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:40px 20px;
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
                        person_off
                    </span>

                    <p
                        style="
                            font-size:16px;
                            font-weight:600;
                        "
                    >
                        No patients found
                    </p>

                    <p
                        style="
                            font-size:14px;
                            margin-top:4px;
                        "
                    >
                        Add a new patient or adjust your filters.
                    </p>

                </td>

            </tr>

        `;

        updatePagination();

        updateResultsCount();

        updateSelectAllState();

        return;
    }


    // --------------------------------------------------------
    // PATIENT ROWS
    // --------------------------------------------------------

    pageItems.forEach(function (patient) {

        const row =
            document.createElement('tr');


        const patientId =
            String(
                patient.id ??
                patient.dbId ??
                ''
            );


        const fullName =
            `${escapeHtml(patient.firstName)}
             ${escapeHtml(patient.lastName)}`;


        const checked =
            selectedPatients.has(patientId);


        row.innerHTML = `

            <td>

                <input
                    type="checkbox"
                    class="patient-checkbox"
                    data-id="${escapeHtml(patientId)}"
                    ${checked ? 'checked' : ''}
                />

            </td>


            <td>

                <strong>
                    ${escapeHtml(patientId)}
                </strong>

            </td>


            <td>
                ${fullName}
            </td>


            <td>

                <span
                    style="text-transform:capitalize;"
                >
                    ${escapeHtml(patient.gender)}
                </span>

            </td>


            <td>
                ${escapeHtml(patient.age)}
            </td>


            <td>
                ${escapeHtml(patient.phone)}
            </td>


            <td>

                <span
                    class="status-badge status-${escapeHtml(
                        patient.status
                    )}"
                >
                    ${escapeHtml(patient.status)}
                </span>

            </td>


            <td>
                ${formatDate(patient.lastVisit)}
            </td>


            <td>

                <div class="action-btns">

                    <button
                        type="button"
                        class="action-btn-sm view"
                        data-id="${escapeHtml(patientId)}"
                        title="View Patient"
                    >

                        <span class="material-symbols-outlined">
                            visibility
                        </span>

                    </button>


                    <button
                        type="button"
                        class="action-btn-sm edit"
                        data-id="${escapeHtml(patientId)}"
                        title="Edit Patient"
                    >

                        <span class="material-symbols-outlined">
                            edit
                        </span>

                    </button>


                    <button
                        type="button"
                        class="action-btn-sm delete"
                        data-id="${escapeHtml(patientId)}"
                        title="Delete Patient"
                    >

                        <span class="material-symbols-outlined">
                            delete
                        </span>

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });


    // --------------------------------------------------------
    // CHECKBOX EVENTS
    // --------------------------------------------------------

    document
        .querySelectorAll('.patient-checkbox')
        .forEach(function (checkbox) {

            checkbox.addEventListener(
                'change',
                function () {

                    const id =
                        String(
                            this.dataset.id
                        );


                    if (this.checked) {

                        selectedPatients.add(id);

                    } else {

                        selectedPatients.delete(id);

                    }


                    updateSelectAllState();

                }
            );

        });


    // --------------------------------------------------------
    // VIEW
    // --------------------------------------------------------

    document
        .querySelectorAll('.action-btn-sm.view')
        .forEach(function (button) {

            button.addEventListener(
                'click',
                function () {

                    viewPatient(
                        this.dataset.id
                    );

                }
            );

        });


    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    document
        .querySelectorAll('.action-btn-sm.edit')
        .forEach(function (button) {

            button.addEventListener(
                'click',
                function () {

                    editPatient(
                        this.dataset.id
                    );

                }
            );

        });


    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    document
        .querySelectorAll('.action-btn-sm.delete')
        .forEach(function (button) {

            button.addEventListener(
                'click',
                function () {

                    deletePatient(
                        this.dataset.id
                    );

                }
            );

        });


    updatePagination();

    updateResultsCount();

    updateSelectAllState();

}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : '';


    const status =
        statusFilter
            ? statusFilter.value
            : 'all';


    const gender =
        genderFilter
            ? genderFilter.value
            : 'all';


    const sort =
        sortFilter
            ? sortFilter.value
            : 'newest';


    filteredPatients =
        patients.filter(function (patient) {

            const firstName =
                String(
                    patient.firstName || ''
                ).toLowerCase();


            const lastName =
                String(
                    patient.lastName || ''
                ).toLowerCase();


            const patientId =
                String(
                    patient.id || ''
                ).toLowerCase();


            const phone =
                String(
                    patient.phone || ''
                ).toLowerCase();


            const email =
                String(
                    patient.email || ''
                ).toLowerCase();


            const searchMatch =
                !searchTerm ||

                firstName.includes(searchTerm) ||

                lastName.includes(searchTerm) ||

                patientId.includes(searchTerm) ||

                phone.includes(searchTerm) ||

                email.includes(searchTerm);


            const statusMatch =
                status === 'all' ||
                patient.status === status;


            const genderMatch =
                gender === 'all' ||
                patient.gender === gender;


            return (
                searchMatch &&
                statusMatch &&
                genderMatch
            );

        });


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    if (sort === 'newest') {

        filteredPatients.sort(function (a, b) {

            return (
                new Date(
                    b.lastVisit || 0
                ) -
                new Date(
                    a.lastVisit || 0
                )
            );

        });


    } else if (sort === 'oldest') {

        filteredPatients.sort(function (a, b) {

            return (
                new Date(
                    a.lastVisit || 0
                ) -
                new Date(
                    b.lastVisit || 0
                )
            );

        });


    } else if (sort === 'name') {

        filteredPatients.sort(function (a, b) {

            const nameA =
                `${a.firstName} ${a.lastName}`;

            const nameB =
                `${b.firstName} ${b.lastName}`;

            return nameA.localeCompare(nameB);

        });

    }


    currentPage = 1;

    selectedPatients.clear();

    renderTable();

}


// ============================================================
// SAVE PATIENT
//
// Backend only has ONE write endpoint for create+update:
//   POST /api/patients/save/
// Sending "patientId" in the payload tells the backend to
// UPDATE that patient instead of creating a new one.
// (There is no PUT /api/patients/<id>/ route on the backend.)
// ============================================================

async function savePatientToBackend(
    patientData,
    editPatientId = null
) {

    const payload = {

        firstName:
            patientData.firstName,

        lastName:
            patientData.lastName,

        gender:
            patientData.gender,

        age:
            patientData.age,

        phone:
            patientData.phone,

        email:
            patientData.email,

        address:
            patientData.address,

        status:
            patientData.status

    };


    if (editPatientId) {

        payload.patientId = editPatientId;

    }


    console.log(
        '📤 Sending patient:',
        payload
    );


    try {

        const response =
            await fetch('/api/patients/save/', {

                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json',

                    'Accept':
                        'application/json',

                    'X-CSRFToken':
                        getCookie('csrftoken')

                },

                credentials:
                    'same-origin',

                body:
                    JSON.stringify(payload)

            });


        let responseData = null;

        try {

            responseData =
                await response.json();

        } catch (e) {

            responseData = null;

        }


        console.log(
            '📥 Save response:',
            response.status,
            responseData
        );


        if (!response.ok) {

            console.error(
                '❌ Django validation error:',
                responseData
            );


            throw new Error(
                responseData?.message ||
                responseData?.detail ||
                'Operation failed'
            );

        }


        // ----------------------------------------------------
        // IMPORTANT:
        // Reload fresh data from database
        // ----------------------------------------------------

        await fetchPatients();


        showNotification(

            editPatientId
                ? 'Patient updated successfully!'
                : 'Patient registered successfully!',

            'success'

        );


        return responseData;


    } catch (error) {

        console.error(
            '❌ Save Patient Error:',
            error
        );


        showNotification(
            error.message ||
            'Error saving patient data',
            'error'
        );


        throw error;

    }

}


// ============================================================
// VIEW PATIENT
// ============================================================

function viewPatient(id) {

    const patient =
        patients.find(function (p) {

            return String(p.id) === String(id);

        });


    if (!patient) {

        console.warn(
            'Patient not found:',
            id
        );

        return;

    }


    alert(

        `👤 Patient Details\n\n` +

        `Patient ID: ${patient.id}\n` +

        `Name: ${patient.firstName} ${patient.lastName}\n` +

        `Gender: ${patient.gender || 'N/A'}\n` +

        `Age: ${patient.age || 'N/A'}\n` +

        `Phone: ${patient.phone || 'N/A'}\n` +

        `Email: ${patient.email || 'N/A'}\n` +

        `Address: ${patient.address || 'N/A'}\n` +

        `Status: ${patient.status || 'N/A'}\n` +

        `Last Visit: ${formatDate(patient.lastVisit)}`

    );

}


// ============================================================
// EDIT PATIENT
// ============================================================

function editPatient(id) {

    const patient =
        patients.find(function (p) {

            return String(p.id) === String(id);

        });


    if (!patient) {

        return;

    }


    setInputValue(
        'firstName',
        patient.firstName
    );

    setInputValue(
        'lastName',
        patient.lastName
    );

    setInputValue(
        'gender',
        patient.gender
    );

    setInputValue(
        'age',
        patient.age
    );

    setInputValue(
        'phone',
        patient.phone
    );

    setInputValue(
        'email',
        patient.email
    );

    setInputValue(
        'address',
        patient.address
    );

    setInputValue(
        'status',
        patient.status
    );


    const modalTitle =
        document.querySelector(
            '.modal-title'
        );


    const submitButton =
        document.querySelector(
            '.modal-footer .btn-primary'
        );


    if (modalTitle) {

        modalTitle.textContent =
            'Edit Patient';

    }


    if (submitButton) {

        submitButton.textContent =
            'Update Patient';

    }


    if (patientForm) {

        // Store the display patient_id (e.g. "SPL-2026-1001")
        // — this is what the backend's save_patient view looks up by.
        patientForm.dataset.editPatientId =
            patient.id;

    }


    if (modal) {

        modal.classList.add('active');

    }

}


// ============================================================
// DELETE PATIENT
// ============================================================

async function deletePatient(id) {

    const patient =
        patients.find(function (p) {

            return String(p.id) === String(id);

        });


    if (!patient) {

        return;

    }


    const confirmed =
        confirm(

            `Are you sure you want to delete ` +

            `${patient.firstName} ${patient.lastName} ` +

            `(${patient.id})?`

        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(

                `/api/patients/${encodeURIComponent(patient.id)}/delete/`,

                {

                    method: 'DELETE',

                    headers: {

                        'X-CSRFToken':
                            getCookie('csrftoken'),

                        'Accept':
                            'application/json'

                    },

                    credentials:
                        'same-origin'

                }

            );


        let responseData = null;

        try {

            responseData =
                await response.json();

        } catch (e) {

            responseData = null;

        }


        if (!response.ok) {

            throw new Error(
                responseData?.message ||
                `Delete failed: HTTP ${response.status}`
            );

        }


        await fetchPatients();


        showNotification(
            responseData?.message ||
            'Patient deleted successfully!',
            'warning'
        );


    } catch (error) {

        console.error(
            '❌ Delete Patient Error:',
            error
        );


        showNotification(
            error.message ||
            'Failed to delete patient',
            'error'
        );

    }

}


// ============================================================
// MODAL
// ============================================================

function openModal() {

    if (!patientForm || !modal) {

        return;

    }


    patientForm.reset();

    patientForm.dataset.editPatientId = '';


    const modalTitle =
        document.querySelector(
            '.modal-title'
        );


    const submitButton =
        document.querySelector(
            '.modal-footer .btn-primary'
        );


    if (modalTitle) {

        modalTitle.textContent =
            'Register New Patient';

    }


    if (submitButton) {

        submitButton.textContent =
            'Register Patient';

    }


    modal.classList.add('active');

}


function closeModalFn() {

    if (!modal || !patientForm) {

        return;

    }


    modal.classList.remove('active');

    patientForm.reset();

    patientForm.dataset.editPatientId = '';

}


// ============================================================
// PAGINATION
// ============================================================

function updatePagination() {

    if (!pageNumbers) {

        return;

    }


    const totalPages =
        Math.ceil(
            filteredPatients.length /
            itemsPerPage
        );


    pageNumbers.innerHTML = '';


    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        if (i > 5) {
            break;
        }


        const button =
            document.createElement('button');


        button.type = 'button';

        button.className =
            `page-btn ${
                i === currentPage
                    ? 'active'
                    : ''
            }`;


        button.textContent = i;


        button.addEventListener(
            'click',
            function () {

                currentPage = i;

                renderTable();

            }
        );


        pageNumbers.appendChild(
            button
        );

    }


    if (prevPage) {

        prevPage.disabled =
            currentPage <= 1;

    }


    if (nextPage) {

        nextPage.disabled =
            totalPages === 0 ||
            currentPage >= totalPages;

    }

}


// ============================================================
// RESULTS COUNT
// ============================================================

function updateResultsCount() {

    if (!resultsCount) {

        return;

    }


    const total =
        filteredPatients.length;


    if (total === 0) {

        resultsCount.textContent =
            'No patients found';

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


    resultsCount.textContent =
        `Showing ${start}-${end} of ${total} patients`;

}


// ============================================================
// SELECT ALL
// ============================================================

function updateSelectAllState() {

    if (!selectAll) {

        return;

    }


    const checkboxes =
        document.querySelectorAll(
            '.patient-checkbox'
        );


    const checked =
        document.querySelectorAll(
            '.patient-checkbox:checked'
        );


    if (checkboxes.length === 0) {

        selectAll.checked = false;

        selectAll.indeterminate = false;

        return;

    }


    selectAll.checked =
        checked.length === checkboxes.length;


    selectAll.indeterminate =
        checked.length > 0 &&
        checked.length < checkboxes.length;

}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        patients.length;


    const now =
        new Date();


    const newThisMonth =
        patients.filter(function (patient) {

            if (!patient.lastVisit) {

                return false;

            }


            const date =
                new Date(
                    patient.lastVisit
                );


            return (

                !isNaN(date.getTime()) &&

                date.getMonth() ===
                now.getMonth() &&

                date.getFullYear() ===
                now.getFullYear()

            );

        }).length;


    const pending =
        patients.filter(function (patient) {

            return (
                String(
                    patient.status
                ).toLowerCase() ===
                'pending'
            );

        }).length;


    const completed =
        patients.filter(function (patient) {

            return (
                String(
                    patient.status
                ).toLowerCase() ===
                'completed'
            );

        }).length;


    if (totalPatientsEl) {

        totalPatientsEl.textContent =
            total.toLocaleString();

    }


    if (newPatientsEl) {

        newPatientsEl.textContent =
            newThisMonth;

    }


    if (pendingReportsEl) {

        pendingReportsEl.textContent =
            pending;

    }


    if (completedTestsEl) {

        completedTestsEl.textContent =
            completed;

    }

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateString) {

    if (!dateString) {

        return 'N/A';

    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {

        return 'N/A';

    }


    return date.toLocaleDateString(
        'en-US',
        {

            year: 'numeric',

            month: 'short',

            day: 'numeric'

        }
    );

}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(
    message,
    type = 'success'
) {

    const notification =
        document.createElement('div');


    const colors = {

        success: '#16a34a',

        warning: '#d97706',

        error: '#dc2626',

        info: '#2563eb'

    };


    notification.className =
        'custom-notification';


    notification.style.cssText = `

        position: fixed;

        top: 80px;

        right: 20px;

        padding: 16px 24px;

        background:
            ${colors[type] || colors.success};

        color: white;

        border-radius: 12px;

        box-shadow:
            0 4px 12px rgba(0,0,0,0.15);

        z-index: 99999;

        font-weight: 600;

        max-width: 400px;

    `;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(function () {

        notification.remove();

    }, 3000);

}


// ============================================================
// THEME
// ============================================================

function loadThemePreference() {

    const savedTheme =
        localStorage.getItem(
            'theme'
        );


    if (savedTheme === 'dark') {

        document.documentElement
            .classList
            .add('dark');


        const icon =
            document.querySelector(
                '.theme-toggle .material-symbols-outlined'
            );


        if (icon) {

            icon.textContent =
                'light_mode';

        }

    }

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (searchInput) {

        let searchTimeout;


        searchInput.addEventListener(
            'input',
            function () {

                clearTimeout(
                    searchTimeout
                );


                searchTimeout =
                    setTimeout(
                        applyFilters,
                        250
                    );

            }
        );

    }


    // --------------------------------------------------------
    // FILTERS
    // --------------------------------------------------------

    if (statusFilter) {

        statusFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    if (genderFilter) {

        genderFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    if (sortFilter) {

        sortFilter.addEventListener(
            'change',
            applyFilters
        );

    }


    // --------------------------------------------------------
    // SELECT ALL
    // --------------------------------------------------------

    if (selectAll) {

        selectAll.addEventListener(
            'change',
            function () {

                const checkboxes =
                    document.querySelectorAll(
                        '.patient-checkbox'
                    );


                checkboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            selectAll.checked;


                        const id =
                            String(
                                checkbox.dataset.id
                            );


                        if (
                            selectAll.checked
                        ) {

                            selectedPatients.add(
                                id
                            );

                        } else {

                            selectedPatients.delete(
                                id
                            );

                        }

                    }
                );


                updateSelectAllState();

            }
        );

    }


    // --------------------------------------------------------
    // PREVIOUS PAGE
    // --------------------------------------------------------

    if (prevPage) {

        prevPage.addEventListener(
            'click',
            function () {

                if (currentPage > 1) {

                    currentPage--;

                    renderTable();

                }

            }
        );

    }


    // --------------------------------------------------------
    // NEXT PAGE
    // --------------------------------------------------------

    if (nextPage) {

        nextPage.addEventListener(
            'click',
            function () {

                const totalPages =
                    Math.ceil(
                        filteredPatients.length /
                        itemsPerPage
                    );


                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderTable();

                }

            }
        );

    }


    // --------------------------------------------------------
    // ADD PATIENT
    // --------------------------------------------------------

    if (addPatientBtn) {

        addPatientBtn.addEventListener(
            'click',
            openModal
        );

    }


    if (fabAddPatient) {

        fabAddPatient.addEventListener(
            'click',
            openModal
        );

    }


    // --------------------------------------------------------
    // CLOSE MODAL
    // --------------------------------------------------------

    if (closeModal) {

        closeModal.addEventListener(
            'click',
            closeModalFn
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            'click',
            closeModalFn
        );

    }


    if (modal) {

        modal.addEventListener(
            'click',
            function (event) {

                if (
                    event.target ===
                    modal
                ) {

                    closeModalFn();

                }

            }
        );

    }


    // --------------------------------------------------------
    // FORM SUBMIT
    // --------------------------------------------------------

    if (patientForm) {

        patientForm.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const firstNameEl =
                    document.getElementById(
                        'firstName'
                    );


                const lastNameEl =
                    document.getElementById(
                        'lastName'
                    );


                const genderEl =
                    document.getElementById(
                        'gender'
                    );


                const ageEl =
                    document.getElementById(
                        'age'
                    );


                const phoneEl =
                    document.getElementById(
                        'phone'
                    );


                const emailEl =
                    document.getElementById(
                        'email'
                    );


                const addressEl =
                    document.getElementById(
                        'address'
                    );


                const statusEl =
                    document.getElementById(
                        'status'
                    );


                const formData = {

                    firstName:
                        firstNameEl?.value
                            .trim() || '',

                    lastName:
                        lastNameEl?.value
                            .trim() || '',

                    gender:
                        genderEl?.value || '',

                    age:
                        parseInt(
                            ageEl?.value || '',
                            10
                        ),

                    phone:
                        phoneEl?.value
                            .trim() || '',

                    email:
                        emailEl?.value
                            .trim() || '',

                    address:
                        addressEl?.value
                            .trim() || '',

                    status:
                        statusEl?.value ||
                        'active'

                };


                // ------------------------------------------------
                // VALIDATION
                // ------------------------------------------------

                if (
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.age ||
                    !formData.phone
                ) {

                    alert(
                        'Please fill in all required fields (*)'
                    );

                    return;

                }


                const editPatientId =
                    this.dataset.editPatientId ||
                    null;


                // Disable submit
                const submitButton =
                    document.querySelector(
                        '.modal-footer .btn-primary'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        editPatientId
                            ? 'Updating...'
                            : 'Saving...';

                }


                try {

                    await savePatientToBackend(
                        formData,
                        editPatientId
                    );


                    closeModalFn();


                } catch (error) {

                    console.error(
                        error
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            editPatientId
                                ? 'Update Patient'
                                : 'Register Patient';

                    }

                }

            }
        );

    }


    // --------------------------------------------------------
    // THEME TOGGLE
    // --------------------------------------------------------

    const themeToggle =
        document.querySelector(
            '.theme-toggle'
        );


    if (themeToggle) {

        themeToggle.addEventListener(
            'click',
            function () {

                document.documentElement
                    .classList
                    .toggle('dark');


                const isDark =
                    document.documentElement
                        .classList
                        .contains('dark');


                localStorage.setItem(
                    'theme',
                    isDark
                        ? 'dark'
                        : 'light'
                );


                const icon =
                    this.querySelector(
                        '.material-symbols-outlined'
                    );


                if (icon) {

                    icon.textContent =
                        isDark
                            ? 'light_mode'
                            : 'contrast';

                }

            }
        );

    }

}


// ============================================================
// HELPERS
// ============================================================

function setInputValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.value =
            value ?? '';

    }

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


// ============================================================
// DEBUG
// ============================================================

console.log(
    '🏥 Sita Path Lab - patients.js loaded'
);