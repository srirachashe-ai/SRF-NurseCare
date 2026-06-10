/**
 * NurseCare - UI Utilities
 */

const UI = {
  // ── Toast Notifications ──────────────────────────────
  toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const icons = {
      success: `<svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      error:   `<svg class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      warning: `<svg class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      info:    `<svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-800 leading-5">${message}</p>
      </div>
      <button onclick="this.closest('.toast').remove()" class="text-slate-300 hover:text-slate-500 flex-shrink-0 ml-2">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => UI.toast(msg, 'success'),
  error:   (msg) => UI.toast(msg, 'error'),
  warning: (msg) => UI.toast(msg, 'warning'),
  info:    (msg) => UI.toast(msg, 'info'),

  // ── Loading States ────────────────────────────────────
  loading(container, message = 'Loading…') {
    if (typeof container === 'string') container = document.getElementById(container);
    if (container) container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16">
        <div class="spinner mb-3"></div>
        <p class="text-slate-400 text-sm">${message}</p>
      </div>`;
  },

  empty(container, message = 'No records found.', icon = '📋') {
    if (typeof container === 'string') container = document.getElementById(container);
    if (container) container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <span class="text-4xl mb-3">${icon}</span>
        <p class="text-slate-400 text-sm">${message}</p>
      </div>`;
  },

  // ── Modal ─────────────────────────────────────────────
  modal(title, bodyHtml, buttons = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;

    const footer = document.getElementById('modalFooter');
    footer.innerHTML = '';

    if (buttons.length === 0) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-secondary';
      closeBtn.textContent = 'Close';
      closeBtn.onclick = closeModal;
      footer.appendChild(closeBtn);
    } else {
      buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = `btn ${btn.class || 'btn-secondary'}`;
        el.textContent = btn.label;
        el.onclick = btn.action;
        footer.appendChild(el);
      });
    }

    document.getElementById('globalModal').classList.remove('hidden');
  },

  // ── Badges ────────────────────────────────────────────
  badge(text, type = 'neutral') {
    return `<span class="badge badge-${type.toLowerCase()}">${text}</span>`;
  },

  bpBadge(assessment) {
    const map = { PASS: 'pass', WARNING: 'warning', FAIL: 'fail' };
    return UI.badge(assessment, map[assessment] || 'neutral');
  },

  riskBadge(risk) {
    const map = { HIGH: 'fail', MEDIUM: 'warning', LOW: 'pass' };
    return UI.badge(risk, map[risk] || 'neutral');
  },

  resultBadge(result) {
    const map = { PASS: 'pass', FAIL: 'fail', INCONCLUSIVE: 'warning' };
    return UI.badge(result, map[result] || 'neutral');
  },

  // ── Date/Time helpers ─────────────────────────────────
  formatDate(str) {
    if (!str) return '—';
    try { return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return str; }
  },

  formatDateTime(str) {
    if (!str) return '—';
    try { return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return str; }
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  // ── Form helpers ──────────────────────────────────────
  formData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else data[el.name] = el.value;
    });
    return data;
  },

  // ── Table builder ─────────────────────────────────────
  table(headers, rows, emptyMsg = 'No data') {
    if (!rows || rows.length === 0) {
      return `<div class="py-12 text-center text-slate-400 text-sm">${emptyMsg}</div>`;
    }
    const thead = headers.map(h =>
      `<th class="${h.class || ''}">${h.label}</th>`
    ).join('');
    const tbody = rows.map(row =>
      `<tr>${headers.map(h => `<td class="${h.tdClass || ''}">${h.render ? h.render(row) : (row[h.key] || '—')}</td>`).join('')}</tr>`
    ).join('');
    return `<div class="overflow-x-auto"><table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
  },

  // ── Pagination placeholder ────────────────────────────
  paginationInfo(total, shown) {
    return `<span class="text-xs text-slate-400">Showing ${shown} of ${total} records</span>`;
  },

  // ── File to base64 ────────────────────────────────────
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  },

  // ── Number formatting ─────────────────────────────────
  num(n) {
    return (parseInt(n) || 0).toLocaleString();
  },

  pct(n) {
    return `${Math.round(n || 0)}%`;
  },
};

// ── Global close helpers ───────────────────────────────
function closeModal() {
  document.getElementById('globalModal').classList.add('hidden');
}

function showAlertPanel() {
  const panel = document.getElementById('alertPanel');
  panel.classList.remove('hidden');
  loadAlertPanel();
}

function closeAlertPanel() {
  document.getElementById('alertPanel').classList.add('hidden');
}

async function loadAlertPanel() {
  const content = document.getElementById('alertPanelContent');
  content.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Checking alerts…</p>';

  try {
    const data = await API.medicines.alerts();
    let html = '';

    if (data.expired?.length) {
      html += `<div class="mb-3"><p class="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Expired (${data.expired.length})</p>`;
      data.expired.forEach(m => {
        html += `<div class="bg-red-50 border border-red-100 rounded-lg p-3 mb-2">
          <p class="text-sm font-medium text-slate-700">${m.name}</p>
          <p class="text-xs text-red-500">Expired: ${UI.formatDate(m.expiry_date)} · Stock: ${m.stock}</p>
        </div>`;
      });
      html += `</div>`;
    }

    if (data.expiringSoon?.length) {
      html += `<div class="mb-3"><p class="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">Expiring Soon (${data.expiringSoon.length})</p>`;
      data.expiringSoon.forEach(m => {
        html += `<div class="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-2">
          <p class="text-sm font-medium text-slate-700">${m.name}</p>
          <p class="text-xs text-yellow-600">Expires: ${UI.formatDate(m.expiry_date)}</p>
        </div>`;
      });
      html += `</div>`;
    }

    if (data.lowStock?.length) {
      html += `<div><p class="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Low Stock (${data.lowStock.length})</p>`;
      data.lowStock.forEach(m => {
        html += `<div class="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-2">
          <p class="text-sm font-medium text-slate-700">${m.name}</p>
          <p class="text-xs text-orange-500">Stock: ${m.stock_quantity} / Min: ${m.min_stock_level}</p>
        </div>`;
      });
      html += `</div>`;
    }

    if (!html) {
      html = `<div class="text-center py-12"><span class="text-3xl mb-3 block">✅</span><p class="text-slate-400 text-sm">No active alerts</p></div>`;
    }

    content.innerHTML = html;

    // Update badge count
    const total = (data.expired?.length || 0) + (data.lowStock?.length || 0);
    const badge = document.getElementById('alertCount');
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (e) {
    content.innerHTML = `<p class="text-red-400 text-sm text-center py-8">Failed to load alerts</p>`;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
