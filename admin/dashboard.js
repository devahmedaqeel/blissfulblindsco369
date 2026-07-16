(function () {
  'use strict';

  // ===================================================================
  // State
  // ===================================================================
  let supabase = null;
  let session = null;
  let enquiries = [];          // in-memory, most-recent-first
  let channel = null;
  let oldestLoadedAt = null;
  const PAGE_SIZE = 100;

  const els = {};
  document.querySelectorAll('[id]').forEach((el) => { els[el.id] = el; });

  // ===================================================================
  // Utilities
  // ===================================================================
  function escapeForAttr(str) {
    return String(str == null ? '' : str);
  }

  function relativeTime(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.round(hrs / 24);
    if (days < 7) return days + 'd ago';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => { if (c) node.appendChild(c); });
    return node;
  }

  // ===================================================================
  // Boot: load public config, init Supabase client
  // ===================================================================
  async function boot() {
    let config;
    try {
      config = await fetch('/api/config').then((r) => r.json());
    } catch {
      showLoginError('Could not reach the server. Check your connection and reload.');
      return;
    }

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      showLoginError('Dashboard is not configured yet (missing Supabase environment variables).');
      return;
    }

    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    window.__BB_VAPID_PUBLIC_KEY = config.vapidPublicKey;

    const { data } = await supabase.auth.getSession();
    if (data && data.session) {
      session = data.session;
      enterDashboard();
    } else {
      showLogin();
    }

    supabase.auth.onAuthStateChange((event, newSession) => {
      session = newSession;
      if (event === 'SIGNED_OUT') showLogin();
    });
  }

  // ===================================================================
  // Login
  // ===================================================================
  function showLogin() {
    els.loginScreen.hidden = false;
    els.dashboard.hidden = true;
  }

  function showLoginError(msg) {
    els.loginError.textContent = msg;
    els.loginError.hidden = false;
  }

  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.hidden = true;
    els.loginSubmit.disabled = true;
    els.loginSubmit.textContent = 'Signing in…';

    const email = els.loginEmail.value.trim();
    const password = els.loginPassword.value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    els.loginSubmit.disabled = false;
    els.loginSubmit.textContent = 'Sign In';

    if (error || !data.session) {
      showLoginError('Incorrect email or password.');
      return;
    }
    session = data.session;
    enterDashboard();
  });

  els.logoutBtn.addEventListener('click', async () => {
    if (channel) supabase.removeChannel(channel);
    await supabase.auth.signOut();
    enquiries = [];
    els.enquiryList.innerHTML = '';
    showLogin();
  });

  // ===================================================================
  // Dashboard entry
  // ===================================================================
  async function enterDashboard() {
    els.loginScreen.hidden = true;
    els.dashboard.hidden = false;
    await loadInitial();
    subscribeRealtime();
    initSound();
    initPushUI();
  }

  // ===================================================================
  // Data loading
  // ===================================================================
  async function loadInitial() {
    setConnectionStatus('connecting');
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('[dashboard] Failed to load enquiries:', error.message);
      return;
    }
    enquiries = data || [];
    oldestLoadedAt = enquiries.length ? enquiries[enquiries.length - 1].created_at : null;
    els.loadMoreBtn.hidden = enquiries.length < PAGE_SIZE;
    renderList();
  }

  async function loadMore() {
    if (!oldestLoadedAt) return;
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .lt('created_at', oldestLoadedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) return;
    enquiries = enquiries.concat(data);
    oldestLoadedAt = data.length ? data[data.length - 1].created_at : oldestLoadedAt;
    els.loadMoreBtn.hidden = data.length < PAGE_SIZE;
    renderList();
  }
  els.loadMoreBtn.addEventListener('click', loadMore);

  // Fills any gap created while the Realtime channel was disconnected
  // (offline recovery) by re-fetching anything newer than the newest
  // row we already have.
  async function resyncSinceLastKnown() {
    const newest = enquiries.length ? enquiries[0].created_at : null;
    let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(50);
    if (newest) query = query.gt('created_at', newest);
    const { data, error } = await query;
    if (error || !data || !data.length) return;
    data.reverse().forEach((row) => upsertEnquiry(row, { fromRealtime: true, silent: false }));
  }

  // ===================================================================
  // Realtime
  // ===================================================================
  function subscribeRealtime() {
    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel('admin-enquiries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enquiries' }, (payload) => {
        upsertEnquiry(payload.new, { fromRealtime: true, silent: false });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enquiries' }, (payload) => {
        upsertEnquiry(payload.new, { fromRealtime: true, silent: true });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('live');
          resyncSinceLastKnown();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connecting');
        }
      });
  }

  function setConnectionStatus(state) {
    const labels = { live: 'Live', connecting: 'Connecting…', error: 'Reconnecting…' };
    els.connectionStatus.textContent = labels[state] || state;
    els.connectionStatus.className = 'conn-status conn-' + state;
  }

  function upsertEnquiry(row, opts) {
    const idx = enquiries.findIndex((x) => x.id === row.id);
    const isNew = idx === -1;
    if (isNew) {
      if (opts.fromRealtime) row.__justArrived = true;
      enquiries.unshift(row);
    } else {
      enquiries[idx] = row;
    }

    renderList();

    if (isNew && opts.fromRealtime && !opts.silent) {
      notifyNewEnquiry(row);
    }
  }

  // ===================================================================
  // New-enquiry notification: toast + sound (in-tab). OS-level push
  // notifications for when the tab isn't focused/open are handled
  // server-side (api/_lib/webpush.js) via the service worker, not here
  // — avoids double-notifying when the tab IS open and focused.
  // ===================================================================
  function notifyNewEnquiry(row) {
    updateCounters();
    playNotificationSound();
    showToast(row);
  }

  function showToast(row) {
    const toast = el('div', { class: 'toast' }, [
      el('span', { class: 'toast-icon', text: '🔔' }),
      el('div', {}, [
        el('p', { class: 'toast-title', text: 'New ' + (row.source_label || 'Enquiry') }),
        el('p', { class: 'toast-body', text: (row.name || 'Someone') + ' — ' + (row.phone || row.email || '') })
      ])
    ]);
    toast.addEventListener('click', () => { openDetail(row.id); dismissToast(toast); });
    els.toastContainer.appendChild(toast);
    setTimeout(() => dismissToast(toast), 8000);
  }

  function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 200);
  }

  // ===================================================================
  // Rendering
  // ===================================================================
  function currentFilters() {
    return {
      q: els.searchInput.value.trim().toLowerCase(),
      status: els.statusFilter.value,
      source: els.sourceFilter.value,
      date: els.dateFilter.value
    };
  }

  function matchesFilters(row, f) {
    if (f.status !== 'all' && row.status !== f.status) return false;
    if (f.source !== 'all' && row.source !== f.source) return false;
    if (f.date !== 'all') {
      const ageMs = Date.now() - new Date(row.created_at).getTime();
      const limits = { today: 24 * 3600e3, '7d': 7 * 24 * 3600e3, '30d': 30 * 24 * 3600e3 };
      if (ageMs > limits[f.date]) return false;
    }
    if (f.q) {
      const hay = [row.name, row.phone, row.email, row.message, row.postcode, row.service].join(' ').toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  }

  let renderQueued = false;
  function renderList() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      doRenderList();
    });
  }

  function doRenderList() {
    const f = currentFilters();
    const visible = enquiries.filter((r) => matchesFilters(r, f));

    els.enquiryList.innerHTML = '';
    visible.forEach((row) => els.enquiryList.appendChild(buildCard(row)));

    els.emptyState.hidden = visible.length > 0;
    updateCounters();
  }

  function updateCounters() {
    const unread = enquiries.filter((r) => r.status === 'unread').length;
    els.unreadCount.textContent = String(unread);
    els.unreadCount.setAttribute('data-nonzero', unread > 0 ? 'true' : 'false');
    els.totalCount.textContent = String(enquiries.length);
    document.title = (unread > 0 ? '(' + unread + ') ' : '') + 'Enquiries — Blissful Blinds Admin';
  }

  function buildCard(row) {
    const card = el('div', {
      class: 'enquiry-card ' + (row.status === 'unread' ? 'unread' : 'read'),
      'data-id': row.id
    });
    if (row.__justArrived) {
      card.classList.add('just-arrived');
      delete row.__justArrived;
    }

    const badge = el('span', {
      class: 'enquiry-badge source-' + escapeForAttr(row.source),
      text: row.source_label || row.source
    });

    const topRow = el('div', { class: 'enquiry-top-row' }, [
      el('span', { class: 'enquiry-name', text: row.name || 'Unknown' }),
      badge,
      el('span', { class: 'enquiry-time', text: relativeTime(row.created_at) })
    ]);

    const metaParts = [];
    if (row.phone) metaParts.push(el('span', { text: '📞 ' + row.phone }));
    if (row.email) metaParts.push(el('span', { text: '✉ ' + row.email }));
    if (row.product_interest) metaParts.push(el('span', { text: '🫚 ' + row.product_interest }));
    const meta = el('div', { class: 'enquiry-meta' }, metaParts);

    const main = el('div', { class: 'enquiry-main' }, [
      topRow,
      meta,
      row.message ? el('div', { class: 'enquiry-snippet', text: row.message }) : null
    ]);

    card.appendChild(el('div', { class: 'enquiry-dot' }));
    card.appendChild(main);
    card.addEventListener('click', () => openDetail(row.id));
    return card;
  }

  // ===================================================================
  // Detail panel
  // ===================================================================
  function field(label, value) {
    if (!value) return null;
    return el('div', {}, [
      el('div', { class: 'detail-field-label', text: label }),
      el('div', { class: 'detail-field-value', text: value })
    ]);
  }

  async function openDetail(id) {
    const row = enquiries.find((r) => r.id === id);
    if (!row) return;

    if (row.status === 'unread') {
      row.status = 'read';
      renderList();
      supabase.from('enquiries').update({ status: 'read' }).eq('id', id).then(({ error }) => {
        if (error) console.error('[dashboard] Failed to mark read:', error.message);
      });
    }

    const content = els.detailContent;
    content.innerHTML = '';
    content.appendChild(el('h2', { id: 'detailName', text: row.name || 'Unknown' }));
    content.appendChild(el('p', { class: 'enquiry-badge source-' + escapeForAttr(row.source), text: row.source_label }));

    [
      field('Phone', row.phone),
      field('Email', row.email),
      field('Address', [row.address, row.postcode].filter(Boolean).join(', ')),
      field('Product / Service', row.product_interest || row.service),
      field('Preferred Colour', row.preferred_color),
      field('Best Time To Call', row.appointment),
      field('How They Heard About Us', row.hear_about_us),
      field('Message', row.message),
      field('Submitted', new Date(row.created_at).toLocaleString('en-GB'))
    ].forEach((f) => f && content.appendChild(f));

    const actions = el('div', { class: 'detail-actions' });
    if (row.phone) actions.appendChild(el('a', { class: 'call', href: 'tel:' + row.phone.replace(/[^\d+]/g, ''), text: '📞 Call' }));
    if (row.email) actions.appendChild(el('a', { class: 'email', href: 'mailto:' + row.email, text: '✉ Email' }));
    if (row.address || row.postcode) {
      const q = encodeURIComponent([row.address, row.postcode].filter(Boolean).join(', '));
      actions.appendChild(el('a', { class: 'map', href: 'https://www.google.com/maps/search/?api=1&query=' + q, target: '_blank', rel: 'noopener', text: '📍 Map' }));
    }
    content.appendChild(actions);

    const tech = el('div', { class: 'detail-tech' });
    [
      ['IP', row.ip], ['User Agent', row.user_agent], ['Page URL', row.page_url], ['Referrer', row.referrer]
    ].forEach(([label, value]) => {
      if (value) tech.appendChild(el('div', { text: label + ': ' + value }));
    });
    content.appendChild(tech);

    els.detailOverlay.hidden = false;
  }

  els.detailClose.addEventListener('click', () => { els.detailOverlay.hidden = true; });
  els.detailOverlay.addEventListener('click', (e) => { if (e.target === els.detailOverlay) els.detailOverlay.hidden = true; });

  // ===================================================================
  // Filters / search / mark-all-read
  // ===================================================================
  ['input', 'change'].forEach((evt) => {
    els.searchInput.addEventListener(evt, renderList);
  });
  [els.statusFilter, els.sourceFilter, els.dateFilter].forEach((selectEl) => {
    selectEl.addEventListener('change', renderList);
  });

  els.markAllReadBtn.addEventListener('click', async () => {
    const unreadIds = enquiries.filter((r) => r.status === 'unread').map((r) => r.id);
    if (!unreadIds.length) return;
    enquiries.forEach((r) => { if (r.status === 'unread') r.status = 'read'; });
    renderList();
    const { error } = await supabase.from('enquiries').update({ status: 'read' }).in('id', unreadIds);
    if (error) console.error('[dashboard] Failed to mark all read:', error.message);
  });

  els.menuToggle.addEventListener('click', () => els.filterBar.classList.toggle('open'));

  // ===================================================================
  // CSV export (from currently filtered/visible set)
  // ===================================================================
  function csvEscape(value) {
    let str = String(value == null ? '' : value);
    // CSV/formula injection guard: a submitted name/message starting with
    // =, +, -, or @ would be interpreted as a formula by Excel/Sheets when
    // this file is opened — since every value here originated from a
    // public web form, neutralize that by prefixing with a tab character
    // (invisible in the opened spreadsheet, breaks formula parsing).
    if (/^[=+\-@]/.test(str)) str = '\t' + str;
    return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
  }

  els.exportBtn.addEventListener('click', () => {
    const f = currentFilters();
    const rows = enquiries.filter((r) => matchesFilters(r, f));
    const columns = ['created_at', 'source_label', 'name', 'phone', 'email', 'address', 'postcode', 'product_interest', 'preferred_color', 'appointment', 'hear_about_us', 'message', 'status'];
    const header = columns.join(',');
    const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(','));
    const csv = [header].concat(lines).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blissful-blinds-enquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ===================================================================
  // Notification sound — synthesized (no audio asset needed), with
  // mute / volume / optional custom upload, persisted in localStorage.
  // ===================================================================
  const SOUND_KEY = 'bb_admin_sound_settings';
  const CUSTOM_SOUND_KEY = 'bb_admin_custom_sound';

  function loadSoundSettings() {
    try {
      return Object.assign({ muted: false, volume: 0.6 }, JSON.parse(localStorage.getItem(SOUND_KEY) || '{}'));
    } catch {
      return { muted: false, volume: 0.6 };
    }
  }
  function saveSoundSettings(s) {
    localStorage.setItem(SOUND_KEY, JSON.stringify(s));
  }

  let soundSettings = loadSoundSettings();

  function initSound() {
    els.soundMute.checked = soundSettings.muted;
    els.soundVolume.value = soundSettings.volume;
  }

  els.soundMute.addEventListener('change', () => {
    soundSettings.muted = els.soundMute.checked;
    saveSoundSettings(soundSettings);
    els.soundSettingsBtn.classList.toggle('active', soundSettings.muted);
  });
  els.soundVolume.addEventListener('input', () => {
    soundSettings.volume = Number(els.soundVolume.value);
    saveSoundSettings(soundSettings);
  });
  els.soundUpload.addEventListener('change', () => {
    const file = els.soundUpload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(CUSTOM_SOUND_KEY, reader.result);
      playNotificationSound();
    };
    reader.readAsDataURL(file);
  });
  els.soundResetBtn.addEventListener('click', () => {
    localStorage.removeItem(CUSTOM_SOUND_KEY);
    els.soundUpload.value = '';
  });
  els.soundTestBtn.addEventListener('click', playNotificationSound);
  els.soundSettingsBtn.addEventListener('click', () => { els.soundOverlay.hidden = false; });
  els.soundClose.addEventListener('click', () => { els.soundOverlay.hidden = true; });
  els.soundOverlay.addEventListener('click', (e) => { if (e.target === els.soundOverlay) els.soundOverlay.hidden = true; });

  let audioCtx = null;
  function playSynthesizedChime(volume) {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume * 0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  function playNotificationSound() {
    if (soundSettings.muted) return;
    const custom = localStorage.getItem(CUSTOM_SOUND_KEY);
    if (custom) {
      const audio = new Audio(custom);
      audio.volume = soundSettings.volume;
      audio.play().catch(() => {});
      return;
    }
    try {
      playSynthesizedChime(soundSettings.volume);
    } catch {
      // Web Audio unavailable/blocked (e.g. before any user gesture) — silent no-op.
    }
  }

  // ===================================================================
  // Web Push — OS-level notifications for when the dashboard tab isn't
  // focused/open. Purely additive: the in-tab toast+sound above already
  // give instant feedback while the tab is open and focused.
  // ===================================================================
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  function initPushUI() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      els.enablePushBtn.hidden = true;
      return;
    }
    els.enablePushBtn.classList.toggle('active', Notification.permission === 'granted');

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification-click' && event.data.url) {
        const match = event.data.url.match(/enquiry-(.+)$/);
        if (match) openDetail(match[1]);
      }
    });
  }

  els.enablePushBtn.addEventListener('click', async () => {
    if (Notification.permission === 'denied') {
      alert('Notifications are blocked for this site in your browser settings. Enable them there, then reload this page.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    if (!window.__BB_VAPID_PUBLIC_KEY) {
      alert('Push notifications are not configured on the server yet.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(window.__BB_VAPID_PUBLIC_KEY)
        });
      }

      const json = sub.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        admin_email: session.user.email,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth
      }, { onConflict: 'endpoint' });

      if (error) throw error;
      els.enablePushBtn.classList.add('active');
    } catch (err) {
      console.error('[dashboard] Push subscription failed:', err);
      alert('Could not enable push notifications: ' + err.message);
    }
  });

  boot();
})();
