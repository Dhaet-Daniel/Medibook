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
  // Create a toast container if not present
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.right = '1rem';
    container.style.bottom = '1rem';
    container.style.zIndex = 1100;
    container.style.display = 'flex';
    container.style.flexDirection = 'column-reverse';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-indicator" aria-hidden="true"></span>
    <div style="flex:1">${message}</div>
    <button class="toast-close" aria-label="Close toast">×</button>
  `;
  container.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => {
    toast.remove();
  }, 4000);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
}

function showSkeleton(container, count = 3) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => '<div class="skeleton" aria-hidden="true"></div>').join('');
}

function showNotificationWithUndo(message, undoCallback) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.right = '1rem';
    container.style.bottom = '1rem';
    container.style.zIndex = 1100;
    container.style.display = 'flex';
    container.style.flexDirection = 'column-reverse';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast--info';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-indicator" aria-hidden="true"></span>
    <div style="flex:1;">${message}</div>
    <button class="toast-undo" style="background:none; border:none; color:var(--accent); font-weight:600; cursor:pointer; text-decoration:underline; margin-left:0.5rem;">Undo</button>
    <button class="toast-close" aria-label="Close toast">×</button>
  `;
  container.appendChild(toast);

  toast.querySelector('.toast-undo').addEventListener('click', () => {
    undoCallback();
    toast.remove();
  });

  const timer = setTimeout(() => {
    toast.remove();
  }, 5000);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
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

function resetAccessibility() {
  document.body.classList.remove('large-text', 'high-contrast');
  localStorage.removeItem('largeText');
  localStorage.removeItem('highContrast');

  const largeBtn = document.getElementById('largeTextToggle');
  const contrastBtn = document.getElementById('highContrastToggle');
  if (largeBtn) largeBtn.classList.remove('active');
  if (contrastBtn) contrastBtn.classList.remove('active');

  showNotification('Accessibility settings reset to default', 'info');
}

function initAccessibility() {
  const largeTextBtn = document.getElementById('largeTextToggle');
  const highContrastBtn = document.getElementById('highContrastToggle');
  const resetBtn = document.getElementById('resetAccessibility');

  if (localStorage.getItem('largeText') === 'true') {
    document.body.classList.add('large-text');
    if (largeTextBtn) largeTextBtn.classList.add('active');
  }
  if (localStorage.getItem('highContrast') === 'true') {
    document.body.classList.add('high-contrast');
    if (highContrastBtn) highContrastBtn.classList.add('active');
  }

  if (largeTextBtn) {
    largeTextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const wasEnabled = document.body.classList.contains('large-text');
      document.body.classList.toggle('large-text');
      largeTextBtn.classList.toggle('active');
      const isEnabled = document.body.classList.contains('large-text');
      localStorage.setItem('largeText', String(isEnabled));

      showNotificationWithUndo(
        isEnabled ? 'Large text enabled' : 'Large text disabled',
        () => {
          document.body.classList.toggle('large-text');
          largeTextBtn.classList.toggle('active');
          localStorage.setItem('largeText', String(!isEnabled));
          showNotification('Change undone', 'info');
        }
      );
    });
  }

  if (highContrastBtn) {
    highContrastBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const wasEnabled = document.body.classList.contains('high-contrast');
      document.body.classList.toggle('high-contrast');
      highContrastBtn.classList.toggle('active');
      const isEnabled = document.body.classList.contains('high-contrast');
      localStorage.setItem('highContrast', String(isEnabled));

      showNotificationWithUndo(
        isEnabled ? 'High contrast enabled' : 'High contrast disabled',
        () => {
          document.body.classList.toggle('high-contrast');
          highContrastBtn.classList.toggle('active');
          localStorage.setItem('highContrast', String(!isEnabled));
          showNotification('Change undone', 'info');
        }
      );
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAccessibility();
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
  const container = document.getElementById('favorites-list');
  if (!container) return;
  showSkeleton(container, 3);
  try {
    await new Promise(r => setTimeout(r, 250));
    if (!userFavorites || userFavorites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🤍</div>
          <h3>No favorites yet</h3>
          <p>Browse our doctors and add favorites to quickly book later.</p>
          <a href="find-doctor.html" class="btn btn-primary">Find a Doctor</a>
        </div>`;
      return;
    }

    container.innerHTML = userFavorites.map(doc => `
      <div class="favorite-doctor-card">
        <h3>${doc.name}</h3>
        <p>${doc.specialty}</p>
        <p class="text-small">⭐ ${doc.rating || '—'} (${doc.reviews || 0} reviews)</p>
        <p class="text-small">📍 ${doc.location || '—'}</p>
        <a href="book-appointment.html?doctor=${doc._id}" class="btn btn-primary">Book Now</a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-message">Failed to load favorites.</p>`;
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

async function loadRecentDoctors() {
  const container = document.getElementById('recent-list');
  if (!container) return;
  showSkeleton(container, 2);
  try {
    await new Promise(r => setTimeout(r, 200));
    const recent = JSON.parse(localStorage.getItem('recentBookings')) || [];
    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🕒</div>
          <h3>No recent bookings</h3>
          <p>Your recent appointments will appear here.</p>
          <a href="find-doctor.html" class="btn btn-primary">Find a Doctor</a>
        </div>`;
      return;
    }

    container.innerHTML = recent.map(doc => `
      <div class="recent-doctor-card">
        <span>${doc.name}</span>
        <a href="book-appointment.html?doctor=${doc.id}" class="btn btn-outline">Book Again</a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-message">Failed to load recent bookings.</p>`;
    console.error('Failed to load recent doctors:', err);
  }
}

// ========== END PERSONALIZATION & PREFERENCES ==========

// Auth API calls
async function handleLogin(email, password, rememberMe) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  const { token, user } = data;
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
  localStorage.setItem('userEmail', user.email);

  // ★ Role-based redirection (moved inside handleLogin)
  if (user.role === 'doctor') window.location.href = 'doctor-dashboard.html';
  else if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
  else window.location.href = 'dashboard.html';

  return data; // will not execute due to redirect
}

async function handleRegister(firstName, lastName, email, password, dateOfBirth) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, dateOfBirth })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  const { token, user } = data;
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', `${user.firstName} ${user.lastName}`);
  localStorage.setItem('userEmail', user.email);

  // ★ Role-based redirection (moved inside handleRegister)
  if (user.role === 'doctor') window.location.href = 'doctor-dashboard.html';
  else if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
  else window.location.href = 'dashboard.html';

  return data; // will not execute due to redirect
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
    const rememberMe = loginForm.querySelector('#remember-me').checked;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    try {
      await handleLogin(email, password, rememberMe); // redirect handled inside
      showNotification('Login successful! Redirecting...', 'success');
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
      showNotification('Registration successful! Redirecting...', 'success');
      await handleRegister(firstName, lastName, email, password, dob); // redirect handled inside
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
          window.location.href = 'login.html';
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
  // Try to fetch live data for KPIs. Fall back to placeholders on error.
  try {
    const [apptsRes, docsRes] = await Promise.all([
      fetch('/api/appointments', { headers: authHeader() }),
      fetch('/api/doctors')
    ]);

    let appointments = [];
    if (apptsRes.ok) appointments = await apptsRes.json();
    let doctors = [];
    if (docsRes.ok) doctors = await docsRes.json();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todayAppointments = appointments.filter(a => {
      const d = new Date(a.date);
      return d >= startOfToday && d < endOfToday && a.status !== 'cancelled';
    }).length;

    const upcomingAppointments = appointments.filter(a => {
      const d = new Date(a.date);
      return d >= endOfToday && a.status !== 'cancelled';
    }).length;

    const cancellationsThisMonth = appointments.filter(a => {
      if (a.status !== 'cancelled') return false;
      const d = new Date(a.updatedAt || a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const activeDoctors = Array.isArray(doctors) ? doctors.length : 0;

    kpiGrid.innerHTML = `
      <div class="kpi-card">
        <h4>Today's Appointments</h4>
        <div class="kpi-value">${todayAppointments}</div>
      </div>
      <div class="kpi-card">
        <h4>Upcoming</h4>
        <div class="kpi-value">${upcomingAppointments}</div>
      </div>
      <div class="kpi-card">
        <h4>Cancellations (month)</h4>
        <div class="kpi-value">${cancellationsThisMonth}</div>
      </div>
      <div class="kpi-card">
        <h4>Active Doctors</h4>
        <div class="kpi-value">${activeDoctors}</div>
      </div>
    `;
  } catch (err) {
    // fallback static values
    kpiGrid.innerHTML = `
      <div class="kpi-card">
        <h4>Today's Appointments</h4>
        <div class="kpi-value">4</div>
      </div>
      <div class="kpi-card">
        <h4>Upcoming</h4>
        <div class="kpi-value">12</div>
      </div>
      <div class="kpi-card">
        <h4>Cancellations (month)</h4>
        <div class="kpi-value">2</div>
      </div>
      <div class="kpi-card">
        <h4>Active Doctors</h4>
        <div class="kpi-value">8</div>
      </div>
    `;
    console.error('Failed to load KPI data', err);
  }
}

let weeklyChart, peakChart;
let kpiPollInterval = null;

function startKpiPolling(intervalMs = 30000) {
  if (kpiPollInterval) return;
  kpiPollInterval = setInterval(() => {
    loadKPI().catch(() => {});
  }, intervalMs);
}

function stopKpiPolling() {
  if (!kpiPollInterval) return;
  clearInterval(kpiPollInterval);
  kpiPollInterval = null;
}

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
    // fetch favorites to determine current state
    (async () => {
      try {
        const res = await fetch('/api/doctors/favorites', { headers: authHeader() });
        if (!res.ok) throw new Error('Not logged in or failed to load favorites');
        const favs = await res.json();
        if (!favs || favs.length === 0) {
          favBtn.classList.add('disabled');
          favBtn.setAttribute('aria-disabled', 'true');
          favBtn.title = 'No favorites yet';
        } else {
          favBtn.classList.remove('disabled');
          favBtn.removeAttribute('aria-disabled');
          favBtn.title = `You have ${favs.length} favorite(s)`;
        }
      } catch (err) {
        favBtn.classList.add('disabled');
        favBtn.setAttribute('aria-disabled', 'true');
        favBtn.title = 'Login to access favorites';
      }
    })();

    favBtn.addEventListener('click', async () => {
      const favoritesTab = document.querySelector('.dashboard-tabs .tab-btn[data-tab="favorites"]');
      if (favoritesTab) return favoritesTab.click();
      // otherwise navigate to dashboard where favorites are available
      window.location.href = 'dashboard.html#favorites';
    });
  }
  if (reportsBtn) {
    reportsBtn.addEventListener('click', () => {
      window.location.href = 'patient-reports.html';
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
  const locationSelect = document.getElementById('location');
  
  if (!doctorGrid) {
    console.warn('Doctor grid not found - are we on the right page?');
    return;
  }

  let allDoctors = [];

  try {
    showSkeleton(doctorGrid, 3);
    allDoctors = await fetchDoctors();
    renderDoctors(allDoctors);

    // Populate location dropdown dynamically from stored doctors
    if (locationSelect) {
      const locations = [...new Set(allDoctors.map(d => d.location).filter(Boolean))].sort();
      locationSelect.innerHTML = '<option value="">All Locations</option>' +
        locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
    }
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

        // Button success micro-interaction
        finalBookBtn.classList.add('success');
        finalBookBtn.textContent = '✓ Booked!';
        showNotification('Appointment booked successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
      } catch (err) {
        showNotification(err.message || 'Failed to book appointment', 'error');
        finalBookBtn.textContent = 'Confirm Booking →';
        finalBookBtn.disabled = false;
        finalBookBtn.classList.remove('success');
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

// ============================================================
// ★★★ NEW: DOCTOR DASHBOARD FUNCTIONS (Step 8) ★★★
// ============================================================

async function initDoctorDashboard() {
  const user = await fetchUserProfile();
  const nameEl = document.getElementById('doctor-name');
  if (nameEl) nameEl.innerText = `Dr. ${user.lastName}`;
  await loadDoctorKPI();
  await loadTodaySchedule();
  setupDoctorNavigation();
  showDoctorPage('home');
  initSocketForDoctor();
}

async function loadDoctorKPI() {
  const res = await fetch('/api/doctor/kpi', { headers: authHeader() });
  if (!res.ok) {
    showNotification('Failed to load KPI data', 'error');
    return;
  }
  const data = await res.json();
  const container = document.getElementById('kpi-grid');
  if (!container) return;
  container.innerHTML = `
    <div class="kpi-card"><h4>Today's Appointments</h4><div class="kpi-value">${data.today || 0}</div></div>
    <div class="kpi-card"><h4>Upcoming</h4><div class="kpi-value">${data.upcoming || 0}</div></div>
    <div class="kpi-card"><h4>Patients This Week</h4><div class="kpi-value">${data.weeklyPatients || 0}</div></div>
    <div class="kpi-card"><h4>Pending Reviews</h4><div class="kpi-value">${data.pending || 0}</div></div>
  `;
}

async function loadTodaySchedule() {
  const container = document.getElementById('today-schedule-list');
  if (!container) return;
  try {
    const res = await fetch('/api/doctor/schedule/today', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch schedule');
    const appointments = await res.json();
    if (!appointments.length) {
      container.innerHTML = '<p class="empty-state">No appointments today.</p>';
      return;
    }
    container.innerHTML = appointments.map(a => `
      <div class="schedule-item">
        <span>${a.time}</span>
        <span>${a.patientName}</span>
        <button class="btn-sm" onclick="startConsultation('${a._id}')">Start</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-message">${err.message}</p>`;
  }
}

function setupDoctorNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) showDoctorPage(page);
    });
  });
  const logoutBtn = document.getElementById('logout-doctor');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
}

function showDoctorPage(page) {
  const container = document.getElementById('page-container');
  if (!container) return;
  if (page === 'home') {
    container.innerHTML = `
      <div class="kpi-grid" id="kpi-grid"></div>
      <div class="two-columns">
        <div class="card"><h3>Today's Schedule</h3><div id="today-schedule-list"></div></div>
        <div class="card"><h3>Upcoming Appointments</h3><div id="upcoming-list"></div></div>
      </div>
    `;
    loadDoctorKPI();
    loadTodaySchedule();
    loadUpcomingAppointments();
  } else if (page === 'appointments') {
    container.innerHTML = `<div class="card"><h3>All Appointments</h3><div id="appointments-table"></div></div>`;
    loadDoctorAppointments();
  } else if (page === 'patients') {
    container.innerHTML = `<div class="card"><h3>My Patients</h3><div id="patients-list"></div></div>`;
    loadDoctorPatients();
  } else if (page === 'consultations') {
    container.innerHTML = `<div class="card"><h3>Consultation Workspace</h3><p>Select an appointment to start</p><div id="consultation-area"></div></div>`;
  } else if (page === 'prescriptions') {
    container.innerHTML = `<div class="card"><h3>Prescriptions</h3><div id="prescriptions-list"></div></div>`;
  } else if (page === 'availability') {
    container.innerHTML = `<div class="card"><h3>Manage Availability</h3><div id="availability-calendar"></div></div>`;
    loadAvailabilityCalendar();
  } else if (page === 'profile') {
    container.innerHTML = `<div class="card"><h3>Doctor Profile</h3><form id="doctor-profile-form">...</form></div>`;
    loadDoctorProfileForm();   
  }
  // highlight nav
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');
}

// Stub functions for doctor dashboard (implement as needed)
async function loadUpcomingAppointments() {
  const container = document.getElementById('upcoming-list');
  if (!container) return;
  try {
    const res = await fetch('/api/doctor/appointments/upcoming', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch upcoming');
    const appointments = await res.json();
    if (!appointments.length) {
      container.innerHTML = '<p>No upcoming appointments.</p>';
      return;
    }
    container.innerHTML = appointments.map(a => `
      <div class="schedule-item">
        <span>${new Date(a.date).toLocaleDateString()} ${a.time}</span>
        <span>${a.patientName}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-message">${err.message}</p>`;
  }
}

async function loadDoctorAppointments() {
  const container = document.getElementById('appointments-table');
  if (!container) return;
  try {
    const res = await fetch('/api/doctor/appointments', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    const appointments = await res.json();
    if (!appointments.length) {
      container.innerHTML = '<p>No appointments found.</p>';
      return;
    }
    container.innerHTML = `<table class="data-table">${appointments.map(a => `
      <tr>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${a.time}</td>
        <td>${a.user?.firstName || ''} ${a.user?.lastName || ''}</td>
        <td>${a.status}</td>
        <td><button onclick="viewAppointment('${a._id}')">View</button></td>
      </tr>
    `).join('')}</table>`;
  } catch (err) {
    container.innerHTML = `<p class="error-message">${err.message}</p>`;
  }
}

async function loadDoctorPatients() {
  const container = document.getElementById('patients-list');
  if (!container) return;
  try {
    const res = await fetch('/api/doctor/patients', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch patients');
    const patients = await res.json();
    if (!patients.length) {
      container.innerHTML = '<p>No patients yet.</p>';
      return;
    }
    container.innerHTML = patients.map(p => 
      `<div>${p.firstName} ${p.lastName} - ${p.email}</div>`
    ).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-message">${err.message}</p>`;
  }
}

async function loadAvailabilityCalendar() {
  // Placeholder
  const container = document.getElementById('availability-calendar');
  if (container) container.innerHTML = '<p>Availability calendar coming soon.</p>';
}

async function loadDoctorProfileForm() {
  // Placeholder
  const container = document.getElementById('doctor-profile-form');
  if (container) container.innerHTML = '<p>Profile form coming soon.</p>';
}

function initSocketForDoctor() {
  // Ensure socket.io is loaded
  if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('appointment_updated', () => {
      if (document.querySelector('.kpi-grid')) loadDoctorKPI();
      if (document.querySelector('#today-schedule-list')) loadTodaySchedule();
    });
  }
}

function startConsultation(id) {
  showNotification('Consultation feature coming soon', 'info');
}

function viewAppointment(id) {
  showNotification('View appointment details', 'info');
}

// ========== ADMIN DASHBOARD ==========
if (document.body.classList.contains('admin-dashboard')) {
  initAdminDashboard();
}

async function initAdminDashboard() {
  await loadAdminKPI();
  setupAdminNavigation();
  setupAddDoctorModal();
  setupEditDoctorModal();
  setupEditAppointmentModal();
  setupAddPatientModal();
  setupEditPatientModal();
  showAdminPage('home');
}

// --- Load real KPI data ---
async function loadAdminKPI() {
  const res = await fetch('/api/admin/kpi', { headers: authHeader() });
  const data = await res.json();
  const html = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">👨‍⚕️ Total Doctors</div>
        <div class="kpi-value">${data.totalDoctors}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">👥 Total Patients</div>
        <div class="kpi-value">${data.totalPatients}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">📅 Today's Appointments</div>
        <div class="kpi-value">${data.todayAppointments}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">💰 Monthly Revenue</div>
        <div class="kpi-value">$${data.revenue}</div>
      </div>
    </div>
  `;
  // Inject into page container – but we handle it in showAdminPage
  // We'll keep it in a global var to reuse.
  window._kpiHTML = html;
}

// --- Navigation ---
function setupAdminNavigation() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) showAdminPage(page);
    });
  });
  document.getElementById('logout-admin').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });
}

// --- Page renderer ---
function showAdminPage(page) {
  const container = document.getElementById('page-container');
  // Highlight nav
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.sidebar-nav .nav-item[data-page="${page}"]`)?.classList.add('active');

  if (page === 'home') {
    container.innerHTML = `
      <div class="admin-toolbar">
        <h3>Overview</h3>
      </div>
      ${window._kpiHTML || '<p>Loading KPI...</p>'}
      <div class="card">
        <h3>Recent Activity</h3>
        <p>System activity feed coming soon.</p>
      </div>
    `;
    // Re-load KPI if not yet loaded
    if (!window._kpiHTML) loadAdminKPI();
  } 
  else if (page === 'doctors') {
    container.innerHTML = `
      <div class="admin-toolbar">
        <h3>Manage Doctors</h3>
        <button id="add-doctor-btn" class="btn btn-primary">➕ Add Doctor</button>
      </div>
      <div id="doctors-table-container"></div>
    `;
    loadAdminDoctors();
    // Attach add doctor button
    document.getElementById('add-doctor-btn')?.addEventListener('click', () => {
      document.getElementById('add-doctor-modal').setAttribute('aria-hidden', 'false');
    });
  } 
  else if (page === 'patients') {
    container.innerHTML = `
      <div class="admin-toolbar">
        <h3>Manage Patients</h3>
        <button id="add-patient-btn" class="btn btn-primary">➕ Add Patient</button>
      </div>
      <div id="patients-table-container"></div>
    `;
    loadAdminPatients();
    document.getElementById('add-patient-btn')?.addEventListener('click', () => {
      document.getElementById('add-patient-modal').setAttribute('aria-hidden', 'false');
    });
  } 
  else if (page === 'appointments') {
    container.innerHTML = `
      <div class="admin-toolbar"><h3>All Appointments</h3></div>
      <div id="admin-appointments-container"></div>
    `;
    loadAdminAppointments();
  } 
  else if (page === 'analytics') {
    container.innerHTML = `
      <div class="card"><h3>Analytics Dashboard</h3><p>Charts and deep insights coming soon.</p></div>
    `;
  } 
  else if (page === 'settings') {
    container.innerHTML = `
      <div class="card"><h3>System Settings</h3><p>Configure platform settings (coming soon).</p></div>
    `;
  }
}

// --- Doctor Management ---
async function loadAdminDoctors() {
  const container = document.getElementById('doctors-table-container');
  if (!container) return;
  try {
    const res = await fetch('/api/admin/doctors', { headers: authHeader() });
    const doctors = await res.json();
    if (!doctors.length) {
      container.innerHTML = `<div class="empty-state">No doctors registered yet.</div>`;
      return;
    }
    const rows = doctors.map(d => `
      <tr>
        <td>${d.firstName} ${d.lastName}</td>
        <td>${d.specialization || '—'}</td>
        <td>${d.email}</td>
        <td>${d.isVerified ? '✅ Verified' : '⏳ Pending'}</td>
        <td class="doctor-actions">
          <button class="btn-sm btn-outline" onclick="openEditDoctor('${d._id}')">✏️ Edit</button>
          <button class="btn-sm btn-outline" onclick="toggleVerifyDoctor('${d._id}', ${!d.isVerified})">
            ${d.isVerified ? 'Unverify' : 'Verify'}
          </button>
          <button class="btn-sm btn-outline" onclick="deleteDoctor('${d._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Name</th><th>Specialty</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load doctors.</p>`;
  }
}

// --- Toggle verify / unverify ---
window.toggleVerifyDoctor = async function(id, verify) {
  try {
    await fetch(`/api/admin/doctors/${id}/verify`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ verified: verify })
    });
    showNotification(`Doctor ${verify ? 'verified' : 'unverified'}`, 'success');
    loadAdminDoctors();
    loadAdminKPI(); // refresh counts
  } catch (err) {
    showNotification('Action failed', 'error');
  }
};

// --- Delete doctor ---
window.deleteDoctor = async function(id) {
  if (!confirm('Delete this doctor permanently?')) return;
  try {
    await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE', headers: authHeader() });
    showNotification('Doctor removed', 'success');
    loadAdminDoctors();
    loadAdminKPI();
  } catch (err) {
    showNotification('Delete failed', 'error');
  }
};

// --- Open Edit Doctor Modal ---
window.openEditDoctor = async function(id) {
  try {
    const res = await fetch(`/api/admin/doctors/${id}`, { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to fetch doctor');
    const doc = await res.json();

    document.getElementById('edit-doctor-id').value = doc._id;
    document.getElementById('edit-firstname').value = doc.firstName || '';
    document.getElementById('edit-lastname').value = doc.lastName || '';
    document.getElementById('edit-email').value = doc.email || '';
    document.getElementById('edit-specialty').value = doc.specialization || '';
    document.getElementById('edit-license').value = doc.licenseNumber || '';
    document.getElementById('edit-location').value = doc.location || '';

    document.getElementById('edit-doctor-modal').setAttribute('aria-hidden', 'false');
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// --- Add Doctor Modal ---
function setupAddDoctorModal() {
  const modal = document.getElementById('add-doctor-modal');
  const closeBtn = document.getElementById('close-add-doctor');
  const form = document.getElementById('add-doctor-form');

  closeBtn?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      firstName: document.getElementById('doc-firstname').value.trim(),
      lastName: document.getElementById('doc-lastname').value.trim(),
      email: document.getElementById('doc-email').value.trim(),
      password: document.getElementById('doc-password').value.trim(),
      specialization: document.getElementById('doc-specialty').value.trim(),
      location: document.getElementById('doc-location').value.trim() || 'Main Hospital',
      licenseNumber: document.getElementById('doc-license').value.trim()
    };
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      showNotification('All required fields must be filled', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add doctor');
      }
      showNotification('Doctor added successfully', 'success');
      modal.setAttribute('aria-hidden', 'true');
      form.reset();
      loadAdminDoctors();
      loadAdminKPI();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

// --- Edit Doctor Modal ---
function setupEditDoctorModal() {
  const modal = document.getElementById('edit-doctor-modal');
  const closeBtn = document.getElementById('close-edit-doctor');
  const form = document.getElementById('edit-doctor-form');

  closeBtn?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-doctor-id').value;
    const data = {
      firstName: document.getElementById('edit-firstname').value.trim(),
      lastName: document.getElementById('edit-lastname').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      specialization: document.getElementById('edit-specialty').value.trim(),
      licenseNumber: document.getElementById('edit-license').value.trim(),
      location: document.getElementById('edit-location').value.trim()
    };
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      showNotification('Doctor updated successfully', 'success');
      modal.setAttribute('aria-hidden', 'true');
      form.reset();
      loadAdminDoctors();
      loadAdminKPI();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

// --- Patients & Appointments (stubs – similar pattern) ---
async function loadAdminPatients() {
  const container = document.getElementById('patients-table-container');
  if (!container) return;
  try {
    const res = await fetch('/api/admin/patients', { headers: authHeader() });
    const patients = await res.json();
    if (!patients.length) {
      container.innerHTML = `<div class="empty-state">No patients registered.</div>`;
      return;
    }
    const rows = patients.map(p => `
      <tr>
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.email}</td>
        <td>${p.phone || '—'}</td>
        <td class="doctor-actions">
          <button class="btn-sm btn-outline" onclick="openEditPatient('${p._id}')">✏️ Edit</button>
          <button class="btn-sm btn-outline" onclick="deletePatient('${p._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load patients.</p>`;
  }
}

window.openEditPatient = async function(id) {
  try {
    const res = await fetch(`/api/admin/patients/${id}`, { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load patient');
    const patient = await res.json();

    document.getElementById('edit-patient-id').value = patient._id;
    document.getElementById('edit-patient-firstname').value = patient.firstName || '';
    document.getElementById('edit-patient-lastname').value = patient.lastName || '';
    document.getElementById('edit-patient-email').value = patient.email || '';
    document.getElementById('edit-patient-phone').value = patient.phone || '';
    document.getElementById('edit-patient-dob').value = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';

    document.getElementById('edit-patient-modal').setAttribute('aria-hidden', 'false');
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

window.deletePatient = async function(id) {
  if (!confirm('Delete this patient permanently?')) return;
  try {
    const res = await fetch(`/api/admin/patients/${id}`, { method: 'DELETE', headers: authHeader() });
    if (!res.ok) throw new Error('Delete failed');
    showNotification('Patient deleted', 'success');
    loadAdminPatients();
    loadAdminKPI();
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

function setupEditPatientModal() {
  const modal = document.getElementById('edit-patient-modal');
  const closeBtn = document.getElementById('close-edit-patient');
  const form = document.getElementById('edit-patient-form');

  closeBtn?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-patient-id').value;
    const data = {
      firstName: document.getElementById('edit-patient-firstname').value.trim(),
      lastName: document.getElementById('edit-patient-lastname').value.trim(),
      email: document.getElementById('edit-patient-email').value.trim(),
      phone: document.getElementById('edit-patient-phone').value.trim(),
      dateOfBirth: document.getElementById('edit-patient-dob').value
    };

    try {
      const res = await fetch(`/api/admin/patients/${id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      showNotification('Patient updated successfully', 'success');
      modal.setAttribute('aria-hidden', 'true');
      loadAdminPatients();
      loadAdminKPI();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

function setupAddPatientModal() {
  const modal = document.getElementById('add-patient-modal');
  const closeBtn = document.getElementById('close-add-patient');
  const form = document.getElementById('add-patient-form');

  closeBtn?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      firstName: document.getElementById('add-patient-firstname').value.trim(),
      lastName: document.getElementById('add-patient-lastname').value.trim(),
      email: document.getElementById('add-patient-email').value.trim(),
      password: document.getElementById('add-patient-password').value.trim(),
      phone: document.getElementById('add-patient-phone').value.trim(),
      dateOfBirth: document.getElementById('add-patient-dob').value
    };
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      showNotification('All required fields must be filled', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add patient');
      }
      showNotification('Patient added successfully', 'success');
      modal.setAttribute('aria-hidden', 'true');
      form.reset();
      loadAdminPatients();
      loadAdminKPI();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

async function loadAdminAppointments() {
  const container = document.getElementById('admin-appointments-container');
  if (!container) return;
  try {
    const res = await fetch('/api/admin/appointments', { headers: authHeader() });
    const appointments = await res.json();
    if (!appointments.length) {
      container.innerHTML = `<div class="empty-state">No appointments yet.</div>`;
      return;
    }
    const rows = appointments.map(a => `
      <tr>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${a.time}</td>
        <td>${a.user?.firstName || '?'} ${a.user?.lastName || ''}</td>
        <td>${a.doctor?.firstName || '?'} ${a.doctor?.lastName || ''}</td>
        <td><span class="status-badge status-badge--${a.status}">${a.status}</span></td>
        <td class="doctor-actions">
          <button class="btn-sm btn-outline" onclick="openEditAppointment('${a._id}')">✏️ Edit</button>
          <button class="btn-sm btn-outline" onclick="deleteAppointment('${a._id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load appointments.</p>`;
  }
}

// --- Open Edit Appointment Modal ---
window.openEditAppointment = async function(id) {
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load appointment');
    const appt = await res.json();

    document.getElementById('edit-appointment-id').value = appt._id;
    document.getElementById('edit-appt-status').value = appt.status || 'pending';
    const dateObj = new Date(appt.date);
    document.getElementById('edit-appt-date').value = dateObj.toISOString().split('T')[0];
    document.getElementById('edit-appt-time').value = appt.time || '';

    document.getElementById('edit-appointment-modal').setAttribute('aria-hidden', 'false');
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// --- Setup Edit Appointment Modal ---
function setupEditAppointmentModal() {
  const modal = document.getElementById('edit-appointment-modal');
  const closeBtn = document.getElementById('close-edit-appointment');
  const form = document.getElementById('edit-appointment-form');

  closeBtn?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-appointment-id').value;
    const data = {
      status: document.getElementById('edit-appt-status').value,
      date: document.getElementById('edit-appt-date').value,
      time: document.getElementById('edit-appt-time').value
    };
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      showNotification('Appointment updated', 'success');
      modal.setAttribute('aria-hidden', 'true');
      form.reset();
      loadAdminAppointments();
      loadAdminKPI();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });
}

// --- Delete Appointment ---
window.deleteAppointment = async function(id) {
  if (!confirm('Delete this appointment permanently?')) return;
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE', headers: authHeader() });
    if (!res.ok) throw new Error('Delete failed');
    showNotification('Appointment deleted', 'success');
    loadAdminAppointments();
    loadAdminKPI();
  } catch (err) {
    showNotification(err.message, 'error');
  }
};

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const token = getToken();
    if (token) {
      const role = localStorage.getItem('userRole');
      if (role === 'doctor') {
        window.location.href = 'doctor-dashboard.html';
      } else if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return;
    }
  }

  initDarkMode();
  initAccessibility();
  initTabs();
  initLoginForm();
  initRegisterForm();
  updateNav();
  if (document.querySelector('.doctor-grid')) {
    initDoctorFilter();
    // Only initialise charts if the canvas elements exist
    if (document.getElementById('weeklyChart') && document.getElementById('peakHoursChart')) {
      initCharts();
      await loadActivityFeed();
    }
  }
  setMaxDateOfBirth();
  
  // Load favorites for Find Doctor page
  await loadFavorites();

  // Inline form validation
  try { initInlineValidation(); } catch (e) { /* ignore if no form present */ }

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
    // start KPI polling while on dashboard
    startKpiPolling(30000);
  }

  // ★ NEW: Check for doctor or admin dashboard pages ★
  if (document.body.classList.contains('doctor-dashboard')) {
    initDoctorDashboard();
  }
  if (document.body.classList.contains('admin-dashboard')) {
    initAdminDashboard();
  }

  // If there is a KPI grid elsewhere (future pages), ensure polling starts
  if (document.getElementById('kpi-grid') && !document.querySelector('.dashboard-tabs')) {
    startKpiPolling(30000);
  }
});

function setMaxDateOfBirth() {
  const dobInput = document.getElementById('reg-dob');
  if (dobInput) {
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    dobInput.setAttribute('max', today);
  }
}

function initInlineValidation() {
  const emailInput = document.getElementById('reg-email') || document.getElementById('profile-email') || document.getElementById('login-email');
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
      emailInput.style.borderColor = isValid ? 'var(--color-success)' : 'var(--color-error)';
    });
  }

  const passwordInput = document.getElementById('reg-password') || document.getElementById('login-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const isValid = passwordInput.value.length >= 6;
      passwordInput.style.borderColor = isValid ? 'var(--color-success)' : 'var(--color-error)';
    });
  }
}

// Clear polling when leaving page
window.addEventListener('beforeunload', () => {
  stopKpiPolling();
});
