
// RECURRING.JS - Spese ricorrenti

function loadRecurring() {
  if (!user) return [];
  const stored = localStorage.getItem('fp_recurring_' + user.id);
  return stored ? JSON.parse(stored) : [];
}

function saveRecurring(items) {
  if (!user) return;
  localStorage.setItem('fp_recurring_' + user.id, JSON.stringify(items));
  console.log('✅ Recurring saved:', items.length);
}

function addRecurring(item) {
  const items = loadRecurring();
  item.id = Date.now().toString();
  items.push(item);
  saveRecurring(items);
  return item;
}

console.log('✅ recurring.js loaded');
