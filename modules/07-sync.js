
// SYNC.JS - Sincronizzazione Firebase

function syncToFirebase() {
  if (!db || !user) {
    console.log('⏳ Firebase non pronto');
    return;
  }
  
  try {
    const data = {
      goals: loadGoals(),
      lastSync: new Date().toISOString()
    };
    
    db.ref('users/' + user.id).update(data);
    console.log('✅ Sync to Firebase completed');
    showNotification('✅ Dati sincronizzati', 'success');
  } catch (err) {
    console.error('❌ Sync error:', err);
    showNotification('❌ Errore sincronizzazione', 'error');
  }
}

function loadFromFirebase() {
  if (!db || !user) return;
  
  db.ref('users/' + user.id).once('value', snap => {
    const data = snap.val();
    if (data) {
      console.log('✅ Dati caricati da Firebase');
      if (data.goals) {
        localStorage.setItem('fp_goals_' + user.id, JSON.stringify(data.goals));
      }
    }
  });
}

console.log('✅ sync.js loaded');
