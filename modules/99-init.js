
// 99-INIT.JS - Inizializzazione app

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - Inizializzazione app');
  
  // 1. Popola logo splash
  const splashLogo = document.getElementById('splashLogo');
  if (splashLogo && !splashLogo.innerHTML) {
    splashLogo.innerHTML = `
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6c63ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00d4ff;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="55" fill="none" stroke="url(#kGrad)" stroke-width="2" opacity="0.2"/>
        <g fill="url(#kGrad)">
          <rect x="35" y="25" width="12" height="70" rx="6"/>
          <path d="M 47 35 L 80 55 L 47 55 Z"/>
          <path d="M 47 65 L 85 95 L 73 95 L 47 70 Z"/>
        </g>
      </svg>
    `;
  }
  
  // 2. Nascondi splash dopo 2 secondi
  setTimeout(hideSplashScreen, 2000);
  
  // 3. Setup login form
  setTimeout(setupLoginForm, 100);
  
  // 4. Inizializza Firebase
  setTimeout(initializeFirebase, 500);
  
  console.log('✅ App initialized');
});

// Global error handler
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (msg.includes('Could not establish connection') || 
      msg.includes('template') || msg.includes('${')||
      msg.includes('appendChild')) {
    console.warn('ℹ️ Non-critical:', msg.substring(0, 50));
    return true;
  }
});

console.log('✅ init.js loaded');
