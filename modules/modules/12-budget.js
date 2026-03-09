// 12-BUDGET.JS - Budget per categoria

function loadBudgets() {
  budgets = lsGet('fp_budgets_' + (user ? user.id : 'local'), {});
}

function saveBudgets() {
  lsSet('fp_budgets_' + (user ? user.id : 'local'), budgets);
}

function setBudget(categoryId, amount) {
  budgets[categoryId] = parseFloat(amount);
  saveBudgets();
}

function getBudgetUsage(categoryId, monthKey) {
  const month = monthKey || new Date().toISOString().substring(0, 7);
  const spent = transactions
    .filter(t => t.type === 'expense' && t.category === categoryId && t.date && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);
  const budget = budgets[categoryId] || 0;
  return { spent, budget, remaining: budget - spent, pct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0 };
}

function renderBudgets() {
  // Budget view is shown within reports, but accessible from profile/settings too
  const content = document.getElementById('content');
  loadBudgets();
  loadTransactions();
  const thisMonth = new Date().toISOString().substring(0, 7);

  const categoriesWithExpenses = CATEGORIES.expense;

  let html = `
    <div class="section-header">
      <h2 class="section-title">💰 Budget</h2>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div style="font-size:13px;color:#8892b0;margin-bottom:4px;">Imposta un budget mensile per categoria</div>
    </div>
  `;

  categoriesWithExpenses.forEach(cat => {
    const usage = getBudgetUsage(cat.id, thisMonth);
    const hasBudget = budgets[cat.id] > 0;
    const progressClass = usage.pct >= 90 ? 'danger' : usage.pct >= 70 ? '' : 'success';

    html += `<div class="card" style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${hasBudget ? '10px' : '0'};">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">${cat.icon}</span>
          <span style="font-size:14px;font-weight:600;">${cat.label}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${hasBudget ? `<span style="font-size:12px;color:${usage.pct >= 90 ? '#ff4f6d' : '#8892b0'};">${formatCurrency(usage.spent)} / ${formatCurrency(usage.budget)}</span>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="showSetBudgetModal('${cat.id}', '${escapeHtml(cat.label)}', ${budgets[cat.id] || 0})">
            ${hasBudget ? '✏️' : '+ Budget'}
          </button>
        </div>
      </div>
      ${hasBudget ? `
        <div class="progress-bar">
          <div class="progress-fill ${progressClass}" style="width:${usage.pct}%"></div>
        </div>
        <div style="font-size:11px;color:#4a5580;margin-top:4px;text-align:right;">
          ${usage.remaining >= 0 ? formatCurrency(usage.remaining) + ' rimanenti' : formatCurrency(Math.abs(usage.remaining)) + ' sforato'}
        </div>
      ` : ''}
    </div>`;
  });

  content.innerHTML = html;
}

function showSetBudgetModal(catId, catLabel, currentAmount) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">💰 Budget — ${catLabel}</div>
      <div class="form-group">
        <label>Budget mensile (€)</label>
        <input type="number" id="budgetAmount" placeholder="0.00" step="0.01" min="0" value="${currentAmount || ''}">
      </div>
      <div style="display:flex;gap:12px;">
        ${currentAmount > 0 ? `<button class="btn btn-danger" style="flex:1;" onclick="removeBudget('${catId}')">Rimuovi</button>` : ''}
        <button class="btn btn-primary" style="flex:1;" onclick="submitBudget('${catId}')">Salva</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitBudget(catId) {
  const amount = document.getElementById('budgetAmount').value;
  if (!amount || parseFloat(amount) <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }
  setBudget(catId, amount);
  showNotification('✅ Budget impostato!', 'success');
  document.querySelector('.modal-overlay')?.remove();
  renderBudgets();
}

function removeBudget(catId) {
  delete budgets[catId];
  saveBudgets();
  showNotification('✅ Budget rimosso', 'info');
  document.querySelector('.modal-overlay')?.remove();
  renderBudgets();
}

console.log('✅ budget.js loaded');
