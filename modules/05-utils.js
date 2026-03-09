
// UTILS.JS - Utility functions

function showNotification(msg, type = 'success', duration = 3000) {
  const n = document.createElement('div');
  const colors = {
    success: 'rgba(0, 229, 160, 0.9)',
    error: 'rgba(255, 79, 109, 0.9)',
    warning: 'rgba(255, 209, 102, 0.9)',
    info: 'rgba(0, 212, 255, 0.9)'
  };
  
  n.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: ${colors[type] || colors.success};
    color: #fff; padding: 14px 18px;
    border-radius: 12px; font-size: 11px; font-weight: 600;
    z-index: 1000; animation: slideUp 0.3s ease;
    max-width: 300px;
  `;
  n.textContent = msg;
  
  if (document.body) {
    document.body.appendChild(n);
  }
  
  setTimeout(() => {
    n.style.opacity = '0';
    n.style.transition = 'opacity 0.3s ease';
    setTimeout(() => n.remove(), 300);
  }, duration);
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('it-IT');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

console.log('✅ utils.js loaded');
