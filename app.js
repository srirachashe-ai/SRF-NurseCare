/**
 * NurseCare - App Initialization & Router
 */

let currentPage = 'dashboard';

function initApp() {
  const user = Auth.getUser();

  if (!Auth.isLoggedIn() || !user) {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
    return;
  }

  // Hide login, show app
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  // Set user info
  document.getElementById('sidebarUserName').textContent = user.name || user.username;
  document.getElementById('sidebarUserRole').textContent = user.role;
  document.getElementById('sidebarAvatar').textContent = (user.name || user.username).charAt(0).toUpperCase();

  // Build navigation
  buildNav(user);

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Navigate to default page
  navigateTo('dashboard');

  // Load alert count in background
  setTimeout(loadAlertCount, 2000);
}

function buildNav(user) {
  const nav = document.getElementById('sidebarNav');
  let html = '';

  NC_CONFIG.NAV.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-label">${item.section}</div>`;
    } else if (!item.roles || item.roles.includes(user.role)) {
      const icon = NC_CONFIG.ICONS[item.icon] || '';
      html += `
        <div class="nav-item" id="nav-${item.id}" onclick="navigateTo('${item.id}')">
          ${icon}
          <span>${item.label}</span>
        </div>`;
    }
  });

  nav.innerHTML = html;
}

function navigateTo(page) {
  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const active = document.getElementById(`nav-${page}`);
  if (active) active.classList.add('active');

  // Update page title
  const navItem = NC_CONFIG.NAV.find(n => n.id === page);
  document.getElementById('pageTitle').textContent = navItem?.label || page;

  // Render page
  const content = document.getElementById('pageContent');
  UI.loading(content);

  switch (page) {
    case 'dashboard':     renderDashboard(); break;
    case 'visits':        renderVisits(); break;
    case 'medicines':     renderMedicines(); break;
    case 'bloodpressure': renderBloodPressure(); break;
    case 'drugtests':     renderDrugTests(); break;
    case 'healthchecks':  renderHealthChecks(); break;
    case 'history':       renderHistory(); break;
    case 'users':         renderUsers(); break;
    case 'auditlog':      renderAuditLog(); break;
    default:
      content.innerHTML = `<div class="text-center py-16 text-slate-400">Page not found: ${page}</div>`;
  }
}

function updateClock() {
  const el = document.getElementById('currentDateTime');
  if (el) {
    el.textContent = new Date().toLocaleString('en-GB', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}

async function loadAlertCount() {
  try {
    const data = await API.medicines.alerts();
    const total = (data.expired?.length || 0) + (data.lowStock?.length || 0);
    const badge = document.getElementById('alertCount');
    if (total > 0) {
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.remove('hidden');
    }
  } catch (e) { /* silent */ }
}

// App entry point
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    initApp();
  } else {
    document.getElementById('loginScreen').classList.remove('hidden');
  }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeAlertPanel();
  }
});
