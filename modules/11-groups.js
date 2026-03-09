// 11-GROUPS.JS - Gruppi spese condivise

function loadGroups() {
  groups = lsGet('fp_groups_' + (user ? user.id : 'local'), []);
}

function saveGroups() {
  lsSet('fp_groups_' + (user ? user.id : 'local'), groups);
  queueSync('groups');
}

function addGroup(name, members, emoji) {
  const group = {
    id: generateId(),
    name: name,
    emoji: emoji || '👥',
    members: members || [],
    expenses: [],
    createdAt: new Date().toISOString()
  };
  groups.push(group);
  saveGroups();
  showNotification('✅ Gruppo creato!', 'success');
  return group;
}

function addGroupExpense(groupId, description, amount, paidBy, splitAmong) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;

  const expense = {
    id: generateId(),
    description: description,
    amount: parseFloat(amount),
    paidBy: paidBy,
    splitAmong: splitAmong || group.members,
    date: todayStr()
  };
  group.expenses = group.expenses || [];
  group.expenses.push(expense);
  saveGroups();
  showNotification('✅ Spesa aggiunta!', 'success');
  return expense;
}

function deleteGroup(id) {
  groups = groups.filter(g => g.id !== id);
  saveGroups();
  showNotification('🗑️ Gruppo eliminato', 'info');
}

function calculateGroupBalances(group) {
  const balances = {};
  (group.members || []).forEach(m => { balances[m] = 0; });

  (group.expenses || []).forEach(exp => {
    const split = exp.splitAmong || group.members;
    const share = exp.amount / split.length;
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
    split.forEach(m => {
      balances[m] = (balances[m] || 0) - share;
    });
  });

  return balances;
}

function renderGroups() {
  const content = document.getElementById('content');
  loadGroups();

  let html = `
    <div class="section-header">
      <h2 class="section-title">👥 Gruppi</h2>
      <span class="section-action" onclick="showAddGroupModal()">+ Crea gruppo</span>
    </div>
  `;

  if (groups.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">👥</div>
      <div class="empty-title">Nessun gruppo</div>
      <div class="empty-text">Crea un gruppo per dividere le spese con amici o famiglia</div>
    </div>`;
  } else {
    groups.forEach(group => {
      const totalExpenses = (group.expenses || []).reduce((s, e) => s + e.amount, 0);
      html += `
        <div class="group-card" onclick="showGroupDetail('${group.id}')">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">${group.emoji || '👥'}</span>
              <div>
                <div style="font-weight:700;font-size:15px;">${escapeHtml(group.name)}</div>
                <div style="font-size:12px;color:#8892b0;">${(group.expenses || []).length} spese · ${formatCurrency(totalExpenses)}</div>
              </div>
            </div>
            <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();showConfirm('Eliminare gruppo?', () => { deleteGroup('${group.id}'); renderGroups(); })">🗑</button>
          </div>
          <div class="group-members">
            ${(group.members || []).map(m => `<span class="member-chip">${escapeHtml(m)}</span>`).join('')}
          </div>
        </div>`;
    });
  }

  content.innerHTML = html;
}

function showGroupDetail(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;

  const balances = calculateGroupBalances(group);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  let balancesHtml = Object.entries(balances).map(([member, bal]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:14px;">${escapeHtml(member)}</span>
      <span style="font-weight:700;color:${bal >= 0 ? '#00e5a0' : '#ff4f6d'};">${bal >= 0 ? '+' : ''}${formatCurrency(Math.abs(bal))}</span>
    </div>`).join('');

  let expensesHtml = (group.expenses || []).map(exp => `
    <div class="tx-item">
      <div class="tx-icon expense">💸</div>
      <div class="tx-info">
        <div class="tx-desc">${escapeHtml(exp.description)}</div>
        <div class="tx-cat">Pagato da ${escapeHtml(exp.paidBy)}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount expense">-${formatCurrency(exp.amount)}</div>
        <div class="tx-date">${formatDateShort(exp.date)}</div>
      </div>
    </div>`).join('') || '<div class="empty-state" style="padding:16px;"><div class="empty-text">Nessuna spesa</div></div>';

  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div class="modal-title" style="margin:0;">${group.emoji} ${escapeHtml(group.name)}</div>
        <button class="btn btn-primary btn-sm" onclick="showAddGroupExpenseModal('${groupId}')">+ Spesa</button>
      </div>
      <div style="font-size:13px;font-weight:600;color:#8892b0;text-transform:uppercase;margin-bottom:8px;">Saldi</div>
      ${balancesHtml}
      <div style="font-size:13px;font-weight:600;color:#8892b0;text-transform:uppercase;margin:16px 0 8px;">Spese</div>
      <div class="tx-list" style="max-height:250px;overflow-y:auto;">${expensesHtml}</div>
      <button class="btn btn-secondary" style="width:100%;margin-top:16px;" onclick="this.closest('.modal-overlay').remove()">Chiudi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showAddGroupModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">👥 Nuovo Gruppo</div>
      <div class="form-group"><label>Nome gruppo</label><input type="text" id="groupName" placeholder="es. Vacanza, Casa, Famiglia"></div>
      <div class="form-group"><label>Emoji</label><input type="text" id="groupEmoji" placeholder="👥" maxlength="2" value="👥"></div>
      <div class="form-group"><label>Membri (uno per riga)</label><textarea id="groupMembers" placeholder="Mario\nLuigi\nPeach" rows="4"></textarea></div>
      <button class="btn btn-primary" onclick="submitGroup()">Crea Gruppo</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitGroup() {
  const name = document.getElementById('groupName').value.trim();
  const emoji = document.getElementById('groupEmoji').value.trim() || '👥';
  const membersText = document.getElementById('groupMembers').value;
  const members = membersText.split('\n').map(m => m.trim()).filter(m => m);

  if (!name) { showNotification('⚠️ Inserisci un nome', 'error'); return; }
  if (members.length < 2) { showNotification('⚠️ Aggiungi almeno 2 membri', 'error'); return; }

  addGroup(name, members, emoji);
  document.querySelector('.modal-overlay')?.remove();
  renderGroups();
}

function showAddGroupExpenseModal(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;

  const memberOptions = (group.members || []).map(m => `<option value="${m}">${escapeHtml(m)}</option>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">💸 Aggiungi Spesa</div>
      <div class="form-group"><label>Descrizione</label><input type="text" id="grpExpDesc" placeholder="es. Cena, Hotel"></div>
      <div class="form-group"><label>Importo (€)</label><input type="number" id="grpExpAmount" placeholder="0.00" step="0.01" min="0"></div>
      <div class="form-group"><label>Pagato da</label><select id="grpExpPayer">${memberOptions}</select></div>
      <button class="btn btn-primary" onclick="submitGroupExpense('${groupId}')">Aggiungi</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function submitGroupExpense(groupId) {
  const desc = document.getElementById('grpExpDesc').value.trim();
  const amount = document.getElementById('grpExpAmount').value;
  const payer = document.getElementById('grpExpPayer').value;

  if (!desc) { showNotification('⚠️ Inserisci descrizione', 'error'); return; }
  if (!amount || parseFloat(amount) <= 0) { showNotification('⚠️ Importo non valido', 'error'); return; }

  const group = groups.find(g => g.id === groupId);
  addGroupExpense(groupId, desc, amount, payer, group ? group.members : [payer]);
  // Close all modals
  document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  showGroupDetail(groupId);
}

console.log('✅ groups.js loaded');
