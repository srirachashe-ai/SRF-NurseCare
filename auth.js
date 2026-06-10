/**
 * NurseCare - Authentication Module
 */

const Auth = {
  getToken() {
    return localStorage.getItem(NC_CONFIG.TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(NC_CONFIG.USER_KEY));
    } catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem(NC_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(NC_CONFIG.USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(NC_CONFIG.TOKEN_KEY);
    localStorage.removeItem(NC_CONFIG.USER_KEY);
    window.location.reload();
  },
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },
  hasRole(roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }
};

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errDiv = document.getElementById('loginError');
  const errMsg = document.getElementById('loginErrorMsg');

  if (!username || !password) {
    errMsg.textContent = 'Please enter username and password.';
    errDiv.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in…';
  errDiv.classList.add('hidden');

  try {
    const res = await API.auth.login({ username, password });
    if (res && res.token) {
      Auth.setSession(res.token, res.user);
      initApp();
    } else {
      errMsg.textContent = res?.error || 'Invalid credentials. Please try again.';
      errDiv.classList.remove('hidden');
    }
  } catch (e) {
    errMsg.textContent = 'Connection error. Check your network and API URL.';
    errDiv.classList.remove('hidden');
  }

  btn.disabled = false;
  btn.textContent = 'Sign In';
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('loginPassword');
  if (pwInput) {
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  }
  const unInput = document.getElementById('loginUsername');
  if (unInput) {
    unInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  }
});

function handleLogout() {
  if (confirm('Sign out of NurseCare?')) {
    Auth.logout();
  }
}
