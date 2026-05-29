// Helper functions
function getToken() { return localStorage.getItem('token'); }

function authHeader() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span class="notification-icon" aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="notification-message">${message}</span>
    <button class="notification-close" aria-label="Close notification">&times;</button>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('notification--visible'), 10);
  setTimeout(() => {
    notification.classList.remove('notification--visible');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('notification--visible');
    setTimeout(() => notification.remove(), 300);
  });
}

// Auth API calls
async function handleLogin(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('token', data.token);
  localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
  localStorage.setItem('userEmail', data.user.email);
  return data;
}

async function handleRegister(firstName, lastName, email, password, dateOfBirth) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, dateOfBirth })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  localStorage.setItem('token', data.token);
  localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
  localStorage.setItem('userEmail', data.user.email);
  return data;
}

// Tabs (robust version)
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('[role="tabpanel"]');
  if (!tabs.length) return;

  function switchTab(selectedTab) {
    tabs.forEach(tab => {
      const isActive = tab === selectedTab;
      tab.classList.toggle('tab-active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    const selectedId = selectedTab.getAttribute('aria-controls');
    panels.forEach(panel => {
      panel.hidden = panel.id !== selectedId;
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(tab);
    });
  });

  const activeTab = document.querySelector('.tab-btn.tab-active') || tabs[0];
  switchTab(activeTab);
}

// Login form handler
function initLoginForm() {
  const loginForm = document.querySelector('#panel-login form');
  if (!loginForm) return;
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('#login-email').value;
    const password = loginForm.querySelector('#login-password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    try {
      await handleLogin(email, password);
      showNotification('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
      showNotification(err.message, 'error');
      submitBtn.textContent = 'Sign In';
      submitBtn.disabled = false;
    }
  });
}

// Register form handler
function initRegisterForm() {
  const registerForm = document.querySelector('#panel-register form');
  if (!registerForm) return;
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = registerForm.querySelector('#reg-fname').value;
    const lastName = registerForm.querySelector('#reg-lname').value;
    const email = registerForm.querySelector('#reg-email').value;
    const password = registerForm.querySelector('#reg-password').value;
    const dob = registerForm.querySelector('#reg-dob').value;
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    try {
      await handleRegister(firstName, lastName, email, password, dob);
      showNotification('Registration successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (err) {
      showNotification(err.message, 'error');
      submitBtn.textContent = 'Create Account';
      submitBtn.disabled = false;
    }
  });
}

// Update navigation based on login status
function updateNav() {
  const token = getToken();
  const loginLinks = document.querySelectorAll('a[href="login.html"]');
  const dashboardLink = document.getElementById('dashboard-link');
  const logoutBtn = document.getElementById('logout-btn');
  const isDashboardPage = window.location.pathname.endsWith('dashboard.html');
  if (token) {
    loginLinks.forEach(link => link.style.display = 'none');
    if (dashboardLink) {
      dashboardLink.style.display = isDashboardPage ? 'none' : 'inline-block';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      if (!logoutBtn.dataset.listener) {
        logoutBtn.addEventListener('click', () => {
          localStorage.clear();
          showNotification('Logged out successfully.', 'success');
          window.location.href = 'index.html';
        });
        logoutBtn.dataset.listener = 'true';
      }
    }
  } else {
    loginLinks.forEach(link => link.style.display = 'inline-block');
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// ---------- DASHBOARD & PROFILE ----------
async function fetchUserProfile() {
  const res = await fetch('/api/auth/me', { headers: authHeader() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch profile');
  }
  return await res.json();
}

async function updateUserProfile(profileData) {
  const res = await fetch('/api/auth/me', {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Update failed');
  }
  return await res.json();
}

async function loadAppointments() {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList) return;
  try {
    const appointments = await fetchAppointments();
    if (!appointments.length) {
      appointmentsList.innerHTML = `
        <div class="empty-state">
          <p>✨ You have no upcoming appointments.</p>
          <a href="find-doctor.html" class="btn btn-primary">Book your first appointment</a>
        </div>`;
      return;
    }
    appointmentsList.innerHTML = appointments.map(appt => `
      <div class="appointment-card">
        <div class="appointment-info">
          <h3>${appt.doctorName}</h3>
          <p><strong>Date:</strong> ${new Date(appt.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appt.time}</p>
          ${appt.reason ? `<p><strong>Reason:</strong> ${appt.reason}</p>` : ''}
        </div>
        <div class="appointment-actions">
          <button class="btn btn-outline btn-sm" onclick="reschedulePrompt('${appt._id}')">Reschedule</button>
          <button class="btn btn-outline btn-sm" onclick="cancelAppointmentUI('${appt._id}')">Cancel</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    appointmentsList.innerHTML = `<p class="error-message">Failed to load appointments. ${err.message}</p>`;
  }
}

async function loadDashboardData() {
  const token = getToken();
  if (!token) {
    return;
  }

  try {
    const user = await fetchUserProfile();
    const userName = `${user.firstName} ${user.lastName}`;
    localStorage.setItem('userName', userName);
    localStorage.setItem('userEmail', user.email);

    document.getElementById('user-name').textContent = user.firstName;
    document.getElementById('welcome-message').innerHTML = `Welcome back, <span id="user-name">${user.firstName}</span>!`;
    document.getElementById('user-email').textContent = user.email;
    const memberDate = new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    document.getElementById('member-since').textContent = `Member since: ${memberDate}`;

    const initials = (user.firstName[0] + (user.lastName[0] || '')).toUpperCase();
    const avatarInitials = document.getElementById('avatar-initials');
    if (avatarInitials) avatarInitials.textContent = initials;

    const profileFirst = document.getElementById('profile-firstname');
    const profileLast = document.getElementById('profile-lastname');
    const profileEmail = document.getElementById('profile-email');
    const profilePhone = document.getElementById('profile-phone');
    const profileDob = document.getElementById('profile-dob');

    if (profileFirst) profileFirst.value = user.firstName || '';
    if (profileLast) profileLast.value = user.lastName || '';
    if (profileEmail) profileEmail.value = user.email || '';
    if (profilePhone) profilePhone.value = user.phone || '';
    if (profileDob && user.dateOfBirth) {
      profileDob.value = new Date(user.dateOfBirth).toISOString().split('T')[0];
    }

    await loadAppointments();
  } catch (err) {
    showNotification(err.message, 'error');
    console.error(err);
  }
}

function initProfileForm() {
  const profileForm = document.getElementById('profile-form');
  if (!profileForm) return;
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;
    }

    const profileData = {
      firstName: document.getElementById('profile-firstname').value,
      lastName: document.getElementById('profile-lastname').value,
      email: document.getElementById('profile-email').value,
      phone: document.getElementById('profile-phone').value
    };

    try {
      const updatedUser = await updateUserProfile(profileData);
      showNotification('Profile updated successfully!', 'success');
      localStorage.setItem('userName', `${updatedUser.firstName} ${updatedUser.lastName}`);
      localStorage.setItem('userEmail', updatedUser.email);
      document.getElementById('user-name').textContent = updatedUser.firstName;
      document.getElementById('welcome-message').innerHTML = `Welcome back, <span id="user-name">${updatedUser.firstName}</span>!`;
      document.getElementById('user-email').textContent = updatedUser.email;
      const initials = (updatedUser.firstName[0] + (updatedUser.lastName[0] || '')).toUpperCase();
      const avatarInitials = document.getElementById('avatar-initials');
      if (avatarInitials) avatarInitials.textContent = initials;
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.textContent = 'Save Changes';
        submitBtn.disabled = false;
      }
    }
  });
}

function initDashboardNav() {
  const navLinks = document.querySelectorAll('.dashboard-nav a');
  const sections = document.querySelectorAll('.dashboard-section');
  if (!navLinks.length || !sections.length) return;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      sections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionId}-section`);
      });
    });
  });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initLoginForm();
  initRegisterForm();
  updateNav();
  setMaxDateOfBirth();

  const isDashboardPage = document.querySelector('.dashboard-nav');
  if (isDashboardPage) {
    initDashboardNav();
    initProfileForm();
    loadDashboardData();
  }
});


function setMaxDateOfBirth() {
  const dobInput = document.getElementById('reg-dob');
  if (dobInput) {
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    dobInput.setAttribute('max', today);
  }
}