// 03-UI.JS - Logo SVG, splash, navigazione

function createLogoSVG(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6c63ff"/>
        <stop offset="100%" style="stop-color:#00d4ff"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="100" height="100" rx="26" fill="url(#logoGrad)"/>
    <g fill="#fff">
      <rect x="42" y="32" width="10" height="56" rx="5"/>
      <path d="M52 38 L82 55 L52 55 Z"/>
      <path d="M52 64 L82 80 L68 80 L52 72 Z"/>
    </g>
  </svg>`;
}

function initSplash() {
  const logoEl = document.getElementById('splashLogo');
  if (logoEl) {
    logoEl.innerHTML = createLogoSVG(60);
  }
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => { splash.style.display = 'none'; }, 700);
  }
}

function renderNav() {
  const isPersonal = currentMode === 'personal';
  const navItems = isPersonal ? [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'transazioni', icon: '💸', label: 'Transazioni' },
    { id: 'report', icon: '📊', label: 'Report' },
    { id: 'ricorrenti', icon: '🔄', label: 'Ricorrenti' },
    { id: 'bollette', icon: '⚡', label: 'Bollette' },
    { id: 'viaggi', icon: '✈️', label: 'Viaggi' },
    { id: 'obiettivi', icon: '🎯', label: 'Obiettivi' },
    { id: 'gruppi', icon: '👥', label: 'Gruppi' },
    { id: 'notifiche', icon: '🔔', label: 'Notifiche' },
    { id: 'piani', icon: '💎', label: 'Piani' },
    { id: 'profilo', icon: '👤', label: 'Profilo' }
  ] : [
    { id: 'biz_dashboard', icon: '🏢', label: 'Dashboard' },
    { id: 'biz_primanota', icon: '📒', label: 'Prima Nota' },
    { id: 'biz_clienti', icon: '🤝', label: 'Clienti' },
    { id: 'biz_preventivi', icon: '📄', label: 'Preventivi' },
    { id: 'biz_progetti', icon: '📁', label: 'Progetti' },
    { id: 'biz_spese', icon: '🧾', label: 'Spese' },
    { id: 'biz_scadenzario', icon: '📅', label: 'Scadenzario' },
    { id: 'biz_iva', icon: '🏛️', label: 'IVA' },
    { id: 'notifiche', icon: '🔔', label: 'Notifiche' },
    { id: 'piani', icon: '💎', label: 'Piani' },
    { id: 'profilo', icon: '👤', label: 'Profilo' }
  ];

  // Add admin if admin user
  if (user && user.isAdmin) {
    navItems.push({ id: 'admin', icon: '⚙️', label: 'Admin' });
  }

  let navHTML = '<div class="nav-bottom" id="navBottom">';
  navItems.forEach(item => {
    const active = currentView === item.id ? 'active' : '';
    navHTML += `<div class="nav-item ${active}" onclick="navigate('${item.id}')">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </div>`;
  });
  navHTML += '</div>';

  // Remove existing nav if any
  const existingNav = document.getElementById('navBottom');
  if (existingNav) existingNav.remove();

  // Insert after topbar
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    topbar.insertAdjacentHTML('afterend', '');
  }
  document.getElementById('app').insertAdjacentHTML('beforeend', navHTML);
}

function renderTopbar() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const userName = user ? user.name || user.email || 'User' : 'User';
  const initial = userName.charAt(0).toUpperCase();

  topbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#6c63ff,#00d4ff);font-size:14px;font-weight:700;color:#fff;">${initial}</div>
      <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;background:linear-gradient(135deg,#6c63ff,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Kazka</span>
    </div>
    <div class="topbar-spacer"></div>
    <div class="sync-indicator" id="syncIndicator">✓ Pronto</div>
    <div style="cursor:pointer;font-size:20px;" onclick="navigate('notifiche')" title="Notifiche">🔔</div>
  `;
}

function updateSyncIndicator(status) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  if (status === 'syncing') {
    el.className = 'sync-indicator syncing';
    el.textContent = '⟳ Sync...';
  } else if (status === 'error') {
    el.className = 'sync-indicator error';
    el.textContent = '✗ Errore';
  } else {
    el.className = 'sync-indicator';
    el.textContent = '✓ Pronto';
  }
}

function renderModeSwitcher() {
  const existing = document.getElementById('modeSwitcher');
  if (existing) existing.remove();

  const html = `<div class="mode-switcher" id="modeSwitcher">
    <button class="mode-btn ${currentMode === 'personal' ? 'active' : ''}" onclick="switchMode('personal')">👤 Personale</button>
    <button class="mode-btn ${currentMode === 'business' ? 'active' : ''}" onclick="switchMode('business')">🏢 Business</button>
  </div>`;

  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.insertAdjacentHTML('afterend', html);
}

function switchMode(mode) {
  currentMode = mode;
  renderModeSwitcher();
  renderNav();
  const defaultView = mode === 'personal' ? 'dashboard' : 'biz_dashboard';
  navigate(defaultView);
}

function navigate(view) {
  currentView = view;
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick') === `navigate('${view}')`);
  });
  renderView(view);
}

console.log('✅ ui.js loaded');
