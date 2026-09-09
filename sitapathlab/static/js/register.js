/**
 * Sita Path Lab - Register Patient
 * Django Backend Connected & UI Updated
 */

const patientIdDisplay = document.getElementById('patientIdDisplay');
const barcodeText = document.getElementById('barcodeText');
const photoUpload = document.getElementById('photoUpload');
const photoInput = document.getElementById('photoInput');

const fullName = document.getElementById('fullName');
const gender = document.getElementById('gender');
const age = document.getElementById('age');
const dob = document.getElementById('dob');
const bloodGroup = document.getElementById('bloodGroup');
const contact = document.getElementById('contact');
const address = document.getElementById('address');
const referringDoctor = document.getElementById('referringDoctor');
const referringHospital = document.getElementById('referringHospital');
const emergencyName = document.getElementById('emergencyName');
const emergencyPhone = document.getElementById('emergencyPhone');

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const icon = document.querySelector('.icon-btn .material-symbols-outlined');
    if (icon) {
        icon.textContent = isDark ? 'light_mode' : 'contrast';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const icon = document.querySelector('.icon-btn .material-symbols-outlined');
        if (icon) icon.textContent = 'light_mode';
    }
    generatePatientId();
});

function generatePatientId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    const id = `SPL-${year}-${random}`;

    if (patientIdDisplay) patientIdDisplay.textContent = id;
    if (barcodeText) barcodeText.textContent = `${id}-X`;
}

if (photoUpload && photoInput) {
    photoUpload.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showNotification('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
            photoInput.value = '';
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showNotification('Please upload a JPG or PNG image.', 'error');
            photoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            photoUpload.innerHTML = '';
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Patient Photo';
            photoUpload.appendChild(img);
            photoUpload.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    });
}

function validateForm() {
    let isValid = true;
    let errors = [];

    if (!fullName || !fullName.value.trim()) {
        errors.push('Full Name is required');
        if (fullName) fullName.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        fullName.style.borderColor = '';
    }

    if (!gender || !gender.value) {
        errors.push('Gender is required');
        if (gender) gender.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        gender.style.borderColor = '';
    }

    const ageValue = age ? parseInt(age.value, 10) : NaN;
    if (!age || isNaN(ageValue) || ageValue < 1 || ageValue > 150) {
        errors.push('Please enter a valid age (1-150)');
        if (age) age.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        age.style.borderColor = '';
    }

    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    const contactValue = contact ? contact.value.replace(/\s/g, '') : '';
    if (!contact || !contactValue || !phoneRegex.test(contactValue)) {
        errors.push('Please enter a valid phone number (10-15 digits)');
        if (contact) contact.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        contact.style.borderColor = '';
    }

    if (!emergencyName || !emergencyName.value.trim()) {
        errors.push('Emergency contact name is required');
        if (emergencyName) emergencyName.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        emergencyName.style.borderColor = '';
    }

    const emergencyPhoneValue = emergencyPhone ? emergencyPhone.value.replace(/\s/g, '') : '';
    if (!emergencyPhone || !emergencyPhoneValue || !phoneRegex.test(emergencyPhoneValue)) {
        errors.push('Please enter a valid emergency phone number (10-15 digits)');
        if (emergencyPhone) emergencyPhone.style.borderColor = '#ba1a1a';
        isValid = false;
    } else {
        emergencyPhone.style.borderColor = '';
    }

    if (!isValid) {
        showNotification(errors.join('\n• '), 'error');
    }

    return isValid;
}

async function savePatient() {
    if (!validateForm()) return false;

    const patientData = {
        full_name: fullName.value.trim(),
        gender: gender.value.toLowerCase(),
        age: parseInt(age.value, 10),
        dob: dob.value || null,
        blood_group: bloodGroup.value || '',
        contact: contact.value.trim(),
        address: address.value.trim(),
        referring_doctor: referringDoctor.value.trim(),
        referring_hospital: referringHospital.value.trim(),
        emergency_name: emergencyName.value.trim(),
        emergency_phone: emergencyPhone.value.trim(),
    };

    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) csrftoken = csrfInput.value;
    }

    try {
        showNotification('Saving patient to database...', 'info');

        const response = await fetch('/api/patients/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': csrftoken || ''
            },
            body: JSON.stringify(patientData)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Server returned an invalid response.');
        }

        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Failed to save patient.';
            throw new Error(errorMessage);
        }

        showNotification(`Patient ${patientData.full_name} registered successfully!`, 'success');

        let patients = JSON.parse(localStorage.getItem('patients') || '[]');
        patients.push({
            ...patientData,
            id: data.id || 'SPL-DB'
        });
        localStorage.setItem('patients', JSON.stringify(patients));

        resetFormFieldsOnly();
        generatePatientId();
        return true;

    } catch (error) {
        showNotification(error.message || 'Failed to connect to server.', 'error');
        return false;
    }
}

async function saveAndPrint() {
    if (!validateForm()) return;
    const saved = await savePatient();
    if (saved) {
        setTimeout(printLabel, 500);
    }
}

function printLabel() {
    const patientName = fullName.value.trim() || 'Unknown';
    const patientId = patientIdDisplay ? patientIdDisplay.textContent : '';

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) {
        showNotification('Please allow pop-ups to print the label.', 'warning');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Label - ${patientId}</title>
        </head>
        <body>
            <div>
                <div>Sita Path Lab - Specimen Label</div>
                <div>${patientId}</div>
                <div>${patientName}</div>
                <div>${patientId}-X</div>
                <div>DOB: ${dob.value || 'N/A'} | Gender: ${gender.value || 'N/A'}</div>
                <div>Blood: ${bloodGroup.value || 'N/A'}</div>
                <div>Registered: ${new Date().toLocaleDateString()}</div>
                <div>Contact: ${contact.value || 'N/A'}</div>
                <div>Emergency: ${emergencyPhone.value || 'N/A'}</div>
                <button onclick="window.print()">Print Label</button>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function resetFormFieldsOnly() {
    fullName.value = '';
    gender.value = '';
    age.value = '';
    dob.value = '';
    bloodGroup.value = '';
    contact.value = '';
    address.value = '';
    referringDoctor.value = '';
    referringHospital.value = '';
    emergencyName.value = '';
    emergencyPhone.value = '';

    if (photoUpload) {
        photoUpload.innerHTML = `
            <span class="material-symbols-outlined photo-icon">add_a_photo</span>
            <p class="photo-text">Click to upload or capture</p>
        `;
        photoUpload.classList.remove('has-image');
    }

    if (photoInput) photoInput.value = '';

    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
        el.style.borderColor = '';
    });
}

function resetForm() {
    if (!confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        return;
    }
    resetFormFieldsOnly();
    generatePatientId();
    showNotification('Form has been reset', 'info');
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '999999',
        padding: '14px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        maxWidth: '420px',
        whiteSpace: 'pre-line',
        boxShadow: '0 5px 20px rgba(0,0,0,0.15)'
    });

    const backgrounds = {
        success: { bg: '#198754', color: '#ffffff' },
        error: { bg: '#dc3545', color: '#ffffff' },
        warning: { bg: '#ffc107', color: '#000000' },
        info: { bg: '#0d6efd', color: '#ffffff' }
    };

    const config = backgrounds[type] || backgrounds.info;
    notification.style.background = config.bg;
    notification.style.color = config.color;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        savePatient();
    }

    if (e.key === 'Escape') {
        if (confirm('Press OK to reset the form, Cancel to continue')) {
            resetForm();
        }
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        savePatient,
        resetForm,
        toggleTheme,
        generatePatientId
    };
}