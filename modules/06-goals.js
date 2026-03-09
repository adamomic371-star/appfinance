// 06-GOALS.JS - Obiettivi finanziari (CRUD)

function loadGoals() {
  goals = lsGet('fp_goals_' + (user ? user.id : 'local'), []);
}

function saveGoals() {
  lsSet('fp_goals_' + (user ? user.id : 'local'), goals);
  saveToFirebase('goals', goals.reduce((acc, g) => { acc[g.id] = g; return acc; }, {}));
}

function addGoal(name, targetAmount, emoji = '🎯', deadline = null) {
  const goal = {
    id: generateId(),
    name: name,
    emoji: emoji,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    deadline: deadline,
    createdAt: new Date().toISOString()
  };
  goals.push(goal);
  saveGoals();
  showNotification('✅ Obiettivo aggiunto!', 'success');
  return goal;
}

function updateGoalAmount(id, amount) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  goal.currentAmount = Math.max(0, parseFloat(goal.currentAmount || 0) + parseFloat(amount));
  saveGoals();
  showNotification('✅ Obiettivo aggiornato!', 'success');
}

function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  saveGoals();
  showNotification('🗑️ Obiettivo eliminato', 'info');
}

function renderGoals() {
  const content = document.getElementById('content');
  loadGoals();

  let html = `
    <div class="section-header">
      <h2 class="section-title">🎯 Obiettivi</h2>
      <span class="section-action" onclick="showAddGoalModal()">+ Aggiungi</span>
    </div>
  `;

  if (goals.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">🎯</div>
      <div class="empty-title">Nessun obiettivo</div>
      <div class="empty-text">Aggiungi il tuo primo obiettivo finanziario</div>
    </div>`;
  } else {
    goals.forEach(goal => {
      const pctVal = pct(goal.currentAmount || 0, goal.targetAmount);
      const progressClass = pctVal >= 100 ? 'success' : pctVal >= 60 ? '' : 'danger';
      html += `
        <div class="goal-card">
          <div class="goal-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="goal-emoji">${goal.emoji || '🎯'}</span>
              <span class="goal-name">${escapeHtml(goal.name)}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-success" onclick="showAddFundsModal('${goal.id}')">+€</button>
              <button class="btn btn-sm btn-danger" onclick="showConfirm('Eliminare obiettivo?', () => { deleteGoal('${goal.id}'); renderGoals(); })">🗑️</button>
            </div>
          </div>
          <div class="goal-amounts">
            <span class="goal-current">${formatCurrency(goal.currentAmount || 0)}</span>
            <span class="goal-target">su ${formatCurrency(goal.targetAmount)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${progressClass}" style="width:${pctVal}%"></div>
          </div>
          <div class="goal-percent">${pctVal}% completato${goal.deadline ? ' · Scadenza: ' + formatDate(goal.deadline) : ''}</div>
        </div>`;
    });
  }

  content.innerHTML = html;
}

function showAddGoalModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">🎯 Nuovo Obiettivo</div>
      <div class="form-group">
        <label>Nome obiettivo</label>
        <input type="text" id="goalName" placeholder="es. Fondo emergenza">
      </div>
      <div class="form-group">
        <label>Emoji</label>
        <input type="text" id="goalEmoji" placeholder="🎯" maxlength="2" value="🎯">
      </div>
      <div class="form-group">
        <label>Importo target (€)</label>
        <input type="number" id="goalTarget" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label>Scadenza (opzionale)</label>
        <input type="date" id="goalDeadline">
      </div>
      <button class="btn btn-primary" onclick="submitGoal()">Crea Obiettivo</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = document.getElementById('goalTarget').value;
  const emoji = document.getElementById('goalEmoji').value.trim() || '🎯';
  const deadline = document.getElementById('goalDeadline').value;

  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  if (!target || parseFloat(target) <= 0) { showNotification('⚠️ Inserisci un importo valido', 'error'); return; }

  addGoal(name, target, emoji, deadline || null);
  document.querySelector('.modal-overlay')?.remove();
  renderGoals();
}

function showAddFundsModal(goalId) {
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">💰 Aggiungi Fondi — ${escapeHtml(goal.name)}</div>
      <div class="form-group">
        <label>Importo da aggiungere (€)</label>
        <input type="number" id="fundAmount" placeholder="0.00" step="0.01" min="0">
      </div>
      <button class="btn btn-primary" onclick="submitFunds('${goalId}')">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitFunds(goalId) {
  const amount = parseFloat(document.getElementById('fundAmount').value);
  if (!amount || amount <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }
  updateGoalAmount(goalId, amount);
  document.querySelector('.modal-overlay')?.remove();
  renderGoals();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

console.log('✅ goals.js loaded');
