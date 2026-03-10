// 10-PROFILE.JS - Profilo utente

function renderProfile() {
  const content = document.getElementById('content');
  const u = user || { name: 'User', email: '' };
  const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();
  const plan = lsGet('fp_plan_' + (u.id || 'local'), 'free');
  const planInfo = PLANS[plan] || PLANS.free;

  // Stats
  loadTransactions();
  const { income, expense } = getBalance();
  const txCount = transactions.length;

  let html = `
    <div style="text-align:center;padding:24px 0 16px;">
      <div class="avatar">${initial}</div>
      <div class="profile-name">${escapeHtml(u.name || 'Utente')}</div>
      <div class="profile-email">${escapeHtml(u.email || '')}</div>
      <div class="profile-plan" style="margin:12px auto;display:inline-flex;">
        💎 ${planInfo.label}
        ${u.isAdmin ? '<span class="admin-badge" style="margin-left:8px;">🔐 Admin</span>' : ''}
      </div>
    </div>

    <!-- STATS -->
    <div class="report-stat-grid" style="margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-label">Transazioni</div>
        <div class="stat-value">${txCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Entrate totali</div>
        <div class="stat-value" style="color:#00e5a0;font-size:16px;">${formatCurrency(income)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uscite totali</div>
        <div class="stat-value" style="color:#ff4f6d;font-size:16px;">${formatCurrency(expense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Obiettivi</div>
        <div class="stat-value">${goals.length}</div>
      </div>
    </div>

    <!-- SETTINGS -->
    <div class="section-title" style="margin-bottom:12px;">Impostazioni</div>
    <div class="settings-list">
      <div class="settings-item" onclick="navigate('piani')">
        <span class="settings-item-icon">💎</span>
        <div class="settings-item-info">
          <div class="settings-item-label">Piano: ${planInfo.label}</div>
          <div class="settings-item-desc">Gestisci il tuo abbonamento</div>
        </div>
        <span class="settings-item-arrow">›</span>
      </div>
      <div class="settings-item" onclick="showLanguageModal()">
        <span class="settings-item-icon">🌍</span>
        <div class="settings-item-info">
          <div class="settings-item-label">Lingua</div>
          <div class="settings-item-desc">Italiano</div>
        </div>
        <span class="settings-item-arrow">›</span>
      </div>
      <div class="settings-item" onclick="exportData()">
        <span class="settings-item-icon">📤</span>
        <div class="settings-item-info">
          <div class="settings-item-label">Esporta dati</div>
          <div class="settings-item-desc">Scarica le tue transazioni in CSV</div>
        </div>
        <span class="settings-item-arrow">›</span>
      </div>
      <div class="settings-item" onclick="showConfirm('Eliminare tutti i dati locali?', clearAllData)">
        <span class="settings-item-icon">🗑️</span>
        <div class="settings-item-info">
          <div class="settings-item-label">Cancella dati</div>
          <div class="settings-item-desc" style="color:#ff4f6d;">Rimuovi tutti i dati locali</div>
        </div>
        <span class="settings-item-arrow">›</span>
      </div>
    </div>

    <!-- LOGOUT -->
    <div style="margin-top:24px;">
      <button class="btn btn-danger" style="width:100%;" onclick="logout()">🚪 Esci</button>
    </div>

    <!-- APP INFO -->
    <div style="text-align:center;padding:24px 0;color:#4a5580;font-size:12px;">
      Kazka v${APP_CONFIG.version} · Made with ❤️
    </div>
  `;

  content.innerHTML = html;
}

function exportData() {
  loadTransactions();
  if (transactions.length === 0) {
    showNotification('⚠️ Nessuna transazione da esportare', 'info');
    return;
  }

  const rows = [['Data', 'Tipo', 'Categoria', 'Descrizione', 'Importo']];
  transactions.forEach(tx => {
    rows.push([
      tx.date,
      tx.type === 'income' ? 'Entrata' : 'Uscita',
      getCategoryLabel(tx.category),
      tx.description || '',
      (tx.type === 'expense' ? '-' : '') + tx.amount.toFixed(2)
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kazka_transazioni_' + todayStr() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('✅ Dati esportati!', 'success');
}

function clearAllData() {
  if (!user) return;
  lsDel('fp_transactions_' + user.id);
  lsDel('fp_goals_' + user.id);
  lsDel('fp_recurring_' + user.id);
  lsDel('fp_groups_' + user.id);
  lsDel('fp_bills_' + user.id);
  lsDel('fp_trips_' + user.id);
  lsDel('fp_budgets_' + user.id);
  transactions = [];
  goals = [];
  recurringItems = [];
  groups = [];
  bills = [];
  trips = [];
  showNotification('✅ Dati cancellati', 'info');
  renderProfile();
}

function showLanguageModal() {
  showNotification('ℹ️ Solo italiano disponibile al momento', 'info');
}

console.log('✅ profile.js loaded');
