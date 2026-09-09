/* =========================================================
   SITA PATH LAB - BILLING SYSTEM
   Django Backend Connected - Production Version
   ========================================================= */

'use strict';


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let selectedTests = [];        // [{id, name, price}]
let discountPercentage = 0;
let currentPaymentMethod = 'upi';
let currentInvoiceId = null;   // set after successful invoice creation

let testsCatalog = [];         // fetched from /api/tests/
let patientsCatalog = [];      // fetched from /api/patients/

const VALID_DISCOUNT_CODES = {
  'SAVE10': 10,
  'SAVE20': 20,
  'WELCOME5': 5
};

const GST_RATE = 0.12;


/* =========================================================
   DOM REFERENCES
   ========================================================= */

let invoiceForm;
let testTagsContainer;
let subtotalElement;
let discountElement;
let discountLabelElement;
let gstElement;
let totalElement;
let patientSelect;
let testPicker;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', async function () {

  initializeDOM();
  loadSavedTheme();
  setupEventListeners();

  await ensureCSRFCookie();

  await Promise.all([
    loadPatients(),
    loadDoctors(),
    loadTests()
  ]);

  updateTotals();
  renderTestsTable();
  updatePreview();

});


/* =========================================================
   DOM INITIALIZATION
   ========================================================= */

function initializeDOM() {

  invoiceForm = document.getElementById('invoiceForm');
  testTagsContainer = document.getElementById('testTagsContainer');
  subtotalElement = document.getElementById('subtotal');
  discountElement = document.getElementById('discountAmount');
  discountLabelElement = document.getElementById('discountLabel');
  gstElement = document.getElementById('gstAmount');
  totalElement = document.getElementById('netTotal');
  patientSelect = document.getElementById('patientSelect');
  testPicker = document.getElementById('testPicker');

}


/* =========================================================
   CSRF TOKEN
   ========================================================= */

function getCookie(name) {

  const cookies = document.cookie ? document.cookie.split(';') : [];

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;

}


function getCSRFToken() {

  const cookieToken = getCookie('csrftoken');
  if (cookieToken) return cookieToken;

  const csrfInput = document.querySelector('[name="csrfmiddlewaretoken"]');
  if (csrfInput) return csrfInput.value;

  return null;

}


async function ensureCSRFCookie() {

  try {
    await fetch('/api/csrf/', {
      method: 'GET',
      credentials: 'same-origin'
    });
  } catch (err) {
    console.warn('Could not pre-fetch CSRF cookie:', err);
  }

}


/* =========================================================
   COMMON API REQUEST
   ========================================================= */

async function apiRequest(url, options = {}) {

  const method = (options.method || 'GET').toUpperCase();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'same-origin'
  });

  let data;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = {
      status: response.ok ? 'success' : 'error',
      message: text
    };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Server error: ${response.status}`);
  }

  return data;

}


/* =========================================================
   LOAD PATIENTS
   ========================================================= */

async function loadPatients() {

  if (!patientSelect) return;

  try {

    const data = await apiRequest('/api/patients/');

    patientsCatalog = Array.isArray(data.patients) ? data.patients : [];

    patientSelect.innerHTML =
      '<option value="">Walk-in / search or select patient...</option>';

    patientsCatalog.forEach(function (patient) {

      const option = document.createElement('option');

      option.value = patient.patientId || patient.id;
      option.textContent =
        `${patient.fullName} (ID: ${patient.patientId})`;

      option.dataset.name = patient.fullName;
      option.dataset.phone = patient.phone || '';
      option.dataset.dbId = patient.databaseId || '';

      patientSelect.appendChild(option);

    });

  } catch (error) {

    console.error('Failed to load patients:', error);
    showNotification('Could not load patient list.', 'error');

  }

}


/* =========================================================
   LOAD DOCTORS
   ========================================================= */

async function loadDoctors() {

  const datalist = document.getElementById('doctorsList');
  if (!datalist) return;

  try {

    const data = await apiRequest('/api/doctors/');
    const doctors = Array.isArray(data.doctors) ? data.doctors : [];

    datalist.innerHTML = '';

    doctors.forEach(function (doctor) {

      const option = document.createElement('option');
      option.value = doctor.name;
      datalist.appendChild(option);

    });

  } catch (error) {

    console.error('Failed to load doctors:', error);

  }

}


/* =========================================================
   LOAD TESTS
   ========================================================= */

async function loadTests() {

  if (!testPicker) return;

  try {

    const data = await apiRequest('/api/tests/');

    // get_tests view returns a raw JSON array (not wrapped in "status")
    testsCatalog = Array.isArray(data) ? data : (data.tests || []);

    if (!testsCatalog.length) {
      testPicker.innerHTML = '<option value="">No active tests found</option>';
      return;
    }

    testPicker.innerHTML = '<option value="">Select a test to add...</option>';

    testsCatalog.forEach(function (test) {

      const option = document.createElement('option');

      option.value = test.id;
      option.textContent = `${test.name} - ₹${Number(test.price).toFixed(2)}`;

      option.dataset.name = test.name;
      option.dataset.price = test.price;

      testPicker.appendChild(option);

    });

  } catch (error) {

    console.error('Failed to load tests:', error);
    testPicker.innerHTML = '<option value="">Failed to load tests</option>';
    showNotification('Could not load test catalog.', 'error');

  }

}


/* =========================================================
   PATIENT SELECTION
   ========================================================= */

function handlePatientSelectChange() {

  const selectedOption = patientSelect.options[patientSelect.selectedIndex];

  const patientNameInput = document.getElementById('patientName');
  const patientPhoneInput = document.getElementById('patientPhone');
  const patientIdInput = document.getElementById('patientId');

  if (!selectedOption || !selectedOption.value) {

    // Walk-in — clear auto-filled fields, allow manual entry
    if (patientIdInput) patientIdInput.value = '';
    return;

  }

  if (patientNameInput) patientNameInput.value = selectedOption.dataset.name || '';
  if (patientPhoneInput) patientPhoneInput.value = selectedOption.dataset.phone || '';
  if (patientIdInput) patientIdInput.value = selectedOption.value;

  updatePreview();

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

  document.body.classList.toggle('dark');

  const isDark = document.body.classList.contains('dark');

  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  updateThemeIcon(isDark);

}


function updateThemeIcon(isDark) {

  const icon = document.querySelector('.icon-btn .material-symbols-outlined');

  if (icon) {
    icon.textContent = isDark ? 'light_mode' : 'contrast';
  }

}


function loadSavedTheme() {

  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    updateThemeIcon(true);
  } else {
    updateThemeIcon(false);
  }

}


/* =========================================================
   ADD TEST (from picker dropdown)
   ========================================================= */

function handleAddTest() {

  if (!testPicker || !testPicker.value) {
    showNotification('Please select a test first.', 'error');
    return;
  }

  const selectedOption = testPicker.options[testPicker.selectedIndex];

  addTest(
    selectedOption.dataset.name,
    selectedOption.dataset.price,
    selectedOption.value
  );

  testPicker.value = '';

}


function addTest(name, price, id = null) {

  if (!name) {
    showNotification('Test name is required.', 'error');
    return;
  }

  const numericPrice = parseFloat(price);

  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    showNotification('Invalid test price.', 'error');
    return;
  }

  selectedTests.push({
    id: id,
    name: String(name).trim(),
    price: numericPrice
  });

  renderTestsTable();
  updateTotals();
  updatePreview();

  showNotification(`${name} added to bill.`, 'info');

}


/* =========================================================
   REMOVE TEST
   ========================================================= */

function removeTest(index) {

  if (index < 0 || index >= selectedTests.length) {
    return;
  }

  const removed = selectedTests.splice(index, 1)[0];

  renderTestsTable();
  updateTotals();
  updatePreview();

  showNotification(`${removed?.name || 'Test'} removed.`, 'warning');

}


/* =========================================================
   RENDER SELECTED TEST TAGS
   ========================================================= */

function renderTestsTable() {

  if (!testTagsContainer) return;

  testTagsContainer.innerHTML = '';

  if (!selectedTests.length) {

    testTagsContainer.innerHTML =
      '<p style="color:#737686; font-size:13px; padding:8px 0;">No tests selected yet.</p>';

    return;

  }

  selectedTests.forEach(function (test, index) {

    const tag = document.createElement('div');
    tag.className = 'test-tag';

    tag.innerHTML = `
      ${escapeHTML(test.name)} &nbsp;<strong>₹${test.price.toFixed(2)}</strong>
      <button class="remove-test" type="button" onclick="removeTest(${index})">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;

    testTagsContainer.appendChild(tag);

  });

}


/* =========================================================
   DISCOUNT
   ========================================================= */

function applyDiscountCode() {

  const codeInput = document.getElementById('discountCode');
  const code = (codeInput?.value || '').trim().toUpperCase();

  if (!code) {
    discountPercentage = 0;
    updateTotals();
    updatePreview();
    return;
  }

  if (!(code in VALID_DISCOUNT_CODES)) {
    showNotification('Invalid discount code.', 'error');
    return;
  }

  discountPercentage = VALID_DISCOUNT_CODES[code];

  updateTotals();
  updatePreview();

  showNotification(`${discountPercentage}% discount applied.`, 'success');

}


/* =========================================================
   PAYMENT METHOD
   ========================================================= */

function selectPayment(method, button = null) {

  if (!method) return;

  currentPaymentMethod = String(method).toLowerCase();

  document.querySelectorAll('.payment-btn').forEach(function (btn) {
    btn.classList.remove('active');
  });

  if (button) {
    button.classList.add('active');
  } else {
    const matchingButton = document.querySelector(
      `.payment-btn[data-method="${currentPaymentMethod}"]`
    );
    if (matchingButton) matchingButton.classList.add('active');
  }

}


/* =========================================================
   TOTAL CALCULATION
   ========================================================= */

function calculateBill() {

  const subtotal = selectedTests.reduce(function (sum, test) {
    return sum + Number(test.price || 0);
  }, 0);

  const discountAmount = (subtotal * discountPercentage) / 100;

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const gstAmount = taxableAmount * GST_RATE;

  const total = taxableAmount + gstAmount;

  return { subtotal, discountAmount, gstAmount, total };

}


/* =========================================================
   UPDATE TOTALS
   ========================================================= */

function updateTotals() {

  const { subtotal, discountAmount, gstAmount, total } = calculateBill();

  if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
  if (discountLabelElement) discountLabelElement.textContent = `Discount (${discountPercentage}%)`;
  if (discountElement) discountElement.textContent = `-₹${discountAmount.toFixed(2)}`;
  if (gstElement) gstElement.textContent = `₹${gstAmount.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`;

}


/* =========================================================
   LIVE PREVIEW UPDATE
   ========================================================= */

function updatePreview() {

  const { subtotal, total } = calculateBill();

  const patientName = document.getElementById('patientName')?.value || '--';
  const patientPhone = document.getElementById('patientPhone')?.value || '--';

  const previewPatientName = document.getElementById('previewPatientName');
  const previewPatientPhone = document.getElementById('previewPatientPhone');

  if (previewPatientName) previewPatientName.textContent = `Name: ${patientName}`;
  if (previewPatientPhone) previewPatientPhone.textContent = `Phone: ${patientPhone}`;

  const previewItemsBody = document.getElementById('previewItemsBody');

  if (previewItemsBody) {

    if (!selectedTests.length) {

      previewItemsBody.innerHTML =
        '<tr><td colspan="2" style="text-align:center; color:#737686;">No tests added yet</td></tr>';

    } else {

      previewItemsBody.innerHTML = selectedTests.map(function (test) {
        return `
          <tr>
            <td>${escapeHTML(test.name)}</td>
            <td class="text-right">₹${test.price.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

    }

  }

  const previewSubtotal = document.getElementById('previewSubtotal');
  const previewTotal = document.getElementById('previewTotal');

  if (previewSubtotal) previewSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (previewTotal) previewTotal.textContent = `₹${total.toFixed(2)}`;

}


/* =========================================================
   CREATE INVOICE
   ========================================================= */

async function createInvoice() {

  if (!invoiceForm) {
    showNotification('Invoice form not found.', 'error');
    return;
  }

  const patientName = document.getElementById('patientName')?.value.trim();
  const phone = document.getElementById('patientPhone')?.value.trim();
  const doctorName = document.getElementById('referringDoctor')?.value.trim();
  const patientId = document.getElementById('patientId')?.value.trim();

  /* ---------------------------------------------------------
     VALIDATION
     --------------------------------------------------------- */

  if (!patientName) {
    showNotification('Please enter patient name.', 'error');
    document.getElementById('patientName')?.focus();
    return;
  }

  if (!selectedTests.length) {
    showNotification('Please select at least one test.', 'error');
    return;
  }

  if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    showNotification('Please enter a valid phone number.', 'error');
    return;
  }

  const { subtotal, discountAmount, total } = calculateBill();

  const payload = {
    patientId: patientId || undefined,
    patientName: patientName,
    phone: phone || '',
    doctorName: doctorName || '',
    tests: selectedTests.map(function (test) {
      return {
        name: test.name,
        price: Number(test.price),
        quantity: 1
      };
    }),
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discountAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    paymentMethod: currentPaymentMethod
  };

  const submitButton = invoiceForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.innerHTML;
    submitButton.innerHTML = 'Generating Invoice...';
  }

  try {

    // NOTE: matches urls.py -> path("api/invoices/create/", views.create_invoice)
    const data = await apiRequest('/api/invoices/create/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data.status === 'success') {

      showNotification(data.message || 'Invoice generated successfully.', 'success');

      currentInvoiceId = data.invoice_id || null;

      if (currentInvoiceId) {

        const invoiceIdLabel = document.getElementById('invoiceIdLabel');
        if (invoiceIdLabel) invoiceIdLabel.textContent = `INV-${currentInvoiceId}`;

        prependRecentInvoice({
          id: currentInvoiceId,
          patientName: patientName,
          total: total,
          paymentMethod: currentPaymentMethod
        });

      }

      setTimeout(function () {
        resetBillingForm();
      }, 1200);

    } else {

      showNotification(data.message || data.error || 'Failed to generate invoice.', 'error');

    }

  } catch (error) {

    console.error('Invoice creation error:', error);
    showNotification(error.message || 'Server connection error.', 'error');

  } finally {

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = submitButton.dataset.originalText || 'GENERATE INVOICE';
    }

  }

}


/* =========================================================
   RECENT INVOICES (client-side session list)
   NOTE: backend currently has no "list invoices" endpoint,
   so this only shows invoices created in this browser session.
   Add a GET /api/invoices/ view + urls.py route to make this
   fully persistent across reloads.
   ========================================================= */

function prependRecentInvoice(invoice) {

  const tbody = document.getElementById('recentInvoicesBody');
  if (!tbody) return;

  if (tbody.children.length === 1 && tbody.children[0].children.length === 1) {
    tbody.innerHTML = '';
  }

  const row = document.createElement('tr');

  row.innerHTML = `
    <td class="font-semibold">INV-${invoice.id}</td>
    <td>${escapeHTML(invoice.patientName)}</td>
    <td>${new Date().toLocaleDateString('en-IN')}</td>
    <td class="font-semibold">₹${invoice.total.toFixed(2)}</td>
    <td><span class="status-badge paid">Paid</span></td>
    <td>
      <button class="more-btn" onclick="window.open('/api/invoices/${invoice.id}/pdf/', '_blank')" title="Download PDF">
        <span class="material-symbols-outlined">download</span>
      </button>
    </td>
  `;

  tbody.prepend(row);

}


/* =========================================================
   FORM SUBMIT
   ========================================================= */

function handleInvoiceSubmit(e) {
  e.preventDefault();
  createInvoice();
}


/* =========================================================
   RESET BILLING FORM
   ========================================================= */

function resetBillingForm() {

  selectedTests = [];
  discountPercentage = 0;
  currentPaymentMethod = 'upi';
  currentInvoiceId = null;

  if (invoiceForm) invoiceForm.reset();

  const patientIdInput = document.getElementById('patientId');
  if (patientIdInput) patientIdInput.value = '';

  const invoiceIdLabel = document.getElementById('invoiceIdLabel');
  if (invoiceIdLabel) invoiceIdLabel.textContent = 'NEW INVOICE';

  document.querySelectorAll('.payment-btn').forEach(function (btn) {
    btn.classList.remove('active');
  });

  const defaultButton = document.querySelector('.payment-btn[data-method="upi"]');
  if (defaultButton) defaultButton.classList.add('active');

  renderTestsTable();
  updateTotals();
  updatePreview();

}


/* =========================================================
   PRINT / PDF
   ========================================================= */

function downloadPDF() {

  // If invoice already saved on the server, fetch the real generated PDF
  if (currentInvoiceId) {
    window.open(`/api/invoices/${currentInvoiceId}/pdf/`, '_blank');
    return;
  }

  if (!selectedTests.length) {
    showNotification('No tests selected for invoice.', 'error');
    return;
  }

  showNotification('Generate the invoice first to get a server PDF. Opening print preview instead...', 'info');

  fillPrintTemplate();

  setTimeout(function () {
    window.print();
  }, 300);

}


function fillPrintTemplate() {

  const { subtotal, total } = calculateBill();

  const patientName = document.getElementById('patientName')?.value || '--';
  const patientPhone = document.getElementById('patientPhone')?.value || '--';
  const doctorName = document.getElementById('referringDoctor')?.value || 'Self Referral';

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('printPatientName', patientName);
  setText('printPatientPhone', `Mobile: ${patientPhone}`);
  setText('printDoctorName', doctorName || 'Self Referral');
  setText('printCollectionDate', new Date().toLocaleString('en-IN'));
  setText('printInvoiceDate', `Date: ${new Date().toLocaleDateString('en-IN')}`);
  setText('printInvoiceId', currentInvoiceId ? `#INV-${currentInvoiceId}` : '#NEW');
  setText('printSubtotal', `₹${subtotal.toFixed(2)}`);
  setText('printGrandTotal', `₹${total.toFixed(2)}`);

  const printItemsBody = document.getElementById('printItemsBody');

  if (printItemsBody) {

    printItemsBody.innerHTML = selectedTests.map(function (test) {
      return `
        <tr>
          <td>${escapeHTML(test.name)}</td>
          <td class="text-right">₹${test.price.toFixed(2)}</td>
          <td class="text-right">₹${test.price.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

  }

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(message, type = 'success') {

  const existing = document.querySelector('.custom-notification');
  if (existing) existing.remove();

  const colors = {
    success: '#16a34a',
    error: '#ba1a1a',
    warning: '#d97706',
    info: '#004ac6'
  };

  const notification = document.createElement('div');
  notification.className = 'custom-notification';

  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${colors[type] || colors.success};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 99999;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
    line-height: 1.6;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  if (!document.getElementById('billingNotificationStyles')) {

    const style = document.createElement('style');
    style.id = 'billingNotificationStyles';

    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
      }
      @media print {
        .custom-notification { display: none !important; }
      }
    `;

    document.head.appendChild(style);

  }

  setTimeout(function () {

    if (!notification.isConnected) return;

    notification.style.animation = 'slideOutRight 0.3s ease';

    setTimeout(function () {
      if (notification.isConnected) notification.remove();
    }, 300);

  }, 4000);

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener('keydown', function (e) {

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    toggleTheme();
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (invoiceForm) {
      invoiceForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }

  if (e.key === 'Escape') {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

});


/* =========================================================
   TABLE HOVER EFFECT
   ========================================================= */

function setupTableHover() {

  document.querySelectorAll('.invoice-table tbody tr').forEach(function (row) {

    row.addEventListener('mouseenter', function () {
      row.style.transform = 'translateX(4px)';
      row.style.transition = 'transform 0.2s';
    });

    row.addEventListener('mouseleave', function () {
      row.style.transform = 'translateX(0)';
    });

  });

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

  if (invoiceForm) {
    invoiceForm.addEventListener('submit', handleInvoiceSubmit);
  }

  if (patientSelect) {
    patientSelect.addEventListener('change', handlePatientSelectChange);
  }

  const patientNameInput = document.getElementById('patientName');
  const patientPhoneInput = document.getElementById('patientPhone');

  if (patientNameInput) patientNameInput.addEventListener('input', updatePreview);
  if (patientPhoneInput) patientPhoneInput.addEventListener('input', updatePreview);

  document.querySelectorAll('.payment-btn').forEach(function (button) {

    button.addEventListener('click', function () {

      const method = button.dataset.method || button.getAttribute('data-method');

      if (method) {
        selectPayment(method, button);
      }

    });

  });

  setupTableHover();

}


/* =========================================================
   HTML SECURITY HELPERS
   ========================================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


/* =========================================================
   CONSOLE
   ========================================================= */

console.log('💰 Sita Path Lab - Billing System');
console.log('✅ Django API billing frontend initialized (production)');
console.log('💡 Shortcuts: Ctrl+D | Ctrl+S | Escape');


/* =========================================================
   MODULE EXPORT
   ========================================================= */

if (typeof module !== 'undefined' && module.exports) {

  module.exports = {
    toggleTheme,
    addTest,
    removeTest,
    applyDiscountCode,
    selectPayment,
    updateTotals,
    calculateBill,
    createInvoice,
    downloadPDF,
    resetBillingForm
  };

}