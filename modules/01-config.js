
// CONFIG.JS - Configurazione Firebase e costanti

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ",
  databaseURL: "https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "financeapp-556ae"
};

const APP_CONFIG = {
  name: "Kazka",
  version: "1.0.0",
  tagline: "Smart Finance Assistant",
  colors: {
    primary: "#6c63ff",
    secondary: "#00d4ff",
    success: "#00e5a0",
    danger: "#ff4f6d",
    warning: "#ffd166",
    dark: "#070b18",
    text: "#fff"
  }
};

let db = null;
let user = null;

console.log('✅ config.js loaded');
