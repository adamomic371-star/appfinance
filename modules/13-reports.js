// 13-REPORTS.JS - Report mensili e annuali

function renderReports() {
  const content = document.getElementById('content');
  loadTransactions();
  loadBudgets();

  const now = new Date();
  const thisMonth = now.toISOString().substring(0, 7);
  const monthStats = getMonthlyStats(thisMonth);

  // Category breakdown for this month
  const expensesByCategory = {};
  transactions
    .filter(t => t.type === 'expense' && t.date && t.date.startsWith(thisMonth))
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const sortedCats = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
  const totalExpenses = monthStats.expense;

  // Yearly data
  const yearlyMonths = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    const stats = getMonthlyStats(key);
    yearlyMonths.push({ key, label: getMonthName(d.getMonth()), ...stats });
  }

  const yearIncome = yearlyMonths.reduce((s, m) => s + m.income, 0);
  const yearExpense = yearlyMonths.reduce((s, m) => s + m.expense, 0);
  const maxMonthVal = Math.max(...yearlyMonths.map(m => Math.max(m.income, m.expense)), 1);

  const currentMonthName = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  let html = `
    <div class="section-header">
      <h2 class="section-title">📊 Report</h2>
    </div>

    <!-- MONTH TABS -->
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;scrollbar-width:none;">
      <button class="btn btn-primary btn-sm" style="white-space:nowrap;" onclick="showMonthReport('${thisMonth}', this)">Questo mese</button>
      <button class="btn btn-secondary btn-sm" style="white-space:nowrap;" onclick="showAnnualReport()">Anno ${now.getFullYear()}</button>
      <button class="btn btn-secondary btn-sm" style="white-space:nowrap;" onclick="navigate('budgets')">Budget</button>
    </div>

    <!-- THIS MONTH STATS -->
    <div style="font-size:14px;font-weight:600;color:#8892b0;margin-bottom:12px;text-transform:capitalize;">${currentMonthName}</div>
    <div class="report-stat-grid">
      <div class="stat-card">
        <div class="stat-label">Entrate</div>
        <div class="stat-value" style="color:#00e5a0;">+${formatCurrency(monthStats.income)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uscite</div>
        <div class="stat-value" style="color:#ff4f6d;">-${formatCurrency(monthStats.expense)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo</div>
        <div class="stat-value" style="color:${monthStats.balance >= 0 ? '#00e5a0' : '#ff4f6d'};">${formatCurrencyFull(monthStats.balance)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Transazioni</div>
        <div class="stat-value">${monthStats.count}</div>
      </div>
    </div>

    <!-- CHART -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Ultimi 12 mesi</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:100px;overflow:hidden;">
        ${yearlyMonths.map(m => {
          const iH = Math.round((m.income / maxMonthVal) * 90);
          const eH = Math.round((m.expense / maxMonthVal) * 90);
          const isCurrentMonth = m.key === thisMonth;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;" title="${m.label}: +${formatCurrency(m.income)} / -${formatCurrency(m.expense)}">
            <div style="flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;">
              <div style="background:${isCurrentMonth ? '#00e5a0' : 'rgba(0,229,160,0.4)'};border-radius:3px 3px 0 0;height:${iH}px;min-height:${m.income > 0 ? 2 : 0}px;"></div>
              <div style="background:${isCurrentMonth ? '#ff4f6d' : 'rgba(255,79,109,0.4)'};border-radius:3px 3px 0 0;height:${eH}px;min-height:${m.expense > 0 ? 2 : 0}px;"></div>
            </div>
            <div style="font-size:8px;color:#4a5580;">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">
        <span style="font-size:11px;color:#8892b0;display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:#00e5a0;display:inline-block;"></span>Entrate</span>
        <span style="font-size:11px;color:#8892b0;display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:#ff4f6d;display:inline-block;"></span>Uscite</span>
      </div>
    </div>

    <!-- CATEGORY BREAKDOWN -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Uscite per categoria</span>
      </div>
      ${sortedCats.length === 0
        ? '<div class="empty-state" style="padding:16px;"><div class="empty-text">Nessuna uscita questo mese</div></div>'
        : sortedCats.map(([catId, amount]) => {
            const catInfo = getCategoryInfo(catId);
            const p = pct(amount, totalExpenses);
            const budget = budgets[catId];
            const budgetPct = budget ? pct(amount, budget) : null;
            return `<div class="cat-item">
              <span style="font-size:20px;">${catInfo.icon}</span>
              <div class="cat-bar-wrap">
                <div class="cat-bar-label">
                  <span class="cat-bar-name">${catInfo.label}</span>
                  <span class="cat-bar-value">${formatCurrency(amount)}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${budgetPct !== null && budgetPct >= 90 ? 'danger' : ''}" style="width:${p}%"></div>
                </div>
                ${budget ? `<div style="font-size:10px;color:${budgetPct >= 90 ? '#ff4f6d' : '#4a5580'};margin-top:2px;">${budgetPct}% del budget ${formatCurrency(budget)}</div>` : ''}
              </div>
              <span style="font-size:12px;color:#4a5580;">${p}%</span>
            </div>`;
          }).join('')
      }
    </div>

    <!-- YEARLY SUMMARY -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Anno ${now.getFullYear()}</span>
      </div>
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div>
          <div style="font-size:10px;color:#4a5580;text-transform:uppercase;margin-bottom:4px;">Entrate</div>
          <div style="font-size:20px;font-weight:700;color:#00e5a0;">+${formatCurrency(yearIncome)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#4a5580;text-transform:uppercase;margin-bottom:4px;">Uscite</div>
          <div style="font-size:20px;font-weight:700;color:#ff4f6d;">-${formatCurrency(yearExpense)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#4a5580;text-transform:uppercase;margin-bottom:4px;">Saldo</div>
          <div style="font-size:20px;font-weight:700;color:${yearIncome - yearExpense >= 0 ? '#00e5a0' : '#ff4f6d'};">${formatCurrencyFull(yearIncome - yearExpense)}</div>
        </div>
      </div>
    </div>
  `;

  content.innerHTML = html;
}

function showMonthReport(month, btn) {
  // Already showing current month
}

function showAnnualReport() {
  // Show annual summary (already in reports)
}

// Render bills view
function renderBollette() {
  const content = document.getElementById('content');
  bills = lsGet('fp_bills_' + (user ? user.id : 'local'), []);

  let html = `
    <div class="section-header">
      <h2 class="section-title">⚡ Bollette</h2>
      <span class="section-action" onclick="showAddBillModal()">+ Aggiungi</span>
    </div>
  `;

  if (bills.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-title">Nessuna bolletta</div>
      <div class="empty-text">Aggiungi le tue bollette per tenerle sotto controllo</div>
    </div>`;
  } else {
    bills.forEach(bill => {
      const dueDate = new Date(bill.dueDate);
      const isOverdue = dueDate < new Date();
      const isPaid = bill.paid;
      html += `<div class="recurring-item">
        <span class="recurring-icon">${bill.icon || '⚡'}</span>
        <div class="recurring-info">
          <div class="recurring-name">${escapeHtml(bill.name)}</div>
          <div class="recurring-freq">Scadenza: ${formatDate(bill.dueDate)} ${isOverdue && !isPaid ? '⚠️ SCADUTA' : ''}</div>
        </div>
        <div>
          <div class="recurring-amount expense">${formatCurrency(bill.amount)}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            ${!isPaid ? `<button class="btn btn-success btn-sm" onclick="markBillPaid('${bill.id}')">✓ Pagata</button>` : '<span class="chip chip-info" style="font-size:10px;">✓ Pagata</span>'}
            <button class="btn btn-danger btn-sm btn-icon" onclick="showConfirm('Eliminare?', () => { deleteBill('${bill.id}'); renderBollette(); })">🗑</button>
          </div>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;
}

function showAddBillModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">⚡ Nuova Bolletta</div>
      <div class="form-group"><label>Nome</label><input type="text" id="billName" placeholder="es. Luce, Gas, Internet"></div>
      <div class="form-group"><label>Importo (€)</label><input type="number" id="billAmount" placeholder="0.00" step="0.01" min="0"></div>
      <div class="form-group"><label>Scadenza</label><input type="date" id="billDue" value="${todayStr()}"></div>
      <div class="form-group"><label>Emoji</label><input type="text" id="billIcon" placeholder="⚡" maxlength="2" value="⚡"></div>
      <button class="btn btn-primary" onclick="submitBill()">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitBill() {
  const name = document.getElementById('billName').value.trim();
  const amount = document.getElementById('billAmount').value;
  const dueDate = document.getElementById('billDue').value;
  const icon = document.getElementById('billIcon').value.trim() || '⚡';

  if (!name || !amount) { showNotification('⚠️ Compila tutti i campi', 'error'); return; }

  bills.push({ id: generateId(), name, amount: parseFloat(amount), dueDate, icon, paid: false, createdAt: new Date().toISOString() });
  lsSet('fp_bills_' + user.id, bills);
  document.querySelector('.modal-overlay')?.remove();
  renderBollette();
  showNotification('✅ Bolletta aggiunta!', 'success');
}

function markBillPaid(id) {
  const bill = bills.find(b => b.id === id);
  if (bill) {
    bill.paid = true;
    lsSet('fp_bills_' + user.id, bills);
    renderBollette();
    showNotification('✅ Bolletta segnata come pagata!', 'success');
  }
}

function deleteBill(id) {
  bills = bills.filter(b => b.id !== id);
  lsSet('fp_bills_' + user.id, bills);
}

// Render viaggi view
function renderViaggi() {
  const content = document.getElementById('content');
  trips = lsGet('fp_trips_' + (user ? user.id : 'local'), []);

  let html = `
    <div class="section-header">
      <h2 class="section-title">✈️ Viaggi</h2>
      <span class="section-action" onclick="showAddTripModal()">+ Aggiungi</span>
    </div>
  `;

  if (trips.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">✈️</div>
      <div class="empty-title">Nessun viaggio</div>
      <div class="empty-text">Tieni traccia delle tue spese di viaggio</div>
    </div>`;
  } else {
    trips.forEach(trip => {
      const totalSpent = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
      html += `<div class="card" onclick="showTripDetail('${trip.id}')" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:32px;">${trip.emoji || '✈️'}</span>
          <div style="flex:1;">
            <div style="font-size:16px;font-weight:700;">${escapeHtml(trip.name)}</div>
            <div style="font-size:12px;color:#8892b0;">${formatDate(trip.startDate)} ${trip.endDate ? '→ ' + formatDate(trip.endDate) : ''}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:700;color:#ff4f6d;">-${formatCurrency(totalSpent)}</div>
            ${trip.budget ? `<div style="font-size:11px;color:#4a5580;">${formatCurrency(trip.budget)} budget</div>` : ''}
          </div>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;
}

function showAddTripModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">✈️ Nuovo Viaggio</div>
      <div class="form-group"><label>Destinazione</label><input type="text" id="tripName" placeholder="es. Roma, Parigi, New York"></div>
      <div class="form-group"><label>Emoji</label><input type="text" id="tripEmoji" placeholder="✈️" maxlength="2" value="✈️"></div>
      <div class="form-row">
        <div class="form-group"><label>Inizio</label><input type="date" id="tripStart" value="${todayStr()}"></div>
        <div class="form-group"><label>Fine</label><input type="date" id="tripEnd"></div>
      </div>
      <div class="form-group"><label>Budget (€)</label><input type="number" id="tripBudget" placeholder="Opzionale" step="0.01" min="0"></div>
      <button class="btn btn-primary" onclick="submitTrip()">Crea Viaggio</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitTrip() {
  const name = document.getElementById('tripName').value.trim();
  const emoji = document.getElementById('tripEmoji').value.trim() || '✈️';
  const startDate = document.getElementById('tripStart').value;
  const endDate = document.getElementById('tripEnd').value;
  const budget = document.getElementById('tripBudget').value;

  if (!name) { showNotification('⚠️ Inserisci una destinazione', 'error'); return; }

  trips.push({ id: generateId(), name, emoji, startDate, endDate: endDate || null, budget: budget ? parseFloat(budget) : null, expenses: [], createdAt: new Date().toISOString() });
  lsSet('fp_trips_' + user.id, trips);
  document.querySelector('.modal-overlay')?.remove();
  renderViaggi();
  showNotification('✅ Viaggio aggiunto!', 'success');
}

function showTripDetail(tripId) {
  const trip = trips.find(t => t.id === tripId);
  if (!trip) return;

  const totalSpent = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  let expHtml = (trip.expenses || []).map(e => `
    <div class="tx-item">
      <div class="tx-icon expense">💸</div>
      <div class="tx-info"><div class="tx-desc">${escapeHtml(e.description)}</div><div class="tx-cat">${formatDate(e.date)}</div></div>
      <div class="tx-right"><div class="tx-amount expense">-${formatCurrency(e.amount)}</div></div>
    </div>`).join('') || '<div class="empty-state" style="padding:16px;"><div class="empty-text">Nessuna spesa</div></div>';

  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="modal-title" style="margin:0;">${trip.emoji} ${escapeHtml(trip.name)}</div>
        <button class="btn btn-primary btn-sm" onclick="showAddTripExpenseModal('${tripId}')">+ Spesa</button>
      </div>
      <div style="display:flex;justify-content:space-around;text-align:center;margin-bottom:16px;">
        <div><div style="font-size:10px;color:#4a5580;text-transform:uppercase;">Speso</div><div style="font-size:20px;font-weight:700;color:#ff4f6d;">${formatCurrency(totalSpent)}</div></div>
        ${trip.budget ? `<div><div style="font-size:10px;color:#4a5580;text-transform:uppercase;">Budget</div><div style="font-size:20px;font-weight:700;color:#6c63ff;">${formatCurrency(trip.budget)}</div></div>
        <div><div style="font-size:10px;color:#4a5580;text-transform:uppercase;">Rimanente</div><div style="font-size:20px;font-weight:700;color:${trip.budget - totalSpent >= 0 ? '#00e5a0' : '#ff4f6d'};">${formatCurrency(trip.budget - totalSpent)}</div></div>` : ''}
      </div>
      <div class="tx-list">${expHtml}</div>
      <button class="btn btn-secondary" style="width:100%;margin-top:16px;" onclick="this.closest('.modal-overlay').remove()">Chiudi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showAddTripExpenseModal(tripId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">💸 Spesa Viaggio</div>
      <div class="form-group"><label>Descrizione</label><input type="text" id="tripExpDesc" placeholder="es. Hotel, Ristorante"></div>
      <div class="form-group"><label>Importo (€)</label><input type="number" id="tripExpAmount" placeholder="0.00" step="0.01" min="0"></div>
      <div class="form-group"><label>Data</label><input type="date" id="tripExpDate" value="${todayStr()}"></div>
      <button class="btn btn-primary" onclick="submitTripExpense('${tripId}')">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitTripExpense(tripId) {
  const trip = trips.find(t => t.id === tripId);
  if (!trip) return;
  const desc = document.getElementById('tripExpDesc').value.trim();
  const amount = document.getElementById('tripExpAmount').value;
  const date = document.getElementById('tripExpDate').value;
  if (!desc || !amount) { showNotification('⚠️ Compila tutti i campi', 'error'); return; }
  trip.expenses = trip.expenses || [];
  trip.expenses.push({ id: generateId(), description: desc, amount: parseFloat(amount), date });
  lsSet('fp_trips_' + user.id, trips);
  document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  showTripDetail(tripId);
  showNotification('✅ Spesa aggiunta!', 'success');
}

console.log('✅ reports.js loaded');
