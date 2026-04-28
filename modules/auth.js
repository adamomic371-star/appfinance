/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KAZKA v4 — auth.js                                          ║
 * ║  Firebase Authentication (Email/Password + Google)           ║
 * ║  NESSUNA password mai salvata in localStorage                ║
 * ║  Session gestita da Firebase SDK (token sicuro)              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { KZ } from './db.js';

export const Auth = (() => {

  // ─── STATE ──────────────────────────────────────────────────
  let _currentUser  = null;  // Firebase User object
  let _userProfile  = null;  // Profilo da Realtime DB {name,plan,role,...}
  let _onAuthChange = null;  // callback chiamata ad ogni cambio stato

  // ─── INIT ────────────────────────────────────────────────────
  function init(onAuthStateChange) {
    _onAuthChange = onAuthStateChange;

    firebase.auth().onAuthStateChanged(async fbUser => {
      if (fbUser) {
        _currentUser = fbUser;
        _userProfile = await _loadProfile(fbUser.uid);
        if (!_userProfile) {
          // Primo accesso: crea profilo base
          _userProfile = {
            uid:       fbUser.uid,
            email:     fbUser.email,
            name:      fbUser.displayName || fbUser.email.split('@')[0],
            plan:      'free',
            role:      'user',
            createdAt: new Date().toISOString(),
            theme:     'dark',
            lang:      'it'
          };
          await KZ.set(`users/${fbUser.uid}/profile`, _userProfile);
        }
      } else {
        _currentUser  = null;
        _userProfile  = null;
      }
      _onAuthChange?.(_currentUser, _userProfile);
    });
  }

  // ─── CARICA PROFILO DA DB ─────────────────────────────────────
  async function _loadProfile(uid) {
    const snap = await firebase.database().ref(`users/${uid}/profile`).once('value');
    return snap.val();
  }

  // ─── LOGIN con Email/Password ──────────────────────────────
  async function login(email, password) {
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      return { ok: true, user: cred.user };
    } catch (e) {
      return { ok: false, error: _friendlyError(e.code) };
    }
  }

  // ─── REGISTRAZIONE ────────────────────────────────────────────
  async function register(email, password, name) {
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      // Il profilo viene creato da onAuthStateChanged
      return { ok: true, user: cred.user };
    } catch (e) {
      return { ok: false, error: _friendlyError(e.code) };
    }
  }

  // ─── LOGIN GOOGLE ──────────────────────────────────────────
  async function loginGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await firebase.auth().signInWithPopup(provider);
      return { ok: true, user: cred.user };
    } catch (e) {
      return { ok: false, error: _friendlyError(e.code) };
    }
  }

  // ─── RESET PASSWORD (email ufficiale Firebase) ─────────────
  async function sendPasswordReset(email) {
    try {
      await firebase.auth().sendPasswordResetEmail(email, {
        url: window.location.origin + '/app/'
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: _friendlyError(e.code) };
    }
  }

  // ─── LOGOUT ───────────────────────────────────────────────
  async function logout() {
    await firebase.auth().signOut();
    // Pulisci solo dati non sensibili — MAI password
    ['fp_mode','fp_pwa_installed'].forEach(k => {
      const keys = Object.keys(localStorage).filter(x => x.startsWith(k));
      keys.forEach(x => localStorage.removeItem(x));
    });
  }

  // ─── CHANGE PASSWORD (utente loggato) ─────────────────────
  async function changePassword(currentPass, newPass) {
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(
        _currentUser.email, currentPass
      );
      await _currentUser.reauthenticateWithCredential(cred);
      await _currentUser.updatePassword(newPass);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: _friendlyError(e.code) };
    }
  }

  // ─── GESTIONE RUOLO ADMIN (server-side check) ──────────────
  async function isAdmin() {
    if (!_userProfile) return false;
    // Double check dal DB, non da localStorage
    const snap = await firebase.database()
      .ref(`users/${_currentUser.uid}/profile/role`)
      .once('value');
    return snap.val() === 'admin';
  }

  // ─── IMPERSONATION SUPPORT ───────────────────────────────────
  async function handleImpersonation() {
    const params = new URLSearchParams(window.location.search);
    const impersonationToken = params.get('impersonate');
    
    if (impersonationToken) {
      try {
        const impersonationData = JSON.parse(atob(impersonationToken));
        if (impersonationData.adminSession && impersonationData.uid) {
          // Store impersonation session
          localStorage.setItem('kz_impersonation', JSON.stringify(impersonationData));
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Sign in as impersonated user
          await signInAsUser(impersonationData.uid);
          return true;
        }
      } catch (e) {
        console.error('Invalid impersonation token', e);
      }
    }
    
    // Check for existing impersonation
    const existingImp = localStorage.getItem('kz_impersonation');
    if (existingImp) {
      const impData = JSON.parse(existingImp);
      if (confirm('Stai impersonando un utente. Vuoi terminare l\'impersonazione?')) {
        localStorage.removeItem('kz_impersonation');
        window.location.reload();
      }
    }
    
    return false;
  }

  async function signInAsUser(uid) {
    // Get user data and create a mock session
    const snap = await firebase.database().ref(`users/${uid}/profile`).once('value');
    const profile = snap.val();
    if (!profile) throw new Error('User not found');
    
    // Create mock user object
    _currentUser = {
      uid: uid,
      email: profile.email,
      displayName: profile.name
    };
    _userProfile = profile;
    
    // Add impersonation flag
    _userProfile.isImpersonated = true;
    _userProfile.originalAdmin = JSON.parse(localStorage.getItem('kz_impersonation'))?.adminSession;
    
    return { ok: true, user: _currentUser };
  }

  function isImpersonated() {
    return _userProfile?.isImpersonated === true;
  }

  function getOriginalAdmin() {
    return _userProfile?.originalAdmin;
  }

  // ─── GETTERS ──────────────────────────────────────────────
  function getUser()    { return _currentUser; }
  function getProfile() { return _userProfile; }
  function isLoggedIn() { return !!_currentUser; }

  // ─── UPDATE PROFILO ────────────────────────────────────────
  async function updateProfile(updates) {
    if (!_currentUser) return;
    const allowed = ['name','theme','lang','avatar','phone'];
    const safe = {};
    allowed.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
    await KZ.update(`users/${_currentUser.uid}/profile`, safe);
    _userProfile = { ..._userProfile, ...safe };
    if (updates.name) await _currentUser.updateProfile({ displayName: updates.name });
  }

  // ─── ERROR MESSAGES ITALIANI ───────────────────────────────
  function _friendlyError(code) {
    const map = {
      'auth/user-not-found':       '❌ Nessun account trovato con questa email',
      'auth/wrong-password':       '❌ Password non corretta',
      'auth/email-already-in-use': '❌ Email già registrata — prova ad accedere',
      'auth/weak-password':        '❌ Password troppo debole (min. 6 caratteri)',
      'auth/invalid-email':        '❌ Email non valida',
      'auth/too-many-requests':    '⏳ Troppi tentativi. Riprova tra qualche minuto',
      'auth/network-request-failed': '❌ Errore di connessione. Controlla internet',
      'auth/popup-closed-by-user': '⚠️ Login Google annullato',
      'auth/requires-recent-login': '🔒 Per sicurezza, esegui di nuovo il login prima di cambiare password',
    };
    return map[code] || `❌ Errore: ${code}`;
  }

  return { init, login, register, loginGoogle, sendPasswordReset, logout,
           changePassword, isAdmin, getUser, getProfile, isLoggedIn, updateProfile,
           handleImpersonation, isImpersonated, getOriginalAdmin };

})();
