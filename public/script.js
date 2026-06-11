// Helper functions
function getToken() { return localStorage.getItem('token'); }

function authHeader() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function showLegacyNotification(message, type = 'info') {
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

function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-indicator" aria-hidden="true"></span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showSkeleton(container, count = 3) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => '<div class="skeleton" aria-hidden="true"></div>').join('');
}

// ========== PERSONALIZATION & PREFERENCES ==========

function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const isDark = localStorage.getItem('darkMode') === 'true';
  document.documentElement.classList.toggle('dark', isDark);
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const nextIsDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextIsDark);
    localStorage.setItem('darkMode', String(nextIsDark));
  });
}

function initLanguagePreference() {
  const langSelect = document.getElementById('language');
  const savedLang = localStorage.getItem('language') || 'en';
  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener('change', () => {
      localStorage.setItem('language', langSelect.value);
      showNotification(`Language set to ${langSelect.options[langSelect.selectedIndex].text}`, 'info');
    });
  }
}

function initAccessibility() {
  const largeTextBtn = document.getElementById('largeTextToggle');
  const highContrastBtn = document.getElementById('highContrastToggle');

  // Load saved preferences
  if (localStorage.getItem('largeText') === 'true') {
    document.body.classList.add('large-text');
    if (largeTextBtn) largeTextBtn.classList.add('active');
  }
  if (localStorage.getItem('highContrast') === 'true') {
    document.body.classList.add('high-contrast');
    if (highContrastBtn) highContrastBtn.classList.add('active');
  }

  // Toggle handlers
  if (largeTextBtn) {
    largeTextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('large-text');
      largeTextBtn.classList.toggle('active');
      localStorage.setItem('largeText', document.body.classList.contains('large-text'));
      showNotification('Large text mode ' + (document.body.classList.contains('large-text') ? 'enabled' : 'disabled'), 'info');
    });
  }

  if (highContrastBtn) {
    highContrastBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('high-contrast');
      highContrastBtn.classList.toggle('active');
      localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
      showNotification('High contrast mode ' + (document.body.classList.contains('high-contrast') ? 'enabled' : 'disabled'), 'info');
    });
  }
}

// ========== NOTIFICATION PREFERENCES ==========

async function loadNotificationPrefs() {
  try {
    const res = await fetch('/api/auth/preferences', { headers: authHeader() });
    if (!res.ok) return;
    const prefs = await res.json();
    
    const emailCheckbox = document.getElementById('notif-email');
    const smsCheckbox = document.getElementById('notif-sms');
    const pushCheckbox = document.getElementById('notif-push');

    if (emailCheckbox) emailCheckbox.checked = prefs.email;
    if (smsCheckbox) smsCheckbox.checked = prefs.sms;
    if (pushCheckbox) pushCheckbox.checked = prefs.push;
  } catch (err) {
    console.error('Failed to load notification preferences:', err);
  }
}

async function saveNotificationPrefs() {
  try {
    const prefs = {
      email: document.getElementById('notif-email')?.checked || false,
      sms: document.getElementById('notif-sms')?.checked || false,
      push: document.getElementById('notif-push')?.checked || false
    };

    const res = await fetch('/api/auth/preferences', {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify(prefs)
    });

    if (res.ok) {
      showNotification('Preferences saved successfully', 'success');
    } else {
      showNotification('Failed to save preferences', 'error');
    }
  } catch (err) {
    showNotification('Error saving preferences', 'error');
    console.error(err);
  }
}

// ========== FAVORITE DOCTORS ==========

let userFavorites = [];

async function loadFavorites() {
  try {
    const token = getToken();
    if (!token) return;
    
    const res = await fetch('/api/doctors/favorites', { headers: authHeader() });
    if (res.ok) {
      userFavorites = await res.json();
    }
  } catch (err) {
    console.error('Failed to load favorites:', err);
  }
}

async function toggleFavorite(doctorId, btn) {
  try {
    const isFavorited = userFavorites.some(f => f._id === doctorId);
    const method = isFavorited ? 'DELETE' : 'POST';
    
    const res = await fetch(`/api/doctors/${doctorId}/favorite`, { 
      method, 
      headers: authHeader() 
    });

    if (res.ok) {
      if (isFavorited) {
        userFavorites = userFavorites.filter(f => f._id !== doctorId);
        if (btn) {
          btn.textContent = '🤍';
          btn.classList.remove('favorited');
        }
        showNotification('Removed from favorites', 'info');
      } else {
        userFavorites.push({ _id: doctorId });
        if (btn) {
          btn.textContent = '❤️';
          btn.classList.add('favorited');
        }
        showNotification('Added to favorites', 'success');
      }
    }
  } catch (err) {
    showNotification('Error updating favorite', 'error');
    console.error(err);
  }
}

async function loadFavoritesDashboard() {
  try {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    if (userFavorites.length === 0) {
      container.innerHTML = '<p>You haven\'t favorited any doctors yet. <a href="find-doctor.html">Browse doctors</a> to add favorites.</p>';
      return;
    }

    container.innerHTML = userFavorites.map(doc => `
      <div class="favorite-doctor-card">
        <h3>${doc.name}</h3>
        <p>${doc.specialty}</p>
        <p class="text-small">⭐ ${doc.rating} (${doc.reviews} reviews)</p>
        <p class="text-small">📍 ${doc.location}</p>
        <a href="book-appointment.html?doctor=${doc._id}" class="btn btn-primary">Book Now</a>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load favorites on dashboard:', err);
  }
}

// ========== RECENTLY BOOKED DOCTORS ==========

function addToRecentBookings(doctorId, doctorName) {
  try {
    let recent = JSON.parse(localStorage.getItem('recentBookings')) || [];
    recent = recent.filter(r => r.id !== doctorId);
    recent.unshift({ id: doctorId, name: doctorName });
    if (recent.length > 3) recent.pop();
    localStorage.setItem('recentBookings', JSON.stringify(recent));
  } catch (err) {
    console.error('Error adding to recent bookings:', err);
  }
}

function loadRecentDoctors() {
  try {
    const recent = JSON.parse(localStorage.getItem('recentBookings')) || [];
    const container = document.getElementById('recent-list');
    if (!container) return;

    if (recent.length === 0) {
      container.innerHTML = '<p>No recent bookings yet. <a href="find-doctor.html">Book an appointment</a> to get started.</p>';
      return;
    }

    container.innerHTML = recent.map(doc => `
      <div class="recent-doctor-card">
        <span>${doc.name}</span>
        <a href="book-appointment.html?doctor=${doc.id}" class="btn btn-outline">Book Again</a>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load recent doctors:', err);
  }
}

// ========== END PERSONALIZATION & PREFERENCES ==========

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

async function fetchDoctors() {
  const response = await fetch('/api/doctors');
  if (!response.ok) throw new Error('Failed to fetch doctors');
  return response.json();
}

async function fetchAppointments() {
  const response = await fetch('/api/appointments', { headers: authHeader() });
  if (!response.ok) throw new Error('Failed to fetch appointments');
  const data = await response.json();
  return Array.isArray(data) ? data.filter(appt => appt.status !== 'cancelled') : [];
}

async function createAppointment(appointmentData) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(appointmentData)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to book appointment');
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
  showSkeleton(appointmentsList, 3);
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
    appointmentsList.innerHTML = appointments.map(appt => {
      const status = appt.status || 'upcoming';
      const statusLabel = status === 'cancelled' ? 'Cancelled' : status === 'rescheduled' ? 'Rescheduled' : status === 'completed' ? 'Completed' : 'Upcoming';
      const isEditable = status === 'upcoming' || status === 'rescheduled';
      return `
      <div class="appointment-card ${status === 'cancelled' ? 'appointment-card--cancelled' : ''}">
        <div class="appointment-info">
          <div class="appointment-row">
            <h3>${appt.doctorName}</h3>
            <span class="status-badge status-badge--${status}">${statusLabel}</span>
          </div>
          <p><strong>Date:</strong> ${new Date(appt.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appt.time}</p>
          ${appt.reason ? `<p><strong>Reason:</strong> ${appt.reason}</p>` : ''}
        </div>
        <div class="appointment-actions">
          ${isEditable ? `
            <button class="btn btn-outline btn-sm" onclick="openRescheduleModal('${appt._id}','${appt.date}','${appt.time}')">Reschedule</button>
            <button class="btn btn-outline btn-sm" onclick="openConfirmModal('${appt._id}','Are you sure you want to cancel this appointment?')">Cancel</button>
          ` : `<span class="text-small">This appointment is ${statusLabel.toLowerCase()}.</span>`}
        </div>
      </div>
      `;
    }).join('');
  } catch (err) {
    appointmentsList.innerHTML = `<p class="error-message">Failed to load appointments. ${err.message}</p>`;
  }
}

// Modal-based reschedule and confirmation handlers
function openRescheduleModal(appointmentId, dateISO, time) {
  const modal = document.getElementById('reschedule-modal');
  if (!modal) return;
  const idInput = document.getElementById('reschedule-id');
  const dateInput = document.getElementById('reschedule-date');
  const timeInput = document.getElementById('reschedule-time');
  idInput.value = appointmentId || '';
  if (dateISO) {
    try {
      const d = new Date(dateISO);
      dateInput.value = d.toISOString().split('T')[0];
    } catch (e) {
      dateInput.value = '';
    }
  } else dateInput.value = '';
  timeInput.value = time || '';
  modal.setAttribute('aria-hidden', 'false');
}

function closeRescheduleModal() {
  const modal = document.getElementById('reschedule-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

function openConfirmModal(appointmentId, message) {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('confirm-message').textContent = message || 'Are you sure?';
  modal._targetId = appointmentId;
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal._targetId = null;
}

// Wire modal form submit and confirm actions
function initModals() {
  const rescheduleForm = document.getElementById('reschedule-form');
  const rescheduleCancel = document.getElementById('reschedule-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmCancel = document.getElementById('confirm-cancel');

  if (rescheduleForm) {
    rescheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('reschedule-id').value;
      const date = document.getElementById('reschedule-date').value;
      const time = document.getElementById('reschedule-time').value;
      if (!id || !date || !time) {
        showNotification('Please provide both date and time', 'error');
        return;
      }
      try {
        const res = await fetch(`/api/appointments/${id}/reschedule`, {
          method: 'PATCH',
          headers: authHeader(),
          body: JSON.stringify({ date, time })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to reschedule appointment');
        showNotification('Appointment rescheduled', 'success');
        closeRescheduleModal();
        await loadAppointments();
      } catch (err) {
        showNotification(err.message, 'error');
        console.error(err);
      }
    });
  }

  if (rescheduleCancel) rescheduleCancel.addEventListener('click', (e) => { e.preventDefault(); closeRescheduleModal(); });

  if (confirmOk) {
    confirmOk.addEventListener('click', async (e) => {
      e.preventDefault();
      const modal = document.getElementById('confirm-modal');
      const id = modal && modal._targetId;
      if (!id) { closeConfirmModal(); return; }
      try {
        const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'PATCH', headers: authHeader() });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment');
        showNotification('Appointment cancelled', 'success');
        closeConfirmModal();
        await loadAppointments();
      } catch (err) {
        showNotification(err.message, 'error');
        console.error(err);
      }
    });
  }

  if (confirmCancel) confirmCancel.addEventListener('click', (e) => { e.preventDefault(); closeConfirmModal(); });
}

async function loadDashboardData() {
  const token = getToken();
  if (!token) {
    return;
  }

  try {
    const user = await fetchUserProfile();
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    localStorage.setItem('userName', userName);
    localStorage.setItem('userEmail', user.email || '');

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const initials = ((firstName.charAt(0) || '') + (lastName.charAt(0) || '')).toUpperCase() || 'U';

    const userNameEl = document.getElementById('user-name');
    const welcomeMessageEl = document.getElementById('welcome-message');
    const userEmailEl = document.getElementById('user-email');
    const memberSinceEl = document.getElementById('member-since');
    const avatarInitials = document.getElementById('avatar-initials');

    if (userNameEl) userNameEl.textContent = firstName;
    if (welcomeMessageEl) welcomeMessageEl.innerHTML = `Welcome back, <span id="user-name">${firstName}</span>!`;
    if (userEmailEl) userEmailEl.textContent = user.email || '';
    if (memberSinceEl && user.createdAt) {
      memberSinceEl.textContent = `Member since: ${new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}`;
    }
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

    await loadKPI();
    initQuickActions();
    await loadAppointments();
    await loadFavoritesDashboard();
    loadRecentDoctors();
  } catch (err) {
    showNotification(err.message, 'error');
    console.error(err);
  }
}

async function loadKPI() {
  const kpiGrid = document.getElementById('kpi-grid');
  if (!kpiGrid) return;
  showSkeleton(kpiGrid, 4);

  await new Promise(resolve => setTimeout(resolve, 500));
  const kpiData = {
    todayAppointments: 4,
    upcomingAppointments: 12,
    cancellationsThisMonth: 2,
    activeDoctors: 8
  };

  kpiGrid.innerHTML = `
    <div class="kpi-card">
      <h4>Today's Appointments</h4>
      <div class="kpi-value">${kpiData.todayAppointments}</div>
    </div>
    <div class="kpi-card">
      <h4>Upcoming</h4>
      <div class="kpi-value">${kpiData.upcomingAppointments}</div>
    </div>
    <div class="kpi-card">
      <h4>Cancellations (month)</h4>
      <div class="kpi-value">${kpiData.cancellationsThisMonth}</div>
    </div>
    <div class="kpi-card">
      <h4>Active Doctors</h4>
      <div class="kpi-value">${kpiData.activeDoctors}</div>
    </div>
  `;
}

let weeklyChart, peakChart;

function initCharts() {
  const weeklyCanvas = document.getElementById('weeklyChart');
  const peakCanvas = document.getElementById('peakHoursChart');
  if (weeklyCanvas) {
    const ctxWeekly = weeklyCanvas.getContext('2d');
    weeklyChart = new Chart(ctxWeekly, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Appointments',
          data: [3, 5, 2, 7, 8, 4, 1],
          backgroundColor: 'rgba(14, 165, 233, 0.9)',
          borderRadius: 8,
          barThickness: 24,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 8, right: 8, bottom: 4, left: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'var(--text-secondary)' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { color: 'var(--text-secondary)' }
          }
        }
      }
    });
  }
  if (peakCanvas) {
    const ctxPeak = peakCanvas.getContext('2d');
    peakChart = new Chart(ctxPeak, {
      type: 'line',
      data: {
        labels: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'],
        datasets: [{
          label: 'Bookings',
          data: [2, 4, 6, 3, 1, 5, 7, 2],
          borderColor: 'rgba(14, 165, 233, 0.95)',
          backgroundColor: 'rgba(14, 165, 233, 0.16)',
          fill: true,
          tension: 0.32,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: 'rgba(14, 165, 233, 0.9)',
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 8, right: 8, bottom: 4, left: 4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'var(--text-secondary)' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { color: 'var(--text-secondary)' }
          }
        }
      }
    });
  }
}

async function loadActivityFeed() {
  const container = document.getElementById('activity-list');
  if (!container) return;
  showSkeleton(container, 3);
  await new Promise(resolve => setTimeout(resolve, 400));

  const activities = [
    { type: 'booking', doctor: 'Dr. Rachel Ahmed', time: '2 hours ago' },
    { type: 'cancel', doctor: 'Dr. Samuel Mbeki', time: 'Yesterday' },
    { type: 'reschedule', doctor: 'Dr. Helen Clarke', time: '3 days ago' },
    { type: 'booking', doctor: 'Dr. Priya Kapoor', time: '4 days ago' },
    { type: 'booking', doctor: 'Dr. Noah Smith', time: '5 days ago' }
  ];

  container.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <span>${activity.type === 'booking' ? '📅' : activity.type === 'cancel' ? '❌' : '🔄'}</span>
      <span><strong>${activity.doctor}</strong> – ${activity.type} ${activity.time}</span>
    </div>
  `).join('');
}

function initQuickActions() {
  const bookBtn = document.getElementById('quick-book');
  const favBtn = document.getElementById('quick-favorites');
  const reportsBtn = document.getElementById('quick-reports');

  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      window.location.href = 'find-doctor.html';
    });
  }
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const favoritesTab = document.querySelector('.dashboard-tabs .tab-btn[data-tab="favorites"]');
      favoritesTab?.click();
    });
  }
  if (reportsBtn) {
    reportsBtn.addEventListener('click', () => {
      showNotification('Reports coming soon!', 'info');
    });
  }
}

function initDashboardTabs() {
  const tabs = document.querySelectorAll('.dashboard-tabs .tab-btn');
  const panels = document.querySelectorAll('.tab-content');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(panel => panel.classList.toggle('active', panel.id === `${selected}-tab`));
      if (selected === 'favorites') loadFavoritesDashboard();
      if (selected === 'recent') loadRecentDoctors();
    });
  });
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

function initPreferencesForm() {
  const preferencesForm = document.getElementById('preferences-form');
  if (!preferencesForm) return;

  // Load initial preferences
  initLanguagePreference();
  loadNotificationPrefs();

  // Handle form submission
  preferencesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = preferencesForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;
    }

    try {
      await saveNotificationPrefs();
    } catch (err) {
      showNotification('Error saving preferences', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.textContent = 'Save Preferences';
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

async function initDoctorFilter() {
  const filterForm = document.querySelector('.filter-form');
  const clearBtn = document.getElementById('clear-filters');
  const doctorGrid = document.querySelector('.doctor-grid');
  const resultsCount = document.querySelector('.results-count');
  
  if (!doctorGrid) {
    console.warn('Doctor grid not found - are we on the right page?');
    return;
  }

  let allDoctors = [];

  try {
    showSkeleton(doctorGrid, 3);
    allDoctors = await fetchDoctors();
    renderDoctors(allDoctors);
  } catch (err) {
    console.error('Failed to load doctors:', err);
    doctorGrid.innerHTML = '<p class="error">Unable to load doctors. Please refresh the page.</p>';
    if (resultsCount) resultsCount.textContent = 'Error loading doctors';
    return;
  }

  function renderDoctors(doctors) {
    if (!doctors.length) {
      doctorGrid.innerHTML = '<p class="no-results">No doctors match your filters. Try adjusting your criteria.</p>';
      if (resultsCount) resultsCount.textContent = 'Showing 0 doctors';
      return;
    }
    doctorGrid.innerHTML = doctors.map(doc => {
      const isFavorited = userFavorites.some(f => f._id === doc._id);
      return `
      <article class="doctor-card">
        <div class="doctor-avatar">${doc.avatarInitials || doc.name.charAt(0)}</div>
        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${doc._id}" aria-label="Toggle favorite">
          ${isFavorited ? '❤️' : '🤍'}
        </button>
        <div class="doctor-info">
          <h3>${doc.name}</h3>
          <p class="doctor-spec">${doc.specialty}</p>
          <p class="doctor-location">${doc.location}</p>
          <div class="doctor-rating">
            <span class="stars">${'★'.repeat(Math.floor(doc.rating))}${doc.rating % 1 ? '½' : ''}</span>
            <span class="rating-text">${doc.rating} (${doc.reviews} reviews)</span>
          </div>
          <p class="doctor-avail">Next available: ${doc.nextAvailable}</p>
          <a href="book-appointment.html?doctor=${doc._id}" class="btn btn-primary">Book Now</a>
        </div>
      </article>
    `}).join('');
    
    // Attach favorite button handlers
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const doctorId = btn.dataset.id;
        toggleFavorite(doctorId, btn);
      });
    });
    
    if (resultsCount) resultsCount.textContent = `Showing ${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`;
  }

  // Filter submit handler
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault(); // CRITICAL: prevents page reload
      
      const specialty = document.getElementById('specialty')?.value.toLowerCase() || '';
      const availability = document.getElementById('availability')?.value.toLowerCase() || '';
      const location = document.getElementById('location')?.value.toLowerCase() || '';
      const rating = document.getElementById('rating')?.value || '';
      
      let filtered = allDoctors;
      if (specialty) filtered = filtered.filter(d => d.specialty.toLowerCase().includes(specialty));
      if (location) filtered = filtered.filter(d => d.location.toLowerCase().includes(location));
      if (rating) filtered = filtered.filter(d => d.rating >= parseInt(rating));
      if (availability) {
        filtered = filtered.filter(d => d.nextAvailable.toLowerCase().includes(availability));
      }
      renderDoctors(filtered);
    });
  }

  // Clear filters button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (filterForm) filterForm.reset();
      // Reset each select manually to ensure empty value
      const specialtyEl = document.getElementById('specialty');
      const availabilityEl = document.getElementById('availability');
      const locationEl = document.getElementById('location');
      const ratingEl = document.getElementById('rating');
      if (specialtyEl) specialtyEl.value = '';
      if (availabilityEl) availabilityEl.value = '';
      if (locationEl) locationEl.value = '';
      if (ratingEl) ratingEl.value = '';
      renderDoctors(allDoctors);
    });
  }
}

// ========== BOOKING WIZARD ==========
let wizardState = {
  step: 1,
  specialty: null,
  doctorId: null,
  doctorName: null,
  date: null,
  time: null,
  reason: ''
};

let allDoctors = [];
let uniqueSpecialties = [];

async function loadDoctorsForWizard() {
  try {
    allDoctors = await fetchDoctors();
    uniqueSpecialties = [...new Set(allDoctors.map(d => d.specialty))].sort();
    renderSpecialties();

    // Check if doctor ID is in URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('doctor');
    if (doctorId) {
      const selectedDoc = allDoctors.find(d => d._id === doctorId);
      if (selectedDoc) {
        wizardState.specialty = selectedDoc.specialty;
        wizardState.doctorId = selectedDoc._id;
        wizardState.doctorName = selectedDoc.name;
        // Skip to step 2 (doctor selection) since specialty is already determined
        renderDoctorsBySpecialty();
        showStep(2);
        return;
      }
    }
    // Otherwise start at step 1
    showStep(1);
  } catch (err) {
    showNotification('Failed to load doctors', 'error');
    console.error(err);
  }
}

function renderSpecialties() {
  const container = document.getElementById('specialty-grid');
  if (!container) return;
  
  container.innerHTML = uniqueSpecialties.map(spec => `
    <div class="specialty-card" data-specialty="${spec}">
      <h3>${spec}</h3>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.specialty-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.specialty-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      wizardState.specialty = card.dataset.specialty;
      document.getElementById('specialty-name').textContent = `${wizardState.specialty} Specialists`;
      renderDoctorsBySpecialty();
    });
  });
}

function renderDoctorsBySpecialty() {
  const container = document.getElementById('doctor-grid-wizard');
  if (!container) return;
  
  const filtered = allDoctors.filter(d => d.specialty === wizardState.specialty);
  
  container.innerHTML = filtered.map(doc => `
    <div class="doctor-card-wizard" data-doctor-id="${doc._id}" data-doctor-name="${doc.name}">
      <h3>${doc.name}</h3>
      <p>⭐ ${doc.rating} (${doc.reviews} reviews)</p>
      <p class="text-small">📍 ${doc.location}</p>
      <p class="text-small">Next available: ${doc.nextAvailable}</p>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.doctor-card-wizard').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.doctor-card-wizard').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      wizardState.doctorId = card.dataset.doctorId;
      wizardState.doctorName = card.dataset.doctorName;
      document.getElementById('confirm-doctor-btn').disabled = false;
    });
  });

  // If doctor was pre-selected from URL, highlight it
  if (wizardState.doctorId) {
    const preselected = document.querySelector(`.doctor-card-wizard[data-doctor-id="${wizardState.doctorId}"]`);
    if (preselected) {
      preselected.classList.add('selected');
      document.getElementById('confirm-doctor-btn').disabled = false;
    }
  }
}

function updateSummary() {
  const summaryDiv = document.getElementById('summary-card');
  if (!summaryDiv) return;

  const dateObj = new Date(wizardState.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-GB', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  const [hours, minutes] = wizardState.time.split(':');
  const timeObj = new Date();
  timeObj.setHours(parseInt(hours), parseInt(minutes));
  const formattedTime = timeObj.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  summaryDiv.innerHTML = `
    <p><strong>Doctor:</strong> ${wizardState.doctorName}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${formattedTime}</p>
    <p><strong>Reason:</strong> ${wizardState.reason || '(Not provided)'}</p>
  `;
}

function showStep(stepNumber) {
  const steps = document.querySelectorAll('.wizard-step');
  const stepIndicators = document.querySelectorAll('.step-item');

  steps.forEach((step, idx) => {
    step.style.display = idx + 1 === stepNumber ? 'block' : 'none';
  });

  stepIndicators.forEach((ind, idx) => {
    if (idx + 1 === stepNumber) {
      ind.classList.add('active');
    } else {
      ind.classList.remove('active');
    }
  });

  wizardState.step = stepNumber;

  // Update summary on step 4
  if (stepNumber === 4) {
    updateSummary();
  }
}

function initWizard() {
  const dateInput = document.getElementById('appt-date');
  
  // Set minimum date to today
  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  // Next button handlers
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.dataset.next);

      // Validate before moving to next step
      if (nextStep === 2 && !wizardState.specialty) {
        showNotification('Please select a specialty first', 'error');
        return;
      }
      if (nextStep === 3 && !wizardState.doctorId) {
        showNotification('Please select a doctor', 'error');
        return;
      }
      if (nextStep === 4) {
        const date = document.getElementById('appt-date').value;
        const timeSlot = document.querySelector('input[name="timeslot"]:checked');
        
        if (!date || !timeSlot) {
          showNotification('Please select both date and time', 'error');
          return;
        }
        
        wizardState.date = date;
        wizardState.time = timeSlot.value;
        wizardState.reason = document.getElementById('appt-reason').value;
      }

      showStep(nextStep);
    });
  });

  // Previous button handlers
  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.dataset.prev);
      showStep(prevStep);
    });
  });

  // Final booking button
  const finalBookBtn = document.getElementById('final-book-btn');
  if (finalBookBtn) {
    finalBookBtn.addEventListener('click', async () => {
      finalBookBtn.textContent = 'Booking...';
      finalBookBtn.disabled = true;

      try {
        const appointmentData = {
          doctorId: wizardState.doctorId,
          date: wizardState.date,
          time: wizardState.time,
          reason: wizardState.reason
        };

        await createAppointment(appointmentData);
        
        // Add to recently booked doctors
        addToRecentBookings(wizardState.doctorId, wizardState.doctorName);
        
        showNotification('Appointment booked successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
      } catch (err) {
        showNotification(err.message || 'Failed to book appointment', 'error');
        finalBookBtn.textContent = 'Confirm Booking →';
        finalBookBtn.disabled = false;
      }
    });
  }

  // Enable date/time button validation
  const dateInput2 = document.getElementById('appt-date');
  const confirmTimeBtn = document.getElementById('confirm-time-btn');
  const timeSlotRadios = document.querySelectorAll('input[name="timeslot"]');

  function validateDateTime() {
    const hasDate = dateInput2 && dateInput2.value;
    const hasTime = document.querySelector('input[name="timeslot"]:checked');
    if (confirmTimeBtn) {
      confirmTimeBtn.disabled = !(hasDate && hasTime);
    }
  }

  if (dateInput2) {
    dateInput2.addEventListener('change', validateDateTime);
  }

  timeSlotRadios.forEach(radio => {
    radio.addEventListener('change', validateDateTime);
  });
}

// ========== END BOOKING WIZARD ==========

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initAccessibility();
  initTabs();
  initLoginForm();
  initRegisterForm();
  updateNav();
  if (document.querySelector('.doctor-grid')) {
    initDoctorFilter();
    initCharts();
    await loadActivityFeed();
  }
  setMaxDateOfBirth();
  
  // Load favorites for Find Doctor page
  await loadFavorites();

  // Check if we're on a page that needs the wizard
  const isBookingPage = document.getElementById('step-1');
  if (isBookingPage) {
    await loadDoctorsForWizard();
    initWizard();
  }

  // Check if we're on the dashboard
  const isDashboardPage = document.querySelector('.dashboard-tabs');
  if (isDashboardPage) {
    initDashboardTabs();
    initProfileForm();
    initPreferencesForm();
    initModals();
    await loadDashboardData();
  }
});


function setMaxDateOfBirth() {
  const dobInput = document.getElementById('reg-dob');
  if (dobInput) {
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    dobInput.setAttribute('max', today);
  }
}
