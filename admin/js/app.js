
console.log("KAZKA Admin Panel v3.0");
emailjs.init("user_placeholder");

// ===== FIREBASE CONFIG =====
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
var firebaseInitialized = false;
var firebaseApp = null;
var firestoreDb = null;
var realtimeDb = null;

function configureFirebase() {
  var cfg = {
    apiKey: document.getElementById("fbApiKey").value,
    authDomain: document.getElementById("fbAuthDomain").value,
    databaseURL: document.getElementById("fbDatabaseURL").value,
    projectId: document.getElementById("fbProjectId").value,
    storageBucket: document.getElementById("fbStorageBucket").value,
    messagingSenderId: document.getElementById("fbSenderId").value,
    appId: document.getElementById("fbAppId").value
  };
  try {
    if (firebaseApp) { firebaseApp.delete(); }
    firebaseApp = firebase.initializeApp(cfg);
    firestoreDb = firebase.firestore();
    realtimeDb = firebase.database();
    firebaseInitialized = true;
    document.getElementById("firebaseStatusText").innerHTML = '<span style="color:var(--success)">Configurato e connesso</span>';
    toast("Firebase configurato con successo", "success");
    loadFromFirebase();
  } catch(e) {
    toast("Errore configurazione Firebase: " + e.message, "error");
  }
}

function testFirebaseConnection() {
  if (!firebaseInitialized) { toast("Firebase non configurato", "warning"); return; }
  toast("Test connessione Firebase...", "info");
  setTimeout(function() {
    toast("Connessione Firebase OK (simulata)", "success");
  }, 1000);
}

function loadFromFirebase() {
  if (!firebaseInitialized) return;
  try {
    if (realtimeDb) {
      realtimeDb.ref("utenti").once("value").then(function(snap) {
        var data = snap.val();
        if (data) { utenti = Object.values(data); renderAll(); }
      }).catch(function() { console.log("Firebase offline, using mock data"); });
    }
    if (firestoreDb) {
      firestoreDb.collection("transazioni").get().then(function(querySnapshot) {
        if (!querySnapshot.empty) { transazioni = []; querySnapshot.forEach(function(doc) { transazioni.push(doc.data()); }); renderAll(); }
      }).catch(function() { console.log("Firestore offline, using mock data"); });
    }
  } catch(e) { console.log("Firebase load error, using mock data"); }
}

// ===== TRANSLATIONS =====
var currentLang = localStorage.getItem("kazka_lang") || "it";
var langData = {};
(function() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "lang/" + currentLang + ".json", false);
  xhr.overrideMimeType("application/json");
  try {
    xhr.send(null);
    langData[currentLang] = JSON.parse(xhr.responseText);
  } catch(e) {
    langData[currentLang] = {};
  }
  if (!langData[currentLang]) langData[currentLang] = {};
})();

function t(key) {function t(key) {
  return langData[currentLang] && langData[currentLang][key] ? langData[currentLang][key] : key;
}

function applyLang() {
  var elements = document.querySelectorAll("[data-lang]");
  elements.forEach(function(el) { el.textContent = t(el.dataset.lang); });
  var inputs = document.querySelectorAll("[data-lang-ph]");
  inputs.forEach(function(el) { el.placeholder = t(el.dataset.langPh); });
  document.getElementById("langFlag").textContent = currentLang === "it" ? "\uD83C\uDDEE\uD83C\uDDF9" : "\uD83C\uDDEC\uD83C\uDDE7";
  document.getElementById("langLabel").textContent = currentLang === "it" ? "IT" : "EN";
  localStorage.setItem("kazka_lang", currentLang);
}

function toggleLang() {
  currentLang = currentLang === "it" ? "en" : "it";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "lang/" + currentLang + ".json", false);
  xhr.overrideMimeType("application/json");
  try {
    xhr.send(null);
    langData[currentLang] = JSON.parse(xhr.responseText);
  } catch(e) {
    langData[currentLang] = {};
  }
  applyLang();
  toast(currentLang === "it" ? "Italiano" : "English", "info");
}
// ===== DATA STORE =====
var utenti = [
  {id:1, email:"admin@kazka.it", nome:"Admin", abbonamento:"Lifetime", status:"attivo", dataReg:"2024-01-01", password:"Admin123!"},
  {id:2, email:"mario.rossi@example.com", nome:"Mario Rossi", abbonamento:"Pro", status:"attivo", dataReg:"2024-03-15", password:"pass123"},
  {id:3, email:"lisa.bianchi@example.com", nome:"Lisa Bianchi", abbonamento:"Basic", status:"attivo", dataReg:"2024-05-20", password:"pass123"},
  {id:4, email:"carlo.verdi@example.com", nome:"Carlo Verdi", abbonamento:"Free", status:"sospeso", dataReg:"2024-02-10", password:"pass123"},
  {id:5, email:"anna.neri@example.com", nome:"Anna Neri", abbonamento:"Business", status:"attivo", dataReg:"2024-07-01", password:"pass123"},
  {id:6, email:"paolo.gialli@example.com", nome:"Paolo Gialli", abbonamento:"Starter", status:"attivo", dataReg:"2024-09-12", password:"pass123"},
  {id:7, email:"sofia.marroni@example.com", nome:"Sofia Marroni", abbonamento:"Enterprise", status:"bannato", dataReg:"2024-04-05", password:"pass123"},
  {id:8, email:"luca.viola@example.com", nome:"Luca Viola", abbonamento:"Business Lite", status:"attivo", dataReg:"2024-08-22", password:"pass123"},
  {id:9, email:"giulia.rosa@example.com", nome:"Giulia Rosa", abbonamento:"Free", status:"attivo", dataReg:"2024-10-30", password:"pass123"},
  {id:10, email:"marco.azzurri@example.com", nome:"Marco Azzurri", abbonamento:"Lifetime", status:"attivo", dataReg:"2024-06-14", password:"pass123"}
];
var abbonamenti = [
  {utente:"Mario Rossi", piano:"Pro", inizio:"2024-03-15", scadenza:"2025-03-15", stato:"attivo", rinnovo:true},
  {utente:"Lisa Bianchi", piano:"Basic", inizio:"2024-05-20", scadenza:"2025-05-20", stato:"attivo", rinnovo:true},
  {utente:"Carlo Verdi", piano:"Free", inizio:"2024-02-10", scadenza:"2025-02-10", stato:"scaduto", rinnovo:false},
  {utente:"Anna Neri", piano:"Business", inizio:"2024-07-01", scadenza:"2025-07-01", stato:"attivo", rinnovo:true},
  {utente:"Paolo Gialli", piano:"Starter", inizio:"2024-09-12", scadenza:"2025-09-12", stato:"attivo", rinnovo:false},
  {utente:"Sofia Marroni", piano:"Enterprise", inizio:"2024-04-05", scadenza:"2025-04-05", stato:"sospeso", rinnovo:true},
  {utente:"Luca Viola", piano:"Business Lite", inizio:"2024-08-22", scadenza:"2025-08-22", stato:"attivo", rinnovo:true},
  {utente:"Marco Azzurri", piano:"Lifetime", inizio:"2024-06-14", scadenza:"2099-06-14", stato:"attivo", rinnovo:false}
];
var gruppi = [
  {id:1, nome:"Beta Testers", membri:12, dataCreazione:"2024-02-01"},
  {id:2, nome:"VIP Clients", membri:8, dataCreazione:"2024-03-15"},
  {id:3, nome:"Enterprise", membri:5, dataCreazione:"2024-04-20"},
  {id:4, nome:"Sviluppo", membri:15, dataCreazione:"2024-01-10"}
];
var transazioni = [];
var backupList = [];
var logActions = [];
var notifiche = [];
var teamMembers = [
  {id:1, nome:"Adamo Michele", email:"adamo@kazka.it", ruolo:"Amministratore"},
  {id:2, nome:"Sofia Conti", email:"sofia@kazka.it", ruolo:"Moderatore"},
  {id:3, nome:"Luca Ferrari", email:"luca@kazka.it", ruolo:"Supporto"},
  {id:4, nome:"Elena Rossi", email:"elena@kazka.it", ruolo:"Sviluppatore"}
];
var piani = [
  {id:"free", nome:"Free", prezzo:0, icon:"free", attivo:true},
  {id:"starter", nome:"Starter", prezzo:9.99, icon:"starter", attivo:true},
  {id:"basic", nome:"Basic", prezzo:19.99, icon:"basic", attivo:true},
  {id:"pro", nome:"Pro", prezzo:39.99, icon:"pro", attivo:true},
  {id:"bizlite", nome:"Business Lite", prezzo:79.99, icon:"bizlite", attivo:true},
  {id:"business", nome:"Business", prezzo:149.99, icon:"business", attivo:true},
  {id:"enterprise", nome:"Enterprise", prezzo:299.99, icon:"enterprise", attivo:true},
  {id:"lifetime", nome:"Lifetime", prezzo:499.99, icon:"lifetime", attivo:true}
];
var featureFlags = {
  chat_ai:true, premium_support:true, api_access:false, advanced_stats:true,
  team_management:true, export_data:true, customization:false, multi_language:true,
  priority_support:false, beta_features:true, dark_mode:true, analytics:true,
  file_manager:true, ticket_system:true, coupon_system:true, webhook_system:true
};
var apiKey = "sk-kazka_live_8f3a2b1c9d7e4f6a";
var ultimiAccessi = [];
var nextUserId = 11;
var nextGruppoId = 5;
var nextNotifId = 1;
var nextCouponId = 1;
var nextWebhookId = 1;
var nextTicketId = 1;
var nextFileId = 1;
var isLoggedIn = false;
var currentPage = {};
var perPage = 10;
var couponList = [];
var webhookList = [];
var webhookLogs = [];
var ticketList = [];
var filesList = [];
var maintenanceMode = false;
var maintenanceMessage = "";
var maintenanceIPs = "";

// ===== UTILITY FUNCTIONS =====
function formatDate(d) {
  var date = new Date(d);
  return date.toLocaleDateString("it-IT", {day:"2-digit", month:"2-digit", year:"numeric"});
}
function formatCurrency(n) { return "\u20AC" + parseFloat(n).toFixed(2); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateId() { return "TXN-" + Date.now().toString(36).toUpperCase() + "-" + rand(1000,9999); }
function generateCouponCode() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var code = "";
  for (var i = 0; i < 8; i++) code += chars.charAt(rand(0, chars.length - 1));
  return code;
}
function generateSecret() {
  var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  var s = "whsec_";
  for (var i = 0; i < 24; i++) s += chars.charAt(rand(0, chars.length - 1));
  return s;
}

function toast(msg, type) {
  type = type || "info";
  var icons = {
    success:"<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' stroke='#34D399'/><polyline points='22 4 12 14.01 9 11.01' stroke='#34D399'/>",
    error:"<circle cx='12' cy='12' r='10' stroke='#EF4444'/><line x1='15' y1='9' x2='9' y2='15' stroke='#EF4444'/><line x1='9' y1='9' x2='15' y2='15' stroke='#EF4444'/>",
    warning:"<path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' stroke='#FBBF24'/><line x1='12' y1='9' x2='12' y2='13' stroke='#FBBF24'/><line x1='12' y1='17' x2='12.01' y2='17' stroke='#FBBF24'/>",
    info:"<circle cx='12' cy='12' r='10' stroke='#2563EB'/><line x1='12' y1='16' x2='12' y2='12' stroke='#2563EB'/><line x1='12' y1='8' x2='12.01' y2='8' stroke='#2563EB'/>"
  };
  var c = document.getElementById("toastContainer");
  var t = document.createElement("div");
  t.className = "toast " + type;
  t.innerHTML = '<span class="t-icon"><svg width=20 height=20 viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (icons[type] || icons.info) + '</svg></span><span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(function(){ t.style.opacity="0"; t.style.transition="opacity 0.3s"; setTimeout(function(){t.remove()}, 300); }, 3000);
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("open");
}

function logAction(azione, dettagli) {
  logActions.unshift({
    timestamp: new Date().toISOString(),
    admin: document.getElementById("sidebarName").textContent,
    azione: azione,
    dettagli: dettagli || "",
    ip: "127.0.0.1"
  });
  if (document.getElementById("viewLog").classList.contains("active")) renderLog();
}

function aggiornaOrologio() {
  var now = new Date();
  document.getElementById("clockDisplay").textContent = now.toLocaleTimeString("it-IT");
}
setInterval(aggiornaOrologio, 1000);
aggiornaOrologio();

// ===== THEME =====
function toggleTheme() {
  var html = document.documentElement;
  var current = html.getAttribute("data-theme");
  if (current === "light") {
    html.removeAttribute("data-theme");
    localStorage.setItem("kazka_theme", "dark");
  } else {
    html.setAttribute("data-theme", "light");
    localStorage.setItem("kazka_theme", "light");
  }
}
(function() {
  var saved = localStorage.getItem("kazka_theme");
  if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
})();

// ===== PAGINATION =====
function paginate(data, page, perPage) {
  var total = data.length;
  var totalPages = Math.ceil(total / perPage) || 1;
  var start = (page - 1) * perPage;
  var end = Math.min(start + perPage, total);
  return { items: data.slice(start, end), total: total, totalPages: totalPages, page: page, perPage: perPage };
}

function renderPagination(total, page, perPage, containerId, callback) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var totalPages = Math.ceil(total / perPage) || 1;
  if (total <= perPage) { container.innerHTML = ""; return; }
  var html = '<select onchange="changePerPage(\'' + containerId + '\',this.value,\'' + callback + '\',' + total + ')" style="margin-right:8px">';
  [10, 25, 50, 100].forEach(function(n) {
    html += '<option value="' + n + '" ' + (perPage === n ? "selected" : "") + ">" + n + "</option>";
  });
  html += "</select>";
  html += '<span class="page-info">' + t("pageLabel") + " " + page + " " + t("ofLabel") + " " + totalPages + " (" + total + " " + t("itemsPerPage").toLowerCase() + ")</span>";
  html += '<button onclick="goToPage(\'' + containerId + '\',1,\'' + callback + '\',' + total + ')" ' + (page <= 1 ? "disabled" : "") + ">&#171;</button>";
  html += '<button onclick="goToPage(\'' + containerId + '\',' + (page - 1) + ",'" + callback + "'," + total + ')" ' + (page <= 1 ? "disabled" : "") + ">&#8249;</button>";
  var startP = Math.max(1, page - 2);
  var endP = Math.min(totalPages, page + 2);
  for (var i = startP; i <= endP; i++) {
    html += '<button class="' + (i === page ? "active" : "") + '" onclick="goToPage(\'' + containerId + "'," + i + ",'" + callback + "'," + total + ')" ' + (i === page ? "disabled" : "") + ">" + i + "</button>";
  }
  html += '<button onclick="goToPage(\'' + containerId + '\',' + (page + 1) + ",'" + callback + "'," + total + ')" ' + (page >= totalPages ? "disabled" : "") + ">&#8250;</button>";
  html += '<button onclick="goToPage(\'' + containerId + '\',' + totalPages + ",'" + callback + "'," + total + ')" ' + (page >= totalPages ? "disabled" : "") + ">&#187;</button>";
  container.innerHTML = html;
}

function goToPage(containerId, page, callback, total) {
  if (page < 1 || page > Math.ceil(total / currentPage[containerId + "_perPage"] || 10)) return;
  currentPage[containerId] = page;
  if (typeof window[callback] === "function") window[callback]();
}

function changePerPage(containerId, val, callback, total) {
  currentPage[containerId + "_perPage"] = parseInt(val);
  currentPage[containerId] = 1;
  if (typeof window[callback] === "function") window[callback]();
}

// ===== LOGIN / LOGOUT =====
function handleLogin() {
  var email = document.getElementById("loginEmail").value.trim();
  var pw = document.getElementById("loginPassword").value;
  var btn = document.getElementById("loginBtn");
  var err = document.getElementById("loginError");
  err.textContent = "";
  if (!email || !pw) { err.textContent = "Inserisci email e password."; return; }
  if (email === "admin@kazka.it" && pw === "Admin123!") {
    btn.disabled = true; btn.textContent = "Accesso in corso...";
    setTimeout(function() {
      isLoggedIn = true;
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("adminLayout").classList.remove("hidden");
      document.getElementById("sidebarAvatar").textContent = "A";
      document.getElementById("sidebarName").textContent = "Admin";
      logAction("login", "Login admin: " + email);
      renderAll();
      if (Notification.permission === "default") Notification.requestPermission();
      toast(t("success") + ", Admin!", "success");
      btn.disabled = false; btn.innerHTML = '<svg width=18 height=18 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> ' + t("loginBtn");
      applyLang();
      initLiveUpdates();
    }, 800);
  } else {
    err.textContent = "Credenziali non valide. Prova con admin@kazka.it / Admin123!";
  }
}

function handleGoogleLogin() {
  toast("Google OAuth: placeholder - connessione simulata", "info");
  setTimeout(function() {
    document.getElementById("loginEmail").value = "admin@kazka.it";
    document.getElementById("loginPassword").value = "Admin123!";
    handleLogin();
  }, 500);
}

function handleLogout() {
  isLoggedIn = false;
  logAction("logout", "Logout admin");
  document.getElementById("adminLayout").classList.add("hidden");
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("loginError").textContent = "";
  toast("Logout effettuato", "info");
}

// ===== VIEW SWITCHING =====
function switchView(viewName, el) {
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("active"); });
  document.getElementById("view" + viewName.charAt(0).toUpperCase() + viewName.slice(1)).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(function(n) { n.classList.remove("active"); });
  if (el) el.classList.add("active");
  if (window.innerWidth <= 768) { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebarOverlay").classList.remove("open"); }
  if (viewName === "statistiche") setTimeout(initChart, 100);
  if (viewName === "dashboard") renderDashboard();
  if (viewName === "utenti") renderUtenti();
  if (viewName === "abbonamenti") renderAbbonamenti();
  if (viewName === "gruppi") renderGruppi();
  if (viewName === "transazioni") renderTransazioni();
  if (viewName === "revenue") renderRevenue();
  if (viewName === "log") renderLog();
  if (viewName === "backup") renderBackup();
  if (viewName === "notifiche") renderNotifiche();
  if (viewName === "team") renderTeam();
  if (viewName === "piani") renderPiani();
  if (viewName === "featureflags") renderFeatureFlags();
  if (viewName === "coupon") renderCoupon();
  if (viewName === "webhook") renderWebhook();
  if (viewName === "ticket") renderTicket();
  if (viewName === "filemanager") renderFiles();
  if (viewName === "manutenzione") renderMaintenance();
  if (viewName === "firebase") renderFirebaseConfig();
}
// ===== IMPERSONA =====
function handleImpersona() {
  var email = document.getElementById("impersonaEmail").value.trim();
  if (!email) { toast(t("errorOccurred"), "error"); return; }
  var user = utenti.find(function(u) { return u.email === email; });
  if (!user) { toast("Utente non trovato", "error"); return; }
  logAction("impersona", "Impersonato utente: " + email);
  toast("Impersonificazione di " + email + " - apertura nuova scheda", "warning");
  window.open("https://kazka.it/impersona?token=placeholder&email=" + encodeURIComponent(email), "_blank");
}

// ===== SEED DATA =====
function seedTransazioni() {
  if (transazioni.length > 0) return;
  var tipi = ["pagamento","pagamento","pagamento","rimborso","pagamento","pagamento","reverse"];
  var stati = ["completato","completato","completato","completato","completato","pending","fallito"];
  for (var i = 0; i < 25; i++) {
    var u = utenti[rand(0, utenti.length - 1)];
    var importo = rand(5, 500) + 0.99;
    var giorno = rand(1, Math.min(28, new Date().getDate()));
    var mese = rand(1, 12);
    var data = "2024-" + String(mese).padStart(2,"0") + "-" + String(giorno).padStart(2,"0");
    transazioni.push({id: generateId(), utente: u.email, importo: importo, tipo: tipi[rand(0,tipi.length-1)], data: data, stato: stati[rand(0,stati.length-1)], dettagli: "Transazione " + (i+1) + " - " + u.nome});
  }
}
seedTransazioni();

function seedAccessi() {
  for (var i = 0; i < 5; i++) {
    var u = utenti[rand(0, utenti.length-1)];
    var h = String(rand(8,23)).padStart(2,"0");
    var m = String(rand(0,59)).padStart(2,"0");
    ultimiAccessi.push({email: u.email, data: "2024-12-" + String(rand(1,20)).padStart(2,"0") + " " + h + ":" + m, ip: rand(10,255) + "." + rand(0,255) + "." + rand(0,255) + "." + rand(1,254), dispositivo: ["Chrome/Windows","Safari/MacOS","Firefox/Linux","Chrome/Android","Safari/iOS"][rand(0,4)]});
  }
}
seedAccessi();

function seedBackup() {
  backupList = [{data:"2024-12-15 03:00", dimensione:"2.4 GB"},{data:"2024-12-14 03:00", dimensione:"2.3 GB"},{data:"2024-12-13 03:00", dimensione:"2.3 GB"},{data:"2024-12-12 03:00", dimensione:"2.2 GB"},{data:"2024-12-11 03:00", dimensione:"2.2 GB"}];
}
seedBackup();

function seedCoupon() {
  if (couponList.length > 0) return;
  couponList = [
    {id:1, codice:"SUMMER24", sconto:20, tipo:"percentuale", inizio:"2024-06-01", fine:"2024-08-31", maxUsi:100, usiCorrenti:23, attivo:true},
    {id:2, codice:"WELCOME10", sconto:10, tipo:"percentuale", inizio:"2024-01-01", fine:"2024-12-31", maxUsi:500, usiCorrenti:145, attivo:true},
    {id:3, codice:"FLAT5", sconto:5, tipo:"fisso", inizio:"2024-03-01", fine:"2024-09-30", maxUsi:200, usiCorrenti:67, attivo:true},
    {id:4, codice:"VIP50", sconto:50, tipo:"percentuale", inizio:"2024-07-01", fine:"2024-07-31", maxUsi:10, usiCorrenti:10, attivo:false}
  ];
  nextCouponId = 5;
}
seedCoupon();

function seedWebhook() {
  if (webhookList.length > 0) return;
  webhookList = [
    {id:1, nome:"Discord Alerts", url:"https://discord.com/api/webhooks/test", eventi:["user.created","payment.completed"], secret:"whsec_discord_test_key", attivo:true},
    {id:2, nome:"Slack Notifier", url:"https://hooks.slack.com/services/test", eventi:["subscription.created","ticket.created"], secret:"whsec_slack_test_key", attivo:false}
  ];
  nextWebhookId = 3;
}
seedWebhook();

function seedTickets() {
  if (ticketList.length > 0) return;
  ticketList = [
    {id:1, utente:"mario.rossi@example.com", oggetto:"Problema di fatturazione", priorita:"alta", stato:"aperto", data:"2024-12-10", risposte:[]},
    {id:2, utente:"lisa.bianchi@example.com", oggetto:"Richiesta di upgrade", priorita:"media", stato:"in_lavorazione", data:"2024-12-12", risposte:[{admin:"Admin", testo:"Stiamo processando la richiesta", data:"2024-12-13"}]},
    {id:3, utente:"anna.neri@example.com", oggetto:"Bug nella dashboard", priorita:"critica", stato:"risolto", data:"2024-12-08", risposte:[{admin:"Admin", testo:"Risolto nella versione 2.4.1", data:"2024-12-09"}]}
  ];
  nextTicketId = 4;
}
seedTickets();

function seedFiles() {
  if (filesList.length > 0) return;
  filesList = [
    {id:1, nome:"report_q3_2024.pdf", dimensione:"2.4 MB", tipo:"pdf", data:"2024-10-15"},
    {id:2, nome:"logo_kazka.png", dimensione:"156 KB", tipo:"image", data:"2024-09-01"},
    {id:3, nome:"backup_db_2024_12.sql", dimensione:"45 MB", tipo:"sql", data:"2024-12-15"},
    {id:4, nome:"guida_utente.pdf", dimensione:"1.8 MB", tipo:"pdf", data:"2024-08-20"},
    {id:5, nome:"screenshot_v2.png", dimensione:"320 KB", tipo:"image", data:"2024-11-05"},
    {id:6, nome:"dataset_clienti.csv", dimensione:"890 KB", tipo:"csv", data:"2024-12-01"},
    {id:7, nome:"installer_v2.4.1.msi", dimensione:"128 MB", tipo:"zip", data:"2024-12-10"},
    {id:8, nome:"invoice_2024_11.pdf", dimensione:"412 KB", tipo:"pdf", data:"2024-11-30"}
  ];
  nextFileId = 9;
}
seedFiles();

// ===== RENDER ALL =====
function renderAll() {
  renderDashboard(); renderUtenti(); renderAbbonamenti(); renderGruppi();
  renderTransazioni(); renderRevenue(); renderLog(); renderBackup();
  renderNotifiche(); renderTeam(); renderPiani(); renderFeatureFlags();
  renderCoupon(); renderWebhook(); renderTicket(); renderFiles();
  aggiornaStats();
}
// ===== AGGIORNA STATS =====
function aggiornaStats() {
  var totUtenti = utenti.length;
  var attivi = utenti.filter(function(u){ return u.status === "attivo"; }).length;
  document.getElementById("statUtentiTotali").textContent = totUtenti;
  document.getElementById("statUtentiChange").textContent = "+" + rand(2,12) + "%";
  var abbAttivi = abbonamenti.filter(function(a){ return a.stato === "attivo"; }).length;
  document.getElementById("statAbbonamentiAttivi").textContent = abbAttivi;
  document.getElementById("statAbbChange").textContent = "+" + rand(1,8) + "%";
  var totRev = transazioni.reduce(function(s,t){ return s + (t.stato==="completato"?t.importo:0); }, 0);
  document.getElementById("statRevenueTotale").textContent = formatCurrency(totRev);
  document.getElementById("statRevenueChange").textContent = "+" + rand(5,20) + "%";
  var oggiTrans = transazioni.filter(function(t){ return t.data === new Date().toISOString().slice(0,10); }).length;
  document.getElementById("statTransazioniOggi").textContent = oggiTrans || rand(3,15);
  document.getElementById("statTransChange").textContent = "+" + rand(3,10) + "%";
  document.getElementById("onlineCount").textContent = rand(12,48);
  var oggi = transazioni.filter(function(t){ return t.data.indexOf(new Date().toISOString().slice(0,7)) >= 0; });
  var todayRev = oggi.reduce(function(s,t){ return s + (t.stato==="completato"?t.importo:0); }, 0);
  document.getElementById("revenueToday").textContent = formatCurrency(todayRev || rand(200,1500));
  document.getElementById("revenueTotaleDisplay").textContent = formatCurrency(totRev);
  var now = new Date();
  var meseCorr = now.getMonth();
  var annoCorr = now.getFullYear();
  var meseRev = transazioni.filter(function(t){ var m = parseInt(t.data.split("-")[1]); return m === meseCorr+1 && t.stato === "completato"; }).reduce(function(s,t){ return s+t.importo; }, 0);
  document.getElementById("revMeseCorrente").textContent = formatCurrency(meseRev || rand(3000,8000));
  var mesePrec = meseCorr === 0 ? 12 : meseCorr;
  var annoPrec = meseCorr === 0 ? annoCorr - 1 : annoCorr;
  var mesePrev = transazioni.filter(function(t){ var m = parseInt(t.data.split("-")[1]); return m === mesePrec && parseInt(t.data.split("-")[0]) === annoPrec && t.stato === "completato"; }).reduce(function(s,t){ return s+t.importo; }, 0);
  document.getElementById("revMesePrecedente").textContent = formatCurrency(mesePrev || rand(2500,7500));
  var crescita = mesePrev > 0 ? (((meseRev||0) - mesePrev) / mesePrev * 100).toFixed(1) : rand(5,20);
  document.getElementById("revCrescita").textContent = (crescita >= 0 ? "+" : "") + crescita + "%";
  document.getElementById("statNuoviUtenti").textContent = rand(20,80);
  document.getElementById("statTassoCrescita").textContent = "+" + rand(3,15) + "%";
  document.getElementById("statARPU").textContent = formatCurrency(rand(15,45) + 0.99);
  document.getElementById("statChurn").textContent = rand(2,8) + "%";
}

// ===== DASHBOARD =====
function renderDashboard() {
  var tbody = document.getElementById("ultimiAccessiBody");
  tbody.innerHTML = "";
  ultimiAccessi.slice(0,5).forEach(function(a) {
    tbody.innerHTML += "<tr><td>" + a.email + "</td><td>" + a.data + "</td><td>" + a.ip + "</td><td>" + a.dispositivo + "</td></tr>";
  });
}

// ===== UTENTI =====
function renderUtenti() {
  var q = (document.getElementById("utentiSearch").value || "").toLowerCase();
  var filtroAbb = document.getElementById("utentiFilterAbb").value;
  var filtroStatus = document.getElementById("utentiFilterStatus").value;
  var filtered = utenti.filter(function(u) {
    var match = u.email.toLowerCase().includes(q) || u.nome.toLowerCase().includes(q);
    if (filtroAbb && u.abbonamento !== filtroAbb) match = false;
    if (filtroStatus && u.status !== filtroStatus) match = false;
    return match;
  });
  var key = "utentiPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(filtered, currentPage[key], pp);
  var tbody = document.getElementById("utentiBody");
  tbody.innerHTML = "";
  result.items.forEach(function(u) {
    var statusClass = u.status === "attivo" ? "badge-active" : (u.status === "sospeso" ? "badge-warning" : "badge-inactive");
    tbody.innerHTML += "<tr><td>" + u.email + "</td><td>" + u.nome + "</td><td>" + u.abbonamento + '</td><td><span class="badge ' + statusClass + '">' + u.status.charAt(0).toUpperCase() + u.status.slice(1) + '</span></td><td>' + formatDate(u.dataReg) + '</td><td><button class="btn btn-secondary btn-xs" onclick="modificaUtente(' + u.id + ')">' + t("actionsLabel") + '</button> <button class="btn btn-danger btn-xs" onclick="eliminaUtente(' + u.id + ')">' + t("deleteBtn") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderUtenti");
}

function modificaUtente(id) {
  var u = utenti.find(function(u){ return u.id === id; });
  if (!u) return;
  document.getElementById("modalUtenteTitle").textContent = t("editSub");
  document.getElementById("editUtenteId").value = id;
  document.getElementById("formUtenteEmail").value = u.email;
  document.getElementById("formUtentePassword").value = "";
  document.getElementById("formUtenteNome").value = u.nome;
  document.getElementById("formUtenteAbbonamento").value = u.abbonamento;
  document.getElementById("formUtenteStatus").value = u.status;
  openModal("modalUtente");
}

function eliminaUtente(id) {
  if (!confirm(t("confirmDelete"))) return;
  var u = utenti.find(function(u){ return u.id === id; });
  utenti = utenti.filter(function(u){ return u.id !== id; });
  logAction("elimina", "Eliminato utente: " + (u ? u.email : id));
  renderUtenti(); aggiornaStats();
  toast(t("deleteUser") + " " + t("success"), "success");
}

function resetFormUtente() {
  document.getElementById("modalUtenteTitle").textContent = t("newUser");
  document.getElementById("editUtenteId").value = "";
  document.getElementById("formUtenteEmail").value = "";
  document.getElementById("formUtentePassword").value = "";
  document.getElementById("formUtenteNome").value = "";
  document.getElementById("formUtenteAbbonamento").value = "Free";
  document.getElementById("formUtenteStatus").value = "attivo";
}

function salvaUtente() {
  var id = document.getElementById("editUtenteId").value;
  var email = document.getElementById("formUtenteEmail").value.trim();
  var pw = document.getElementById("formUtentePassword").value;
  var nome = document.getElementById("formUtenteNome").value.trim();
  var abbonamento = document.getElementById("formUtenteAbbonamento").value;
  var status = document.getElementById("formUtenteStatus").value;
  if (!email || !nome) { toast(t("errorOccurred"), "error"); return; }
  if (id) {
    var u = utenti.find(function(u){ return u.id === parseInt(id); });
    if (u) { u.email = email; u.nome = nome; u.abbonamento = abbonamento; u.status = status; if (pw) u.password = pw; }
    logAction("modifica", "Modificato utente: " + email);
    toast(t("saveBtn") + " " + t("success"), "success");
  } else {
    if (!pw) { toast("Inserisci una password", "error"); return; }
    utenti.push({id: nextUserId++, email: email, nome: nome, abbonamento: abbonamento, status: status, dataReg: new Date().toISOString().slice(0,10), password: pw});
    logAction("crea", "Creato utente: " + email);
    toast(t("newUser") + " " + t("success"), "success");
  }
  closeModal("modalUtente"); renderUtenti(); aggiornaStats();
}
// ===== ABBONAMENTI =====
function renderAbbonamenti() {
  var q = (document.getElementById("abbonamentiSearch").value || "").toLowerCase();
  var filtroStato = document.getElementById("abbonamentiFilterStato").value;
  var filtered = abbonamenti.filter(function(a) {
    var match = a.utente.toLowerCase().includes(q);
    if (filtroStato && a.stato !== filtroStato) match = false;
    return match;
  });
  var key = "abbonamentiPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(filtered, currentPage[key], pp);
  var tbody = document.getElementById("abbonamentiBody");
  tbody.innerHTML = "";
  result.items.forEach(function(a, idx) {
    var statoClass = a.stato === "attivo" ? "badge-active" : (a.stato === "sospeso" ? "badge-warning" : "badge-inactive");
    var realIdx = abbonamenti.indexOf(a);
    tbody.innerHTML += "<tr><td>" + a.utente + "</td><td>" + a.piano + "</td><td>" + formatDate(a.inizio) + "</td><td>" + formatDate(a.scadenza) + '</td><td><span class="badge ' + statoClass + '">' + a.stato.charAt(0).toUpperCase() + a.stato.slice(1) + '</span></td><td><label class="toggle-switch"><input type="checkbox" ' + (a.rinnovo?"checked":"") + ' onchange="toggleRinnovo(' + realIdx + ',this)"><span class="toggle-slider"></span></label></td><td><button class="btn btn-secondary btn-xs" onclick="modificaAbbonamento(' + realIdx + ')">' + t("actionsLabel") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderAbbonamenti");
}

function toggleRinnovo(idx, el) {
  abbonamenti[idx].rinnovo = el.checked;
  logAction("modifica", "Rinnovo " + (el.checked ? "attivato" : "disattivato") + " per " + abbonamenti[idx].utente);
  toast("Rinnovo " + (el.checked ? "attivato" : "disattivato"), "success");
}

function modificaAbbonamento(idx) {
  var a = abbonamenti[idx];
  document.getElementById("editAbbonamentoIdx").value = idx;
  document.getElementById("formAbbPiano").value = a.piano;
  document.getElementById("formAbbInizio").value = a.inizio;
  document.getElementById("formAbbScadenza").value = a.scadenza;
  document.getElementById("formAbbStato").value = a.stato;
  openModal("modalAbbonamento");
}

function salvaAbbonamento() {
  var idx = parseInt(document.getElementById("editAbbonamentoIdx").value);
  abbonamenti[idx].piano = document.getElementById("formAbbPiano").value;
  abbonamenti[idx].inizio = document.getElementById("formAbbInizio").value;
  abbonamenti[idx].scadenza = document.getElementById("formAbbScadenza").value;
  abbonamenti[idx].stato = document.getElementById("formAbbStato").value;
  logAction("modifica", "Modificato abbonamento: " + abbonamenti[idx].utente);
  closeModal("modalAbbonamento"); renderAbbonamenti(); aggiornaStats();
  toast("Abbonamento modificato", "success");
}

// ===== GRUPPI =====
function renderGruppi() {
  var grid = document.getElementById("gruppiGrid");
  grid.innerHTML = "";
  gruppi.forEach(function(g) {
    grid.innerHTML += '<div class="gruppo-card"><h4>' + g.nome + '</h4><p><strong>' + g.membri + '</strong> membri</p><p style="font-size:0.78rem;color:var(--tx3)">' + t("dateLabel") + ": " + formatDate(g.dataCreazione) + '</p><div style="margin-top:12px"><button class="btn btn-danger btn-xs" onclick="eliminaGruppo(' + g.id + ')">' + t("deleteBtn") + "</button></div></div>";
  });
}

function eliminaGruppo(id) {
  if (!confirm(t("confirmDelete"))) return;
  var g = gruppi.find(function(g){ return g.id === id; });
  gruppi = gruppi.filter(function(g){ return g.id !== id; });
  logAction("elimina", "Eliminato gruppo: " + (g ? g.nome : id));
  renderGruppi(); toast("Gruppo eliminato", "success");
}

function creaGruppo() {
  var nome = document.getElementById("formGruppoNome").value.trim();
  if (!nome) { toast("Inserisci un nome", "error"); return; }
  gruppi.push({id: nextGruppoId++, nome: nome, membri: rand(3,20), dataCreazione: new Date().toISOString().slice(0,10)});
  logAction("crea", "Creato gruppo: " + nome);
  closeModal("modalGruppo"); document.getElementById("formGruppoNome").value = "";
  renderGruppi(); toast("Gruppo creato", "success");
}

// ===== TRANSAZIONI =====
function renderTransazioni() {
  var q = (document.getElementById("transazioniSearch").value || "").toLowerCase();
  var filtroTipo = document.getElementById("transazioniFilterTipo").value;
  var filtroStato = document.getElementById("transazioniFilterStato").value;
  var filtroMin = parseFloat(document.getElementById("transazioniFilterMin").value);
  var filtroMax = parseFloat(document.getElementById("transazioniFilterMax").value);
  var filtroDa = document.getElementById("transazioniFilterDa").value;
  var filtroA = document.getElementById("transazioniFilterA").value;
  var filtered = transazioni.filter(function(t) {
    var match = t.id.toLowerCase().includes(q) || t.utente.toLowerCase().includes(q);
    if (filtroTipo && t.tipo !== filtroTipo) match = false;
    if (filtroStato && t.stato !== filtroStato) match = false;
    if (!isNaN(filtroMin) && t.importo < filtroMin) match = false;
    if (!isNaN(filtroMax) && t.importo > filtroMax) match = false;
    if (filtroDa && t.data < filtroDa) match = false;
    if (filtroA && t.data > filtroA) match = false;
    return match;
  });
  var key = "transazioniPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(filtered, currentPage[key], pp);
  var tbody = document.getElementById("transazioniBody");
  tbody.innerHTML = "";
  result.items.forEach(function(tx) {
    var statoClass = tx.stato === "completato" ? "badge-active" : (tx.stato === "pending" ? "badge-warning" : "badge-inactive");
    var tipoClass = tx.tipo === "pagamento" ? "badge-info" : (tx.tipo === "rimborso" ? "badge-warning" : "badge-inactive");
    tbody.innerHTML += "<tr><td><code>" + tx.id + '</code></td><td>' + tx.utente + "</td><td>" + formatCurrency(tx.importo) + '</td><td><span class="badge ' + tipoClass + '">' + tx.tipo.charAt(0).toUpperCase() + tx.tipo.slice(1) + '</span></td><td>' + formatDate(tx.data) + '</td><td><span class="badge ' + statoClass + '">' + tx.stato.charAt(0).toUpperCase() + tx.stato.slice(1) + '</span></td><td><button class="btn btn-secondary btn-xs" onclick="dettaglioTransazione(\'' + tx.id + '\')">' + t("detailsLabel") + '</button> <button class="btn btn-danger btn-xs" onclick="reverseTransazione(\'' + tx.id + '\')">' + t("reverseBtn") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderTransazioni");
}

function dettaglioTransazione(id) {
  var tx = transazioni.find(function(t){ return t.id === id; });
  if (!tx) { toast("Transazione non trovata", "error"); return; }
  document.getElementById("transazioneDetails").innerHTML = "<div style='display:grid;gap:12px'><div><strong>ID:</strong> " + tx.id + '</div><div><strong>' + t("userLabel") + ":</strong> " + tx.utente + '</div><div><strong>' + t("amountLabel") + ":</strong> " + formatCurrency(tx.importo) + '</div><div><strong>' + t("typeLabel") + ":</strong> " + tx.tipo + '</div><div><strong>' + t("dateLabel") + ":</strong> " + formatDate(tx.data) + '</div><div><strong>' + t("statusLabel") + ":</strong> " + tx.stato + '</div><div><strong>' + t("detailsLabel") + ":</strong> " + (tx.dettagli || "-") + "</div></div>";
  openModal("modalTransazione");
}

function reverseTransazione(id) {
  if (!confirm(t("reverseTxDesc"))) return;
  var idx = transazioni.findIndex(function(tx){ return tx.id === id; });
  if (idx === -1) { toast("Transazione non trovata", "error"); return; }
  var txObj = transazioni[idx];
  transazioni.push({id: generateId(), utente: txObj.utente, importo: txObj.importo, tipo: "reverse", data: new Date().toISOString().slice(0,10), stato: "completato", dettagli: "Reverse di " + txObj.id});
  txObj.stato = "reverse";
  logAction("modifica", "Reverse transazione: " + id);
  renderTransazioni(); aggiornaStats();
  toast("Transazione invertita", "success");
}
// ===== REVENUE =====
function renderRevenue() {
  var tbody = document.getElementById("revenueBody");
  tbody.innerHTML = "";
  var sorted = transazioni.slice().sort(function(a,b){ return b.data.localeCompare(a.data); }).slice(0,15);
  sorted.forEach(function(t) {
    tbody.innerHTML += "<tr><td>" + formatDate(t.data) + "</td><td>" + formatCurrency(t.importo) + "</td><td>" + t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1) + "</td><td>" + t.utente + "</td></tr>";
  });
}

// ===== LOG =====
function renderLog() {
  var filtro = (document.getElementById("logFilterAzione").value || "").toLowerCase();
  var filtroAdmin = (document.getElementById("logFilterAdmin").value || "").toLowerCase();
  var filtroDa = document.getElementById("logFilterDa").value;
  var filtroA = document.getElementById("logFilterA").value;
  var adminSet = new Set();
  logActions.forEach(function(l) { if (l.admin) adminSet.add(l.admin); });
  var adminSelect = document.getElementById("logFilterAdmin");
  var currentVal = adminSelect.value;
  adminSelect.innerHTML = '<option value="">' + t("allAdmins") + "</option>";
  adminSet.forEach(function(a) {
    adminSelect.innerHTML += '<option value="' + a + '" ' + (a === currentVal ? "selected" : "") + ">" + a + "</option>";
  });
  var filtered = logActions.filter(function(l) {
    var match = true;
    if (filtro && !l.azione.toLowerCase().includes(filtro)) match = false;
    if (filtroAdmin && l.admin !== filtroAdmin) match = false;
    if (filtroDa && l.timestamp < filtroDa) match = false;
    if (filtroA && l.timestamp > filtroA + "T23:59:59") match = false;
    return match;
  });
  var key = "logPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(filtered, currentPage[key], pp);
  var tbody = document.getElementById("logBody");
  tbody.innerHTML = "";
  result.items.forEach(function(l) {
    var d = new Date(l.timestamp);
    var ts = d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT");
    tbody.innerHTML += "<tr><td>" + ts + "</td><td>" + l.admin + '</td><td><span class="badge badge-info">' + l.azione + '</span></td><td>' + l.dettagli + "</td><td>" + l.ip + "</td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderLog");
}

function filtraLog() { renderLog(); }

// ===== BACKUP =====
function renderBackup() {
  var tbody = document.getElementById("backupBody");
  tbody.innerHTML = "";
  backupList.forEach(function(b, idx) {
    tbody.innerHTML += "<tr><td>" + b.data + "</td><td>" + b.dimensione + '</td><td><button class="btn btn-secondary btn-xs" onclick="toast(\'' + t("fileDownloaded") + "\",\"info\")" + '">' + t("download") + '</button> <button class="btn btn-primary btn-xs" onclick="toast(\'Ripristino avviato\',\'warning\')">Ripristina</button> <button class="btn btn-danger btn-xs" onclick="eliminaBackup(' + idx + ')">' + t("deleteBtn") + "</button></td></tr>";
  });
}

function eliminaBackup(idx) {
  if (!confirm(t("confirmDelete"))) return;
  backupList.splice(idx, 1);
  renderBackup(); toast("Backup eliminato", "success");
}

function creaBackup() {
  var now = new Date();
  var dataStr = now.toLocaleDateString("it-IT") + " " + now.toLocaleTimeString("it-IT");
  backupList.unshift({data: dataStr, dimensione: (rand(20,50)/10 + 2).toFixed(1) + " GB"});
  logAction("backup", "Backup creato: " + dataStr);
  renderBackup(); toast("Backup creato con successo", "success");
}

// ===== NOTIFICHE =====
function renderNotifiche() {
  var tbody = document.getElementById("notificheBody");
  tbody.innerHTML = "";
  notifiche.forEach(function(n) {
    var tipoClass = n.tipo === "info" ? "badge-info" : (n.tipo === "success" ? "badge-active" : (n.tipo === "warning" ? "badge-warning" : "badge-inactive"));
    tbody.innerHTML += "<tr><td>" + n.titolo + "</td><td>" + n.messaggio + '</td><td><span class="badge ' + tipoClass + '">' + n.tipo.charAt(0).toUpperCase() + n.tipo.slice(1) + '</span></td><td>' + n.destinazione + "</td><td>" + formatDate(n.data) + "</td></tr>";
  });
  var sentBody = document.getElementById("sentNotificheBody");
  if (sentBody) {
    sentBody.innerHTML = "";
    notifiche.slice(0, 10).forEach(function(n) {
      sentBody.innerHTML += "<tr><td>" + n.titolo + "</td><td>" + n.messaggio + "</td><td>" + n.tipo + "</td><td>" + n.data + "</td></tr>";
    });
  }
}

function inviaNotifica() {
  var titolo = document.getElementById("formNotifTitolo").value.trim();
  var msg = document.getElementById("formNotifMessaggio").value.trim();
  var tipo = document.getElementById("formNotifTipo").value;
  var dest = document.getElementById("formNotifDestinazione").value;
  var iconUrl = document.getElementById("formNotifIcon").value.trim();
  if (!titolo || !msg) { toast(t("errorOccurred"), "error"); return; }
  notifiche.unshift({id: nextNotifId++, titolo: titolo, messaggio: msg, tipo: tipo, destinazione: dest, iconUrl: iconUrl, data: new Date().toISOString().slice(0,10)});
  if ("Notification" in window && Notification.permission === "granted") {
    var n = new Notification(titolo, {body: msg, icon: iconUrl || undefined});
    setTimeout(function() { n.close(); }, 5000);
  }
  logAction("crea", "Notifica inviata: " + titolo + " (" + dest + ")");
  closeModal("modalNotifica");
  document.getElementById("formNotifTitolo").value = "";
  document.getElementById("formNotifMessaggio").value = "";
  document.getElementById("formNotifIcon").value = "";
  renderNotifiche(); toast("Notifica inviata", "success");
}

// ===== TEAM =====
function renderTeam() {
  var grid = document.getElementById("teamGrid");
  grid.innerHTML = "";
  var colors = ["#EF4444","#2563EB","#34D399","#FBBF24","#FB923C","#8B5CF6"];
  teamMembers.forEach(function(m, idx) {
    var initials = m.nome.split(" ").map(function(s){ return s.charAt(0); }).join("").toUpperCase();
    grid.innerHTML += '<div class="team-card"><div class="team-avatar" style="background:' + colors[idx % colors.length] + '">' + initials + '</div><div class="team-info"><h4>' + m.nome + "</h4><p>" + m.ruolo + '</p><p style="font-size:0.72rem;color:var(--tx3)">' + m.email + '</p></div><button class="btn btn-danger btn-xs" onclick="rimuoviMembro(' + m.id + ')">' + t("deleteBtn") + "</button></div>";
  });
}

function rimuoviMembro(id) {
  if (!confirm(t("confirmDelete"))) return;
  var m = teamMembers.find(function(m){ return m.id === id; });
  teamMembers = teamMembers.filter(function(m){ return m.id !== id; });
  logAction("elimina", "Rimosso membro team: " + (m ? m.nome : id));
  renderTeam(); toast("Membro rimosso", "success");
}

function aggiungiMembro() {
  var email = document.getElementById("teamEmail").value.trim();
  var ruolo = document.getElementById("teamRuolo").value;
  if (!email) { toast("Inserisci un email", "error"); return; }
  var nome = email.split("@")[0].replace(/[.]/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  var newId = teamMembers.length > 0 ? Math.max.apply(Math, teamMembers.map(function(m){ return m.id; })) + 1 : 1;
  teamMembers.push({id: newId, nome: nome, email: email, ruolo: ruolo});
  logAction("crea", "Aggiunto membro team: " + email);
  document.getElementById("teamEmail").value = "";
  renderTeam(); toast("Membro aggiunto", "success");
}

// ===== PIANI =====
function renderPiani() {
  var grid = document.getElementById("pianiGrid");
  grid.innerHTML = "";
  var planColors = ["#94A3B8","#FB923C","#2563EB","#8B5CF6","#EF4444","#FBBF24","#34D399","#EC4899"];
  var planIcons = ["free","starter","basic","pro","bizlite","business","enterprise","lifetime"];
  piani.forEach(function(p, idx) {
    var iconSvg = "";
    if (p.id === "free") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
    else if (p.id === "starter") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    else if (p.id === "basic") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>';
    else if (p.id === "pro") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    else if (p.id === "bizlite") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>';
    else if (p.id === "business") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    else if (p.id === "enterprise") iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
    else iconSvg = '<svg width=32 height=32 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    grid.innerHTML += '<div class="plan-card"><div class="plan-icon" style="color:' + planColors[idx % planColors.length] + '">' + iconSvg + '</div><div class="plan-name">' + p.nome + '</div><div class="plan-price"><input type="text" value="' + p.prezzo.toFixed(2) + '" onchange="aggiornaPrezzo(\'' + p.id + '\',this.value)" style="width:80px">' + (p.nome === "Free" ? "" : '<span style="font-size:0.7rem;color:var(--tx2)">/mese</span>') + '</div><div class="plan-status"><label class="toggle-switch"><input type="checkbox" ' + (p.attivo?"checked":"") + ' onchange="togglePiano(\'' + p.id + '\',this)"><span class="toggle-slider"></span></label><span style="font-size:0.78rem;color:var(--tx2);margin-left:8px">' + (p.attivo ? t("active") : t("inactive")) + "</span></div></div>";
  });
}

function aggiornaPrezzo(id, val) {
  var p = piani.find(function(p){ return p.id === id; });
  if (p) { var nuovo = parseFloat(val); if (!isNaN(nuovo) && nuovo >= 0) { p.prezzo = nuovo; logAction("modifica", "Prezzo aggiornato: " + p.nome + " = " + formatCurrency(nuovo)); toast("Prezzo aggiornato", "success"); } }
}

function togglePiano(id, el) {
  var p = piani.find(function(p){ return p.id === id; });
  if (p) { p.attivo = el.checked; renderPiani(); logAction("modifica", "Piano " + (el.checked?"attivato":"disattivato") + ": " + p.nome); toast("Piano " + (el.checked ? t("active") : t("inactive"))); }
}

// ===== FEATURE FLAGS =====
function renderFeatureFlags() {
  var container = document.getElementById("featureFlagsContainer");
  container.innerHTML = "";
  var labels = { chat_ai:"Chat AI", premium_support:t("roleSupport"), api_access:"API Access", advanced_stats:t("statsTitle"), team_management:t("teamTitle"), export_data:"Export Data", customization:"Customization", multi_language:"Multi-language", priority_support:"Priority Support", beta_features:"Beta Features", dark_mode:"Dark Mode", analytics:"Analytics", file_manager:t("fileManagerTitle"), ticket_system:t("ticketTitle"), coupon_system:t("couponTitle"), webhook_system:t("webhookTitle") };
  var descs = { chat_ai:"AI Assistant for users", premium_support:"24/7 Priority support", api_access:"Public API access", advanced_stats:t("statsSubtitle"), team_management:t("teamSubtitle"), export_data:"CSV/PDF export", customization:"Themes and customization", multi_language:"Multi-language support", priority_support:"Guaranteed response support", beta_features:"Beta features access", dark_mode:"Dark mode", analytics:"Analytics and tracking", file_manager:t("fileManagerSubtitle"), ticket_system:t("ticketSubtitle"), coupon_system:t("couponSubtitle"), webhook_system:t("webhookSubtitle") };
  Object.keys(featureFlags).forEach(function(key) {
    container.innerHTML += '<div class="feature-row"><div class="f-info"><h4>' + (labels[key]||key) + '</h4><p>' + (descs[key]||"") + '</p></div><label class="toggle-switch"><input type="checkbox" ' + (featureFlags[key]?"checked":"") + ' onchange="toggleFeature(\'' + key + '\',this)"><span class="toggle-slider"></span></label></div>';
  });
}

function toggleFeature(key, el) {
  featureFlags[key] = el.checked;
  logAction("modifica", "Feature " + (el.checked?"attivata":"disattivata") + ": " + key);
  toast("Feature " + (el.checked ? "attivata" : "disattivata"), "success");
}
// ===== COUPON =====
function renderCoupon() {
  var key = "couponPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(couponList, currentPage[key], pp);
  var tbody = document.getElementById("couponBody");
  tbody.innerHTML = "";
  result.items.forEach(function(c) {
    var attivoClass = c.attivo ? "badge-active" : "badge-inactive";
    tbody.innerHTML += "<tr><td><code>" + c.codice + '</code></td><td>' + c.sconto + (c.tipo === "percentuale" ? "%" : "â‚¬") + '</td><td>' + c.tipo + '</td><td>' + formatDate(c.inizio) + '</td><td>' + formatDate(c.fine) + '</td><td>' + c.maxUsi + '</td><td>' + c.usiCorrenti + '</td><td><span class="badge ' + attivoClass + '">' + (c.attivo ? t("active") : t("inactive")) + '</span></td><td><label class="toggle-switch"><input type="checkbox" ' + (c.attivo?"checked":"") + ' onchange="toggleCoupon(' + c.id + ',this)"><span class="toggle-slider"></span></label> <button class="btn btn-secondary btn-xs" onclick="modificaCoupon(' + c.id + ')">' + t("actionsLabel") + '</button> <button class="btn btn-danger btn-xs" onclick="eliminaCoupon(' + c.id + ')">' + t("deleteBtn") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderCoupon");
}

function toggleCoupon(id, el) {
  var c = couponList.find(function(c){ return c.id === id; });
  if (c) { c.attivo = el.checked; renderCoupon(); toast("Coupon " + (el.checked ? t("active") : t("inactive"))); }
}

function modificaCoupon(id) {
  var c = couponList.find(function(c){ return c.id === id; });
  if (!c) return;
  document.getElementById("modalCouponTitle").textContent = t("editSub");
  document.getElementById("editCouponId").value = id;
  document.getElementById("formCouponCodice").value = c.codice;
  document.getElementById("formCouponSconto").value = c.sconto;
  document.getElementById("formCouponTipo").value = c.tipo;
  document.getElementById("formCouponInizio").value = c.inizio;
  document.getElementById("formCouponFine").value = c.fine;
  document.getElementById("formCouponMaxUses").value = c.maxUsi;
  document.getElementById("formCouponAttivo").checked = c.attivo;
  openModal("modalCoupon");
}

function eliminaCoupon(id) {
  if (!confirm(t("confirmDeleteCoupon"))) return;
  couponList = couponList.filter(function(c){ return c.id !== id; });
  renderCoupon(); toast(t("couponDeleted"), "success");
}

function resetFormCoupon() {
  document.getElementById("modalCouponTitle").textContent = t("newCoupon");
  document.getElementById("editCouponId").value = "";
  document.getElementById("formCouponCodice").value = generateCouponCode();
  document.getElementById("formCouponSconto").value = 10;
  document.getElementById("formCouponTipo").value = "percentuale";
  var oggi = new Date().toISOString().slice(0,10);
  document.getElementById("formCouponInizio").value = oggi;
  var fine = new Date(); fine.setMonth(fine.getMonth() + 3); document.getElementById("formCouponFine").value = fine.toISOString().slice(0,10);
  document.getElementById("formCouponMaxUses").value = 100;
  document.getElementById("formCouponAttivo").checked = true;
}

function salvaCoupon() {
  var id = document.getElementById("editCouponId").value;
  var codice = document.getElementById("formCouponCodice").value.trim();
  var sconto = parseFloat(document.getElementById("formCouponSconto").value);
  var tipo = document.getElementById("formCouponTipo").value;
  var inizio = document.getElementById("formCouponInizio").value;
  var fine = document.getElementById("formCouponFine").value;
  var maxUsi = parseInt(document.getElementById("formCouponMaxUses").value);
  var attivo = document.getElementById("formCouponAttivo").checked;
  if (!codice || isNaN(sconto)) { toast(t("errorOccurred"), "error"); return; }
  if (id) {
    var c = couponList.find(function(c){ return c.id === parseInt(id); });
    if (c) { c.codice = codice; c.sconto = sconto; c.tipo = tipo; c.inizio = inizio; c.fine = fine; c.maxUsi = maxUsi; c.attivo = attivo; }
    toast(t("couponUpdated"), "success");
  } else {
    couponList.push({id: nextCouponId++, codice: codice, sconto: sconto, tipo: tipo, inizio: inizio, fine: fine, maxUsi: maxUsi, usiCorrenti: 0, attivo: attivo});
    toast(t("couponCreated"), "success");
  }
  closeModal("modalCoupon"); renderCoupon();
}

function generaCouponUsaEGetta() {
  var oggi = new Date().toISOString().slice(0,10);
  var domani = new Date(); domani.setDate(domani.getDate() + 1);
  couponList.push({id: nextCouponId++, codice: "ONETIME-" + generateCouponCode(), sconto: rand(10,50), tipo: "percentuale", inizio: oggi, fine: domani.toISOString().slice(0,10), maxUsi: 1, usiCorrenti: 0, attivo: true});
  renderCoupon(); toast(t("couponCreated") + " (usa-e-getta)", "success");
}

// ===== WEBHOOK =====
function renderWebhook() {
  var key = "webhookPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(webhookList, currentPage[key], pp);
  var tbody = document.getElementById("webhookBody");
  tbody.innerHTML = "";
  result.items.forEach(function(w) {
    var statusClass = w.attivo ? "badge-active" : "badge-inactive";
    var eventiStr = w.eventi ? w.eventi.join(", ") : "-";
    tbody.innerHTML += "<tr><td>" + w.nome + '</td><td><code style="font-size:0.75rem">' + w.url + '</code></td><td style="font-size:0.78rem">' + eventiStr + '</td><td><code style="font-size:0.7rem">' + (w.secret ? w.secret.slice(0,12) + "..." : "-") + '</code></td><td><span class="badge ' + statusClass + '">' + (w.attivo ? t("active") : t("inactive")) + '</span></td><td><button class="btn btn-xs btn-secondary" onclick="testWebhook(' + w.id + ')">Test</button> <button class="btn btn-xs btn-secondary" onclick="modificaWebhook(' + w.id + ')">' + t("actionsLabel") + '</button> <button class="btn btn-xs btn-danger" onclick="eliminaWebhook(' + w.id + ')">' + t("deleteBtn") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderWebhook");
}

function testWebhook(id) {
  var w = webhookList.find(function(w){ return w.id === id; });
  if (!w) return;
  var payload = {event: "test", timestamp: new Date().toISOString(), data: {message: "Webhook test from KAZKA Admin"}};
  webhookLogs.unshift({webhookId: id, webhookName: w.nome, timestamp: new Date().toISOString(), status: 200, response: "OK (simulated)"});
  toast(t("webhookTestSent") + " - " + w.nome, "info");
  if (document.getElementById("viewWebhook").classList.contains("active")) renderWebhookLogs();
}

function renderWebhookLogs() {
  var logsDiv = document.getElementById("webhookLogsContainer");
  if (!logsDiv) return;
  logsDiv.innerHTML = '<div class="card-title">' + t("webhookLogs") + "</div>";
  var recent = webhookLogs.slice(0, 10);
  if (recent.length === 0) { logsDiv.innerHTML += '<p style="color:var(--tx2);font-size:0.85rem">' + t("noWebhookLogs") + "</p>"; return; }
  logsDiv.innerHTML += '<div class="webhook-log">';
  recent.forEach(function(l) {
    var d = new Date(l.timestamp);
    var ts = d.toLocaleTimeString("it-IT");
    logsDiv.innerHTML += '<div class="webhook-log-item"><span>' + l.webhookName + " - " + ts + '</span><span class="badge ' + (l.status < 300 ? "badge-active" : "badge-inactive") + '">' + l.status + "</span></div>";
  });
  logsDiv.innerHTML += "</div>";
}

function modificaWebhook(id) {
  var w = webhookList.find(function(w){ return w.id === id; });
  if (!w) return;
  document.getElementById("modalWebhookTitle").textContent = t("editSub");
  document.getElementById("editWebhookId").value = id;
  document.getElementById("formWebhookNome").value = w.nome;
  document.getElementById("formWebhookUrl").value = w.url;
  document.getElementById("formWebhookSecret").value = w.secret;
  var checks = document.querySelectorAll("#webhookEventsContainer input[type=checkbox]");
  checks.forEach(function(c) { c.checked = w.eventi && w.eventi.indexOf(c.value) >= 0; });
  openModal("modalWebhook");
}

function eliminaWebhook(id) {
  if (!confirm(t("confirmDeleteWebhook"))) return;
  webhookList = webhookList.filter(function(w){ return w.id !== id; });
  renderWebhook(); toast(t("webhookDeleted"), "success");
}

function resetFormWebhook() {
  document.getElementById("modalWebhookTitle").textContent = t("newWebhook");
  document.getElementById("editWebhookId").value = "";
  document.getElementById("formWebhookNome").value = "";
  document.getElementById("formWebhookUrl").value = "";
  document.getElementById("formWebhookSecret").value = generateSecret();
  document.querySelectorAll("#webhookEventsContainer input[type=checkbox]").forEach(function(c) { c.checked = c.value === "user.created"; });
}

function salvaWebhook() {
  var id = document.getElementById("editWebhookId").value;
  var nome = document.getElementById("formWebhookNome").value.trim();
  var url = document.getElementById("formWebhookUrl").value.trim();
  var secret = document.getElementById("formWebhookSecret").value.trim();
  if (!nome || !url) { toast(t("errorOccurred"), "error"); return; }
  var eventi = [];
  document.querySelectorAll("#webhookEventsContainer input[type=checkbox]:checked").forEach(function(c) { eventi.push(c.value); });
  if (eventi.length === 0) { toast("Seleziona almeno un evento", "error"); return; }
  if (id) {
    var w = webhookList.find(function(w){ return w.id === parseInt(id); });
    if (w) { w.nome = nome; w.url = url; w.eventi = eventi; w.secret = secret; }
    toast(t("webhookUpdated"), "success");
  } else {
    webhookList.push({id: nextWebhookId++, nome: nome, url: url, eventi: eventi, secret: secret || generateSecret(), attivo: true});
    toast(t("webhookCreated"), "success");
  }
  closeModal("modalWebhook"); renderWebhook();
}
// ===== TICKET =====
function renderTicket() {
  var filtroStato = document.getElementById("ticketFilterStato").value;
  var filtroPriorita = document.getElementById("ticketFilterPriorita").value;
  var filtered = ticketList.filter(function(t) {
    var match = true;
    if (filtroStato && t.stato !== filtroStato) match = false;
    if (filtroPriorita && t.priorita !== filtroPriorita) match = false;
    return match;
  });
  var key = "ticketPagination";
  if (!currentPage[key]) currentPage[key] = 1;
  var pp = currentPage[key + "_perPage"] || perPage;
  var result = paginate(filtered, currentPage[key], pp);
  var tbody = document.getElementById("ticketBody");
  tbody.innerHTML = "";
  result.items.forEach(function(tx) {
    var prioritaClass = "badge-" + (tx.priorita === "critica" ? "critical" : tx.priorita === "alta" ? "high" : tx.priorita === "media" ? "medium" : "low");
    var statoClass = "badge-" + (tx.stato === "aperto" ? "open" : tx.stato === "in_lavorazione" ? "working" : tx.stato === "risolto" ? "resolved" : "closed");
    tbody.innerHTML += "<tr><td>#" + tx.id + '</td><td>' + tx.utente + '</td><td>' + tx.oggetto + '</td><td><span class="badge ' + prioritaClass + '">' + tx.priorita.charAt(0).toUpperCase() + tx.priorita.slice(1) + '</span></td><td><span class="badge ' + statoClass + '">' + tx.stato.replace("_"," ") + '</span></td><td>' + formatDate(tx.data) + '</td><td><button class="btn btn-secondary btn-xs" onclick="apriTicket(' + tx.id + ')">' + t("replyLabel") + "</button></td></tr>";
  });
  renderPagination(result.total, currentPage[key], pp, key, "renderTicket");
  document.getElementById("ticketStatOpen").textContent = ticketList.filter(function(t){ return t.stato === "aperto"; }).length;
  document.getElementById("ticketStatWorking").textContent = ticketList.filter(function(t){ return t.stato === "in_lavorazione"; }).length;
  document.getElementById("ticketStatResolved").textContent = ticketList.filter(function(t){ return t.stato === "risolto" && t.data === new Date().toISOString().slice(0,10); }).length;
  document.getElementById("ticketStatAvg").textContent = rand(2,24) + "h";
}

function apriTicket(id) {
  var txObj = ticketList.find(function(t){ return t.id === id; });
  if (!txObj) return;
  document.getElementById("editTicketId").value = id;
  document.getElementById("formTicketRisposta").value = "";
  document.getElementById("formTicketStato").value = txObj.stato;
  var info = '<div><strong>#' + txObj.id + "</strong> - " + txObj.oggetto + '</div><div style="font-size:0.82rem;color:var(--tx2)">' + t("userLabel") + ": " + txObj.utente + " | " + t("priorityLabel") + ": " + txObj.priorita + " | " + t("dateLabel") + ": " + formatDate(txObj.data) + "</div>";
  if (txObj.risposte && txObj.risposte.length > 0) {
    info += '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px">';
    txObj.risposte.forEach(function(r) { info += '<div style="font-size:0.8rem;margin-bottom:4px"><strong>' + r.admin + ":</strong> " + r.testo + ' <span style="color:var(--tx3)">(' + r.data + ")</span></div>"; });
    info += "</div>";
  }
  document.getElementById("ticketInfo").innerHTML = info;
  openModal("modalTicket");
}

function salvaRispostaTicket() {
  var id = parseInt(document.getElementById("editTicketId").value);
  var txObj = ticketList.find(function(t){ return t.id === id; });
  if (!txObj) return;
  var risposta = document.getElementById("formTicketRisposta").value.trim();
  var nuovoStato = document.getElementById("formTicketStato").value;
  if (risposta) {
    if (!txObj.risposte) txObj.risposte = [];
    txObj.risposte.push({admin: "Admin", testo: risposta, data: new Date().toISOString().slice(0,10)});
  }
  txObj.stato = nuovoStato;
  logAction("modifica", "Ticket #" + id + " aggiornato: " + nuovoStato);
  closeModal("modalTicket"); renderTicket();
  toast(t("ticketUpdated"), "success");
}

// ===== FILE MANAGER =====
function renderFiles() {
  var q = (document.getElementById("fileSearch").value || "").toLowerCase();
  var filtered = filesList.filter(function(f) { return f.nome.toLowerCase().includes(q); });
  var grid = document.getElementById("filesGrid");
  grid.innerHTML = "";
  var fileIcons = { pdf:"\uD83D\uDCC4", image:"\uD83D\uDDBC", sql:"\uD83D\uDDC3", csv:"\uD83D\uDCCA", zip:"\uD83D\uDCE6", doc:"\uD83D\uDCDD", default:"\uD83D\uDCC4" };
  filtered.forEach(function(f) {
    var icon = fileIcons[f.tipo] || fileIcons.default;
    var preview = f.tipo === "image" ? '<div style="width:100%;height:80px;background:var(--bg4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:8px;overflow:hidden"><span>' + icon + "</span></div>" : '<div style="font-size:3rem;margin-bottom:8px">' + icon + "</div>";
    grid.innerHTML += '<div class="file-card">' + preview + '<div class="file-name">' + f.nome + '</div><div class="file-size">' + f.dimensione + " | " + formatDate(f.data) + '</div><div class="file-actions"><button class="btn btn-secondary btn-xs" onclick="toast(\'' + t("fileDownloaded") + "\",\"info\")" + '">\u2B07</button><button class="btn btn-danger btn-xs" onclick="eliminaFile(' + f.id + ')">\u2716</button></div></div>";
  });
  if (filtered.length === 0) grid.innerHTML = '<p style="color:var(--tx2);text-align:center;padding:32px">' + t("noResults") + "</p>";
}

function handleFileUpload(input) {
  if (!input.files || input.files.length === 0) return;
  var progressDiv = document.getElementById("uploadProgress");
  var fill = document.getElementById("uploadProgressFill");
  var text = document.getElementById("uploadProgressText");
  progressDiv.style.display = "block";
  var p = 0;
  var interval = setInterval(function() {
    p += rand(5, 15);
    if (p >= 100) { p = 100; clearInterval(interval);
      for (var i = 0; i < input.files.length; i++) {
        var f = input.files[i];
        var size = (f.size / (1024*1024)).toFixed(1) + " MB";
        var ext = f.name.split(".").pop().toLowerCase();
        var tipoMap = {pdf:"pdf", png:"image", jpg:"image", jpeg:"image", gif:"image", svg:"image", webp:"image", sql:"sql", csv:"csv", zip:"zip", rar:"zip", "7z":"zip", doc:"doc", docx:"doc", xls:"doc", xlsx:"doc"};
        filesList.unshift({id: nextFileId++, nome: f.name, dimensione: size, tipo: tipoMap[ext] || "default", data: new Date().toISOString().slice(0,10)});
      }
      renderFiles(); toast(t("fileUploaded"), "success");
      setTimeout(function() { progressDiv.style.display = "none"; }, 1000);
    }
    fill.style.width = p + "%";
    text.textContent = p + "%";
  }, 200);
  input.value = "";
}

function eliminaFile(id) {
  if (!confirm(t("confirmDeleteFile"))) return;
  filesList = filesList.filter(function(f){ return f.id !== id; });
  renderFiles(); toast(t("fileDeleted"), "success");
}

// ===== EMAIL =====
function testEmail() {
  toast("Email di test inviata a admin@kazka.it (simulazione)", "success");
  logAction("email", "Inviata email test");
}
function salvaConfigEmail() {
  toast("Configurazione email salvata (simulazione)", "success");
  logAction("modifica", "Configurazione email aggiornata");
}
function inviaEmailMassiva() {
  var oggetto = document.getElementById("emailMassivaOggetto").value.trim();
  var corpo = document.getElementById("emailMassivaCorpo").value.trim();
  if (!oggetto || !corpo) { toast("Compila oggetto e corpo", "error"); return; }
  var count = utenti.length;
  toast("Email inviata a " + count + " utenti (simulazione)", "success");
  logAction("email", "Email massiva inviata a " + count + " utenti: " + oggetto);
  document.getElementById("emailMassivaOggetto").value = "";
  document.getElementById("emailMassivaCorpo").value = "";
}

// ===== API =====
function generaApiKey() {
  apiKey = "sk-kazka_live_" + Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);
  document.getElementById("apiKeyDisplay").textContent = apiKey.slice(0,20) + "...";
  logAction("modifica", "Nuova API key generata");
  toast("Nuova API key generata", "success");
}

// ===== MAINTENANCE =====
function renderMaintenance() {
  document.getElementById("maintToggle").checked = maintenanceMode;
  document.getElementById("maintMessage").value = maintenanceMessage;
  document.getElementById("maintIPs").value = maintenanceIPs;
  document.getElementById("maintPreview").style.display = maintenanceMode ? "flex" : "none";
  document.getElementById("maintPreviewMessage").textContent = maintenanceMessage;
  document.getElementById("maintTopbarBadge").style.display = maintenanceMode ? "inline-block" : "none";
}

function toggleMaintenance() {
  maintenanceMode = document.getElementById("maintToggle").checked;
  document.getElementById("maintPreview").style.display = maintenanceMode ? "flex" : "none";
  document.getElementById("maintTopbarBadge").style.display = maintenanceMode ? "inline-block" : "none";
}

function saveMaintenanceConfig() {
  maintenanceMessage = document.getElementById("maintMessage").value;
  maintenanceIPs = document.getElementById("maintIPs").value;
  toast(t("maintenanceSaved"), "success");
  logAction("modifica", "Configurazione manutenzione aggiornata");
}

// ===== FIREBASE CONFIG VIEW =====
function renderFirebaseConfig() {
  document.getElementById("fbApiKey").value = firebaseConfig.apiKey;
  document.getElementById("fbAuthDomain").value = firebaseConfig.authDomain;
  document.getElementById("fbDatabaseURL").value = firebaseConfig.databaseURL;
  document.getElementById("fbProjectId").value = firebaseConfig.projectId;
  document.getElementById("fbStorageBucket").value = firebaseConfig.storageBucket;
  document.getElementById("fbSenderId").value = firebaseConfig.messagingSenderId;
  document.getElementById("fbAppId").value = firebaseConfig.appId;
}

// ===== DANGER ZONE =====
function dangerEliminaUtente() {
  var email = document.getElementById("dangerEliminaEmail").value.trim();
  if (!email) { toast("Inserisci un email", "error"); return; }
  var idx = utenti.findIndex(function(u){ return u.email === email; });
  if (idx === -1) { toast("Utente non trovato", "error"); return; }
  if (!confirm("Eliminare permanentemente l\'utente " + email + "?")) return;
  utenti.splice(idx, 1);
  document.getElementById("dangerEliminaEmail").value = "";
  logAction("elimina", "DANGER: Eliminato utente " + email);
  renderUtenti(); aggiornaStats();
  toast("Utente eliminato permanentemente", "success");
}

function dangerReverseTransazione() {
  var id = document.getElementById("dangerReverseId").value.trim();
  if (!id) { toast("Inserisci un ID transazione", "error"); return; }
  reverseTransazione(id);
  document.getElementById("dangerReverseId").value = "";
}

function dangerNukeAll() {
  var confirmText = document.getElementById("dangerNukeConfirm").value.trim();
  if (confirmText !== "NUKE") { toast("Scrivi NUKE per confermare", "error"); return; }
  if (!confirm("ULTIMO AVVISO: Stai per DISTRUGGERE TUTTI I DATI. Sei sicuro?")) return;
  utenti = []; abbonamenti = []; transazioni = []; gruppi = []; backupList = [];
  logActions = []; notifiche = []; couponList = []; webhookList = []; ticketList = []; filesList = [];
  logAction("nuke", "NUKE ALL eseguito - tutti i dati cancellati");
  renderAll(); aggiornaStats();
  document.getElementById("dangerNukeConfirm").value = "";
  toast("SISTEMA DISTRUTTO - tutti i dati sono stati eliminati", "error");
}
// ===== FILTER TABLE (generic) =====
function filterTable(type) {
  var map = {utenti:"renderUtenti", abbonamenti:"renderAbbonamenti", transazioni:"renderTransazioni", log:"renderLog", ticket:"renderTicket", files:"renderFiles"};
  var fn = map[type];
  if (fn && typeof window[fn] === "function") window[fn]();
}

function resetFilters(type) {
  var map = {
    utenti: function() { document.getElementById("utentiSearch").value = ""; document.getElementById("utentiFilterAbb").value = ""; document.getElementById("utentiFilterStatus").value = ""; renderUtenti(); },
    transazioni: function() { document.getElementById("transazioniSearch").value = ""; document.getElementById("transazioniFilterTipo").value = ""; document.getElementById("transazioniFilterStato").value = ""; document.getElementById("transazioniFilterMin").value = ""; document.getElementById("transazioniFilterMax").value = ""; document.getElementById("transazioniFilterDa").value = ""; document.getElementById("transazioniFilterA").value = ""; renderTransazioni(); },
    log: function() { document.getElementById("logFilterAzione").value = ""; document.getElementById("logFilterAdmin").value = ""; document.getElementById("logFilterDa").value = ""; document.getElementById("logFilterA").value = ""; renderLog(); },
    ticket: function() { document.getElementById("ticketFilterStato").value = ""; document.getElementById("ticketFilterPriorita").value = ""; renderTicket(); },
    abbonamenti: function() { document.getElementById("abbonamentiSearch").value = ""; document.getElementById("abbonamentiFilterStato").value = ""; renderAbbonamenti(); },
    files: function() { document.getElementById("fileSearch").value = ""; renderFiles(); }
  };
  if (map[type]) map[type]();
}

// ===== EXPORT CSV =====
function exportCSV(type) {
  var data = [];
  var headers = [];
  var rows = [];
  if (type === "utenti") {
    headers = [t("emailLabel"), t("nameLabel"), t("planLabel"), t("statusLabel"), t("regDate")];
    rows = utenti.map(function(u) { return [u.email, u.nome, u.abbonamento, u.status, u.dataReg]; });
  } else if (type === "transazioni") {
    headers = ["ID", t("userLabel"), t("amountLabel"), t("typeLabel"), t("dateLabel"), t("statusLabel")];
    rows = transazioni.map(function(t) { return [t.id, t.utente, t.importo, t.tipo, t.data, t.stato]; });
  } else if (type === "abbonamenti") {
    headers = [t("userLabel"), t("planLabel"), t("startDate"), t("endDate"), t("statusLabel")];
    rows = abbonamenti.map(function(a) { return [a.utente, a.piano, a.inizio, a.scadenza, a.stato]; });
  } else if (type === "statistiche") {
    headers = [t("detailsLabel"), t("valueLabel")];
    rows = [[t("totalUsers"), utenti.length], [t("activeSubs"), abbonamenti.filter(function(a){return a.stato==="attivo";}).length], [t("totalRevenue"), formatCurrency(transazioni.reduce(function(s,t){return s+(t.stato==="completato"?t.importo:0);},0))]];
  } else if (type === "revenue") {
    headers = [t("dateLabel"), t("amountLabel"), t("sourceLabel")];
    rows = transazioni.map(function(t) { return [t.data, t.importo, t.tipo]; });
  } else if (type === "log") {
    headers = [t("timestampLabel"), t("adminLabel"), t("actionLabel"), t("detailsLabel")];
    rows = logActions.map(function(l) { return [l.timestamp, l.admin, l.azione, l.dettagli]; });
  }
  if (headers.length === 0) { toast(t("noData"), "warning"); return; }
  var csv = "\uFEFF" + headers.join(",") + "\n";
  rows.forEach(function(r) { csv += r.map(function(v) { return '"' + String(v).replace(/"/g, "\"\"") + '"'; }).join(",") + "\n"; });
  var blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = type + "_export_" + new Date().toISOString().slice(0,10) + ".csv"; a.click();
  URL.revokeObjectURL(url);
  toast(t("csvExported"), "success");
}

// ===== EXPORT PDF =====
function exportPDF(type) {
  if (typeof window.jspdf === "undefined" && typeof jspdf === "undefined") {
    toast("jsPDF non caricato, attendere...", "warning");
    return;
  }
  var doc = new (window.jspdf || jspdf).jsPDF();
  var data = [];
  var headers = [];
  if (type === "utenti") {
    headers = [[t("emailLabel"), t("nameLabel"), t("planLabel"), t("statusLabel")]];
    data = utenti.map(function(u) { return [u.email, u.nome, u.abbonamento, u.status]; });
  } else if (type === "transazioni") {
    headers = [["ID", t("userLabel"), t("amountLabel"), t("typeLabel"), t("statusLabel")]];
    data = transazioni.map(function(t) { return [t.id, t.utente, formatCurrency(t.importo), t.tipo, t.stato]; });
  } else if (type === "abbonamenti") {
    headers = [[t("userLabel"), t("planLabel"), t("startDate"), t("endDate"), t("statusLabel")]];
    data = abbonamenti.map(function(a) { return [a.utente, a.piano, a.inizio, a.scadenza, a.stato]; });
  } else if (type === "statistiche") {
    headers = [[t("detailsLabel"), t("valueLabel")]];
    data = [[t("totalUsers"), utenti.length], [t("activeSubs"), abbonamenti.filter(function(a){return a.stato==="attivo";}).length], [t("totalRevenue"), formatCurrency(transazioni.reduce(function(s,t){return s+(t.stato==="completato"?t.importo:0);},0))]];
  } else if (type === "revenue") {
    headers = [[t("dateLabel"), t("amountLabel"), t("sourceLabel")]];
    data = transazioni.map(function(t) { return [t.data, formatCurrency(t.importo), t.tipo]; });
  } else if (type === "log") {
    headers = [[t("timestampLabel"), t("adminLabel"), t("actionLabel"), t("detailsLabel")]];
    data = logActions.map(function(l) { return [new Date(l.timestamp).toLocaleString("it-IT"), l.admin, l.azione, l.dettagli]; });
  }
  if (headers.length === 0) { toast(t("noData"), "warning"); return; }
  doc.setFontSize(16); doc.text("KAZKA - " + type.toUpperCase(), 14, 20);
  doc.setFontSize(10); doc.text("Esportato il: " + new Date().toLocaleString("it-IT"), 14, 28);
  if (typeof doc.autoTable === "function") {
    doc.autoTable({head: headers, body: data, startY: 34, theme: "grid", styles: {fontSize: 8}});
  } else {
    toast("Plugin PDF non caricato", "error");
  }
  doc.save(type + "_export_" + new Date().toISOString().slice(0,10) + ".pdf");
  toast(t("pdfExported"), "success");
}

// ===== STAT TAB =====
function switchStatTab(period, el) {
  document.querySelectorAll("#statTabs .tab").forEach(function(t){ t.classList.remove("active"); });
  if (el) el.classList.add("active");
  initChart();
}

// ===== CHART =====
var revenueChartInstance = null;
function initChart() {
  var canvas = document.getElementById("revenueChart");
  if (!canvas) return;
  if (revenueChartInstance) { revenueChartInstance.destroy(); }
  var ctx = canvas.getContext("2d");
  var labels = [];
  var data = [];
  var days = 30;
  var activeTab = document.querySelector("#statTabs .tab.active");
  if (activeTab) {
    var p = activeTab.dataset.period;
    if (p === "7gg") days = 7;
    else if (p === "30gg") days = 30;
    else if (p === "90gg") days = 90;
    else if (p === "12mesi") days = 365;
  }
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("it-IT", {day:"2-digit", month:"short"}));
    data.push(rand(500, 5000) + Math.random() * 500);
  }
  var gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
  gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");
  revenueChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels: labels, datasets: [{ label: "Revenue", data: data, borderColor: "#EF4444", backgroundColor: gradient, fill: true, tension: 0.4, pointBackgroundColor: "#EF4444", pointBorderColor: "#fff", pointRadius: 3, borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false, color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748B", font: { size: 10 } } }, y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748B", font: { size: 10 }, callback: function(value) { return "\u20AC" + value; } } } }, interaction: { intersect: false, mode: "index" } }
  });
}

// ===== LIVE UPDATES (WebSocket simulation via Firebase) =====
function initLiveUpdates() {
  document.getElementById("liveBadgeContainer").style.display = "inline-flex";
  if (firebaseInitialized && realtimeDb) {
    realtimeDb.ref("stats/online").on("value", function(snap) {
      var val = snap.val();
      if (val !== null) document.getElementById("onlineCount").textContent = val;
    });
    realtimeDb.ref("transazioni").limitToLast(1).on("child_added", function(snap) {
      var tx = snap.val();
      if (tx) { toast(t("dataRefreshed") + ": " + (tx.utente || ""), "info"); renderAll(); }
    });
  }
  // Fallback simulated live updates
  setInterval(function() {
    if (!isLoggedIn) return;
    document.getElementById("onlineCount").textContent = rand(12, 48);
    var now = new Date();
    if (now.getSeconds() % 30 === 0) {
      // Simulate random new transaction
      if (Math.random() > 0.7) {
        var u = utenti[rand(0, utenti.length - 1)];
        var txId = generateId();
        transazioni.unshift({id: txId, utente: u.email, importo: rand(5,200) + 0.99, tipo: "pagamento", data: now.toISOString().slice(0,10), stato: "completato", dettagli: "Live transaction"});
        if (document.getElementById("viewTransazioni").classList.contains("active")) renderTransazioni();
        aggiornaStats();
        toast("Nuova transazione live: " + formatCurrency(rand(5,200) + 0.99), "info");
      }
    }
  }, 15000);
}

// ===== ENTER KEY ON LOGIN =====
document.addEventListener("DOMContentLoaded", function() {
  applyLang();
  document.getElementById("loginPassword").addEventListener("keydown", function(e) {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("loginEmail").addEventListener("keydown", function(e) {
    if (e.key === "Enter") handleLogin();
  });
  document.getElementById("loginEmail").focus();
  setTimeout(function() {
    document.getElementById("loginEmail").value = "admin@kazka.it";
    document.getElementById("loginPassword").value = "Admin123!";
  }, 300);
});


// ===== SERVICE WORKER =====
if ("serviceWorker" in navigator) {
  var swCode = "self.addEventListener(\"install\",function(e){self.skipWaiting();});self.addEventListener(\"activate\",function(e){e.waitUntil(self.clients.claim());});self.addEventListener(\"push\",function(e){var data=e.data?e.data.json():{};self.registration.showNotification(data.title||\"KAZKA\",{body:data.body||\"\",icon:data.icon||\"\",tag:data.tag||\"kazka-notif\"});});";
  var swBlob = new Blob([swCode], {type: "application/javascript"});
  var swUrl = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swUrl, {scope: "/"}).then(function() { console.log("SW registered"); }).catch(function(err) { console.log("SW failed:", err); });
}
// ===== EXTRA: Coupon validation =====
function validateCoupon(code) {
  if (!code) return null;
  var c = couponList.find(function(c){ return c.codice.toUpperCase() === code.toUpperCase() && c.attivo; });
  if (!c) return null;
  var oggi = new Date().toISOString().slice(0,10);
  if (oggi < c.inizio || oggi > c.fine) return null;
  if (c.usiCorrenti >= c.maxUsi) return null;
  return c;
}
// ===== EXTRA: Webhook trigger =====
function triggerWebhooks(eventName, payload) {
  webhookList.filter(function(w){ return w.attivo && w.eventi && w.eventi.indexOf(eventName) >= 0; }).forEach(function(w) {
    webhookLogs.unshift({webhookId: w.id, webhookName: w.nome, timestamp: new Date().toISOString(), status: 200, response: "Delivered (" + eventName + ")"});
    if (webhookLogs.length > 50) webhookLogs.pop();
  });
}
// ===== EXTRA: Auto-refresh toggle =====
var autoRefreshInterval = null;
function toggleAutoRefresh(enabled) {
  if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
  if (enabled) { autoRefreshInterval = setInterval(function() { if (isLoggedIn) aggiornaStats(); }, 30000); toast("Auto-refresh ON", "success"); }
  else { toast("Auto-refresh OFF", "info"); }
}
// ===== NOTIFICATION: Request permission =====
if ("Notification" in window && Notification.permission === "default") {
  setTimeout(function() { Notification.requestPermission(); }, 5000);
}

