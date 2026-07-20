(function () {
  'use strict';

  // ===================================================================
  // Configuration & State
  // ===================================================================
  let token = sessionStorage.getItem('bb_admin_token') || null;
  let socket = null;
  let orders = [];
  let selectedOrderId = null;
  let targetNewStatus = null; // Used by status change modal
  
  // Element caching
  const els = {
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),
    loginSubmit: document.getElementById('loginSubmit'),
    
    dashboard: document.getElementById('dashboard'),
    connectionStatus: document.getElementById('connectionStatus'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Metrics
    countNew: document.getElementById('countNew'),
    countPending: document.getElementById('countPending'),
    countConfirmed: document.getElementById('countConfirmed'),
    countCompleted: document.getElementById('countCompleted'),
    countCancelled: document.getElementById('countCancelled'),
    
    // Filters & Search
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    refreshBtn: document.getElementById('refreshBtn'),
    totalOrdersCount: document.getElementById('totalOrdersCount'),
    ordersList: document.getElementById('ordersList'),
    
    // Details Pane
    detailsPane: document.getElementById('detailsPane'),
    detailsEmpty: document.getElementById('detailsEmpty'),
    detailsContent: document.getElementById('detailsContent'),
    
    // Details Fields
    detOrderId: document.getElementById('detOrderId'),
    detOrderDate: document.getElementById('detOrderDate'),
    detStatusSelect: document.getElementById('detStatusSelect'),
    detCustName: document.getElementById('detCustName'),
    detCustEmail: document.getElementById('detCustEmail'),
    detCustAddress: document.getElementById('detCustAddress'),
    detProdName: document.getElementById('detProdName'),
    detProdSpecs: document.getElementById('detProdSpecs'),
    detProdSize: document.getElementById('detProdSize'),
    detProdFitting: document.getElementById('detProdFitting'),
    detProdQty: document.getElementById('detProdQty'),
    detPriceSub: document.getElementById('detPriceSub'),
    detPriceVat: document.getElementById('detPriceVat'),
    detPriceTotal: document.getElementById('detPriceTotal'),
    detSchedDate: document.getElementById('detSchedDate'),
    detSchedNotes: document.getElementById('detSchedNotes'),
    detTimelineList: document.getElementById('detTimelineList'),
    detNotificationLogs: document.getElementById('detNotificationLogs'),
    detAuditList: document.getElementById('detAuditList'),
    
    // Action buttons
    actCall: document.getElementById('actCall'),
    actWhatsApp: document.getElementById('actWhatsApp'),
    actMaps: document.getElementById('actMaps'),
    actPdf: document.getElementById('actPdf'),
    actPrint: document.getElementById('actPrint'),
    
    // Status Modal
    statusModal: document.getElementById('statusModal'),
    statusComment: document.getElementById('statusComment'),
    modalCancel: document.getElementById('modalCancel'),
    modalConfirm: document.getElementById('modalConfirm'),
    
    chimeSound: document.getElementById('chimeSound')
  };

  // ===================================================================
  // AJAX Helpers
  // ===================================================================
  async function apiCall(endpoint, options = {}) {
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Clear token and kick user back to login on expired session
      sessionStorage.removeItem('bb_admin_token');
      token = null;
      showLogin('Session expired. Please sign in again.');
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server request failed.');
    }
    return data;
  }

  // ===================================================================
  // View Controllers
  // ===================================================================
  function showLogin(errorMsg = '') {
    els.loginScreen.hidden = false;
    els.dashboard.hidden = true;
    if (errorMsg) {
      els.loginError.textContent = errorMsg;
      els.loginError.hidden = false;
    } else {
      els.loginError.hidden = true;
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  function showDashboard() {
    els.loginScreen.hidden = true;
    els.dashboard.hidden = false;
    
    initDashboard();
  }

  // ===================================================================
  // Core Bootstrap
  // ===================================================================
  function boot() {
    if (token) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  // ===================================================================
  // Event Bindings (Sign In / Sign Out)
  // ===================================================================
  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.hidden = true;
    els.loginSubmit.disabled = true;
    els.loginSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';

    const username = els.loginUsername.value;
    const password = els.loginPassword.value;

    try {
      const result = await apiCall('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      token = result.token;
      sessionStorage.setItem('bb_admin_token', token);
      
      // Clear inputs
      els.loginUsername.value = '';
      els.loginPassword.value = '';
      
      showDashboard();
    } catch (err) {
      els.loginError.textContent = err.message || 'Authentication failed.';
      els.loginError.hidden = false;
    } finally {
      els.loginSubmit.disabled = false;
      els.loginSubmit.textContent = 'Sign In';
    }
  });

  els.logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('bb_admin_token');
    token = null;
    showLogin();
  });

  // ===================================================================
  // Dashboard Management
  // ===================================================================
  function initDashboard() {
    loadOrders();
    initSocket();
    
    // Bind search and filter triggers
    els.searchInput.addEventListener('input', debounce(loadOrders, 300));
    els.statusFilter.addEventListener('change', loadOrders);
    els.refreshBtn.addEventListener('click', loadOrders);
    
    // Bind modal buttons
    els.modalCancel.addEventListener('click', () => {
      els.statusModal.hidden = true;
      // Reset dropdown select to selected order's actual status
      if (selectedOrderId) {
        const order = orders.find(o => o.orderId === selectedOrderId);
        if (order) els.detStatusSelect.value = order.status;
      }
    });

    els.modalConfirm.addEventListener('click', executeStatusUpdate);
    els.detStatusSelect.addEventListener('change', (e) => {
      targetNewStatus = e.target.value;
      els.statusComment.value = '';
      els.statusModal.hidden = false;
    });

    // Metric card filtering clicks
    document.querySelectorAll('.metric-card').forEach(card => {
      card.addEventListener('click', () => {
        const status = card.getAttribute('data-filter');
        els.statusFilter.value = status;
        loadOrders();
      });
    });

    // Custom sound chime test (can click status bar to verify speaker permission)
    els.connectionStatus.addEventListener('click', playChime);
  }

  // ===================================================================
  // Real-Time Socket.IO Synchronization
  // ===================================================================
  function initSocket() {
    if (socket) return;
    
    // Initialize socket connection
    socket = io();

    socket.on('connect', () => {
      setConnectionStatus('live');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('connecting');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    // Socket Event: New Order placed
    socket.on('new_order', (data) => {
      playChime();
      
      // Prepend to current orders state if it matches active filter
      const currentFilter = els.statusFilter.value;
      if (currentFilter === 'all' || currentFilter === 'New') {
        const fakeCard = {
          orderId: data.orderId,
          customer: { name: data.customerName },
          pricing: { grandTotal: data.grandTotal },
          status: 'New',
          createdAt: data.createdAt,
          __justArrived: true
        };
        orders.unshift(fakeCard);
        renderOrdersList();
      }
      
      // Increment total count in metrics
      const newCount = parseInt(els.countNew.textContent, 10) || 0;
      els.countNew.textContent = newCount + 1;
    });

    // Socket Event: Status Updated by another admin session
    socket.on('status_updated', (data) => {
      const order = orders.find(o => o.orderId === data.orderId);
      if (order) {
        order.status = data.newStatus;
        renderOrdersList();
        
        // If active in view details, reload detail content
        if (selectedOrderId === data.orderId) {
          loadOrderDetails(data.orderId);
        }
      }
      refreshMetrics();
    });
  }

  function setConnectionStatus(state) {
    const labels = { live: 'Live', connecting: 'Connecting...', error: 'Offline' };
    els.connectionStatus.textContent = labels[state] || state;
    els.connectionStatus.className = 'status-badge status-' + state;
  }

  function playChime() {
    if (els.chimeSound) {
      els.chimeSound.play().catch(() => {
        console.log('[Dashboard] Audio autoplay blocked. User interaction required.');
      });
    }
  }

  // ===================================================================
  // Fetch Registry Data
  // ===================================================================
  async function loadOrders() {
    els.ordersList.innerHTML = '<div class="list-loading text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching records...</div>';
    
    const query = els.searchInput.value.trim();
    const status = els.statusFilter.value;

    try {
      const data = await apiCall(`/api/admin/orders?q=${encodeURIComponent(query)}&status=${status}`);
      orders = data.orders || [];
      els.totalOrdersCount.textContent = data.totalCount;
      
      renderOrdersList();
      refreshMetrics();

      // Check query string ?id=BB-YYYYMMDD-XXXX to auto-focus
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      if (urlId && orders.some(o => o.orderId === urlId)) {
        // Clear param so it does not keep triggering on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        loadOrderDetails(urlId);
      }
    } catch (err) {
      console.error('Failed to load orders list:', err.message);
    }
  }

  async function refreshMetrics() {
    try {
      // Temporary fetch count details from list or distinct counters
      const data = await apiCall('/api/admin/orders?limit=1000');
      const all = data.orders || [];
      
      const counts = { New: 0, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
      all.forEach(o => {
        if (counts[o.status] !== undefined) counts[o.status]++;
      });

      els.countNew.textContent = counts.New;
      els.countPending.textContent = counts.Pending;
      els.countConfirmed.textContent = counts.Confirmed;
      els.countCompleted.textContent = counts.Completed;
      els.countCancelled.textContent = counts.Cancelled;
    } catch (err) {
      console.error('Failed to sync metrics:', err.message);
    }
  }

  // ===================================================================
  // Renders List Layout
  // ===================================================================
  function renderOrdersList() {
    els.ordersList.innerHTML = '';
    
    if (orders.length === 0) {
      els.ordersList.innerHTML = '<p class="text-center" style="color: var(--text-muted); margin: 30px 0;">No matching orders found.</p>';
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = `order-list-card ${order.orderId === selectedOrderId ? 'active' : ''}`;
      card.setAttribute('data-id', order.orderId);
      
      if (order.__justArrived) {
        card.classList.add('just-arrived');
        delete order.__justArrived;
      }

      const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      card.innerHTML = `
        <div class="card-top">
          <span class="card-id">${order.orderId}</span>
          <span class="card-status ${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="card-customer">${order.customer?.name || 'Customer'}</div>
        <div class="card-meta">
          <span>${dateStr}</span>
          <strong>£${order.pricing?.grandTotal.toFixed(2) || '0.00'}</strong>
        </div>
      `;

      card.addEventListener('click', () => loadOrderDetails(order.orderId));
      els.ordersList.appendChild(card);
    });
  }

  // ===================================================================
  // Fetch Order Details
  // ===================================================================
  async function loadOrderDetails(orderId) {
    selectedOrderId = orderId;
    
    // Highlight selected card
    document.querySelectorAll('.order-list-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-id') === orderId);
    });

    try {
      const data = await apiCall(`/api/admin/orders/${orderId}`);
      renderOrderDetails(data);
    } catch (err) {
      console.error('Failed to load order details:', err.message);
    }
  }

  function renderOrderDetails(data) {
    const order = data.order;
    const logs = data.notificationLogs || [];
    const audits = data.audits || [];

    // Toggle Empty State view
    els.detailsEmpty.hidden = true;
    els.detailsContent.hidden = false;

    // Set fields
    els.detOrderId.textContent = order.orderId;
    
    const timeSubmitted = new Date(order.createdAt).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    els.detOrderDate.textContent = `Placed on ${timeSubmitted}`;
    els.detStatusSelect.value = order.status;

    // Contact Details
    const compText = order.customer.companyName ? ` (${order.customer.companyName})` : '';
    els.detCustName.textContent = `${order.customer.name}${compText}`;
    els.detCustEmail.textContent = order.customer.email;
    els.detCustAddress.textContent = `${order.customer.address}, ${order.customer.city}, ${order.customer.postcode}`;

    // Specs Details
    els.detProdName.textContent = `${order.product.name} (${order.product.blindType})`;
    els.detProdSpecs.textContent = `${order.product.colour} Colour | ${order.product.fabric} Fabric`;
    els.detProdSize.textContent = `${order.product.width} cm (Width) x ${order.product.height} cm (Height)`;
    
    const fitText = order.product.fittingType;
    const installText = order.product.installationRequired ? 'Fit & Installation Required' : 'Supply Only';
    els.detProdFitting.textContent = `${fitText} | ${installText}`;
    els.detProdQty.textContent = `${order.product.room} (Quantity: ${order.product.quantity})`;

    // Pricing details
    els.detPriceSub.textContent = `£${order.pricing.subtotal.toFixed(2)}`;
    els.detPriceVat.textContent = `£${order.pricing.vat.toFixed(2)}`;
    els.detPriceTotal.textContent = `£${order.pricing.grandTotal.toFixed(2)}`;

    // Scheduling
    const prefDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    els.detSchedDate.textContent = `${prefDate} (${order.scheduling.preferredTime})`;
    els.detSchedNotes.textContent = order.scheduling.specialNotes || 'None';

    // Timeline Rendering
    els.detTimelineList.innerHTML = '';
    order.timeline.forEach(item => {
      const timeStr = new Date(item.timestamp).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      const el = document.createElement('div');
      el.className = 'timeline-item';
      el.innerHTML = `
        <div class="timeline-dot"></div>
        <p class="timeline-time">${timeStr}</p>
        <p class="timeline-status">${item.status}</p>
        <p class="timeline-comment">${item.comment || ''}</p>
      `;
      els.detTimelineList.appendChild(el);
    });

    // Action button handlers
    els.actCall.href = `tel:${order.customer.phone.replace(/[^\d+]/g, '')}`;
    
    // WhatsApp redirect link with preset message
    const formattedTotal = `£${order.pricing.grandTotal.toFixed(2)}`;
    const waMessage = encodeURIComponent(`Hi ${order.customer.name}, this is Blissful Blinds regarding your order ${order.orderId} for a total of ${formattedTotal}. We would like to coordinate your fitting date...`);
    els.actWhatsApp.href = `https://wa.me/${order.customer.whatsappNumber.replace(/[^\d+]/g, '')}?text=${waMessage}`;
    
    // Google Maps Redirection
    const addressQuery = encodeURIComponent(`${order.customer.address}, ${order.customer.postcode}`);
    els.actMaps.href = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
    
    // PDF download link
    els.actPdf.href = `/api/admin/orders/${order.orderId}/invoice?token=${token}`;
    els.actPdf.onclick = (e) => {
      e.preventDefault();
      downloadPDFBlob(order.orderId);
    };

    // Printing function
    els.actPrint.onclick = () => printOrderInvoice(order.orderId);

    // Notification Logs
    els.detNotificationLogs.innerHTML = '';
    const types = [
      { key: 'EmailConfirmation', label: 'Customer Confirmation Email' },
      { key: 'EmailOwner', label: 'Owner Alert Email' },
      { key: 'WhatsAppText', label: 'Owner WhatsApp Text' },
      { key: 'WhatsAppPDF', label: 'Owner WhatsApp PDF Invoice' }
    ];

    types.forEach(type => {
      const log = logs.find(l => l.notificationType === type.key);
      const logStatus = log ? log.status : 'Pending';
      const badgeClass = logStatus.toLowerCase();
      
      const lastAttempt = log && log.attempts.length ? log.attempts[log.attempts.length - 1] : null;
      let attemptText = 'No attempts logged.';
      if (lastAttempt) {
        const attemptTime = new Date(lastAttempt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        attemptText = `Last Attempt #${lastAttempt.attemptNumber} at ${attemptTime}${lastAttempt.errorMsg ? `: ${lastAttempt.errorMsg.slice(0, 80)}...` : ''}`;
      }

      const box = document.createElement('div');
      box.className = 'log-box';
      box.innerHTML = `
        <div class="log-box-header">
          <span>${type.label}</span>
          <span class="badge-log ${badgeClass}">${logStatus}</span>
        </div>
        <div class="log-box-body">
          <p style="margin: 0; font-size: 0.7rem;">${attemptText}</p>
          ${log && log.status === 'Failed' ? `<p style="margin: 4px 0 0 0; color: var(--danger); font-size: 0.65rem;">Retries: ${log.failuresCount} failures</p>` : ''}
        </div>
      `;
      els.detNotificationLogs.appendChild(box);
    });

    // Administrative Audit trail
    els.detAuditList.innerHTML = '';
    if (audits.length === 0) {
      els.detAuditList.innerHTML = '<div class="audit-item text-center">No action logs recorded.</div>';
    } else {
      audits.forEach(audit => {
        const timeStr = new Date(audit.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const item = document.createElement('div');
        item.className = 'audit-item';
        item.innerHTML = `
          <span class="a-time">[${timeStr}]</span> 
          <strong>${audit.user}</strong> executed 
          <span class="a-action">${audit.action}</span> 
          <span>${audit.details ? `(${audit.details})` : ''}</span>
        `;
        els.detAuditList.appendChild(item);
      });
    }
  }

  // ===================================================================
  // Action Handlers (Download PDF, Print, Updates)
  // ===================================================================
  async function downloadPDFBlob(orderId) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-Order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download PDF invoice: ' + err.message);
    }
  }

  async function printOrderInvoice(orderId) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Invoice print failed');
      
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      
      iframe.onload = function() {
        setTimeout(function() {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Remove iframe after print dialog resolves
          setTimeout(() => iframe.remove(), 1000);
        }, 100);
      };
    } catch (err) {
      alert('Could not print invoice: ' + err.message);
    }
  }

  async function executeStatusUpdate() {
    const comment = els.statusComment.value.trim();
    els.modalConfirm.disabled = true;
    els.modalConfirm.textContent = 'Updating...';

    try {
      await apiCall(`/api/admin/orders/${selectedOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetNewStatus, comment })
      });

      els.statusModal.hidden = true;
      loadOrderDetails(selectedOrderId);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      els.modalConfirm.disabled = false;
      els.modalConfirm.textContent = 'Save Update';
    }
  }

  // ===================================================================
  // Utility functions
  // ===================================================================
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Start bootstrap
  boot();
})();
