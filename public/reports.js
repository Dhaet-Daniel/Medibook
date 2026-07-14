// Reports page logic
document.addEventListener('DOMContentLoaded', () => {
  initReportsTabs();
  initAppointmentsFilter();
  loadAppointments();
  loadPrescriptions();
  loadMedicalSummary();
  loadBilling();
  initMedicalSummaryForm();
});

// ---------- TABS ----------
function initReportsTabs() {
  const tabs = document.querySelectorAll('.reports-tabs .tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      contents.forEach(c => c.classList.remove('active'));
      document.getElementById(`${target}-tab`).classList.add('active');
    });
  });
}

// ---------- APPOINTMENT HISTORY ----------
let allAppointments = [];
let filteredAppointments = [];

function initAppointmentsFilter() {
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  document.getElementById('export-csv').addEventListener('click', exportCSV);
}

async function loadAppointments() {
  const container = document.getElementById('appointments-table-container');
  try {
    const res = await fetch('/api/appointments', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    allAppointments = await res.json();
    // Populate doctor filter
    const docSelect = document.getElementById('filter-doctor');
    const doctors = [...new Set(allAppointments.map(a => a.doctorName))];
    doctors.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      docSelect.appendChild(opt);
    });
    applyFilters();
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function applyFilters() {
  const from = document.getElementById('filter-from').value;
  const to = document.getElementById('filter-to').value;
  const doctor = document.getElementById('filter-doctor').value;
  const status = document.getElementById('filter-status').value;

  filteredAppointments = allAppointments.filter(a => {
    let match = true;
    if (from && new Date(a.date) < new Date(from)) match = false;
    if (to && new Date(a.date) > new Date(to)) match = false;
    if (doctor && a.doctorName !== doctor) match = false;
    if (status && a.status !== status) match = false;
    return match;
  });
  renderAppointmentsTable(filteredAppointments);
  updateSummaryCards(filteredAppointments);
}

function clearFilters() {
  document.getElementById('filter-from').value = '';
  document.getElementById('filter-to').value = '';
  document.getElementById('filter-doctor').value = '';
  document.getElementById('filter-status').value = '';
  applyFilters();
}

function renderAppointmentsTable(appts) {
  const container = document.getElementById('appointments-table-container');
  if (!appts.length) {
    container.innerHTML = `<div class="empty-state">No appointments match your filters.</div>`;
    return;
  }
  const rows = appts.map(a => `
    <tr>
      <td>${new Date(a.date).toLocaleDateString()}</td>
      <td>${a.doctorName}</td>
      <td>${a.time}</td>
      <td><span class="status-badge status-badge--${a.status}">${a.status}</span></td>
      <td>${a.reason || '—'}</td>
    </tr>
  `).join('');
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Date</th><th>Doctor</th><th>Time</th><th>Status</th><th>Reason</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function updateSummaryCards(appts) {
  const total = appts.length;
  const upcoming = appts.filter(a => a.status === 'upcoming').length;
  const completed = appts.filter(a => a.status === 'completed').length;
  const cancelled = appts.filter(a => a.status === 'cancelled').length;
  document.getElementById('total-appts').textContent = total;
  document.getElementById('upcoming-appts').textContent = upcoming;
  document.getElementById('completed-appts').textContent = completed;
  document.getElementById('cancelled-appts').textContent = cancelled;
}

function exportCSV() {
  if (!filteredAppointments.length) {
    showNotification('No data to export', 'error');
    return;
  }
  const headers = ['Date', 'Doctor', 'Time', 'Status', 'Reason'];
  const rows = filteredAppointments.map(a => [
    new Date(a.date).toLocaleDateString(),
    a.doctorName,
    a.time,
    a.status,
    a.reason || ''
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `appointments_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------- PRESCRIPTIONS ----------
async function loadPrescriptions() {
  const container = document.getElementById('prescriptions-list');
  try {
    const res = await fetch('/api/prescriptions', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load prescriptions');
    const prescriptions = await res.json();
    if (!prescriptions.length) {
      container.innerHTML = `<div class="empty-state">No prescriptions available.</div>`;
      return;
    }
    const html = prescriptions.map(p => `
      <div class="prescription-card">
        <div><strong>${p.medication}</strong> – ${p.dosage}</div>
        <div>Doctor: ${p.doctorName}</div>
        <div>Date: ${new Date(p.date).toLocaleDateString()}</div>
        <div>Instructions: ${p.instructions || '—'}</div>
      </div>
    `).join('');
    container.innerHTML = `<div class="prescriptions-grid">${html}</div>`;
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// ---------- MEDICAL SUMMARY ----------
async function loadMedicalSummary() {
  try {
    const res = await fetch('/api/patient/medical-summary', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load medical summary');
    const data = await res.json();
    document.getElementById('blood-type').value = data.bloodType || '';
    document.getElementById('allergies').value = data.allergies || '';
    document.getElementById('conditions').value = data.conditions || '';
    document.getElementById('diagnoses').value = data.diagnoses || '';
  } catch (err) {
    showNotification('Could not load medical summary', 'error');
  }
}

function initMedicalSummaryForm() {
  document.getElementById('medical-summary-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      bloodType: document.getElementById('blood-type').value,
      allergies: document.getElementById('allergies').value,
      conditions: document.getElementById('conditions').value,
      diagnoses: document.getElementById('diagnoses').value
    };
    try {
      const res = await fetch('/api/patient/medical-summary', {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Save failed');
      showNotification('Medical summary updated', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

// ---------- BILLING ----------
async function loadBilling() {
  const container = document.getElementById('billing-list');
  try {
    const res = await fetch('/api/billing/invoices', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load billing');
    const invoices = await res.json();
    if (!invoices.length) {
      container.innerHTML = `<div class="empty-state">No invoices found.</div>`;
      return;
    }
    const rows = invoices.map(inv => `
      <tr>
        <td>${inv.invoiceNumber}</td>
        <td>${new Date(inv.date).toLocaleDateString()}</td>
        <td>$${inv.amount.toFixed(2)}</td>
        <td><span class="status-badge status-badge--${inv.status}">${inv.status}</span></td>
        <td>${inv.description}</td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th><th>Description</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}