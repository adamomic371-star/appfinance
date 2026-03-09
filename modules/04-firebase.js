
// 04-FIREBASE.JS - Connessione Firebase con diagnostica

async function initializeFirebase() {
  try {
    console.log('🔄 Inizializzando Firebase...');
    
    // Controlla se Firebase è caricato
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK non caricato!');
      showNotification('❌ Firebase non disponibile', 'error');
      return false;
    }
    
    console.log('✅ Firebase SDK trovato');
    
    // Controlla se è già inizializzato
    if (firebase.apps.length > 0) {
      console.log('✅ Firebase già inizializzato');
      db = firebase.database();
    } else {
      console.log('🔄 Inizializzando Firebase con config...');
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      console.log('✅ Firebase inizializzato');
    }
    
    // Test di connessione
    try {
      const testRef = db.ref('.info/connected');
      testRef.on('value', (snap) => {
        if (snap.val() === true) {
          console.log('✅ Firebase Database connesso');
        } else {
          console.warn('⚠️ Firebase Database disconnesso');
        }
      });
    } catch (err) {
      console.warn('⚠️ Errore test connessione Firebase:', err);
    }
    
    // Setup auth listener
    console.log('🔄 Setup Auth listener...');
    
    firebase.auth().onAuthStateChanged((authUser) => {
      if (authUser) {
        user = {
          id: authUser.uid,
          email: authUser.email,
          name: authUser.displayName || 'User'
        };
        console.log('✅ User logged in:', user.email);
        
        // Salva l'utente nel localStorage
        localStorage.setItem('fp_user_' + authUser.uid, JSON.stringify(user));
        
        onUserLoggedIn();
      } else {
        user = null;
        console.log('🔐 No user logged in');
      }
    });
    
    console.log('✅ Firebase completamente inizializzato');
    return true;
    
  } catch (err) {
    console.error('❌ Firebase init error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    showNotification('❌ Errore Firebase: ' + err.message, 'error');
    return false;
  }
}

function onUserLoggedIn() {
  console.log('✅ User logged in handler called');
  loadFromFirebase();
  hideLoginScreen();
}

console.log('✅ firebase.js loaded');
