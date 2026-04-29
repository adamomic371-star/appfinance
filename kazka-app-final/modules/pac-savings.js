/**
 * ╔════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — pac-savings.js                           ║
 * ║  PAC (Piano di Accumulo) savings plan with goals          ║
 * ╚════════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const PAC = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _currentUser = null;
  let _goals = [];
  let _savingsPlans = [];
  let _monthlyCalculations = {};

  // Goal categories
  const GOAL_CATEGORIES = {
    emergency: { icon: '🚨', label: 'Fondo di emergenza', color: '#FF6B6B' },
    vacation: { icon: '✈️', label: 'Vacanze', color: '#4ECDC4' },
    house: { icon: '🏠', label: 'Casa', color: '#45B7D1' },
    car: { icon: '🚗', label: 'Auto', color: '#96CEB4' },
    education: { icon: '🎓', label: 'Educazione', color: '#FFEAA7' },
    retirement: { icon: '👴', label: 'Pensione', color: '#DDA0DD' },
    investment: { icon: '📈', label: 'Investimenti', color: '#74B9FF' },
    other: { icon: '🎯', label: 'Altro', color: '#A8E6CF' }
  };

  // ─── INIT ────────────────────────────────────────────────────
  function init(currentUser) {
    _currentUser = currentUser;
    loadGoals();
    loadSavingsPlans();
    setupRealtimeListeners();
  }

  function setupRealtimeListeners() {
    if (!_currentUser) return;
    
    KZ.onChildAdded(`users/${_currentUser.uid}/pac/goals`, onGoalAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/pac/goals`, onGoalUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/pac/goals`, onGoalRemoved);
    KZ.onChildAdded(`users/${_currentUser.uid}/pac/plans`, onPlanAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/pac/plans`, onPlanUpdated);
    KZ.onChildRemoved(`users/${_currentUser.uid}/pac/plans`, onPlanRemoved);
  }

  // ─── GOALS MANAGEMENT ───────────────────────────────────
  async function loadGoals() {
    if (!_currentUser) return;
    
    try {
      const snap = await KZ.get(`users/${_currentUser.uid}/pac/goals`);
      _goals = snap.val() ? Object.entries(snap.val()).map(([id, goal]) => ({
        id,
        ...goal,
        target: parseFloat(goal.target || 0),
        current: parseFloat(goal.current || 0),
        monthlyContribution: parseFloat(goal.monthlyContribution || 0),
        deadline: goal.deadline || null,
        category: goal.category || 'other',
        createdAt: goal.createdAt || new Date().toISOString(),
        completed: goal.completed || false
      })) : [];
      
      updateGoalsUI();
    } catch (error) {
      console.error('Error loading PAC goals:', error);
    }
  }

  async function createGoal(goalData) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const goal = {
      name: goalData.name.trim(),
      description: goalData.description?.trim() || '',
      target: parseFloat(goalData.target || 0),
      current: parseFloat(goalData.current || 0),
      monthlyContribution: parseFloat(goalData.monthlyContribution || 0),
      category: goalData.category || 'other',
      deadline: goalData.deadline || null,
      priority: goalData.priority || 'medium',
      autoCalculate: goalData.autoCalculate !== false,
      createdAt: new Date().toISOString(),
      completed: false,
      milestones: []
    };

    // Calculate optimal monthly contribution if auto-calculate is enabled
    if (goal.autoCalculate && goal.deadline) {
      goal.monthlyContribution = calculateOptimalMonthlyContribution(goal);
    }

    const goalId = KZ.push(`users/${_currentUser.uid}/pac/goals`).key;
    await KZ.set(`users/${_currentUser.uid}/pac/goals/${goalId}`, { ...goal, id: goalId });
    
    return goalId;
  }

  async function updateGoal(goalId, updates) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const allowedUpdates = ['name', 'description', 'target', 'current', 'monthlyContribution', 'deadline', 'priority', 'autoCalculate'];
    const safeUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        safeUpdates[key] = key === 'current' || key === 'target' || key === 'monthlyContribution' 
          ? parseFloat(updates[key] || 0) 
          : updates[key];
      }
    });
    
    // Recalculate monthly contribution if auto-calculate is enabled and deadline changed
    if (safeUpdates.deadline && safeUpdates.autoCalculate !== false) {
      const currentGoal = _goals.find(g => g.id === goalId);
      if (currentGoal) {
        safeUpdates.monthlyContribution = calculateOptimalMonthlyContribution({
          ...currentGoal,
          ...safeUpdates
        });
      }
    }
    
    await KZ.update(`users/${_currentUser.uid}/pac/goals/${goalId}`, safeUpdates);
  }

  async function deleteGoal(goalId) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    await KZ.remove(`users/${_currentUser.uid}/pac/goals/${goalId}`);
  }

  async function addContribution(goalId, amount) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const goal = _goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    
    const newCurrent = goal.current + parseFloat(amount);
    const newCompleted = newCurrent >= goal.target;
    
    await updateGoal(goalId, { 
      current: newCurrent,
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null
    });
    
    // Add milestone if significant progress
    const progressPercentage = (newCurrent / goal.target) * 100;
    if (progressPercentage >= 25 && !goal.milestones.includes('25%')) {
      await addMilestone(goalId, '25%', newCurrent);
    }
    if (progressPercentage >= 50 && !goal.milestones.includes('50%')) {
      await addMilestone(goalId, '50%', newCurrent);
    }
    if (progressPercentage >= 75 && !goal.milestones.includes('75%')) {
      await addMilestone(goalId, '75%', newCurrent);
    }
  }

  async function addMilestone(goalId, milestone, currentAmount) {
    const milestoneData = {
      milestone,
      amount: currentAmount,
      achievedAt: new Date().toISOString()
    };
    
    await KZ.push(`users/${_currentUser.uid}/pac/goals/${goalId}/milestones`, milestoneData);
  }

  // ─── CALCULATIONS ───────────────────────────────────────
  function calculateOptimalMonthlyContribution(goal) {
    if (!goal.deadline || !goal.target || !goal.current) return 0;
    
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const monthsRemaining = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + 
                                     (deadline.getMonth() - now.getMonth()));
    
    const remainingAmount = goal.target - goal.current;
    const monthlyContribution = remainingAmount / monthsRemaining;
    
    return Math.ceil(monthlyContribution * 100) / 100; // Round up to nearest cent
  }

  function calculateMonthlySavingsPlan() {
    const totalMonthlyContribution = _goals
      .filter(goal => !goal.completed)
      .reduce((total, goal) => total + goal.monthlyContribution, 0);
    
    const totalMonthlyIncome = 3000; // This should come from user's income data
    const recommendedSavingsRate = 0.20; // 20% of income
    const recommendedMonthlySavings = totalMonthlyIncome * recommendedSavingsRate;
    
    return {
      totalGoals: _goals.filter(g => !g.completed).length,
      totalMonthlyContribution,
      recommendedMonthlySavings,
      isOnTrack: totalMonthlyContribution >= recommendedMonthlySavings,
      surplus: totalMonthlyContribution - recommendedMonthlySavings,
      deficit: recommendedMonthlySavings - totalMonthlyContribution
    };
  }

  function generateSavingsReport() {
    const completedGoals = _goals.filter(g => g.completed);
    const activeGoals = _goals.filter(g => !g.completed);
    const totalSaved = completedGoals.reduce((sum, g) => sum + g.target, 0);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.target, 0);
    const totalCurrent = activeGoals.reduce((sum, g) => sum + g.current, 0);
    
    return {
      totalGoals: _goals.length,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      totalSaved,
      totalTarget,
      totalCurrent,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      completionRate: _goals.length > 0 ? (completedGoals.length / _goals.length) * 100 : 0
    };
  }

  // ─── SAVINGS PLANS ─────────────────────────────────────
  async function loadSavingsPlans() {
    if (!_currentUser) return;
    
    try {
      const snap = await KZ.get(`users/${_currentUser.uid}/pac/plans`);
      _savingsPlans = snap.val() ? Object.entries(snap.val()).map(([id, plan]) => ({
        id,
        ...plan,
        monthlyAmount: parseFloat(plan.monthlyAmount || 0),
        duration: parseInt(plan.duration || 12),
        interestRate: parseFloat(plan.interestRate || 0),
        autoDeposit: plan.autoDeposit || false,
        createdAt: plan.createdAt || new Date().toISOString(),
        isActive: plan.isActive !== false
      })) : [];
      
      updatePlansUI();
    } catch (error) {
      console.error('Error loading PAC plans:', error);
    }
  }

  async function createSavingsPlan(planData) {
    if (!_currentUser) throw new Error('User not authenticated');
    
    const plan = {
      name: planData.name.trim(),
      description: planData.description?.trim() || '',
      monthlyAmount: parseFloat(planData.monthlyAmount || 0),
      duration: parseInt(planData.duration || 12),
      interestRate: parseFloat(planData.interestRate || 0),
      autoDeposit: planData.autoDeposit || false,
      depositDay: parseInt(planData.depositDay || 1),
      goalId: planData.goalId || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      deposits: []
    };

    const planId = KZ.push(`users/${_currentUser.uid}/pac/plans`).key;
    await KZ.set(`users/${_currentUser.uid}/pac/plans/${planId}`, { ...plan, id: planId });
    
    return planId;
  }

  function calculatePlanProjection(plan) {
    if (!plan) return null;
    
    const monthlyRate = plan.interestRate / 100 / 12;
    const totalMonths = plan.duration;
    const monthlyDeposit = plan.monthlyAmount;
    
    let projection = [];
    let balance = 0;
    
    for (let month = 1; month <= totalMonths; month++) {
      balance = balance * (1 + monthlyRate) + monthlyDeposit;
      projection.push({
        month,
        balance: Math.round(balance * 100) / 100,
        interest: Math.round((balance * monthlyRate) * 100) / 100,
        totalDeposited: monthlyDeposit * month
      });
    }
    
    return {
      finalAmount: projection[projection.length - 1]?.balance || 0,
      totalInterest: projection.reduce((sum, p) => sum + p.interest, 0),
      totalDeposited: monthlyDeposit * totalMonths,
      projection
    };
  }

  // ─── UI UPDATES ───────────────────────────────────────────
  function updateGoalsUI() {
    const goalsContainer = document.getElementById('pacGoals');
    if (!goalsContainer) return;
    
    goalsContainer.innerHTML = _goals.map(goal => {
      const category = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.other;
      const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
      const isCompleted = goal.completed;
      const daysUntilDeadline = goal.deadline ? 
        Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      
      return `
        <div class="pac-goal ${isCompleted ? 'completed' : ''}">
          <div class="goal-header">
            <div class="goal-info">
              <h4>${category.icon} ${goal.name}</h4>
              <div class="goal-category">${category.label}</div>
              ${goal.deadline ? `<div class="goal-deadline">Scadenza: ${new Date(goal.deadline).toLocaleDateString('it-IT')}</div>` : ''}
            </div>
            <div class="goal-actions">
              <button class="btn-sm" onclick="PAC.editGoal('${goal.id}')">✏️</button>
              <button class="btn-sm danger" onclick="PAC.deleteGoal('${goal.id}')">🗑️</button>
            </div>
          </div>
          
          <div class="goal-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(progress, 100)}%; background: ${category.color}"></div>
            </div>
            <div class="progress-text">${Math.round(progress)}% completato</div>
          </div>
          
          <div class="goal-details">
            <div class="goal-amounts">
              <div class="amount-row">
                <span>Attuale:</span>
                <strong>${formatCurrency(goal.current)}</strong>
              </div>
              <div class="amount-row">
                <span>Obiettivo:</span>
                <strong>${formatCurrency(goal.target)}</strong>
              </div>
              <div class="amount-row">
                <span>Mensile:</span>
                <strong>${formatCurrency(goal.monthlyContribution)}</strong>
              </div>
            </div>
            
            ${!isCompleted ? `
              <div class="goal-actions-row">
                <input type="number" id="addAmount_${goal.id}" placeholder="Importo da aggiungere" step="0.01">
                <button class="btn-a btn-g" onclick="PAC.addContribution('${goal.id}')">Aggiungi</button>
              </div>
            ` : `
              <div class="goal-completed">
                ✅ Obiettivo raggiunto il ${new Date(goal.completedAt).toLocaleDateString('it-IT')}
              </div>
            `}
          </div>
          
          ${goal.milestones && goal.milestones.length > 0 ? `
            <div class="goal-milestones">
              <h5>Tappe raggiunte:</h5>
              <div class="milestones-list">
                ${goal.milestones.map(milestone => `
                  <div class="milestone">
                    <span class="milestone-label">${milestone.milestone}</span>
                    <span class="milestone-date">${new Date(milestone.achievedAt).toLocaleDateString('it-IT')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    updateGoalsSummary();
  }

  function updatePlansUI() {
    const plansContainer = document.getElementById('pacPlans');
    if (!plansContainer) return;
    
    plansContainer.innerHTML = _savingsPlans.map(plan => {
      const projection = calculatePlanProjection(plan);
      const isActive = plan.isActive;
      
      return `
        <div class="pac-plan ${isActive ? 'active' : ''}">
          <div class="plan-header">
            <div class="plan-info">
              <h4>📈 ${plan.name}</h4>
              <div class="plan-details">
                ${plan.duration} mesi • ${plan.interestRate}% interesse annuo
              </div>
            </div>
            <div class="plan-actions">
              <button class="btn-sm" onclick="PAC.editPlan('${plan.id}')">✏️</button>
              <button class="btn-sm ${isActive ? 'danger' : 'btn-g'}" onclick="PAC.togglePlan('${plan.id}')">
                ${isActive ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
          
          <div class="plan-projection">
            <div class="projection-summary">
              <div class="summary-row">
                <span>Deposito mensile:</span>
                <strong>${formatCurrency(plan.monthlyAmount)}</strong>
              </div>
              <div class="summary-row">
                <span>Importo finale:</span>
                <strong>${formatCurrency(projection?.finalAmount || 0)}</strong>
              </div>
              <div class="summary-row">
                <span>Interessi totali:</span>
                <strong>${formatCurrency(projection?.totalInterest || 0)}</strong>
              </div>
            </div>
            
            ${projection?.projection ? `
              <div class="projection-chart">
                <canvas id="projectionChart_${plan.id}" width="300" height="150"></canvas>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    updatePlansSummary();
  }

  function updateGoalsSummary() {
    const summary = generateSavingsReport();
    const summaryEl = document.getElementById('pacSummary');
    
    if (!summaryEl) return;
    
    summaryEl.innerHTML = `
      <div class="pac-summary-cards">
        <div class="summary-card">
          <div class="summary-icon">🎯</div>
          <div class="summary-content">
            <div class="summary-label">Obiettivi totali</div>
            <div class="summary-value">${summary.totalGoals}</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon">✅</div>
          <div class="summary-content">
            <div class="summary-label">Completati</div>
            <div class="summary-value">${summary.completedGoals}</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <div class="summary-label">Progresso totale</div>
            <div class="summary-value">${Math.round(summary.overallProgress)}%</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon">💰</div>
          <div class="summary-content">
            <div class="summary-label">Risparmiato</div>
            <div class="summary-value">${formatCurrency(summary.totalSaved)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function updatePlansSummary() {
    const plan = calculateMonthlySavingsPlan();
    const summaryEl = document.getElementById('pacPlansSummary');
    
    if (!summaryEl) return;
    
    summaryEl.innerHTML = `
      <div class="plan-summary">
        <h4>Riepilogo Piano Mensile</h4>
        <div class="summary-row">
          <span>Contribuzione totale:</span>
          <strong>${formatCurrency(plan.totalMonthlyContribution)}</strong>
        </div>
        <div class="summary-row">
          <span>Consigliato:</span>
          <strong>${formatCurrency(plan.recommendedMonthlySavings)}</strong>
        </div>
        <div class="summary-row ${plan.isOnTrack ? 'on-track' : 'off-track'}">
          <span>Stato:</span>
          <strong>${plan.isOnTrack ? '✅ In linea' : '⚠️ Sotto il consigliato'}</strong>
        </div>
        ${plan.deficit > 0 ? `
          <div class="summary-row warning">
            <span>Da integrare:</span>
            <strong>${formatCurrency(plan.deficit)}</strong>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─── MODALS ───────────────────────────────────────────────
  function showGoalModal(goalId = null) {
    const goal = goalId ? _goals.find(g => g.id === goalId) : null;
    const isEdit = !!goal;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <h3>${isEdit ? '✏️ Modifica Obiettivo' : '🎯 Nuovo Obiettivo'}</h3>
        <div class="modal-body">
          <div class="fg">
            <label>Nome Obiettivo *</label>
            <input type="text" class="fc" id="goalName" value="${goal?.name || ''}" placeholder="Es: Fondo emergenza">
          </div>
          <div class="fg">
            <label>Descrizione</label>
            <textarea class="fc" id="goalDescription" rows="3" placeholder="Descrizione dell'obiettivo...">${goal?.description || ''}</textarea>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Importo obiettivo (€) *</label>
              <input type="number" class="fc" id="goalTarget" value="${goal?.target || ''}" step="0.01" placeholder="1000.00">
            </div>
            <div class="fg">
              <label>Importo attuale (€)</label>
              <input type="number" class="fc" id="goalCurrent" value="${goal?.current || ''}" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Contribuzione mensile (€)</label>
              <input type="number" class="fc" id="goalMonthlyContribution" value="${goal?.monthlyContribution || ''}" step="0.01" placeholder="100.00">
            </div>
            <div class="fg">
              <label>Scadenza</label>
              <input type="date" class="fc" id="goalDeadline" value="${goal?.deadline ? goal.deadline.slice(0,10) : ''}">
            </div>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Categoria</label>
              <select class="fc" id="goalCategory">
                ${Object.entries(GOAL_CATEGORIES).map(([key, cat]) => 
                  `<option value="${key}" ${goal?.category === key ? 'selected' : ''}>${cat.icon} ${cat.label}</option>`
                ).join('')}
              </select>
            </div>
            <div class="fg">
              <label>Priorità</label>
              <select class="fc" id="goalPriority">
                <option value="low" ${goal?.priority === 'low' ? 'selected' : ''}>🟢 Bassa</option>
                <option value="medium" ${goal?.priority === 'medium' ? 'selected' : ''}>🟡 Media</option>
                <option value="high" ${goal?.priority === 'high' ? 'selected' : ''}>🔴 Alta</option>
              </select>
            </div>
          </div>
          <div class="fg">
            <label class="checkbox-label">
              <input type="checkbox" id="goalAutoCalculate" ${goal?.autoCalculate !== false ? 'checked' : ''}>
              Calcola automaticamente contribuzione mensile
            </label>
          </div>
          <div class="btn-row">
            <button class="btn-a btn-d" onclick="this.closest('.modal-overlay').remove()">Annulla</button>
            <button class="btn-a btn-g" onclick="PAC.saveGoal('${goalId || ''}')">${isEdit ? 'Aggiorna' : 'Crea'}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  function showPlanModal(planId = null) {
    const plan = planId ? _savingsPlans.find(p => p.id === planId) : null;
    const isEdit = !!plan;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <h3>${isEdit ? '✏️ Modifica Piano' : '📈 Nuovo Piano di Risparmio'}</h3>
        <div class="modal-body">
          <div class="fg">
            <label>Nome Piano *</label>
            <input type="text" class="fc" id="planName" value="${plan?.name || ''}" placeholder="Es: Piano Casa 2024">
          </div>
          <div class="fg">
            <label>Descrizione</label>
            <textarea class="fc" id="planDescription" rows="3" placeholder="Descrizione del piano...">${plan?.description || ''}</textarea>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Deposito mensile (€) *</label>
              <input type="number" class="fc" id="planMonthlyAmount" value="${plan?.monthlyAmount || ''}" step="0.01" placeholder="200.00">
            </div>
            <div class="fg">
              <label>Durata (mesi) *</label>
              <input type="number" class="fc" id="planDuration" value="${plan?.duration || 12}" min="1" max="360" placeholder="12">
            </div>
          </div>
          <div class="row-2">
            <div class="fg">
              <label>Tasso interesse (%)</label>
              <input type="number" class="fc" id="planInterestRate" value="${plan?.interestRate || 0}" step="0.01" min="0" max="100" placeholder="2.5">
            </div>
            <div class="fg">
              <label>Giorno deposito</label>
              <input type="number" class="fc" id="planDepositDay" value="${plan?.depositDay || 1}" min="1" max="28" placeholder="1">
            </div>
          </div>
          <div class="fg">
            <label class="checkbox-label">
              <input type="checkbox" id="planAutoDeposit" ${plan?.autoDeposit ? 'checked' : ''}>
              Deposito automatico mensile
            </label>
          </div>
          <div class="fg">
            <label>Obiettivo collegato (opzionale)</label>
            <select class="fc" id="planGoalId">
              <option value="">Nessuno</option>
              ${_goals.filter(g => !g.completed).map(goal => 
                `<option value="${goal.id}" ${plan?.goalId === goal.id ? 'selected' : ''}>${goal.name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="btn-row">
            <button class="btn-a btn-d" onclick="this.closest('.modal-overlay').remove()">Annulla</button>
            <button class="btn-a btn-g" onclick="PAC.savePlan('${planId || ''}')">${isEdit ? 'Aggiorna' : 'Crea'}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  // ─── SAVE FUNCTIONS ───────────────────────────────────────
  async function saveGoal(goalId) {
    const name = document.getElementById('goalName').value.trim();
    const description = document.getElementById('goalDescription').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value);
    const monthlyContribution = parseFloat(document.getElementById('goalMonthlyContribution').value);
    const deadline = document.getElementById('goalDeadline').value;
    const category = document.getElementById('goalCategory').value;
    const priority = document.getElementById('goalPriority').value;
    const autoCalculate = document.getElementById('goalAutoCalculate').checked;
    
    if (!name || !target) {
      alert('Nome e importo obiettivo sono obbligatori');
      return;
    }
    
    const goalData = {
      name,
      description,
      target,
      current,
      monthlyContribution,
      deadline,
      category,
      priority,
      autoCalculate
    };
    
    try {
      if (goalId) {
        await updateGoal(goalId, goalData);
        alert('Obiettivo aggiornato con successo!');
      } else {
        await createGoal(goalData);
        alert('Obiettivo creato con successo!');
      }
      
      document.querySelector('.modal-overlay').remove();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  }

  async function savePlan(planId) {
    const name = document.getElementById('planName').value.trim();
    const description = document.getElementById('planDescription').value.trim();
    const monthlyAmount = parseFloat(document.getElementById('planMonthlyAmount').value);
    const duration = parseInt(document.getElementById('planDuration').value);
    const interestRate = parseFloat(document.getElementById('planInterestRate').value);
    const depositDay = parseInt(document.getElementById('planDepositDay').value);
    const autoDeposit = document.getElementById('planAutoDeposit').checked;
    const goalId = document.getElementById('planGoalId').value;
    
    if (!name || !monthlyAmount || !duration) {
      alert('Nome, deposito mensile e durata sono obbligatori');
      return;
    }
    
    const planData = {
      name,
      description,
      monthlyAmount,
      duration,
      interestRate,
      depositDay,
      autoDeposit,
      goalId
    };
    
    try {
      if (planId) {
        await updateSavingsPlan(planId, planData);
        alert('Piano aggiornato con successo!');
      } else {
        await createSavingsPlan(planData);
        alert('Piano creato con successo!');
      }
      
      document.querySelector('.modal-overlay').remove();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  }

  // ─── REALTIME HANDLERS ───────────────────────────────────
  function onGoalAdded(snap) {
    const goal = { id: snap.key, ...snap.val() };
    _goals.push(goal);
    updateGoalsUI();
  }

  function onGoalUpdated(snap) {
    const goalId = snap.key;
    const updates = snap.val();
    const index = _goals.findIndex(g => g.id === goalId);
    
    if (index !== -1) {
      _goals[index] = { ..._goals[index], ...updates };
      updateGoalsUI();
    }
  }

  function onGoalRemoved(snap) {
    const goalId = snap.key;
    _goals = _goals.filter(g => g.id !== goalId);
    updateGoalsUI();
  }

  function onPlanAdded(snap) {
    const plan = { id: snap.key, ...snap.val() };
    _savingsPlans.push(plan);
    updatePlansUI();
  }

  function onPlanUpdated(snap) {
    const planId = snap.key;
    const updates = snap.val();
    const index = _savingsPlans.findIndex(p => p.id === planId);
    
    if (index !== -1) {
      _savingsPlans[index] = { ..._savingsPlans[index], ...updates };
      updatePlansUI();
    }
  }

  function onPlanRemoved(snap) {
    const planId = snap.key;
    _savingsPlans = _savingsPlans.filter(p => p.id !== planId);
    updatePlansUI();
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
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    createSavingsPlan,
    updateSavingsPlan,
    calculateOptimalMonthlyContribution,
    calculateMonthlySavingsPlan,
    generateSavingsReport,
    showGoalModal,
    showPlanModal,
    saveGoal,
    savePlan,
    editGoal: showGoalModal,
    editPlan: showPlanModal,
    togglePlan: async (planId) => {
      const plan = _savingsPlans.find(p => p.id === planId);
      if (plan) {
        await updateSavingsPlan(planId, { isActive: !plan.isActive });
      }
    },
    GOAL_CATEGORIES
  };

})();
