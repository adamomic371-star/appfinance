/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — multi-account.js                           ║
 * ║  Multi-account system: bank accounts, cards, PayPal          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const MultiAccount = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _accounts = [];
  let _activeAccountId = null;
  let _currentUser = null;

  // Account types with icons and colors
  const ACCOUNT_TYPES = {
    bank: { icon: '🏦', label: 'Conto bancario', color: '#4A90E2' },
    card: { icon: '💳', label: 'Carta di credito', color: '#FF6B6B' },
    cash: { icon: '💵', label: 'Contanti', color: '#4ECDC4' },
    savings: { icon: '🏦', label: 'Conto risparmio', color: '#45B7D1' },
    paypal: { icon: '💰', label: 'PayPal', color: '#003087' },
    crypto: { icon: '₿', label: 'Crypto', color: '#F7931A' }
  };

  // ─── INIT ────────────────────────────────────────────────────
  function init(currentUser) {
    _currentUser = currentUser;
    loadAccounts();
    setupRealtimeListeners();
  }

  function setupRealtimeListeners() {
    if (!_currentUser) return;
    
    // Listen for account changes
    KZ.onChildAdded(`users/${_currentUser.uid}/accounts`, onAccountAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/accounts`, onAccountUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/accounts`, onAccountRemoved);
  }

  // ─── ACCOUNT MANAGEMENT ─────────────────────────────────────
  async function loadAccounts() {
    if (!_currentUser) return;
    
    try {
      const snap = await KZ.get(`users/${_currentUser.uid}/accounts`);
      _accounts = snap.val() ? Object.entries(snap.val()).map(([id, account]) => ({
        id,
        ...account,
        type: account.type || 'bank',
        balance: parseFloat(account.balance || 0),
        currency: account.currency || 'EUR'
      })) : [];
      
      // Set active account (first one or last used)
      const lastActive = localStorage.getItem(`kz_active_account_${_currentUser.uid}`);
      _activeAccountId = lastActive && _accounts.find(a => a.id === lastActive) 
        ? lastActive 
        : (_accounts.length > 0 ? _accounts[0].id : null);
      
      updateUI();
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  async function createAccount(accountData) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const account = {
      name: accountData.name.trim(),
      type: accountData.type || 'bank',
      balance: parseFloat(accountData.balance || 0),
      currency: accountData.currency || 'EUR',
      color: accountData.color || ACCOUNT_TYPES[accountData.type || 'bank'].color,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Add validation for specific account types
    if (account.type === 'card') {
      account.cardNumber = accountData.cardNumber ? accountData.cardNumber.replace(/\s/g, '').slice(-4) : null;
      account.cardBrand = detectCardBrand(accountData.cardNumber);
    }
    
    if (account.type === 'paypal') {
      account.paypalEmail = accountData.paypalEmail;
    }
    
    if (account.type === 'crypto') {
      account.walletAddress = accountData.walletAddress;
      account.cryptoType = accountData.cryptoType || 'BTC';
    }

    const accountId = KZ.push(`users/${_currentUser.uid}/accounts`).key;
    await KZ.set(`users/${_currentUser.uid}/accounts/${accountId}`, { ...account, id: accountId });
    
    return accountId;
  }

  async function updateAccount(accountId, updates) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const allowedUpdates = ['name', 'balance', 'color', 'isActive'];
    const safeUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        safeUpdates[key] = key === 'balance' ? parseFloat(updates[key] || 0) : updates[key];
      }
    });
    
    await KZ.update(`users/${_currentUser.uid}/accounts/${accountId}`, safeUpdates);
  }

  async function deleteAccount(accountId) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    // Check if account has transactions
    const transactionsSnap = await KZ.get(`users/${_currentUser.uid}/transactions`);
    const transactions = transactionsSnap.val() || {};
    const accountTransactions = Object.values(transactions).filter(tx => tx.accountId === accountId);
    
    if (accountTransactions.length > 0) {
      throw new Error(`Impossibile eliminare l'account: ha ${accountTransactions.length} transazioni associate`);
    }
    
    await KZ.remove(`users/${_currentUser.uid}/accounts/${accountId}`);
    
    // If this was the active account, switch to another one
    if (_activeAccountId === accountId) {
      const remainingAccounts = _accounts.filter(a => a.id !== accountId);
      setActiveAccount(remainingAccounts.length > 0 ? remainingAccounts[0].id : null);
    }
  }

  function setActiveAccount(accountId) {
    if (!accountId || !_accounts.find(a => a.id === accountId)) {
      _activeAccountId = _accounts.length > 0 ? _accounts[0].id : null;
    } else {
      _activeAccountId = accountId;
    }
    
    localStorage.setItem(`kz_active_account_${_currentUser.uid}`, _activeAccountId);
    updateUI();
  }

  // ─── BALANCE CALCULATIONS ────────────────────────────────
  function getTotalBalance() {
    return _accounts.reduce((total, account) => total + account.balance, 0);
  }

  function getBalanceByType(type) {
    return _accounts
      .filter(account => account.type === type)
      .reduce((total, account) => total + account.balance, 0);
  }

  function getActiveAccount() {
    return _accounts.find(account => account.id === _activeAccountId) || null;
  }

  function getAccountsByType(type) {
    return _accounts.filter(account => account.type === type);
  }

  // ─── TRANSACTION HELPERS ───────────────────────────────────
  async function addTransactionToAccount(accountId, transaction) {
    if (!_accounts.find(a => a.id === accountId)) {
      throw new Error('Account not found');
    }
    
    // Update account balance
    const account = _accounts.find(a => a.id === accountId);
    const newBalance = transaction.type === 'income' 
      ? account.balance + parseFloat(transaction.amount)
      : account.balance - parseFloat(transaction.amount);
    
    await updateAccount(accountId, { balance: newBalance });
    
    // Add transaction with account reference
    const txData = {
      ...transaction,
      accountId,
      accountName: account.name,
      accountType: account.type
    };
    
    const txId = KZ.push(`users/${_currentUser.uid}/transactions`).key;
    await KZ.set(`users/${_currentUser.uid}/transactions/${txId}`, { ...txData, id: txId });
    
    return txId;
  }

  // ─── UI UPDATES ───────────────────────────────────────────
  function updateUI() {
    updateAccountsList();
    updateAccountSelector();
    updateBalanceDisplay();
    updateAccountStats();
  }

  function updateAccountsList() {
    const accountsListEl = document.getElementById('accountsList');
    if (!accountsListEl) return;
    
    accountsListEl.innerHTML = _accounts.map(account => {
      const typeInfo = ACCOUNT_TYPES[account.type] || ACCOUNT_TYPES.bank;
      const isActive = account.id === _activeAccountId;
      
      return `
        <div class="account-item ${isActive ? 'active' : ''}" onclick="MultiAccount.setActiveAccount('${account.id}')">
          <div class="account-icon" style="background: ${account.color}22; color: ${account.color}">
            ${typeInfo.icon}
          </div>
          <div class="account-info">
            <div class="account-name">${account.name}</div>
            <div class="account-type">${typeInfo.label}</div>
            ${account.cardNumber ? `<div class="account-card">**** ${account.cardNumber}</div>` : ''}
            ${account.paypalEmail ? `<div class="account-email">${account.paypalEmail}</div>` : ''}
          </div>
          <div class="account-balance">
            <div class="balance-amount">${formatCurrency(account.balance)}</div>
            <div class="balance-label">Saldo</div>
          </div>
          <div class="account-actions">
            <button class="btn-sm" onclick="event.stopPropagation(); MultiAccount.editAccount('${account.id}')" title="Modifica">✏️</button>
            <button class="btn-sm danger" onclick="event.stopPropagation(); MultiAccount.confirmDeleteAccount('${account.id}')" title="Elimina">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateAccountSelector() {
    const selectorEl = document.getElementById('txAccount');
    if (!selectorEl) return;
    
    selectorEl.innerHTML = _accounts.map(account => 
      `<option value="${account.id}" ${account.id === _activeAccountId ? 'selected' : ''}>
        ${ACCOUNT_TYPES[account.type]?.icon || '🏦'} ${account.name} (${formatCurrency(account.balance)})
      </option>`
    ).join('');
  }

  function updateBalanceDisplay() {
    const balanceEl = document.getElementById('totalBalance');
    if (!balanceEl) return;
    
    const totalBalance = getTotalBalance();
    balanceEl.innerHTML = formatCurrency(totalBalance);
  }

  function updateAccountStats() {
    const statsEl = document.getElementById('accountStats');
    if (!statsEl) return;
    
    const stats = Object.entries(ACCOUNT_TYPES).map(([type, info]) => ({
      type,
      ...info,
      balance: getBalanceByType(type),
      count: getAccountsByType(type).length
    })).filter(stat => stat.count > 0);
    
    statsEl.innerHTML = stats.map(stat => `
      <div class="account-stat">
        <div class="stat-icon" style="background: ${stat.color}22; color: ${stat.color}">
          ${stat.icon}
        </div>
        <div class="stat-info">
          <div class="stat-label">${stat.label}</div>
          <div class="stat-value">${formatCurrency(stat.balance)}</div>
          <div class="stat-count">${stat.count} ${stat.count === 1 ? 'account' : 'accounts'}</div>
        </div>
      </div>
    `).join('');
  }

  // ─── MODALS ───────────────────────────────────────────────────
  function showAccountModal(accountId = null) {
    const account = accountId ? _accounts.find(a => a.id === accountId) : null;
    const isEdit = !!account;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <h3>${isEdit ? '✏️ Modifica Account' : '➕ Nuovo Account'}</h3>
        <div class="modal-body">
          <div class="fg">
            <label>Nome Account *</label>
            <input type="text" class="fc" id="accountName" value="${account?.name || ''}" placeholder="Es: Conto Corrente UniCredit">
          </div>
          <div class="fg">
            <label>Tipo Account *</label>
            <select class="fc" id="accountType" onchange="MultiAccount.handleAccountTypeChange()">
              ${Object.entries(ACCOUNT_TYPES).map(([type, info]) => 
                `<option value="${type}" ${account?.type === type ? 'selected' : ''}>${info.icon} ${info.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="fg">
            <label>Saldo Iniziale (€)</label>
            <input type="number" class="fc" id="accountBalance" value="${account?.balance || 0}" step="0.01" placeholder="0.00">
          </div>
          <div class="fg">
            <label>Colore</label>
            <div class="color-picker">
              ${Object.values(ACCOUNT_TYPES).map(type => 
                `<div class="color-option ${account?.color === type.color ? 'selected' : ''}" 
                     style="background: ${type.color}" 
                     onclick="document.getElementById('accountColor').value='${type.color}'">
                </div>`
              ).join('')}
              <input type="hidden" id="accountColor" value="${account?.color || ACCOUNT_TYPES.bank.color}">
            </div>
          </div>
          
          <!-- Type-specific fields -->
          <div id="cardFields" class="hidden">
            <div class="fg">
              <label>Numero Carta</label>
              <input type="text" class="fc" id="cardNumber" value="${account?.cardNumber || ''}" placeholder="1234 5678 9012 3456">
            </div>
          </div>
          
          <div id="paypalFields" class="hidden">
            <div class="fg">
              <label>Email PayPal</label>
              <input type="email" class="fc" id="paypalEmail" value="${account?.paypalEmail || ''}" placeholder="email@paypal.com">
            </div>
          </div>
          
          <div id="cryptoFields" class="hidden">
            <div class="fg">
              <label>Tipo Crypto</label>
              <select class="fc" id="cryptoType">
                <option value="BTC" ${account?.cryptoType === 'BTC' ? 'selected' : ''}>Bitcoin (BTC)</option>
                <option value="ETH" ${account?.cryptoType === 'ETH' ? 'selected' : ''}>Ethereum (ETH)</option>
                <option value="USDT" ${account?.cryptoType === 'USDT' ? 'selected' : ''}>Tether (USDT)</option>
              </select>
            </div>
            <div class="fg">
              <label>Indirizzo Wallet</label>
              <input type="text" class="fc" id="walletAddress" value="${account?.walletAddress || ''}" placeholder="0x...">
            </div>
          </div>
          
          <div class="btn-row">
            <button class="btn-a btn-d" onclick="this.closest('.modal-overlay').remove()">Annulla</button>
            <button class="btn-a btn-g" onclick="MultiAccount.saveAccount('${accountId || ''}')">${isEdit ? 'Aggiorna' : 'Crea'}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
    
    // Initialize type-specific fields visibility
    if (account) {
      handleAccountTypeChange();
    }
  }

  function handleAccountTypeChange() {
    const type = document.getElementById('accountType').value;
    const cardFields = document.getElementById('cardFields');
    const paypalFields = document.getElementById('paypalFields');
    const cryptoFields = document.getElementById('cryptoFields');
    
    // Hide all type-specific fields
    cardFields?.classList.add('hidden');
    paypalFields?.classList.add('hidden');
    cryptoFields?.classList.add('hidden');
    
    // Show relevant fields
    if (type === 'card') {
      cardFields?.classList.remove('hidden');
    } else if (type === 'paypal') {
      paypalFields?.classList.remove('hidden');
    } else if (type === 'crypto') {
      cryptoFields?.classList.remove('hidden');
    }
  }

  async function saveAccount(accountId) {
    const name = document.getElementById('accountName').value.trim();
    const type = document.getElementById('accountType').value;
    const balance = parseFloat(document.getElementById('accountBalance').value) || 0;
    const color = document.getElementById('accountColor').value;
    
    if (!name) {
      alert('Il nome dell\'account è obbligatorio');
      return;
    }
    
    const accountData = { name, type, balance, color };
    
    // Add type-specific data
    if (type === 'card') {
      accountData.cardNumber = document.getElementById('cardNumber').value;
    } else if (type === 'paypal') {
      accountData.paypalEmail = document.getElementById('paypalEmail').value;
    } else if (type === 'crypto') {
      accountData.cryptoType = document.getElementById('cryptoType').value;
      accountData.walletAddress = document.getElementById('walletAddress').value;
    }
    
    try {
      if (accountId) {
        await updateAccount(accountId, accountData);
        alert('Account aggiornato con successo!');
      } else {
        await createAccount(accountData);
        alert('Account creato con successo!');
      }
      
      document.querySelector('.modal-overlay').remove();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  }

  function editAccount(accountId) {
    showAccountModal(accountId);
  }

  function confirmDeleteAccount(accountId) {
    const account = _accounts.find(a => a.id === accountId);
    if (!account) return;
    
    if (confirm(`Sei sicuro di voler eliminare l'account "${account.name}"?\n\nQuesta azione è irreversibile.`)) {
      deleteAccount(accountId).catch(error => {
        alert('Errore: ' + error.message);
      });
    }
  }

  // ─── UTILITIES ───────────────────────────────────────────────
  function detectCardBrand(cardNumber) {
    if (!cardNumber) return null;
    
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'American Express';
    if (cleaned.startsWith('6')) return 'Discover';
    if (cleaned.startsWith('37')) return 'American Express';
    
    return 'Generic';
  }

  function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  // ─── REALTIME HANDLERS ───────────────────────────────────
  function onAccountAdded(snap) {
    const account = { id: snap.key, ...snap.val() };
    _accounts.push(account);
    updateUI();
  }

  function onAccountUpdated(snap) {
    const accountId = snap.key;
    const updates = snap.val();
    const index = _accounts.findIndex(a => a.id === accountId);
    
    if (index !== -1) {
      _accounts[index] = { ..._accounts[index], ...updates };
      updateUI();
    }
  }

  function onAccountRemoved(snap) {
    const accountId = snap.key;
    _accounts = _accounts.filter(a => a.id !== accountId);
    updateUI();
  }

  // ─── PUBLIC API ─────────────────────────────────────────────
  return {
    init,
    createAccount,
    updateAccount,
    deleteAccount,
    setActiveAccount,
    getActiveAccount,
    getAllAccounts: () => [..._accounts],
    getAccountsByType,
    getTotalBalance,
    getBalanceByType,
    addTransactionToAccount,
    showAccountModal,
    handleAccountTypeChange,
    saveAccount,
    editAccount,
    confirmDeleteAccount,
    ACCOUNT_TYPES
  };

})();
