/* ══════════════════════════════════════════════════════════
   DriveIndia – Frontend App
   ══════════════════════════════════════════════════════════ */

const API = 'http://localhost:5001/api';

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const Auth = {
  save : (token, user) => { localStorage.setItem('di_token', token); localStorage.setItem('di_user', JSON.stringify(user)); },
  token: ()            => localStorage.getItem('di_token'),
  user : ()            => JSON.parse(localStorage.getItem('di_user') || 'null'),
  clear: ()            => { localStorage.removeItem('di_token'); localStorage.removeItem('di_user'); },
};

function formatINR(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function today() { return new Date().toISOString().split('T')[0]; }
function daysBetween(a, b) { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000)); }

// ── Fix date format ──────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Car images using reliable CDN ────────────────────────
  const CAR_IMAGES = {
  1:  'images/swift.jpg',
  2:  'images/creta.jpg',
  3:  'images/nexon.jpg',
  4:  'images/scorpio.jpg',
  5:  'images/innova.jpg',
  6:  'images/city.jpg',
  7:  'images/seltos.jpg',
  8:  'images/ertiga.jpg',
  9:  'images/safari.jpg',
  10: 'images/thar.jpg',
};
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = Auth.token();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function toast(msg, type = 'info') {
  let wrap = document.querySelector('.toast-container');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-container'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg; wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showAlert(id, msg, type) {
  const el = $(id); if (!el) return;
  el.textContent = msg; el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function renderNav() {
  const user = Auth.user();
  const navName = $('nav-user-name');
  if (navName) navName.textContent = user ? `👤 ${user.name}` : '';
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════ */
async function initHome() {
  const grid = $('cars-grid'); if (!grid) return;
  grid.innerHTML = `<div class="page-loader"><div class="spinner"></div> Loading cars…</div>`;
  try {
    const cars = await apiFetch('/cars');
    renderCarCards(grid, cars, false);
  } catch (e) {
    grid.innerHTML = `<div class="empty"><div class="icon">⚠️</div><h3>Could not load cars</h3><p>${e.message}</p></div>`;
  }
}

function renderCarCards(container, cars, showBook) {
  container.innerHTML = cars.map(c => {
    const imgUrl = c.image_url || CAR_IMAGES[c.id] || '';
    return `
    <div class="car-card">
      <div class="car-img-wrap" style="position:relative;overflow:hidden">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${c.name}"
               style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1"
               onerror="this.style.display='none';document.getElementById('em-${c.id}').style.display='flex'"/>
             <span id="em-${c.id}" style="display:none;position:absolute;inset:0;font-size:5rem;align-items:center;justify-content:center;z-index:1">${c.emoji || '🚗'}</span>`
          : `<span style="font-size:5rem">${c.emoji || '🚗'}</span>`
        }
        <div class="car-badge" style="position:absolute;top:.8rem;right:.8rem;z-index:2">${c.badge || 'Available'}</div>
      </div>
      <div class="car-body">
        <h3>${c.name}</h3>
        <div class="car-meta">
          <span class="car-tag">${c.type}</span>
          <span class="car-tag">${c.fuel}</span>
          <span class="car-tag">👥 ${c.seats}</span>
        </div>
        <div class="car-price-row">
          <div class="car-price">
            <div><span class="inr">INR</span> <span class="amount">${formatINR(c.price_per_day)}</span></div>
            <div class="per">per day</div>
          </div>
          ${showBook
            ? `<button class="btn btn-primary btn-sm" onclick="openBooking(${c.id},'${c.name}',${c.price_per_day})">Book Now</button>`
            : `<a href="login.html" class="btn btn-outline btn-sm">Book Now</a>`}
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════════════════════════ */
function initLoginPage() {
  const loginTab = $('tab-login'), regTab = $('tab-register');
  const loginFrm = $('login-form'), regFrm = $('register-form');
  if (!loginTab) return;

  loginTab.onclick = () => { loginTab.classList.add('active'); regTab.classList.remove('active'); loginFrm.style.display = ''; regFrm.style.display = 'none'; };
  regTab.onclick   = () => { regTab.classList.add('active'); loginTab.classList.remove('active'); regFrm.style.display = ''; loginFrm.style.display = 'none'; };
  $('goto-reg').onclick  = e => { e.preventDefault(); regTab.click(); };
  $('goto-login').onclick = e => { e.preventDefault(); loginTab.click(); };

  $('login-btn').onclick = async () => {
    const btn = $('login-btn'), email = $('l-email').value.trim(), pass = $('l-pass').value;
    if (!email || !pass) { showAlert('login-alert', 'Email and password required.', 'err'); return; }
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
    try {
      const { token, user } = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
      Auth.save(token, user); location.href = 'user-dashboard.html';
    } catch (e) { showAlert('login-alert', e.message, 'err'); }
    finally { btn.disabled = false; btn.textContent = 'Login →'; }
  };

  $('reg-btn').onclick = async () => {
    const btn = $('reg-btn'), name = $('r-name').value.trim(), email = $('r-email').value.trim(), phone = $('r-phone').value.trim(), pass = $('r-pass').value;
    if (!name || !email || !pass) { showAlert('reg-alert', 'All fields are required.', 'err'); return; }
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
    try {
      const { token, user } = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password: pass }) });
      Auth.save(token, user); location.href = 'user-dashboard.html';
    } catch (e) { showAlert('reg-alert', e.message, 'err'); }
    finally { btn.disabled = false; btn.textContent = 'Create Account →'; }
  };

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (regFrm.style.display === 'none') $('login-btn').click(); else $('reg-btn').click();
  });
}

/* ══════════════════════════════════════════════════════════
   ADMIN LOGIN PAGE
   ══════════════════════════════════════════════════════════ */
function initAdminLogin() {
  const btn = $('admin-login-btn'); if (!btn) return;
  btn.onclick = async () => {
    const email = $('a-email').value.trim(), pass = $('a-pass').value;
    if (!email || !pass) { showAlert('admin-alert', 'Both fields required.', 'err'); return; }
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
    try {
      const { token, user } = await apiFetch('/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
      Auth.save(token, user); location.href = 'admin-dashboard.html';
    } catch (e) { showAlert('admin-alert', e.message, 'err'); }
    finally { btn.disabled = false; btn.innerHTML = '🛡️ Access Dashboard →'; }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

/* ══════════════════════════════════════════════════════════
   USER DASHBOARD
   ══════════════════════════════════════════════════════════ */
async function initUserDashboard() {
  const user = Auth.user();
  if (!user || user.role !== 'user') { location.href = 'login.html'; return; }
  if ($('user-name')) $('user-name').textContent = user.name;
  $('user-logout').onclick = () => { Auth.clear(); location.href = 'index.html'; };

  const carsList = $('cars-list');
  if (carsList) {
    carsList.innerHTML = `<div class="page-loader"><div class="spinner"></div> Loading cars…</div>`;
    try { const cars = await apiFetch('/cars'); renderCarCards(carsList, cars, true); }
    catch (e) { carsList.innerHTML = `<div class="empty"><div class="icon">⚠️</div><h3>${e.message}</h3></div>`; }
  }

  await loadMyBookings();

  const overlay = $('booking-modal');
  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeBooking(); });
    $('book-pickup').addEventListener('change', calcTotal);
    $('book-return').addEventListener('change', calcTotal);
  }
}

async function loadMyBookings() {
  const wrap = $('my-bookings-table'); if (!wrap) return;
  wrap.innerHTML = `<div class="page-loader"><div class="spinner"></div> Loading bookings…</div>`;
  try {
    const bookings = await apiFetch('/bookings/my');
    if (!bookings.length) {
      wrap.innerHTML = `<div class="empty"><div class="icon">🚘</div><h3>No bookings yet</h3><p>Browse cars and make your first booking!</p></div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Car</th><th>Pickup</th><th>Return</th><th>Days</th><th>Total</th><th>Status</th><th>Booked On</th></tr></thead>
        <tbody>
          ${bookings.map(b => `
            <tr>
              <td>${b.emoji || '🚗'} ${b.car_name}</td>
              <td>${formatDate(b.pickup_date)}</td>
              <td>${formatDate(b.return_date)}</td>
              <td>${b.days}</td>
              <td>${formatINR(b.total_amount)}</td>
              <td><span class="badge badge-${b.status}">${b.status}</span></td>
              <td>${formatDate(b.booked_at)}</td>
            </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><div class="icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

let _activeCar = null;
function openBooking(id, name, pricePerDay) {
  _activeCar = { id, name, pricePerDay };
  $('modal-car-name').textContent = name;
  $('book-pickup').value = ''; $('book-return').value = ''; $('book-total').textContent = '—';
  $('book-pickup').min = today(); $('book-return').min = today();
  $('booking-modal').classList.add('open');
}
function closeBooking() { $('booking-modal').classList.remove('open'); }
function calcTotal() {
  const p = $('book-pickup').value, r = $('book-return').value;
  if (p && r && r > p) { const days = daysBetween(p, r); $('book-total').textContent = `${formatINR(_activeCar.pricePerDay * days)} (${days} day${days > 1 ? 's' : ''})`; }
  else $('book-total').textContent = '—';
}

async function submitBooking() {
  const p = $('book-pickup').value, r = $('book-return').value;
  if (!p || !r || r <= p) { toast('Select valid pickup and return dates.', 'error'); return; }
  const btn = $('confirm-booking-btn'); btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Booking…';
  try {
    await apiFetch('/bookings', { method: 'POST', body: JSON.stringify({ car_id: _activeCar.id, pickup_date: p, return_date: r }) });
    closeBooking(); toast('🎉 Booking submitted! Awaiting admin approval.', 'success');
    await loadMyBookings();
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '✅ Confirm Booking'; }
}

/* ══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
let _currentFilter = 'all';

async function initAdminDashboard() {
  const user = Auth.user();
  if (!user || user.role !== 'admin') { location.href = 'admin-login.html'; return; }
  if ($('admin-name')) $('admin-name').textContent = user.name;
  $('admin-logout').onclick = () => { Auth.clear(); location.href = 'admin-login.html'; };

  $$('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); _currentFilter = btn.dataset.filter;
      loadAdminBookings(_currentFilter);
    };
  });

  await Promise.all([loadAdminStats(), loadAdminBookings('all')]);
}

async function loadAdminStats() {
  try {
    const s = await apiFetch('/bookings/stats');
    const set = (id, v) => { if ($(id)) $(id).textContent = v; };
    set('stat-total', s.total); set('stat-pending', s.pending);
    set('stat-accepted', s.accepted); set('stat-rejected', s.rejected);
    set('stat-revenue', formatINR(s.revenue));
  } catch { }
}

async function loadAdminBookings(filter = 'all') {
  const wrap = $('admin-bookings-table'); if (!wrap) return;
  wrap.innerHTML = `<div class="page-loader"><div class="spinner"></div> Loading…</div>`;
  try {
    const qs = filter !== 'all' ? `?status=${filter}` : '';
    const bookings = await apiFetch(`/bookings${qs}`);
    if (!bookings.length) {
      wrap.innerHTML = `<div class="empty"><div class="icon">📋</div><h3>No bookings found</h3></div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr>
          <th>#</th><th>Customer</th><th>Phone</th><th>Car</th><th>Pickup</th><th>Return</th><th>Days</th><th>Total</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${bookings.map(b => `
            <tr id="row-${b.id}">
              <td><code style="color:var(--muted);font-size:.78rem">${b.id}</code></td>
              <td>
                <div style="font-weight:500">${b.user_name}</div>
                <div style="font-size:.78rem;color:var(--muted)">${b.user_email}</div>
              </td>
              <td>
                ${b.user_phone
                  ? `<a href="tel:${b.user_phone}" style="color:var(--gold);font-weight:600">📞 ${b.user_phone}</a>`
                  : `<span style="color:var(--muted)">—</span>`}
              </td>
              <td>${b.emoji || '🚗'} ${b.car_name}</td>
              <td>${formatDate(b.pickup_date)}</td>
              <td>${formatDate(b.return_date)}</td>
              <td>${b.days}</td>
              <td style="color:var(--gold);font-weight:600">${formatINR(b.total_amount)}</td>
              <td><span class="badge badge-${b.status}">${b.status}</span></td>
              <td>
                ${b.status === 'pending' ? `
                  <div style="display:flex;gap:.4rem">
                    <button class="btn btn-success btn-sm" onclick="updateBooking(${b.id},'accepted')">✓ Accept</button>
                    <button class="btn btn-danger btn-sm" onclick="updateBooking(${b.id},'rejected')">✗ Reject</button>
                  </div>` : `<span style="color:var(--muted)">—</span>`}
              </td>
            </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><div class="icon">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

async function updateBooking(id, status) {
  try {
    await apiFetch(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    toast(`Booking ${status === 'accepted' ? '✅ accepted' : '❌ rejected'}.`, status === 'accepted' ? 'success' : 'error');
    await Promise.all([loadAdminStats(), loadAdminBookings(_currentFilter)]);
  } catch (e) { toast(e.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  const page = document.body.dataset.page;
  if (page === 'home')            initHome();
  if (page === 'login')           initLoginPage();
  if (page === 'admin-login')     initAdminLogin();
  if (page === 'user-dashboard')  initUserDashboard();
  if (page === 'admin-dashboard') initAdminDashboard();
});