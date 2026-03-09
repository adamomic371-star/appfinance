
// 14-AUTH.JS - Autenticazione Firebase

async function loginWithEmail(email, password) {
  try {
    if (!firebase) {
      console.error('Firebase not loaded');
      return null;
    }
    
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    user = {
      id: result.user.uid,
      email: result.user.email,
      name: result.user.displayName || 'User'
    };
    
    console.log('✅ Login successful:', user.email);
    hideLoginScreen();
    return user;
  } catch (err) {
    console.error('❌ Login error:', err.message);
    showNotification('❌ ' + err.message, 'error');
    return null;
  }
}

async function registerWithEmail(email, password, name) {
  try {
    if (!firebase) {
      console.error('Firebase not loaded');
      return null;
    }
    
    const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    await result.user.updateProfile({
      displayName: name
    });
    
    user = {
      id: result.user.uid,
      email: result.user.email,
      name: name
    };
    
    console.log('✅ Registration successful:', user.email);
    hideLoginScreen();
    return user;
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    showNotification('❌ ' + err.message, 'error');
    return null;
  }
}

function logout() {
  try {
    firebase.auth().signOut();
    user = null;
    showLoginScreen();
    console.log('✅ Logout successful');
  } catch (err) {
    console.error('❌ Logout error:', err);
  }
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('app');
  
  if (loginScreen) loginScreen.style.display = 'none';
  if (appScreen) appScreen.style.display = 'block';
  
  // Carica dati dell'utente
  loadFromFirebase();
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('app');
  
  if (loginScreen) loginScreen.style.display = 'flex';
  if (appScreen) appScreen.style.display = 'none';
}

console.log('✅ auth.js loaded');
