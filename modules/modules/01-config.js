// 01-CONFIG.JS - Configurazione globale app Kazka

const APP_CONFIG = {
  name: 'Kazka',
  version: '3.0.0',
  language: 'it',
  currency: 'EUR',
  currencySymbol: '€',
  dateFormat: 'DD/MM/YYYY',
  firebasePath: 'users'
};

const CATEGORIES = {
  income: [
    { id: 'stipendio', label: 'Stipendio', icon: '💼' },
    { id: 'freelance', label: 'Freelance', icon: '💻' },
    { id: 'investimenti', label: 'Investimenti', icon: '📈' },
    { id: 'bonus', label: 'Bonus', icon: '🎁' },
    { id: 'affitto_attivo', label: 'Affitto (entrata)', icon: '🏠' },
    { id: 'altro_entrata', label: 'Altro', icon: '💰' }
  ],
  expense: [
    { id: 'alimentari', label: 'Alimentari', icon: '🛒' },
    { id: 'ristoranti', label: 'Ristoranti', icon: '🍽️' },
    { id: 'trasporti', label: 'Trasporti', icon: '🚗' },
    { id: 'abbonamenti', label: 'Abbonamenti', icon: '📱' },
    { id: 'salute', label: 'Salute', icon: '💊' },
    { id: 'sport', label: 'Sport', icon: '🏋️' },
    { id: 'abbigliamento', label: 'Abbigliamento', icon: '👕' },
    { id: 'casa', label: 'Casa', icon: '🏠' },
    { id: 'affitto', label: 'Affitto', icon: '🔑' },
    { id: 'bollette', label: 'Bollette', icon: '⚡' },
    { id: 'svago', label: 'Svago', icon: '🎭' },
    { id: 'viaggi', label: 'Viaggi', icon: '✈️' },
    { id: 'istruzione', label: 'Istruzione', icon: '📚' },
    { id: 'tecnologia', label: 'Tecnologia', icon: '💻' },
    { id: 'animali', label: 'Animali', icon: '🐾' },
    { id: 'altro', label: 'Altro', icon: '📦' }
  ]
};

const PLANS = {
  free: { label: 'Free', price: 0, features: ['transactions', 'basic_reports'] },
  personal_pro: { label: 'Personal Pro', price: 4.99, features: ['transactions', 'reports', 'goals', 'recurring', 'bills', 'trips', 'groups'] },
  business_starter: { label: 'Business Starter', price: 9.99, features: ['all_personal', 'biz_dashboard', 'biz_primanota', 'biz_clienti'] },
  business_pro: { label: 'Business Pro', price: 19.99, features: ['all_business', 'biz_preventivi', 'biz_progetti', 'biz_iva'] },
  lifetime: { label: 'Lifetime', price: 199, features: ['everything'] }
};

// Global state
var user = null;
var currentView = 'dashboard';
var currentMode = 'personal'; // 'personal' | 'business'
var transactions = [];
var goals = [];
var budgets = {};
var recurringItems = [];
var groups = [];
var bills = [];
var trips = [];
var bizTransactions = [];
var bizClients = [];
var bizQuotes = [];
var bizProjects = [];

console.log('✅ config.js loaded');
