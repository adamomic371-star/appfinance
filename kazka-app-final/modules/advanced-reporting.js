/**
 * ╔════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — advanced-reporting.js                  ║
 * ║  Advanced reporting and analytics with insights          ║
 * ╚════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const AdvancedReporting = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _currentUser = null;
  let _transactions = [];
  let _accounts = [];
  let _categories = [];
  let _reports = [];

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
    
    KZ.onChildAdded(`users/${_currentUser.uid}/accounts`, onAccountAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/accounts`, onAccountUpdated);
    
    KZ.onChildAdded(`users/${_currentUser.uid}/reports`, onReportAdded);
    KZ.onChildChanged(`users/${_currentUser.uid}/reports`, onReportUpdated);
  }

  // ─── DATA LOADING ───────────────────────────────────────
  async function loadData() {
    if (!_currentUser) return;
    
    try {
      const [transactionsSnap, accountsSnap, reportsSnap] = await Promise.all([
        KZ.get(`users/${_currentUser.uid}/transactions`),
        KZ.get(`users/${_currentUser.uid}/accounts`),
        KZ.get(`users/${_currentUser.uid}/reports`)
      ]);
      
      _transactions = transactionsSnap.val() ? Object.entries(transactionsSnap.val()).map(([id, tx]) => ({
        id,
        ...tx,
        amount: parseFloat(tx.amount || 0),
        type: tx.type || 'expense',
        category: tx.category || 'other',
        date: tx.createdAt || new Date().toISOString()
      })) : [];
      
      _accounts = accountsSnap.val() ? Object.entries(accountsSnap.val()).map(([id, acc]) => ({
        id,
        ...acc,
        balance: parseFloat(acc.balance || 0),
        type: acc.type || 'bank'
      })) : [];
      
      _reports = reportsSnap.val() ? Object.entries(reportsSnap.val()).map(([id, report]) => ({
        id,
        ...report,
        createdAt: report.createdAt || new Date().toISOString()
      })) : [];
      
      updateUI();
    } catch (error) {
      console.error('Error loading advanced reporting data:', error);
    }
  }

  // ─── REPORT GENERATION ───────────────────────────────────
  async function generateReport(reportType, parameters = {}) {
    const report = {
      type: reportType,
      parameters,
      createdAt: new Date().toISOString(),
      generatedBy: _currentUser.uid,
      status: 'generating'
    };
    
    const reportId = KZ.push(`users/${_currentUser.uid}/reports`).key;
    await KZ.set(`users/${_currentUser.uid}/reports/${reportId}`, { ...report, id: reportId });
    
    let reportData;
    
    switch (reportType) {
      case 'monthly_summary':
        reportData = generateMonthlySummaryReport(parameters);
        break;
      case 'category_analysis':
        reportData = generateCategoryAnalysisReport(parameters);
        break;
      case 'account_performance':
        reportData = generateAccountPerformanceReport(parameters);
        break;
      case 'cash_flow':
        reportData = generateCashFlowReport(parameters);
        break;
      case 'tax_summary':
        reportData = generateTaxSummaryReport(parameters);
        break;
      case 'custom':
        reportData = generateCustomReport(parameters);
        break;
      default:
        throw new Error('Unknown report type');
    }
    
    await KZ.update(`users/${_currentUser.uid}/reports/${reportId}`, {
      ...reportData,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
    
    return { reportId, data: reportData };
  }

  function generateMonthlySummaryReport(params) {
    const { year = new Date().getFullYear(), month = null } = params;
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== null ? month : now.getMonth();
    
    const monthTransactions = _transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === targetYear && txDate.getMonth() === targetMonth;
    });
    
    const income = monthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = monthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const netCashFlow = income - expenses;
    const topExpenseCategories = getTopCategories(monthTransactions.filter(tx => tx.type === 'expense'), 5);
    const topIncomeCategories = getTopCategories(monthTransactions.filter(tx => tx.type === 'income'), 3);
    
    return {
      title: `Report Mensile ${new Date(targetYear, targetMonth).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`,
      period: { year: targetYear, month: targetMonth },
      summary: {
        totalTransactions: monthTransactions.length,
        totalIncome: income,
        totalExpenses: expenses,
        netCashFlow,
        averageTransaction: monthTransactions.length > 0 ? (income + expenses) / monthTransactions.length : 0
      },
      categories: {
        topExpenses: topExpenseCategories,
        topIncome: topIncomeCategories
      },
      insights: generateInsights(monthTransactions, income, expenses),
      recommendations: generateRecommendations(income, expenses, netCashFlow)
    };
  }

  function generateCategoryAnalysisReport(params) {
    const { period = 'year', categories = null } = params;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, 0, 1);
    }
    
    const periodTransactions = _transactions.filter(tx => new Date(tx.date) >= startDate);
    
    let categoryData = {};
    
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        categoryData[cat] = periodTransactions.filter(tx => tx.category === cat);
      });
    } else {
      // Analyze all categories
      _categories.forEach(cat => {
        categoryData[cat.id] = periodTransactions.filter(tx => tx.category === cat.id);
      });
    }
    
    const categoryAnalysis = Object.entries(categoryData).map(([categoryId, txs]) => {
      const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
      const average = txs.length > 0 ? total / txs.length : 0;
      const income = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
      const expenses = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
      
      return {
        categoryId,
        categoryName: getCategoryName(categoryId),
        total,
        average,
        transactionCount: txs.length,
        income,
        expenses,
        netFlow: income - expenses,
        percentage: calculatePercentageChange(total, periodTransactions)
      };
    }).sort((a, b) => b.total - a.total);
    
    return {
      title: `Analisi Categorie - ${period}`,
      period: { startDate: startDate.toISOString(), endDate: now.toISOString() },
      categories: categoryAnalysis,
      summary: {
        totalCategories: categoryAnalysis.length,
        totalTransactions: periodTransactions.length,
        topCategory: categoryAnalysis[0],
        averagePerCategory: categoryAnalysis.length > 0 ? categoryAnalysis.reduce((sum, cat) => sum + cat.total, 0) / categoryAnalysis.length : 0
      },
      trends: calculateCategoryTrends(categoryData)
    };
  }

  function generateAccountPerformanceReport(params) {
    const { accountId = null, period = 'month' } = params;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    let accountsToAnalyze = _accounts;
    if (accountId) {
      accountsToAnalyze = _accounts.filter(acc => acc.id === accountId);
    }
    
    const accountPerformance = accountsToAnalyze.map(account => {
      const accountTransactions = _transactions.filter(tx => 
        tx.accountId === account.id && new Date(tx.date) >= startDate
      );
      
      const income = accountTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expenses = accountTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const netFlow = income - expenses;
      const currentBalance = account.balance;
      const openingBalance = currentBalance - netFlow;
      
      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        openingBalance,
        closingBalance: currentBalance,
        income,
        expenses,
        netFlow,
        transactionCount: accountTransactions.length,
        averageTransaction: accountTransactions.length > 0 ? (income + expenses) / accountTransactions.length : 0,
        performance: calculateAccountPerformance(openingBalance, currentBalance, income)
      };
    });
    
    return {
      title: `Performance Account - ${period}`,
      period: { startDate: startDate.toISOString(), endDate: now.toISOString() },
      accounts: accountPerformance,
      summary: {
        totalAccounts: accountPerformance.length,
        bestPerformer: accountPerformance.reduce((best, acc) => 
          acc.performance.score > best.performance.score ? acc : best, accountPerformance[0]),
        worstPerformer: accountPerformance.reduce((worst, acc) => 
          acc.performance.score < worst.performance.score ? acc : worst, accountPerformance[0]),
        averagePerformance: accountPerformance.length > 0 ? 
          accountPerformance.reduce((sum, acc) => sum + acc.performance.score, 0) / accountPerformance.length : 0
      }
    };
  }

  function generateCashFlowReport(params) {
    const { period = 'quarter', granularity = 'monthly' } = params;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    const periodTransactions = _transactions.filter(tx => new Date(tx.date) >= startDate);
    
    let cashFlowData = [];
    
    if (granularity === 'monthly') {
      const monthlyData = groupTransactionsByMonth(periodTransactions);
      cashFlowData = Object.entries(monthlyData).map(([month, txs]) => {
        const income = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expenses = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        
        return {
          period: month,
          income,
          expenses,
          netCashFlow: income - expenses,
          transactionCount: txs.length,
          averageDaily: (income + expenses) / 30
        };
      });
    } else if (granularity === 'weekly') {
      const weeklyData = groupTransactionsByWeek(periodTransactions);
      cashFlowData = Object.entries(weeklyData).map(([week, txs]) => {
        const income = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expenses = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        
        return {
          period: week,
          income,
          expenses,
          netCashFlow: income - expenses,
          transactionCount: txs.length
        };
      });
    }
    
    return {
      title: `Report Cash Flow - ${period}`,
      period: { startDate: startDate.toISOString(), endDate: now.toISOString() },
      granularity,
      data: cashFlowData,
      summary: {
        totalIncome: cashFlowData.reduce((sum, period) => sum + period.income, 0),
        totalExpenses: cashFlowData.reduce((sum, period) => sum + period.expenses, 0),
        totalNetFlow: cashFlowData.reduce((sum, period) => sum + period.netCashFlow, 0),
        averagePeriodNetFlow: cashFlowData.length > 0 ? 
          cashFlowData.reduce((sum, period) => sum + period.netCashFlow, 0) / cashFlowData.length : 0
      },
      trends: calculateCashFlowTrends(cashFlowData)
    };
  }

  function generateTaxSummaryReport(params) {
    const { year = new Date().getFullYear(), includeBusiness = false } = params;
    const yearTransactions = _transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === year;
    });
    
    const businessTransactions = includeBusiness ? 
      yearTransactions.filter(tx => tx.category && tx.category.startsWith('business_')) : [];
    
    const personalTransactions = yearTransactions.filter(tx => !tx.category || !tx.category.startsWith('business_'));
    
    const totalIncome = personalTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const deductibleExpenses = personalTransactions
      .filter(tx => tx.type === 'expense' && isDeductibleExpense(tx.category))
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const businessDeductible = businessTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalDeductible = deductibleExpenses + businessDeductible;
    
    return {
      title: `Report Fiscale - ${year}`,
      year,
      personal: {
        totalIncome,
        deductibleExpenses,
        taxableIncome: Math.max(0, totalIncome - deductibleExpenses),
        estimatedTax: calculateEstimatedTax(Math.max(0, totalIncome - deductibleExpenses))
      },
      business: includeBusiness ? {
        totalIncome: businessTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        deductibleExpenses: businessDeductible,
        taxableIncome: Math.max(0, businessTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0) - businessDeductible),
        estimatedTax: calculateEstimatedTax(Math.max(0, businessTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0) - businessDeductible))
      } : null,
      summary: {
        totalDeductible,
        totalEstimatedTax: calculateEstimatedTax(Math.max(0, totalIncome - totalDeductible)) + 
                       (includeBusiness ? calculateEstimatedTax(Math.max(0, businessTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0) - businessDeductible)) : 0)
      },
      recommendations: generateTaxRecommendations(totalIncome, totalDeductible)
    };
  }

  function generateCustomReport(params) {
    const { 
      title = 'Report Personalizzato',
      filters = {},
      metrics = ['total', 'average', 'count'],
      groupBy = 'category'
    } = params;
    
    let filteredTransactions = [..._transactions];
    
    // Apply filters
    if (filters.dateFrom) {
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) <= new Date(filters.dateTo));
    }
    if (filters.categories && filters.categories.length > 0) {
      filteredTransactions = filteredTransactions.filter(tx => filters.categories.includes(tx.category));
    }
    if (filters.types) {
      filteredTransactions = filteredTransactions.filter(tx => filters.types.includes(tx.type));
    }
    
    // Group data
    let groupedData = {};
    if (groupBy === 'category') {
      groupedData = groupTransactionsByCategory(filteredTransactions);
    } else if (groupBy === 'month') {
      groupedData = groupTransactionsByMonth(filteredTransactions);
    } else if (groupBy === 'account') {
      groupedData = groupTransactionsByAccount(filteredTransactions);
    }
    
    // Calculate metrics
    const reportData = {
      title,
      filters,
      groupedData,
      summary: {
        totalTransactions: filteredTransactions.length,
        totalAmount: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        averageAmount: filteredTransactions.length > 0 ? 
          filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) / filteredTransactions.length : 0,
        metrics: metrics.map(metric => calculateMetric(filteredTransactions, metric))
      }
    };
    
    return reportData;
  }

  // ─── UTILITY FUNCTIONS ───────────────────────────────
  function getTopCategories(transactions, limit = 5) {
    const categoryTotals = {};
    
    transactions.forEach(tx => {
      const cat = tx.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
    });
    
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([catId, total]) => ({
        categoryId: catId,
        categoryName: getCategoryName(catId),
        total,
        transactionCount: transactions.filter(tx => tx.category === catId).length
      }));
  }

  function getCategoryName(categoryId) {
    const category = _categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  }

  function calculatePercentageChange(value, totalTransactions) {
    const total = totalTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    return total > 0 ? (value / total) * 100 : 0;
  }

  function groupTransactionsByMonth(transactions) {
    const grouped = {};
    
    transactions.forEach(tx => {
      const month = new Date(tx.date).toISOString().slice(0, 7); // YYYY-MM
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(tx);
    });
    
    return grouped;
  }

  function groupTransactionsByWeek(transactions) {
    const grouped = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD
      
      if (!grouped[weekKey]) grouped[weekKey] = [];
      grouped[weekKey].push(tx);
    });
    
    return grouped;
  }

  function groupTransactionsByCategory(transactions) {
    const grouped = {};
    
    transactions.forEach(tx => {
      const cat = tx.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(tx);
    });
    
    return grouped;
  }

  function groupTransactionsByAccount(transactions) {
    const grouped = {};
    
    transactions.forEach(tx => {
      const acc = tx.accountId || 'default';
      if (!grouped[acc]) grouped[acc] = [];
      grouped[acc].push(tx);
    });
    
    return grouped;
  }

  function calculateMetric(transactions, metric) {
    switch (metric) {
      case 'total':
        return transactions.reduce((sum, tx) => sum + tx.amount, 0);
      case 'average':
        return transactions.length > 0 ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length : 0;
      case 'count':
        return transactions.length;
      case 'max':
        return transactions.length > 0 ? Math.max(...transactions.map(tx => tx.amount)) : 0;
      case 'min':
        return transactions.length > 0 ? Math.min(...transactions.map(tx => tx.amount)) : 0;
      default:
        return 0;
    }
  }

  function isDeductibleExpense(category) {
    const deductibleCategories = [
      'medical', 'education', 'business_expenses', 'charity', 
      'home_office', 'professional_development', 'travel_business'
    ];
    return deductibleCategories.includes(category);
  }

  function calculateEstimatedTax(taxableIncome) {
    // Simplified Italian tax calculation (IRPEF)
    const brackets = [
      { min: 0, max: 15000, rate: 0.23 },
      { min: 15001, max: 28000, rate: 0.27 },
      { min: 28001, max: 50000, rate: 0.35 },
      { min: 50001, max: 75000, rate: 0.37 },
      { min: 75001, max: Infinity, rate: 0.43 }
    ];
    
    let tax = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min + 1);
        tax += taxableInBracket * bracket.rate;
      }
    }
    
    return Math.round(tax);
  }

  function calculateAccountPerformance(openingBalance, closingBalance, income) {
    const totalReturn = closingBalance - openingBalance;
    const returnRate = openingBalance !== 0 ? (totalReturn / openingBalance) * 100 : 0;
    
    let score = 50; // Neutral score
    if (returnRate > 10) score += 30;
    else if (returnRate > 5) score += 20;
    else if (returnRate > 0) score += 10;
    else if (returnRate < -5) score -= 20;
    else if (returnRate < -10) score -= 30;
    
    if (income > 1000) score += 10; // Reward active accounts
    
    return {
      totalReturn,
      returnRate,
      score: Math.max(0, Math.min(100, score)),
      grade: score >= 80 ? 'Eccellente' : 
             score >= 60 ? 'Buono' : 
             score >= 40 ? 'Sufficiente' : 'Scarso'
    };
  }

  function generateInsights(transactions, income, expenses) {
    const insights = [];
    
    // Spending pattern analysis
    const weekdays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const weekdaySpending = Array(7).fill(0);
    
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const dayIndex = new Date(tx.date).getDay();
        weekdaySpending[dayIndex] += tx.amount;
      }
    });
    
    const highestSpendingDay = weekdaySpending.indexOf(Math.max(...weekdaySpending));
    if (highestSpendingDay !== -1) {
      insights.push({
        type: 'spending_pattern',
        title: 'Pattern di spesa settimanale',
        description: `Spendi di più il ${weekdays[highestSpendingDay]} con una media di ${formatCurrency(weekdaySpending[highestSpendingDay])}`
      });
    }
    
    // Cash flow health
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    if (savingsRate < 10) {
      insights.push({
        type: 'cash_flow_warning',
        title: 'Basso tasso di risparmio',
        description: `Il tuo tasso di risparmio è del ${savingsRate.toFixed(1)}%. Considera di ridurre le spese.`
      });
    } else if (savingsRate > 30) {
      insights.push({
        type: 'cash_flow_positive',
        title: 'Ottimo tasso di risparmio',
        description: `Ottimo lavoro! Il tuo tasso di risparmio è del ${savingsRate.toFixed(1)}%.`
      });
    }
    
    return insights;
  }

  function generateRecommendations(income, expenses, netCashFlow) {
    const recommendations = [];
    
    if (netCashFlow < 0) {
      recommendations.push({
        type: 'budget_action',
        priority: 'high',
        title: 'Riequilibra il bilancio',
        description: 'Le tue spese superano le entrate. Analizza le categorie di spesa e crea un budget.',
        action: 'create_budget'
      });
    }
    
    if (expenses > income * 0.8) {
      recommendations.push({
        type: 'expense_reduction',
        priority: 'medium',
        title: 'Riduci le spese',
        description: 'Le tue spese rappresentano più dell\'80% delle entrate. Prova a ridurre le spese non essenziali.',
        action: 'review_expenses'
      });
    }
    
    if (income > 0 && netCashFlow > income * 0.2) {
      recommendations.push({
        type: 'investment_opportunity',
        priority: 'low',
        title: 'Considera investimenti',
        description: 'Hai un surplus significativo. Considera di investire parte del tuo reddito.',
        action: 'explore_investments'
      });
    }
    
    return recommendations;
  }

  function calculateCategoryTrends(categoryData) {
    const trends = Object.entries(categoryData).map(([categoryId, data]) => {
      const values = data.map(item => item.total);
      const trend = calculateTrend(values);
      
      return {
        categoryId,
        categoryName: getCategoryName(categoryId),
        trend,
        values,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        volatility: calculateVolatility(values)
      };
    });
    
    return trends.sort((a, b) => b.volatility - a.volatility).slice(0, 5); // Top 5 most volatile
  }

  function calculateCashFlowTrends(cashFlowData) {
    const values = cashFlowData.map(period => period.netCashFlow);
    const trend = calculateTrend(values);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      trend,
      average,
      values,
      volatility: calculateVolatility(values),
      forecast: generateSimpleForecast(values, 3)
    };
  }

  function calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    const threshold = Math.abs(firstAvg) * 0.1; // 10% threshold
    
    if (difference > threshold) {
      return difference > 0 ? 'increasing' : 'decreasing';
    } else {
      return 'stable';
    }
  }

  function calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  function generateSimpleForecast(values, periods) {
    if (values.length < 3) return [];
    
    const trend = calculateTrend(values);
    const lastValue = values[values.length - 1];
    const avgChange = values.length > 1 ? 
      (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
    
    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      let nextValue;
      
      if (trend === 'increasing') {
        nextValue = lastValue + (avgChange * 1.1);
      } else if (trend === 'decreasing') {
        nextValue = lastValue + (avgChange * 0.9);
      } else {
        nextValue = lastValue + avgChange;
      }
      
      forecast.push(nextValue);
    }
    
    return forecast;
  }

  function generateTaxRecommendations(income, deductibleExpenses) {
    const recommendations = [];
    
    if (deductibleExpenses < income * 0.2) {
      recommendations.push({
        type: 'tax_optimization',
        title: 'Massimizza le detrazioni fiscali',
        description: 'Potresti beneficiare di maggiori detrazioni. Considera spese mediche, educative o donazioni.',
        action: 'review_deductible_expenses'
      });
    }
    
    if (income > 15000) {
      recommendations.push({
        type: 'tax_planning',
        title: 'Pianificazione fiscale',
        description: 'Con il tuo reddito, potresti beneficiare di una consulenza fiscale professionale.',
        action: 'seek_tax_advice'
      });
    }
    
    return recommendations;
  }

  // ─── UI UPDATES ───────────────────────────────────────────
  function updateUI() {
    updateReportsList();
    updateDashboard();
  }

  function updateReportsList() {
    const reportsListEl = document.getElementById('reportsList');
    if (!reportsListEl) return;
    
    reportsListEl.innerHTML = _reports.map(report => {
      const statusClass = report.status === 'completed' ? 'completed' : 'generating';
      const statusIcon = report.status === 'completed' ? '✅' : '⏳';
      
      return `
        <div class="report-item ${statusClass}">
          <div class="report-header">
            <h4>${report.title}</h4>
            <div class="report-status">${statusIcon} ${report.status}</div>
          </div>
          <div class="report-meta">
            <span>${new Date(report.createdAt).toLocaleDateString('it-IT')}</span>
            ${report.completedAt ? `<span>Completato: ${new Date(report.completedAt).toLocaleDateString('it-IT')}</span>` : ''}
          </div>
          <div class="report-actions">
            <button class="btn-sm" onclick="AdvancedReporting.viewReport('${report.id}')">👁️ Visualizza</button>
            <button class="btn-sm" onclick="AdvancedReporting.exportReport('${report.id}')">📥 Esporta</button>
            ${report.status === 'completed' ? 
              `<button class="btn-sm" onclick="AdvancedReporting.deleteReport('${report.id}')">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateDashboard() {
    const dashboardEl = document.getElementById('reportingDashboard');
    if (!dashboardEl) return;
    
    const totalReports = _reports.length;
    const completedReports = _reports.filter(r => r.status === 'completed').length;
    const thisMonthReports = _reports.filter(r => {
      const reportDate = new Date(r.createdAt);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length;
    
    dashboardEl.innerHTML = `
      <div class="reporting-stats">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">${totalReports}</div>
            <div class="stat-label">Report Totali</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">${completedReports}</div>
            <div class="stat-label">Completati</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-number">${thisMonthReports}</div>
            <div class="stat-label">Questo Mese</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── EXPORT FUNCTIONS ───────────────────────────────────
  async function exportReport(reportId) {
    const report = _reports.find(r => r.id === reportId);
    if (!report) return;
    
    const exportData = {
      report,
      exportedAt: new Date().toISOString(),
      exportedBy: _currentUser.uid
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${report.id}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function deleteReport(reportId) {
    if (!confirm('Eliminare questo report?')) return;
    
    await KZ.remove(`users/${_currentUser.uid}/reports/${reportId}`);
  }

  function viewReport(reportId) {
    const report = _reports.find(r => r.id === reportId);
    if (!report) return;
    
    // This would open a detailed report view modal
    console.log('View report:', report);
  }

  // ─── REALTIME HANDLERS ───────────────────────────────────
  function onTransactionAdded(snap) {
    const transaction = { id: snap.key, ...snap.val() };
    _transactions.push(transaction);
    updateUI();
  }

  function onTransactionUpdated(snap) {
    const transactionId = snap.key;
    const updates = snap.val();
    const index = _transactions.findIndex(t => t.id === transactionId);
    
    if (index !== -1) {
      _transactions[index] = { ..._transactions[index], ...updates };
      updateUI();
    }
  }

  function onTransactionRemoved(snap) {
    const transactionId = snap.key;
    _transactions = _transactions.filter(t => t.id !== transactionId);
    updateUI();
  }

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

  function onReportAdded(snap) {
    const report = { id: snap.key, ...snap.val() };
    _reports.push(report);
    updateUI();
  }

  function onReportUpdated(snap) {
    const reportId = snap.key;
    const updates = snap.val();
    const index = _reports.findIndex(r => r.id === reportId);
    
    if (index !== -1) {
      _reports[index] = { ..._reports[index], ...updates };
      updateUI();
    }
  }

  // ─── UTILITIES ───────────────────────────────────────────
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
    generateReport,
    getReports: () => [..._reports],
    exportReport,
    deleteReport,
    viewReport,
    _reports: () => _reports
  };

})();
