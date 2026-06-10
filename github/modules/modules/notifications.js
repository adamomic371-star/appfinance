// +--------------------------------------------------------------+
// �  WARNING � FILE ORFANO / NON INTEGRATO                      �
// �  Questo file NON � caricato dall'app principale (app.html).  �
// �  Il codice eseguibile � nello script inline di app/app.html. �
// �  Mantenuto per riferimento storico � NON modificare.         �
// +--------------------------------------------------------------+
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — notifications.js                                 ║
 * ║  - Push ogni 24h "Hai aggiunto movimenti oggi?"              ║
 * ║  - Scadenze bollette, ricorrenti                             ║
 * ║  - Apple Wallet / Google Wallet integration check            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const Notifications = (() => {

  const STORAGE_KEY = uid => `kz_notifs_${uid}`;
  const DAILY_KEY   = uid => `kz_daily_check_${uid}`;
  let   _uid = null;
  let   _notifs = [];

  // ─── INIT ─────────────────────────────────────────────────
  async function init(uid) {
    _uid = uid;
    _load();
    await requestPermission();
    _scheduleDailyReminder();
    _listenForeground();
  }

  // ─── RICHIEDI PERMESSO PUSH ────────────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  // ─── NOTIFICA BROWSER ─────────────────────────────────────
  function sendBrowser(title, body, tag = 'kazka', data = {}) {
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // già in app
    const n = new Notification(title, {
      body,
      icon: './assets/icons/icon-192.png',
      badge: './assets/icons/icon-192.png',
      tag,
      data,
      requireInteraction: false,
      silent: false
    });
    n.onclick = () => { window.focus(); n.close(); };
  }

  // ─── PROMEMORIA 24H — "Hai registrato movimenti oggi?" ─────
  function _scheduleDailyReminder() {
    const now      = Date.now();
    const stored   = parseInt(localStorage.getItem(DAILY_KEY(_uid)) || '0');
    const tomorrow = stored + 24 * 60 * 60 * 1000;

    const fire = () => {
      const today = new Date().toISOString().split('T')[0];
      // Controlla se l'utente ha già aggiunto movimenti OGGI
      // (questo viene valutato al momento del fire, non al boot)
      KZ.ref(`users/${_uid}/transactions`)
        .orderByChild('createdAt')
        .startAt(today)
        .once('value', snap => {
          const count = Object.keys(snap.val() || {}).length;
          if (count === 0) {
            sendBrowser(
              '💰 Kazka — Nessun movimento oggi',
              'Non hai ancora registrato entrate o uscite oggi. Un secondo per tenere i conti in ordine!',
              'daily-reminder'
            );
            push({
              id:     'daily_' + today,
              type:   'reminder',
              icon:   '📅',
              title:  'Nessun movimento registrato oggi',
              sub:    'Ricordati di aggiungere entrate e uscite di oggi',
              time:   Date.now(),
              read:   false,
              action: 'transazioni'
            });
          }
          localStorage.setItem(DAILY_KEY(_uid), String(Date.now()));
          _scheduleDailyReminder(); // ripianifica domani
        });
    };

    if (now >= tomorrow) {
      // Già passate 24h — aspetta 30 secondi dal boot per non intasare all'avvio
      setTimeout(fire, 30_000);
    } else {
      const delay = tomorrow - now;
      setTimeout(fire, delay);
    }
  }

  // ─── SCADENZE BOLLETTE ─────────────────────────────────────
  function checkBillsDue(bills) {
    const today = new Date().toISOString().split('T')[0];
    const in7   = new Date(); in7.setDate(in7.getDate() + 7);
    const in7s  = in7.toISOString().split('T')[0];

    bills.filter(b => b.date && b.date >= today && b.date <= in7s && b.status !== 'paid').forEach(b => {
      const daysLeft = Math.round((new Date(b.date) - new Date(today)) / 86_400_000);
      const label    = daysLeft === 0 ? 'OGGI' : daysLeft === 1 ? 'domani' : `tra ${daysLeft} giorni`;
      push({
        id: `bill_${b.id}_${today}`,
        type: 'bill', icon: '📄',
        title: `Bolletta in scadenza: ${b.name}`,
        sub:   `Scade ${label} · €${parseFloat(b.amount).toFixed(2)}`,
        time: Date.now(), read: false, action: 'bollette'
      });
      if (daysLeft <= 1) {
        sendBrowser(`📄 Scadenza ${label}: ${b.name}`, `Bolletta di €${parseFloat(b.amount).toFixed(2)}`);
      }
    });
  }

  // ─── SCADENZE RICORRENTI ────────────────────────────────────
  function checkRecurringDue(recurring) {
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowS = tomorrow.toISOString().split('T')[0];

    recurring.filter(r => r.status === 'active' && r.nextDate && r.nextDate <= tomorrowS).forEach(r => {
      const label = r.nextDate === today ? 'oggi' : 'domani';
      push({
        id: `rec_${r.id}_${r.nextDate}`,
        type: 'rec', icon: '🔄',
        title: `Ricorrente scade ${label}: ${r.name}`,
        sub:   `€${parseFloat(r.amount).toFixed(2)} · ${r.type === 'expense' ? 'Uscita' : 'Entrata'}`,
        time: Date.now(), read: false, action: 'ricorrenti'
      });
    });
  }

  // ─── PUSH IN-APP ───────────────────────────────────────────
  function push(notif) {
    _load();
    if (_notifs.some(n => n.id === notif.id)) return; // no duplicati
    _notifs.unshift(notif);
    _save();
    _updateBadge();
  }

  function dismiss(id) {
    _notifs = _notifs.filter(n => n.id !== id);
    _save();
    _updateBadge();
  }

  function markRead(id) {
    const n = _notifs.find(n => n.id === id);
    if (n) { n.read = true; _save(); _updateBadge(); }
  }

  function markAllRead() {
    _notifs.forEach(n => { n.read = true; });
    _save();
    _updateBadge();
  }

  function getAll()    { _load(); return [..._notifs]; }
  function getUnread() { return _notifs.filter(n => !n.read).length; }

  // ─── FOREGROUND POLLING ────────────────────────────────────
  function _listenForeground() {
    // Ripolla le notifiche ogni 5 minuti quando l'app è aperta
    setInterval(() => { _load(); _updateBadge(); }, 5 * 60_000);
  }

  // ─── STORAGE ──────────────────────────────────────────────
  function _load() {
    try { _notifs = JSON.parse(localStorage.getItem(STORAGE_KEY(_uid)) || '[]'); }
    catch { _notifs = []; }
  }
  function _save() {
    try { localStorage.setItem(STORAGE_KEY(_uid), JSON.stringify(_notifs.slice(0, 100))); }
    catch {}
  }
  function _updateBadge() {
    const badge  = document.getElementById('notifBadge');
    const unread = getUnread();
    if (badge) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  // ─── APPLE WALLET / GOOGLE PAY detection ──────────────────
  /**
   * Kazka non può accedere direttamente alle transazioni di Apple Wallet
   * o Google Pay per policy Apple/Google (richiederebbe open banking API).
   *
   * Quello che facciamo:
   * 1. Mostriamo un pulsante "Importa da banca" → upload CSV estratto da app banca
   * 2. Per iOS: con iOS 17+ l'utente può esportare transazioni da Portafoglio
   *    come CSV — noi lo importiamo
   * 3. Per Android: Google Pay non espone API pubbliche — CSV da banca
   * 4. FUTURO: Open Banking PSD2 API (es. Tink, Plaid) per sync automatico
   */
  function getWalletIntegrationInfo() {
    const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isIOS) {
      return {
        available: 'partial',
        method: 'csv_import',
        instructions: [
          '1. Apri "Portafoglio" su iPhone',
          '2. Seleziona la tua carta',
          '3. Tocca "..." → "Esporta transazioni"',
          '4. Importa il CSV in Kazka con il pulsante Import'
        ],
        note: 'Richiede iOS 17+. Sync automatico disponibile con Open Banking (prossimamente).'
      };
    }
    if (isAndroid) {
      return {
        available: 'partial',
        method: 'csv_import',
        instructions: [
          '1. Apri l\'app della tua banca',
          '2. Vai in Movimenti → Esporta/Scarica',
          '3. Scegli formato CSV o OFX',
          '4. Importa il file in Kazka'
        ],
        note: 'Google Wallet non espone API pubbliche. Sync automatico con Open Banking (prossimamente).'
      };
    }
    return {
      available: 'csv',
      method: 'csv_import',
      instructions: ['Esporta il CSV dalla tua banca e importalo in Kazka'],
      note: 'Supportati: CSV standard, OFX, QIF. Formato libero con mapping colonne.'
    };
  }

  return {
    init, requestPermission, sendBrowser,
    checkBillsDue, checkRecurringDue,
    push, dismiss, markRead, markAllRead,
    getAll, getUnread,
    getWalletIntegrationInfo
  };

})();
