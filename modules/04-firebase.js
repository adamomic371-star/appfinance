
// FIREBASE.JS - Connessione a Firebase

async function initializeFirebase() {
  try {
    // Carica Firebase SDK
    if (typeof firebase === 'undefined') {
      console.log('⏳ Caricando Firebase...');
      return;
    }
    
    // Inizializza Firebase
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    
    // Setup auth
    firebase.auth().onAuthStateChanged((authUser) => {
      if (authUser) {
        user = {
          id: authUser.uid,
          email: authUser.email,
          name: authUser.displayName || 'User'
        };
        console.log('✅ User logged in:', user.id);
        onUserLoggedIn();
      } else {
        console.log('🔐 User not logged in');
      }
    });
    
  } catch (err) {
    console.error('❌ Firebase init error:', err);
  }
}

function onUserLoggedIn() {
  console.log('✅ User session ready');
  // Carica dati utente
}

console.log('✅ firebase.js loaded');
