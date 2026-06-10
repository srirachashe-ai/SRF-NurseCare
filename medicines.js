/**
 * NurseCare - Medicine Inventory Module
 */

let allMedicines = [];

async function renderMedicines() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <input type="text" id="medSearch" placeholder="Search medicines…"
          class="form-input w-56 text-sm" oninput="filterMedicines()" />
        <select id="medCategoryFilter" class="form-input form-select w-40 text-sm" onchange="filterMedicines()">
          <option value="">All Categories</option>
          <option>Analgesic</option>
          <option>Antibiotic</option>
          <option>Antacid</option>
          <option>Antihistamine</option>
          <option>Vitamin</option>
          <option>General</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button onclick="showMedicineAlerts()" class="btn btn-outline">
          ⚠️ Alerts
        </button>
        <button onclick="showAddMedicineModal()" class="btn btn-primary">
          + Add Medicine
        </button>
      </div>
    </div>

    <!-- Stock Summary -->
    <div class="grid grid-cols-3 gap-4 mb-5" id="stockSummary">
      <div class="stat-card text-center">
        <p class="text-xs text-slate-400 mb-1">Total Items</p>
        <p class="text-xl font-bold text-slate-800" id="totalMeds">—</p>
      </div>
      <div class="stat-card text-center">
        <p class="text-xs text-red-400 mb-1">Expired / Low Stock</p>
        <p class="text-xl font-bold text-red-600" id="alertMeds">—</p>
      </div>
      <div class="stat-card text-center">
        <p class="text-xs text-slate-400 mb-1">Active Items</p>
        <p class="text-xl font-bold text-teal-600" id="activeMeds">—</p>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Medicine Inventory</span>
        <span id="medCount" class="text-xs text-slate-400"></span>
      </div>
      <div id="medicineList"><div class="spinner mx-auto my-10"></div></div>
    </div>`;

  loadMedicines();
}

async function loadMedicines() {
  try {
    const data = await API.medicines.list();
    allMedicines = data?.records || [];

    // Update summary stats
    const today = new Date();
    const expired = allMedicines.filter(m => m.expiry_date && new Date(m.expiry_date) <= today);
    const lowStock = allMedicines.filter(m => parseInt(m.stock_quantity) <= parseInt(m.min_stock_level || 10));

    document.getElementById('totalMeds').textContent = allMedicines.length;
    document.getElementById('alertMeds').textContent = new Set([...expired.map(m=>m.id), ...lowStock.map(m=>m.id)]).size;
    document.getElementById('activeMeds').textContent = allMedicines.filter(m => m.status === 'ACTIVE').length;

    renderMedicineTable(allMedicines);
  } catch (e) {
    UI.error('Failed to load medicines');
  }
}

function filterMedicines() {
  const q = document.getElementById('medSearch')?.value?.toLowerCase();
  const cat = document.getElementById('medCategoryFilter')?.value;
  let filtered = allMedicines;
  if (q) filtered = filtered.filter(m =>
    m.name?.toLowerCase().includes(q) || m.generic_name?.toLowerCase().includes(q)
  );
  if (cat) filtered = filtered.filter(m => m.category === cat);
  renderMedicineTable(filtered);
}

function renderMedicineTable(medicines) {
  const el = document.getElementById('medicineList');
  const count = document.getElementById('medCount');
  if (count) count.textContent = `${medicines.length} items`;

  const today = new Date();

  el.innerHTML = UI.table([
    { key: 'name', label: 'Medicine Name', render: r => `
      <div>
        <p class="font-medium text-slate-700">${r.name}</p>
        ${r.generic_name ? `<p class="text-xs text-slate-400">${r.generic_name}</p>` : ''}
      </div>` },
    { key: 'category', label: 'Category', render: r => UI.badge(r.category || 'General', 'info') },
    { key: 'stock_quantity', label: 'Stock', render: r => {
      const qty = parseInt(r.stock_quantity) || 0;
      const min = parseInt(r.min_stock_level) || 10;
      const isLow = qty <= min;
      return `<span class="font-mono font-semibold ${isLow ? 'text-red-600' : 'text-slate-700'}">${qty} ${r.unit}</span>${isLow ? ' <span class="badge badge-warning ml-1">Low</span>' : ''}`;
    }},
    { key: 'expiry_date', label: 'Expiry', render: r => {
      if (!r.expiry_date) return '—';
      const isExpired = new Date(r.expiry_date) <= today;
      const isSoon = !isExpired && (new Date(r.expiry_date) - today) < 30 * 24 * 3600 * 1000;
      return `<span class="${isExpired ? 'text-red-500' : isSoon ? 'text-yellow-500' : 'text-slate-600'}">${UI.formatDate(r.expiry_date)}</span>${isExpired ? ' <span class="badge badge-fail ml-1">Expired</span>' : ''}`;
    }},
    { key: 'location', label: 'Location' },
    { key: 'actions', label: '', render: r => `
      <button onclick="showAdjustStockModal('${r.id}', '${r.name}', ${parseInt(r.stock_quantity)||0})" class="btn btn-xs btn-outline mr-1">Adjust</button>
      <button onclick="showMedicineDetail('${r.id}')" class="btn btn-xs btn-secondary">Detail</button>
    `}
  ], medicines);
}

function showAddMedicineModal() {
  UI.modal('Add New Medicine', `
    <form id="medForm" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Medicine Name *</label>
          <input name="name" class="form-input" placeholder="Paracetamol 500mg" required />
        </div>
        <div>
          <label class="form-label">Generic Name</label>
          <input name="generic_name" class="form-input" placeholder="Acetaminophen" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Category</label>
          <select name="category" class="form-input form-select">
            <option>General</option>
            <option>Analgesic</option>
            <option>Antibiotic</option>
            <option>Antacid</option>
            <option>Antihistamine</option>
            <option>Vitamin</option>
          </select>
        </div>
        <div>
          <label class="form-label">Unit *</label>
          <select name="unit" class="form-input form-select">
            <option>Tablet</option>
            <option>Capsule</option>
            <option>ml</option>
            <option>mg</option>
            <option>Sachet</option>
            <option>Bottle</option>
            <option>Strip</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="form-label">Initial Stock *</label>
          <input name="stock_quantity" type="number" min="0" class="form-input" placeholder="100" required />
        </div>
        <div>
          <label class="form-label">Min Stock Level</label>
          <input name="min_stock_level" type="number" min="0" class="form-input" placeholder="10" />
        </div>
        <div>
          <label class="form-label">Expiry Date</label>
          <input name="expiry_date" type="date" class="form-input" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Manufacturer</label>
          <input name="manufacturer" class="form-input" placeholder="Manufacturer name" />
        </div>
        <div>
          <label class="form-label">Storage Location</label>
          <input name="location" class="form-input" placeholder="Cabinet A-3" />
        </div>
      </div>
      <div>
        <label class="form-label">Notes</label>
        <textarea name="notes" class="form-input h-16 resize-none" placeholder="Additional notes…"></textarea>
      </div>
    </form>
  `, [
    { label: 'Cancel', class: 'btn-secondary', action: closeModal },
    { label: 'Add Medicine', class: 'btn-primary', action: saveMedicine },
  ]);
}

async function saveMedicine() {
  const body = UI.formData('medForm');
  if (!body.name) { UI.warning('Medicine name is required'); return; }
  if (!body.stock_quantity) { UI.warning('Initial stock is required'); return; }

  try {
    const saveBtn = document.querySelector('#modalFooter .btn-primary');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    const res = await API.medicines.create(body);
    if (res?.success) {
      UI.success('Medicine added successfully!');
      closeModal();
      loadMedicines();
    } else {
      UI.error(res?.error || 'Failed to add medicine');
    }
  } catch (e) {
    UI.error('Save failed: ' + e.message);
  }
}

function showAdjustStockModal(id, name, currentStock) {
  UI.modal(`Adjust Stock: ${name}`, `
    <div class="space-y-4">
      <div class="bg-slate-50 rounded-xl p-4 text-center">
        <p class="text-xs text-slate-400 mb-1">Current Stock</p>
        <p class="text-3xl font-bold text-slate-800">${currentStock}</p>
      </div>
      <div>
        <label class="form-label">Adjustment Type</label>
        <select id="adjustType" class="form-input form-select" onchange="updateAdjustPreview(${currentStock})">
          <option value="ADD">Add Stock (+)</option>
          <option value="REMOVE">Remove Stock (−)</option>
          <option value="SET">Set to Exact Amount</option>
        </select>
      </div>
      <div>
        <label class="form-label">Amount</label>
        <input type="number" id="adjustAmount" min="1" value="10" class="form-input"
          oninput="updateAdjustPreview(${currentStock})" />
      </div>
      <div class="bg-teal-50 rounded-xl p-4 text-center">
        <p class="text-xs text-teal-600 mb-1">New Stock Will Be</p>
        <p class="text-2xl font-bold text-teal-700" id="adjustPreview">${currentStock + 10}</p>
      </div>
      <div>
        <label class="form-label">Reason</label>
        <input type="text" id="adjustReason" class="form-input" placeholder="e.g. Restocked from supplier" />
      </div>
    </div>
  `, [
    { label: 'Cancel', class: 'btn-secondary', action: closeModal },
    { label: 'Apply Adjustment', class: 'btn-primary', action: () => applyStockAdjust(id, currentStock) },
  ]);
}

function updateAdjustPreview(current) {
  const type = document.getElementById('adjustType')?.value;
  const amount = parseInt(document.getElementById('adjustAmount')?.value) || 0;
  let newVal;
  if (type === 'SET') newVal = amount;
  else if (type === 'REMOVE') newVal = current - amount;
  else newVal = current + amount;
  const preview = document.getElementById('adjustPreview');
  if (preview) {
    preview.textContent = newVal < 0 ? '⚠️ Invalid' : newVal;
    preview.className = `text-2xl font-bold ${newVal < 0 ? 'text-red-600' : 'text-teal-700'}`;
  }
}

async function applyStockAdjust(id, current) {
  const type = document.getElementById('adjustType')?.value;
  const amount = parseInt(document.getElementById('adjustAmount')?.value) || 0;
  const reason = document.getElementById('adjustReason')?.value;

  let adjustment = amount;
  if (type === 'REMOVE') adjustment = -amount;

  try {
    const res = await API.medicines.adjust(id, {
      adjustment,
      type,
      reason: reason || 'Manual adjustment',
    });
    if (res?.success) {
      UI.success(`Stock updated: ${res.old_stock} → ${res.new_stock}`);
      closeModal();
      loadMedicines();
    } else {
      UI.error(res?.error || 'Adjustment failed');
    }
  } catch (e) {
    UI.error('Adjustment failed: ' + e.message);
  }
}

async function showMedicineDetail(id) {
  try {
    const data = await API.medicines.get(id);
    const m = data?.record;
    if (!m) { UI.error('Medicine not found'); return; }

    const today = new Date();
    const isExpired = m.expiry_date && new Date(m.expiry_date) <= today;

    UI.modal(`Medicine Detail`, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><span class="form-label">Name</span><p class="font-semibold">${m.name}</p></div>
          <div><span class="form-label">Generic Name</span><p>${m.generic_name || '—'}</p></div>
          <div><span class="form-label">Category</span><p>${UI.badge(m.category || 'General', 'info')}</p></div>
          <div><span class="form-label">Unit</span><p>${m.unit}</p></div>
          <div><span class="form-label">Current Stock</span><p class="font-mono font-bold text-lg">${m.stock_quantity} ${m.unit}</p></div>
          <div><span class="form-label">Min Stock Level</span><p class="font-mono">${m.min_stock_level || 10}</p></div>
          <div><span class="form-label">Expiry Date</span>
            <p class="${isExpired ? 'text-red-500 font-semibold' : ''}">${UI.formatDate(m.expiry_date)}${isExpired ? ' ⚠️ EXPIRED' : ''}</p>
          </div>
          <div><span class="form-label">Location</span><p>${m.location || '—'}</p></div>
          <div><span class="form-label">Manufacturer</span><p>${m.manufacturer || '—'}</p></div>
          <div><span class="form-label">Status</span><p>${UI.badge(m.status || 'ACTIVE', m.status === 'ACTIVE' ? 'pass' : 'neutral')}</p></div>
          ${m.notes ? `<div class="col-span-2"><span class="form-label">Notes</span><p class="text-slate-600">${m.notes}</p></div>` : ''}
        </div>
      </div>
    `);
  } catch (e) {
    UI.error('Failed to load medicine detail');
  }
}

async function showMedicineAlerts() {
  UI.modal('Medicine Alerts', '<div class="spinner mx-auto py-10"></div>');
  try {
    const data = await API.medicines.alerts();
    const today = new Date();
    let html = '';

    if (data.expired?.length) {
      html += `<h4 class="font-semibold text-red-600 text-sm mb-2 mt-0">Expired (${data.expired.length})</h4>`;
      html += UI.table([
        { key: 'name', label: 'Medicine' },
        { key: 'expiry_date', label: 'Expired On', render: r => `<span class="text-red-500">${UI.formatDate(r.expiry_date)}</span>` },
        { key: 'stock_quantity', label: 'Stock' },
      ], data.expired, 'No expired medicines');
    }

    if (data.expiringSoon?.length) {
      html += `<h4 class="font-semibold text-yellow-600 text-sm mb-2 mt-4">Expiring Within 30 Days (${data.expiringSoon.length})</h4>`;
      html += UI.table([
        { key: 'name', label: 'Medicine' },
        { key: 'expiry_date', label: 'Expires', render: r => `<span class="text-yellow-600">${UI.formatDate(r.expiry_date)}</span>` },
        { key: 'stock_quantity', label: 'Stock' },
      ], data.expiringSoon, 'None');
    }

    if (data.lowStock?.length) {
      html += `<h4 class="font-semibold text-orange-600 text-sm mb-2 mt-4">Low Stock (${data.lowStock.length})</h4>`;
      html += UI.table([
        { key: 'name', label: 'Medicine' },
        { key: 'stock_quantity', label: 'Current Stock' },
        { key: 'min_stock_level', label: 'Min Level' },
      ], data.lowStock, 'None');
    }

    if (!html) html = '<p class="text-center text-slate-400 py-8">✅ No active alerts</p>';

    document.getElementById('modalBody').innerHTML = html;
  } catch (e) {
    document.getElementById('modalBody').innerHTML = '<p class="text-red-400 text-sm">Failed to load alerts</p>';
  }
}
