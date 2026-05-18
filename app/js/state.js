/**
 * state.js — Stato globale dell'applicazione
 *
 * Centralizza tutte le variabili di stato per evitare globals sparsi.
 * L'oggetto S contiene i dati Firebase; le altre variabili
 * gestiscono UI e preferenze.
 */

/* ─── Utente ─── */
let UID = null;
let UP  = null;

/* ─── Dati Firebase ─── */
let S = {
  transactions: [],
  accounts:     [],
  budgets:      {},
  goals:        [],
  recurring:    [],
  invoices:     [],
  travel:       [],
  transfers:    [],
  debts:        [],
  groups:       {},
  quotes:       [],
  suppliers:    [],
  projects:     [],
};

/* ─── Preferenze UI (persistite in localStorage) ─── */
let theme       = localStorage.getItem('kz_theme') || 'dark';
let mode        = localStorage.getItem('kz_mode')  || 'personal';
let defaultCur  = localStorage.getItem('kz_cur')   || 'EUR';
let notifications = JSON.parse(localStorage.getItem('kz_notifs') || '[]');
let fmCfg         = JSON.parse(localStorage.getItem('kz_fm')     || '{}');

/* ─── Stato navigazione ─── */
let currentGid  = null;
let chatOff     = null;
let calDate     = new Date();
let monthlyDate = new Date();
let pnDate      = new Date();
let charts      = {};
