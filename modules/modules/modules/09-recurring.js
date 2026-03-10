// 09-RECURRING.JS - Spese ricorrenti

function loadRecurring() {
  recurringItems = lsGet('fp_recurring_' + (user ? user.id : 'local'), []);
}

function saveRecurring() {
  lsSet('fp_recurring_' + (user ? user.id : 'local'), recurringItems);
  queueSync('recurring');
}

function addRecurring(name, amount, type, frequency, category, icon, nextDate) {
  const item = {
    id: generateId(),
    name: name,
    amount: parseFloat(amount),
    type: type, // 'income' | 'expense'
    frequency: frequency, // 'monthly' | 'weekly' | 'yearly' | 'quarterly'
    category: category,
    icon: icon || '🔄',
    nextDate: nextDate || todayStr(),
    active: true,
    createdAt: new Date().toISOString()
  };
  recurringItems.push(item);
  saveRecurring();
  showNotification('✅ Voce ricorrente aggiunta!', 'success');
  return item;
}

function deleteRecurring(id) {
  recurringItems = recurringItems.filter(r => r.id !== id);
  saveRecurring();
  showNotification('🗑️ Voce eliminata', 'info');
}

function toggleRecurring(id) {
  const item = recurringItems.find(r => r.id === id);
  if (item) {
    item.active = !item.active;
    saveRecurring();
  }
}

function getFrequencyLabel(freq) {
  const labels = { monthly: 'Mensile', weekly: 'Settimanale', yearly: 'Annuale', quarterly: 'Trimestrale', biweekly: 'Bisettimanale' };
  return labels[freq] || freq;
}

function renderRecurring() {
  const content = document.getElementById('content');
  loadRecurring();

  const totalMonthly = recurringItems
    .filter(r => r.active)
    .reduce((sum, r) => {
      const multipliers = { monthly: 1, weekly: 4.33, biweekly: 2.17, quarterly: 1/3, yearly: 1/12 };
      const m = multipliers[r.frequency] || 1;
      return r.type === 'expense' ? sum + (r.amount * m) : sum - (r.amount * m);
    }, 0);

  let html = `
    <div class="section-header">
      <h2 class="section-title">🔄 Ricorrenti</h2>
      <span class="section-action" onclick="showAddRecurringModal()">+ Aggiungi</span>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">Costo mensile netto</div>
      <div class="card-value ${totalMonthly >= 0 ? 'negative' : 'positive'}" style="margin-top:8px;">${formatCurrencyFull(-totalMonthly)}</div>
    </div>
  `;

  if (recurringItems.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">🔄</div>
      <div class="empty-title">Nessuna voce ricorrente</div>
      <div class="empty-text">Aggiungi abbonamenti, stipendi e spese fisse</div>
    </div>`;
  } else {
    // Group by type
    const incomes = recurringItems.filter(r => r.type === 'income');
    const expenses = recurringItems.filter(r => r.type === 'expense');

    if (incomes.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;color:#8892b0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Entrate fisse</div>`;
      incomes.forEach(r => { html += renderRecurringItem(r); });
    }
    if (expenses.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;color:#8892b0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;margin-top:16px;">Uscite fisse</div>`;
      expenses.forEach(r => { html += renderRecurringItem(r); });
    }
  }

  content.innerHTML = html;
}

function renderRecurringItem(r) {
  return `<div class="recurring-item ${!r.active ? 'opacity-50' : ''}" style="opacity:${r.active ? 1 : 0.5};">
    <span class="recurring-icon">${r.icon || getCategoryIcon(r.category)}</span>
    <div class="recurring-info">
      <div class="recurring-name">${escapeHtml(r.name)}</div>
      <div class="recurring-freq">${getFrequencyLabel(r.frequency)}${r.nextDate ? ' · prossimo ' + formatDateShort(r.nextDate) : ''}</div>
    </div>
    <div>
      <div class="recurring-amount ${r.type}">${r.type === 'income' ? '+' : '-'}${formatCurrency(r.amount)}</div>
      <div style="display:flex;gap:6px;margin-top:6px;justify-content:flex-end;">
        <button class="btn btn-sm btn-secondary btn-icon" onclick="toggleRecurring('${r.id}');renderRecurring();" title="${r.active ? 'Disattiva' : 'Attiva'}">${r.active ? '⏸' : '▶'}</button>
        <button class="btn btn-sm btn-danger btn-icon" onclick="showConfirm('Eliminare?', () => { deleteRecurring('${r.id}'); renderRecurring(); })">🗑</button>
      </div>
    </div>
  </div>`;
}

function showAddRecurringModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">🔄 Nuova Voce Ricorrente</div>
      <div class="type-selector">
        <button class="type-btn expense active" onclick="selectRecType('expense', this)">➖ Uscita</button>
        <button class="type-btn income" onclick="selectRecType('income', this)">➕ Entrata</button>
      </div>
      <input type="hidden" id="recType" value="expense">
      <div class="form-group"><label>Nome</label><input type="text" id="recName" placeholder="es. Netflix, Affitto"></div>
      <div class="form-group"><label>Importo (€)</label><input type="number" id="recAmount" placeholder="0.00" step="0.01" min="0"></div>
      <div class="form-group">
        <label>Frequenza</label>
        <select id="recFreq">
          <option value="monthly">Mensile</option>
          <option value="weekly">Settimanale</option>
          <option value="biweekly">Bisettimanale</option>
          <option value="quarterly">Trimestrale</option>
          <option value="yearly">Annuale</option>
        </select>
      </div>
      <div class="form-group"><label>Emoji/Icona</label><input type="text" id="recIcon" placeholder="🔄" maxlength="2" value="🔄"></div>
      <div class="form-group"><label>Prossima scadenza</label><input type="date" id="recNextDate" value="${todayStr()}"></div>
      <button class="btn btn-primary" onclick="submitRecurring()">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function selectRecType(type, btn) {
  document.getElementById('recType').value = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function submitRecurring() {
  const name = document.getElementById('recName').value.trim();
  const amount = document.getElementById('recAmount').value;
  const type = document.getElementById('recType').value;
  const freq = document.getElementById('recFreq').value;
  const icon = document.getElementById('recIcon').value.trim() || '🔄';
  const nextDate = document.getElementById('recNextDate').value;

  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  if (!amount || parseFloat(amount) <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }

  addRecurring(name, amount, type, freq, type === 'income' ? 'stipendio' : 'abbonamenti', icon, nextDate);
  document.querySelector('.modal-overlay')?.remove();
  renderRecurring();
}

console.log('✅ recurring.js loaded');
