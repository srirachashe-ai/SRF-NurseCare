/**
 * NurseCare - Dashboard Module
 */

let dashCharts = {};

async function renderDashboard() {
  const content = document.getElementById('pageContent');
  content.innerHTML = getDashboardSkeleton();

  try {
    const date = UI.today();
    const data = await API.dashboard.get(date);
    if (!data) return;

    // Stats
    document.getElementById('stat-visitors').textContent = UI.num(data.stats?.dailyVisitors);
    document.getElementById('stat-dispensing').textContent = UI.num(data.stats?.dailyDispensing);
    document.getElementById('stat-abnormalbp').textContent = UI.num(data.stats?.abnormalBP);
    document.getElementById('stat-passrate').textContent = UI.pct(data.stats?.passRate);

    // Charts
    renderSymptomsChart(data.topSymptoms || []);
    renderDeptChart(data.topDepartments || []);
    renderBPChart(data.bpSummary || {});

    // Alerts
    renderDashAlerts(data.expiredAlerts || [], data.lowStockAlerts || []);

    // Recent visits
    renderRecentVisits(data.recentVisits || []);

  } catch (e) {
    UI.error('Failed to load dashboard: ' + e.message);
  }
}

function getDashboardSkeleton() {
  return `
  <!-- Stat Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${[
      { id: 'stat-visitors',   icon: '👥', label: 'Daily Visitors',    color: 'text-teal-600',  bg: 'bg-teal-50' },
      { id: 'stat-dispensing', icon: '💊', label: 'Medicines Dispensed', color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'stat-abnormalbp', icon: '❤️', label: 'Abnormal BP',       color: 'text-red-600',   bg: 'bg-red-50' },
      { id: 'stat-passrate',   icon: '🧪', label: 'Drug Test Pass Rate', color: 'text-green-600', bg: 'bg-green-50' },
    ].map(s => `
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">${s.label}</p>
            <p class="text-2xl font-bold text-slate-800" id="${s.id}">—</p>
          </div>
          <div class="w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg">${s.icon}</div>
        </div>
      </div>
    `).join('')}
  </div>

  <!-- Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
    <div class="section-card lg:col-span-1">
      <div class="section-header">
        <span class="section-title">Top Symptoms</span>
        <span class="text-xs text-slate-400">Today</span>
      </div>
      <div class="section-body">
        <div class="chart-container"><canvas id="symptomsChart"></canvas></div>
      </div>
    </div>
    <div class="section-card lg:col-span-1">
      <div class="section-header">
        <span class="section-title">Visits by Department</span>
        <span class="text-xs text-slate-400">Today</span>
      </div>
      <div class="section-body">
        <div class="chart-container"><canvas id="deptChart"></canvas></div>
      </div>
    </div>
    <div class="section-card lg:col-span-1">
      <div class="section-header">
        <span class="section-title">Blood Pressure Summary</span>
        <span class="text-xs text-slate-400">Today</span>
      </div>
      <div class="section-body">
        <div class="chart-container"><canvas id="bpChart"></canvas></div>
        <div id="bpLegend" class="mt-3 flex justify-center gap-4 text-xs text-slate-500"></div>
      </div>
    </div>
  </div>

  <!-- Alerts + Recent Visits -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">⚠️ Medicine Alerts</span>
        <button onclick="navigateTo('medicines')" class="text-xs text-teal-600 hover:underline">View all</button>
      </div>
      <div id="dashAlerts" class="section-body">
        <div class="spinner mx-auto"></div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Recent Visits</span>
        <button onclick="navigateTo('visits')" class="text-xs text-teal-600 hover:underline">View all</button>
      </div>
      <div id="recentVisits" class="section-body">
        <div class="spinner mx-auto"></div>
      </div>
    </div>
  </div>`;
}

function renderSymptomsChart(symptoms) {
  const ctx = document.getElementById('symptomsChart');
  if (!ctx) return;
  if (dashCharts.symptoms) dashCharts.symptoms.destroy();

  if (!symptoms.length) {
    ctx.parentElement.innerHTML = '<p class="text-center text-slate-400 text-sm py-8">No data today</p>';
    return;
  }

  dashCharts.symptoms = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: symptoms.map(s => s.name),
      datasets: [{
        data: symptoms.map(s => s.count),
        backgroundColor: ['#0d9488','#14b8a6','#2dd4bf','#5eead4','#99f6e4'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

function renderDeptChart(depts) {
  const ctx = document.getElementById('deptChart');
  if (!ctx) return;
  if (dashCharts.dept) dashCharts.dept.destroy();

  if (!depts.length) {
    ctx.parentElement.innerHTML = '<p class="text-center text-slate-400 text-sm py-8">No data today</p>';
    return;
  }

  dashCharts.dept = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: depts.map(d => d.name),
      datasets: [{
        data: depts.map(d => d.count),
        backgroundColor: ['#0d9488','#3b82f6','#8b5cf6','#f59e0b','#ef4444'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, boxWidth: 10 } }
      },
      cutout: '65%',
    }
  });
}

function renderBPChart(summary) {
  const ctx = document.getElementById('bpChart');
  if (!ctx) return;
  if (dashCharts.bp) dashCharts.bp.destroy();

  const total = summary.total || 0;
  if (!total) {
    ctx.parentElement.innerHTML = '<p class="text-center text-slate-400 text-sm py-8">No BP records today</p>';
    return;
  }

  dashCharts.bp = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pass', 'Warning', 'Fail'],
      datasets: [{
        data: [summary.pass || 0, summary.warning || 0, summary.fail || 0],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, boxWidth: 10 } }
      },
      cutout: '65%',
    }
  });

  const legend = document.getElementById('bpLegend');
  if (legend) {
    legend.innerHTML = `<span>Total: <strong>${total}</strong></span>`;
  }
}

function renderDashAlerts(expired, lowStock) {
  const el = document.getElementById('dashAlerts');
  if (!el) return;

  if (!expired.length && !lowStock.length) {
    el.innerHTML = `<div class="text-center py-6"><span class="text-2xl">✅</span><p class="text-sm text-slate-400 mt-2">No active alerts</p></div>`;
    return;
  }

  let html = '';
  expired.slice(0, 3).forEach(m => {
    html += `<div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <span class="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">💊</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-slate-700 truncate">${m.name}</p>
        <p class="text-xs text-red-500">Expired: ${UI.formatDate(m.expiry_date)}</p>
      </div>
      <span class="badge badge-fail">Expired</span>
    </div>`;
  });

  lowStock.slice(0, 3).forEach(m => {
    html += `<div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <span class="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📦</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-slate-700 truncate">${m.name}</p>
        <p class="text-xs text-orange-500">Stock: ${m.stock} / Min: ${m.min_level}</p>
      </div>
      <span class="badge badge-warning">Low</span>
    </div>`;
  });

  el.innerHTML = html;
}

function renderRecentVisits(visits) {
  const el = document.getElementById('recentVisits');
  if (!el) return;

  if (!visits.length) {
    el.innerHTML = `<div class="text-center py-6"><span class="text-2xl">🏥</span><p class="text-sm text-slate-400 mt-2">No visits today</p></div>`;
    return;
  }

  let html = '';
  visits.forEach(v => {
    html += `<div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <div class="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
        ${(v.employee_name || '?').charAt(0)}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-slate-700 truncate">${v.employee_name || v.employee_id}</p>
        <p class="text-xs text-slate-400 truncate">${v.symptoms || 'No symptoms'}</p>
      </div>
      <span class="text-xs text-slate-400 font-mono flex-shrink-0">${v.visit_time || ''}</span>
    </div>`;
  });

  el.innerHTML = html;
}
