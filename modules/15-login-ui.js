// 15-LOGIN-UI.JS - Login e registrazione UI

let isLoginMode = true;

function initLoginUI() {
  // Toggle form mode button
  const toggleBtn = document.getElementById('toggleForm');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isLoginMode = !isLoginMode;
      updateLoginFormUI();
    });
  }

  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  // Register button
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }

  // Enter key handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (isLoginMode) handleLogin();
        else handleRegister();
      }
    }
  });

  updateLoginFormUI();
}

function updateLoginFormUI() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleBtn = document.getElementById('toggleForm');
  const toggleText = document.querySelector('.form-toggle');

  if (loginForm && registerForm) {
    if (isLoginMode) {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      if (toggleBtn) toggleBtn.textContent = 'Registrati';
      if (toggleText) toggleText.firstChild.textContent = 'Non hai un account? ';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = 'Accedi';
      if (toggleText) toggleText.firstChild.textContent = 'Hai già un account? ';
    }
  }
}

async function handleLogin() {
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) { showNotification('⚠️ Inserisci la tua email', 'error'); emailInput.focus(); return; }
  if (!password) { showNotification('⚠️ Inserisci la password', 'error'); passwordInput.focus(); return; }
  if (!isValidEmail(email)) { showNotification('⚠️ Email non valida', 'error'); return; }

  if (loginBtn) {
    loginBtn.textContent = 'Accesso in corso...';
    loginBtn.disabled = true;
  }

  try {
    const result = await loginWithEmail(email, password);
    if (result) {
      user = result;
      hideLoginScreen();
    }
  } finally {
    if (loginBtn) {
      loginBtn.textContent = 'Accedi';
      loginBtn.disabled = false;
    }
  }
}

async function handleRegister() {
  const nameInput = document.getElementById('registerName');
  const emailInput = document.getElementById('registerEmail');
  const passwordInput = document.getElementById('registerPassword');
  const registerBtn = document.getElementById('registerBtn');

  if (!nameInput || !emailInput || !passwordInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!name) { showNotification('⚠️ Inserisci il tuo nome', 'error'); nameInput.focus(); return; }
  if (!email) { showNotification('⚠️ Inserisci la tua email', 'error'); emailInput.focus(); return; }
  if (!isValidEmail(email)) { showNotification('⚠️ Email non valida', 'error'); return; }
  if (!password || password.length < 6) { showNotification('⚠️ Password troppo corta (min 6 caratteri)', 'error'); passwordInput.focus(); return; }

  if (registerBtn) {
    registerBtn.textContent = 'Registrazione in corso...';
    registerBtn.disabled = true;
  }

  try {
    const result = await registerWithEmail(email, password, name);
    if (result) {
      user = result;
      hideLoginScreen();
    }
  } finally {
    if (registerBtn) {
      registerBtn.textContent = 'Registrati';
      registerBtn.disabled = false;
    }
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

console.log('✅ login-ui.js loaded');
