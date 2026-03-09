
// 15-LOGIN-UI.JS - Interfaccia di login

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
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      
      if (!email || !password) {
        showNotification('Inserisci email e password', 'warning');
        return;
      }
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Accedendo...';
      
      const result = await loginWithEmail(email, password);
      
      loginBtn.disabled = false;
      loginBtn.textContent = 'Accedi';
      
      if (result) {
        hideLoginScreen();
      }
    });
  }
  
  // Gestisci registrazione
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const email = document.getElementById('registerEmail')?.value;
      const password = document.getElementById('registerPassword')?.value;
      const name = document.getElementById('registerName')?.value;
      
      if (!email || !password || !name) {
        showNotification('Compila tutti i campi', 'warning');
        return;
      }
      
      if (password.length < 6) {
        showNotification('Password deve avere almeno 6 caratteri', 'warning');
        return;
      }
      
      registerBtn.disabled = true;
      registerBtn.textContent = 'Registrando...';
      
      const result = await registerWithEmail(email, password, name);
      
      registerBtn.disabled = false;
      registerBtn.textContent = 'Registrati';
      
      if (result) {
        hideLoginScreen();
      }
    });
  }
}

console.log('✅ login-ui.js loaded');
