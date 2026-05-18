/**
 * errors.js — Gestione errori centralizzata
 *
 * Espone:
 *   - ferr(code)        Traduce codici Firebase in messaggi italiani
 *   - showErr(el, msg)  Mostra errore inline in un elemento DOM
 *   - dbSave(fn, label) Wrapper try/catch per operazioni Firebase con toast automatico
 *   - initGlobalErrors()  Handler globale window.onerror / unhandledrejection
 */

/* ─── Traduzioni codici Firebase ─── */
function ferr(code) {
  const map = {
    'auth/user-not-found':       'Utente non trovato',
    'auth/wrong-password':       'Password errata',
    'auth/email-already-in-use': 'Email già registrata',
    'auth/weak-password':        'Password troppo corta (min. 6 caratteri)',
    'auth/invalid-email':        'Email non valida',
    'auth/too-many-requests':    'Troppi tentativi, riprova tra qualche minuto',
    'auth/network-request-failed': 'Errore di rete, controlla la connessione',
    'auth/popup-closed-by-user': 'Popup chiuso, riprova',
    'auth/cancelled-popup-request': 'Richiesta annullata',
    'permission-denied':         'Permesso negato',
    'unavailable':               'Servizio non disponibile, riprova',
    'network-error':             'Errore di rete',
  };
  return map[code] || `Errore (${code || 'sconosciuto'})`;
}

/* ─── Mostra errore in elemento DOM ─── */
function showErr(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

/* ─── Wrapper Firebase con try/catch e toast ─── */
async function dbSave(fn, label = 'Operazione') {
  try {
    const result = await fn();
    return result;
  } catch (e) {
    console.error(`[${label}]`, e);
    const msg = e.code ? ferr(e.code) : (e.message || 'Errore sconosciuto');
    if (typeof toast === 'function') {
      toast(`${label} fallita: ${msg}`, 'err');
    }
    throw e; // ri-lancia così chi chiama può gestirlo se vuole
  }
}

/* ─── Handler globale — cattura errori non gestiti ─── */
function initGlobalErrors() {
  window.onerror = function (msg, src, line, col, err) {
    console.error('[GlobalError]', msg, { src, line, col, err });
    // Non mostrare toast per errori di script esterni (CDN, ecc.)
    if (src && (src.includes('googleapis') || src.includes('gstatic') || src.includes('cloudflare'))) return;
    if (typeof toast === 'function') {
      toast('Errore inatteso, ricarica la pagina se il problema persiste', 'err');
    }
  };

  window.addEventListener('unhandledrejection', function (e) {
    const reason = e.reason;
    console.error('[UnhandledPromise]', reason);
    // Ignora errori di rete Firebase offline (normali quando si perde connessione)
    if (reason && reason.code === 'unavailable') return;
    if (reason && reason.code === 'network-error') {
      if (typeof toast === 'function') toast('Connessione persa, dati non salvati', 'err');
      return;
    }
    if (typeof toast === 'function') {
      const msg = reason?.message || reason?.code || 'Errore promessa';
      toast(`Errore: ${ferr(reason?.code) || msg}`, 'err');
    }
  });
}
