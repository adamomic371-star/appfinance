// 04-FIREBASE.JS - Firebase Auth listener e setup

function setupFirebaseAuthListener() {
  console.log('🔄 Setup Firebase Auth listener...');

  if (!firebase || !firebase.auth) {
    console.warn('⚠️ Firebase Auth non disponibile');
    return;
  }

  firebase.auth().onAuthStateChanged(function(firebaseUser) {
    if (firebaseUser) {
      console.log('✅ Firebase user logged in:', firebaseUser.email);

      if (!user || user.localAuth) {
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          isAdmin: false
        };
        localStorage.setItem('fp_user', JSON.stringify(user));
      }

      loadFromFirebaseOnStart();
    } else {
      console.log('🔐 No Firebase user logged in');

      // Check for saved local session
      const savedUser = localStorage.getItem('fp_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id) {
            user = parsed;
            console.log('✅ Local session restored:', user.email);
            hideLoginScreen();
            return;
          }
        } catch (e) {}
      }

      if (!user) {
        showLoginScreen();
      }
    }
  });

  console.log('✅ Firebase completamente inizializzato');
}

function loadFromFirebase() {
  if (!user || !db) return;

  const uid = user.id;
  if (user.localAuth) {
    console.log('ℹ️ Admin locale - skip Firebase load');
    return;
  }

  updateSyncIndicator('syncing');

  // Load transactions
  db.ref('users/' + uid + '/transactions').once('value').then(snap => {
    const data = snap.val();
    if (data) {
      transactions = Object.values(data);
      console.log('✅ Transactions loaded from Firebase:', transactions.length);
    }
  }).catch(err => {
    console.warn('⚠️ Load transactions error:', err.message);
  });

  // Load goals
  db.ref('users/' + uid + '/goals').once('value').then(snap => {
    const data = snap.val();
    if (data) {
      goals = Object.values(data);
      console.log('✅ Goals loaded from Firebase:', goals.length);
    }
  }).catch(err => {
    console.warn('⚠️ Load goals error:', err.message);
  });

  // Load recurring
  db.ref('users/' + uid + '/recurring').once('value').then(snap => {
    const data = snap.val();
    if (data) {
      recurringItems = Object.values(data);
    }
  }).catch(err => {
    console.warn('⚠️ Load recurring error:', err.message);
  });

  // Load groups
  db.ref('users/' + uid + '/groups').once('value').then(snap => {
    const data = snap.val();
    if (data) {
      groups = Object.values(data);
    }
  }).catch(err => {
    console.warn('⚠️ Load groups error:', err.message);
  });

  setTimeout(() => {
    updateSyncIndicator('ready');
    if (typeof renderView === 'function') renderView(currentView);
  }, 1200);
}

function loadFromFirebaseOnStart() {
  loadFromFirebase();
  if (typeof hideLoginScreen === 'function') hideLoginScreen();
}

function saveToFirebase(path, data) {
  if (!user || !db || user.localAuth) return Promise.resolve();

  const uid = user.id;
  updateSyncIndicator('syncing');

  return db.ref('users/' + uid + '/' + path).set(data)
    .then(() => {
      console.log('✅ Saved to Firebase:', path);
      updateSyncIndicator('ready');
    })
    .catch(err => {
      console.error('❌ Firebase save error:', err);
      updateSyncIndicator('error');
      setTimeout(() => updateSyncIndicator('ready'), 3000);
    });
}

function syncAllToFirebase() {
  if (!user || user.localAuth || !db) return;

  const uid = user.id;
  updateSyncIndicator('syncing');

  const updates = {};

  if (transactions.length) {
    const txObj = {};
    transactions.forEach(tx => { txObj[tx.id] = tx; });
    updates['users/' + uid + '/transactions'] = txObj;
  }

  if (goals.length) {
    const goalsObj = {};
    goals.forEach(g => { goalsObj[g.id] = g; });
    updates['users/' + uid + '/goals'] = goalsObj;
  }

  if (recurringItems.length) {
    const recObj = {};
    recurringItems.forEach(r => { recObj[r.id] = r; });
    updates['users/' + uid + '/recurring'] = recObj;
  }

  if (Object.keys(updates).length > 0) {
    db.ref().update(updates)
      .then(() => {
        console.log('✅ Full sync complete');
        updateSyncIndicator('ready');
      })
      .catch(err => {
        console.error('❌ Sync error:', err);
        updateSyncIndicator('error');
        setTimeout(() => updateSyncIndicator('ready'), 3000);
      });
  } else {
    updateSyncIndicator('ready');
  }
}

console.log('✅ firebase.js loaded');
