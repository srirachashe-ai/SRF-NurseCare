/**
 * NurseCare - API Client
 * Handles all communication with Google Apps Script backend
 */

const API = {
  /**
   * Core request method
   */
  async request(path, action, method = 'GET', body = null) {
    const token = Auth.getToken();
    const url = new URL(NC_CONFIG.API_BASE_URL);
    url.searchParams.set('path', path);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);

    // Append extra params to URL for GET
    if (method === 'GET' && body) {
      Object.entries(body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      });
    }

    const options = { method };
    if (method === 'POST' && body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url.toString(), options);
      const data = await res.json();

      if (data.error && data.code === 401) {
        Auth.logout();
        return null;
      }
      return data;
    } catch (err) {
      console.error(`API Error [${path}/${action}]:`, err);
      throw new Error(`Network error: ${err.message}`);
    }
  },

  get: (path, action, params) => API.request(path, action, 'GET', params),
  post: (path, action, body) => API.request(path, action, 'POST', body),

  // Auth
  auth: {
    login: (body) => API.request('auth', 'login', 'POST', body),
  },

  // Dashboard
  dashboard: {
    get: (date) => API.get('dashboard', 'get', date ? { date } : {}),
  },

  // Employees
  employees: {
    search: (q) => API.get('employees', 'search', { q }),
    get: (id) => API.get('employees', 'get', { id }),
    list: () => API.get('employees', 'list', {}),
  },

  // Visits
  visits: {
    create: (body) => API.post('visits', 'create', body),
    list: (params) => API.get('visits', 'list', params),
    get: (id) => API.get('visits', 'get', { id }),
    update: (id, body) => { body._id = id; return API.post('visits', 'update', body); },
  },

  // Medicines
  medicines: {
    list: (params) => API.get('medicines', 'list', params || {}),
    get: (id) => API.get('medicines', 'get', { id }),
    create: (body) => API.post('medicines', 'create', body),
    update: (id, body) => { body._id = id; return API.post('medicines', 'update', body); },
    adjust: (id, body) => { body._id = id; return API.post('medicines', 'adjust', body); },
    alerts: () => API.get('medicines', 'alerts', {}),
    transactions: (params) => API.get('medicine-transactions', 'list', params || {}),
  },

  // Blood Pressure
  bp: {
    create: (body) => API.post('bp', 'create', body),
    list: (params) => API.get('bp', 'list', params || {}),
    assess: (body) => API.post('bp', 'assess', body),
  },

  // Drug Tests
  drugTests: {
    create: (body) => API.post('drug-tests', 'create', body),
    list: (params) => API.get('drug-tests', 'list', params || {}),
    uploadImage: (body) => API.post('drug-tests', 'upload-image', body),
  },

  // Health Checks
  healthChecks: {
    create: (body) => API.post('health-checks', 'create', body),
    list: (params) => API.get('health-checks', 'list', params || {}),
    uploadPDF: (body) => API.post('health-checks', 'upload-pdf', body),
  },

  // History
  history: {
    get: (employeeId) => API.get('history', 'get', { employeeId }),
  },

  // Users
  users: {
    list: () => API.get('users', 'list', {}),
    create: (body) => API.post('users', 'create', body),
    update: (id, body) => { body._id = id; return API.post('users', 'update', body); },
    delete: (id) => API.get('users', 'delete', { id }),
  },

  // Audit
  audit: {
    list: (params) => API.get('audit', 'list', params || {}),
  },
};
