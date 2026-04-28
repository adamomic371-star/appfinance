/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — balance-calculator.js                     ║
 * ║  Automatic balance calculation with recurring bills        ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const BalanceCalculator = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _currentUser = null;
  let _accounts = [];
  let _transactions = [];
  let _recurring = [];
  let _bills = [];
  let _calculations = {};

  // ─── INIT ────────────────────────────────────────────────────
  function init(currentUser) {
    _currentUser = currentUser;
    loadData();
    setupRealtimeListeners();
  }

  function setupRealtimeListeners() {
    if (!_currentUser) return;
    
    KZ.onChildAdded(`users/${_currentUser.uid}/transactions`, onTransactionAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/transactions`, onTransactionUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/transactions`, onTransactionRemoved);
    
    KZ.onChildAdded(`users/${_currentUser.uid}/recurring`, onRecurringAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/recurring`, onRecurringUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/recurring`, onRecurringRemoved);
    
    KZ.onChildAdded(`users/${_currentUser.uid}/bills`, onBillAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/bills`, onBillUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/bills`, onBillRemoved);
  }

  // ─── DATA LOADING ───────────────────────────────────────
  async function loadData() {
    if (!_currentUser) return;
    
    try {
      const [accountsSnap, transactionsSnap, recurringSnap, billsSnap] = await Promise.all([
        KZ.get(`users/${_currentUser.uid}/accounts`),
        KZ.get(`users/${_currentUser.uid}/transactions`),
        KZ.get(`users/${_currentUser.uid}/recurring`),
        KZ.get(`users/${_currentUser.uid}/bills`)
      ]);
      
      _accounts = accountsSnap.val() ? Object.entries(accountsSnap.val()).map(([id, account]) => ({
        id,
        ...account,
        balance: parseFloat(account.balance || 0)
      })) : [];
      
      _transactions = transactionsSnap.val() ? Object.entries(transactionsSnap.val()).map(([id, tx]) => ({
        id,
        ...tx,
        amount: parseFloat(tx.amount || 0),
        type: tx.type || 'expense'
      })) : [];
      
      _recurring = recurringSnap.val() ? Object.entries(recurringSnap.val()).map(([id, rec]) => ({
        id,
        ...rec,
        amount: parseFloat(rec.amount || 0),
        nextDate: rec.nextDate || new Date().toISOString(),
        isActive: rec.status !== 'inactive'
      })) : [];
      
      _bills = billsSnap.val() ? Object.entries(billsSnap.val()).map(([id, bill]) => ({
        id,
        ...bill,
        amount: parseFloat(bill.amount || 0),
        dueDate: bill.dueDate || new Date().toISOString(),
        isActive: bill.status !== 'paid'
      })) : [];
      
      calculateAllBalances();
      updateUI();
    } catch (error) {
      console.error('Error loading balance calculator data:', error);
    }
  }

  // ─── BALANCE CALCULATIONS ───────────────────────────────
  function calculateAllBalances() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    _calculations = {
      totalBalance: 0,
      availableBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      upcomingExpenses: 0,
      accountBalances: {},
      projections: {}
    };
    
    // Calculate account balances
    _accounts.forEach(account => {
      const accountTransactions = _transactions.filter(tx => tx.accountId === account.id);
      const accountBalance = accountTransactions.reduce((balance, tx) => {
        return tx.type === 'income' 
          ? balance + tx.amount 
          : balance - tx.amount;
      }, account.balance);
      
      _calculations.accountBalances[account.id] = {
        current: accountBalance,
        transactions: accountTransactions.length
      };
      
      _calculations.totalBalance += accountBalance;
    });
    
    // Calculate monthly income/expenses
    const monthlyTransactions = _transactions.filter(tx => 
      tx.createdAt && tx.createdAt.startsWith(currentMonth)
    );
    
    monthlyTransactions.forEach(tx => {
      if (tx.type === 'income') {
        _calculations.monthlyIncome += tx.amount;
      } else {
        _calculations.monthlyExpenses += tx.amount;
      }
    });
    
    // Calculate recurring expenses for current month
    const currentMonthRecurring = _recurring.filter(rec => {
      if (!rec.isActive || !rec.nextDate) return false;
      const nextDate = new Date(rec.nextDate);
      return nextDate.getMonth() === now.getMonth() && 
             nextDate.getFullYear() === now.getFullYear();
    });
    
    const monthlyRecurringTotal = currentMonthRecurring.reduce((total, rec) => {
      return total + (rec.type === 'expense' ? rec.amount : -rec.amount);
    }, 0);
    
    // Calculate upcoming bills (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingBills = _bills.filter(bill => {
      if (!bill.isActive || !bill.dueDate) return false;
      const dueDate = new Date(bill.dueDate);
      return dueDate <= thirtyDaysFromNow && dueDate > now;
    });
    
    _calculations.upcomingExpenses = upcomingBills.reduce((total, bill) => {
      return total + bill.amount;
    }, 0);
    
    // Calculate available balance (total - upcoming recurring - upcoming bills)
    _calculations.availableBalance = _calculations.totalBalance - 
                                       Math.abs(monthlyRecurringTotal) - 
                                       _calculations.upcomingExpenses;
    
    // Generate projections for next 6 months
    _calculations.projections = generateMonthlyProjections(6);
  }

  function generateMonthlyProjections(months = 6) {
    const projections = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = projectionDate.toISOString().slice(0, 7);
      
      // Base balance from previous month
      const previousBalance = i === 0 ? _calculations.totalBalance : projections[i - 1].endingBalance;
      
      // Calculate recurring for this month
      const monthRecurring = _recurring.filter(rec => {
        if (!rec.isActive || !rec.nextDate) return false;
        const recDate = new Date(rec.nextDate);
        return recDate.getMonth() === projectionDate.getMonth() && 
               recDate.getFullYear() === projectionDate.getFullYear();
      });
      
      const recurringTotal = monthRecurring.reduce((total, rec) => {
        return total + (rec.type === 'expense' ? rec.amount : -rec.amount);
      }, 0);
      
      // Calculate bills for this month
      const monthBills = _bills.filter(bill => {
        if (!bill.isActive || !bill.dueDate) return false;
        const billDate = new Date(bill.dueDate);
        return billDate.getMonth() === projectionDate.getMonth() && 
               billDate.getFullYear() === projectionDate.getFullYear();
      });
      
      const billsTotal = monthBills.reduce((total, bill) => total + bill.amount, 0);
      
      // Average monthly income/expenses (excluding recurring and bills)
      const avgMonthlyIncome = _calculations.monthlyIncome || 3000; // Default estimate
      const avgMonthlyExpenses = _calculations.monthlyExpenses || 2000; // Default estimate
      
      const endingBalance = previousBalance + avgMonthlyIncome - avgMonthlyExpenses + recurringTotal + billsTotal;
      
      projections.push({
        month: monthKey,
        monthName: projectionDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
        startingBalance: previousBalance,
        estimatedIncome: avgMonthlyIncome,
        estimatedExpenses: avgMonthlyExpenses,
        recurringExpenses: Math.abs(recurringTotal),
        bills: billsTotal,
        endingBalance: Math.round(endingBalance * 100) / 100
      });
    }
    
    return projections;
  }

  // ─── SPECIFIC CALCULATIONS ───────────────────────────
  function getAvailableBalance(accountId = null) {
    if (accountId) {
      return _calculations.accountBalances[accountId]?.current || 0;
    }
    return _calculations.availableBalance;
  }

  function getTotalBalance(accountId = null) {
    if (accountId) {
      return _calculations.accountBalances[accountId]?.current || 0;
    }
    return _calculations.totalBalance;
  }

  function getMonthlyProjection(months = 6) {
    return generateMonthlyProjections(months);
  }

  function getUpcomingExpenses(days = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const upcomingRecurring = _recurring.filter(rec => {
      if (!rec.isActive || !rec.nextDate) return false;
      const recDate = new Date(rec.nextDate);
      return recDate <= futureDate && recDate > now;
    });
    
    const upcomingBills = _bills.filter(bill => {
      if (!bill.isActive || !bill.dueDate) return false;
      const billDate = new Date(bill.dueDate);
      return billDate <= futureDate && billDate > now;
    });
    
    return {
      recurring: upcomingRecurring,
      bills: upcomingBills,
      total: upcomingRecurring.reduce((sum, rec) => sum + rec.amount, 0) + 
             upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)
    };
  }

  function getAccountHealth(accountId) {
    const account = _accounts.find(a => a.id === accountId);
    if (!account) return null;
    
    const accountBalance = _calculations.accountBalances[accountId]?.current || 0;
    const accountTransactions = _transactions.filter(tx => tx.accountId === accountId);
    
    // Health score based on balance stability and transaction frequency
    let healthScore = 100;
    
    // Penalize low balance
    if (accountBalance < 0) {
      healthScore -= 30;
    } else if (accountBalance < 100) {
      healthScore -= 15;
    }
    
    // Reward consistent transaction activity
    if (accountTransactions.length > 10) {
      healthScore += 10;
    }
    
    // Check for overdrafts in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = accountTransactions.filter(tx => 
      new Date(tx.createdAt) > thirtyDaysAgo
    );
    
    const overdrafts = recentTransactions.filter(tx => 
      tx.type === 'expense' && accountBalance < 0
    ).length;
    
    healthScore -= overdrafts * 5;
    
    return {
      score: Math.max(0, Math.min(100, healthScore)),
      balance: accountBalance,
      transactions: accountTransactions.length,
      status: healthScore >= 80 ? 'excellent' : 
              healthScore >= 60 ? 'good' : 
              healthScore >= 40 ? 'fair' : 'poor'
    };
  }

  // ─── ALERTS AND NOTIFICATIONS ─────────────────────────
  function generateBalanceAlerts() {
    const alerts = [];
    const now = new Date();
    
    // Check for low balance
    if (_calculations.availableBalance < 100) {
      alerts.push({
        type: 'low_balance',
        severity: 'warning',
        title: '⚠️ Saldo disponibile basso',
        message: `Il tuo saldo disponibile è di ${formatCurrency(_calculations.availableBalance)}. Considera di ridurre le spese o aumentare le entrate.`,
        action: 'dashboard'
      });
    }
    
    if (_calculations.availableBalance < 0) {
      alerts.push({
        type: 'negative_balance',
        severity: 'critical',
        title: '🚨 Saldo negativo!',
        message: `Il tuo saldo disponibile è di ${formatCurrency(Math.abs(_calculations.availableBalance))}. Correggi immediatamente per evitare problemi.`,
        action: 'dashboard'
      });
    }
    
    // Check for upcoming large expenses
    const upcomingExpenses = getUpcomingExpenses(7);
    if (upcomingExpenses.total > 1000) {
      alerts.push({
        type: 'upcoming_large_expense',
        severity: 'info',
        title: '📅 Spese importanti in arrivo',
        message: `Hai spese per ${formatCurrency(upcomingExpenses.total)} in arrivo nei prossimi 7 giorni.`,
        action: 'bills'
      });
    }
    
    // Check for account health issues
    Object.entries(_calculations.accountBalances).forEach(([accountId, balance]) => {
      const health = getAccountHealth(accountId);
      if (health.status === 'poor') {
        alerts.push({
          type: 'account_health',
          severity: 'warning',
          title: '🏦 Salute account',
          message: `L'account ${accountId} ha una salute finanziaria scarsa. Controlla le transazioni recenti.`,
          action: 'accounts'
        });
      }
    });
    
    return alerts;
  }

  // ─── UI UPDATES ───────────────────────────────────────────
  function updateUI() {
    updateBalanceDisplay();
    updateProjectionChart();
    updateAccountHealthIndicators();
    updateUpcomingExpenses();
  }

  function updateBalanceDisplay() {
    const totalBalanceEl = document.getElementById('totalBalance');
    const availableBalanceEl = document.getElementById('availableBalance');
    
    if (totalBalanceEl) {
      totalBalanceEl.innerHTML = formatCurrency(_calculations.totalBalance);
    }
    
    if (availableBalanceEl) {
      availableBalanceEl.innerHTML = formatCurrency(_calculations.availableBalance);
      availableBalanceEl.style.color = _calculations.availableBalance < 0 ? 'var(--re)' : 
                                    _calculations.availableBalance < 100 ? 'var(--ye)' : 'var(--gr)';
    }
  }

  function updateProjectionChart() {
    const chartEl = document.getElementById('balanceProjectionChart');
    if (!chartEl) return;
    
    const ctx = chartEl.getContext('2d');
    const projections = _calculations.projections;
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: projections.map(p => p.monthName),
        datasets: [{
          label: 'Saldo proiettato',
          data: projections.map(p => p.endingBalance),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Saldo: ${formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }

  function updateAccountHealthIndicators() {
    const healthContainer = document.getElementById('accountHealthIndicators');
    if (!healthContainer) return;
    
    healthContainer.innerHTML = Object.entries(_calculations.accountBalances).map(([accountId, balance]) => {
      const health = getAccountHealth(accountId);
      const account = _accounts.find(a => a.id === accountId);
      
      return `
        <div class="account-health-card ${health.status}">
          <div class="health-header">
            <div class="account-name">${account?.name || 'Account'}</div>
            <div class="health-score">${health.score}/100</div>
          </div>
          <div class="health-details">
            <div class="health-item">
              <span>Saldo:</span>
              <strong>${formatCurrency(balance.current)}</strong>
            </div>
            <div class="health-item">
              <span>Transazioni:</span>
              <strong>${balance.transactions}</strong>
            </div>
            <div class="health-item">
              <span>Stato:</span>
              <strong class="health-status ${health.status}">${health.status}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateUpcomingExpenses() {
    const upcomingEl = document.getElementById('upcomingExpenses');
    if (!upcomingEl) return;
    
    const upcoming = getUpcomingExpenses(30);
    
    upcomingEl.innerHTML = `
      <div class="upcoming-header">
        <h4>Spese in arrivo (30 giorni)</h4>
        <div class="upcoming-total">Totale: ${formatCurrency(upcoming.total)}</div>
      </div>
      <div class="upcoming-list">
        ${upcoming.recurring.length > 0 ? `
          <div class="upcoming-section">
            <h5>🔄 Ricorrenti</h5>
            ${upcoming.recurring.map(rec => `
              <div class="upcoming-item">
                <div class="item-name">${rec.name}</div>
                <div class="item-amount">${formatCurrency(rec.amount)}</div>
                <div class="item-date">${new Date(rec.nextDate).toLocaleDateString('it-IT')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${upcoming.bills.length > 0 ? `
          <div class="upcoming-section">
            <h5>📄 Bollette</h5>
            ${upcoming.bills.map(bill => `
              <div class="upcoming-item">
                <div class="item-name">${bill.name}</div>
                <div class="item-amount">${formatCurrency(bill.amount)}</div>
                <div class="item-date">${new Date(bill.dueDate).toLocaleDateString('it-IT')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${upcoming.recurring.length === 0 && upcoming.bills.length === 0 ? `
          <div class="empty-state">Nessuna spesa in arrivo nei prossimi 30 giorni</div>
        ` : ''}
      </div>
    `;
  }

  // ─── REALTIME HANDLERS ───────────────────────────────────
  function onTransactionAdded(snap) {
    const transaction = { id: snap.key, ...snap.val() };
    _transactions.push(transaction);
    calculateAllBalances();
    updateUI();
  }

  function onTransactionUpdated(snap) {
    const transactionId = snap.key;
    const updates = snap.val();
    const index = _transactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      _transactions[index] = { ..._transactions[index], ...updates };
      calculateAllBalances();
      updateUI();
    }
  }

  function onTransactionRemoved(snap) {
    const transactionId = snap.key;
    _transactions = _transactions.filter(t => t.id !== transactionId);
    calculateAllBalances();
    updateUI();
  }

  function onRecurringAdded(snap) {
    const recurring = { id: snap.key, ...snap.val() };
    _recurring.push(recurring);
    calculateAllBalances();
    updateUI();
  }

  function onRecurringUpdated(snap) {
    const recurringId = snap.key;
    const updates = snap.val();
    const index = _recurring.findIndex(r => r.id === recurringId);
    
    if (index !== -1) {
      _recurring[index] = { ..._recurring[index], ...updates };
      calculateAllBalances();
      updateUI();
    }
  }

  function onRecurringRemoved(snap) {
    const recurringId = snap.key;
    _recurring = _recurring.filter(r => r.id !== recurringId);
    calculateAllBalances();
    updateUI();
  }

  function onBillAdded(snap) {
    const bill = { id: snap.key, ...snap.val() };
    _bills.push(bill);
    calculateAllBalances();
    updateUI();
  }

  function onBillUpdated(snap) {
    const billId = snap.key;
    const updates = snap.val();
    const index = _bills.findIndex(b => b.id === billId);
    
    if (index !== -1) {
      _bills[index] = { ..._bills[index], ...updates };
      calculateAllBalances();
      updateUI();
    }
  }

  function onBillRemoved(snap) {
    const billId = snap.key;
    _bills = _bills.filter(b => b.id !== billId);
    calculateAllBalances();
    updateUI();
  }

  // ─── UTILITIES ───────────────────────────────────────────────
  function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  // ─── PUBLIC API ──────────────────────────────────────────────
  return {
    init,
    getAvailableBalance,
    getTotalBalance,
    getMonthlyProjection,
    getUpcomingExpenses,
    getAccountHealth,
    generateBalanceAlerts,
    calculateAllBalances,
    _calculations: () => _calculations
  };

})();
