
// 04-FIREBASE.JS - Connessione Firebase

async function initializeFirebase() {
  try {
    console.log('🔄 Setup Firebase Auth listener...');
    
    // Firebase è già inizializzato in app.html
    if (!firebase) {
      console.error('❌ Firebase SDK non caricato!');
      return false;
    }
    
    if (!db) {
      db = firebase.database();
      console.log('✅ Database reference creato');
    }
    
    // Setup auth listener
    firebase.auth().onAuthStateChanged((authUser) => {
      if (authUser) {
        user = {
          id: authUser.uid,
          email: authUser.email,
          name: authUser.displayName || 'User'
        };
        console.log('✅ Firebase User logged in:', user.email);
        localStorage.setItem('fp_user_' + authUser.uid, JSON.stringify(user));
        onUserLoggedIn();
      } else {
        user = null;
        console.log('🔐 No Firebase user logged in');
      }
    });
    
    console.log('✅ Firebase completamente inizializzato');
    return true;
    
  } catch (err) {
    console.error('❌ Firebase init error:', err);
    return false;
  }
}

function onUserLoggedIn() {
  console.log('✅ User logged in handler called');
  loadFromFirebase();
}

console.log('✅ firebase.js loaded');
