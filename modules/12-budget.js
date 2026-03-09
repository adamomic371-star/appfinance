
// BUDGET.JS - Gestione budget

function loadBudgets() {
  if (!user) return {};
  const stored = localStorage.getItem('fp_budgets_' + user.id);
  return stored ? JSON.parse(stored) : {};
}

function saveBudgets(budgets) {
  if (!user) return;
  localStorage.setItem('fp_budgets_' + user.id, JSON.stringify(budgets));
  console.log('✅ Budgets saved');
}

function setBudget(category, amount) {
  const budgets = loadBudgets();
  budgets[category] = amount;
  saveBudgets(budgets);
  return budgets;
}

console.log('✅ budget.js loaded');
