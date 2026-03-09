
// 14-AUTH.JS - Autenticazione Firebase con diagnostica

async function loginWithEmail(email, password) {
  try {
    console.log('🔄 Login tentativo:', email);
    
    if (!firebase) {
      console.error('❌ Firebase non caricato');
      showNotification('❌ Firebase non disponibile', 'error');
      return null;
    }
    
    if (!firebase.auth) {
      console.error('❌ Firebase Auth non disponibile');
      showNotification('❌ Firebase Auth non disponibile', 'error');
      return null;
    }
    
    console.log('🔄 Chiamando Firebase signInWithEmailAndPassword...');
    
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    
    console.log('✅ Login successful');
    
    user = {
      id: result.user.uid,
      email: result.user.email,
      name: result.user.displayName || 'User'
    };
    
    console.log('✅ User object created:', user);
    
    localStorage.setItem('fp_user_' + user.id, JSON.stringify(user));
    showNotification('✅ Benvenuto ' + user.name, 'success');
    
    return user;
    
  } catch (err) {
    console.error('❌ Login error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    // Messaggi di errore specifici
    let msg = '❌ Errore login';
    if (err.code === 'auth/user-not-found') {
      msg = '❌ Utente non trovato';
    } else if (err.code === 'auth/wrong-password') {
      msg = '❌ Password errata';
    } else if (err.code === 'auth/invalid-email') {
      msg = '❌ Email non valida';
    } else if (err.code === 'auth/user-disabled') {
      msg = '❌ Utente disabilitato';
    } else {
      msg = '❌ ' + err.message;
    }
    
    showNotification(msg, 'error');
    return null;
  }
}

async function registerWithEmail(email, password, name) {
  try {
    console.log('🔄 Registrazione tentativo:', email);
    
    if (!firebase) {
      console.error('❌ Firebase non caricato');
      showNotification('❌ Firebase non disponibile', 'error');
      return null;
    }
    
    if (!firebase.auth) {
      console.error('❌ Firebase Auth non disponibile');
      showNotification('❌ Firebase Auth non disponibile', 'error');
      return null;
    }
    
    console.log('🔄 Chiamando Firebase createUserWithEmailAndPassword...');
    
    const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    console.log('✅ User created in Firebase');
    console.log('🔄 Updating user profile...');
    
    await result.user.updateProfile({
      displayName: name
    });
    
    console.log('✅ Profile updated');
    
    user = {
      id: result.user.uid,
      email: result.user.email,
      name: name
    };
    
    console.log('✅ Registration successful');
    console.log('✅ User object created:', user);
    
    localStorage.setItem('fp_user_' + user.id, JSON.stringify(user));
    showNotification('✅ Registrazione completata!', 'success');
    
    return user;
    
  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    // Messaggi di errore specifici
    let msg = '❌ Errore registrazione';
    if (err.code === 'auth/email-already-in-use') {
      msg = '❌ Email già registrata';
    } else if (err.code === 'auth/weak-password') {
      msg = '❌ Password troppo debole';
    } else if (err.code === 'auth/invalid-email') {
      msg = '❌ Email non valida';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = '❌ Registrazione non abilitata';
    } else {
      msg = '❌ ' + err.message;
    }
    
    showNotification(msg, 'error');
    return null;
  }
}

function logout() {
  try {
    console.log('🔄 Logout...');
    
    firebase.auth().signOut();
    user = null;
    
    // Pulisci localStorage
    localStorage.removeItem('fp_user');
    
    showLoginScreen();
    showNotification('✅ Logout completato', 'success');
    console.log('✅ Logout successful');
    
  } catch (err) {
    console.error('❌ Logout error:', err);
    showNotification('❌ Errore logout', 'error');
  }
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('app');
  
  if (loginScreen) {
    loginScreen.style.display = 'none';
    console.log('✅ Login screen hidden');
  }
  if (appScreen) {
    appScreen.style.display = 'block';
    console.log('✅ App screen shown');
  }
  
  loadFromFirebase();
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('app');
  
  if (loginScreen) {
    loginScreen.style.display = 'flex';
    console.log('✅ Login screen shown');
  }
  if (appScreen) {
    appScreen.style.display = 'none';
    console.log('✅ App screen hidden');
  }
}

console.log('✅ auth.js loaded');
