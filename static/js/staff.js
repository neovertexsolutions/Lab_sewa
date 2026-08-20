/**
 * Sita Path Lab - Staff Management
 * Django Backend Connected
 */

'use strict';

// ============================================================
// GLOBAL DATA
// ============================================================

let staffMembers = [];
let roles = [];
let selectedStaffId = null;


// ============================================================
// CSRF TOKEN
// ============================================================

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();

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

const csrftoken = getCookie('csrftoken');


// ============================================================
// DOM REFERENCES
// ============================================================

const staffGrid = document.getElementById('staffGrid');
const rolesList = document.getElementById('rolesList');
const staffSearch = document.getElementById('staffSearch');

const profileName = document.getElementById('profileName');
const accuracyRate = document.getElementById('accuracyRate');
const turnaroundTime = document.getElementById('turnaroundTime');


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    loadTheme();

    setupEventListeners();

    fetchStaffAndRoles();

});


// ============================================================
// THEME
// ============================================================

function loadTheme() {

    const savedTheme = localStorage.getItem('theme');

    const icon = document.querySelector(
        '.icon-btn .material-symbols-outlined'
    );

    if (savedTheme === 'dark') {

        document.body.classList.add('dark');

        if (icon) {
            icon.textContent = 'light_mode';
        }

    } else {

        document.body.classList.remove('dark');

        if (icon) {
            icon.textContent = 'contrast';
        }

    }
}


function toggleTheme() {

    document.body.classList.toggle('dark');

    const isDark = document.body.classList.contains('dark');

    localStorage.setItem(
        'theme',
        isDark ? 'dark' : 'light'
    );

    const icon = document.querySelector(
        '.icon-btn .material-symbols-outlined'
    );

    if (icon) {
        icon.textContent = isDark
            ? 'light_mode'
            : 'contrast';
    }
}


// ============================================================
// FETCH STAFF + ROLES
// ============================================================

async function fetchStaffAndRoles() {

    try {

        showNotification(
            'Loading staff data...',
            'info',
            1500
        );

        const response = await fetch(
            '/api/staff/data/',
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server error: ${response.status}`
            );
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(
                data.message || 'Unable to load staff data'
            );
        }

        staffMembers = Array.isArray(data.staff)
            ? data.staff
            : [];

        roles = Array.isArray(data.roles)
            ? data.roles
            : [];

        renderStaff();

        renderRoles();

        updateDashboardStats();

        if (staffMembers.length > 0) {

            if (
                selectedStaffId &&
                staffMembers.some(
                    staff => staff.id === selectedStaffId
                )
            ) {
                updateProfile(selectedStaffId);
            } else {
                updateProfile(staffMembers[0].id);
            }

        } else {

            clearProfile();

        }

    } catch (error) {

        console.error(
            'Staff API Error:',
            error
        );

        showNotification(
            'Unable to connect with Django backend.',
            'error'
        );

        renderStaff();

        renderRoles();
    }
}


// ============================================================
// RENDER STAFF
// ============================================================

function renderStaff() {

    if (!staffGrid) {
        return;
    }

    const searchTerm = staffSearch
        ? staffSearch.value.toLowerCase().trim()
        : '';

    const filteredStaff = staffMembers.filter(function (member) {

        const name =
            String(member.name || '').toLowerCase();

        const role =
            String(member.role || '').toLowerCase();

        const department =
            String(member.department || '').toLowerCase();

        const email =
            String(member.email || '').toLowerCase();

        return (
            !searchTerm ||
            name.includes(searchTerm) ||
            role.includes(searchTerm) ||
            department.includes(searchTerm) ||
            email.includes(searchTerm)
        );

    });

    staffGrid.innerHTML = '';

    if (filteredStaff.length === 0) {

        staffGrid.innerHTML = `
            <div class="empty-state"
                 style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:50px 20px;
                 ">

                <span
                    class="material-symbols-outlined"
                    style="
                        font-size:52px;
                        display:block;
                        margin-bottom:12px;
                    ">
                    person_off
                </span>

                <p
                    style="
                        font-size:17px;
                        font-weight:700;
                        margin:0;
                    ">
                    No staff members found
                </p>

                <p
                    style="
                        font-size:14px;
                        margin-top:6px;
                        opacity:.7;
                    ">
                    Try another name, role or department
                </p>

            </div>
        `;

        return;
    }


    filteredStaff.forEach(function (member) {

        const card = document.createElement('div');

        card.className = 'staff-card';

        if (member.id === selectedStaffId) {
            card.classList.add('selected');
        }


        // ----------------------------------------------------
        // Rating
        // ----------------------------------------------------

        const rating = Number(member.rating || 0);

        let ratingStars = '';

        for (let i = 1; i <= 5; i++) {

            ratingStars += `
                <span
                    class="material-symbols-outlined ${
                        i <= rating
                            ? 'filled'
                            : 'empty'
                    }">
                    star
                </span>
            `;

        }


        // ----------------------------------------------------
        // Safe Values
        // ----------------------------------------------------

        const name =
            escapeHTML(member.name || 'Unknown Staff');

        const role =
            escapeHTML(member.role || 'Staff');

        const department =
            escapeHTML(
                member.department || 'General Department'
            );

        const email =
            escapeHTML(
                member.email || 'No email available'
            );

        const status =
            escapeHTML(
                member.status || 'active'
            );

        const cert =
            escapeHTML(
                member.cert || 'N/A'
            );

        const avatar =
            member.avatar ||
            '/static/images/default-avatar.png';


        // ----------------------------------------------------
        // Card HTML
        // ----------------------------------------------------

        card.innerHTML = `

            <div class="staff-card-top">

                <div class="staff-avatar">

                    <img
                        src="${escapeAttribute(avatar)}"
                        alt="${escapeAttribute(member.name || 'Staff')}"
                        onerror="this.src='/static/images/default-avatar.png'"
                    />

                </div>

                <span class="staff-status ${status}">
                    ${status}
                </span>

            </div>


            <h3 class="staff-name">
                ${name}
            </h3>


            <p class="staff-role">
                ${role}
            </p>


            <div class="staff-details">

                <div class="staff-detail">

                    <span class="material-symbols-outlined">
                        domain
                    </span>

                    <span>
                        ${department}
                    </span>

                </div>


                <div class="staff-detail">

                    <span class="material-symbols-outlined">
                        mail
                    </span>

                    <span>
                        ${email}
                    </span>

                </div>

            </div>


            <div class="staff-card-bottom">

                <div class="staff-rating">
                    ${ratingStars}
                </div>

                <span class="staff-cert">
                    Cert: ${cert}
                </span>

            </div>

        `;


        // ----------------------------------------------------
        // Click Event
        // ----------------------------------------------------

        card.addEventListener(
            'click',
            function () {

                updateProfile(member.id);

                document
                    .querySelectorAll('.staff-card')
                    .forEach(function (item) {
                        item.classList.remove('selected');
                    });

                card.classList.add('selected');

            }
        );


        staffGrid.appendChild(card);

    });

}


// ============================================================
// RENDER ROLES
// ============================================================

function renderRoles() {

    if (!rolesList) {
        return;
    }

    rolesList.innerHTML = '';

    if (roles.length === 0) {

        rolesList.innerHTML = `
            <div
                style="
                    padding:20px;
                    text-align:center;
                    opacity:.7;
                ">
                No roles available
            </div>
        `;

        return;
    }


    roles.forEach(function (role) {

        const div = document.createElement('div');

        const isAdmin =
            String(role.name || '')
                .toLowerCase()
                .includes('administrator');

        div.className =
            `role-item${isAdmin ? ' admin' : ''}`;


        const roleName =
            escapeHTML(
                role.name || 'Unnamed Role'
            );

        const roleDesc =
            escapeHTML(
                role.desc ||
                role.description ||
                'No description available'
            );


        div.innerHTML = `

            <div class="role-top">

                <span class="role-name">
                    ${roleName}
                </span>

                <span
                    class="role-lock material-symbols-outlined">
                    ${
                        role.locked
                            ? 'lock'
                            : 'lock_open'
                    }
                </span>

            </div>

            <p class="role-desc">
                ${roleDesc}
            </p>

        `;

        rolesList.appendChild(div);

    });

}


// ============================================================
// UPDATE PROFILE
// ============================================================

function updateProfile(id) {

    const member = staffMembers.find(
        staff => Number(staff.id) === Number(id)
    );

    if (!member) {
        return;
    }

    selectedStaffId = member.id;


    // --------------------------------------------------------
    // Name
    // --------------------------------------------------------

    if (profileName) {

        profileName.textContent =
            member.name || 'Unknown Staff';

    }


    // --------------------------------------------------------
    // Avatar
    // --------------------------------------------------------

    const avatarImg =
        document.querySelector(
            '.profile-avatar img'
        );

    if (avatarImg) {

        avatarImg.src =
            member.avatar ||
            '/static/images/default-avatar.png';

        avatarImg.alt =
            member.name || 'Staff Profile';

    }


    // --------------------------------------------------------
    // Role + Department
    // --------------------------------------------------------

    const profileTags =
        document.querySelectorAll(
            '.profile-tags .profile-tag'
        );

    if (profileTags[0]) {

        profileTags[0].textContent =
            member.role || 'Staff';

    }

    if (profileTags[1]) {

        profileTags[1].textContent =
            'Dpt: ' +
            (member.department || 'General');

    }


    // --------------------------------------------------------
    // Accuracy
    // --------------------------------------------------------

    if (accuracyRate) {

        const accuracy =
            Number(member.accuracy || 0);

        if (accuracy > 0) {

            accuracyRate.textContent =
                accuracy.toFixed(1) + '%';

            const bar =
                document.querySelector(
                    '.metric-fill.primary'
                );

            if (bar) {
                bar.style.width =
                    Math.min(accuracy, 100) + '%';
            }

        }

    }


    // --------------------------------------------------------
    // Turnaround
    // --------------------------------------------------------

    if (turnaroundTime) {

        const turnaround =
            member.turnaround ||
            member.turnaround_time ||
            'Not available';

        turnaroundTime.textContent =
            turnaround;

        const bar =
            document.querySelector(
                '.metric-fill.secondary'
            );

        if (bar) {

            let percentage = 60;

            if (
                String(turnaround)
                    .toLowerCase()
                    .includes('faster')
            ) {
                percentage = 85;
            }

            if (
                String(turnaround)
                    .toLowerCase()
                    .includes('slower')
            ) {
                percentage = 40;
            }

            bar.style.width =
                percentage + '%';
        }

    }


    // --------------------------------------------------------
    // Certifications
    // --------------------------------------------------------

    renderCertifications(
        member.certifications || []
    );

}


// ============================================================
// CERTIFICATIONS
// ============================================================

function renderCertifications(certifications) {

    const certList =
        document.querySelector('.cert-list');

    if (!certList) {
        return;
    }

    certList.innerHTML = '';

    if (!Array.isArray(certifications) ||
        certifications.length === 0) {

        certList.innerHTML = `
            <div
                style="
                    padding:12px 0;
                    opacity:.7;
                ">
                No certifications available
            </div>
        `;

        return;
    }


    certifications.forEach(function (cert) {

        const name =
            escapeHTML(
                cert.name ||
                cert.certificate_name ||
                'Certification'
            );

        const expiry =
            escapeHTML(
                cert.expiry ||
                cert.expiry_date ||
                'N/A'
            );


        const item =
            document.createElement('div');

        item.className = 'cert-item';

        item.innerHTML = `

            <span class="material-symbols-outlined">
                verified
            </span>

            <div>

                <p class="cert-name">
                    ${name}
                </p>

                <p class="cert-exp">
                    Exp: ${expiry}
                </p>

            </div>

        `;

        certList.appendChild(item);

    });

}


// ============================================================
// CLEAR PROFILE
// ============================================================

function clearProfile() {

    if (profileName) {
        profileName.textContent =
            'No Staff Selected';
    }

    if (accuracyRate) {
        accuracyRate.textContent = '--';
    }

    if (turnaroundTime) {
        turnaroundTime.textContent = '--';
    }

}


// ============================================================
// DASHBOARD STATS
// ============================================================

function updateDashboardStats() {

    const totalStaff =
        staffMembers.length;

    const activeStaff =
        staffMembers.filter(
            staff =>
                String(staff.status || '')
                    .toLowerCase() === 'active'
        ).length;


    // --------------------------------------------------------
    // On Duty
    // --------------------------------------------------------

    const statCards =
        document.querySelectorAll('.stat-card');

    if (statCards.length > 0) {

        const dutyNumber =
            statCards[0]
                .querySelector('.stat-number');

        if (dutyNumber) {

            dutyNumber.innerHTML = `
                ${activeStaff}
                <span class="stat-total">
                    /${totalStaff}
                </span>
            `;

        }

    }


    // --------------------------------------------------------
    // Department Counts
    // --------------------------------------------------------

    const pathologists =
        staffMembers.filter(
            staff =>
                String(staff.role || '')
                    .toLowerCase()
                    .includes('pathologist')
        ).length;

    const technicians =
        staffMembers.filter(
            staff =>
                String(staff.role || '')
                    .toLowerCase()
                    .includes('technician')
        ).length;


    const tags =
        document.querySelectorAll(
            '.stat-tags .tag'
        );

    if (tags[0]) {

        tags[0].textContent =
            `${pathologists} Pathologists`;

    }

    if (tags[1]) {

        tags[1].textContent =
            `${technicians} Technicians`;

    }

}


// ============================================================
// ADD NEW STAFF
// ============================================================

async function addNewStaff() {

    const name =
        prompt('Enter staff name:');

    if (!name || !name.trim()) {
        return;
    }


    const role =
        prompt(
            'Enter role (e.g. Pathologist, Technician):'
        );

    if (!role || !role.trim()) {
        return;
    }


    const department =
        prompt('Enter department:');

    if (!department || !department.trim()) {
        return;
    }


    const email =
        prompt('Enter email:');

    if (!email || !email.trim()) {
        return;
    }


    try {

        showNotification(
            'Adding new staff...',
            'info'
        );


        const response =
            await fetch(
                '/api/staff/add/',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'X-CSRFToken':
                            getCookie('csrftoken'),

                        'Accept':
                            'application/json'
                    },

                    credentials:
                        'same-origin',

                    body: JSON.stringify({

                        name: name.trim(),

                        role: role.trim(),

                        department:
                            department.trim(),

                        email:
                            email.trim()

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Failed to add staff'
            );

        }


        if (data.status !== 'success') {

            throw new Error(
                data.message ||
                'Failed to add staff'
            );

        }


        showNotification(
            data.message ||
            'Staff added successfully.',
            'success'
        );


        await fetchStaffAndRoles();


    } catch (error) {

        console.error(
            'Add Staff Error:',
            error
        );

        showNotification(
            error.message ||
            'Failed to add staff.',
            'error'
        );

    }

}


// ============================================================
// FILTER STAFF
// ============================================================

function filterStaff() {

    renderStaff();

}


// ============================================================
// TOGGLE VIEW
// ============================================================

function toggleView() {

    const grid =
        document.querySelector('.staff-grid');

    if (!grid) {
        return;
    }


    const isList =
        grid.classList.toggle('list-view');


    const buttonIcon =
        document.querySelector(
            '.section-actions .action-btn:nth-child(2) .material-symbols-outlined'
        );


    if (buttonIcon) {

        buttonIcon.textContent =
            isList
                ? 'grid_view'
                : 'view_list';

    }

}


// ============================================================
// ADD ROLE
// ============================================================

async function addRole() {

    const name =
        prompt('Enter role name:');

    if (!name || !name.trim()) {
        return;
    }


    const desc =
        prompt('Enter role description:');

    if (!desc || !desc.trim()) {
        return;
    }


    try {

        showNotification(
            'Adding new role...',
            'info'
        );


        const response =
            await fetch(
                '/api/roles/add/',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'X-CSRFToken':
                            getCookie('csrftoken'),

                        'Accept':
                            'application/json'
                    },

                    credentials:
                        'same-origin',

                    body: JSON.stringify({

                        name:
                            name.trim(),

                        desc:
                            desc.trim()

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Failed to add role'
            );

        }


        if (data.status !== 'success') {

            throw new Error(
                data.message ||
                'Failed to add role'
            );

        }


        showNotification(
            data.message ||
            'Role added successfully.',
            'success'
        );


        await fetchStaffAndRoles();


    } catch (error) {

        console.error(
            'Add Role Error:',
            error
        );

        showNotification(
            error.message ||
            'Failed to add role.',
            'error'
        );

    }

}


// ============================================================
// AUDIT PERMISSIONS
// ============================================================

async function auditPermissions() {

    showNotification(
        'Opening permissions audit log...',
        'info'
    );


    try {

        const response =
            await fetch(
                '/api/permissions/audit/',
                {
                    method: 'GET',

                    headers: {
                        'Accept':
                            'application/json'
                    },

                    credentials:
                        'same-origin'
                }
            );


        if (!response.ok) {

            throw new Error(
                'Audit API unavailable'
            );

        }


        const data =
            await response.json();


        if (data.status === 'success') {

            showNotification(
                data.message ||
                'Audit log loaded successfully.',
                'success'
            );

        } else {

            showNotification(
                data.message ||
                'No audit information available.',
                'warning'
            );

        }


    } catch (error) {

        console.error(
            'Audit Error:',
            error
        );

        showNotification(
            'Audit log service is not available yet.',
            'warning'
        );

    }

}


// ============================================================
// SIDEBAR
// ============================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById('sidebar');

    if (!sidebar) {
        return;
    }


    const isOpen =
        sidebar.classList.toggle('mobile-open');


    if (isOpen) {

        sidebar.style.display = 'flex';

    } else {

        sidebar.style.display = '';

    }

}


// ============================================================
// CLOSE SIDEBAR OUTSIDE CLICK
// ============================================================

document.addEventListener(
    'click',
    function (event) {

        if (window.innerWidth >= 1024) {
            return;
        }


        const sidebar =
            document.getElementById('sidebar');

        const menuButton =
            document.querySelector('.menu-btn');


        if (!sidebar) {
            return;
        }


        if (
            sidebar.classList.contains(
                'mobile-open'
            ) &&
            !sidebar.contains(event.target) &&
            !menuButton?.contains(event.target)
        ) {

            sidebar.classList.remove(
                'mobile-open'
            );

            sidebar.style.display = '';

        }

    }
);


// ============================================================
// SEARCH
// ============================================================

function setupEventListeners() {

    if (staffSearch) {

        let searchTimeout;


        staffSearch.addEventListener(
            'input',
            function () {

                clearTimeout(
                    searchTimeout
                );


                searchTimeout =
                    setTimeout(
                        function () {
                            renderStaff();
                        },
                        250
                    );

            }
        );

    }

}


// ============================================================
// NOTIFICATION
// ============================================================

function showNotification(
    message,
    type = 'success',
    duration = 4000
) {

    const existing =
        document.querySelector(
            '.custom-notification'
        );

    if (existing) {
        existing.remove();
    }


    const colors = {

        success: '#16a34a',

        error: '#dc2626',

        warning: '#d97706',

        info: '#2563eb'

    };


    const notification =
        document.createElement('div');


    notification.className =
        'custom-notification';


    notification.style.cssText = `

        position: fixed;

        top: 80px;

        right: 20px;

        max-width: 420px;

        padding: 15px 20px;

        background:
            ${colors[type] || colors.success};

        color: #ffffff;

        border-radius: 12px;

        box-shadow:
            0 10px 30px rgba(0,0,0,.18);

        z-index: 99999;

        font-family: Inter, sans-serif;

        font-size: 14px;

        font-weight: 600;

        line-height: 1.5;

        animation:
            staffNotificationIn .3s ease;

    `;


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    if (!document.getElementById(
        'staffNotificationStyles'
    )) {

        const style =
            document.createElement('style');

        style.id =
            'staffNotificationStyles';


        style.textContent = `

            @keyframes staffNotificationIn {

                from {
                    opacity: 0;
                    transform:
                        translateX(100px);
                }

                to {
                    opacity: 1;
                    transform:
                        translateX(0);
                }

            }

            @keyframes staffNotificationOut {

                from {
                    opacity: 1;
                    transform:
                        translateX(0);
                }

                to {
                    opacity: 0;
                    transform:
                        translateX(100px);
                }

            }

            .staff-card.selected {

                outline:
                    2px solid #004ac6;

                outline-offset:
                    2px;

            }

            .staff-grid.list-view {

                grid-template-columns:
                    1fr !important;

            }

        `;


        document.head.appendChild(
            style
        );

    }


    setTimeout(
        function () {

            notification.style.animation =
                'staffNotificationOut .3s ease';


            setTimeout(
                function () {

                    notification.remove();

                },
                300
            );

        },
        duration
    );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener(
    'keydown',
    function (event) {

        // Ctrl + D
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'd'
        ) {

            event.preventDefault();

            toggleTheme();

        }


        // Ctrl + F
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'f'
        ) {

            event.preventDefault();

            if (staffSearch) {
                staffSearch.focus();
            }

        }


        // Ctrl + N
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'n'
        ) {

            event.preventDefault();

            addNewStaff();

        }

    }
);


// ============================================================
// CONSOLE
// ============================================================

console.log(
    '👥 Sita Path Lab - Staff Management'
);

console.log(
    '✅ Django backend integration active'
);


// ============================================================
// MODULE EXPORT
// ============================================================

if (
    typeof module !== 'undefined' &&
    module.exports
) {

    module.exports = {

        toggleTheme,

        fetchStaffAndRoles,

        renderStaff,

        renderRoles,

        updateProfile,

        addNewStaff,

        filterStaff,

        toggleView,

        addRole,

        auditPermissions,

        toggleSidebar

    };

}