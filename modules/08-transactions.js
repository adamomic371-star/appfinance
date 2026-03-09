// 08-TRANSACTIONS.JS - Transazioni CRUD e render

function loadTransactions() {
  transactions = lsGet('fp_transactions_' + (user ? user.id : 'local'), []);
}

function saveTransactions() {
  lsSet('fp_transactions_' + (user ? user.id : 'local'), transactions);
  queueSync('transactions');
}

function addTransaction(type, amount, category, description, date) {
  const tx = {
    id: generateId(),
    type: type, // 'income' | 'expense'
    amount: Math.abs(parseFloat(amount)),
    category: category,
    description: description,
    date: date || todayStr(),
    createdAt: new Date().toISOString()
  };
  transactions.unshift(tx);
  saveTransactions();
  showNotification('✅ Transazione aggiunta!', 'success');
  return tx;
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  showNotification('🗑️ Transazione eliminata', 'info');
}

function getBalance() {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { balance: totalIncome - totalExpense, income: totalIncome, expense: totalExpense };
}

function getMonthlyStats(monthKey) {
  const monthTx = transactions.filter(t => t.date && t.date.startsWith(monthKey));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense, count: monthTx.length };
}

function renderDashboard() {
  const content = document.getElementById('content');
  loadTransactions();
  loadGoals();

  const { balance, income, expense } = getBalance();
  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);
  const monthStats = getMonthlyStats(thisMonth);

  // Recent transactions (last 5)
  const recent = transactions.slice(0, 5);

  // Monthly chart (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    const stats = getMonthlyStats(key);
    months.push({ key, label: getMonthName(d.getMonth()), ...stats });
  }
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);

  let html = `
    <!-- BALANCE CARD -->
    <div class="balance-card fade-in-up">
      <div class="balance-label">Saldo Totale</div>
      <div class="balance-amount">${formatCurrencyFull(balance)}</div>
      <div class="balance-sub">
        <div class="balance-sub-item">
          <div class="balance-sub-label">Entrate</div>
          <div class="balance-sub-value income">+${formatCurrency(income)}</div>
        </div>
        <div class="balance-sub-item">
          <div class="balance-sub-label">Uscite</div>
          <div class="balance-sub-value expense">-${formatCurrency(expense)}</div>
        </div>
        <div class="balance-sub-item">
          <div class="balance-sub-label">Questo mese</div>
          <div class="balance-sub-value ${monthStats.balance >= 0 ? 'income' : 'expense'}">${formatCurrencyFull(monthStats.balance)}</div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">
      <button class="quick-btn income" onclick="showAddTxModal('income')">
        <span class="qb-icon">➕</span>
        <span class="qb-label">Entrata</span>
      </button>
      <button class="quick-btn expense" onclick="showAddTxModal('expense')">
        <span class="qb-icon">➖</span>
        <span class="qb-label">Uscita</span>
      </button>
      <button class="quick-btn primary" onclick="navigate('report')">
        <span class="qb-icon">📊</span>
        <span class="qb-label">Report</span>
      </button>
      <button class="quick-btn primary" onclick="navigate('obiettivi')">
        <span class="qb-icon">🎯</span>
        <span class="qb-label">Obiettivi</span>
      </button>
    </div>

    <!-- MINI CHART -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Ultimi 6 mesi</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:120px;padding:8px 0;">
        ${months.map(m => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;">
              <div style="background:rgba(0,229,160,0.6);border-radius:4px 4px 0 0;height:${Math.round((m.income/maxVal)*90)}px;min-height:2px;transition:height 0.5s;"></div>
              <div style="background:rgba(255,79,109,0.6);border-radius:4px 4px 0 0;height:${Math.round((m.expense/maxVal)*90)}px;min-height:2px;transition:height 0.5s;"></div>
            </div>
            <div style="font-size:9px;color:#4a5580;">${m.label}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:4px;">
        <span style="font-size:11px;color:#8892b0;display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(0,229,160,0.6);display:inline-block;"></span>Entrate</span>
        <span style="font-size:11px;color:#8892b0;display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:rgba(255,79,109,0.6);display:inline-block;"></span>Uscite</span>
      </div>
    </div>

    <!-- RECENT TRANSACTIONS -->
    <div class="section-header">
      <h2 class="section-title">Transazioni Recenti</h2>
      <span class="section-action" onclick="navigate('transazioni')">Vedi tutte</span>
    </div>
  `;

  if (recent.length === 0) {
    html += `<div class="empty-state" style="padding:24px;">
      <div class="empty-icon" style="font-size:36px;">💸</div>
      <div class="empty-title">Nessuna transazione</div>
      <div class="empty-text">Aggiungi la tua prima transazione</div>
    </div>`;
  } else {
    html += '<div class="tx-list">';
    recent.forEach(tx => { html += renderTxItem(tx); });
    html += '</div>';
  }

  // Goals summary
  if (goals.length > 0) {
    html += `<div class="section-header" style="margin-top:16px;">
      <h2 class="section-title">Obiettivi</h2>
      <span class="section-action" onclick="navigate('obiettivi')">Vedi tutti</span>
    </div>`;
    goals.slice(0, 2).forEach(goal => {
      const p = pct(goal.currentAmount || 0, goal.targetAmount);
      html += `<div class="goal-card">
        <div class="goal-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="goal-emoji">${goal.emoji || '🎯'}</span>
            <span class="goal-name">${escapeHtml(goal.name)}</span>
          </div>
          <span style="font-size:13px;color:#6c63ff;font-weight:700;">${p}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${p >= 100 ? 'success' : ''}" style="width:${p}%"></div>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;
}

function renderTxItem(tx) {
  const catInfo = getCategoryInfo(tx.category);
  return `<div class="tx-item" onclick="showTxDetail('${tx.id}')">
    <div class="tx-icon ${tx.type}">${catInfo.icon}</div>
    <div class="tx-info">
      <div class="tx-desc">${escapeHtml(tx.description || catInfo.label)}</div>
      <div class="tx-cat">${catInfo.label}</div>
    </div>
    <div class="tx-right">
      <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</div>
      <div class="tx-date">${formatDateShort(tx.date)}</div>
    </div>
  </div>`;
}

function renderTransactions() {
  const content = document.getElementById('content');
  loadTransactions();

  let filterMonth = new Date().toISOString().substring(0, 7);

  let html = `
    <div class="section-header">
      <h2 class="section-title">💸 Transazioni</h2>
      <button class="btn btn-primary btn-sm" onclick="showAddTxModal('expense')">+ Aggiungi</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;">
      <button class="btn btn-secondary btn-sm" onclick="showAddTxModal('income')" style="white-space:nowrap;">+ Entrata</button>
      <button class="btn btn-danger btn-sm" onclick="showAddTxModal('expense')" style="white-space:nowrap;">+ Uscita</button>
    </div>
    <div class="form-group" style="margin-bottom:16px;">
      <input type="month" id="txFilterMonth" value="${filterMonth}" onchange="filterTransactions(this.value)" style="width:100%;">
    </div>
    <div id="txListContainer">
  `;

  const filtered = transactions.filter(t => t.date && t.date.startsWith(filterMonth));
  const monthStats = getMonthlyStats(filterMonth);

  html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
    <div class="stat-card">
      <div class="stat-label">Entrate</div>
      <div class="stat-value" style="color:#00e5a0;font-size:16px;">+${formatCurrency(monthStats.income)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Uscite</div>
      <div class="stat-value" style="color:#ff4f6d;font-size:16px;">-${formatCurrency(monthStats.expense)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Saldo</div>
      <div class="stat-value" style="color:${monthStats.balance >= 0 ? '#00e5a0' : '#ff4f6d'};font-size:16px;">${formatCurrencyFull(monthStats.balance)}</div>
    </div>
  </div>`;

  if (filtered.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">Nessuna transazione</div><div class="empty-text">per questo periodo</div></div>`;
  } else {
    html += '<div class="tx-list">';
    filtered.forEach(tx => { html += renderTxItem(tx); });
    html += '</div>';
  }

  html += '</div></div>';
  content.innerHTML = html;
}

function filterTransactions(month) {
  const container = document.getElementById('txListContainer');
  if (!container) return;

  loadTransactions();
  const filtered = transactions.filter(t => t.date && t.date.startsWith(month));
  const monthStats = getMonthlyStats(month);

  let html = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
    <div class="stat-card"><div class="stat-label">Entrate</div><div class="stat-value" style="color:#00e5a0;font-size:16px;">+${formatCurrency(monthStats.income)}</div></div>
    <div class="stat-card"><div class="stat-label">Uscite</div><div class="stat-value" style="color:#ff4f6d;font-size:16px;">-${formatCurrency(monthStats.expense)}</div></div>
    <div class="stat-card"><div class="stat-label">Saldo</div><div class="stat-value" style="color:${monthStats.balance >= 0 ? '#00e5a0' : '#ff4f6d'};font-size:16px;">${formatCurrencyFull(monthStats.balance)}</div></div>
  </div>`;

  if (filtered.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">💸</div><div class="empty-title">Nessuna transazione</div></div>`;
  } else {
    html += '<div class="tx-list">';
    filtered.forEach(tx => { html += renderTxItem(tx); });
    html += '</div>';
  }

  container.innerHTML = html;
}

function showTxDetail(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  const catInfo = getCategoryInfo(tx.category);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:48px;margin-bottom:8px;">${catInfo.icon}</div>
        <div style="font-size:24px;font-weight:800;color:${tx.type === 'income' ? '#00e5a0' : '#ff4f6d'};">
          ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
        </div>
        <div style="font-size:16px;font-weight:600;margin-top:8px;">${escapeHtml(tx.description || catInfo.label)}</div>
        <div style="font-size:13px;color:#8892b0;margin-top:4px;">${catInfo.label} · ${formatDate(tx.date)}</div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="btn btn-danger" style="flex:1;" onclick="showConfirm('Eliminare questa transazione?', () => { deleteTransaction('${id}'); document.querySelector('.modal-overlay').remove(); renderTransactions(); })">🗑️ Elimina</button>
        <button class="btn btn-secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Chiudi</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showAddTxModal(defaultType = 'expense') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const incomeCategories = CATEGORIES.income.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
  const expenseCategories = CATEGORIES.expense.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');

  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Nuova Transazione</div>
      <div class="type-selector">
        <button class="type-btn income ${defaultType === 'income' ? 'active' : ''}" onclick="selectTxType('income')">➕ Entrata</button>
        <button class="type-btn expense ${defaultType === 'expense' ? 'active' : ''}" onclick="selectTxType('expense')">➖ Uscita</button>
      </div>
      <input type="hidden" id="txType" value="${defaultType}">
      <div class="form-group">
        <label>Importo (€)</label>
        <input type="number" id="txAmount" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
      </div>
      <div class="form-group">
        <label>Categoria</label>
        <select id="txCategory">
          ${defaultType === 'income' ? incomeCategories : expenseCategories}
        </select>
      </div>
      <div class="form-group">
        <label>Descrizione (opzionale)</label>
        <input type="text" id="txDesc" placeholder="es. Spesa al supermercato">
      </div>
      <div class="form-group">
        <label>Data</label>
        <input type="date" id="txDate" value="${todayStr()}">
      </div>
      <button class="btn btn-primary" onclick="submitTransaction()">Aggiungi</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Store categories for dynamic update
  overlay._incomeCategories = incomeCategories;
  overlay._expenseCategories = expenseCategories;
}

function selectTxType(type) {
  document.getElementById('txType').value = type;
  document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.type-btn.' + type)?.classList.add('active');

  const catSelect = document.getElementById('txCategory');
  const overlay = document.querySelector('.modal-overlay');
  if (catSelect) {
    catSelect.innerHTML = type === 'income'
      ? CATEGORIES.income.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')
      : CATEGORIES.expense.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
  }
}

function submitTransaction() {
  const type = document.getElementById('txType').value;
  const amount = document.getElementById('txAmount').value;
  const category = document.getElementById('txCategory').value;
  const desc = document.getElementById('txDesc').value;
  const date = document.getElementById('txDate').value;

  if (!amount || parseFloat(amount) <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }

  addTransaction(type, amount, category, desc, date);
  document.querySelector('.modal-overlay')?.remove();

  // Refresh current view
  if (currentView === 'dashboard') renderDashboard();
  else if (currentView === 'transazioni') renderTransactions();
}

console.log('✅ transactions.js loaded');
