(function () {
  'use strict';

  const API = ''; // same-origin — admin panel is served by this API server
  const TOKEN_KEY = 'bb_admin_token';

  const els = {
    loginView: document.getElementById('loginView'),
    dashboardView: document.getElementById('dashboardView'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    loginSubmit: document.getElementById('loginSubmit'),
    whoami: document.getElementById('whoami'),
    logoutBtn: document.getElementById('logoutBtn'),
    sumPending: document.getElementById('sumPending'),
    sumApproved: document.getElementById('sumApproved'),
    sumRejected: document.getElementById('sumRejected'),
    sumAverage: document.getElementById('sumAverage'),
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    ratingFilter: document.getElementById('ratingFilter'),
    sortFilter: document.getElementById('sortFilter'),
    reviewsTbody: document.getElementById('reviewsTbody'),
    emptyState: document.getElementById('emptyState'),
    pagination: document.getElementById('pagination'),
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    editId: document.getElementById('editId'),
    editName: document.getElementById('editName'),
    editRating: document.getElementById('editRating'),
    editReview: document.getElementById('editReview'),
    editError: document.getElementById('editError'),
    editCancel: document.getElementById('editCancel'),
    toast: document.getElementById('toast')
  };

  const state = { page: 1, limit: 20 };

  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function setToken(t) { sessionStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

  function showToast(message, isError) {
    els.toast.textContent = message;
    els.toast.className = 'toast' + (isError ? ' toast-error' : '');
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3000);
  }

  async function api(path, options) {
    options = options || {};
    const headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + getToken() });
    if (options.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(API + path, Object.assign({}, options, { headers }));
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('Session expired. Please log in again.');
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed.');
    return json;
  }

  function showLogin() {
    els.loginView.hidden = false;
    els.dashboardView.hidden = true;
  }

  function showDashboard() {
    els.loginView.hidden = true;
    els.dashboardView.hidden = false;
  }

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------
  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.hidden = true;
    els.loginSubmit.disabled = true;
    try {
      const res = await fetch(API + '/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed.');
      setToken(json.token);
      els.whoami.textContent = json.username;
      els.loginForm.reset();
      showDashboard();
      refreshAll();
    } catch (err) {
      els.loginError.textContent = err.message;
      els.loginError.hidden = false;
    } finally {
      els.loginSubmit.disabled = false;
    }
  });

  els.logoutBtn.addEventListener('click', () => {
    clearToken();
    showLogin();
  });

  async function checkExistingSession() {
    if (!getToken()) return showLogin();
    try {
      const me = await api('/api/admin/auth/me');
      els.whoami.textContent = me.username;
      showDashboard();
      refreshAll();
    } catch (err) {
      showLogin();
    }
  }

  // ---------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------
  async function loadSummary() {
    try {
      const s = await api('/api/admin/reviews/summary');
      els.sumPending.textContent = s.pending;
      els.sumApproved.textContent = s.approved;
      els.sumRejected.textContent = s.rejected;
      els.sumAverage.textContent = s.totalApproved > 0 ? s.averageRating.toFixed(1) + ' / 5' : '–';
    } catch (err) {
      /* handled by api() redirecting to login on 401 */
    }
  }

  // ---------------------------------------------------------------------
  // Reviews table
  // ---------------------------------------------------------------------
  function starString(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function formatDate(iso) {
    try {
      return new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return iso;
    }
  }

  function buildQuery() {
    const params = new URLSearchParams();
    if (els.searchInput.value.trim()) params.set('search', els.searchInput.value.trim());
    if (els.statusFilter.value) params.set('status', els.statusFilter.value);
    if (els.ratingFilter.value) params.set('rating', els.ratingFilter.value);
    params.set('sort', els.sortFilter.value);
    params.set('page', state.page);
    params.set('limit', state.limit);
    return params.toString();
  }

  function renderRow(r) {
    const tr = document.createElement('tr');

    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(r.date);
    tr.appendChild(tdDate);

    const tdCust = document.createElement('td');
    const nameEl = document.createElement('div');
    nameEl.className = 'cust-name';
    nameEl.textContent = r.name; // textContent — never innerHTML for user data
    const emailEl = document.createElement('div');
    emailEl.className = 'cust-email';
    emailEl.textContent = r.email;
    tdCust.appendChild(nameEl);
    tdCust.appendChild(emailEl);
    tr.appendChild(tdCust);

    const tdRating = document.createElement('td');
    tdRating.innerHTML = '<span class="stars">' + starString(r.rating) + '</span>';
    tr.appendChild(tdRating);

    const tdReview = document.createElement('td');
    const reviewSpan = document.createElement('div');
    reviewSpan.className = 'review-text';
    reviewSpan.textContent = r.review;
    tdReview.appendChild(reviewSpan);
    tr.appendChild(tdReview);

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'status-badge status-' + r.status;
    badge.textContent = r.status;
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    const tdFeatured = document.createElement('td');
    const featBtn = document.createElement('button');
    featBtn.type = 'button';
    featBtn.className = 'featured-toggle' + (r.featured ? ' is-featured' : '');
    featBtn.title = r.featured ? 'Remove from featured' : 'Mark as featured';
    featBtn.textContent = r.featured ? '★' : '☆';
    featBtn.disabled = r.status !== 'approved';
    featBtn.addEventListener('click', () => toggleFeatured(r.id, !r.featured));
    tdFeatured.appendChild(featBtn);
    tr.appendChild(tdFeatured);

    const tdActions = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';

    if (r.status !== 'approved') {
      actions.appendChild(makeActionBtn('Approve', 'btn-success', () => setStatus(r.id, 'approved')));
    }
    if (r.status !== 'rejected') {
      actions.appendChild(makeActionBtn('Reject', 'btn-outline', () => setStatus(r.id, 'rejected')));
    }
    actions.appendChild(makeActionBtn('Edit', 'btn-outline', () => openEdit(r)));
    actions.appendChild(makeActionBtn('Delete', 'btn-danger', () => removeReview(r.id)));

    tdActions.appendChild(actions);
    tr.appendChild(tdActions);

    return tr;
  }

  function makeActionBtn(label, cls, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm ' + cls;
    b.textContent = label;
    b.addEventListener('click', handler);
    return b;
  }

  async function loadReviews() {
    try {
      const data = await api('/api/admin/reviews?' + buildQuery());
      els.reviewsTbody.innerHTML = '';
      if (!data.reviews.length) {
        els.emptyState.hidden = false;
      } else {
        els.emptyState.hidden = true;
        data.reviews.forEach((r) => els.reviewsTbody.appendChild(renderRow(r)));
      }
      renderPagination(data.page, data.totalPages);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function renderPagination(page, totalPages) {
    els.pagination.innerHTML = '';
    if (totalPages <= 1) return;
    for (let p = 1; p <= totalPages; p++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(p);
      if (p === page) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', () => { state.page = p; loadReviews(); });
      els.pagination.appendChild(b);
    }
  }

  async function setStatus(id, status) {
    try {
      await api('/api/admin/reviews/' + id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showToast('Review ' + status + '.');
      refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function toggleFeatured(id, featured) {
    try {
      await api('/api/admin/reviews/' + id + '/featured', {
        method: 'PATCH',
        body: JSON.stringify({ featured })
      });
      loadReviews();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function removeReview(id) {
    if (!confirm('Delete this review permanently? This cannot be undone.')) return;
    try {
      await api('/api/admin/reviews/' + id, { method: 'DELETE' });
      showToast('Review deleted.');
      refreshAll();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ---------------------------------------------------------------------
  // Edit modal
  // ---------------------------------------------------------------------
  function openEdit(r) {
    els.editId.value = r.id;
    els.editName.value = r.name;
    els.editRating.value = String(r.rating);
    els.editReview.value = r.review;
    els.editError.hidden = true;
    els.editModal.hidden = false;
    els.editName.focus();
  }

  function closeEdit() { els.editModal.hidden = true; }

  els.editCancel.addEventListener('click', closeEdit);
  els.editModal.addEventListener('click', (e) => { if (e.target === els.editModal) closeEdit(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.editModal.hidden) closeEdit();
  });

  els.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.editError.hidden = true;
    try {
      await api('/api/admin/reviews/' + els.editId.value, {
        method: 'PUT',
        body: JSON.stringify({
          name: els.editName.value.trim(),
          rating: Number(els.editRating.value),
          review: els.editReview.value.trim()
        })
      });
      closeEdit();
      showToast('Review updated.');
      loadReviews();
    } catch (err) {
      els.editError.textContent = err.message;
      els.editError.hidden = false;
    }
  });

  // ---------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------
  let searchDebounce;
  els.searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { state.page = 1; loadReviews(); }, 350);
  });
  [els.statusFilter, els.ratingFilter, els.sortFilter].forEach((el) => {
    el.addEventListener('change', () => { state.page = 1; loadReviews(); });
  });

  function refreshAll() {
    loadSummary();
    loadReviews();
  }

  checkExistingSession();
})();
