// 05-UTILS.JS - Utility: notifiche, formattazione, helpers

// ---- NOTIFICATIONS ----
let notifContainer = null;

function showNotification(msg, type = 'info', duration = 3000) {
  if (!notifContainer) {
    notifContainer = document.createElement('div');
    notifContainer.className = 'notification-container';
    document.body.appendChild(notifContainer);
  }

  const el = document.createElement('div');
  el.className = `notification ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  notifContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
  }, duration);
}

// ---- DATE FORMATTING ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function getMonthName(month) {
  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  return months[month] || '';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function monthKey(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 7); // YYYY-MM
}

// ---- CURRENCY FORMATTING ----
function formatCurrency(amount, symbol = '€') {
  if (amount === undefined || amount === null || isNaN(amount)) return symbol + '0,00';
  const n = parseFloat(amount);
  return symbol + Math.abs(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyFull(amount) {
  if (isNaN(parseFloat(amount))) return '€0,00';
  const n = parseFloat(amount);
  const sign = n < 0 ? '-' : '';
  return sign + '€' + Math.abs(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- UNIQUE ID ----
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ---- DEBOUNCE ----
function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ---- NUMBER HELPERS ----
function parseAmount(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[€\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ---- CATEGORY HELPERS ----
function getCategoryInfo(catId) {
  const all = [...(CATEGORIES.income || []), ...(CATEGORIES.expense || [])];
  return all.find(c => c.id === catId) || { id: catId, label: catId, icon: '📦' };
}

function getCategoryIcon(catId) {
  return getCategoryInfo(catId).icon;
}

function getCategoryLabel(catId) {
  return getCategoryInfo(catId).label;
}

// ---- PERCENT ----
function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

// ---- LOCAL STORAGE HELPERS ----
function lsGet(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) { return fallback; }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function lsDel(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// ---- CONFIRM DIALOG ----
function showConfirm(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet" style="text-align:center;padding:30px 20px;">
      <div style="font-size:36px;margin-bottom:16px;">⚠️</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px;color:#f0f4ff;">${msg}</div>
      <div style="display:flex;gap:12px;margin-top:24px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">Annulla</button>
        <button class="btn btn-danger" style="flex:1;" id="confirmOk">Conferma</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmOk').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

console.log('✅ utils.js loaded');
