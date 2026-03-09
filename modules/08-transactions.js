
// TRANSACTIONS.JS - Gestione transazioni

function loadTransactions() {
  if (!user) return [];
  const stored = localStorage.getItem('fp_transactions_' + user.id);
  return stored ? JSON.parse(stored) : [];
}

function saveTransactions(txs) {
  if (!user) return;
  localStorage.setItem('fp_transactions_' + user.id, JSON.stringify(txs));
  console.log('✅ Transactions saved:', txs.length);
}

function addTransaction(tx) {
  const txs = loadTransactions();
  tx.id = Date.now().toString();
  tx.createdAt = new Date().toISOString();
  txs.push(tx);
  saveTransactions(txs);
  return tx;
}

function deleteTransaction(id) {
  let txs = loadTransactions();
  txs = txs.filter(t => t.id !== id);
  saveTransactions(txs);
}

console.log('✅ transactions.js loaded');
