
// REPORTS.JS - Report e statistiche

function generateMonthlyReport(year, month) {
  const txs = loadTransactions();
  const monthTxs = txs.filter(t => {
    const d = new Date(t.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  
  const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  return {
    income: income,
    expense: expense,
    balance: income - expense,
    transactions: monthTxs.length
  };
}

function getYearlyReport(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    months.push(generateMonthlyReport(year, m));
  }
  return months;
}

console.log('✅ reports.js loaded');
