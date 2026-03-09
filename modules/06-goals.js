
// GOALS.JS - Gestione obiettivi

function loadGoals() {
  if (!user) return [];
  const stored = localStorage.getItem('fp_goals_' + user.id);
  return stored ? JSON.parse(stored) : [];
}

function saveGoals(goals) {
  if (!user) return;
  localStorage.setItem('fp_goals_' + user.id, JSON.stringify(goals));
  console.log('✅ Goals saved:', goals.length);
}

function addGoal(goal) {
  const goals = loadGoals();
  goal.id = Date.now().toString();
  goal.createdAt = new Date().toISOString();
  goals.push(goal);
  saveGoals(goals);
  return goal;
}

function updateGoal(id, updates) {
  const goals = loadGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index >= 0) {
    goals[index] = { ...goals[index], ...updates };
    saveGoals(goals);
  }
}

function deleteGoal(id) {
  let goals = loadGoals();
  goals = goals.filter(g => g.id !== id);
  saveGoals(goals);
}

console.log('✅ goals.js loaded');
