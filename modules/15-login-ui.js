
// 15-LOGIN-UI.JS - Interfaccia di login con validazione

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleBtn = document.getElementById('toggleForm');
  
  if (!loginForm || !registerForm) {
    console.warn('⚠️ Login forms not found');
    return;
  }
  
  // Toggle tra login e register
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isLoginVisible = loginForm.style.display !== 'none';
      loginForm.style.display = isLoginVisible ? 'none' : 'block';
      registerForm.style.display = isLoginVisible ? 'block' : 'none';
      toggleBtn.textContent = isLoginVisible ? 'Accedi' : 'Registrati';
    });
  }
  
  // Gestisci login
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail')?.value?.trim();
      const password = document.getElementById('loginPassword')?.value;
      
      // Validazione
      if (!email) {
        showNotification('❌ Inserisci email', 'error');
        return;
      }
      
      if (!isValidEmail(email)) {
        showNotification('❌ Email non valida (es: nome@email.com)', 'error');
        return;
      }
      
      if (!password) {
        showNotification('❌ Inserisci password', 'error');
        return;
      }
      
      if (password.length < 6) {
        showNotification('❌ Password deve avere almeno 6 caratteri', 'error');
        return;
      }
      
      loginBtn.disabled = true;
      loginBtn.textContent = '⏳ Accedendo...';
      
      const result = await loginWithEmail(email, password);
      
      if (!result) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Accedi';
      }
    });
  }
  
  // Gestisci registrazione
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const email = document.getElementById('registerEmail')?.value?.trim();
      const password = document.getElementById('registerPassword')?.value;
      const name = document.getElementById('registerName')?.value?.trim();
      
      // Validazione
      if (!name) {
        showNotification('❌ Inserisci nome', 'error');
        return;
      }
      
      if (!email) {
        showNotification('❌ Inserisci email', 'error');
        return;
      }
      
      if (!isValidEmail(email)) {
        showNotification('❌ Email non valida (es: nome@email.com)', 'error');
        return;
      }
      
      if (!password) {
        showNotification('❌ Inserisci password', 'error');
        return;
      }
      
      if (password.length < 6) {
        showNotification('❌ Password deve avere almeno 6 caratteri', 'error');
        return;
      }
      
      registerBtn.disabled = true;
      registerBtn.textContent = '⏳ Registrando...';
      
      const result = await registerWithEmail(email, password, name);
      
      if (!result) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrati';
      }
    });
  }
  
  // Enter key per login
  document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('loginBtn')?.click();
    }
  });
  
  // Enter key per register password
  document.getElementById('registerPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('registerBtn')?.click();
    }
  });
}

console.log('✅ login-ui.js loaded');
