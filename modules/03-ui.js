
// UI.JS - Interfaccia utente e splash screen

function createLogoSVG() {
  return `
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
        <path d="M 47 35 L 80 55 L 47 55 Z" fill="url(#kGrad)"/>
        <path d="M 47 65 L 85 95 L 73 95 L 47 70 Z" fill="url(#kGrad)"/>
      </g>
    </svg>
  `;
}

function hideSplashScreen() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 600);
  }
}

function initializeSplashScreen() {
  window.addEventListener('load', () => {
    setTimeout(hideSplashScreen, 2000);
  });
}

console.log('✅ ui.js loaded');
