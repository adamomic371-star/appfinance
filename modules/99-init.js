// 99-INIT.JS - Bootstrap app al DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOMContentLoaded - Inizializzazione app');

  // Init splash logo
  if (typeof initSplash === 'function') initSplash();

  // Init login UI handlers
  if (typeof initLoginUI === 'function') initLoginUI();

  // Check for existing local session
  const savedUser = localStorage.getItem('fp_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && parsed.id) {
        user = parsed;
        console.log('✅ Session restored:', user.email);
        // Start app immediately, Firebase listener will sync in bg
        startApp();
        return;
      }
    } catch (e) {}
  }

  // Setup Firebase auth listener (will call hideLoginScreen if logged in)
  if (typeof setupFirebaseAuthListener === 'function') {
    setupFirebaseAuthListener();
  }

  // Show login if no user after short delay
  setTimeout(() => {
    if (!user) {
      hideSplash();
    }
  }, 1800);

  console.log('✅ App initialized');
});

function startApp() {
  hideSplash();
  hideLoginScreen();

  // Render top-level UI
  if (typeof renderTopbar === 'function') renderTopbar();
  if (typeof renderModeSwitcher === 'function') renderModeSwitcher();
  if (typeof renderNav === 'function') renderNav();

  // Load data from localStorage
  if (typeof loadTransactions === 'function') loadTransactions();
  if (typeof loadGoals === 'function') loadGoals();
  if (typeof loadRecurring === 'function') loadRecurring();
  if (typeof loadGroups === 'function') loadGroups();
  if (typeof loadBudgets === 'function') loadBudgets();

  // Navigate to default view
  navigate('dashboard');

  // Setup Firebase listener in background
  if (typeof setupFirebaseAuthListener === 'function') {
    setupFirebaseAuthListener();
  }
}

function renderView(view) {
  // Scroll content to top on navigation
  const content = document.getElementById('content');
  if (content) content.scrollTop = 0;

  switch (view) {
    case 'dashboard':
      if (typeof renderDashboard === 'function') renderDashboard();
      break;
    case 'transazioni':
      if (typeof renderTransactions === 'function') renderTransactions();
      break;
    case 'report':
      if (typeof renderReports === 'function') renderReports();
      break;
    case 'ricorrenti':
      if (typeof renderRecurring === 'function') renderRecurring();
      break;
    case 'bollette':
      if (typeof renderBollette === 'function') renderBollette();
      break;
    case 'viaggi':
      if (typeof renderViaggi === 'function') renderViaggi();
      break;
    case 'obiettivi':
      if (typeof renderGoals === 'function') renderGoals();
      break;
    case 'gruppi':
      if (typeof renderGroups === 'function') renderGroups();
      break;
    case 'budgets':
      if (typeof renderBudgets === 'function') renderBudgets();
      break;
    case 'notifiche':
      renderNotifiche();
      break;
    case 'piani':
      renderPiani();
      break;
    case 'profilo':
      if (typeof renderProfile === 'function') renderProfile();
      break;
    case 'admin':
      renderAdmin();
      break;
    // Business views
    case 'biz_dashboard':
      renderBizDashboard();
      break;
    case 'biz_primanota':
      renderBizPrimanota();
      break;
    case 'biz_clienti':
      renderBizClienti();
      break;
    case 'biz_preventivi':
      renderBizPreventivi();
      break;
    case 'biz_progetti':
      renderBizProgetti();
      break;
    case 'biz_spese':
      renderBizSpese();
      break;
    case 'biz_scadenzario':
      renderBizScadenzario();
      break;
    case 'biz_iva':
      renderBizIva();
      break;
    default:
      renderNotFound(view);
  }
}

function renderNotFound(view) {
  const content = document.getElementById('content');
  if (content) content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Sezione non trovata</div><div class="empty-text">"${view}"</div></div>`;
}

function renderNotifiche() {
  const content = document.getElementById('content');
  const alerts = [];

  // Check overdue bills
  const allBills = lsGet('fp_bills_' + (user ? user.id : 'local'), []);
  allBills.filter(b => !b.paid && new Date(b.dueDate) < new Date()).forEach(b => {
    alerts.push({ type: 'error', icon: '⚡', title: 'Bolletta scaduta', desc: `${b.name} — ${formatCurrency(b.amount)}` });
  });

  // Check goals near completion
  goals.forEach(g => {
    const p = pct(g.currentAmount || 0, g.targetAmount);
    if (p >= 80 && p < 100) {
      alerts.push({ type: 'info', icon: '🎯', title: 'Obiettivo quasi raggiunto', desc: `${g.name} al ${p}%` });
    } else if (p >= 100) {
      alerts.push({ type: 'success', icon: '🎉', title: 'Obiettivo raggiunto!', desc: g.name });
    }
  });

  let html = `<div class="section-header"><h2 class="section-title">🔔 Notifiche</h2></div>`;

  if (alerts.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">Nessuna notifica</div><div class="empty-text">Sei in regola con tutto!</div></div>`;
  } else {
    alerts.forEach(a => {
      html += `<div class="notification ${a.type}" style="margin-bottom:10px;pointer-events:all;animation:none;">
        <span style="font-size:20px;">${a.icon}</span>
        <div>
          <div style="font-weight:600;">${a.title}</div>
          <div style="font-size:12px;opacity:0.8;margin-top:2px;">${a.desc}</div>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;
}

function renderPiani() {
  const content = document.getElementById('content');
  const currentPlan = lsGet('fp_plan_' + (user ? user.id : 'local'), 'free');

  let html = `<div class="section-header"><h2 class="section-title">💎 Piani</h2></div>`;

  const planList = [
    { id: 'free', name: 'Free', price: 0, priceLabel: 'Gratis', features: ['Transazioni illimitate', 'Report base', 'Sincronizzazione Firebase'] },
    { id: 'personal_pro', name: 'Personal Pro', price: 4.99, priceLabel: '€4,99/mese', features: ['Tutto Free +', 'Obiettivi avanzati', 'Spese ricorrenti', 'Bollette & Viaggi', 'Gruppi', 'Export CSV'] },
    { id: 'business_starter', name: 'Business Starter', price: 9.99, priceLabel: '€9,99/mese', features: ['Tutto Personal +', 'Dashboard business', 'Prima nota', 'Gestione clienti'] },
    { id: 'business_pro', name: 'Business Pro', price: 19.99, priceLabel: '€19,99/mese', features: ['Tutto Starter +', 'Preventivi', 'Progetti', 'IVA', 'Scadenzario'] },
    { id: 'lifetime', name: 'Lifetime 🔥', price: 199, priceLabel: '€199 una tantum', features: ['Tutto incluso', 'Per sempre', 'Nessun abbonamento'] }
  ];

  planList.forEach(plan => {
    const isActive = currentPlan === plan.id;
    html += `<div class="plan-card ${isActive ? 'active' : ''}" onclick="selectPlan('${plan.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="plan-name">${plan.name}</div>
          <div class="plan-price">${plan.priceLabel}</div>
        </div>
        ${isActive ? '<span class="chip chip-info">✓ Attivo</span>' : ''}
      </div>
      <div class="plan-features">
        ${plan.features.map(f => `<div class="plan-feature">${f}</div>`).join('')}
      </div>
      ${!isActive ? `<button class="btn btn-primary btn-sm" style="margin-top:12px;width:100%;" onclick="selectPlan('${plan.id}')">Attiva piano</button>` : ''}
    </div>`;
  });

  content.innerHTML = html;
}

function selectPlan(planId) {
  lsSet('fp_plan_' + (user ? user.id : 'local'), planId);
  showNotification('✅ Piano aggiornato!', 'success');
  renderPiani();
}

// ---- ADMIN PANEL ----
function renderAdmin() {
  if (!user || !user.isAdmin) {
    const content = document.getElementById('content');
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔐</div><div class="empty-title">Accesso negato</div></div>`;
    return;
  }

  const content = document.getElementById('content');
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('fp_'));
  const userCount = new Set(allKeys.filter(k => k.includes('transactions_')).map(k => k.split('transactions_')[1])).size;
  const totalTx = allKeys.filter(k => k.startsWith('fp_transactions_')).reduce((sum, key) => {
    try { return sum + (JSON.parse(localStorage.getItem(key) || '[]').length); } catch(e) { return sum; }
  }, 0);

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">⚙️ Admin Panel</h2>
      <span class="admin-badge">🔐 Admin</span>
    </div>
    <div class="admin-grid">
      <div class="admin-stat"><div class="admin-stat-value">${userCount}</div><div class="admin-stat-label">Utenti</div></div>
      <div class="admin-stat"><div class="admin-stat-value">${totalTx}</div><div class="admin-stat-label">Transazioni</div></div>
      <div class="admin-stat"><div class="admin-stat-value">${allKeys.length}</div><div class="admin-stat-label">Chiavi localStorage</div></div>
      <div class="admin-stat"><div class="admin-stat-value">v${APP_CONFIG.version}</div><div class="admin-stat-label">Versione</div></div>
    </div>
    <div style="margin-top:20px;">
      <div class="settings-list">
        <div class="settings-item" onclick="syncAllToFirebase()">
          <span class="settings-item-icon">🔄</span>
          <div class="settings-item-info"><div class="settings-item-label">Sync tutto su Firebase</div><div class="settings-item-desc">Forza sincronizzazione completa</div></div>
          <span class="settings-item-arrow">›</span>
        </div>
        <div class="settings-item" onclick="showNotification('✅ Sistema OK', 'success')">
          <span class="settings-item-icon">🏥</span>
          <div class="settings-item-info"><div class="settings-item-label">Health Check</div><div class="settings-item-desc">Verifica stato sistema</div></div>
          <span class="settings-item-arrow">›</span>
        </div>
      </div>
    </div>
  `;
}

// ---- BUSINESS VIEWS ----
function renderBizDashboard() {
  const content = document.getElementById('content');
  loadTransactions(); // biz uses same transactions var for primanota

  const bizTx = lsGet('fp_biz_transactions_' + (user ? user.id : 'local'), []);
  const totalRevenue = bizTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalCosts = bizTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const clients = lsGet('fp_biz_clients_' + (user ? user.id : 'local'), []);

  content.innerHTML = `
    <div class="section-header"><h2 class="section-title">🏢 Dashboard Business</h2></div>
    <div class="biz-stat">
      <div class="biz-stat-item"><div class="biz-stat-label">Fatturato</div><div class="biz-stat-value">${formatCurrency(totalRevenue)}</div></div>
      <div class="biz-stat-item"><div class="biz-stat-label">Costi</div><div class="biz-stat-value" style="color:#ff4f6d;">${formatCurrency(totalCosts)}</div></div>
      <div class="biz-stat-item"><div class="biz-stat-label">Margine</div><div class="biz-stat-value" style="color:${totalRevenue-totalCosts >= 0 ? '#00e5a0' : '#ff4f6d'};">${formatCurrency(totalRevenue - totalCosts)}</div></div>
    </div>
    <div class="report-stat-grid">
      <div class="stat-card"><div class="stat-label">Clienti</div><div class="stat-value">${clients.length}</div></div>
      <div class="stat-card"><div class="stat-label">Prima nota</div><div class="stat-value">${bizTx.length}</div></div>
    </div>
    <div class="quick-actions">
      <button class="quick-btn primary" onclick="navigate('biz_primanota')"><span class="qb-icon">📒</span><span class="qb-label">Prima Nota</span></button>
      <button class="quick-btn primary" onclick="navigate('biz_clienti')"><span class="qb-icon">🤝</span><span class="qb-label">Clienti</span></button>
      <button class="quick-btn primary" onclick="navigate('biz_preventivi')"><span class="qb-icon">📄</span><span class="qb-label">Preventivi</span></button>
      <button class="quick-btn primary" onclick="navigate('biz_iva')"><span class="qb-icon">🏛️</span><span class="qb-label">IVA</span></button>
    </div>
  `;
}

function renderBizPrimanota() {
  const content = document.getElementById('content');
  const bizTx = lsGet('fp_biz_transactions_' + (user ? user.id : 'local'), []);

  let html = `
    <div class="section-header">
      <h2 class="section-title">📒 Prima Nota</h2>
      <span class="section-action" onclick="showAddBizTxModal()">+ Aggiungi</span>
    </div>
  `;

  if (bizTx.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📒</div><div class="empty-title">Prima nota vuota</div><div class="empty-text">Registra entrate e uscite aziendali</div></div>`;
  } else {
    html += '<div class="tx-list">';
    bizTx.slice(0, 30).forEach(tx => {
      html += renderTxItem(tx);
    });
    html += '</div>';
  }

  content.innerHTML = html;
}

function showAddBizTxModal() {
  showAddTxModal('income'); // reuse personal transaction modal for biz
}

function renderBizClienti() {
  const content = document.getElementById('content');
  const clients = lsGet('fp_biz_clients_' + (user ? user.id : 'local'), []);

  let html = `
    <div class="section-header">
      <h2 class="section-title">🤝 Clienti</h2>
      <span class="section-action" onclick="showAddClientModal()">+ Aggiungi</span>
    </div>
  `;

  if (clients.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">🤝</div><div class="empty-title">Nessun cliente</div><div class="empty-text">Aggiungi i tuoi clienti</div></div>`;
  } else {
    clients.forEach(c => {
      html += `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:16px;font-weight:700;">${escapeHtml(c.name)}</div>
            ${c.email ? `<div style="font-size:12px;color:#8892b0;">${escapeHtml(c.email)}</div>` : ''}
            ${c.company ? `<div style="font-size:12px;color:#4a5580;">${escapeHtml(c.company)}</div>` : ''}
          </div>
          <button class="btn btn-danger btn-sm btn-icon" onclick="showConfirm('Eliminare cliente?', () => { deleteBizClient('${c.id}'); renderBizClienti(); })">🗑</button>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;
}

function showAddClientModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">🤝 Nuovo Cliente</div>
      <div class="form-group"><label>Nome</label><input type="text" id="clientName" placeholder="Mario Rossi"></div>
      <div class="form-group"><label>Email</label><input type="email" id="clientEmail" placeholder="mario@email.it"></div>
      <div class="form-group"><label>Azienda</label><input type="text" id="clientCompany" placeholder="Rossi SRL"></div>
      <div class="form-group"><label>Telefono</label><input type="tel" id="clientPhone" placeholder="+39 000 000 0000"></div>
      <button class="btn btn-primary" onclick="submitClient()">Aggiungi Cliente</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitClient() {
  const name = document.getElementById('clientName').value.trim();
  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  const clients = lsGet('fp_biz_clients_' + user.id, []);
  clients.push({
    id: generateId(), name,
    email: document.getElementById('clientEmail').value.trim(),
    company: document.getElementById('clientCompany').value.trim(),
    phone: document.getElementById('clientPhone').value.trim(),
    createdAt: new Date().toISOString()
  });
  lsSet('fp_biz_clients_' + user.id, clients);
  document.querySelector('.modal-overlay')?.remove();
  renderBizClienti();
  showNotification('✅ Cliente aggiunto!', 'success');
}

function deleteBizClient(id) {
  const clients = lsGet('fp_biz_clients_' + user.id, []).filter(c => c.id !== id);
  lsSet('fp_biz_clients_' + user.id, clients);
}

function renderBizPreventivi() {
  const content = document.getElementById('content');
  const quotes = lsGet('fp_biz_quotes_' + (user ? user.id : 'local'), []);
  let html = `<div class="section-header"><h2 class="section-title">📄 Preventivi</h2><span class="section-action" onclick="showAddQuoteModal()">+ Nuovo</span></div>`;
  if (quotes.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Nessun preventivo</div><div class="empty-text">Crea il tuo primo preventivo</div></div>`;
  } else {
    quotes.forEach(q => {
      const statusColors = { bozza: '#ffd166', inviato: '#00d4ff', accettato: '#00e5a0', rifiutato: '#ff4f6d' };
      html += `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-weight:700;">${escapeHtml(q.title)}</div><div style="font-size:12px;color:#8892b0;">${formatDate(q.date)}</div></div><div style="text-align:right;"><div style="font-size:16px;font-weight:700;color:#6c63ff;">${formatCurrency(q.total)}</div><span class="chip" style="color:${statusColors[q.status]||'#8892b0'};border-color:${statusColors[q.status]||'#8892b0'};background:${statusColors[q.status]||'#8892b0'}22;">${q.status||'bozza'}</span></div></div></div>`;
    });
  }
  content.innerHTML = html;
}

function showAddQuoteModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">📄 Nuovo Preventivo</div>
      <div class="form-group"><label>Titolo</label><input type="text" id="quoteTitleI" placeholder="Preventivo sviluppo sito web"></div>
      <div class="form-group"><label>Importo totale (€)</label><input type="number" id="quoteTotalI" placeholder="0.00" step="0.01" min="0"></div>
      <div class="form-group"><label>Data</label><input type="date" id="quoteDateI" value="${todayStr()}"></div>
      <button class="btn btn-primary" onclick="submitQuote()">Crea Preventivo</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitQuote() {
  const title = document.getElementById('quoteTitleI').value.trim();
  const total = document.getElementById('quoteTotalI').value;
  const date = document.getElementById('quoteDateI').value;
  if (!title || !total) { showNotification('⚠️ Compila i campi', 'error'); return; }
  const quotes = lsGet('fp_biz_quotes_' + user.id, []);
  quotes.push({ id: generateId(), title, total: parseFloat(total), date, status: 'bozza', createdAt: new Date().toISOString() });
  lsSet('fp_biz_quotes_' + user.id, quotes);
  document.querySelector('.modal-overlay')?.remove();
  renderBizPreventivi();
  showNotification('✅ Preventivo creato!', 'success');
}

function renderBizProgetti() {
  const content = document.getElementById('content');
  const projects = lsGet('fp_biz_projects_' + (user ? user.id : 'local'), []);
  let html = `<div class="section-header"><h2 class="section-title">📁 Progetti</h2><span class="section-action" onclick="showAddProjectModal()">+ Nuovo</span></div>`;
  if (projects.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-title">Nessun progetto</div><div class="empty-text">Gestisci i tuoi progetti</div></div>`;
  } else {
    projects.forEach(p => {
      const statusColors = { attivo: '#00e5a0', completato: '#6c63ff', sospeso: '#ffd166' };
      html += `<div class="card"><div style="font-weight:700;font-size:15px;">${escapeHtml(p.name)}</div><div style="font-size:12px;color:#8892b0;margin-top:4px;">${escapeHtml(p.client||'')} · ${formatDate(p.startDate)}</div><div style="margin-top:8px;"><span class="chip" style="color:${statusColors[p.status]||'#8892b0'};border-color:${statusColors[p.status]||'#8892b0'};background:${statusColors[p.status]||'#8892b0'}22;">${p.status||'attivo'}</span>${p.budget ? `<span style="float:right;color:#6c63ff;font-weight:700;">${formatCurrency(p.budget)}</span>` : ''}</div></div>`;
    });
  }
  content.innerHTML = html;
}

function showAddProjectModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const clients = lsGet('fp_biz_clients_' + (user ? user.id : 'local'), []);
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">📁 Nuovo Progetto</div>
      <div class="form-group"><label>Nome progetto</label><input type="text" id="projNameI" placeholder="es. Sito web cliente"></div>
      <div class="form-group"><label>Cliente</label><select id="projClientI"><option value="">Nessuno</option>${clients.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Budget (€)</label><input type="number" id="projBudgetI" placeholder="Opzionale" step="0.01" min="0"></div>
      <div class="form-group"><label>Data inizio</label><input type="date" id="projStartI" value="${todayStr()}"></div>
      <button class="btn btn-primary" onclick="submitProject()">Crea Progetto</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitProject() {
  const name = document.getElementById('projNameI').value.trim();
  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  const projects = lsGet('fp_biz_projects_' + user.id, []);
  projects.push({ id: generateId(), name, client: document.getElementById('projClientI').value, budget: parseFloat(document.getElementById('projBudgetI').value) || null, startDate: document.getElementById('projStartI').value, status: 'attivo', createdAt: new Date().toISOString() });
  lsSet('fp_biz_projects_' + user.id, projects);
  document.querySelector('.modal-overlay')?.remove();
  renderBizProgetti();
  showNotification('✅ Progetto creato!', 'success');
}

function renderBizSpese() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="section-header"><h2 class="section-title">🧾 Note Spese</h2><span class="section-action" onclick="showAddTxModal('expense')">+ Aggiungi</span></div>
    <div class="card"><div style="font-size:13px;color:#8892b0;">Le note spese aziendali sono registrate nella Prima Nota.</div></div>
    <button class="btn btn-primary" style="width:100%;" onclick="navigate('biz_primanota')">Vai alla Prima Nota →</button>
  `;
}

function renderBizScadenzario() {
  const content = document.getElementById('content');
  const deadlines = lsGet('fp_biz_deadlines_' + (user ? user.id : 'local'), []);
  let html = `<div class="section-header"><h2 class="section-title">📅 Scadenzario</h2><span class="section-action" onclick="showAddDeadlineModal()">+ Aggiungi</span></div>`;
  if (deadlines.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">Nessuna scadenza</div><div class="empty-text">Aggiungi scadenze fiscali e pagamenti</div></div>`;
  } else {
    deadlines.sort((a,b) => a.date.localeCompare(b.date)).forEach(d => {
      const isOverdue = new Date(d.date) < new Date() && !d.done;
      html += `<div class="recurring-item"><span class="recurring-icon">${d.done ? '✅' : isOverdue ? '⚠️' : '📅'}</span><div class="recurring-info"><div class="recurring-name" style="${d.done ? 'text-decoration:line-through;opacity:0.5;' : ''}">${escapeHtml(d.name)}</div><div class="recurring-freq">${formatDate(d.date)}</div></div><div style="display:flex;gap:6px;">${!d.done ? `<button class="btn btn-success btn-sm" onclick="markDeadlineDone('${d.id}')">✓</button>` : ''}<button class="btn btn-danger btn-sm btn-icon" onclick="showConfirm('Eliminare?', () => { deleteDeadline('${d.id}'); renderBizScadenzario(); })">🗑</button></div></div>`;
    });
  }
  content.innerHTML = html;
}

function showAddDeadlineModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">📅 Nuova Scadenza</div>
      <div class="form-group"><label>Descrizione</label><input type="text" id="dlNameI" placeholder="es. Versamento IVA, F24"></div>
      <div class="form-group"><label>Data scadenza</label><input type="date" id="dlDateI" value="${todayStr()}"></div>
      <button class="btn btn-primary" onclick="submitDeadline()">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitDeadline() {
  const name = document.getElementById('dlNameI').value.trim();
  const date = document.getElementById('dlDateI').value;
  if (!name) { showNotification('⚠️ Inserisci descrizione', 'error'); return; }
  const deadlines = lsGet('fp_biz_deadlines_' + user.id, []);
  deadlines.push({ id: generateId(), name, date, done: false, createdAt: new Date().toISOString() });
  lsSet('fp_biz_deadlines_' + user.id, deadlines);
  document.querySelector('.modal-overlay')?.remove();
  renderBizScadenzario();
  showNotification('✅ Scadenza aggiunta!', 'success');
}

function markDeadlineDone(id) {
  const deadlines = lsGet('fp_biz_deadlines_' + user.id, []);
  const d = deadlines.find(x => x.id === id);
  if (d) { d.done = true; lsSet('fp_biz_deadlines_' + user.id, deadlines); renderBizScadenzario(); }
}

function deleteDeadline(id) {
  const deadlines = lsGet('fp_biz_deadlines_' + user.id, []).filter(x => x.id !== id);
  lsSet('fp_biz_deadlines_' + user.id, deadlines);
}

function renderBizIva() {
  const content = document.getElementById('content');
  const bizTx = lsGet('fp_biz_transactions_' + (user ? user.id : 'local'), []);
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  const IVA_RATE = 0.22;
  const quarterStart = new Date(year, (quarter - 1) * 3, 1).toISOString().split('T')[0];
  const quarterEnd = new Date(year, quarter * 3, 0).toISOString().split('T')[0];

  const quarterRevenue = bizTx.filter(t => t.type === 'income' && t.date >= quarterStart && t.date <= quarterEnd).reduce((s, t) => s + t.amount, 0);
  const quarterCosts = bizTx.filter(t => t.type === 'expense' && t.date >= quarterStart && t.date <= quarterEnd).reduce((s, t) => s + t.amount, 0);
  const ivaCollected = quarterRevenue * IVA_RATE;
  const ivaPaid = quarterCosts * IVA_RATE;
  const ivaNet = ivaCollected - ivaPaid;

  content.innerHTML = `
    <div class="section-header"><h2 class="section-title">🏛️ Calcolo IVA</h2></div>
    <div class="card">
      <div class="card-title">Q${quarter} ${year}</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
        <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(0,229,160,0.08);border-radius:8px;border:1px solid rgba(0,229,160,0.15);">
          <span style="color:#8892b0;">Fatturato netto</span>
          <span style="font-weight:700;color:#00e5a0;">${formatCurrency(quarterRevenue)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(0,229,160,0.08);border-radius:8px;border:1px solid rgba(0,229,160,0.15);">
          <span style="color:#8892b0;">IVA incassata (22%)</span>
          <span style="font-weight:700;color:#00e5a0;">${formatCurrency(ivaCollected)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,79,109,0.08);border-radius:8px;border:1px solid rgba(255,79,109,0.15);">
          <span style="color:#8892b0;">Costi deducibili</span>
          <span style="font-weight:700;color:#ff4f6d;">${formatCurrency(quarterCosts)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px;background:rgba(255,79,109,0.08);border-radius:8px;border:1px solid rgba(255,79,109,0.15);">
          <span style="color:#8892b0;">IVA pagata (22%)</span>
          <span style="font-weight:700;color:#ff4f6d;">${formatCurrency(ivaPaid)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:14px;background:rgba(108,99,255,0.1);border-radius:10px;border:1px solid rgba(108,99,255,0.3);">
          <span style="font-weight:700;">IVA da versare</span>
          <span style="font-size:20px;font-weight:800;color:${ivaNet >= 0 ? '#ff4f6d' : '#00e5a0'};">${formatCurrencyFull(ivaNet)}</span>
        </div>
      </div>
    </div>
    <div class="card" style="font-size:12px;color:#4a5580;font-style:italic;">
      ⚠️ Calcolo indicativo. Consulta un commercialista per la dichiarazione IVA ufficiale.
    </div>
  `;
}

console.log('✅ init.js loaded');
