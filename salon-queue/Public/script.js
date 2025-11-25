// Authentication check and redirect
<<<<<<< HEAD
// Authentication check and redirect
=======
<<<<<<< HEAD
// Authentication check and redirect
function checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  const ownerSessionId = localStorage.getItem('ownerSessionId');
  const currentPage = window.location.pathname;
  
  // Public pages that don't require authentication
  const publicPages = [
    '/landing.html',
=======
>>>>>>> 2a481b0045c6bc05e6f86a7752ced83c0348c230
function checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  const ownerSessionId = localStorage.getItem('ownerSessionId');
  const currentPage = window.location.pathname;
  
  // Public pages that don't require authentication
  const publicPages = [
// Cleaned script: auth checks and page helpers
function checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  const ownerSessionId = localStorage.getItem('ownerSessionId');
  const currentPage = window.location.pathname;

  // Public pages that don't require authentication
  const publicPages = [
    '/index.html',
    '/customer-login.html',
    '/customer-register.html',
    '/owner-login.html',
    '/owner-register.html'
  ];

  const isPublicPage = publicPages.some(page => currentPage.includes(page));

  // If on owner dashboard without owner session, redirect to login
  if (currentPage.includes('owner-dashboard.html') && !ownerSessionId) {
    window.location.href = 'owner-login.html';
    return false;
  }

  // If on customer dashboard without customer session, redirect to landing (index)
  if (currentPage.includes('customer-dashboard.html') && !sessionId) {
    window.location.href = 'index.html';
    return false;
  }

  // If logged in and trying to open login/register, redirect to dashboard
  if (sessionId && (currentPage.includes('customer-login.html') || currentPage.includes('customer-register.html'))) {
    window.location.href = 'customer-dashboard.html';
    return false;
  }

  if (ownerSessionId && (currentPage.includes('owner-login.html') || currentPage.includes('owner-register.html'))) {
    window.location.href = 'owner-dashboard.html';
    return false;
  }

  return true;
}

// Run auth check on page load
checkAuth();

// Simple logout helper used by pages
function redirectToIndexOnLogout() {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('userName');
  localStorage.removeItem('ownerSessionId');
  localStorage.removeItem('salonName');
  localStorage.removeItem('ownerName');
  window.location.href = 'index.html';
}

// If a logout button exists, hook it
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    redirectToIndexOnLogout();
  });
}

// The rest of this file contains page-specific helper functions (customer/owner flows)
// Load customer info on dashboard
async function loadCustomerInfo() {
  const welcomeUser = document.getElementById('welcomeUser');
  const userDetails = document.getElementById('userDetails');
  const sessionId = localStorage.getItem('sessionId');

  if (!welcomeUser || !sessionId) return;

  try {
    const res = await fetch('/customer-info', { headers: { 'session-id': sessionId } });
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = 'index.html';
      return;
    }
    const user = await res.json();
    welcomeUser.textContent = `Welcome, ${user.fullName}!`;
    userDetails.innerHTML = `<strong>Email:</strong> ${user.email}<br><strong>Phone:</strong> ${user.phone}`;
  } catch (error) {
    console.error('Failed to load customer info:', error);
  }
}

// Load available salons
async function loadSalons() {
  const salonSelect = document.getElementById('salon');
  if (!salonSelect) return;
  try {
    const res = await fetch('/salons');
    const salons = await res.json();
    salonSelect.innerHTML = '<option value="">-- Select a Salon --</option>';
    salons.forEach(salon => {
      const option = document.createElement('option');
      option.value = salon.id;
      option.textContent = salon.name;
      salonSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load salons:', error);
  }
}

// Check customer's current queue position
async function checkQueuePosition() {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return;
  const currentQueueStatus = document.getElementById('currentQueueStatus');
  const positionInfo = document.getElementById('positionInfo');
  const queuePosition = document.getElementById('queuePosition');
  const salonName = document.getElementById('salonName');
  const estimatedWait = document.getElementById('estimatedWait');
  const joinQueueSection = document.getElementById('joinQueueSection');
  if (!currentQueueStatus) return;
  try {
    const res = await fetch('/my-position', { headers: { 'session-id': sessionId } });
    const data = await res.json();
    if (data.inQueue) {
      currentQueueStatus.style.display = 'none';
      positionInfo.style.display = 'block';
      queuePosition.textContent = data.position;
      if (salonName) salonName.textContent = data.salonName;
      estimatedWait.textContent = `Estimated wait: ${data.estimatedWait} minutes`;
      if (joinQueueSection) joinQueueSection.style.display = 'none';
    } else {
      currentQueueStatus.style.display = 'block';
      currentQueueStatus.textContent = 'You are not in any queue.';
      positionInfo.style.display = 'none';
      if (joinQueueSection) joinQueueSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to check position:', error);
  }
}

// Attach handlers for forms if present (register/login/join)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true; submitBtn.textContent = 'Registering...';
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    try {
      const res = await fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) { alert('Registration successful! Please login.'); window.location.href = 'customer-login.html'; }
      else alert(result.error);
    } catch (error) { alert('Registration failed. Please try again.'); }
    finally { setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = 'Register'; }, 2000); }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true; submitBtn.textContent = 'Logging in...';
    const formData = new FormData(loginForm); const data = Object.fromEntries(formData);
    try {
      const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) { localStorage.setItem('sessionId', result.sessionId); localStorage.setItem('userName', result.userName); window.location.href = 'customer-dashboard.html'; }
      else alert(result.error);
    } catch (error) { alert('Login failed. Please try again.'); }
    finally { setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = 'Login'; }, 2000); }
  });
}

// Join queue form
const queueForm = document.getElementById('queueForm');
if (queueForm) {
  queueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = queueForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true; submitBtn.textContent = 'Joining...';
    const salon = document.getElementById('salon').value; const service = document.getElementById('service').value; const sessionId = localStorage.getItem('sessionId');
    if (!salon) { alert('Please select a salon'); submitBtn.disabled = false; submitBtn.textContent = 'Join Queue'; return; }
    try {
      const res = await fetch('/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service, sessionId, salonId: salon }) });
      const data = await res.json(); alert(`Successfully joined queue! You are number ${data.position}.`); checkQueuePosition();
    } catch (error) { alert('Failed to join queue. Please try again.'); }
    finally { setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = 'Join Queue'; }, 2000); }
  });
}

// Owner helpers
const queueList = document.getElementById('queueList');
const nextBtn = document.getElementById('nextCustomer');
const ownerRegisterForm = document.getElementById('ownerRegisterForm');
if (ownerRegisterForm) {
  ownerRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = ownerRegisterForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; submitBtn.disabled = true; submitBtn.textContent = 'Registering Salon...';
    const formData = new FormData(ownerRegisterForm); const data = Object.fromEntries(formData);
    try { const res = await fetch('/register-salon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await res.json(); if (res.ok) { alert(`Salon registered successfully!\nYour Salon Code: ${result.salonCode}\n\nPlease save this code.`); window.location.href = 'owner-login.html'; } else alert(result.error); }
    catch (error) { alert('Registration failed. Please try again.'); }
    finally { setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = 'Register Salon'; }, 2000); }
  });
}

const ownerLoginForm = document.getElementById('ownerLoginForm');
if (ownerLoginForm) {
  ownerLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = ownerLoginForm.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; submitBtn.disabled = true; submitBtn.textContent = 'Logging in...';
    const formData = new FormData(ownerLoginForm); const data = Object.fromEntries(formData);
    try { const res = await fetch('/owner-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await res.json(); if (res.ok) { localStorage.setItem('ownerSessionId', result.ownerSessionId); localStorage.setItem('salonName', result.salonName); localStorage.setItem('ownerName', result.ownerName); window.location.href = 'owner-dashboard.html'; } else alert(result.error); }
    catch (error) { alert('Login failed. Please try again.'); }
    finally { setTimeout(() => { submitBtn.disabled = false; submitBtn.textContent = 'Login to Dashboard'; }, 2000); }
  });
}

async function loadOwnerQueue() {
  if (!queueList) return; const ownerSessionId = localStorage.getItem('ownerSessionId'); if (!ownerSessionId) { window.location.href = 'owner-login.html'; return; }
  try { const res = await fetch('/owner/queue', { headers: { 'owner-session-id': ownerSessionId } }); if (res.status === 401) { localStorage.clear(); window.location.href = 'owner-login.html'; return; } const data = await res.json(); const salonInfo = document.getElementById('salonInfo'); if (salonInfo) { salonInfo.innerHTML = `<h3>${data.salonInfo.salonName}</h3><p>Owner: ${data.salonInfo.ownerName}</p><p>Total Customers: ${data.totalCustomers}</p>`; } queueList.innerHTML = ''; if (data.queue.length === 0) { queueList.innerHTML = '<li>No customers in queue.</li>'; } else { data.queue.forEach((customer, index) => { const li = document.createElement('li'); li.innerHTML = `<strong>#${index + 1}</strong> - ${customer.name} <br><small>Service: ${customer.service} | Wait: ${customer.waitTime}</small>`; queueList.appendChild(li); }); } }
  catch (error) { console.error('Failed to load queue:', error); }
}

if (nextBtn) {
  let serveInProgress = false;
  nextBtn.addEventListener('click', async () => {
    if (serveInProgress) return; serveInProgress = true; nextBtn.disabled = true; nextBtn.textContent = 'Serving...';
    const ownerSessionId = localStorage.getItem('ownerSessionId');
    try { const res = await fetch('/owner/serve', { method: 'POST', headers: { 'owner-session-id': ownerSessionId } }); const result = await res.json(); alert(result.message); loadOwnerQueue(); }
    catch (error) { alert('Failed to serve customer. Please try again.'); }
    finally { setTimeout(() => { serveInProgress = false; nextBtn.disabled = false; nextBtn.textContent = 'Serve Next Customer'; }, 1000); }
  });
}

function addLogoutButton() {
  const ownerSessionId = localStorage.getItem('ownerSessionId');
  if (ownerSessionId && window.location.pathname.includes('owner-dashboard.html')) {
    const logoutBtn = document.createElement('button'); logoutBtn.textContent = 'Logout'; logoutBtn.style.position = 'absolute'; logoutBtn.style.top = '20px'; logoutBtn.style.right = '20px'; logoutBtn.onclick = async () => { await fetch('/owner-logout', { method: 'POST', headers: { 'owner-session-id': ownerSessionId } }); localStorage.clear(); window.location.href = 'index.html'; }; document.body.appendChild(logoutBtn);
  }
}

// Initialize based on page
if (window.location.pathname.includes('customer-dashboard.html')) {
  loadCustomerInfo(); loadSalons(); checkQueuePosition(); setInterval(checkQueuePosition, 5000);
}

if (window.location.pathname.includes('owner-dashboard.html')) {
  loadOwnerQueue(); setInterval(loadOwnerQueue, 3000); addLogoutButton();
}
    e.preventDefault();
