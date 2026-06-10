/**
 * NurseCare - Visit Management Module
 */

let visitMedicines = [];

async function renderVisits() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <input type="date" id="visitDateFilter" value="${UI.today()}"
          class="form-input w-40 text-sm" onchange="loadVisitList()" />
        <input type="text" id="visitSearch" placeholder="Search employee ID or name…"
          class="form-input w-56 text-sm" oninput="filterVisits()" />
      </div>
      <button onclick="showNewVisitModal()" class="btn btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        New Visit
      </button>
    </div>
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Visit Records</span>
        <span id="visitCount" class="text-xs text-slate-400"></span>
      </div>
      <div id="visitList">
        <div class="spinner mx-auto my-10"></div>
      </div>
    </div>`;

  loadVisitList();
}

let allVisits = [];

async function loadVisitList() {
  const date = document.getElementById('visitDateFilter')?.value;
  UI.loading('visitList');

  try {
    const data = await API.visits.list({ date });
    allVisits = data?.records || [];
    renderVisitTable(allVisits);
  } catch (e) {
    UI.error('Failed to load visits');
  }
}

function filterVisits() {
  const q = document.getElementById('visitSearch')?.value?.toLowerCase();
  if (!q) { renderVisitTable(allVisits); return; }
  renderVisitTable(allVisits.filter(v =>
    v.employee_id?.toLowerCase().includes(q) ||
    v.employee_name?.toLowerCase().includes(q) ||
    v.department?.toLowerCase().includes(q)
  ));
}

function renderVisitTable(visits) {
  const el = document.getElementById('visitList');
  const count = document.getElementById('visitCount');
  if (count) count.textContent = `${visits.length} records`;

  if (!visits.length) {
    UI.empty('visitList', 'No visit records found.', '🏥');
    return;
  }

  el.innerHTML = UI.table([
    { key: 'employee_id',   label: 'Employee ID' },
    { key: 'employee_name', label: 'Name' },
    { key: 'department',    label: 'Department' },
    { key: 'symptoms',      label: 'Symptoms', render: r => `<span class="truncate max-w-xs block" title="${r.symptoms}">${r.symptoms || '—'}</span>` },
    { key: 'visit_time',    label: 'Time' },
    { key: 'nurse_name',    label: 'Nurse' },
    { key: 'status',        label: 'Status', render: r => UI.badge(r.status || 'ACTIVE', r.status === 'ACTIVE' ? 'info' : 'neutral') },
    { key: 'actions',       label: '', render: r => `
      <button onclick="viewVisitDetail('${r.id}')" class="btn btn-xs btn-secondary mr-1">View</button>
    `}
  ], visits);
}

async function showNewVisitModal() {
  // Load medicines for dispensing
  const medsData = await API.medicines.list();
  const medicines = medsData?.records || [];
  visitMedicines = [];

  const medicineOptions = medicines.map(m =>
    `<option value="${m.id}" data-name="${m.name}" data-unit="${m.unit}">
      ${m.name} (Stock: ${m.stock_quantity} ${m.unit})
    </option>`
  ).join('');

  UI.modal('New Nurse Visit', `
    <form id="visitForm" class="space-y-4">
      <!-- Employee Search -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Employee ID *</label>
          <div class="flex gap-2">
            <input name="employee_id" class="form-input" placeholder="EMP001" required />
            <button type="button" onclick="searchEmployeeForVisit()" class="btn btn-outline flex-shrink-0">Search</button>
          </div>
        </div>
        <div>
          <label class="form-label">Employee Name</label>
          <input name="employee_name" id="visitEmpName" class="form-input bg-slate-50" readonly placeholder="Auto-filled" />
        </div>
      </div>
      <div>
        <label class="form-label">Department</label>
        <input name="department" id="visitEmpDept" class="form-input bg-slate-50" readonly placeholder="Auto-filled" />
      </div>

      <!-- Symptoms -->
      <div>
        <label class="form-label">Symptoms *</label>
        <input name="symptoms" class="form-input" placeholder="e.g. Headache, Fever, Cough" required />
        <p class="text-xs text-slate-400 mt-1">Separate multiple symptoms with commas</p>
      </div>

      <!-- Vital Signs -->
      <div>
        <p class="form-label text-slate-600 font-semibold">Vital Signs</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="form-label">Systolic (mmHg)</label>
            <input name="blood_pressure_systolic" type="number" class="form-input" placeholder="120" />
          </div>
          <div>
            <label class="form-label">Diastolic (mmHg)</label>
            <input name="blood_pressure_diastolic" type="number" class="form-input" placeholder="80" />
          </div>
          <div>
            <label class="form-label">Temperature (°C)</label>
            <input name="temperature" type="number" step="0.1" class="form-input" placeholder="36.5" />
          </div>
          <div>
            <label class="form-label">Pulse (bpm)</label>
            <input name="pulse_rate" type="number" class="form-input" placeholder="72" />
          </div>
        </div>
      </div>

      <!-- Diagnosis & Treatment -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Diagnosis</label>
          <input name="diagnosis" class="form-input" placeholder="Clinical diagnosis" />
        </div>
        <div>
          <label class="form-label">Treatment</label>
          <input name="treatment" class="form-input" placeholder="Treatment given" />
        </div>
      </div>

      <div>
        <label class="form-label">Notes</label>
        <textarea name="notes" class="form-input h-16 resize-none" placeholder="Additional notes…"></textarea>
      </div>

      <!-- Medicine Dispensing -->
      <div class="bg-slate-50 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-slate-700">Dispense Medicines</p>
          <button type="button" onclick="addDispenseMedicineRow('${medicineOptions}')" class="btn btn-xs btn-outline">
            + Add Medicine
          </button>
        </div>
        <div id="dispenseList" class="space-y-2">
          <p class="text-xs text-slate-400">No medicines added yet</p>
        </div>
      </div>
    </form>
  `, [
    { label: 'Cancel', class: 'btn-secondary', action: closeModal },
    { label: 'Save Visit', class: 'btn-primary', action: saveVisit },
  ]);
}

async function searchEmployeeForVisit() {
  const form = document.getElementById('visitForm');
  const empIdInput = form.querySelector('[name="employee_id"]');
  const id = empIdInput?.value?.trim();
  if (!id) { UI.warning('Enter an Employee ID first'); return; }

  try {
    const data = await API.employees.get(id);
    if (data?.record) {
      document.getElementById('visitEmpName').value = data.record.name || '';
      document.getElementById('visitEmpDept').value = data.record.department || '';
      UI.success(`Found: ${data.record.name}`);
    } else {
      UI.warning('Employee not found. You can still save with manual name.');
    }
  } catch (e) {
    UI.error('Search failed');
  }
}

function addDispenseMedicineRow(medicineOptions) {
  const list = document.getElementById('dispenseList');
  const rowId = Date.now();

  // Remove empty placeholder
  const placeholder = list.querySelector('p');
  if (placeholder) placeholder.remove();

  const row = document.createElement('div');
  row.className = 'flex items-center gap-2';
  row.id = `med-row-${rowId}`;
  row.innerHTML = `
    <select class="form-input form-select flex-1 text-sm" id="medSel-${rowId}">
      <option value="">Select medicine…</option>
      ${medicineOptions}
    </select>
    <input type="number" min="1" value="1" class="form-input w-20 text-sm" id="medQty-${rowId}" placeholder="Qty" />
    <button type="button" onclick="removeMedRow('med-row-${rowId}')" class="btn btn-danger btn-xs flex-shrink-0">✕</button>
  `;
  list.appendChild(row);
}

function removeMedRow(id) {
  document.getElementById(id)?.remove();
  const list = document.getElementById('dispenseList');
  if (!list.querySelector('[id^="med-row-"]')) {
    list.innerHTML = '<p class="text-xs text-slate-400">No medicines added yet</p>';
  }
}

async function saveVisit() {
  const form = document.getElementById('visitForm');
  if (!form) return;

  const body = UI.formData('visitForm');

  // Collect medicines
  const medRows = document.querySelectorAll('[id^="med-row-"]');
  const medicines = [];
  medRows.forEach(row => {
    const sel = row.querySelector('select');
    const qty = row.querySelector('input[type="number"]');
    if (sel?.value) {
      medicines.push({ medicine_id: sel.value, quantity: parseInt(qty?.value || 1) });
    }
  });
  body.medicines = medicines;

  if (!body.employee_id) { UI.warning('Employee ID is required'); return; }
  if (!body.symptoms) { UI.warning('Symptoms are required'); return; }

  try {
    const saveBtn = document.querySelector('#modalFooter .btn-primary');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    const res = await API.visits.create(body);
    if (res?.success) {
      UI.success('Visit saved successfully!');
      closeModal();
      loadVisitList();
    } else {
      UI.error(res?.error || 'Failed to save visit');
    }
  } catch (e) {
    UI.error('Save failed: ' + e.message);
  }
}

async function viewVisitDetail(id) {
  try {
    const data = await API.visits.get(id);
    const v = data?.record;
    if (!v) { UI.error('Visit not found'); return; }

    const bp = v.bp_systolic && v.bp_diastolic
      ? `${v.bp_systolic}/${v.bp_diastolic} mmHg`
      : '—';

    UI.modal(`Visit: ${v.employee_name || v.employee_id}`, `
      <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div><span class="form-label">Employee ID</span><p class="font-mono font-medium">${v.employee_id}</p></div>
        <div><span class="form-label">Department</span><p>${v.department || '—'}</p></div>
        <div><span class="form-label">Visit Date</span><p>${UI.formatDate(v.visit_date)} ${v.visit_time || ''}</p></div>
        <div><span class="form-label">Nurse</span><p>${v.nurse_name || '—'}</p></div>
        <div class="col-span-2"><span class="form-label">Symptoms</span><p>${v.symptoms || '—'}</p></div>
        <div class="col-span-2"><span class="form-label">Diagnosis</span><p>${v.diagnosis || '—'}</p></div>
        <div class="col-span-2"><span class="form-label">Treatment</span><p>${v.treatment || '—'}</p></div>
        <div><span class="form-label">Blood Pressure</span><p class="font-mono">${bp}</p></div>
        <div><span class="form-label">Temperature</span><p class="font-mono">${v.temperature ? v.temperature + ' °C' : '—'}</p></div>
        <div><span class="form-label">Pulse</span><p class="font-mono">${v.pulse_rate ? v.pulse_rate + ' bpm' : '—'}</p></div>
        <div><span class="form-label">Status</span><p>${UI.badge(v.status || 'ACTIVE', 'info')}</p></div>
        ${v.notes ? `<div class="col-span-2"><span class="form-label">Notes</span><p class="text-slate-600">${v.notes}</p></div>` : ''}
      </div>
    `);
  } catch (e) {
    UI.error('Failed to load visit detail');
  }
}
