// 06-GOALS.JS - Obiettivi finanziari — v4 (scadenza + rata mensile + approvazione)

function loadGoals() {
  goals = lsGet('fp_goals_' + (user ? user.id : 'local'), []);
}

function saveGoals() {
  lsSet('fp_goals_' + (user ? user.id : 'local'), goals);
  saveToFirebase('goals', goals.reduce((acc, g) => { acc[g.id] = g; return acc; }, {}));
}

/* calcola rata mensile e mesi residui */
function calcGoalInstallment(goal) {
  var remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
  if (!goal.targetDate || remaining <= 0) return { installment: 0, monthsLeft: 0 };
  var now = new Date();
  var target = new Date(goal.targetDate);
  var months = Math.max(1,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  );
  return { installment: remaining / months, monthsLeft: months };
}

function addGoal(name, targetAmount, emoji, targetDate, payDay) {
  emoji = emoji || '🎯';
  targetDate = targetDate || null;
  payDay = parseInt(payDay) || 15;
  var goal = {
    id: generateId(),
    name: name,
    emoji: emoji,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    targetDate: targetDate,
    payDay: payDay,
    pendingInstallment: null,
    createdAt: new Date().toISOString()
  };
  goals.push(goal);
  saveGoals();
  showNotification('✅ Obiettivo aggiunto!', 'success');
  return goal;
}

function updateGoalAmount(id, amount) {
  var goal = goals.find(function(g) { return g.id === id; });
  if (!goal) return;
  goal.currentAmount = Math.max(0, parseFloat(goal.currentAmount || 0) + parseFloat(amount));
  saveGoals();
  showNotification('✅ Obiettivo aggiornato!', 'success');
}

function deleteGoal(id) {
  goals = goals.filter(function(g) { return g.id !== id; });
  saveGoals();
  showNotification('🗑️ Obiettivo eliminato', 'info');
}

/* Approva versamento mensile */
function approveGoalInstallment(goalId, customAmount) {
  var goal = goals.find(function(g) { return g.id === goalId; });
  if (!goal) return;
  var calc = calcGoalInstallment(goal);
  var amount = (customAmount && parseFloat(customAmount) > 0)
    ? parseFloat(customAmount)
    : calc.installment;

  if (amount <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }

  addTransaction('expense', amount, 'altro', 'Versamento obiettivo: ' + goal.name, todayStr());
  goal.currentAmount = Math.max(0, (goal.currentAmount || 0) + amount);
  goal.pendingInstallment = null;
  saveGoals();
  showNotification('✅ Versamento approvato e scalato dal saldo!', 'success');
  document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
  renderGoals();
}

/* Salta versamento: slitta targetDate +1 mese */
function skipGoalInstallment(goalId) {
  var goal = goals.find(function(g) { return g.id === goalId; });
  if (!goal) return;
  if (goal.targetDate) {
    var d = new Date(goal.targetDate);
    d.setMonth(d.getMonth() + 1);
    goal.targetDate = d.toISOString().split('T')[0];
  }
  goal.pendingInstallment = null;
  saveGoals();
  showNotification('📅 Scadenza slittata di un mese', 'info');
  document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
  renderGoals();
}

/* Modal approvazione versamento mensile */
function showInstallmentApprovalModal(goalId) {
  var goal = goals.find(function(g) { return g.id === goalId; });
  if (!goal) return;
  var calc = calcGoalInstallment(goal);
  var installment = calc.installment;
  var monthsLeft = calc.monthsLeft;
  var remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-sheet">' +
    '<div class="modal-handle"></div>' +
    '<div class="modal-title">💰 Versamento mensile</div>' +
    '<div style="background:rgba(108,99,255,0.08);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:14px;margin-bottom:18px;">' +
      '<div style="font-size:13px;color:var(--tx2);margin-bottom:4px;">' + escapeHtml(goal.emoji) + ' ' + escapeHtml(goal.name) + '</div>' +
      '<div style="font-size:12px;color:var(--tx3);">Rimanente: <strong style="color:var(--tx);">' + formatCurrency(remaining) + '</strong> · ' + monthsLeft + ' ' + (monthsLeft === 1 ? 'mese' : 'mesi') + ' rimasti</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Tipo versamento</label>' +
      '<div class="type-selector" style="margin-bottom:0;">' +
        '<button class="type-btn income active" id="payTypeFixed" onclick="selectPayType(\'fixed\',' + installment.toFixed(2) + ')">Rata fissa<br><small>' + formatCurrency(installment) + '</small></button>' +
        '<button class="type-btn expense" id="payTypeCustom" onclick="selectPayType(\'custom\',0)">Importo libero</button>' +
      '</div>' +
    '</div>' +
    '<div class="form-group" id="customAmountGroup" style="display:none;">' +
      '<label>Importo personalizzato (€)</label>' +
      '<input type="number" id="customPayAmount" placeholder="0.00" step="0.01" min="0" inputmode="decimal">' +
      '<div style="font-size:11px;color:var(--tx3);margin-top:4px;">Inserendo un importo maggiore la rata verrà ricalcolata</div>' +
    '</div>' +
    '<input type="hidden" id="payType" value="fixed">' +
    '<input type="hidden" id="fixedInstallment" value="' + installment.toFixed(2) + '">' +
    '<div style="display:flex;gap:10px;margin-top:8px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="confirmInstallmentApproval(\'' + goalId + '\')">✅ Approva e scala</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="skipGoalInstallment(\'' + goalId + '\')">📅 Salta (+1 mese)</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function selectPayType(type, amount) {
  document.getElementById('payType').value = type;
  var fb = document.getElementById('payTypeFixed');
  var cb = document.getElementById('payTypeCustom');
  if (fb) { fb.classList.toggle('active', type === 'fixed'); }
  if (cb) { cb.classList.toggle('active', type === 'custom'); }
  var cg = document.getElementById('customAmountGroup');
  if (cg) cg.style.display = type === 'custom' ? 'block' : 'none';
}

function confirmInstallmentApproval(goalId) {
  var type = document.getElementById('payType') ? document.getElementById('payType').value : 'fixed';
  var amount = null;
  if (type === 'custom') {
    amount = parseFloat((document.getElementById('customPayAmount') || {}).value || 0);
    if (!amount || amount <= 0) { showNotification('⚠️ Inserisci un importo valido', 'error'); return; }
  }
  approveGoalInstallment(goalId, amount);
}

/* Prompt entrata: chiedi se destinare quota agli obiettivi */
function showGoalAllocationModal(txAmount, onComplete) {
  loadGoals();
  var activeGoals = goals.filter(function(g) { return (g.currentAmount || 0) < g.targetAmount; });
  if (activeGoals.length === 0) { onComplete && onComplete(); return; }

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  var goalsHtml = activeGoals.map(function(g) {
    var calc = calcGoalInstallment(g);
    return '<label style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1px solid var(--border2);margin-bottom:8px;cursor:pointer;background:rgba(108,99,255,0.04);">' +
      '<input type="checkbox" class="goal-alloc-cb" data-id="' + g.id + '" data-installment="' + calc.installment.toFixed(2) + '" style="accent-color:var(--ac);">' +
      '<div style="flex:1;">' +
        '<div style="font-weight:600;font-size:13px;">' + escapeHtml(g.emoji) + ' ' + escapeHtml(g.name) + '</div>' +
        '<div style="font-size:11px;color:var(--tx3);">Rata suggerita: ' + formatCurrency(calc.installment) + '</div>' +
      '</div>' +
    '</label>';
  }).join('');

  overlay.innerHTML = '<div class="modal-sheet">' +
    '<div class="modal-handle"></div>' +
    '<div class="modal-title">🎯 Destina ai tuoi obiettivi?</div>' +
    '<div style="font-size:13px;color:var(--tx2);margin-bottom:16px;">Vuoi accantonare parte di questa entrata (' + formatCurrency(txAmount) + ') per i tuoi obiettivi?</div>' +
    goalsHtml +
    '<div style="display:flex;gap:10px;margin-top:4px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="confirmGoalAllocation(' + txAmount + ')">Accantona</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="dismissGoalAllocation()">Salta</button>' +
    '</div>' +
  '</div>';

  window._goalAllocCb = onComplete;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) { overlay.remove(); onComplete && onComplete(); }
  });
}

function dismissGoalAllocation() {
  document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
  window._goalAllocCb && window._goalAllocCb();
}

function confirmGoalAllocation(txAmount) {
  var checked = document.querySelectorAll('.goal-alloc-cb:checked');
  if (checked.length === 0) {
    dismissGoalAllocation();
    return;
  }
  checked.forEach(function(cb) {
    var goalId = cb.dataset.id;
    var amount = parseFloat(cb.dataset.installment || 0);
    if (amount > 0) {
      var g = goals.find(function(x) { return x.id === goalId; });
      updateGoalAmount(goalId, amount);
      addTransaction('expense', amount, 'altro', 'Accantonamento obiettivo: ' + (g ? g.name : ''), todayStr());
    }
  });
  showNotification('✅ Quote accantonate!', 'success');
  dismissGoalAllocation();
}

function renderGoals() {
  var content = document.getElementById('content');
  loadGoals();

  var html = '<div class="section-header">' +
    '<h2 class="section-title">🎯 Obiettivi</h2>' +
    '<span class="section-action" onclick="showAddGoalModal()">+ Aggiungi</span>' +
  '</div>';

  if (goals.length === 0) {
    html += '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">Nessun obiettivo</div><div class="empty-text">Aggiungi il tuo primo obiettivo finanziario</div></div>';
  } else {
    goals.forEach(function(goal) {
      var pctVal = pct(goal.currentAmount || 0, goal.targetAmount);
      var progressClass = pctVal >= 100 ? 'success' : pctVal >= 60 ? '' : 'danger';
      var calc = calcGoalInstallment(goal);
      var installment = calc.installment;
      var monthsLeft = calc.monthsLeft;
      var remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));

      var today = new Date();
      var isPayDay = goal.payDay && today.getDate() === parseInt(goal.payDay) && remaining > 0;
      var pendingBadge = isPayDay
        ? '<div style="margin-top:8px;padding:8px 10px;background:rgba(255,209,102,0.1);border:1px solid rgba(255,209,102,0.3);border-radius:8px;font-size:11px;color:var(--ye);display:flex;align-items:center;justify-content:space-between;">' +
            '<span>⏰ Scadenza versamento oggi (' + formatCurrency(installment) + ')</span>' +
            '<button class="btn btn-sm" style="background:var(--ye);color:#000;padding:3px 10px;font-size:10px;" onclick="showInstallmentApprovalModal(\'' + goal.id + '\')">Gestisci</button>' +
          '</div>'
        : '';

      html += '<div class="goal-card">' +
        '<div class="goal-header">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span class="goal-emoji">' + (goal.emoji || '🎯') + '</span>' +
            '<span class="goal-name">' + escapeHtml(goal.name) + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-sm btn-success" onclick="showInstallmentApprovalModal(\'' + goal.id + '\')">💰</button>' +
            '<button class="btn btn-sm btn-danger" onclick="showConfirm(\'Eliminare obiettivo?\', function(){ deleteGoal(\'' + goal.id + '\'); renderGoals(); })">🗑️</button>' +
          '</div>' +
        '</div>' +
        '<div class="goal-amounts">' +
          '<span class="goal-current">' + formatCurrency(goal.currentAmount || 0) + '</span>' +
          '<span class="goal-target">su ' + formatCurrency(goal.targetAmount) + '</span>' +
        '</div>' +
        '<div class="progress-bar">' +
          '<div class="progress-fill ' + progressClass + '" style="width:' + pctVal + '%"></div>' +
        '</div>' +
        '<div class="goal-percent">' + pctVal + '% completato' +
          (goal.targetDate ? ' · Scadenza: ' + formatDate(goal.targetDate) : '') +
          (monthsLeft > 0 && installment > 0 ? ' · Rata: ' + formatCurrency(installment) + '/mese (' + monthsLeft + ' mesi)' : '') +
        '</div>' +
        pendingBadge +
      '</div>';
    });
  }

  content.innerHTML = html;
}

function showAddGoalModal() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-sheet">' +
    '<div class="modal-handle"></div>' +
    '<div class="modal-title">🎯 Nuovo Obiettivo</div>' +
    '<div class="form-group"><label>Nome obiettivo</label><input type="text" id="goalName" placeholder="es. Fondo emergenza"></div>' +
    '<div class="form-group"><label>Emoji</label><input type="text" id="goalEmoji" placeholder="🎯" maxlength="2" value="🎯"></div>' +
    '<div class="form-group"><label>Importo target (€)</label><input type="number" id="goalTarget" placeholder="0.00" step="0.01" min="0" inputmode="decimal"></div>' +
    '<div class="form-group"><label>Data scadenza obiettivo</label><input type="date" id="goalDeadline"></div>' +
    '<div class="form-group">' +
      '<label>Giorno del mese per il versamento (1–28)</label>' +
      '<input type="number" id="goalPayDay" placeholder="15" min="1" max="28" value="15" inputmode="numeric">' +
      '<div style="font-size:11px;color:var(--tx3);margin-top:4px;">Ogni mese a questo giorno ti verrà chiesto di approvare il versamento</div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="submitGoal()">Crea Obiettivo</button>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function submitGoal() {
  var name = document.getElementById('goalName').value.trim();
  var target = document.getElementById('goalTarget').value;
  var emoji = document.getElementById('goalEmoji').value.trim() || '🎯';
  var deadline = document.getElementById('goalDeadline').value;
  var payDay = document.getElementById('goalPayDay').value || 15;

  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  if (!target || parseFloat(target) <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }

  addGoal(name, target, emoji, deadline || null, payDay);
  document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
  renderGoals();
}

function showAddFundsModal(goalId) {
  showInstallmentApprovalModal(goalId);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

console.log('✅ goals.js v4 loaded');
