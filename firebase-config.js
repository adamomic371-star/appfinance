// Firebase Configuration - Carica PRIMA di app.html
const FB = {
  apiKey: "AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ",
  databaseURL: "https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "financeapp-556ae"
};

// Init Firebase quando caricato
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(FB);
    console.log('✅ Firebase inizializzato');
  } catch (e) {
    console.warn('Firebase already initialized');
  }
}
